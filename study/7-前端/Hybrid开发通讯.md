# 混合开发通讯

混合开发是APP的主流开发模式——NATIVE+H5

## h5单向往APP中通讯

可以使用 URL Scheme协议进行通讯，但是受请求体数据大小的限制，而且需要url编码一下。


## 双向通讯 

我们常见的方式webview就是android的基于chromium的安卓的webview，和基于webkit的ios上面的WKWebview,它们统称webview，我们的网页就是嵌入在这个里面的。

如果你对这种技术细节感兴趣，看我这个总结

- [微信小程序也是基于webview的，我这里有小程序组成原理的详细介绍，包括它的优化点](/study/d-%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F/),也同时总结了借助 Native 加强 Web 怎么办？和JSBridge 只是解决了 Native 和 Web 的互相调用的问题？
- [webview的前世今生的组成方式，是如何发展到我们现在这个样子的](/study/4-%E5%89%8D%E7%AB%AF%E6%9E%84%E5%BB%BA%E5%92%8C%E6%96%B0%E5%9E%8B%E6%A1%86%E6%9E%B6%E5%88%86%E6%9E%90/javascript%E8%A7%A3%E6%9E%90%E5%99%A8%E5%92%8Cwebview.md),看我这个文章


---


### jsBridge进行双向通讯



它的核心是 构建 Native 和非 Native 间消息通信的通道，而且是 双向通信的通道

#### 如何实现

我们可以将这种情况与 RPC（Remote Procedure Call，远程过程调用）通信进行类比，将 Native 与 JavaScript 的每次互相调用看做一次 RPC 调用

在 JSBridge 的设计中，可以把前端看做 RPC 的客户端，把 Native 端看做 RPC 的服务器端，从而 JSBridge 要实现的主要逻辑就出现了：**通信调用**（Native 与 JS 通信） 和 **句柄解析调用**。


##### JavaScript 调用 Native

JavaScript 调用 Native 的方式，主要有两种：注入 API 和 拦截 URL SCHEME

###### 注入api

通过 WebView 提供的接口，向 JavaScript 的 Context（window）中注入对象或者方法，让 JavaScript 调用时，直接执行相应的 Native 代码逻辑，达到 JavaScript 调用 Native 的目的

对于IOS的UIWebView

```swift
JSContext *context = [uiWebView valueForKeyPath:@"documentView.webView.mainFrame.javaScriptContext"];

context[@"postBridgeMessage"] = ^(NSArray<NSArray *> *calls) {
    // Native 逻辑
};

```

前端调用的方式

```js
window.postBridgeMessage(message);
```

总结： 向js环境中注入js代码到window上，js代码的调用直接调用native的逻辑

对于 iOS 的 WKWebView 可以用以下方式：

```swift
@interface WKWebVIewVC ()<WKScriptMessageHandler>

@implementation WKWebVIewVC

- (void)viewDidLoad {
    [super viewDidLoad];

    WKWebViewConfiguration* configuration = [[WKWebViewConfiguration alloc] init];
    configuration.userContentController = [[WKUserContentController alloc] init];
    WKUserContentController *userCC = configuration.userContentController;
    // 注入对象，前端调用其方法时，Native 可以捕获到
    [userCC addScriptMessageHandler:self name:@"nativeBridge"];

    WKWebView wkWebView = [[WKWebView alloc] initWithFrame:self.view.frame configuration:configuration];

    // ... 显示 WebView
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.name isEqualToString:@"nativeBridge"]) {
        NSLog(@"前端传递的数据 %@: ",message.body);
        // Native 逻辑
    }
}
```

前端调用方式

```js
window.webkit.messageHandlers.nativeBridge.postMessage(message);
```

对于 Android 可以采用下面的方式：

```java
publicclassJavaScriptInterfaceDemoActivityextendsActivity{
private WebView Wv;

    @Override
    publicvoidonCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);

        Wv = (WebView)findViewById(R.id.webView);     
        final JavaScriptInterface myJavaScriptInterface = new JavaScriptInterface(this);    	 

        Wv.getSettings().setJavaScriptEnabled(true);
        Wv.addJavascriptInterface(myJavaScriptInterface, "nativeBridge");

        // ... 显示 WebView

    }

    publicclassJavaScriptInterface{
         Context mContext;

         JavaScriptInterface(Context c) {
             mContext = c;
         }

         publicvoidpostMessage(String webMessage){	    	
             // Native 逻辑
         }
     }
}
```

