package controller

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"one-api/common"
	"one-api/wxpay"
	"strconv"
)

type topUpPayRequest struct {
	GoodsId string `json:"goodsId"`
}

type Goods struct {
	Money int64 `json:"money"`
	Quota int   `json:"quota"`
}

var GoodsInfoData []Goods
var GoodsInfoMap = make(map[string]Goods)

func SetGoodsInfo(goodsInfo []byte) {
	if len(goodsInfo) == 0 {
		panic("goods.json json not exist")
	}
	err := json.Unmarshal(goodsInfo, &GoodsInfoData)
	if err != nil {
		panic("goods.json json Unmarshal err=" + err.Error())
	}
	for _, datum := range GoodsInfoData {
		GoodsInfoMap[strconv.Itoa(int(datum.Money))] = datum
	}
}

func TopUpPay(c *gin.Context) {
	//req := topUpPayRequest{}
	//err := c.ShouldBindJSON(&req)
	//if err != nil {
	//	c.JSON(http.StatusOK, gin.H{
	//		"success": false,
	//		"message": err.Error(),
	//	})
	//	return
	//}
	goodsId := c.Query("goodsId")

	goodsData, exist := GoodsInfoMap[goodsId]
	if !exist {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": fmt.Sprintf("不存在商品信息(%s),需要配置goods.json", goodsId),
		})
		return
	}

	id := c.GetInt("id")
	quota, err := wxpay.PayQrcodeCache(c.Request.Context(), goodsData.Money, id, goodsData.Quota)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发起支付失败：" + err.Error(),
		})
		return
	}

	_, err = c.Writer.Write(quota)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Writer Write失败：" + err.Error(),
		})
		return
	}
	return
}

type WXPayCBRequest struct {
}

func WXPayCB(c *gin.Context) {
	//req := c.Request.Clone(context.Background())
	//log.Println("header=", req.Header)
	//bb, _ := io.ReadAll(req.Body)
	//log.Println("body=", string(bb))

	if err := wxpay.HandleNotifyData(c.Request.Context(), c.Request); err != nil {
		common.SysError("HandleNotifyData err=" + err.Error())
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "TODO",
	})
	return
}

func QueryOrder(c *gin.Context) {
	id := c.GetInt("id")
	tradeState, payOrder, err := wxpay.QueryPayOrder(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "发起支付失败：" + err.Error(),
		})
		return
	}

	if tradeState != "支付成功" {
		payOrder.Quota = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("订单(%s)：%s", payOrder.OutTradeNo, tradeState),
		"data":    payOrder.Quota,
	})

	return
}

func GoodsInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    GoodsInfoData,
	})
}
