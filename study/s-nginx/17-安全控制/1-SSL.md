# NGINX SSL Termination

Termination 来自客户端的HTTPS流量，减轻上游Web和应用程序服务器的SSL / TLS加密的计算负载。

本部分描述了如何在NGINX和NGINX Plus上配置HTTPS服务器。


## 设置HTTPS服务器

要设置HTTPS服务器，请在服务器块中的listen指令中包含ssl参数，然后指定服务器证书和私钥文件的位置：

```nginx
server {
    listen              443 ssl;
    server_name         www.example.com;
    ssl_certificate     www.example.com.crt;
    ssl_certificate_key www.example.com.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    #...
}
```

服务器证书是公共实体，它会发送给连接到NGINX或NGINX Plus服务器的每个客户端。私钥是安全实体，并且应存储在具有受限访问权限的文件中。但是，NGINX主进程必须能够读取该文件。或者，私钥可以存储在与证书相同的文件中：

```nginx
ssl_certificate     www.example.com.cert;
ssl_certificate_key www.example.com.cert;
```

在这种情况下，重要的是限制对文件的访问。请注意，尽管在此情况下证书和密钥存储在一个文件中，但是仅向客户端发送证书。

可以使用ssl_protocols和ssl_ciphers指示客户端在建立连接时仅使用SSL / TLS的强版本和密码。

自1.9.1版本以来，NGINX使用以下默认值：

```nginx
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_ciphers HIGH:!aNULL:!MD5;
```

在旧密码的设计中有时会发现漏洞，并且我们建议在现代NGINX配置中禁用它们（不幸的是，默认配置由于现有NGINX部署的向后兼容性而无法轻松更改）。请注意，CBC模式密码可能容易受到许多攻击的影响（特别是BEAST攻击，如CVE-2011-3389所述），我们建议不要使用SSLv3，因为POODLE攻击，除非您需要支持遗留客户端。


## OCSP验证客户端证书

NGINX可以配置为使用在线证书状态协议（OCSP）检查提交的X.509客户端证书的有效性。在提交时,OCSP请求客户端证书状态发送到OCSP响应器，该响应器检查证书有效性并以带有证书状态的响应返回：

* Good - 证书未吊销
* Revoked - 证书已吊销
* Unknown - 没有关于客户端证书的信息

要启用SSL客户端证书的OCSP验证，请指定ssl_ocsp指示以及启用证书验证的ssl_verify_client指示：

```nginx
server {
    listen 443 ssl;

    ssl_certificate     /etc/ssl/foo.example.com.crt;
    ssl_certificate_key /etc/ssl/foo.example.com.key;

    ssl_verify_client       on;
    ssl_trusted_certificate /etc/ssl/cachain.pem;
    ssl_ocsp                on; # 启用OCSP验证

    #...
}
```

NGINX将OCSP请求发送到嵌入在客户端证书中的OCSP URI，除非使用ssl_ocsp_responder指令定义了不同的URI。仅支持http：// OCSP响应器：

```nginx
#...
ssl_ocsp_responder http://ocsp.example.com/;
#...
```

要在所有工作进程之间共享的单个内存区域缓存OCSP响应，请使用ssl_ocsp_cache指示以定义区域的名称和大小。响应将被缓存1小时，除非OCSP响应中的nextUpdate值指定不同的值：

```nginx
#...
ssl_ocsp_cache shared:one:10m;
#...
```

客户端证书验证的结果可在$ssl_client_verify变量中使用，包括OCSP失败原因。


## HTTPS服务器优化

SSL操作会消耗额外的CPU资源。最消耗CPU资源的操作是SSL握手。有两种方法可以最小化每个客户端的这些操作次数：

* 启用keepalive连接以通过一个连接发送多个请求
* 重复使用SSL会话参数以避免针对并行和后续连接的SSL握手

会话存储在SSL会话缓存中，该缓存在工作进程之间共享，并由ssl_session_cache指示进行配置。1 MB的缓存包含约4000个会话。默认缓存超时为5分钟。可以使用ssl_session_timeout指令增加此超时时间。以下是针对具有10 MB共享会话缓存的多核系统进行优化的示例配置：

```nginx
worker_processes auto;

http {
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    server {
        listen              443 ssl;
        server_name         www.example.com;
        keepalive_timeout   70;

        ssl_certificate     www.example.com.crt;
        ssl_certificate_key www.example.com.key;
        ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        #...
    }
}
```


## SSL证书链

某些浏览器可能会投诉由著名证书颁发机构签署的证书，而其他浏览器可能会接受证书而没有问题。这是因为颁发机构已使用未包含在特定浏览器中分发的著名受信任证书颁发机构集合的中间证书签署了服务器证书。在这种情况下，该机构提供一组链接证书，应将其连接到签名的服务器证书中。服务器证书必须出现在组合文件中的链接证书之前：

