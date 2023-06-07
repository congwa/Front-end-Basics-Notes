# nginx


- [nginx官方文档-传送门](https://nginx.org/en/docs/)

- ![nginx](/study/imgs/nginx.webp)

- ![nginx](/study/imgs/nginxplus.png)

- [NGINX Plus增强能力系列专题](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzUzMzk5Njc4NQ==&action=getalbum&album_id=1486464352936394755&scene=173&from_msgid=2247485266&from_itemidx=2&count=3&nolastread=1#wechat_redirect)

```nginx

  server {
        # 监听 HTTP 和 HTTPS 端口
        listen 80;
        listen 443 ssl http2;

        # 定义 server_name 这里是你的域名或ip，且支持正则匹配以及多规则匹配
        server_name example.com www.example.com;

        # server_name *.example.com www.example.*;
        # 可匹配: 1.所有以example.com为后缀的域名 2.所有以www.example为前缀的域名

        # server_name .example.com;
        # 可匹配所有以example.com为后缀的域名

        # server_name ~^www\d+\.example\.com$;
        # 以 ~ 标记为正则表达式

        # server_name ~^(www\.)?(?<domain>.+)$;
        # 允许将匹配到的 domain 值作为变量用于后面的Nginx配置

        # server_name _;
        # 用于匹配所有域名。需要注意的是，通常作为最后一个server块的匹配规则存在，但不可只使用该配置项匹配

        # 配置 SSL
        ssl_certificate /path/to/cert.crt;
        # SSL证书的路径，必须与 ssl_certificate_key 配合使用
        ssl_certificate_key /path/to/key.key;
        # SSL密钥文件的路径

        # 定义 location 区域
        location / {
        # 不带参数的url匹配规则，将匹配所有的请求url，并使用下面的配置

            # alias /data/w3/images/;
            # url别名，如果url为`/i/img.png`将被转换为`/data/w3/images/img.png`

            root /data/w3/;
            # 直接决定url的根目录，`/i/img.png`将被转换为`/data/w3/i/images/img.png`

            index  index.html index.htm;
            # 默认文档名称，当客户端请求`www.example.com`时，将默认返回`/data/w3/index.html`文件或`/data/w3/index.htm`文件
            # 如果没有文件匹配则根据其他规则处理

            try_files $uri $uri/ /index.html;
            # 在文件系统中查询文件
            # 如果$url对应的文件存在则直接返回该文件；如果不存在则返回$url/下的index.html文件；否则返回根目录下的/index.html文件

            # 开启反向代理
            proxy_pass http://backend;
            # 将请求转发至http://backend服务器处理，并返回代理服务器的响应

            # 定义反向代理头部
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            # 定义代理请求头，可以在这里对请求头做校验工作
        }

        # 配置 HTTPS 重定向
        if ($scheme != "https") {
            return 301 https://$server_name$request_uri;
        }
        # $scheme以变量形式存储请求是否为SSL，更多变量可以查看 http://nginx.org/en/docs/http/ngx_http_core_module.html#variables

        # 定义 error_page 区域
        error_page 404 /404.html;
        # 当出现404错误时，跳转至404.html

        location = /404.html {
            internal;
        }
        # 表示404页面只有当出现404错误时才会出现，并且由Nginx进行内部跳转，即使修改url也无法进入404页面
    }

    server {
        # 你可以使用多个server块来匹配多个host
        ...
    }

```

## 参考地址

[Nginx一网打尽：动静分离、压缩、缓存、黑白名单、跨域、高可用、性能优化...想要的这都有](https://juejin.cn/post/7112826654291918855#heading-15)