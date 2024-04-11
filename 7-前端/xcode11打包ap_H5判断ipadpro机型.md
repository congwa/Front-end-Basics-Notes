# 用xcode11打包app H5判断ipad pro机型 navigator.userAgent

新版app升级Xcode11来打新包出现ipadPro 不识别是ipad机型

首先ipadPro本来就是一个特殊机型！！


![iphone7](/study/imgs/iphone7.png)



![ipad pro](/study/imgs/ipadpro1.png)

可以看出ipad pro在浏览器上 只有 Mac OS X的字眼

![google chrome ipad](/study/imgs/googleipad.png)


分别是浏览器模拟iphone6/7，ipad ，ipadPro 打印出结果

1. iphone都还正常，会返回机型iphone也会有系统mac os，也会显示mobile
2. ipad出来的虽然有系统mac os 但是还有机型iPad
3. 再看ipadPro真机弹框 根本就没返回机型iPad！！！所以ipadPro不属于ipad了吗？
4. 也不能用系统mac os来判断，那样所以苹果电脑就不能排除了
5. 在电脑上模拟ipadPro压根是测不出来问题，在真机上就会出bug，所以还是要真机测试一下


## xcode11打包后的navigator.userAgent

![xcode11](/study/imgs/ipad11.png)

弹出来的东西跟少了，像version/safari都没有了，但是至于什么原理还得要研究一下xcode了. 但是可以看到只有 Mac OS X的字眼


## 解决方法

手机只要判断 `ontouchend` in document 就可以了，因为大多手机肯定是需要touch事件,但是如果真要是电脑也支持touch事件也还是要做兼容了，但目前os的电脑肯定没有touch事件

> macos预计在2025年出第一款触屏mac os，到时候再看如何解决

```js
isWap: function() {
	var ua = navigator.userAgent;
  var isWX = ua.match(/MicroMessenger/i) == 'micromessenger';
	var isMidp = ua.match(/midp/i) == "midp";
	var isUc7 = ua.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
	var isUc = ua.match(/ucweb/i) == "ucweb";
	var isAndroid = ua.match(/android/i) == "android";
	var isCE = ua.match(/windows ce/i) == "windows ce";
	var isWM = ua.match(/windows mobile/i) == "windows mobile";
	let isIphone = ua.indexOf("iPhone") != -1;
	let isIPad = !isIphone && 'ontouchend' in document;
	if (isIPad || isIphone || isMidp || isUc7 || isUc || isAndroid || isCE || isWM || isWX) {
	   return true;
	} else {
	   return false;
	}
}
```

### 让ios的开发把机型配置修改一下成 ipad

让ios的开发把机型配置修改一下成 ipad，这样虽然H5可以不用变动，但在app里的H5是管用，如果wap页面还是要像上面修改