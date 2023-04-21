

# 小程序中的webview

问题
- 是否会无限的创建新的webview?
- 如何销毁？创建的丝滑动画怎么产生？
- 小程序如何快速打开一个页面渲染的？
- 是否一个逻辑层对应一个ui层webview吗？ 


## webview及基础模块

打开微信开发者工具，点击调试，调试微信开发者工具
[调试](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8F-webview.jpg)

看到一些webview标签，src路径和route的媒体属性重点看一下， src就是当前页面在项目中的路径，这就是所谓的渲染层

```js
// 查看当前页面所有的webview
document.getElementByTagName('webview')

```

应该是拿到了4个webview， 如果新创建一个页面，就会创建并且插入一个新的webview
[逻辑层](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E9%80%BB%E8%BE%91%E5%B1%82.jpg)
这四个webview分别是
- 视图层的webview - pageframe/pages/index/index src路径
- 业务层的webview - appservice/appservice?***  src路径
- 调试器的webview
- 编辑区的webview

微信开发者工具模拟了双线程结构，在这里每个webview可以理解为一个单独的线程。（基于electron），为什么这么干，我理解为为了代码最大化复用吧。毕竟公司干活开发有压力。一套代码多次运行。

创建一个新的页面就会创建一个新的webview，这里微信小程序做了限制，打开的页面不能超过10个，超过10个后，就不能打开新的页面。

通过一下代码打开webview的调试器

```js
// 打开当前显示页面的调试器
document.getElementsByTagName('webview')[0].showDevTools(true, null)

```
[渲染层](./../imgs/%E6%B8%B2%E6%9F%93%E5%B1%82.png)


script里面有个webviewId,从这个id又可以再次印证webview层不止一个
- [webview-ID](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8Fwebview-id.png)
- wxAppCode 整个页面的json wxss wxml编译之后都存储在这里，下面有个script标签就是它，下面会讲到。
- Vd_version_info 版本信息
- ./dev/wxconfig.js是小程序默认总配置项，包括用户自定义与系统默认的整合结果。在控制台输入__wxConfig可以看出打印结果
- ./dev/devtoolsconfig.js小程序开发者配置，包括navigationBarHeight,标题栏的高度，状态栏高度，等等，控制台输入__devtoolsConfig可以看到其对应的信息
- ./dev/deviceinfo.js 设备信息，包含尺寸/像素点pixelRatio。
- ./dev/jsdebug.js debug工具。
- ./dev/WAWebview.js 渲染层底层基础库，底层基础库后面会重点讲到。
- ./dev/hls.js 优秀的视频流处理工具。
- ./dev/WARemoteDebug.js 底层基础库调试工具
  
[节点信息](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E8%8A%82%E7%82%B9%E4%BF%A1%E6%81%AF.png)

可以看到渲染出来的节点形式，就是Exparser编译后的样子，这不就是html带有专有属性吗。





## PageFrame

[PageFrame](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8FpageFrame.png)


这个webview其实就是一个用来新渲染webview的模板

知在小程序中使用 WXML 文件描述页面的结构，WXSS 文件描述页面的样式，WXML文件会被编译为虚拟DOM，WXSS会被编译为js。那么每个独立的页面都会经过这样的编译，如何快速的生成webview，或者说如何快速的打开一个页面。会成为一个问题。


pageFrame的html结构中注入的js资源
- ./__dev__/wxconfig.js:
  小程序默认总配置项，包括用户自定义与系统默认的整合结果。在控制台输入__wxConfig可以看出打印结果 
- ./__dev__/devtoolsconfig.js
  小程序开发者配置，包括navigationBarHeight,标题栏的高度，状态栏高度，等等，控制台输入__devtoolsconfig可以看到其对应的信息
- ./__dev__/deviceinfo.js
  设备信息，包含尺寸/像素点pixelRatio
- __dev__/jsdebug.js
  debug工具。
- ./__dev__/WAWebview.js
  渲染层底层基础库
- ./__dev__/hls.js
  优秀的视频流处理工具。
- ./__dev__/WARemoteDebug.js

[pageFrame资源](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8FpageFrame%E8%B5%84%E6%BA%90.png)

可以看到pageFrame注入的脚本与我们分析pages/index渲染层webview是一样的。正式因为pageFrame快速启动技术，就像一个工厂一样，可以快速生成webview的基础格式。在这其中pageFrame就是业务webview的模板。

### <!-- wxappcode -->
<!-- wxappcode -->占位符，前面分析渲染层代码的时候，我们见到过这些注释占位符编译后的样子
[渲染占位符](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E6%B8%B2%E6%9F%93%E6%A0%87%E8%AF%86.png)

文件中包含了所有页面的编译路径，编译WXML后生成的$gwx函数需要的参数就是这个路径。 这里之后会说。

- decodePathName
- .json配置
- .wxml编译后的$gwx函数。$gwx函数会在virtualDOM章节重点讲解。
- .wxss编译后的eval函数。

如果小程序需要打开某个页面的时候，只需要从这里提取出页面特有的这几个属性，配合pageFrame模板就可以快速生成一个新的webview。

## 跨快速启动

