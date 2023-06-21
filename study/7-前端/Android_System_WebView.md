# Android System WebView



Android 手机里的应用程序列表有「Android System WebView」这个应用程序

它是 Android 操作系统的一部分，**为应用程序开发者提供应用内部以内建浏览器来显示网络内容**而无需重新定向到网页浏览器，并且提供统一的浏览体验

[android_sys_webview](/study/imgs/android_sys_webview.jpg)


Android System WebView 是 Android 操作系统的关键组件，它将网络浏览器（具备准系统浏览器功能）放到应用程序内，以允许它们在不特别打开专用网络浏览器的情框下显示网页内容。 Facebook、LinkedIn、Gmail 和 推特 等主流 Android 应用程序都是通过 Android System WebView 来显示网页内容，如果你使用过上述应用程序中的任何一个，则至少都体验过一次 Android System WebView，只是你自己并不知道（就是你在这些应用里点击链接后用内部浏览器开启网页的行为）


## 简史


Android 里面的 WebView 拥有悠久的历史，从推出以来经历了许多变化。 在最初的 Android 上，谷歌 将 WebView 作为 Android 操作系统的一部分导入，这表示更新 WebView 同时也必须更新操作系统，这种做法比较不实际。

这点阻碍了谷歌定期更新 WebView，因此错误修复和性能改进病没有像该有的那么频繁。

为了解决这个问题，谷歌 从 Android 5.0 Lollipop 开始将 WebView 从操作系统中分离出来已实时进行更新，用户还可以通过 Play 商店轻松安装它。

然而，当谷歌将 System WebView 组件移动到 谷歌 浏览器以简化操作时，Android 7.0 Nougat 再度发生变化。 

此前更新 System WebView 意味着更新 Chrome 浏览器，然而从 Android 10 开始，谷歌 再度把 WebView 的任务移交给 Android System WebView，它现在作为运行 Android 10 以及更新版本 Android 手机上的独立应用程序存在。


与 Android 7.0 Nougat 之前的行为非常相似，只是它现在比照 Chrome 有四个独立的推出途径：稳定版、测试版、开发者版本和 Canary 版（但除了稳定版外，其他的并不适合一般用户）。

Android System WebView 以 Chromium 为基础，该项目为 Chrome、Brave 和 Edge 等浏览器提供支持，但减去了额外的功能。


它允许应用开发人员利用在其应用内实现浏览器功能，使用最少的浏览器功能显示网页内容。 

开发人员可以根据其应用的UI样式自定义框架，使其看起来具有视觉上的一致性。 此外，谷歌还定期通过 Play 商店向 Android System WebView 推送更新，以修复错误并增强查阅网页内容的功能。


## 你应该禁用 Android System WebView 吗

如果你的设备运行 Android 7、8 或是 9，大可以安全地禁用 Android System WebView 而不需担心后果，因为 谷歌 Chrome 才是负责这些版本系统中 WebView 的执行者。

如果你的设备运行 Android 10 以上的系统，则你应该避免禁用 Android System WebView。 


 因为这么做可能会影响利用它来显示网页内容的许多应用功能，禁用后会使得某些应用程序试着开启网页链接时出现问题，导致你无法登入某些网站或无法查看网页内容。 所以，当你在造访网页出现问题时，若你已经确定 Android System WebView 是罪魁祸首，则可以试着卸载最近的更新看看是否能解决问题



## 最后

[关于webview的发展历史.....](/study/4-%E5%89%8D%E7%AB%AF%E6%9E%84%E5%BB%BA%E5%92%8C%E6%96%B0%E5%9E%8B%E6%A1%86%E6%9E%B6%E5%88%86%E6%9E%90/javascript%E8%A7%A3%E6%9E%90%E5%99%A8%E5%92%8Cwebview.md)

