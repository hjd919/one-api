package wxpay

import (
	"context"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"github.com/wechatpay-apiv3/wechatpay-go/core"
	"github.com/wechatpay-apiv3/wechatpay-go/core/auth/verifiers"
	"github.com/wechatpay-apiv3/wechatpay-go/core/notify"
	"github.com/wechatpay-apiv3/wechatpay-go/services/payments"
	"github.com/wechatpay-apiv3/wechatpay-go/utils"
	"gorm.io/gorm"
	"log"
	"net/http"
	"one-api/model"
)

var publicKey = `-----BEGIN CERTIFICATE-----
MIIEFDCCAvygAwIBAgIUcxGqm/CgnBgetsdkKk8P7sJ90PswDQYJKoZIhvcNAQEL
BQAwXjELMAkGA1UEBhMCQ04xEzARBgNVBAoTClRlbnBheS5jb20xHTAbBgNVBAsT
FFRlbnBheS5jb20gQ0EgQ2VudGVyMRswGQYDVQQDExJUZW5wYXkuY29tIFJvb3Qg
Q0EwHhcNMjMwOTIyMTQ0MDI4WhcNMjgwOTIwMTQ0MDI4WjBuMRgwFgYDVQQDDA9U
ZW5wYXkuY29tIHNpZ24xEzARBgNVBAoMClRlbnBheS5jb20xHTAbBgNVBAsMFFRl
bnBheS5jb20gQ0EgQ2VudGVyMQswCQYDVQQGDAJDTjERMA8GA1UEBwwIU2hlblpo
ZW4wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDMeb6o0FOJsq3pArgw
8zreWPZWn1u9kLryjwZcZRuHF5j2zcMURbCqn4G2jDEpCUdOIXcQCSGX6G2wbuf+
gqTxouoUEQFCvl546C0l6OUTaxzi58IAL+c7nygf5FyiZBj4sxIdxeotVjgDAghB
8GG/Klh056xW+It1wsiWGjFE2B+81r1GLH0b3bQV3geb15ySAsCW+I5UKiD0Kyzn
cs6sTWFW20Kyeqd5em01s8JEtT2WtllIUOBFkxGWzQLKzgmD4JTM8FH6HuPlYSVK
ayAnmwAdAPmv0+teoh61qvDFptqF/Hkb8ucxRa2MVkHxap74HTX2A1/BC4YLKkwH
QOPXAgMBAAGjgbkwgbYwCQYDVR0TBAIwADALBgNVHQ8EBAMCA/gwgZsGA1UdHwSB
kzCBkDCBjaCBiqCBh4aBhGh0dHA6Ly9ldmNhLml0cnVzLmNvbS5jbi9wdWJsaWMv
aXRydXNjcmw/Q0E9MUJENDIyMEU1MERCQzA0QjA2QUQzOTc1NDk4NDZDMDFDM0U4
RUJEMiZzZz1IQUNDNDcxQjY1NDIyRTEyQjI3QTlEMzNBODdBRDFDREY1OTI2RTE0
MDM3MTANBgkqhkiG9w0BAQsFAAOCAQEAUSajs4PrnZE3q9jpEyud32Rehu6PDtjb
Omf0xDJ0lPU8Z2di/W7Td5dFD8muG6gZiGzSxsmL7OONejU0U4kUtAd1/G0MxGFt
0GayhcwJzyYqyqHHEl/I7rdcYMM9IWU+nnGmR/t7TN4clmIR0HdSpkR/xF0yosQ1
u/+7vvyQ9fRkJxO2VAVsNN/xK+7n+6UTx9Q/qqCR7nqFJAAmx7rOP+zXW8WaMdf6
4EoP+JsgBA9loO+Rot1pkAYHPonN0eZXo1F+dHyKV5WhP7o5Bh+byAiDByA+mpnI
ZdzjCjZpy0rNsOYgQX78VOIn2UZRriQpXbj+jzkXztYHYdephZZ4yw==
-----END CERTIFICATE-----`

func HandleNotifyData(ctx context.Context, request *http.Request) error {
	cert, err := utils.LoadCertificate(publicKey)
	if err != nil {
		return fmt.Errorf("111 err=%v", err)
	}

	handler, err := notify.NewRSANotifyHandler(
		mchAPIv3Key, verifiers.NewSHA256WithRSAVerifier(core.NewCertificateMapWithList([]*x509.Certificate{cert})),
	)
	if err != nil {
		return fmt.Errorf("222 err=%v", err)
	}

	content := new(payments.Transaction)
	notifyReq, err := handler.ParseNotifyRequest(ctx, request, content)
	if err != nil {
		return fmt.Errorf("parse err=%v", err)
	}

	// 处理通知内容
	// 查询
	fmt.Println("notify data", notifyReq.Resource.Plaintext)

	trans := new(payments.Transaction)
	err = json.Unmarshal([]byte(notifyReq.Resource.Plaintext), trans)
	if err != nil {
		return fmt.Errorf("parse json.Unmarshal plaintext err=%v", err)
	}

	if trans.OutTradeNo == nil {
		return fmt.Errorf("trans.OutTradeNo is empty err=%v", err)
	}

	if trans.TradeState == nil {
		return fmt.Errorf("trans.TradeState is empty err=%v", err)
	}

	if *trans.TradeState != "SUCCESS" {
		log.Printf("trans.TradeState is not success trans=%+v", trans)
		return nil
	}

	payOrder := &model.PayOrder{}
	if err := payOrder.GetByOutTradeNo(*trans.OutTradeNo); err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("不存在订单 err=%v", err)
		} else {
			return fmt.Errorf("系统错误 err=%v", err)
		}
	}
	if payOrder.Status == 2 {
		log.Printf("has pay to user=%v", payOrder)
		return nil
	}

	if err := PaySuccessOnlyOnce(payOrder); err != nil { //主动查询把
		log.Printf("pay handle err=%v", err)
		return nil
	}

	return nil
}
