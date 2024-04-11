# 使用HTTP基本身份验证限制访问

您可以通过实现用户名/密码身份验证来限制对您的网站或某些部分的访问。用户名和密码从创建并填充了一个密码文件的工具中获取，例如 apache2-utils。

HTTP基本身份验证也可以与其他访问限制方法相结合，例如通过IP地址或地理位置限制访问。

## 先决条件

- NGINX Plus 或 NGINX Open Source
- 密码文件创建工具，如apache2-utils（Debian，Ubuntu）或httpd-tools（RHEL/CentOS/Oracle Linux）。

### 创建密码文件

使用密码文件创建工具（例如 apache2-utils 或 httpd-tools）创建用户名/密码对。

1. 确认已安装 apache2-utils（Debian，Ubuntu）或 httpd-tools（RHEL/CentOS/Oracle Linux）。
2. 创建密码文件和第一个用户。使用 -c 标志运行 htpasswd 实用程序（创建新文件），将文件路径名作为第一个参数，用户名作为第二个参数：

    ```bash
     sudo htpasswd -c /etc/apache2/.htpasswd user1
    ```

    按回车键并在提示后输入 user1 的密码。

3. 创建其他的用户名和密码对。省略 -c 标志，因为文件已存在：

    ```bash
    sudo htpasswd /etc/apache2/.htpasswd user2
    ```

    您可以确认文件包含成对的用户名和哈希密码：

    ```bash
    cat /etc/apache2/.htpasswd
    user1:$apr1$/woC1jnP$KAh0SsVn5qeSMjTtn0E9Q0
    user2:$apr1$QdR8fNLT$vbCEEzDj7LyqCMyNpSoBh/
    user3:$apr1$Mr5A0e.U$0j39Hp5FfxRkneklXaMrr/
    ```

## 为HTTP基本认证配置NGINX和NGINX Plus
在您要保护的位置内，指定 auth_basic 指令并给受密码保护的区域命名。当要求凭据时，在用户名/密码对话框窗口中显示该区域的名称：

```nginx
location /api {
    auth_basic "Administrator`s Area";
    #...
}
```

使用 auth_basic_user_file 指令指定路径到包含用户名/密码对的 .htpasswd 文件：

```nginx
location /api {
    auth_basic           "Administrator`s Area";
    auth_basic_user_file /etc/apache2/.htpasswd; 
}
```

或者，您可以在保持基本身份验证限制整个网站的同时，使某些网站区域公开。在这种情况下，使用 auth_basic 指令的 off 参数取消从上一级配置继承：

```nginx
server {
    ...
    auth_basic           "Administrator`s Area";
    auth_basic_user_file conf/htpasswd;

    location /public/ {
        auth_basic off;
    }
}
```

## 将基本身份验证与IP地址访问控制相结合
HTTP基本身份验证可以有效地与通过IP地址访问限制相结合。您可以实现至少两个方案：

1. 用户必须同时经过身份验证和具有有效的IP地址。
2. 用户必须被身份验证或具有有效的IP地址。

使用 `allow` 和 `deny` 指令允许或拒绝特定IP地址的访问：

```nginx
location /api {
    #...
    deny  192.168.1.2;
    allow 192.168.1.1/24;
    allow 127.0.0.1;
    deny  all;
}
```

仅为除 192.168.1.2 地址之外的 192.168.1.1/24 网络授权访问。请注意，allow 和 deny 指令将按定义顺序应用。

使用 `satisfy` 指令将IP和HTTP身份验证限制相结合。如果将该指令设置为 all，则客户端同时满足两个条件时授予访问权限。如果将该指令设置为 any，则客户端满足至少一个条件时授权访问权限：

```nginx
location /api {
    #...
    satisfy all;    

    deny  192.168.1.2;
    allow 192.168.1.1/24;
    allow 127.0.0.1;
    deny  all;

    auth_basic           "Administrator`s Area";
    auth_basic_user_file conf/htpasswd;
}
```

### 完整示例
示例显示如何通过简单身份验证和IP地址访问控制保护您的状态区域：

```nginx
http {
    server {
        listen 192.168.1.23:8080;
        root   /usr/share/nginx/html;

        location /api {
            api;
            satisfy all;

            deny  192.168.1.2;
            allow 192.168.1.1/24;
            allow 127.0.0.1;
            deny  all;

            auth_basic           "Administrator`s Area";
            auth_basic_user_file /etc/apache2/.htpasswd; 
        }
    }
}
```

访问状态页面时，提示您进行登录：

![auth_required.png](/study/imgs/auth_required.png)

如果提供的名称和密码与密码文件不匹配，则会收到 401（要求授权）错误。