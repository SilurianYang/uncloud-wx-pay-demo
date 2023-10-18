<template>
	<view class="content">
		<input type="number" class="moneyInput" v-model="formatData.money">
		
		<button @click="createOrder">开始支付</button>
	</view>
</template>

<script setup>
import { reactive,ref } from "vue";
import { onLoad } from '@dcloudio/uni-app';

const myPayCloud = uniCloud.importObject('my-pay')
const formatData = reactive({
	money:20
})

function getJsCode(){
	return new Promise(resolve=>{
		uni.login({
			provider: 'weixin', //使用微信登录
			success:({code})=>{
				resolve(code);
			}
		})
	})
}

async function createOrder(){
	if(formatData.money === ''){
		return
	}
	const jsCode = await getJsCode();
	const res = await myPayCloud.createOrder(formatData.money,jsCode)
	
	uni.requestPayment({
			...res.orderInfo,
		    success(res) {
				uni.showToast({
					title:`支付完成`
				})
				console.log(res)
			},
		    fail(e) {
				console.log(e)
			}
	})
}
</script>

<style>
	.content{
		padding: 20rpx;
		box-sizing: border-box;
	}
	.moneyInput{
		height: 75rpx;
		border: 1px solid #ccc;
		margin-bottom: 80rpx;
		padding: 0 10rpx;
	}
</style>