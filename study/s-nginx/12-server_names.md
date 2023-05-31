# Server names

服务器名称是使用 server_name 指令定义的，并确定哪个服务器块用于给定请求。另见"nginx 如何处理请求"。它们可以使用确切的名称、通配符名称或正则表达式来定义：

```nginx
server {
    listen       80;
    server_name  example.org  www.example.org;
    ...
}

server {
    listen       80;
    server_name  *.example.org;
    ...
}

server {
    listen       80;
    server_name  mail.*;
    ...
}

server {
    listen       80;
    server_name  ~^(?<user>.+)\.example\.net$;
    ...
}
```

按名称搜索虚拟服务器时，如果名称匹配多个指定变体，例如通配符名称和正则表达式都匹配，将按照以下**优先顺序**选择第一个匹配的变体：


1. exact name (确切的名称)
2. 以星号开头的最长通配符名称，例如" *.example.org "
3. 以星号结尾的最长通配符名称，例如" mail.* "
4. 第一个匹配的正则表达式（按照在配置文件中出现的顺序）


## 通配符名称

通配符名称只能以星号开头或结尾，并且只能在一个点的边界上使用星号。名称"www.*.example.org"和"w*.example.org"是无效的。但是，这些名称可以使用正则表达式来指定，例如"~^www\..+\.example\.org$"和"~^w.*\.example\.org$"。星号可以匹配多个名称部分。名称"*.example.org"不仅匹配www.example.org，还匹配www.sub.example.org。

" .example.org "形式的特殊通配符名称可用于匹配确切名称" example.org "和通配符名称" *.example.org "。

通配符的匹配规则和优先级：
- 通配符是通过 * 和 ? 来进行匹配的；
- 当请求的 URI 包含与通配符模式相对应的字符串时，就会触发匹配；
- 具体匹配规则为：先匹配前缀，后匹配后缀，最后匹配中间部分；
- 如果同时存在多个符合匹配规则的 location 指令，则选择最精准的匹配结果。



## 正则表达式名称

nginx 使用的正则表达式与 Perl 编程语言 (PCRE) 使用的正则表达式兼容。要使用正则表达式，服务器名称必须以波浪号字符开头：


```nginx
server_name  ~^www\d+\.example\.net$;
```

否则它将被视为一个确切的名称，或者如果表达式包含星号，则将其视为通配符名称（并且很可能是无效的）。不要忘记设置" ^ "和" $ "锚点。它们在语法上不是必需的，但在逻辑上是必需的。另请注意，域名点应使用反斜杠进行转义。应引用包含字符" { "和" } "的正则表达式：

```nginx
server_name  "~^(?<name>\w\d{1,3}+)\.example\.net$";
```

否则 nginx 将无法启动并显示错误信息：

```nginx
directive "server_name" is not terminated by ";" in ...

```

**命名的正则表达式捕获**稍后可以用作变量：

```nginx

server {
    server_name   ~^(www\.)?(?<domain>.+)$;

    location / {
        root   /sites/$domain;
    }
}

# ~ 表示这个 server_name 是使用正则表达式来匹配的。
# ^ 表示匹配字符串的开始位置。
# (www\.)? 表示一个可选的以 "www." 开头的字符串。
# (?<domain>.+) 表示将 "domain" 绑定到后面的任意字符上，这样在后续的 location 中就可以使用变量 $domain 来引用这个值。
# $ 表示匹配字符串的结束位置。

# (?<domain>.+) 将匹配任意长度的字符（除了换行符）并将其存储在名为 "domain" 的捕获组中

```

PCRE 库支持使用以下语法命名捕获：

| 语法        | 描述                                                         | 版本    |
| ----------- | ------------------------------------------------------------ | ------- |
| `(?<name>)` | Perl 5.10 兼容语法，自 PCRE-7.0 起支持。格式为 `(?<name>pattern)`，表示对 pattern 指定一个命名捕获组，可以后续使用 $name 表示该变量。 | PCRE-7.0 |
| `?'name'`   | Perl 5.10 兼容语法，自 PCRE-7.0 起支持。格式为 `?'name'`，表示对 pattern 指定一个命名捕获组，可以后续使用 $name 表示该变量。 | PCRE-7.0 |
| `?P<name>`  | Python 兼容语法，自 PCRE-4.0 起支持。格式为 `?P<name>`，表示对 pattern 指定一个命名捕获组，可以后续使用 $name 表示该变量。 | PCRE-4.0 |