> 在视图层内，小程序的每一个页面都独立运行在一个页面层级上。小程序启动时仅有一个页面层级，每次调用wx.navigateTo，都会创建一个新的页面层级；相对地，wx.navigateBack会销毁一个页面层级。 对于每一个新的页面层级，视图层都需要进行一些额外的准备工作。在小程序启动前，微信会提前准备好一个页面层级用于展示小程序的首页。除此以外，每当一个页面层级被用于渲染页面，微信都会提前开始准备一个新的页面层级，使得每次调用wx.navigateTo都能够尽快展示一个新的页面。 页面层级的准备工作分为三个阶段。第一阶段是启动一个WebView，在iOS和Android系统上，操作系统启动WebView都需要一小段时间。第二阶段是在WebView中初始化基础库，此时还会进行一些基础库内部优化，以提升页面渲染性能。第三阶段是注入小程序WXML结构和WXSS样式，使小程序能在接收到页面初始数据之后马上开始渲染页面（这一阶段无法在小程序启动前执行）。

对于wx.redirectTo，这个调用不会打开一个新的页面层级，而是将当前页面层级重新初始化：重新传入页面的初始数据、路径等，视图层清空当前页面层级的渲染结果然后重新渲染页面。

这样直接使用**pageFrame和webview切换**，动画如此丝滑的原因。


我们在打开pages/logs/logs视图页面时，发现dom中多加载了一个__pageframe__/pageframe.html的视图层，其模板内容正如上方描述的。这个视图层的作用正是为了小程序提前为一个新的页面层准备的

小程序每个视图层页面内容都是通过pageframe.html模板来生成的，包括小程序启动的首页；下面来看看小程序为快速打开小程序页面做的技术优化：

- 首页启动时，即第一次通过pageframe.html生成内容后，后台服务会缓存pageframe.html模板首次生成的html内容。
- 非首次新打开页面时，页面请求的pageframe.html内容直接走后台缓存
- 非首次新打开页面时，pageframe.html页面引入的外链js资源(如上图所示)走本地缓存

注意： 没有创建页面的时候也会存在这个pageframe，首页也是由它产生的

这样在后续新打开页面时，都会走缓存的pageframe的内容，避免重复生成，快速打开一个新页面。

webview从空页面到具体页面视图的过程如下：

- 空页面地址webview加载完毕后执行事件中的reload方法，即设置webview的src为pageframe地址
- 加载完成后，设置其src为pageframe.html, 新的src内容加载完成后再次触发onLoadCommit事件但根据条件不会执行reload方法。
- pageframe.html页面在dom ready之后触发注入并执行具体页面相关的代码，此时**通过history.pushState方法修改webview的src但是webview并不会发送页面请求**。


那么小程序每个页面独有的页面内容如dom和样式等如何生成呢，这主要是利用nw.js的executeScript方法来执行一段js脚本来注入只与当前页面相关的代码，包括当前页面的配置，注入当前页的css以及当前页面的virtual dom的生成.

[pushState](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8Fpushstate.jpg)

history.pushState('','', 'http://127.0.0.1:63444/__pageframe__/pages/index/index') 这句代码的作用修改当前webview的src，因为视图层的webview的src为pageframe.html，通过这句代码将其变更为具体的页面地址。

细心的你肯定发现都是evel了，webpack devtools配置中也有一个evel，特点就是快

[alert通知](./../imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8Falert.jpg)

需要注意的是nw.js的executeScript方法注入的代码是需要时机的，需要等到视图层的初始化工作准备ready之后才行，在pageframe模板的最后一个script的内容:

可以看出此时应该是页面dom ready的一个时机，通过alert来进行通知。
在nw.js的webview中alert、prompt对应的弹框是被会阻止的，那么通过为webview绑定dialog事件来知道是那种弹框类型

```js
//在 WebView 中，JavaScript 弹出框（如 alert()、confirm() 和 prompt()）通常会被阻止。为了解决这个问题，你可以通过为 WebView 绑定 dialog 事件来获取 JavaScript 弹出框的信息，并在 Electron 中进行自定义处理
const { BrowserWindow } = require('electron');

let window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
    }
});

// 加载 WebView 页面
window.loadURL('https://example.com');

// 在 WebView 中绑定 dialog 事件
window.webContents.on('did-create-window', (childWindow) => {
    childWindow.webContents.on('dialog', (event, dialogType, message, defaultValue, callback) => {

        // 根据不同的 dialog 类型输出不同的信息
        if (dialogType === 'alert') {
            console.log(`WebView 弹出了一个提示框，内容为 ${message}`);
        } else if (dialogType === 'confirm') {
            console.log(`WebView 弹出了一个确认框，内容为 ${message}`);
        } else if (dialogType === 'prompt') {
            console.log(`WebView 弹出了一个输入框，内容为 ${message}，默认值为 ${defaultValue}`);
        }

        // 自定义处理弹出框，比如在主进程中弹出原生弹出框
        callback('你点击了确定');
    });
});

```



总结：视图页面生成的dom结构中，document.body已无pageframe.html模板中对应body中的script内容，这是因为视图层的WAWebview.js在通过virtual dom生成真实dom过程中，它会挂载到页面的document.body上，覆盖掉pageframe.html模板中对应document.body的内容。

官网有个[事件交互图](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html)

[页面切换优化](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/runtime_nav.html)

## 回答问题

- 是否会无限的创建新的webview?
  不会，最多10个
- 如何销毁？创建的丝滑动画怎么产生？
  通过pageframe进行丝滑动画，就是webview之间的动画
  销毁： wx.navigateBack则为销毁webview。
- 小程序如何快速打开一个页面渲染的？
  通过pageframe webview进行内容替换，
- 是否一个逻辑层对应一个ui层webview吗？
  是的 





