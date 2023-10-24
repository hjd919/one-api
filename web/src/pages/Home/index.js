import React, { useContext, useEffect, useState } from 'react';
import { Card, Grid, Header, Segment } from 'semantic-ui-react';
import { API, showError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { marked } from 'marked';

const Home = () => {
  const [statusState, statusDispatch] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');

  const displayNotice = async () => {
    const res = await API.get('/api/notice');
    const { success, message, data } = res.data;
    if (success) {
      let oldNotice = localStorage.getItem('notice');
        if (data !== oldNotice && data !== '') {
            const htmlNotice = marked(data);
            showNotice(htmlNotice, true);
            localStorage.setItem('notice', data);
        }
    } else {
      showError(message);
    }
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const getStartTimeString = () => {
    const timestamp = statusState?.status?.start_time;
    return timestamp2string(timestamp);
  };

  useEffect(() => {
    displayNotice().then();
    displayHomePageContent().then();
  }, []);
  return (
    <>
      {
        homePageContentLoaded && homePageContent === '' ?
          <div className="tf-content" style={{fontFamily: "LXGW WenKai Screen"}}>
            <div className="tf-hero-slide tf-style1 tf-flex" style={{height: "520px"}}>
              <div className="container">
                <div className="tf-hero-text tf-style1">
                  <h1 className="tf-hero-title">Bltcy API</h1>
                  <h1 className="tf-hero-title">解锁未来之门!</h1>
                  <div className="tf-hero-subtitle">
                    <p>我们提供 Ai 接口聚合管理</p>
                    <p>让您能够轻松一站式接入各种 Ai 服务</p>
                    <p>价格优惠，仅需 0.9元即可购买1美刀额度</p>
                    <p>不限时间，按量计费</p>
                    <p>明细可查，每一笔消耗都公开透明</p>
                  </div>
                  <div className="tf-btn-group tf-style1">
                    <a href="/token" className="tf-btn tf-style1 tf-color1">开始体验</a>
                  </div>
                </div>
              </div>
              <div className="tf-hero-img">
                <img src="https://one-api.bltcy.top/home.png" alt="" />
              </div>
            </div>
            <section className="tf-section-top">
              <div className="container">
                <div className="tf-section-heading tf-style2 text-center">
                  <h2>快速开始</h2>
                  <div className="tf-seperator">
                    <div className="tf-seperator-left-bar"></div>
                    <div className="tf-seperator-right-bar"></div>
                  </div>
                  <p>1. 注册账号后登陆</p>
                  <p>2. 点击充值或使用兑换码，购买额度</p>
                  <p>
                    3.
                    点击令牌，点击创建新的令牌后，编辑名称，选择给此密钥分配的额度后点击提交
                  </p>
                </div>
              </div>
              <div className="container">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="tf-iconbox tf-style1 text-center">
                      <div className="tf-iconbox-icon"><i className="flaticon-focus"></i></div>
                      <h3 className="tf-iconbox-title">无忧风控问题</h3>
                      <div className="tf-iconbox-text">
                        我们帮您解决所有的「风控」问题,无需再为账号注册、IP受限、付款困难,账单无法支付等烦恼。
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tf-iconbox tf-style1 text-center">
                      <div className="tf-iconbox-icon"><i className="flaticon-career"></i></div>
                      <h3 className="tf-iconbox-title">卓越性能保障</h3>
                      <div className="tf-iconbox-text">
                        我们提供卓越的并发处理能力,行业领先的网络性能和安全保障,致力于为您带来超凡的用户体验。
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tf-iconbox tf-style1 text-center">
                      <div className="tf-iconbox-icon"><i className="flaticon-career-1"></i></div>
                      <h3 className="tf-iconbox-title">资源高效整合</h3>
                      <div className="tf-iconbox-text">
                        企业账号资源整合与全球中继专线优化,极大降低接入成本与使用难度,兼容诸多第三方优秀应用。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="tf-pricing-wrap tf-section" id="price">
              <div className="container">
                <div className="tf-section-heading tf-style2 text-center">
                  <h2>模型价格</h2>
                  <div className="tf-seperator">
                    <div className="tf-seperator-left-bar"></div>
                    <div className="tf-seperator-right-bar"></div>
                  </div>
                  <p>超级划算! 9 毛钱RMB购买 1 美元额度，0.9￥ = 1$</p>
                  <p>我们的计费方式与 OpenAI 官方保持一致！</p>
                  <p>基于API请求发送的内容以及API返回的内容进行收费。</p>
                </div>
              </div>
              <div className="container">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="tf-price-card text-center">
                      <h3 className="tf-price-card-title">GPT-3.5-16k</h3>
                      <ul className="tf-price-card-feature tf-mp0">
                        <li>生成文本或代码</li>
                        <li>超多领域适用性</li>
                        <li>基础逻辑对话聊天</li>
                        <li>处理超长文本(约8千字)</li>
                      </ul>
                      <div className="tf-price-card-btn">
                        <a href="/topup" className="tf-btn tf-style1 tf-size1 tf-color1"
                          >前往充值</a
                        >
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tf-price-card text-center">
                      <h3 className="tf-price-card-title">GPT-4.0-8k</h3>
                      <ul className="tf-price-card-feature tf-mp0">
                        <li>生成文本或代码</li>
                        <li>超多领域适用性</li>
                        <li>高级逻辑对话聊天</li>
                        <li>处理较长文本(约4千字)</li>
                      </ul>
                      <div className="tf-price-card-btn">
                        <a href="/topup" className="tf-btn tf-style1 tf-size1 tf-color1"
                          >前往充值</a
                        >
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tf-price-card text-center tf-featured-price">
                      <h3 className="tf-price-card-title">GPT-4.0-32k</h3>
                      <ul className="tf-price-card-feature tf-mp0">
                        <li>生成文本或代码</li>
                        <li>超多领域适用性</li>
                        <li>高级逻辑对话聊天</li>
                        <li>处理较长文本(约1.6万字)</li>
                      </ul>
                      <div className="tf-price-card-btn">
                        <a href="/topup" className="tf-btn tf-style1 tf-size1 tf-color2"
                          >前往充值</a
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="tf-pricing-wrap tf-section" id="models">
              <div className="container">
                <div className="tf-section-heading tf-style2 text-center">
                  <h2>支持模型</h2>
                  <div className="tf-seperator">
                    <div className="tf-seperator-left-bar"></div>
                    <div className="tf-seperator-right-bar"></div>
                  </div>
                  <p>我们支持 OpenAI 官方所有模型，以及其他市面上常见模型！</p>
                </div>
              </div>
              <div className="container">
                <table>
                  <tr>
                    <th>模型</th>
                    <th>我们的价格</th>
                    <th>问题 Tokens (per/1K tokens)</th>
                    <th>回答 Tokens (per/1K tokens)</th>
                    <th>备注</th>
                  </tr>
                  <tr>
                    <td>GPT 联网模型 <br />net-gpt-3.5-turbo <br />net-gpt-4</td>
                    <td>模型价格2倍，用于搜索消耗</td>
                    <td>模型价格 * 2</td>
                    <td>模型价格 * 2</td>
                    <th>
                      如要开启联网模型有两种方式，选择其一即可<br />参数中指定
                      search:true, true-开启联网 false-关闭联网<br />在模型前加net-
                      例如gpt-4开启联网就是net-gpt-4
                    </th>
                  </tr>
                  <tr>
                    <td>GPT视觉模型<br />gpt-4-v</td>
                    <td>0.9元 = 1刀</td>
                    <td>0.06</td>
                    <td>0.12</td>
                    <th>prompt 格式(图片URL+空格+prompt 支持多个图片)：img_url prompt</th>
                  </tr>
                  <tr>
                    <td>画图 Dalle3<br />gpt-4-dalle</td>
                    <td>0.9元 = 1刀</td>
                    <td>0.06</td>
                    <td>0.12</td>
                    <th>
                      prompt 格式：画一个xxx <br />一定要提示GPT是画什么，不然当成聊天了
                    </th>
                  </tr>
                  <tr>
                    <td>
                      gpt-3.5-turbo (gpt3.5系列) <br />gpt-3.5-turbo-0613
                      <br />gpt-3.5-turbo-0314
                    </td>
                    <td>折扣倍率0.5<br />相当于 0.45元 = 1刀</td>
                    <td>0.0015</td>
                    <td>0.002</td>
                    <th>支持 call function</th>
                  </tr>
                  <tr>
                    <td>
                      gpt-3.5-turbo-16k (gpt3.5 16K系列) <br />gpt-3.5-turbo-16k-0613
                      <br />gpt-3.5-turbo-16k-0314
                    </td>
                    <td>折扣倍率0.5<br />相当于 0.45元 = 1刀</td>
                    <td>0.003</td>
                    <td>0.004</td>
                    <th>支持 call function</th>
                  </tr>
                  <tr>
                    <td>gpt-4 (gpt4系列) <br />gpt-4-0613 <br />gpt-4-0314</td>
                    <td>0.9元 = 1刀</td>
                    <td>0.03</td>
                    <td>0.06</td>
                    <th>支持 call function</th>
                  </tr>
                  <tr>
                    <td>
                      gpt-4-32k (gpt4 32K系列) <br />gpt-4-32k-0613 <br />gpt-4-32k-0314
                    </td>
                    <td>0.9元 = 1刀</td>
                    <td>0.06</td>
                    <td>0.12</td>
                    <th>支持 call function</th>
                  </tr>
                  <tr>
                    <td>其他OpenAI官方模型</td>
                    <td>0.9元 = 1刀</td>
                    <td>/</td>
                    <td>/</td>
                    <th>已对齐官方计费文档</th>
                  </tr>
                  <tr>
                    <td>midjourney</td>
                    <td>0.1/次</td>
                    <td>0.1/次</td>
                    <td>0.1/次</td>
                    <th>
                      Fast 模式，按次数计费<br />api兼容midjourney-proxy<br />api方式调用，使用midjourney-proxy
                      api
                    </th>
                  </tr>
                  <tr>
                    <td>stable-diffusion</td>
                    <td>0.01/次</td>
                    <td>0.01/次</td>
                    <td>0.01/次</td>
                    <th>SD XL，按次数计费</th>
                  </tr>
                  <tr>
                    <td>claude-1-100k</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <th>按次数计费，不计算tokens</th>
                  </tr>
                  <tr>
                    <td>claude-2-100k</td>
                    <td>0.03/次</td>
                    <td>0.03/次</td>
                    <td>0.03/次</td>
                    <th>按次数计费，不计算tokens</th>
                  </tr>
                  <tr>
                    <td>google-palm</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <th>按次数计费，不计算tokens</th>
                  </tr>
                  <tr>
                    <td>llama-2-70b(13b、7b)</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <th>按次数计费，不计算tokens</th>
                  </tr>
                  <tr>
                    <td>code-llama-34b(13b、7b)</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <td>0.006/次</td>
                    <th>按次数计费，不计算tokens</th>
                  </tr>
                </table>
              </div>
            </section>
            <section className="tf-service-section tf-section-top" id="service">
              <div className="container">
                <div className="tf-section-heading tf-style2 text-center">
                  <h2>用户信任与选择</h2>
                  <div className="tf-seperator">
                    <div className="tf-seperator-left-bar"></div>
                    <div className="tf-seperator-right-bar"></div>
                  </div>
                  <p>全新解决方案带给企业和个人</p>
                  <p>数十家合作企业与研究机构,上千名用户与我们共建人工智能的美好未来。</p>
                </div>
              </div>
            </section>
            <section className="tf-cta-wrap tf-gray-bg">
              <div className="container">
                <div className="row">
                  <div className="col-lg-7 offset-lg-1">
                    <div className="tf-cta text-center tf-section">
                      <h2 className="tf-cta-title">为您提供专业的技术保障!</h2>
                      <div className="tf-cta-text">
                        <p>我们的客户服务团队始终以客户至上的原则工作,</p>
                        <p>您有任何疑问或建议,都将在24小时内得到回复。</p>
                        <p>接受大额充值 / 高并发需求(可开发票)私信我们享受大额优惠</p>
                        <p>接受镜像站 / ai导航站、个人代理合作，详情可私聊</p>
                      </div>
                      <div className="tf-cta-btn">
                        <a
                          href="mailto:xyfacai@gmail.com"
                          className="tf-btn tf-style1 tf-size1 tf-color1"
                          >联系邮箱：xyfacai@gmail.com</a
                        >
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="tf-vertical-middle">
                      <div className="tf-vertical-middle-in tf-flex">
                        <div className="tf-cta-img">
                          <img src="https://one-api.bltcy.top/kefu.png" alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
         : <>
          {
            homePageContent.startsWith('https://') ? <iframe
              src={homePageContent}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            /> : <div style={{ fontSize: 'larger' }} dangerouslySetInnerHTML={{ __html: homePageContent }}></div>
          }
        </>
      }

    </>
  );
};

export default Home;
