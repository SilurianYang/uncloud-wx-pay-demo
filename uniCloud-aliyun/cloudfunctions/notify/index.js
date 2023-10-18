const xml2js = require('xml2js');

const DB = uniCloud.database();

exports.main = async (event, context) => {
	
	console.log(`回调参数如下：`)
	
	try{
		const parser = new xml2js.Parser({ explicitArray: false });
		const {xml:wxData} = await parser.parseStringPromise(event.body);
		console.log(`---------- 解析出来的参数如下：----------`)
		
		await DB.collection('orders').where({
			system_order_id:wxData['out_trade_no']
		}).update({
			pay_transaction_id:wxData['transaction_id'],
			status:1
		})
		
		console.log(wxData)
		
		  return {
		    mpserverlessComposedResponse: true, 
		    statusCode: 200,
		    headers: {
		      'content-type': 'text/xml;charset=utf-8'
		    },
		    body: `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`
		  } 
	}catch(e){
		console.log(`发生了错误`)
		console.log(e)
	}
	
	return event
};
