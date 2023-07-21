# go

## 部署

可以使用Supervisor进行部署

```sh
#! /bin/bash
git pull
go build main.go
supervisorctl restart ...
```

[关于Supervisor进程管理工具的使用-传送门](/study/h-后端/Supervisor进程管理.md)