# js沙箱的几种实现方式

## 1. with + new Function 实现沙箱

```js
function createSandbox(code) {
  // 创建一个空对象，用作沙箱环境中的全局对象
  const sandbox = {};
  // 使用with语句将代码的作用域设置为这个空对象
  // 使用new Function创建一个新的函数，限制代码访问外部作用域，只能访问sandbox内的变量和函数
  const script = new Function("sandbox", `with(sandbox) { ${code} }`);
  // 执行这个函数，并传入sandbox作为参数
  return function () {
    script(sandbox);
  };
}

// 使用沙箱环境
const sandboxedScript = createSandbox(
  'console.log("Hello from the sandbox!"); var x = 10;'
);
sandboxedScript(); // 输出: Hello from the sandbox!
console.log(typeof x); // 输出: undefined，因为x是在沙箱内部定义的，外部访问不到

```

## 2. iframe

```js
// index.js
function createSandbox(callback) {
  const iframe = document.getElementById("sandbox");
  if (!iframe) {
    return console.error("沙箱iframe未找到");
  }

  // 确保iframe完全加载后再执行代码
  iframe.onload = function () {
    const iframeWindow = iframe.contentWindow;

    // 在沙箱环境中定义一些安全的全局变量或函数，如果需要的话
    iframeWindow.safeGlobalVar = {
      /* 安全的数据或方法 */
    };

    // 执行回调函数，传入沙箱的window对象，以便在其中执行代码
    callback(iframeWindow);
  };

  // 重新加载iframe以确保环境清洁
  iframe.src = "about:blank";
}

// 使用沙箱
createSandbox(function (sandboxWindow) {
  // 在沙箱环境中执行代码
  sandboxWindow.eval('console.log("Hello from the sandbox!");');
});

```

HTML5 引入了 sandbox 属性，它可以限制 iframe 中代码的能力。sandbox 属性可以采用以下值：

1. allow-scripts: 允许执行脚本。
2. allow-same-origin: 允许与包含文档同源的文档交互。
3. allow-forms: 允许表单提交。
4. allow-popups: 允许弹窗，比如通过 window.open 方法。
5. allow-top-navigation: 允许通过链接导航到顶级框架。

```html
<iframe src="sandbox.html" sandbox="allow-scripts" id="sandbox"></iframe>
```

```html
<!DOCTYPE html>
<html>
  <head>
    <title>主页面</title>
  </head>
  <body>
    <iframe
      src="./sandbox.html"
      id="sandbox"
      style="width: 600px; height: 400px"
    ></iframe>

    <script>
      var iframe = document.getElementById("sandbox");

      // 等待iframe加载完成
      iframe.onload = function () {
        // 向iframe发送消息
        var targetOrigin = "http://127.0.0.1:5500/"; // 替换为iframe的实际源
        iframe.contentWindow.postMessage("Hello, sandbox!", targetOrigin);
      };

      // 监听来自iframe的消息
      window.addEventListener("message", function (event) {
        // 检查消息来源是否符合预期

        if (event.origin !== "http://127.0.0.1:5500") {
          return; // 来源不匹配时忽略消息
        }

        // 处理接收到的消息
        console.log("Received message from iframe:", event.data);
      });
    </script>
  </body>
</html>
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <script>
      window.addEventListener("message", function (event) {
        // 检查消息来源是否符合预期

        if (event.origin !== "http://127.0.0.1:5500") {
          return; // 来源不匹配时忽略消息
        }

        // 处理接收到的消息
        console.log("Received message:", event.data);

        // 回复消息给主页面
        event.source.postMessage("Hello, main page!", event.origin);
      });
    </script>
  </body>
</html>

```

## 3. Web Workers 实现沙箱

```js
function workerSandbox(appCode) {
  var blob = new Blob([appCode]);
  var appWorker = new Worker(window.URL.createObjectURL(blob));
}

workerSandbox("const a = 1;console.log(a);"); // 输出1

console.log(a); // a not defined

```

使用 Web Workers 作为沙箱的方法，通过动态创建一个 Blob 对象来包含你想在 Worker 中执行的 JavaScript 代码，然后使用这个 Blob 对象创建一个 Worker。这种方式的好处是它允许你动态地执行任意的 JavaScript 代码，同时确保这些代码在一个与主页面环境隔离的 Worker 中运行，提供了一种隔离执行代码的手段。
