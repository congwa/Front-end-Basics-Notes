# google 搜索结果中下载应用

## 资料索引

[download-app-link-in-google-search-results](https://stackoverflow.com/questions/41714107/download-app-link-in-google-search-results)

[Google 搜索上的应用索引](https://support.google.com/googleplay/android-developer/answer/6041489?hl=en)

[在 Google 搜索中显示 iOS 应用中的内容](https://developers.google.com/search/blog/2015/05/surfacing-content-from-ios-apps-in?hl=zh-cn)


## deep link

### ios

建议使用[通用链接](https://developer.apple.com/documentation/Xcode/allowing-apps-and-websites-to-link-to-your-content)，将用户从搜索结果、网站和其他应用直接链接到您应用中的特定内容

### android

建议使用 [Android App Links](https://developer.android.com/training/app-links?hl=zh-cn) 将用户从搜索结果、网站和其他应用直接链接到您应用中的特定内容


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
