# wsl


## 微软wsl培训

[https://learn.microsoft.com/zh-cn/training/modules/wsl-introduction/?source=recommendations](https://learn.microsoft.com/zh-cn/training/modules/wsl-introduction/?source=recommendations)

## github不能拉取，22端口占用快速解决

SSH Server For Windows并占用了默认的22端口，因此如果要在WSL中使用github可以使用443端口

[github给的使用443端口的解决方案-传送门](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port)


```bash
#  ~/.ssh/config
Host github.com
Hostname ssh.github.com
Port 443
User git
```

或者

```bash

git clone ssh://git@ssh.github.com:443/YOUR-USERNAME/YOUR-REPOSITORY.git
```

---

## wsl会和win11电脑装的共享，导致部分项目能跑起来，用npx可能会识别为windows系统导致安装包环境错误

解决方式在 win11 的 wsl里卖安装node

[wsl安装node教程-传送门](https://learn.microsoft.com/zh-cn/windows/dev-environment/javascript/nodejs-on-wsl)


