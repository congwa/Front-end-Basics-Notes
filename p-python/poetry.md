# poetry

## 安装

```sh
curl -sSL https://install.python-poetry.org | python3 -
```

```sh
# 添加自动补全
mkdir $ZSH_CUSTOM/plugins/poetry
poetry completions zsh > $ZSH_CUSTOM/plugins/poetry/_poetry
# ~/.zshrc的插件添加
plugins(
 poetry
 ...
 )
```

## 基本用法

```sh
# 创建项目
poetry new poetry-demo

# poetry-demo
# ├── pyproject.toml
# ├── README.md
# ├── poetry_demo
# │   └── __init__.py
# └── tests
#     └── __init__.py

# 初始化已经存在的项目
cd pre-existing-project
poetry init
```

[文档](https://python-poetry.org/docs/pyproject/)非打包模式

```sh
[tool.poetry]
package-mode = false
```

指定依赖关系

```sh
# 添加依赖
poetry add pendulum
# 添加后
[tool.poetry.dependencies]
pendulum = "^2.1"

```

使用虚拟环境

默认情况下，Poetry 在{cache-dir}/virtualenvs.您可以cache-dir通过编辑 Poetry 配置来更改该值。此外，您可以使用 virtualenvs.in-project配置变量在项目目录中创建虚拟环境

使用poetry run 运行脚本

```sh
poetry run python your_script.py
```

安装依赖

```sh
poetry install

# 1.
# 如果您以前从未运行过该命令并且也不存在 poetry.lock 文件，Poetry 只会解析 pyproject.toml 文件中列出的所有依赖项并下载其文件的最新版本
# 当 Poetry 完成安装后，它将下载的所有包及其确切版本写入 poetry.lock 文件，将项目锁定为这些特定版本。您应该将 poetry.lock 文件提交到您的项目存储库，以便所有从事该项目的人员都被锁定到相同版本的依赖项（
# 2. 
# 如果运行 poetry install 时已经存在 poetry.lock 文件和 pyproject.toml 文件，则意味着您运行了 install 命令之前，或者项目中的其他人运行了 install 命令并将 poetry.lock 文件提交到项目中

```
