# BroadcastChannel

BroadcastChannel 接口代理了一个命名频道，可以让指定 origin 下的任意 browsing context 来订阅它。它允许同源的不同浏览器窗口，Tab 页，frame 或者 iframe 下的不同文档之间相互通信。通过触发一个 message 事件，消息可以广播到所有监听了该频道的 BroadcastChannel 对象。

> 此特性在 Web Worker 中可用



```js
// 发送方
// 创建 BroadcastChannel，参数是频道的名称，所有希望通信的窗口都应使用相同的频道名称
const channel = new BroadcastChannel('myChannel');

// 发送消息
channel.postMessage('Hello from the sender!');

// 关闭频道（不再需要时）
// channel.close();


// 接受方
// 创建 BroadcastChannel，同样使用相同的频道名称
const channel = new BroadcastChannel('myChannel');

// 监听消息
channel.onmessage = (event) => {
  console.log('Received message:', event.data);
};

// 关闭频道（不再需要时）
// channel.close();

```