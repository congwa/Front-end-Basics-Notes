# 谷歌搜索中心

[搜索中心地址- 传送门](https://developers.google.cn/search/docs)



## 百度站长工具

[百度站长工具](https://ziyuan.baidu.com/college/courseinfo?id=267&page=3)

## 360sitemaps

[360sitemaps - 传送门](http://www.so.com/help/help_3_3.html) 


## seo优化路线

### 1. title、description、keywords

```jsx
  <title>{metaTitle}</title>
  <meta name="description" content={metaDescription} key="description" />
  <meta name="keywords" content={metaKeywords} key="keywords" />
```

### 2. openGraph

Open Graph 是一种用于在社交媒体平台上自定义内容展示的协议，最初由 Facebook 提出。该命名空间声明用于标识 Open Graph 协议中的一些元标签（Meta Tags）

```jsx
      <meta name="twitter:card" content="summary" />

      {metaSocial &&
        metaSocial.find((item) => item.socialNetwork == 'Twitter') && (
          <>
            <meta
              data-hid="twitter:title"
              name="twitter:title"
              property="twitter:title"
              content={item.title}
            />
            <meta
              data-hid="twitter:description"
              name="twitter:description"
              property="twitter:description"
              content={item.description}
            />
            <meta
              data-hid="twitter:image"
              name="twitter:image"
              property="twitter:image"
              content={getStrapiMedia(delve(item.image, 'data.attributes.url'))}
            />
            <meta
              data-hid="twitter:image:alt"
              name="twitter:image:alt"
              property="twitter:image:alt"
              content={delve(item.image, 'data.attributes.alternativeText')}
            />
          </>
        )}

      <meta
        prefix="og: http://ogp.me/ns#"
        data-hid="og:title"
        name="og:title"
        property="og:title"
        content={metaTitle}
      />
      <meta
        prefix="og: http://ogp.me/ns#"
        data-hid="og:description"
        name="og:description"
        property="og:description"
        content={metaDescription}
      />
      <meta
        prefix="og: http://ogp.me/ns#"
        data-hid="og:image"
        name="og:image"
        property="og:image"
        content={delve(metaImage, 'data.attributes.url')}
      />
      <meta
        prefix="og: http://ogp.me/ns#"
        data-hid="og:image:alt"
        name="og:image:alt"
        property="og:image:alt"
        content={delve(metaImage, 'data.attributes.alternativeText')}
      />

```


### 3. sitemap站点地图

如下示例： `loc`表明本网站的地图

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
      <loc>https://jsonplaceholder.typicode.com/posts/1</loc>
  </url>
  <url>
      <loc>https://jsonplaceholder.typicode.com/posts/2</loc>
  </url>
</urlset>
```

### 4. robats

如下，

- index: 允许搜索引擎索引这个页面。
  - 如果`页面的内容适合搜索引擎收录`，它将被添加到搜索引擎的索引中，使得用户在搜索时能够找到这个页面。
    - **有质量的内容**：搜索引擎喜欢展示对用户有价值的内容。如果你的页面包含有用、有深度的信息，搜索引擎更有可能将其收录。
    - **关键词优化**：页面上的关键词应与用户搜索的关键词相关。搜索引擎通过分析页面的文本内容来确定它的主题和相关性。
    - **良好的页面结构**：清晰的页面结构有助于搜索引擎理解页面的内容。使用标题标签、段落和其他标记，使页面具有良好的结构。
    - **避免重复内容**：搜索引擎通常不喜欢重复的内容。确保你的页面提供独特的价值，而不是简单地复制其他页面的内容。
    - **良好的用户体验**：搜索引擎越来越关注用户体验。如果你的页面加载速度快，易于导航，对用户友好，搜索引擎可能更愿意将其收录。
- follow: 允许搜索引擎跟踪页面上的链接。
- noindex: 不允许搜索引擎索引这个页面。
- nofollow: 不允许搜索引擎跟踪页面上的链接。

```xml
<meta name="robots" content="index, follow" />
```

### 5. robats.text

为了指定`站点地图`的位置

```xml
User-agent: *
Sitemap: https://leerob.io/sitemap.xml
```

### 6. 结构化数据 (如有需要)

如下例子，这个例子中，@type: "NewsArticle" 表示这是一篇新闻文章，然后提供了文章的标题、发布日期、作者、描述等信息。这使得搜索引擎能够更好地理解这篇文章的内容，并在`搜索结果中以更丰富的方式显示`。

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Page Title",
  "image": "https://example.com/image.jpg",
  "datePublished": "2023-01-01T12:00:00Z",
  "author": {
    "@type": "Person",
    "name": "John Doe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example News",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.jpg"
    }
  },
  "description": "Page description."
}
</script>

```

- 如需要更多的结构化数据说明，[在谷歌的搜索引擎指引上面有明确的说明](https://developers.google.cn/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)

- 同时也可以看我这篇[总结](/study/7-前端/结构化数据.md)
- 在next.js中，[构建的时候生成站点地图](/study/7-前端/google_Sitelinks_sitemap.md)教程, 只适用于可预测页面数量的项目，不适用于基于动态数据库填充的cms项目，如果要做到可以使用定时任务等手段，动态扫描库，重新生成站点地图，同时也可以在write逻辑的时候进行直接生成站点地图。
- facebook的[openGraph文档](https://ogp.me/)