```bash
cat www.example.com.crt bundle.crt > www.example.com.chained.crt

```

应在ssl_certificate指示中使用生成的文件：

```nginx
server {
    listen              443 ssl;
    server_name         www.example.com;
    ssl_certificate     www.example.com.chained.crt;
    ssl_certificate_key www.example.com.key;
    #...
}
```

如果已将服务器证书和bundle连接在错误顺序中，则NGINX无法启动并显示以下错误消息：

```nginx
SSL_CTX_use_PrivateKey_file(".../www.example.com.key") failed
   (SSL: error:0B080074:x509 certificate routines:
    X509_check_private_key:key values mismatch)
```

错误发生的原因是NGINX尝试将私钥与bundle的第一个证书一起使用，而不是与服务器证书一起使用。

浏览器通常存储它们接收到并由受信任机构签署的中间证书。因此，正在使用的浏览器可能已经具有所需的中间证书，并且可能不会抱怨没有发送链接的证书。为确保服务器发送完整的证书链，请使用openssl命令行实用程序：

```bash
openssl s_client -connect www.godaddy.com:443

...
Certificate chain
 0 s:/C=US/ST=Arizona/L=Scottsdale/1.3.6.1.4.1.311.60.2.1.3=US
     /1.3.6.1.4.1.311.60.2.1.2=AZ/O=GoDaddy.com, Inc
     /OU=MIS Department/CN=www.GoDaddy.com
     /serialNumber=0796928-7/2.5.4.15=V1.0, Clause 5.(b)
   i:/C=US/ST=Arizona/L=Scottsdale/O=GoDaddy.com, Inc.
     /OU=http://certificates.godaddy.com/repository
     /CN=Go Daddy Secure Certification Authority
     /serialNumber=07969287
 1 s:/C=US/ST=Arizona/L=Scottsdale/O=GoDaddy.com, Inc.
     /OU=http://certificates.godaddy.com/repository
     /CN=Go Daddy Secure Certification Authority
     /serialNumber=07969287
   i:/C=US/O=The Go Daddy Group, Inc.
     /OU=Go Daddy Class 2 Certification Authority
 2 s:/C=US/O=The Go Daddy Group, Inc.
     /OU=Go Daddy Class 2 Certification Authority
   i:/L=ValiCert Validation Network/O=ValiCert, Inc.
     /OU=ValiCert Class 2 Policy Validation Authority
      /CN=http://www.valicert.com//emailAddress=info@valicert.com
...
```

在这个例子中，www.GoDaddy.com服务器证书的主题（"s"）由一个签发者（"i"）签署，该签发者本身是证书#1的主题。证书#1由一个签发者签署，该签发者本身是证书#2的主题。然而，这个证书被已知的ValiCert，Inc.签发的签发者签署，其证书存储在浏览器中。

如果没有添加证书bundle，则只会显示服务器证书（#0）。

## NGINX HTTPS服务器配置

在NGINX中，可以通过设置HTTP和HTTPS监听的方式来配置单个服务器，只需要在同一个虚拟服务器中使用有ssl参数和没有ssl参数的listen指令即可。

```nginx
server {
    listen              80;
    listen              443 ssl;
    server_name         www.example.com;
    ssl_certificate     www.example.com.crt;
    ssl_certificate_key www.example.com.key;
    #...
}
```

```nginx
http {
    server {
        listen              443;
        server_name         example.com;

        # ssl指令
        ssl                 on;
        ssl_certificate     /path/to/cert.crt;
        ssl_certificate_key /path/to/key.key;

        location / {
            proxy_pass          http://127.0.0.1:8080;
            proxy_set_header    Host $host;
            proxy_set_header    X-Real-IP $remote_addr;
            proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}

```

在版本0.7.13及之前的NGINX中，不能选择性地为单个监听套接字启用SSL，如上所示。SSL只能使用ssl指令为整个服务器启用，导致无法设置单个HTTP/HTTPS服务器。因此，在版本0.7.14及更高版本中，添加了带有ssl参数的listen指令解决了这个问题。因此，ssl指令在版本0.7.14及以后的版本中已被弃用。


当在同一个IP地址上配置两个或多个HTTPS服务器时，会出现常见问题：

```nginx
server {
    listen          443 ssl;
    server_name     www.example.com;
    ssl_certificate www.example.com.crt;
    #...
}

server {
    listen          443 ssl;
    server_name     www.example.org;
    ssl_certificate www.example.org.crt;
    #...
}
```

