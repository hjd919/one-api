package wxpay

import (
	"context"
	"errors"
	"fmt"
	"github.com/patrickmn/go-cache"
	"github.com/wechatpay-apiv3/wechatpay-go/services/certificates"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments/native"
	"gorm.io/gorm"
	"log"
	"one-api/common"
	"one-api/model"
	"time"

	"github.com/skip2/go-qrcode"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/core/option"
	"github.com/wechatpay-apiv3/wechatpay-go/utils"
)

var (
	mchID                      = "1643228653"                               // 商户号
	mchCertificateSerialNumber = "18B1DEACC6C472155974CCA9C3309F26ECB58076" // 商户证书序列号
	mchAPIv3Key                = "d9b61c63e570d90ee65ca32fada41fa0"         // 商户APIv3密钥
	appID                      = "wx8d517e8555630e2f"
	notifyUrl                  = "https://ai.note123.net/api/v1/wxpay/callback"
)
var client *core.Client
var cacheQrcode = cache.New(10*time.Second, 10*time.Minute)

func init() {
	cli, err := NewWXPayClient(context.Background())
	if err != nil {
		panic(err)
	}
	client = cli
}

//查询支付
func QueryPayOrder(ctx context.Context, id int) (string, *model.PayOrder, error) {
	payOrder := &model.PayOrder{}
	if err := payOrder.GetLastOrderByUid(id); err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil, errors.New("不存在订单，请先前往支付")
		} else {
			return "", nil, errors.New("系统错误" + err.Error())
		}
	}
	if payOrder.Status == 2 {
		return "支付成功", payOrder, nil
	}

	paymentsResp, err := QueryWX(ctx, payOrder)
	if err != nil {
		return "", payOrder, err
	}

	switch *paymentsResp.TradeState {
	case "SUCCESS":
		err := PaySuccessOnlyOnce(payOrder)
		if err != nil {
			log.Printf("pay handle err=%v", err)
			return "", payOrder, err
		}
	}

	if paymentsResp.TradeStateDesc != nil {
		return *paymentsResp.TradeStateDesc, payOrder, nil
	}

	return "", payOrder, fmt.Errorf("miss TradeStateDesc %+v", paymentsResp)
}

func QueryCert(ctx context.Context) {
	svc := certificates.CertificatesApiService{Client: client}
	resp, result, err := svc.DownloadCertificates(ctx)

	if err != nil {
		// 处理错误
		log.Printf("call DownloadCertificates err:%s", err)
	} else {
		// 处理返回结果
		log.Printf("status=%d resp=%s", result.Response.StatusCode, resp)
	}
}

func QueryWX(ctx context.Context, payOrder *model.PayOrder) (*payments.Transaction, error) {
	svc := native.NativeApiService{Client: client}
	resp, _, err := svc.QueryOrderByOutTradeNo(ctx,
		native.QueryOrderByOutTradeNoRequest{
			OutTradeNo: core.String(payOrder.OutTradeNo),
			Mchid:      core.String(mchID),
		},
	)

	if err != nil {
		// 处理错误
		log.Printf("call QueryOrderByOutTradeNo err:%s", err)
		return resp, err
	}

	if resp.TradeState == nil {
		return resp, fmt.Errorf("unknown resp=%+v", resp)
	}

	return resp, nil
}

func PaySuccessOnlyOnce(payOrder *model.PayOrder) error {
	//清理二维码缓存
	cacheKey := cacheQrcodeKey(payOrder.Money, payOrder.UserId, payOrder.Quota)
	common.SysLog("clean qrcode key=" + cacheKey)
	cacheQrcode.Delete(cacheKey)

	if payOrder.Status != 1 { //只处理待支付
		return nil
	}

	err := model.DB.Transaction(func(tx *gorm.DB) error {
		porder := &model.PayOrder{}
		err := tx.Set("gorm:query_option", "FOR UPDATE").Where("`out_trade_no` = ?", payOrder.OutTradeNo).First(porder).Error
		if err != nil {
			return errors.New("无效的查询")
		}
		if porder.Status != 1 { //待支付
			return nil
		}
		err = tx.Model(&model.User{}).Where("id = ?", porder.UserId).Update("quota", gorm.Expr("quota + ?", porder.Quota)).Error
		if err != nil {
			return fmt.Errorf("PaySuccess IncreaseUserQuota err:%v", err)
		}

		porder.PayTime = time.Now().UnixMilli()
		porder.Status = 2 //设置已支付
		err = tx.Save(porder).Error
		return err
	})
	if err != nil {
		return errors.New("支付失败，" + err.Error())
	}

	model.RecordLog(payOrder.UserId, model.LogTypeTopupWX, fmt.Sprintf("通过微信支付充值 %s", common.LogQuota(payOrder.Quota)))

	return nil
}

