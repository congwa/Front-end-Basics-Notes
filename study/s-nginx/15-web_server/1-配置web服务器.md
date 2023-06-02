# NGINX Plus和NGINX Open Source的配置指南

本文适用于NGINX Plus和NGINX Open Source。在本文中，为了方便阅读，我们将只涉及NGINX Plus。配置NGINX Plus作为Web服务器的高级方法是定义它处理的URL以及如何处理这些URL上的HTTP请求。在较低级别上，配置定义了一组虚拟服务器，用于控制特定域或IP地址的请求的处理。有关配置文件的更多信息，请参见创建NGINX Plus配置文件。

每个HTTP流量的虚拟服务器都定义了称为位置的特殊配置实例，用于控制映射到该位置的特定URI集合的请求的处理。NGINX Plus提供了对此过程的完全控制。每个位置可以代理请求或返回文件。此外，可以修改URI，以便将请求重定向到另一个位置或虚拟服务器。还可以返回特定的错误代码并配置相应的页面。

## 设置虚拟服务器

NGINX Plus配置文件必须至少包含一个server指令来定义一个虚拟服务器。当NGINX Plus处理请求时，它首先选择将服务请求的虚拟服务器。

虚拟服务器由http上下文中的server指令定义，例如：

```nginx
http {
    server {
        # Server configuration
    }
}
```

可以将多个server指令添加到http上下文中以定义多个虚拟服务器。

服务器配置块通常包括一个listen指令，用于指定服务器侦听请求的IP地址和端口（或Unix域套接字和路径）。IPv4和IPv6地址都接受；将IPv6地址括在方括号中。

下面的示例显示了一个服务器的配置，该服务器侦听IP地址127.0.0.1和端口8080：

```nginx
server {
    listen 127.0.0.1:8080;
    # Additional server configuration
}
```

如果省略了端口，则使用标准端口。同样，如果省略地址，则服务器侦听所有地址。如果根本不包括listen指令，则"标准"端口为80/tcp，而"默认"端口为8000/tcp，具体取决于超级用户权限。

如果有多个服务器与请求的IP地址和端口相匹配，则NGINX Plus会将请求的Host头字段与服务器块中的server_name指令进行比较。server_name的参数可以是完整名称、通配符或正则表达式。通配符是以星号（*）开头、结尾或两者都包括星号的字符字符串；星号匹配任何字符序列。NGINX Plus使用Perl语法用于正则表达式；在它们之前加上波浪线(~)。下面的示例说明了一个确切的名称。

```nginx
server {
    listen      80;
    server_name example.org www.example.org;
    #...
}
```

如果有几个名称与Host头不匹配，则NGINX Plus将请求路由到该请求到达的端口的默认服务器。默认服务器是nginx.conf文件中列出的第一个服务器，除非您在listen指令中包括default_server参数以显式指定服务器为默认值。

```nginx
server {
    listen 80 default_server;
    #...
}
```

## 配置位置

NGINX Plus可以根据请求URI将流量发送到不同的代理或提供不同的文件服务。这些块是使用位于server指令内部的location指令定义的。

例如，您可以定义三个location块，指示虚拟服务器将某些请求发送到一个代理服务器，将其他请求发送到另一个代理服务器，并通过从本地文件系统提供文件来服务其余请求。

NGINX Plus将请求的URI与所有location指令的参数进行测试，并应用定义在匹配位置中的指令。在每个位置块内部，通常可以（除了一些例外情况）放置更多的location指令，以进一步细化特定组的请求的处理。

注意：在本指南中，单词"location"指的是单个位置上下文。

location指令有两种参数类型：前缀字符串（路径名）和正则表达式。对于请求URI与前缀字符串的匹配，它必须以该前缀字符串开头。

以下示例位置带有路径名参数，匹配以/some/path/开始的请求URI，例如/some/path/document.html。（它不匹配/my-site/some/path，因为/some/path不出现在该URI的开头。）

```nginx
location /some/path/ {
    #...
}
```

正则表达式使用波浪线（~）进行大小写敏感匹配，使用波浪线星号（~*）进行大小写不敏感匹配。以下示例匹配在任何位置包含字符串.html或.htm的URI。

```nginx
location ~ \.html? {
    #...
}
```


## NGINX Location 优先级

