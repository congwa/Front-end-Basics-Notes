# Nginx 正确处理 index.html 缓存：避免“请清缓存”

本文聚焦一个常见但顽固的问题：单页应用（SPA）发布后用户仍看到旧版本。根因、解决方案与验证步骤如下，直击技术要点。

## 问题现象

- 发布新版本后，用户仍加载旧的 JS/CSS。
- 入口页 `index.html` 虽加了各种 no-cache 的 meta，但无效。
- 刷新、强刷都不稳定，CDN 环境更明显。

## 根因分析

- 浏览器缓存优先级：HTTP 响应头 > HTML meta。
- 典型 Nginx 配置只对静态资源（js/css/img）设置了缓存策略，却忘了为 `index.html` 添加禁止缓存的响应头。
- SPA 场景多用：
  ```
  location / { try_files $uri $uri/ /index.html; }
  ```
  若 `/index.html` 响应中没有明确的 `Cache-Control/Expires`，浏览器或 CDN 会缓存它，导致引用的仍是旧 hash 资源。

## 目标策略

- HTML（尤其是入口 `index.html`）：永不缓存，确保每次都拿最新入口。
- 带 hash 的静态资源：长期缓存 + immutable（因为内容变更会换文件名）。
- 其他静态资源（图片/字体等）：较长缓存，视业务而定。
- SPA 路由 fallback：未命中文件统一本地转发至不缓存的 `index.html`。

## 推荐的 Nginx 配置

```nginx
server {
    listen 80;
    server_name your.domain.com;            # 替换为你的域名
    root /usr/share/nginx/html;             # 替换为构建产物目录

    # 1) HTML 永不缓存（确保入口页每次都是最新）
    # try_files 内部重定向会再次匹配 location，因此精准匹配可生效
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # 可选：如果你的站点还有其他 HTML 页面，统一禁止缓存
    location ~* \\.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # 2) 带 hash 的静态资源：长期缓存 + immutable
    # 如 app.58d91471.js / styles.0bb7b510.css
    location ~* \\.[a-f0-9]{8,}\\.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # 3) 其他静态资源（图片/字体等）：较长缓存
    location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|otf)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
    }

    # 4) SPA 路由：未命中文件时回退到 index.html（该 index.html 已被上面规则禁止缓存）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

要点：

- 使用 `always` 让 304 等非 200 响应也携带缓存头。
- hash 长度用 `{8,}` 更兼容不同构建工具。
- `try_files` 最后参数为 URI 时会触发内部重定向，因此 `location = /index.html` 能命中。

## CDN 策略对齐

在 CDN 控制台配置“遵循源站 Cache-Control/Expires”。参考建议：

- `*.html`：TTL 0 秒，遵循源站。
- `*.[hash].js` / `*.[hash].css`：TTL 1 年，遵循源站，支持 immutable。
- 图片/字体等：TTL 30 天，遵循源站。

避免在 CDN 再次覆盖源站的禁止缓存策略。

## 验证与排查

- 用 curl 验证响应头：
  ```bash
  curl -I https://your.domain.com/
  curl -I https://your.domain.com/index.html
  curl -I https://your.domain.com/app.58d91471.js
  ```
  预期：
  - `index.html` 返回 `Cache-Control: no-cache, no-store, must-revalidate`，`Expires: 0`
  - 带 hash 的 js/css 返回 `Cache-Control: public, max-age=31536000, immutable`
- 浏览器 DevTools
  - Network 里查看资源的 `Cache-Control/Expires`。
  - 关闭 “Disable cache” 后做一次普通刷新，确认行为符合预期。
- 常见坑
  - 反向代理层（如网关）覆盖了源站响应头。
  - 旧版本 Nginx 未加 `always` 时 304 未带头。
  - 服务端生成的 HTML 页未落入对应的 `location`。
  - 构建未启用文件名 hash，或入口 HTML 未引用 hash 资源。

## 发布流程建议

- 构建产物必须使用内容 hash 文件名（js/css）。
- 入口 `index.html` 每次发布都会更新，且服务端明确禁止缓存。
- CDN 清缓存仅作为紧急兜底，不依赖人工让用户清浏览器缓存。

## 结论

控制缓存的关键在源站 HTTP 响应头，而非 HTML meta。通过：

- “入口 HTML 永不缓存”
- “带 hash 静态资源长期缓存 + immutable”
- “SPA 路由 fallback 到不缓存的入口页”
  即可从根源上消除发布后用户仍看到旧版本的问题，并同时最大化缓存收益。
