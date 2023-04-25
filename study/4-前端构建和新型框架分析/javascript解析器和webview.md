# javascript解析器与webview

跨端的主要开发方向就是两个

- 虚拟机
    虚拟机提供了跨端执行代码的能力
    现在主流的js Engine就是苹果的JavaScriptCore和谷歌的V8
- 渲染引擎
    把跨端执行的代码计算所产生的用户数据通过渲染引擎处理，，最后是把相关图元信息通过各种图形 API（OpenGL/Metal/Vulkan/DirectX）发给 GPU 进行渲染


## javascript解析器

CPU 只认识自己的指令集，指令集对应的是汇编代码。写汇编代码是一件很痛苦的事情。并且不同类型的 CPU 的指令集是不一样的，那就意味着需要给每一种 CPU 重写汇编代码。
JavaScript 引擎可以将 JS 代码编译为不同 CPU(Intel, ARM 以及 MIPS 等)对应的汇编代码，这样我们就不需要去翻阅每个 CPU 的指令集手册来编写汇编代码了。当然，JavaScript 引擎的工作也不只是编译代码，它还要负责执行代码、分配内存以及垃圾回收。

要让计算机执行一段高级语言通常有两种手段：

- 第一种是将高级代码转换为二进制代码，再让计算机去执行；
  > 而编译执行启动速度慢，但是执行速度快。
- 另外一种方式是在计算机安装一个解释器，并由解释器来解释执行。
  > 解释执行启动速度快，但是执行时速度慢，

很早之前，所有的 JavaScript 虚拟机所采用的都是解释执行的方式，这是 JavaScript 执行速度过慢的一个主要原因

