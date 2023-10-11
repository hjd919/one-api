package model

type PayOrder struct {
	Id          int    `json:"id"`
	UserId      int    `json:"user_id"`
	OutTradeNo  string `json:"out_trade_no" gorm:"type:char(128);uniqueIndex"`
	Money       int64  `json:"money" gorm:"default:1"`
	Quota       int    `json:"quota" gorm:"default:100"`
	Status      int    `json:"status" gorm:"default:1"` //1 待支付 2 已支付 3 过期
	CreatedTime int64  `json:"created_time" gorm:"bigint"`
	PayTime     int64  `json:"pay_time" gorm:"bigint"`
}

func (redemption *PayOrder) GetLastOrderByUid(uid int) error {
	return DB.Order("created_time desc").First(redemption, "user_id=?", uid).Error
}

func (redemption *PayOrder) GetByOutTradeNo(outTradeNo string) error {
	return DB.First(redemption, "out_trade_no=?", outTradeNo).Error
}

func (redemption *PayOrder) Insert() error {
	var err error
	err = DB.Create(redemption).Error
	return err
}

// Update Make sure your token's fields is completed, because this will update non-zero values
func (redemption *PayOrder) Update() error {
	var err error
	err = DB.Model(redemption).Select("name", "status", "quota", "redeemed_time").Updates(redemption).Error
	return err
}

func (redemption *PayOrder) Delete(outTradeNo string) error {
	var err error
	err = DB.Delete(redemption, "out_trade_no=?", outTradeNo).Error
	return err
}

func (redemption *PayOrder) CountByOutTradeNo(outTradeNo string) (int64, error) {
	var err error
	var cnt int64
	err = DB.Model(redemption).Where("out_trade_no=?", outTradeNo).Count(&cnt).Error
	return cnt, err
}
