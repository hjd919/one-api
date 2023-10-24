import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Segment, Statistic,Image,Select } from 'semantic-ui-react';
import { API, showError, showInfo, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';

const TopUp = () => {
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpLink, setTopUpLink] = useState('');
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [selectedMoney, setSelectedMoney] = useState(0);
  const [userQuota, setUserQuota] = useState(0);
  const [userMoney, setUserMoney] = useState(0);
  const [goodsInfo, setGoodsInfo] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toWXpay = (goodsId) => {
    if (goodsId === '') {
      showInfo('请输入充值码！')
      return;
    }
    showInfo('请打开手机微信，扫描下方二维码进行支付。支付完成后，点击“查询支付结果”按钮')
    setSelectedMoney(goodsId)
    console.log("goodsId="+goodsId)
    setQrcodeUrl("/api/user/topup_pay?goodsId="+goodsId)
  };

  const queryOrder = async ()=>{
    try {
      const res = await API.post('/api/user/query_order', {});
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(message);
        setUserQuota((quota) => {
          return quota + data;
        });
        if (data > 0){
          setQrcodeUrl('');
          setUserMoney(0);
        }
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo('请输入充值码！')
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('充值成功！');
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求失败');
    } finally {
      setIsSubmitting(false); 
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError('超级管理员未设置充值链接！');
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const getUserQuota = async ()=>{
    let res  = await API.get(`/api/user/self`);
    const {success, message, data} = res.data;
    if (success) {
      setUserQuota(data.quota);
    } else {
      showError(message);
    }
  }
  var moneyQuota = {}
  const getGoodsInfo = async () => {
    let res  = await API.get(`/api/user/goods_info`);
    const {success, message, data} = res.data;
    if (success) {
        var options = []
        data.map((item,index) =>{
            let goodsItem = { key: index, text: item.desc, value: item.money }
            options.push(goodsItem)
            moneyQuota[item.money] = item.quota
        })
        setGoodsInfo(options);
    } else {
      showError(message);
    }
  }

  const handleChangeMoney = (e,{value}) => {
    setUserMoney(value)
    toWXpay(value)
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
    }
    getUserQuota().then();

    getGoodsInfo().then()
  }, []);

  return (
  <>
    <Segment>
        <Header as='h3'>平台价格</Header>
        <p>
            GPT-3.5模型：2元=1刀，约为官方原价的2/7比例折扣<br/><br/>
            GPT-4.0模型：3元=1刀，约为官方原价的3/7比例折扣<br/><br/>
            超高并发，无需担心并发问题，您只需负责开发推广应用<br/><br/>
            所有消费公开透明，可看可查
        </p>
        <Header as='h3'>充值额度</Header>
      <Grid columns={2} stackable>
        <Grid.Column>
          <Form>
            <Form.Input
              placeholder='兑换码'
              name='redemptionCode'
              value={redemptionCode}
              onChange={(e) => {
                setRedemptionCode(e.target.value);
              }}
            />
            <Button color='green' onClick={openTopUpLink}>
              获取兑换码
            </Button>
            <Button color='yellow' onClick={topUp} disabled={isSubmitting}>
                {isSubmitting ? '兑换中...' : '兑换'}
            </Button>
          </Form>
        </Grid.Column>
        <Grid.Column>
          <Statistic.Group widths='one'>
            <Statistic>
              <Statistic.Value>{renderQuota(userQuota)}</Statistic.Value>
              <Statistic.Label>剩余额度</Statistic.Label>
            </Statistic>
          </Statistic.Group>
        </Grid.Column>
      </Grid>
    </Segment>
    <Segment>
          <Grid columns={2} stackable>
            <Grid.Column>
              <Header as='h3'>
                在线充值，最低1 (单位: $)
              </Header>
              <Form>
                <Form.Field
                  control={Select}
                  options={goodsInfo}
                  onChange={handleChangeMoney}
                  placeholder='充值金额，请选择'
                />
                {
                  qrcodeUrl !=="" && (
                    <Segment>
                      <Segment>
                        <Image src={qrcodeUrl} size='medium' centered/>
                       <Header as='h3' textAlign='center'>{selectedMoney/100}元</Header>
                      </Segment>
                      <Segment>
                        <Button color='blue' onClick={(e)=>queryOrder(e)}>
                          查询支付结果
                        </Button>
                      </Segment>
                    </Segment>
                  )
                }
              </Form>
            </Grid.Column>
            <Grid.Column>
              <Statistic.Group widths='one'>
                <Statistic>
                  <Statistic.Value>{userMoney/100}元</Statistic.Value>
                  <Statistic.Label>支付金额</Statistic.Label>
                </Statistic>
              </Statistic.Group>
            </Grid.Column>
          </Grid>
        </Segment>
    </>
  );
};

export default TopUp;