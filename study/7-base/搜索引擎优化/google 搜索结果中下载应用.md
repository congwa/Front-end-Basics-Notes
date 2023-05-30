# google 搜索结果中下载应用

## 资料索引

[download-app-link-in-google-search-results](https://stackoverflow.com/questions/41714107/download-app-link-in-google-search-results)

[Google 搜索上的应用索引](https://support.google.com/googleplay/android-developer/answer/6041489?hl=en)

[在 Google 搜索中显示 iOS 应用中的内容](https://developers.google.com/search/blog/2015/05/surfacing-content-from-ios-apps-in?hl=zh-cn)

[一个视频](https://v.youku.com/v_show/id_XMTU4NDMzODAyMA==.html)

[通用链接的一个不错的作者介绍](https://zhuanlan.zhihu.com/p/22108495)


## deep link

[deep-linking](https://learn.microsoft.com/zh-cn/xamarin/xamarin-forms/app-fundamentals/deep-linking)
### ios

建议使用[通用链接](https://developer.apple.com/documentation/Xcode/allowing-apps-and-websites-to-link-to-your-content)，将用户从搜索结果、网站和其他应用直接链接到您应用中的特定内容

### android


建议使用 [Android App Links](https://developer.android.com/training/app-links?hl=zh-cn) 将用户从搜索结果、网站和其他应用直接链接到您应用中的特定内容
> android应用链接简介的内容： 由于 Android 应用链接利用的是 HTTP 网址以及与网站的关联，因此未安装您的应用的用户会直接转到您的网站中对应的内容

#### 通过为你的activity提供intent filter，可以使Google搜索展示你的app中特定的内容

[使应用内容可供 Google 搜索](https://developer.android.com/training/app-indexing?hl=zh-cn)
> 添加指向您内容的链接，并将您的应用与网站相关联。当您将 Android 应用链接添加到您的应用后，Google 可以通过您的网站关联抓取您的应用内容，并将移动设备用户从他们的搜索结果转到您的应用，从而让他们直接查看您的应用内容而不是网页

[使得你的App内容可被Google搜索](http://doc.yonyoucloud.com/doc/wiki/project/android-training-geek/app-indexing-index.html)

[为索引指定App内容](http://doc.yonyoucloud.com/doc/wiki/project/android-training-geek/enable-app-indexing.html)

#### 如果没有安装应用程序，那么打开googlepay的方式

[can-you-search-google-play-using-intent](https://stackoverflow.com/questions/13361937/can-you-search-google-play-using-intent)





## 步骤总结

[Google 搜索上的应用索引](https://support.google.com/googleplay/android-developer/answer/6041489?hl=en)

1. 建立deep link
2. 登录 Play 管理中心
3. 单击所有应用程序
4. 在左侧菜单中，单击"设置">"高级设置"
5. 在"应用索引"下，点击添加网站
6. 输入主页的 URL。我们建议省略协议（HTTP 或 HTTPS）并仅写入域名（例如"abcxyz.com"）
7. 单击发送验证请求
8. 系统会向 Search Console 中网站的所有者发送请求。如果 Play Console 和 Search Console 帐户相同，则可能会立即自动批准关联。否则
    - 如果您是 Search Console 中网站的所有者，则可以点击消息中的"接受"，然后批准请求。您还可以转到 Google Search Console 关联页面并从那里批准请求。
    - 如果您不是 Search Console 中网站的所有者，则必须等待所有者批准您的请求。

### 案例

![google搜索结果](/study/imgs/google%E6%90%9C%E7%B4%A2%E6%95%88%E6%9E%9C.jpg)