如果 nginx 启动失败并显示错误信息：


```nginx
pcre_compile() failed: unrecognized character after (?< in ...
```

这意味着 PCRE 库是旧的，应该尝试使用语法" ?P<name> "。捕获也可以以数字形式使用：

```nginx
server {
    server_name   ~^(www\.)?(.+)$;

    location / {
        root   /sites/$2;
    }
}
```

但是，这种用法应仅限于简单的情况（如上），因为数字参考很容易被覆盖。

正则表达式的匹配规则和优先级：
- 正则表达式是使用 PCRE（Perl Compatible Regular Expressions）引擎进行匹配的；
- 可以使用 =~ 操作符来判断 URI 是否符合指定的正则表达式；
- 正则表达式匹配优先级高于通配符；
- 如果存在多个符合匹配规则的 location 指令，则选择第一个符合条件的 location 指令。


## 杂名

有一些服务器名称经过特殊处理。

如果需要在非默认的服务器块中处理没有"主机"头字段的请求，则应指定一个空名称：

```nginx
server {
    listen       80;
    server_name  example.org  www.example.org  "";
    ...
}

```

>在 Nginx 中，server_name ""（空字符串）表示不使用 server_name 指令匹配任何请求。也就是说，如果一个 server 块的 server_name 设置为 ""，那么这个 server 块将不会处理任何请求，因为没有请求会与它匹配。



如果服务器块中没有定义 server_name，则 nginx 使用空名称作为服务器名称
>在这种情况下，nginx 0.8.48 版本使用机器的主机名作为服务器名称。

如果服务器名称定义为**" $hostname "(0.9.4)，则使用机器的主机名**。

如果有人使用 IP 地址而不是服务器名称发出请求，"Host"请求标头字段将包含 IP 地址，并且可以使用 IP 地址作为服务器名称来处理请求：

```nginx
server {
    listen       80;
    server_name  example.org
                 www.example.org
                 ""
                 192.168.1.1
                 ;
    ...
}
```

在包罗万象的服务器示例中，可以看到奇怪的名称" _ "：

```nginx
server {
    listen       80  default_server;
    server_name  _;
    return       444;
}

```

这个名字没有什么特别之处，它只是无数与任何真实姓名不相交的无效域名之一。同样可以使用其他无效名称，如" -- "和" !@# "。

> server_name _; 的作用是匹配所有未匹配到 server_name 指令的请求。当定义了一个 server 块并且其中 server_name 设置为 _; 时，这个 server 块将会处理所有请求，不论请求的主机名是什么。


在 Nginx 的版本中，直到 0.6.25 版本都支持特殊名称""，该名称被错误地解释为"通配符"。它从未作为 catch-all 或通配符服务器名称进行过功能操作。相反，它提供了现在由 server_name_in_redirect 指令提供的功能。特殊名称""现已弃用，应使用 server_name_in_redirect 指令。请注意，没有办法使用 server_name 指令指定 catch-all 名称或默认服务器。这是 listen 指令的属性，而不是 server_name 指令的属性。参见 "Nginx 如何处理请求"。可以定义监听端口为 *：80 和 *：8080 的服务器，并指定其中一个将成为 *：8080 端口的默认服务器，而另一个将成为 *：80 端口的默认服务器。


```nginx
server {
    listen       80;
    listen       8080  default_server;
    server_name  example.net;
    ...
}

server {
    listen       80  default_server;
    listen       8080;
    server_name  example.org;
    ...
}
```

第一个 server 块监听了端口 80 和 8080，并且将端口 8080 指定为默认服务器。因此，当客户端发送请求到端口 8080 时，该 server 块会处理所有请求。如果请求的主机名是 example.net，则该 server 块将提供与 example.net 相关的网站内容。

第二个 server 块同样监听了端口 80 和 8080，但是没有指定默认服务器。因此，当客户端发送请求到端口 80 时，该 server 块会处理所有请求。如果请求的主机名是 example.org，则该 server 块将提供与 example.org 相关的网站内容。

