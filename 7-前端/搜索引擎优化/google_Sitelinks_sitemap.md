# 站点地图

## 地图 sitemap

[站点地图协议- sitemaps](https://www.sitemaps.org/protocol.html)
[google cn sitemaps](https://developers.google.cn/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)
[sitemaps 知乎](https://zhuanlan.zhihu.com/p/472110038)


## links

[google sitelinks](https://zhuanlan.zhihu.com/p/431085760?utm_source=wechat_session&utm_medium=social&s_r=0)

[sitelinks规则](https://www.zhihu.com/question/41938880/answer/2681118583?utm_id=0)


## robots

- nextjs中添加站点地图
[https://leerob.io/blog/nextjs-sitemap-robots](https://leerob.io/blog/nextjs-sitemap-robots)



## sitemap编写规则


```xml
<url>
  <loc>https://example.com/page1.html</loc>
  <lastmod>2022-05-01T19:02:13+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

- `<loc>`包含页面的 URL 地址。
- `<lastmod>`指定了页面上一次修改的时间和日期。格式为 ISO 8601 格式。
- `<changefreq>`指定了页面内容更新的频率。
    changefreq 是站点地图 XML 元素的一个可选属性，用于提供页面内容更新的频率提示，以帮助搜索引擎更好地了解网站页面的改变频率。该属性标记不影响索引的方式，但可以为搜索引擎提供有关检查页面更新的建议。

    在站点地图 XML 中使用 changefreq 属性时，您可以将其设置为以下任何一个常见值：

    always：页面内容每次访问都会发生更改。
    hourly：页面内容每小时都会发生更改。
    daily：页面内容每天至少会发生一次更改。
    weekly：页面内容每周至少会发生一次更改。
    monthly：页面内容每月至少会发生一次更改。
    yearly：页面内容每年至少会发生一次更改。
    never：页面内容永远不会更改。

- `<priority>`指定了页面相对于其他页面的优先级
    priority的值应该在0.0和1.0之间，并且可以有一位小数。默认值为0.5，这意味着所有页面的权重相等。如果对于某些页面，您认为它们比其他页面更重要，则可以将其优先级设置为更高的数字（例如0.8或更高），而对于不那么重要的页面则可以将其设置为更低的数字（例如0.3或更低）。
    尽管priority标记可以对搜索引擎产生一定的影响，但它通常被视为一个辅助信号，与其他类型的标记（如title和description）相比，其影响较小。