为了找到最匹配 URI 的位置，NGINX Plus 首先将 URI 与具有前缀字符串的位置进行比较。然后搜索具有正则表达式的位置。

正则表达式优先级更高，除非使用 ^~ 修饰符。在前缀字符串中，NGINX Plus 选择最特定的一个（也就是最长且最完整的字符串）。以下是选择要处理请求的位置的确切逻辑：

1. 测试 URI 与所有前缀字符串的匹配情况。
2. =（等号）修饰符定义URI和前缀字符串的精确匹配。如果找到精确匹配，则停止搜索。
3. 如果 ^~（脱字符波浪号）修饰符在最长匹配前缀字符串之前，不会检查正则表达式。
4. 存储最长匹配前缀字符串。
5. 测试URI与正则表达式。
6. 当找到第一个匹配的正则表达式时停止处理，并使用相应的位置。
7. 如果没有正则表达式匹配，则使用存储的前缀字符串对应的位置。

= 修饰符的典型用例是请求 /（斜杠）。如果频繁请求 /，请将 = / 指定为位置指令的参数，因为匹配停止在第一次比较之后，可以加快处理速度。

```nginx
location = / {
    #...
}
```

位置上下文可以包含指令，定义如何解决请求-要么提供静态文件，要么将请求传递给代理服务器。在以下示例中，匹配第一个位置上下文的请求从 /data 目录中提供文件，而与第二个位置上下文匹配的请求传递到托管 www.example.com 域内容的代理服务器。

```nginx
server {
    location /images/ {
        root /data;
    }

    location / {
        proxy_pass http://www.example.com;
    }
}
```

`root` 指令指定用于搜索要提供的静态文件的文件系统路径。将与位置相关联的请求 URI 附加到路径以获取要提供的静态文件的完整名称。在上面的示例中，响应请求 /images/example.png，NGINX Plus 提供文件 /data/images/example.png。

`proxy_pass` 指令将请求传递到使用配置 URL 访问的代理服务器。然后将来自代理服务器的响应传递回客户端。在上面的示例中，所有不以 /images/ 开头的 URI 的请求都将被传递到代理服务器。

## 使用变量

您可以在配置文件中使用**变量**，根据定义的情况使 NGINX Plus 处理请求方式不同。**变量是在运行时计算的命名值，并被用作指令的参数。变量以其名称的 $ (美元) 符号开头。**变量基于 NGINX 的状态定义信息，例如当前正在处理的请求的属性。

有许多预定义的变量，如核心 HTTP 变量，您可以使用 set、map 和 geo 指令定义自定义变量。大多数变量在运行时计算并包含与特定请求相关的信息。例如，`$remote_addr` 包含客户端 IP 地址，而 `$uri` 保存当前 URI 值。

## 返回特定状态代码

一些网站 URI 需要立即返回具有特定错误或重定向代码的响应，例如当页面被暂时或永久移动时。最简单的方法是使用 return 指令。例如：

```nginx
location /wrong/url {
    return 404;
}
```

`return` 的第一个参数是响应代码。可选的第二个参数可以是重定向的 URL（用于代码 301、302、303 和 307）或在响应正文中返回的文本。例如：

```nginx
location /permanently/moved/url {
    return 301 http://www.example.com/moved/here;
}
```

`return` 指令可以包含在位置和服务器上下文中。

## 重写请求中的 URI

通过使用 `rewrite` 指令，可以在请求处理期间多次修改请求 URI，该指令有一个可选参数和两个必需参数。第一个（必需）参数是请求 URI 必须匹配的正则表达式。第二个参数是要替换匹配 URI 的 URI。可选的第三个参数是可以停止进一步重写指令处理或发送重定向（代码为 301 或 302）的标志。例如：

```nginx
location /users/ {
    rewrite ^/users/(.*)$ /show?user=$1 break;
}
```

如此示例所示，第二个参数 users 通过匹配正则表达式进行捕获。

您可以在服务器和位置上下文中包含多个 rewrite 指令。NGINX Plus 按它们出现的顺序逐个执行这些指令。服务器上下文中的 rewrite 指令在选择该上下文时执行一次。

**在 NGINX 处理一组重写指令后，它根据新 URI 选择位置上下文。如果所选位置包含重写指令，则逐个执行它们**。如果 URI 与其中任何一个匹配，则在处理完所有定义的重写指令后开始搜索新位置。

