# 使用 MinIO 管理图片宽高，在 Next.js 中实现无抖动加载

在前端展示图片时，常常会遇到**布局抖动 (layout shift)** 的问题：图片未加载完成前占位不确定，加载后页面被撑开，导致用户体验很差。本文将介绍一种结合 **MinIO** 与 **Next.js** 的方案：

* 上传图片时将宽高写入元数据或数据库。
* 前端渲染前获取宽高信息，生成与原图一致的占位。
* 配合 `next/image` 实现自动压缩与优化，避免 CLS。

---

## 一、MinIO 元数据存储

MinIO 完全兼容 S3 API，支持在上传时写入自定义元数据，例如：

```bash
x-amz-meta-width: 1920
x-amz-meta-height: 1080
```

这样在前端发送 `HEAD` 请求时就能直接拿到图片的宽高信息。

### Node.js 上传示例

```js
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sizeOf from "image-size";

const s3 = new S3Client({
  endpoint: "http://127.0.0.1:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "admin123",
  },
});

const filePath = "./image.jpg";
const buffer = fs.readFileSync(filePath);
const dimensions = sizeOf(buffer);

await s3.send(new PutObjectCommand({
  Bucket: "mybucket",
  Key: "image.jpg",
  Body: buffer,
  Metadata: {
    width: String(dimensions.width),
    height: String(dimensions.height),
  },
}));
```

---

## 二、在 Next.js 中获取元数据

### 1. 简单 HEAD 请求

```js
fetch("https://cdn.example.com/mybucket/image.jpg", { method: "HEAD" })
  .then(res => {
    const width = res.headers.get("x-amz-meta-width");
    const height = res.headers.get("x-amz-meta-height");
    console.log("尺寸:", width, height);
  });
```

但这种方式需要前端提前知道 Key，对大量图片并不高效。

### 2. 封装 API 路由

在 Next.js 中写一个 API：

```js
// pages/api/image-meta.js
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "http://127.0.0.1:9000",
  region: "us-east-1",
  credentials: { accessKeyId: "admin", secretAccessKey: "admin123" },
});

export default async function handler(req, res) {
  const { key } = req.query;
  const head = await s3.send(new HeadObjectCommand({ Bucket: "mybucket", Key: key }));

  res.json({
    url: `https://cdn.example.com/mybucket/${key}`,
    width: Number(head.Metadata.width),
    height: Number(head.Metadata.height),
  });
}
```

这样前端就能直接拿到宽高：

```js
const data = await fetch("/api/image-meta?key=image.jpg").then(r => r.json());

<Image src={data.url} width={data.width} height={data.height} alt="demo" />
```

---

## 三、结合 next/image 的优化

`next/image` 会通过内部优化 API：

* 向 MinIO 请求原图。
* 使用 Sharp 转换压缩（可能转为 PNG/WebP/AVIF）。
* 浏览器最终加载优化后的版本。

可以在 `next.config.js` 配置输出格式：

```js
module.exports = {
  images: {
    domains: ["cdn.example.com"],
    formats: ["image/avif", "image/webp"],
  },
};
```

这样浏览器会优先使用 WebP/AVIF，而不是默认的 PNG。

---

## 四、批量管理图片元数据

如果图片非常多，不建议前端逐个 HEAD MinIO。推荐以下几种封装方式：

### 1. 数据库存储

上传时写入数据库：

```sql
CREATE TABLE images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(255) UNIQUE,
  url VARCHAR(500),
  width INT,
  height INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

查询时 API 可批量返回：

```js
GET /api/images?keys=a.jpg,b.jpg,c.jpg
```

### 2. JSON Manifest

用静态 JSON 保存所有图片宽高：

```json
{
  "image1.jpg": { "width": 1920, "height": 1080 },
  "image2.png": { "width": 800, "height": 600 }
}
```

前端一次拉取 manifest 即可。

### 3. 前端封装组件

写一个 `<MinioImage />` 组件：

```jsx
import { useEffect, useState } from "react";
import Image from "next/image";

export default function MinioImage({ src, alt }) {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetch(`/api/image-meta?key=${encodeURIComponent(src)}`)
      .then(res => res.json())
      .then(setMeta);
  }, [src]);

  if (!meta) {
    return <div style={{ width: 200, height: 200, background: "#eee" }} />;
  }

  return (
    <Image
      src={meta.url}
      width={meta.width}
      height={meta.height}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,..."
    />
  );
}
```

前端调用时无需关心宽高：

```jsx
<MinioImage src="image1.jpg" alt="demo" />
<MinioImage src="image2.png" alt="demo" />
```

---

## 五、性能优化建议

* **批量 API**：一次返回多个图片元数据。
* **缓存**：使用 Redis/CDN 缓存元数据或 manifest。
* **懒加载**：结合 Intersection Observer 分页加载。

---

## 六、总结

1. **上传阶段**：提取宽高，写入 MinIO 元数据或数据库。
2. **服务层**：提供 API，支持批量返回图片宽高。
3. **前端层**：封装 `<MinioImage />`，渲染时自动带宽高，避免 CLS。
4. **优化层**：利用 `next/image` 压缩转换，提升加载性能。

这样，就算有上千张图片，也能保证页面稳定、加载高效、体验良好。
