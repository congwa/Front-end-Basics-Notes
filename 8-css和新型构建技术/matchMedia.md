# matchMedia 


## matchMedia()

在js中使用媒体查询

```js
// Window的matchMedia() 方法返回一个新的MediaQueryList对象，表示指定的媒体查询 (en-US)字符串解析后的结果。返回的MediaQueryList可被用于判Document是否匹配媒体查询，或者监控一个document来判定它匹配了或者停止匹配了此媒体查询 
window.matchMedia()

// mediaQueryString：一个被用于媒体查询解析的字符串
let mqList = window.matchMedia(mediaQueryString)

// MediaQueryList的内容
// media，它将媒体查询存储为序列化字符串
// matches，它基本上是一个布尔值，如果我们作为参数提供的媒体查询与文档匹配则返回true 


let mqList = window.matchMedia('(min-width: 600px)');

mqList.addEventListener('change', function(mqList){})

// 使用示例
function myFunction(x) {
    if (x.matches) { // 媒体查询
        document.body.style.backgroundColor = "yellow";
    } else {
        document.body.style.backgroundColor = "pink";
    }
}
var x = window.matchMedia("(max-width: 700px)")
myFunction(x) // 执行时调用的监听函数
x.addListener(myFunction) // 状态改变时添加监听器

```


### orientation

> 定义输出设备中的页面**可见区域高度是否大于或等于宽度**。

通过监听matchMedia的orientation的结果，可以实现监听设备可视区域高度是否大于宽度，从而判断是否为横竖屏切换。


需要区分onorientationchange事件

```js
	// 判断屏幕是否旋转
  function orientationChange() {
      switch(window.orientation) {
          case 0:
              alert("肖像模式 0,screen-width: " + screen.width + "; screen-height:" + screen.height);
              break;
          case -90:
              alert("左旋 -90,screen-width: " + screen.width + "; screen-height:" + screen.height);
              break;
          case 90:
              alert("右旋 90,screen-width: " + screen.width + "; screen-height:" + screen.height);
              break;
          case 180:
              alert("风景模式 180,screen-width: " + screen.width + "; screen-height:" + screen.height);
              break;
      };
  };
  // 添加事件监听
  window.addEventListener('load', function(){
      orientationChange();
      window.onorientationchange = orientationChange;
  });
```
