# 设置JWT认证

本文介绍如何使用JWT认证来控制您的Web资源的身份验证。

本文是 nginx plus专属

> 可以使用 OpenResty 实现本文功能

## 简介

使用NGINX Plus，可以使用JWT认证来控制对资源的访问。 JWT是OpenID Connect标准中用于用户信息的数据格式，该标准是OAuth 2.0协议的标准身份验证层。 API和微服务的部署者也正在转向JWT标准，因为它的简单性和灵活性。使用JWT认证，客户端提供JSON Web Token，该令牌将根据本地密钥文件或远程服务进行验证。

## 先决条件

- NGINX Plus Release 10（R10）支持原生JWT。
- NGINX Plus Release 14（R14）可访问嵌套JWT声明和更长的签名密钥。
- NGINX Plus Release 17（R17）获取来自远程位置的JSON Web密钥。
- NGINX Plus Release 24（R24）支持加密令牌（JWE）。
- NGINX Plus Release 25（R25）支持嵌套JWT，多个JSON Web键源，基于条件的JWT身份验证。
- NGINX Plus Release 26（R26）支持JWT密钥缓存。
- 身份提供者（IdP）或创建JWT的服务。有关手动生成JWT，请参阅"使用JWT和NGINX Plus身份验证API客户端"[博客文章的"给API客户端发放JWT](https://www.nginx.com/blog/authenticating-api-clients-jwt-nginx-plus/?_ga=2.19090298.312968714.1685931495-788595310.1685329082)"一节。

NGINX Plus支持以下类型的JWT：

- JSON Web Signature（JWS）- JWT内容经过数字签名。以下算法可用于签名：

  - HS256，HS384，HS512
  - RS256，RS384，RS512
  - ES256，ES384，ES512
  - EdDSA（Ed25519和Ed448签名）

- JSON Web Encryption（JWE）- JWT的内容已加密。支持以下内容加密算法（JWE头的"enc"字段）：

  - A128CBC-HS256，A192CBC-HS384，A256CBC-HS512
  - A128GCM，A192GCM，A256GCM

- 支持以下密钥管理算法（JWE头的"alg"字段）：

  - A128KW，A192KW，A256KW
  - A128GCMKW，A192GCMKW，A256GCMKW
  - dir-直接使用共享对称密钥作为内容加密密钥
  - RSA-OAEP，RSA-OAEP-256，RSA-OAEP-384，RSA-OAEP-512

- 嵌套JWT-支持JWS包含在JWE中

## 配置NGINX Plus进行API身份验证

假设NGINX Plus作为网关（proxy_pass http://api_server）提供对多个API服务器（上游{}块）的服务，并且传递到API服务器的请求应该经过身份验证：

```nginx
upstream api_server {
    server 10.0.0.1;
    server 10.0.0.2;
}

server {
    listen 80;

    location /products/ {
        proxy_pass http://api_server;
        #...
    }
}
```

要实现JWT进行身份验证：

首先，需要创建将发放给客户端的JWT。您可以使用自己的身份提供者（IdP）或自己的服务来创建JWT。出于测试目的，您可以创建自己的JWT，有关详细信息，请参见"使用JWT和NGINX Plus身份验证API客户端"博客文章。

配置NGINX Plus接受JWT：指定auth_jwt指令，该指令启用JWT身份验证，并定义身份验证区域（或"领域"，在示例中为"API"）：

```nginx
server {
    listen 80;

    location /products/ {
        proxy_pass http://api_server;
        auth_jwt   "API";
        #...
    }
}
```

NGINX Plus还可以从查询字符串参数获取JWT。要配置这个，请在auth_jwt指令中包含token =参数：

```nginx
# ...
auth_jwt "API" token=$arg_apijwt;
# ...
```

使用auth_jwt_type指令指定JWT类型-签名（JWS），加密（JWE）或嵌套（嵌套JWT）。指令的默认值为signed，因此对于JWS，可以省略该指令。

```nginx
server {
    listen 80;

    location /products/ {
        proxy_pass        http://api_server;
        auth_jwt          "API";
        auth_jwt_type     encrypted;
        #...
    }
}
```

使用auth_jwt_key_file和/或auth_jwt_key_request指令指定用于验证JWT签名或解密JWT内容（视使用情况而定）的JSON Web Key文件的路径。同时指定两个指令将允许您指定多个密钥源。如果未指定任何指令，则将跳过JWS签名验证。

在此场景中，将从两个文件中取出密钥：key.jwk文件和keys.json文件：

```nginx
server {
    listen 80;

    location /products/ {
        proxy_pass        http://api_server;
        auth_jwt          "API";
        auth_jwt_type     encrypted;
        auth_jwt_key_file conf/key.jwk;
        auth_jwt_key_file conf/keys.json;
    }
}
```

在这种情况下，也有两个密钥的来源，但私钥将从本地文件private_jwe_keys.jwk获取，而公钥将从外部身份提供者服务https://idp.example.com在子请求中获取：

```nginx
server {
    listen 80;

    location /products/ {
        proxy_pass           http://api_server;
        auth_jwt             "API";
        auth_jwt_type        encrypted;
        auth_jwt_key_file    private_jwe_keys.jwk;
        auth_jwt_key_request /public_jws_keys;
    }

    location /public_jws_keys {
        proxy_pass "https_//idp.example.com/keys";
    }
}
```

建议启用JWT密钥缓存，以获得JWT模块的最佳性能。例如，您可以为上面的配置使用auth_jwt_key_cache指令，并启用JWT密钥缓存一小时。请注意，如果使用变量动态配置auth_jwt_key_request或auth_jwt_key_file，则无法使用auth_jwt_key_cache。

```nginx
server {
    listen 80;

    location /products/ {
        proxy_pass           http://api_server;
        auth_jwt             "API";
        auth_jwt_type        encrypted;
        auth_jwt_key_file    private_jwe_keys.jwk;
        auth_jwt_key_request /public_jws_keys;
        auth_jwt_key_cache   1h;
    }

    location /public_jws_keys {
        proxy_pass "https_//idp.example.com/keys";
    }
}
```


## NGINX Plus 如何验证 JWT

当 JWT 满足以下条件时，它被认为是有效的：

- 签名可以通过 auth_jwt_key_file 或者 auth_jwt_key_request 中的密钥进行验证（对于 JWS），或者可以使用这些密钥解密负载（对于 JWE）。匹配 kid（"key ID"）和 alg（"algorithm"）头字段（如果存在）。
- JWT 被呈现在有效期内，在 nbf（"not before"）和 exp（"expires"）声明中定义的情况下。

创建 JSON Web Key 文件

为了使用密钥验证签名或解密数据，应该创建一个 JSON Web Key (key.jwk)。文件格式由 JSON Web Key 规范定义：

```nginx
{"keys":
    [{
        "k":"ZmFudGFzdGljand0",
        "kty":"oct",
        "kid":"0001"
    }]
}
```

其中：

- k 字段是基于密钥（例如 fantasticjwt）生成的对称密钥（base64url 编码）。可以使用以下命令生成密钥：$ echo -n fantasticjwt | base64 | tr '+/' '-_' | tr -d '=' ZmFudGFzdGljand0
- kty 字段将密钥类型定义为对称密钥（序列）
- kid（Key ID）字段为此 JSON Web Key 定义了序列号

从子请求获取 JWKs

NGINX Plus 可以配置为从远程位置（通常是标识提供者，特别是在使用 OpenID Connect 时）获取 JSON Web Key。通过 auth_jwt_key_request 指令配置发送子请求的 IdP URI：

```nginx
http {
    #...

    server {
        listen 80;
            #...

        location / {
            auth_jwt "closed site";
            auth_jwt_key_request /_jwks_uri; # Keys will be fetched by subrequest

            proxy_pass http://my_backend;
        }
    }
}
```

URI 可以引用内部位置（_jwks_uri），以便可以缓存 JSON Web Key Set（proxy_cache 和 proxy_cache_path 指令）以避免验证开销。即使使用 JWT 密钥缓存，对于高负载 API 网关，也建议打开缓存功能，因为当 JWT 密钥缓存过期时，避免向密钥服务器发出密钥请求。

```nginx
http {
    proxy_cache_path /var/cache/nginx/jwk levels=1 keys_zone=jwk:1m max_size=10m;
    #...

    server {
        listen 80;
            #...

        location = /_jwks_uri {
            internal;
            proxy_method      GET;
            proxy_cache       jwk; # Cache responses
            proxy_cache_valid 200 12h;
            proxy_pass        https://idp.example.com/oauth2/keys; # Obtain keys from here
        }
    }
}
```

完整示例从子请求获取 JWKs：

```nginx
proxy_cache_path /var/cache/nginx/jwk levels=1 keys_zone=jwk:1m max_size=10m;

server {
    listen 80; # Use SSL/TLS in production

    location / {
        auth_jwt             "closed site";
        auth_jwt_key_cache   1h;
        auth_jwt_key_request /_jwks_uri;    # Keys will be fetched by subrequest

        proxy_pass http://my_backend;
    }

    location = /_jwks_uri {
        internal;
        proxy_method      GET;
        proxy_cache       jwk; # Cache responses
        proxy_cache_valid 200 12h;
        proxy_pass        https://idp.example.com/oauth2/keys; # Obtain keys from here
    }
}
```

## 任意 JWT 声明验证

在 JWT 验证期间，NGINX Plus 自动仅验证 nbf（"not before"）和 exp（"expires"）声明。然而，在某些情况下，您需要为成功的 JWT 验证设置更多条件，特别是当涉及应用程序特定或协议级别的声明时。例如，OpenID Connect Core 要求对 ID 令牌进行 iss（"issuer"）、aud（"audience"）和 sub（"subject"）声明的验证。

可以使用 map 模块将其他条件设置为变量，然后使用 auth_jwt_require 指令对其进行评估。

在此场景中，我们正在验证：

- 令牌接收者（受众）是我们的 API（map 规则 1）
- 令牌由受信任的标识提供者发出（map 规则 2）
- 管理员代表调用的 API 中的作用域（map 规则 3）

三个结果变量的值在 auth_jwt_require 指令中进行评估，如果每个变量的值为 1，则将接受 JWT：

```nginx
upstream api_server {
    server 10.0.0.1;
    server 10.0.0.2;
}

map $jwt_claim_aud $valid_app_id {    #map rule 1:
    "~api\d.example.com" 1;           #token issued only for target apps
}

map $jwt_claim_iss $valid_issuer {    #map rule 2:
    "https://idp.example.com/sts" 1;  #token issued by trusted CA
}

map $jwt_claim_scope $valid_scope {   #map rule 3:
    "access_as_admin" 1;              #access as admin only
}

server {
    listen 80;

    location /products/ {
        auth_jwt          "API";
        auth_jwt_key_file conf/api_secret.jwk;
        auth_jwt_require  $valid_app_id $valid_issuer $valid_scope;
        proxy_pass        http://api_server;
    }
}
```

在某些情况下，auth_jwt_require 指令可以指定多次，例如，为了进行身份验证然后进行授权。如果出现错误，则会显示 401 代码。将自定义错误代码 403 分配给另一个 auth_jwt_require 指令使得可以区分身份验证和授权用例，并适当处理相应的失败：

```nginx
location /products/ {
    auth_jwt          "API";
    auth_jwt_key_file conf/api_secret.jwk;
    auth_jwt_require  $valid_app_id $valid_issuer $valid_scope;
    auth_jwt_require  $valid_scope error=403;
    proxy_pass        http://api_server;
}
```

## 嵌套 JWT 提取

嵌套 JWT 是将 JWS 令牌封装到 JWE 中。在嵌套 JWT 中，使用 JWE 额外加密了 JWS 中的敏感信息。

使用嵌套 JWT 可能优于 JWE，因为：

- 对于 JWE，目标应用程序/服务需要首先解密令牌，然后验证签名。应用程序端的解密操作可能需要耗费大量时间和资源。
- 在嵌套 JWT 的情况下，由于 NGINX Plus 和目标应用程序/服务位于同一信任网络中，因此 NGINX Plus 在不需要令牌加密的情况下进行解密，检查包含的 JWS，并将 Bearer Token 发送到应用程序。这将把 JWE 解密从应用程序转移到 NGINX Plus。
- 如果您的应用程序不支持 JWE，则使用嵌套 JWT 可以使 JWS 完全受到保护。

要启用嵌套令牌：

- 使用 auth_jwt_type 指令指定 JWT 的嵌套类型。
- auth_jwt_type nested;
- 将解密的负载（$jwt_payload 变量）作为 Authorization 头中的 Bearer Token 值传递给应用程序。
- proxy_set_header Authorization "Bearer $jwt_payload";

该示例将前面的步骤汇总到一个配置中：

```nginx
upstream api_server {
    server 10.0.0.1;
    server 10.0.0.2;
}

http {
    server {
        listen 80;

        auth_jwt          "API";
        auth_jwt_type     nested;
        auth_jwt_key_file conf/api_secret.jwk;

        proxy_pass       http://api_server;
        proxy_set_header Authorization "Bearer $jwt_payload";
    }
}
```
