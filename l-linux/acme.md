# acme.sh

## 安装

```sh
curl  https://get.acme.sh | sh -s email=my@example.com

git clone https://github.com/acmesh-official/acme.sh.git
cd ./acme.sh
./acme.sh --install -m my@example.com
```

## 颁发证书 - http方式

```sh
# -d 需要签名的域名
# -w 在验证域名的所有权时，具体来说，acme.sh会在网站的根目录下创建.well-known目录，然后再在其中生成验证文件。因此，-w参数指定的路径实际为域名之下，/.well-known位置对应的路径。用与验证此域名是属于你的。
acme.sh --issue -d test.ywbj.cc -w /www/test.ywbj.cc

```

如果有多个域名，同一个证书中的多个域

```sh
acme.sh --issue -d example.com -d www.example.com -d cp.example.com -w /home/wwwroot/example.com
```

安装证书时，已经自动在crontab定时任务添加了任务。

crontan -l查看定时任务，可以看到acme.sh的定时任务。

```sh
crontan -l

# 2 0 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```


## 颁发证书 -- dns

这种方式的好处是, 你不需要任何服务器, 不需要任何公网 ip, 只需要 dns 的解析记录即可完成验证. 

坏处是，如果不同时配置 `Automatic DNS API`（就是在域名添加一个 TXT 记录等，提供api密钥，拿到 dns 的解析记录，来验证您对域名的控制权），使用这种方式 acme.sh 将无法自动更新证书，每次都需要手动再次重新解析验证域名所有权。

```sh
# 单个域名
acme.sh --issue -d test.ywbj.cc -w /www/test.ywbj.cc

# 多个域名
acme.sh --issue -d example.com -d www.example.com -d cp.example.com -w /home/wwwroot/example.com

```

## 更新证书

```sh
#强制更新证书：
acme.sh --renew -d example.com --force

#或者，对于 ECC 证书：
acme.sh --renew -d example.com --force --ecc
```

要停止更新证书，您可以执行以下操作从更新列表中删除证书：

```sh
acme.sh --remove -d example.com [--ecc]
```

证书/密钥文件不会从磁盘中删除。

您可以自己删除相应的目录（例如~/.acme.sh/example.com）。





## 泛域名

```sh
# 泛域名申请
acme.sh --install-cert -d example.com \
--key-file       /path/to/keyfile/in/nginx/key.pem  \
--fullchain-file /path/to/fullchain/nginx/cert.pem \
--reloadcmd     "service nginx force-reload"

```

```conf
server {
    listen 443 ssl;
    server_tokens off;
    keepalive_timeout 5;
    index index.php index.html;
    server_name *.myDomain.com; #填写您的证书绑定的域名
    ssl_certificate fullchain.pem; #填写您的证书文件名称
    ssl_certificate_key *.myDomain.com.pem; #填写您的私钥文件名称
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;  # 可参考此 SSL 协议进行配置
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;   #可按照此加密套件配置，写法遵循 openssl 标准
    ssl_prefer_server_ciphers on;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }
}

server {
    listen 80;
    server_name *.myDomain.com;
    #rewrite ^(.*)$ https://$host:443$1 permanent;
    return 301 https://$http_host$request_uri;
}
```


如果需要自动续期，可以查看一下`acme.sh`有没有自动创建定时任务，如果没有，需要自己手动创建一下