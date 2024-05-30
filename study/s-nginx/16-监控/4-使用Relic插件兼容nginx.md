# 用于 New Relic 监控 NGINX 开源软件

本文NGINX Plus 专属

## 什么是新的？

今天，我们很高兴地宣布 New Relic 的 NGINX 插件 2.0 版的重大更新，其中包括以下更改：

- 该插件是用 Python 重写的。您不再需要安装 Ruby。
- 插件终于被打包了。有针对基于 RHEL/CentOS 和 Debian/Ubuntu 的系统的预构建包。包含的初始化脚本使您能够轻松设置插件的自动启动。
- 实时活动监控仪表板中有两个新部分，供 NGINX Plus 客户使用：
  - Servers -  server 配置块包含 `status_zone` 指令的虚拟服务器的附加摘要计数器
  - Cache – 所有已配置缓存的累积统计信息
- 默认情况下启用详细日志记录。


## 安装

[install](https://docs.nginx.com/nginx/admin-guide/monitoring/new-relic-plugin/)