在这种配置下，浏览器会收到默认服务器的证书。在这个例子中，无论请求的服务器名称是什么，都是www.example.com。这是由SSL协议本身的行为引起的。SSL连接在浏览器发送HTTP请求之前建立，NGINX不知道所请求的服务器的名称。因此，它只能提供默认服务器的证书。

解决这个问题的最好方法是为每个HTTPS服务器分配单独的IP地址：

```nginx
server {
    listen          192.168.1.1:443 ssl;
    server_name     www.example.com;
    ssl_certificate www.example.com.crt;
    #...
}

server {
    listen          192.168.1.2:443 ssl;
    server_name     www.example.org;
    ssl_certificate www.example.org.crt;
    #...
}
```

请注意，还有一些特定的代理设置用于HTTPS上游(proxy_ssl_ciphers、proxy_ssl_protocols和proxy_ssl_session_reuse)，可用于在NGINX和上游服务器之间进行SSL优化。关于这些内容可以在HTTP代理模块文档中阅读更多信息。

可以使用主题备用名称证书字段中带有多个名称的证书来共享单个IP地址。例如，www.example.com和www.example.org。但是，SubjectAltName字段的长度是有限的。

另一种方法是使用带有通配符名称的证书，例如*.example.org。通配符证书可以保护指定域的所有子域，但仅在一个级别上。该证书匹配www.example.org，但不匹配example.org或www.sub.example.org。这两种方法也可以结合使用。证书可以在SubjectAltName字段中包含精确和通配符名称。例如，example.org和*.example.org。

最好将带有多个名称和私钥文件的证书文件放置在配置的http级别，以便它们在所有服务器上继承单个内存副本：

```nginx
ssl_certificate     common.crt;
ssl_certificate_key common.key;

server {
    listen          443 ssl;
    server_name     www.example.com;
    #...
}

server {
    listen          443 ssl;
    server_name     www.example.org;
    #...
}
```

为了在单个IP地址上运行几个HTTPS服务器的更通用解决方案是TLS Server Name Indication (SNI) 扩展（RFC 6066），它允许浏览器在SSL握手期间传递请求的服务器名称。有了这个解决方案，服务器将知道应该使用哪个证书进行连接。但是，SNI的浏览器支持是有限的。目前，它支持以下浏览器版本：

* Opera 8.0
* MSIE 7.0（仅在Windows Vista或更高版本上）
* Firefox 2.0和使用Mozilla Platform rv：1.8.1的其他浏览器
* Safari 3.2.1（Windows版支持SNI在Vista或更高版本上）
* Chrome（Windows版本也支持Vista或更高版本上的SNI）

只能在SNI中传递域名。但是，如果请求包含文字IP地址，则某些浏览器将其IP地址作为名称传递。最好不要依赖它。

要在NGINX中使用SNI，必须在NGINX二进制文件构建时以及运行时动态链接的库中都支持OpenSSL库。从0.9.8f版本开始，OpenSSL支持SNI，如果使用--enable-tlsext配置选项进行构建，则启用了此选项。自OpenSSL版本0.9.8j以来，此选项已默认启用。如果使用支持SNI的NGINX构建，NGINX在使用-V开关运行时会显示以下内容：

```bash
nginx -V
...
TLS SNI support enabled
...
```

但是，如果启用SNI的NGINX与不支持SNI的OpenSSL库动态链接，则NGINX会显示以下警告：

```ng
NGINX was built with SNI support, however, now it is linked
dynamically to an OpenSSL library which has no tlsext support,
therefore SNI is not available
```

## 兼容性说明

* 从0.8.21和0.7.62版本开始，-V开关显示SNI支持状态。
* ssl参数在0.7.14版本后得到支持。在0.8.21版本之前，它只能与default参数一起指定。
* SNI从版本0.5.23开始得到支持。
* 共享SSL会话缓存从版本0.5.6开始支持。
* 版本1.9.1及更高版本：默认SSL协议为TLSv1、TLSv1.1和TLSv1.2（如果OpenSSL库支持）。
* 从版本0.7.65和0.8.19及更高版本开始，默认SSL协议为SSLv3、TLSv1、TLSv1.1和TLSv1.2（如果OpenSSL库支持）。
* 在版本0.7.64和0.8.18及之前的版本中，默认SSL协议为SSLv2、SSLv3和TLSv1。
* 从版本1.0.5开始，缺省的SSL密码为HIGH:!aNULL:!MD5。
* 从版本0.7.65和0.8.20及以上，缺省的SSL密码为HIGH:!ADH:!MD5。
* 从版本0.8.19开始，缺省的SSL密码为ALL:!ADH:RC4+RSA:+HIGH:+MEDIUM。
* 在版本0.7.64、0.8.18及之前的版本中，缺省的SSL密码为ALL:!ADH:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP。