前端调用

```js
window.nativeBridge.postMessage(message);
```

这里的调用方式，可能受系统版本，webview的版本升级有所不同，但是大致的思路是类似的。你理解了这些，也方便与对端同学进行沟通。

---
##### 拦截 URL Scheme

URL Scheme： URL SCHEME是一种类似于url的链接，是为了方便app直接互相调用设计的，形式和普通的 url 近似，主要区别是 protocol 和 host 一般是自定义的，例如: qunarhy://hy/url?url=ymfe.tech，protocol 是 qunarhy，host 则是 hy。

拦截 URL SCHEME 的主要流程是：Web 端通过某种方式（例如 iframe.src）发送 URL Scheme 请求，之后 Native 拦截到请求并根据 URL SCHEME（包括所带的参数）进行相关操作。 这也是本文中**h5单向往APP中通讯**的方式

有一定缺陷

- 使用 iframe.src 发送 URL SCHEME 会有 url 长度的隐患
- 创建请求，需要一定的耗时，比注入 API 的方式调用同样的功能，耗时会较长

但是之前为什么很多方案使用这种方式呢？因为它 支持 iOS6。而现在的大环境下，iOS6 占比很小，基本上可以忽略，所以并不推荐为了 iOS6 使用这种 并不优雅 的方式。

- **注意**：有些方案为了规避 url 长度隐患的缺陷，在 iOS 上采用了使用 Ajax 发送同域请求的方式，并将参数放到 head 或 body 里。这样，虽然规避了 url 长度的隐患，但是 WKWebView 并不支持这样的方式。
- **注意**：为什么选择 iframe.src 不选择 locaiton.href ？因为如果通过 location.href 连续调用 Native，很容易丢失一些调用。

---


#### Native 调用 JavaScript

不管是 iOS 的 UIWebView 还是 WKWebView，还是 Android 的 WebView 组件，都以子组件的形式存在于 View/Activity 中

所以直接调用相应的API就可以了

Native 调用 JavaScript，其实就是执行拼接 JavaScript 字符串，从外部调用 JavaScript 中的方法，因此 JavaScript 的方法必须在全局的 window 上。（闭包里的方法，JavaScript 自己都调用不了，更不用想让 Native 去调用了）


对于 iOS 的 UIWebView

```ini
result = [uiWebview stringByEvaluatingJavaScriptFromString:javaScriptString];
```

对于 iOS 的 WKWebView

```ini
[wkWebView evaluateJavaScript:javaScriptString completionHandler:completionHandler];
```

在android中可以使用,evaluateJavascript方法实现

```java
webView.evaluateJavascript(javaScriptString, new ValueCallback<String>() {
    @Override
    publicvoidonReceiveValue(String value){

    }
});
```

---
### JSBridge 接口实现

JSBridge 的接口主要功能有两个：调用 Native（给 Native 发消息） 和 接被 Native 调用（接收 Native 消息

```js
window.JSBridge = {
    // 调用 Native
    invoke: function(msg) {
        // 判断环境，获取不同的 nativeBridge
        nativeBridge.postMessage(msg);
    },
    receiveMessage: function(msg) {
        // 处理 msg
    }
};

```

句柄解析调用 ，这点在 JSBridge 中体现为 句柄与功能对应关系。同时，我们将句柄抽象为 桥名（BridgeName），最终演化为 一个 BridgeName 对应一个 Native 功能或者一类 Native 消息。 基于此点，JSBridge 的实现可以优化为如下：

```js
window.JSBridge = {
    // 调用 Native
    invoke: function(bridgeName, data) {
        // 判断环境，获取不同的 nativeBridge
        nativeBridge.postMessage({
            bridgeName: bridgeName,
            data: data || {}
        });
    },
    receiveMessage: function(msg) {
        var bridgeName = msg.bridgeName,
            data = msg.data || {};
        // 具体逻辑
    }
};
```

---
消息都是单向的，那么调用 Native 功能时 Callback 怎么实现的？

