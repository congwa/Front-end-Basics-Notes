# venv.md

venv是Python的官方标准库，从Python3.3版本开始被引入，用于创建和管理Python虚拟环境

> 官方版本内置了后，不推荐使用conda、virtualenv、virtualenvwrapper等方式创建虚拟环境了


## venv使用

```sh
# 创建 
# "/path/to/new/virtual/environment" 是你要创建新虚拟环境的目录路径
# -m -m 选项来运行后面指定的模块  在这个例子中，我们运行的是 venv 模块
python -m venv /path/to/new/virtual/environment

# 使用当前目录创建一个名字为venv的虚拟环境
python -m venv venv

# 使用虚拟环境

# 确保你的命令行的当前工作目录是你的虚拟环境所在的目录 这条命令会激活名为 "venv" 的虚拟环
source venv\Scripts\activate

# 退出虚拟环境
deactivate
```