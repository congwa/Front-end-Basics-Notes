# github

## key already in use



```sh
# 查看哪个仓库使用了这个key
ssh -T -ai ~/.ssh/id_rsa git@github.com
```

### 在一台服务器上使用多个存储库

如果您在一台服务器上使用多个存储库，则需要为每个存储库生成专用密钥对。您不能对多个存储库重复使用部署密钥。

在服务器的 SSH 配置文件（通常~/.ssh/config）中，为每个存储库添加一个别名条目。例如

```sh
Host github.com-repo-0
        Hostname github.com
        IdentityFile=/home/user/.ssh/repo-0_deploy_key

Host github.com-repo-1
        Hostname github.com
        IdentityFile=/home/user/.ssh/repo-1_deploy_key

```

- Host github.com-repo-0 存储库的别名。
- Hostname github.com 配置主机名以与别名一起使用。
- IdentityFile=/home/user/.ssh/repo-0_deploy_key 为别名分配私钥

然后，您可以使用主机名的别名通过 SSH 与存储库进行交互，这将使用分配给该别名的唯一部署密钥。例如：

```sh
git clone git@github.com-repo-1:OWNER/repo-1.git
```


举例


好的，以下是为在服务器上使用多个代码仓库而为每个仓库生成一个专用的密钥对以及配置别名的详细步骤：

1. 为url168/astro3这个仓库生成一个专用的密钥对。你可以使用ssh-keygen命令来生成一个新的SSH密钥对。例如：

```sh
ssh-keygen -f ~/.ssh/astro3_deploy_key
```

这将生成一个名为`astro3_deploy_key`的私钥和一个名为`astro3_deploy_key.pub`的公钥文件。

2. 将公钥添加到GitHub帐户的部署密钥中。将公钥文件的内容复制到GitHub帐户设置中的“Deploy keys”页面。确保你勾选了“Allow write access”选项，以便你可以对该仓库进行推送操作。

3. 在服务器的SSH配置文件中添加一个别名条目。打开SSH配置文件（通常是~/.ssh/config），并将以下内容添加到文件末尾或者已经存在的条目下面：

```sh
Host github.com-url168
    HostName github.com
    IdentityFile ~/.ssh/astro3_deploy_key
```

这个别名是我们为`url168/astro3`仓库取的名字，后面跟上`HostName`和`IdentityFile`分别指定了该仓库的主机名和私钥文件的路径。

4. 使用别名克隆仓库。现在，你可以使用以下命令从服务器上克隆该仓库：

```sh
git clone git@github.com-url168:url168/astro3.git
```

这将使用为该别名指定的唯一部署密钥进行身份验证。

