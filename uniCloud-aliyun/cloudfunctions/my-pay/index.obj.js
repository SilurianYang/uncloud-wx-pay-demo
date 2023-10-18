const payConfig = require('pay-config');
const crypto = require('crypto');
const xml2js = require('xml2js');

const DB = uniCloud.database();

// 生成32位随机字符串
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

// 签名算法

function createSign(info, key) {
    const hash = crypto.createHash("md5");
    let stringA = "";
    let keys = Object.keys(info);
    keys.sort();
    for (let item of keys) {
        stringA += `${item}=${info[item]}&`;
    }
    let stringSignTemp = `${stringA}key=${key}`;
    return hash.update(stringSignTemp).digest("hex");
}

function json2xml(obj){
    let tempObj = Object.assign({},obj);

    let jsonxml = "";
    if(tempObj){
        jsonxml+='<xml>';
        Object.keys(tempObj).sort().map(item=>{
            jsonxml+=`<${item}>${tempObj[item]}</${item}>`
        });
        jsonxml+=`</xml>`;
    }

    return jsonxml
};


async function getUserOpenId(code){
	const res = await uniCloud.httpclient.request(
	`https://api.weixin.qq.com/sns/jscode2session`,
	{
	    method: 'GET',
	    data:{
			appid: payConfig['appId'],
			secret: payConfig['secret'],
			js_code:code,
			grant_type:`authorization_code`
		},
	    contentType: 'json',
	    dataType: 'json' 
	  })
	  return res.data
}

module.exports = {
	createOrder:async function(amount,code){
		const {openid,session_key}= await getUserOpenId(code);
		
		const payParams = {
		  appid: payConfig['appId'],
		  mch_id: payConfig['mchId'],
		  body: '充值中心-测试商品',
		  out_trade_no: `pay_test_${+new Date()}`,
		  total_fee: amount * 100, 
		  nonce_str: generateRandomString(32),
		  notify_url:payConfig['notify_url'],
		  trade_type:`JSAPI`,
		  openid
		};
		
		const sendData = {
			...payParams,
			sign:createSign(payParams, payConfig['key'])
		}
		
		// 将JSON数据转换为XML
		let builder = new xml2js.Builder({
			rootName: 'xml',
			cdata: true, // 自动包装CDATA
		});
		const xmlData = builder.buildObject(sendData);
			
		// 创建系统中的订单
		await DB.collection('orders').add({
			system_order_id:payParams['out_trade_no'],
			pay_transaction_id:'',
			status:0,
			amount:payParams['total_fee']
		})
			
		const res = await uniCloud.httpclient.request(
		`https://api.mch.weixin.qq.com/pay/unifiedorder`,
		{
			method: 'POST',
			data:xmlData,
			contentType: 'application/xml',
			dataType: 'text' 
		  })
		// 解析xml
		const parser = new xml2js.Parser({ explicitArray: false });
		const {xml:wxData} = await parser.parseStringPromise(res.data);
		
		const orderInfo = {
				appId:wxData['appid'],
				nonceStr:wxData['nonce_str'],
				signType: 'MD5',
				package:`prepay_id=${wxData['prepay_id']}`,
				timeStamp:parseInt( (+new Date() / 1000)+'' )+'',
			}
		orderInfo.paySign = createSign(orderInfo, payConfig['key'])
		
		return {
			wxData,
			orderInfo
		}
	}
}