func cacheQrcodeKey(moneyFen int64, userId, quota int) string {
	key := fmt.Sprintf("u_%d-m_%d-q_%d", userId, moneyFen, quota)
	return key
}

//发起支付
func PayQrcodeCache(ctx context.Context, moneyFen int64, userId, quota int) ([]byte, error) {
	key := cacheQrcodeKey(moneyFen, userId, quota)

	if x, found := cacheQrcode.Get(key); found {
		return x.([]byte), nil
	}
	log.Printf("new qrcode moneyFen=%d, userId=%d, quota=%d cacheKey=%s", moneyFen, userId, quota, key)

	data, err := PayQrcode(ctx, moneyFen, userId, quota)
	if err != nil {
		return nil, err
	}

	cacheQrcode.Set(key, data, cache.DefaultExpiration)

	return data, nil
}

func PayQrcode(ctx context.Context, moneyFen int64, userId, quota int) ([]byte, error) {
	outTradeNo, err := CreateOrder(moneyFen, userId, quota)
	if err != nil {
		return nil, err
	}

	url, err := Prepay(ctx, client, moneyFen, outTradeNo)
	if err != nil {
		return nil, err
	}

	bytes, err := Qrcode(url)
	if err != nil {
		return nil, err
	}

	return bytes, err
}

func CreateOrder(moneyFen int64, userId int, quota int) (string, error) {
	outTradeNo := fmt.Sprintf("%d", time.Now().UnixMilli())

	order := &model.PayOrder{
		UserId:      userId,
		Money:       moneyFen,
		Quota:       quota,
		Status:      1,
		OutTradeNo:  outTradeNo,
		CreatedTime: time.Now().UnixMilli(),
		PayTime:     0,
	}
	err := order.Insert()
	return outTradeNo, err
}

func NewWXPayClient(ctx context.Context) (*core.Client, error) {
	// 使用 utils 提供的函数从本地文件中加载商户私钥，商户私钥会用来生成请求的签名
	mchPrivateKey, err := utils.LoadPrivateKeyWithPath("./wxcert/apiclient_key.pem")
	if err != nil {
		log.Fatal("load merchant private key error")
	}

	// 使用商户私钥等初始化 client，并使它具有自动定时获取微信支付平台证书的能力
	opts := []core.ClientOption{
		option.WithWechatPayAutoAuthCipher(mchID, mchCertificateSerialNumber, mchPrivateKey, mchAPIv3Key),
	}
	client, err := core.NewClient(ctx, opts...)
	if err != nil {
		log.Fatalf("new wechat pay client err:%s", err)
	}
	return client, err
}

func Prepay(ctx context.Context, client *core.Client, moneyFen int64, outTradeNo string) (string, error) {
	svc := native.NativeApiService{Client: client}
	resp, result, err := svc.Prepay(ctx,
		native.PrepayRequest{
			Appid:       core.String(appID),
			Mchid:       core.String(mchID),
			Description: core.String(outTradeNo + "-desc"),
			OutTradeNo:  core.String(outTradeNo),
			NotifyUrl:   core.String(notifyUrl),
			Amount: &native.Amount{
				Currency: core.String("CNY"),
				Total:    core.Int64(moneyFen),
			},
		},
	)

	if err != nil {
		// 处理错误
		return "", fmt.Errorf("call Prepay err:%s", err)
	} else {
		// 处理返回结果
		log.Printf("status=%d resp=%s", result.Response.StatusCode, resp)
		return *resp.CodeUrl, nil
	}
}

func Qrcode(url string) ([]byte, error) {
	return qrcode.Encode(url, qrcode.Medium, 256)
}