以下示例显示重写指令与返回指令的组合。

```nginx
server {
    #...
    rewrite ^(/download/.*)/media/(\w+)\.?.*$ $1/mp3/$2.mp3 last;
    rewrite ^(/download/.*)/audio/(\w+)\.?.*$ $1/mp3/$2.ra  last;
    return  403;
    #...
}
```

此示例配置区分了两组 URI。如 /download/some/media/file 的 URI 就会被更改为 /download/some/mp3/file.mp3。由于使用了 last 标志，后续指令（第二个 rewrite 和 return 指令）将被跳过，但NGINX Plus继续处理请求，这时已经有了不同的 URI。类似地，如 /download/some/audio/file 的 URI 将被替换为 /download/some/mp3/file.ra。如果URI不满足任何重写指令，NGINX Plus 将向客户端返回 403 错误代码。

有两个参数会中断重写指令的处理：

* last - 停止当前服务器或位置上下文中的重写指令的执行，但是 NGINX Plus 会搜索匹配重写 URI 的位置，新位置中的所有重写指令都会应用（这意味着 URI 可能会再次更改）。
* break - 类似于 break 指令，在当前上下文中停止重写指令的处理并取消搜索与新 URI 匹配的位置。新位置中的重写指令不会执行。


## 重写HTTP响应

有时候你需要重写或者更改HTTP响应的内容，将一个字符串替换成另一个。你可以使用`sub_filter`指令来定义需要应用的重写。该指令支持变量和一系列的替换，使得更复杂的更改成为可能。

例如，你可以更改绝对链接，以引用与代理不同的服务器：

```nginx
location / {
    sub_filter      /blog/ /blog-staging/;
    sub_filter_once off;
}
```

另一个例子将方案从`http://`更改为`https://`并用请求头域中的主机名替换本地主机地址。`sub_filter_once`指令告诉NGINX在一个位置内按顺序应用sub_filter指令：

```nginx
location / {
    sub_filter     'href="http://127.0.0.1:8080/'    'href="https://$host/';
    sub_filter     'img src="http://127.0.0.1:8080/' 'img src="https://$host/';
    sub_filter_once on;
}
```

请注意，已经使用sub_filter修改的响应部分不会再次被替换。


## 处理错误

通过`error_page`指令，你可以配置NGINX Plus返回一个自定义页面以及一个错误代码，替换响应中的不同错误代码，或者将浏览器重定向到不同的URI。在下面的示例中，error_page指令指定了404错误代码要返回的页面（/404.html）。

```nginx
error_page 404 /404.html;
```

请注意，该指令并不意味着错误会立即返回（return指令负责这个），而是简单地指定了当出现错误时如何处理。错误代码可以来自代理服务器或者在NGINX Plus的处理中出现（例如，当NGINX Plus无法找到客户端请求的文件时则会返回404错误）。

在下面的示例中，当NGINX Plus无法找到一个页面时，它将使用301代码替换404代码，并将客户端重定向到http:/example.com/new/path.html。当客户端仍然试图访问旧URI的页面时，此配置非常有用。301代码通知浏览器页面已永久移动，需要在返回时自动将旧地址替换为新地址。

```nginx
location /old/path.html {
    error_page 404 =301 http:/example.com/new/path.html;
}
```

以下配置示例展示了当文件未找到时将请求传递给后端。由于在error_page指令中等号后面未指定状态代码，因此返回给客户端的响应具有由被代理服务器返回的状态代码（未必是404）。

```nginx
server {
    ...
    location /images/ {
        # 将根目录设置为搜索文件的目录
        root /data/www;

        # 禁用与文件存在与否相关的错误日志记录
        open_file_cache_errors off;

        # 如果文件未找到则进行内部重定向
        error_page 404 = /fetch$uri;
    }

    location /fetch/ {
        proxy_pass http://backend/;
    }
}
```

`error_page`指令指示NGINX Plus在文件未找到时进行内部重定向。最终参数中的$uri变量持有当前请求的URI，该变量会在重定向中传递。

例如，如果/images/some/file未找到，则它将被替换为/fetch/images/some/file，并启动新的位置搜索。结果，请求最终到达第二个位置上下文并被代理到http://backend/。

`open_file_cache_errors`指令防止写入文件未找到的错误消息。这里不需要此项设置，因为丢失的文件已经被正确处理。