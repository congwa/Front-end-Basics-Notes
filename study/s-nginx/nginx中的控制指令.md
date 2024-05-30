# 控制指令

## if：if指令允许使用条件语句控制请求处理流程

```nginx
if ($request_uri ~* ^/images/) {
    rewrite ^/images/(.*)\.(jpg|jpeg|gif|png)$ /media/$1.$2;
}
```

## map：map指令用于在nginx服务器内部设置大量的映射值，以便后续使用

```nginx
map $uri $is_static {
    ~\.(jpg|jpeg|gif|png|css|js|ico)$  1;
    default                            0;
}
```


## set：set指令用于设置nginx配置文件中的自定义变量

```nginx
if ($request_method !~ ^(GET|HEAD)$ ) {
    set $bad_method 1;
}

set $my_var 10;
```