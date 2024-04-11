# pm2

PM2: 网站的访问量比较大，有完整的监控页面


## 启动

```sh
#start命令启动对应的node server文件
pm2 start ./build/server.js
```

## 保存当前已启动的服务

```sh
pm2 save 
```

## 设置开启自启

```sh
pm2 startup
```

> 一般启动三联，start、save、startup，就完成了启动

## 查看详细状态信息

```sh
pm2 show server
```

## 查看所有启动的进程列表

```sh
pm2 list
```

## 监控每个 node 进程的 cpu 和内存使用情况

```sh
pm2 monit
```


## 显示所有进程的日志信息

```sh
pm2 logs
```

## 监控运行这些进程的机器的状态

```sh
pm2 web
```

## 停止某个

```sh
pm2 stop (id|all)

# 停止所有
pm2 stop all
```

## 重启

```sh
# 重启id为0的进程
pm2 restart 0
# 重启所有进程
pm2 restart all
```

## 杀死 指定/所有 进程

```sh
# 杀死id为0的进程
pm2 delete 0
# 杀死所有进程
pm2 delete all
```

## 启动文件pm2.config.js

```js
// 名称任意，按照个人习惯来
module.exports = {
  apps: [
    {
      name: 'kaifazhe', // 应用名称
      script: './build/server.js', // 启动文件地址
      cwd: './', // 当前工作路径
      watch: [
        // 监控变化的目录，一旦变化，自动重启
        'src',
        'build',
      ],
      ignore_watch: [
        // 忽视这些目录的变化
        'node_modules',
        'logs',
        'public',
      ],
      node_args: '--harmony', // node的启动模式
      env: {
        NODE_ENV: 'development', // 设置运行环境，此时process.env.NODE_ENV的值就是development
        ORIGIN_ADDR: 'http://www.xxxx.com'
      },
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: './logs/out.log', // 普通日志路径
      error_file: './logs/err.log', // 错误日志路径
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
};

```


## 负载均衡

```sh
pm2 start server.js -i (number|max)
```

```sh
# 开启三个进程运行项目
pm2 start app.js -i 3
# 根据机器CPU核数，开启对应数目的进程运行项目
pm2 start app.js -i max
```

```sh
# pm2.config.js
"instances": 2,  // 启动两个实例
```


## 日志分割插件 pm2-logrotate

装完之后它就自动启动,然后你还可以配置各种参数

pm2-logrotate-ext，嗯，因为据说官方的pm2-logrotate存在一个bug，就是日期会正常分割，但是如果你前一天的文件没有写满比如你设置了1M但只写了500K那么第二天的日志还是会插入到原来的out.log(err.log)，所以大牛就写了这个解决了这个问题pm2-logrotate-ext



## 监控可视化

pm2-web

```sh
 pm2-web --config pm2-web-config.json
```

