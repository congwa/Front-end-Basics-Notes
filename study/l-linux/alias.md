# alias

alias`显示别名`,或给命令`取别名`

```sh
# 可以显示所有别名。
alias

alias today='date +"%A, %B %-d, %Y"'
today

# 星期一, 一月 6, 2020
```

```nginx
server {
  listen       8088;
  server_name  localhost;

  location / {
    #二级路由时需要使用别名alias，不用root
    root   /usr/share/nginx/html;
    index  index.html;
    #若不配置try_files，刷新会404
    try_files $uri $uri/ /index.html;
  }
}
```
