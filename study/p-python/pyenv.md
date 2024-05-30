# pyenv

```sh
# 查看可安装的Python版本
pyenv install --list
pyenv install -l

# 安装指定版本Python
pyenv install <version>

# 查看已安装版本Python、当前活动的Python版本
pyenv versions

pyenv version

# 卸载3.11.1版本的Python
pyenv uninstall <version>


# 设置全局的Python版本
pyenv global <version>

# 查看 全局的Python版本设置
pyenv global

# 设置当前目录下的Python版本
pyenv local <version>

# 显示 当前目录下的Python版本设置
pyenv local

# 取消 当前目录下的Python版本设置
pyenv local --unset


# 设置当前Shell会话的Python版本

pyenv shell <version>

pyenv shell

pyenv shell --unset


```


优先级

三种不同Python版本设置的优先级依次递减

```sh
shell > local > global
```


## 更换国内源

```sh
echo 'export PYTHON_BUILD_MIRROR_URL_SKIP_CHECKSUM=1' >> ~/.bash_profile
echo 'export PYTHON_BUILD_MIRROR_URL="https://registry.npmmirror.com/-/binary/python"' >> ~/.bash_profile
source ~/.bash_profile
```