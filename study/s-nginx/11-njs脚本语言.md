# njs

njs 是允许扩展 nginx 功能的 JavaScript 语言的子集。 njs 是根据 ECMAScript 5.1（严格模式）创建的，带有一些 ECMAScript 6 和更高版本的扩展。合规性仍在不断发展。

njs（Nginx JavaScript）是一个可嵌入 Nginx 的 JavaScript 脚本引擎，它支持使用 JavaScript 编写 Nginx 模块。

通过 njs，可以使用 JavaScript 语言编写 Nginx 配置文件中的 Access 阶段和 Content 阶段的模块逻辑，从而实现自定义的数据处理和控制流程。

njs 使用 Google V8 引擎作为 JavaScript 的解释器，并且提供了丰富的基础函数库以及与 Nginx 相关的 API，例如 ngx.say、ngx.exit 等。基于这些 API 和函数，我们可以轻松地对请求进行处理、控制流程，以及生成响应结果。

总的来说，njs 是一项非常有用的技术，它可以使开发者可以在 Nginx 中使用 JavaScript 语言编写模块，方便快捷地完成各种定制化的需求。


## 示例

以下是一个简单的 njs 示例代码，用于统计 HTTP 响应状态码的数量:

```nginx
http {
  server {
    listen 80;

    access_log /var/log/nginx/access.log combined;

    location / {
      # 使用 njs 模块处理请求
      js_content statusCount;
    }
  }

  js_include /etc/nginx/conf.d/status_count.js;
}

```

在上面的示例中，我们使用 js_include 指令引入了 /etc/nginx/conf.d/status_count.js 文件，该文件实现了对 HTTP 响应状态码的统计。下面是该 JS 文件的实现

```js
function statusCount(r) {
  // 引入 ngx_http_js_module 模块提供的 constant 定义
  const { NGX_HTTP_OK, NGX_HTTP_MOVED_TEMPORARILY, NGX_HTTP_NOT_FOUND } 
  = require('nginx/constant');

  // 定义常量对象，用于记录状态码数量
  const statusCounts = {
    [NGX_HTTP_OK]: 0,
    [NGX_HTTP_MOVED_TEMPORARILY]: 0,
    [NGX_HTTP_NOT_FOUND]: 0,
    'other': 0
  };

  // 统计状态码数量
  r.subrequest('/status', { method: 'GET' }, (res) => {
    for (const key in statusCounts) {
      if (key == 'other') continue;
      if (res.status == key) {
        statusCounts[key]++;
        break;
      }
    }

    if (!statusCounts[res.status]) {
      statusCounts['other']++;
    }

    // 输出状态码数量
    r.return(200, JSON.stringify(statusCounts));
  });
}


```


上面的代码中，定义了一个 statusCount 函数，该函数会对传入的请求对象进行处理，并使用 r.subrequest 方法发送子请求获取响应状态码，然后根据状态码数量对状态码进行统计，并输出结果。

在代码中通过 require('nginx/constant') 引入了 ngx_http_js_module 模块提供的 constant 对象。该对象包含了 Nginx 内置的一些常量，例如 NGX_HTTP_OK、NGX_HTTP_MOVED_TEMPORARILY 等，方便我们在 JavaScript 中调用。


## njs中

在 njs 中添加 3rd(第三方) 方代码时可能会出现许多问题：

- 相互引用的多个文件及其依赖项
- 现代标准语言结构

好消息是，此类问题并不是 njs 的新问题或特有问题。 JavaScript 开发人员在尝试支持具有非常不同属性的多个不同平台时每天都会遇到这些问题。有一些工具旨在解决上述问题。


- 相互引用的多个文件及其依赖关系 - 这可以通过将所有相互依赖的代码合并到一个文件中来解决。 browserify 或 webpack 等工具接受整个项目并生成包含您的代码和所有依赖项的单个文件。
- 特定于平台的 API - 您可以使用多个库以与平台无关的方式实现此类 API（但以牺牲性能为代价）。还可以使用 polyfill 方法实现特定功能。
- 现代标准语言结构 - 这样的代码可以被转译：这意味着执行一些转换，根据旧标准重写新的语言特性。例如，babel 项目可以用于此目的。

在本指南中，我们将使用两个相对较大的 npm 托管库：

- protobufjs — 用于创建和解析 gRPC 协议使用的 protobuf 消息的库
- dns-packet — 用于处理 DNS 协议数据包的库


## 环境

首先（假设 Node.js 已安装并可运行），让我们创建一个空项目并安装一些依赖项；下面的命令假设我们在工作目录中：

```bash
mkdir my_project && cd my_project
npx license choose_your_license_here > LICENSE
npx gitignore node

cat > package.json <<EOF
{
  "name":        "foobar",
  "version":     "0.0.1",
  "description": "",
  "main":        "index.js",
  "keywords":    [],
  "author":      "somename <some.email@example.com> (https://example.com)",
  "license":     "some_license_here",
  "private":     true,
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
EOF
npm init -y
npm install browserify
```

## Protobufjs

该库为 .proto 接口定义提供了一个解析器，并为消息解析和生成提供了一个代码生成器。