JavaScript 引擎就本质上是一个虚拟机，集成以上两种方式
- Parser：负责将 JavaScript 源码转换为 Abstract Syntax Tree (AST)
- Ignition：interpreter(解析器) - 负责将 AST 转换为 Bytecode，解释执行 Bytecode；同时收集 TurboFan 优化编译所需的信息，比如函数参数的类型；解释器执行时主要有四个模块，内存中的字节码、寄存器、栈、堆
  - 基于栈 (Stack-based) - 基于栈的解释器使用栈来保存函数参数、中间运算结果、变量等；
  - 基于寄存器 (Register-based) - 基于寄存器的虚拟机则支持寄存器的指令操作，使用寄存器来保存参数、中间计算结果。
  通常，基于栈的虚拟机也定义了少量的寄存器，基于寄存器的虚拟机也有堆栈，其区别体现在它们提供的指令集体系。大多数解释器都是基于栈的，比如 Java 虚拟机，.Net 虚拟机，还有早期的 V8 虚拟机。基于堆栈的虚拟机在处理函数调用、解决递归问题和切换上下文时简单明快。而现在的 V8 虚拟机则采用了基于寄存器的设计，它将一些中间数据保存到寄存器中。
  ![寄存器](https://img2020.cnblogs.com/blog/1158910/202101/1158910-20210126214100095-1330221930.png)
- TurboFan：compiler，即编译器。 利用 Ignition 所收集的类型信息，将 Bytecode 转换为优化的汇编代码；
- Orinoco：garbage collector，垃圾回收模块
  负责将程序不再需要的内存空间回收。

其中，Parser，Ignition 以及 TurboFan 可以将 JS 源码编译为汇编代码。
  Parser 将 JS 源码转换为 AST，然后 Ignition 将 AST 转换为 Bytecode，最后 TurboFan 将 Bytecode 转换为经过优化的 Machine Code(实际上是汇编代码)
  对于 JavaScript 来说，我们可以直接执行源码(比如：node test.js)，它是在运行的时候先编译再执行，这种方式被称为即时编译(Just-in-time compilation)，简称为 JIT。


### V8

  V8 最早被开发用以嵌入到 Google 的开源浏览器 Chrome 中，第一个版本随着第一版Chrome于 2008 年 9 月 2 日发布.
但是 V8 是一个可以独立运行的模块，完全可以嵌入到任何 C ++应用程序中。 Node.js( 一个异步的服务器框架，可以在服务端使用 JavaScript 写出高效的网络服务器 ) 就是基于 V8 引擎的，Couchbase, MongoDB 也使用了 V8 引擎。

  V8 会编译 / 执行 JavaScript 代码，管理内存，负责垃圾回收，与宿主语言的交互等。通过暴露宿主对象 ( 变量，函数等 ) 到 JavaScript，JavaScript 可以访问宿主环境中的对象，并在脚本中完成对宿主对象的操作。

#### v8编译策略

- 如果函数没有被调用，则 V8 不会去编译它。
- 如果函数只被调用 1 次，则 Ignition 将其编译 Bytecode 就直接解释执行了。TurboFan 不会进行优化编译，因为它需要 Ignition 收集函数执行时的类型信息。这就要求函数至少需要执行 1 次，TurboFan 才有可能进行优化编译。
- 如果函数被调用多次，则它有可能会被识别为热点函数，且 Ignition 收集的类型信息证明可以进行优化编译的话，这时 TurboFan 则会将 Bytecode 编译为 Optimized Machine Code（已优化的机器码），以提高代码的执行性能。
  

#### Deoptimization

  ![编译流程](https://img2020.cnblogs.com/blog/1158910/202101/1158910-20210126214314352-2033907141.png)
   图片中的红色虚线是逆向的，也就是说Optimized Machine Code 会被还原为 Bytecode，这个过程叫做 Deoptimization。

  ```js
    function add(x, y) {
      return x + y;
    }
    add(3, 5);
    add('3', '5');
  ```

  这是因为 Ignition 收集的信息可能是错误的，比如 add 函数的参数之前是整数，后来又变成了字符串。生成的 Optimized Machine Code 已经假定 add 函数的参数是整数，那当然是错误的，于是需要进行 Deoptimization。

#### WebAssembly
v8直接支持
  

#### 引入JIT

  V8 率先引入了即时编译（JIT）的双轮驱动的设计（混合使用编译器和解释器的技术）
  >这是一种权衡策略，混合编译执行和解释执行这两种手段，给 JavaScript 的执行速度带来了极大的提升
  >V8 也是早于其他虚拟机引入了惰性编译、内联缓存、隐藏类等机制，进一步优化了 JavaScript 代码的编译执行效率。
  ![v8执行图](https://img2020.cnblogs.com/blog/1158910/202101/1158910-20210126214940344-1324215680.png)

  V8为了充分地利用解释执行和编译执行的优点，规避其缺点：
  V8 采用了一种权衡策略，在启动过程中采用了解释执行的策略，但是如果某段代码的执行频率超过一个值，那么 V8 就会采用优化编译器将其编译成执行效率更加高效的机器代码。

#### v8解析一段代码的流程
  V8 执行一段 JavaScript 代码所经历的主要流程包括：
（1）初始化基础环境；

（2）解析源码生成 AST 和作用域；

（3）依据 AST 和作用域生成字节码；

（4）解释执行字节码；

（5）监听热点代码；

（6）优化热点代码为二进制的机器代码；

（7）反优化生成的二进制机器代码。

#### IT-less V8
 V8 在 2019 年推出了 JIT-less V8，也就是关闭 JIT 只使用 Ignition interpreter 解释执行 JS 文件，那么我们在 iOS 上集成 V8 就成了可能，因为 Apple 还是支持接入只有解释器功能的虚拟机引擎的。但是个人认为关闭了 JIT 的 V8 接入 iOS 价值不大，因为只开启解释器的话，这时候的 V8 和 JSC 的性能其实是差不多的，引入反而会增加一定的体积开销。

#### 堆快照（Heap snapshots)
V8 在 2015年就支持堆快照（Heap snapshots,

一般来说 JSVM 启动后，第一步往往是解析 JS 文件，这个还是比较耗时的，V8 支持预先生成 Heap snapshots，然后直接加载到堆内存中，快速的获得 JS 的初始化上下文。跨平台框架 NativeScript[8] 就利用了这样的技术，可以让 JS 的加载速度提升 3 倍
![堆快照](https://img-blog.csdnimg.cn/img_convert/b3c99e698bc313662f2f2705d7ed912d.webp?x-oss-process=image/format,png)

V8 也是早于其他虚拟机引入了惰性编译、内联缓存、隐藏类等机制，进一步优化了 JavaScript 代码的编译执行效率。

### javascriptCore -jsCore

  JavaScriptCore 是 WebKit 默认的内嵌 JS 引擎， JavaScriptCore 的 JIT 功能其实比 V8 还要早。

  在 iOS7 之后，JSC 作为一个系统级的 Framework 开放给开发者使用，果你的 APP 使用 JSC，只需要在项目里 import 一下，包体积是 0 开销的！

  虽然开启 JIT 的 JSC 性能很好，但是只限于苹果御用的 Safari 浏览器和 WKWebView，只有这两个地方 JIT 功能才是默认开启的

  Apple 出于安全上的考虑，禁止了第三方 APP 使用 JSC 时开启 JIT

  JSC 并没有对 Android 机型做很好的适配，虽然可以开启 JIT，但是性能表现并不好

  JSC 的调试支持情况。如果是 iOS 平台，我们可以直接用 Safari 的 debbuger 功能调试，

  综合来看，JavaScriptCore 在 iOS 平台上有非常明显的主场优势，各个指标都是很优秀的，但在 Android 上因为缺乏优化，表现并不是很好。

### Hermes

Hermes 是 FaceBook 2019 年中旬开源的一款 JS 引擎, 专为 React Native 打造的 JS 引擎，可以说从设计之初就是为 Hybrid UI 系统打造
Hermes 一开始推出就是要替代原来 RN Android 端的 JS 引擎，即 JavaScriptCore（因为 JSC 在 Android 端表现太拉垮了）。

#### 特点

- 不支持 JIT
- 支持直接生成/加载字节码

Hermes 不支持 JIT 的主要原因有两个：加入 JIT 后，JS 引擎启动的预热时间会变长，一定程度上会加长首屏 TTI（页面首次加载可交互时间），现在的前端页面都讲究一个秒开，TTI 还是个挺重要的测量指标。另一个问题上 JIT 会增加包体积和内存占用，Chrome 内存占用高 V8 还是要承担一定责任的。

因为不支持 JIT，Hermes 在一些 CPU 密集计算的领域就不占优势了，所以在 Hybrid 系统里，最优的解决方案就是充分发挥 JavaScript 胶水语言的作用，CPU 密集的计算（例如矩阵变换，参数加密等）放在 Native 里做，算好了再传递给 JS 表现在 UI 上，这样可以兼顾性能和开发效率。

Hermes 最引人瞩目的就是支持生成字节码，Hermes 加入 AOT 后，Babel、Minify、Parse 和 Compile 这些流程全部都在开发者电脑上完成，直接下发字节码让 Hermes 运行就行

首先省去了在 JS 引擎里解析编译的流程，JS 代码的加载速度将会大大加快，体现在 UI 上就是 TTI 时间会明显缩短；另一个优势 Hermes 的字节码在设计时就考虑了移动端的性能限制，支持增量加载而不是全量加载，对内存受限的中低端 Android 机更友好；不过字节码的体积会比原来的 JS 文件会大一些，但是考虑到 Hermes 引擎本身体积就不大，综合考虑下来这些体积增量还是可以接受的。

#### JS语法支持情况

Hermes 主要支持的是 ES6 语法，刚开源时不支持 Proxy，不过 v0.7.0[18] 已经支持了。他们的团队也比较有想法，不支持 with eval() 等这种属于设计糟粕的 API


### QuickJS

Fabrice Bellard这个大佬开发的。 FFmpeg，TinyGL，QEMU，Jslinux都是他开发的，真实的大佬，靠一个人改变了这个世界。

QuickJS 体积非常小，JS 语法支持到 ES2020，Test262 的测试显示QuickJS 的语法支持度比 V8 还要高。
> 代码支持度这个要具体看作者的维护速度，要去开源社区看一下目前的状态。

- 开启 JIT 的 V8 综合评分差不多是 QuickJS 的 35 倍
- 在内存占用上，QuickJS 远低于 V8，毕竟 JIT 是是吃内存的大户，而且 QuickJS 的设计对嵌入式系统很友好
- QuickJS 和 Hermes 的跑分情况是差不多的
  
QuickJS 是一款潜力非常大的 JS 引擎，在 JS 语法高度支持的前提下，还把性能和体积都优化到了极致。在移动端的 Hybrid UI 架构和游戏脚本系统都可以考虑接入


## webview

### UIWebView

ios2到ios8使用，在IOS13废弃，2020年4月起App Store将不再接受使用UIWebView的app上架，同年12月不再允许更新。

### WebKit

由 Apple 率先开源，WebKit 引擎运用在 Apple 自家的 Safari 浏览器和 WebView 上。
2008年6 月 2 日，WebKit 项目改造成SquirrelFish Extreme（缩写为 SFX，市场名称为 Nitro ）

谷歌之前一直是WebKit 代码库的最大贡献者，2013 年 4 月 3 日，Google 宣布将 WebKit 里的 渲染引擎WebCore 的其中一个分支，命名为Blink，Blink引擎打造了自己的渲染引擎及V8 JavaScript 引擎，而Blink其实就是Chromium整体的一部分


- 内部集成WebCor渲染引擎
- JS引擎为JavaScriptCore
#### 使用度
- android4.4之前使用的是webkit
- 在苹果上一直使用

### WKWebView

基于webkit封装ios8开始使用

- 内部集成JavaScriptCore
- 采用跨进程方案  
- Nitro JS解析器，60fps的刷新率，性能和safari比肩，对h5实现了高度支持  
- 内存开销更小 
- 内置手势
- 支持更多h5特性  
- 提供常用的属性，如加载网页进度的属性

### Blink 引擎
2013 年 4 月 3 日，Google 宣布将 WebKit 里的 渲染引擎WebCore 的其中一个分支，命名为Blink，Blink引擎打造了自己的渲染引擎及V8 JavaScript 引擎
Chromium，而Blink其实就是Chromium整体的一部分



### Mobile Chromium

- XWeb 引擎使用它
  

### Chromium
Chromium是一个免费的开源软件项目，一直由谷歌维护。Chromium 为Google Chrome提供了绝大多数源代码，因此 Google 选择了“Chromium”这个名称。可以理解为 Chromium + 集成 Google 产品 = Google Chrome
- 使用blink引擎
- 使用v8虚拟机
- 在android4.4以上进行使用

> 如果你想查看自己的Android System WebView版本，可以打开开发者模式，在开发者选项里看到 WebView implementation，这些版本 ID 与 Android 版 Google Chrome 的版本 ID 相同

以上Chromium、WKWebView、UIWebView、 Mobile Chromium 就是我们常说的webview，为了让其他人听的明白，直接根据它们的特性，统一叫他们webview

- 注意,如QQ浏览器、UC浏览器、Chrome浏览器等，它们内置了自己的内核或者将别家的内核加以改造，和安卓内WebView并没有什么关系。
- 注意,但是某些安装包很小的浏览器，如旗鱼浏览器（点此下载），via浏览器、神奇浏览器等，他们通过直接调用安卓系统内自带的webview来浏览网页。
- 注意,微信小程序的webview，在 Android 上，小程序逻辑层的 JavaScript 代码运行在 V8 中，视图层是由基于 Mobile Chromium 内核的微信自研 XWeb 引擎来渲染的,在 iOS、iPadOS 和 Mac OS 上，小程序逻辑层的 JavaScript 代码运行在 JavaScriptCore 中，视图层是由 WKWebView 来渲染的，环境有 iOS 14、iPad OS 14、Mac OS 11.4 等 [传送门](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/env.html)
- 注意,Electron 和 WebView2 都是从 Chromium 源代码构建的，WebView2 是从 Edge 源构建的，Edge 构建于 Chromium 源的一个分支上。 Electron 不与 Chrome 共享任何 DLL。 WebView2 的二进制文件与 Edge 硬链接(Edge 90 的稳定版本)，因此他们共享磁盘和一些工作集 [传送门](https://www.electronjs.org/zh/blog/webview2)

