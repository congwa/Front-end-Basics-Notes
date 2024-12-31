# GitHub 配置指南

## SSH Key 配置

### 检查现有 Key
```sh
# 查看哪个仓库使用了这个key
ssh -T -ai ~/.ssh/id_rsa git@github.com
```

### 在一台服务器上使用多个仓库

每个仓库需要使用独立的部署密钥，不能重复使用。以下是具体配置步骤：

1. 为 biomed168-admin 仓库生成专用密钥：

```sh
ssh-keygen -f ~/.ssh/biomed168_admin_key
```

2. 配置 SSH 配置文件（~/.ssh/config）：

```sh
# 标准 GitHub 配置
Host github.com
    Hostname ssh.github.com
    Port 443
    User git

# biomed168-admin 仓库专用配置
Host github.com-biomed168
    HostName ssh.github.com
    Port 443
    User git
    IdentityFile ~/.ssh/biomed168_admin_key
```

3. 测试连接：

```sh
# 测试 SSH 是否可以通过 443 端口连接
ssh -T -p 443 git@ssh.github.com

# 测试特定仓库配置
ssh -T git@github.com-biomed168
```

4. 克隆仓库：

```sh
git clone git@github.com-biomed168:biomed168/biomed168-admin.git
```

### 注意事项

- 首次连接时可能会收到主机验证提示，确认 GitHub 的 SSH 密钥指纹后可以安全地回答 "yes"
- 使用 443 端口可以绕过一些防火墙的限制
- 主机名要使用 `ssh.github.com` 而不是 `github.com`