在此示例中，我们将使用 gRPC 示例中的 [helloworld.proto](https://github.com/grpc/grpc/blob/master/examples/protos/helloworld.proto) 文件。我们的目标是创建两条消息： HelloRequest 和 HelloResponse。我们将使用protobufjs的静态模式，而不是动态生成类，因为njs出于安全考虑不支持动态添加新功能。

接下来，安装库并根据协议定义生成实现消息编组的 JavaScript 代码：

```bash
npm install protobufjs
npx pbjs -t static-module helloworld.proto > static.js

```

这样， static.js 文件就成为了我们新的依赖，存放了我们实现消息处理所需要的所有代码。 set_buffer() 函数包含使用库创建带有序列化 HelloRequest 消息的缓冲区的代码。代码位于 code.js 文件中：

```js

var pb = require('./static.js');

// Example usage of protobuf library: prepare a buffer to send
function set_buffer(pb)
{
    // set fields of gRPC payload
    var payload = { name: "TestString" };

    // create an object
    var message = pb.helloworld.HelloRequest.create(payload);

    // serialize object to buffer
    var buffer = pb.helloworld.HelloRequest.encode(message).finish();

    var n = buffer.length;

    var frame = new Uint8Array(5 + buffer.length);

    frame[0] = 0;                        // 'compressed' flag
    frame[1] = (n & 0xFF000000) >>> 24;  // length: uint32 in network byte order
    frame[2] = (n & 0x00FF0000) >>> 16;
    frame[3] = (n & 0x0000FF00) >>>  8;
    frame[4] = (n & 0x000000FF) >>>  0;

    frame.set(buffer, 5);

    return frame;
}

var frame = set_buffer(pb);

```

为了确保它有效，我们使用节点执行代码：

```bash
node ./code.js
Uint8Array [
    0,   0,   0,   0,  12, 10,
   10,  84, 101, 115, 116, 83,
  116, 114, 105, 110, 103
]
```

您可以看到这为我们提供了一个正确编码的 gRPC 帧。现在让我们用 njs 运行它：


```bash
njs ./code.js
Thrown:
Error: Cannot find module "./static.js"
    at require (native)
    at main (native)
```

不支持模块，因此我们收到了异常。为了克服这个问题，让我们使用 browserify 或其他类似的工具。

尝试处理我们现有的 code.js 文件将导致一堆应该在浏览器中运行的 JS 代码，即加载后立即运行。这不是我们真正想要的。相反，我们希望有一个可以从 nginx 配置中引用的导出函数。这需要一些包装代码。


> 在本指南中，为了简单起见，我们在所有示例中都使用 njs cli。在现实生活中，您将使用 nginx njs 模块来运行您的代码。


load.js 文件包含将其句柄存储在全局命名空间中的库加载代码

```js
global.hello = require('./static.js');
```

此代码将替换为合并的内容。我们的代码将使用" global.hello "句柄来访问库。


接下来，我们使用 browserify 处理它，将所有依赖项放入一个文件中：

```bash
npx browserify load.js -o bundle.js -d
```

结果是一个包含我们所有依赖项的巨大文件：



```js
(function(){function......
...
...
},{"protobufjs/minimal":9}]},{},[1])
//# sourceMappingURL..............
```

为了获得最终的" njs_bundle.js "文件，我们连接" bundle.js "和以下代码：


```js
// Example usage of protobuf library: prepare a buffer to send
function set_buffer(pb)
{
    // set fields of gRPC payload
    var payload = { name: "TestString" };

    // create an object
    var message = pb.helloworld.HelloRequest.create(payload);

    // serialize object to buffer
    var buffer = pb.helloworld.HelloRequest.encode(message).finish();

    var n = buffer.length;

    var frame = new Uint8Array(5 + buffer.length);

    frame[0] = 0;                        // 'compressed' flag
    frame[1] = (n & 0xFF000000) >>> 24;  // length: uint32 in network byte order
    frame[2] = (n & 0x00FF0000) >>> 16;
    frame[3] = (n & 0x0000FF00) >>>  8;
    frame[4] = (n & 0x000000FF) >>>  0;

    frame.set(buffer, 5);

    return frame;
}

// functions to be called from outside
function setbuf()
{
    return set_buffer(global.hello);
}

// call the code
var frame = setbuf();
console.log(frame);
```



让我们使用节点运行该文件以确保它仍然有效：

```bash
node ./njs_bundle.js
Uint8Array [
    0,   0,   0,   0,  12, 10,
   10,  84, 101, 115, 116, 83,
  116, 114, 105, 110, 103
]
```

现在让我们继续njs：

```bash
 njs ./njs_bundle.js
 Uint8Array [0,0,0,0,12,10,10,84,101,115,116,83,116,114,105,110,103]
```

最后一件事是使用特定于 njs 的 API 将数组转换为字节字符串，以便 nginx 模块可以使用它。我们可以在 return frame; } 行之前添加以下代码片段：

```js

if (global.njs) {
    return String.bytesFrom(frame)
}

```

最后，我们让它工作了：

```bash

$ njs ./njs_bundle.js |hexdump -C
00000000  00 00 00 00 0c 0a 0a 54  65 73 74 53 74 72 69 6e  |.......TestStrin|
00000010  67 0a                                             |g.|
00000012

```

这是预期的结果。响应解析可以类似地实现：


```js

function parse_msg(pb, msg)
{
    // convert byte string into integer array
    var bytes = msg.split('').map(v=>v.charCodeAt(0));

    if (bytes.length < 5) {
        throw 'message too short';
    }

    // first 5 bytes is gRPC frame (compression + length)
    var head = bytes.splice(0, 5);

    // ensure we have proper message length
    var len = (head[1] << 24)
              + (head[2] << 16)
              + (head[3] << 8)
              + head[4];

    if (len != bytes.length) {
        throw 'header length mismatch';
    }

    // invoke protobufjs to decode message
    var response = pb.helloworld.HelloReply.decode(bytes);

    console.log('Reply is:' + response.message);
}
```



