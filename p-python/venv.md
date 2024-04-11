# venv.md

venv是Python的官方标准库，从Python3.3版本开始被引入，用于创建和管理Python虚拟环境

> 官方版本内置了后，不推荐使用conda、virtualenv、virtualenvwrapper等方式创建虚拟环境了


## venv使用

```sh
# 创建 
# my_venv 在当前路径下，创建一个myenv的虚拟环境，虚拟环境的相关文件都在my_venv文件夹下
# -m -m 选项来运行后面指定的模块  在这个例子中，我们运行的是 venv 模块
python -m venv my_venv

# 使用当前目录创建一个名字为my_venv的虚拟环境
python -m venv my_venv

# 使用虚拟环境

# windows
# 确保你的命令行的当前工作目录是你的虚拟环境所在的目录 这条命令会激活名为 "my_venv" 的虚拟环境 win下会有Scripts文件夹的activate为激活执行文件
source my_venv\Scripts\activate

# mac 和 linux

source my_venv/bin/activate

# 退出虚拟环境
deactivate

# 删除虚拟环境 (删除当前文件夹下的my_venv文件夹)
rm -rf my_venv
```