要注意的是，虽然这两个 server 块都监听了相同的端口（80 和 8080），但它们的 server_name 不同，因此 Nginx 可以根据请求中的主机名将请求路由到正确的 server 块中。实际上，在真实的生产环境中，可能会存在多个 server 块监听相同的端口，但通过 server_name 的区分，Nginx 可以将请求正确地路由到相应的 server 块。


```bash
example.org:8080
```

当客户端发送请求 example.org:8080 时，Nginx 将会将其路由到第一个 server 块处理。因为该 server 块监听了 8080 端口并且将其指定为默认服务器，所以它将处理所有来自未匹配到 server_name 的请求。不过，由于 example.org 在第二个 server 块中定义了 server_name，因此第二个 server 块将处理来自 example.org 的所有请求（不管是 80 端口还是 8080 端口）。

需要注意的是，如果没有在任一 server 块中定义 example.net 这个 server_name，则 Nginx 将不会将 example.net:8080 请求路由到任何一个 server 块中，并返回 404 Not Found。



## 国际化名称

应在 server_name 指令中使用 ASCII（Punycode）表示法指定国际化域名 (IDN)：

```nginx

server {
    listen       80;
    server_name  xn--e1afmkfd.xn--80akhbyknj4f;  # пример.испытание
    ...
}

```

## 虚拟服务器选择

首先，在默认服务器上下文中创建一个连接。然后，可以在以下请求处理阶段确定服务器名称，每个阶段都涉及服务器配置选择：

- 根据 SNI，提前在 SSL 握手期间
- 处理请求行后
- 在处理完 Host 头域之后
- 如果服务器名称在处理请求行后或从 Host 头字段中未确定，nginx 将使用空名称作为服务器名称。
  

## 优化


在 Nginx 中，根据 server_name 指令定义的域名会被存储在三个哈希表中，分别绑定到不同的监听端口上。这三个哈希表大小会在配置阶段被优化，以便能够快速地查找匹配的域名。但是需要注意的是，使用通配符域名时会使查找变慢，因为需要逐个匹配域名的各个部分。

首先会在精确匹配的哈希表中查找，如果没有找到，则会在以星号开头的通配符哈希表中查找，最后才会在以星号结尾的通配符哈希表中查找。因此，建议在可能的情况下尽量使用精确匹配的域名，以提高匹配效率。例如，在 server_name 指令中列出最常用的域名，而不要仅仅使用简单的通配符。

如果定义了大量的 server_name，或者其中有特别长的域名，可能需要调整 http 层级别的 server_names_hash_max_size 和 server_names_hash_bucket_size 指令。如果出现了哈希表构建失败的情况，则需要将 server_names_hash_max_size 设置为接近 server_name 数量的值，并且只有当改变这个值后仍无法解决问题时，才需要考虑修改 server_names_hash_bucket_size 的值。

另外需要注意的是，如果一个监听端口只有一个 server，那么nginx将不会测试 server_names。但是需要注意，当 server_name 是使用正则表达式定义的时候，nginx仍需执行该表达式以获取相应的捕获组。


## 总结一下**匹配优先级**

匹配规则的优先级主要由 server_name 指令和 location 指令来决定。具体而言，server_name 的匹配规则优先于 location 的匹配规则。

当请求到达 Nginx 时，首先会根据监听端口进行匹配，并选择一个 server 块进行处理。然后，Nginx 将请求的 URI 与 server 中所有的 location 指令进行匹配，优先选择最精确的匹配选项。如果程序找到一组 location 块匹配，将被应用的是与 URI 匹配度最高的那个 location 块的指令。

如果没有匹配到任何 location 块，则使用 server 块中的默认 location 块作为处理请求的配置项。需要注意的是，如果没有定义任何 location 指令，则访问该 server 块的 URI 时将返回该 server 块的默认首页，例如 index.html。

当存在多个 server 块时，Nginx 将根据 server_name 指令中定义的域名和 IP 地址来进行匹配。精确匹配的 server_name 指令将优先于通配符匹配的 server_name 指令，以及以正则表达式定义的 server_name 指令。


