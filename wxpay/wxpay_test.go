package wxpay_test

import (
	"context"
	"log"
	"one-api/wxpay"
	"os"
	"testing"
)

func TestWxpayCall(t *testing.T) {
	quota, err := wxpay.PayQrcodeCache(context.Background(), 1, 1, 1)
	if err != nil {
		t.Errorf("err=%v", err)
		return
	}
	log.Printf("len=%d", len(quota))
	os.WriteFile("img.jpg", quota, 0777)
}