对于 JSBridge 的 Callback ，其实就是 RPC 框架的回调机制。当然也可以用更简单的 JSONP 机制解释：
> 当发送 JSONP 请求时，url 参数里会有 callback 参数，其值是 当前页面唯一 的，而同时以此参数值为 key 将回调函数存到 window 上，随后，服务器返回 script 中，也会以此参数值作为句柄，调用相应的回调函数。

JSBridge：用一个自增的唯一 id，来标识并存储回调函数，并把此 id 以参数形式传递给 Native，而 Native 也以此 id 作为回溯的标识。这样，即可实现 Callback 回调逻辑。

```js
(function () {
    var id = 0,
        callbacks = {};

    window.JSBridge = {
        // 调用 Native
        invoke: function(bridgeName, callback, data) {
            // 判断环境，获取不同的 nativeBridge
            var thisId = id ++; // 获取唯一 id
            callbacks[thisId] = callback; // 存储 Callback
            nativeBridge.postMessage({
                bridgeName: bridgeName,
                data: data || {},
                callbackId: thisId // 传到 Native 端
            });
        },
        receiveMessage: function(msg) {
            var bridgeName = msg.bridgeName,
                data = msg.data || {},
                callbackId = msg.callbackId; // Native 将 callbackId 原封不动传回
            // 具体逻辑
            // bridgeName 和 callbackId 不会同时存在
            if (callbackId) {
                if (callbacks[callbackId]) { // 找到相应句柄
                    callbacks[callbackId](msg.data); // 执行调用
                }
            } elseif (bridgeName) {

            }
        }
    };
})();
```

最后用同样的方式加上 Native 调用的回调逻辑，同时对代码进行一些优化，就大概实现了一个功能比较完整的 JSBridge。其代码如下：

```js
(function () {
    var id = 0,
        callbacks = {},
        registerFuncs = {};

    window.JSBridge = {
        // 调用 Native
        invoke: function(bridgeName, callback, data) {
            // 判断环境，获取不同的 nativeBridge
            var thisId = id ++; // 获取唯一 id
            callbacks[thisId] = callback; // 存储 Callback
            nativeBridge.postMessage({
                bridgeName: bridgeName,
                data: data || {},
                callbackId: thisId // 传到 Native 端
            });
        },
        receiveMessage: function(msg) {
            var bridgeName = msg.bridgeName,
                data = msg.data || {},
                callbackId = msg.callbackId, // Native 将 callbackId 原封不动传回
                responstId = msg.responstId;
            // 具体逻辑
            // bridgeName 和 callbackId 不会同时存在
            if (callbackId) {
                if (callbacks[callbackId]) { // 找到相应句柄
                    callbacks[callbackId](msg.data); // 执行调用
                }
            } elseif (bridgeName) {
                if (registerFuncs[bridgeName]) { // 通过 bridgeName 找到句柄
                    var ret = {},
                        flag = false;
                    registerFuncs[bridgeName].forEach(function(callback) => {
                        callback(data, function(r) {
                            flag = true;
                            ret = Object.assign(ret, r);
                        });
                    });
                    if (flag) {
                        nativeBridge.postMessage({ // 回调 Native
                            responstId: responstId,
                            ret: ret
                        });
                    }
                }
            }
        },
        register: function(bridgeName, callback) {
            if (!registerFuncs[bridgeName])  {
                registerFuncs[bridgeName] = [];
            }
            registerFuncs[bridgeName].push(callback); // 存储回调
        }
    };
})();
```

在 Native 端配合实现 JSBridge 的 JavaScript 调用 Native 逻辑也很简单，主要的代码逻辑是：接收到 JavaScript 消息 => 解析参数，拿到 bridgeName、data 和 callbackId => 根据 bridgeName 找到功能方法，以 data 为参数执行 => 执行返回值和 callbackId 一起回传前端。

Native 调用 JavaScript 也同样简单，直接自动生成一个唯一的 ResponseId，并存储句柄，然后和 data 一起发送给前端即可。

这里有一个jsbridge的[实现](https://github.com/lzyzsd/JsBridge)，android的

这里有一个jsbridge的[实现](https://github.com/bang590/JSPatch). ios的

这里有一个使用[示例](https://github.com/beichensky/jsbridge-example)