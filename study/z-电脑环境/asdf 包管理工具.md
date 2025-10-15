
# 管理多语言版本：asdf

我们经常需要在不同的项目中使用不同版本的编程语言，比如 Go 1.22, Python 3.10, Node.js 18。手动管理这些版本不仅繁琐，而且极易出错。版本管理工具 `asdf` 应运而生，它旨在用一套统一的命令，优雅地解决所有语言的版本切换难题。

## 什么是 asdf？为什么选择它？

`asdf` 是一个可扩展的、统一的命令行版本管理器。与其他工具（如 `nvm`, `pyenv`, `gvm`）不同，`asdf` 采用插件化的架构，让你能够：

  - **用一个工具管理所有语言**：无论是 Go, Python, Node.js, Ruby 还是 Rust，都使用完全相同的命令（`asdf install`, `asdf set`）来管理。
  - **项目级版本锁定**：通过在项目目录中放置一个简单的 `.tool-versions` 文件，`asdf` 可以自动为你切换到该项目所需的正确版本。
  - **全局默认版本**：轻松设置一个系统范围的默认版本，以应对不在特定项目中的场景。
  - **社区驱动的插件生态**：拥有庞大的插件库，几乎涵盖了所有主流编程语言和工具。

## 安装与配置

在 macOS 上，最简单的安装方式是通过 [Homebrew](https://brew.sh/)。

#### 1\. 安装 asdf

在终端中运行：

```bash
brew install asdf
```

#### 2\. 配置 Shell (以 Zsh 为例)

为了让 `asdf` 能够自动生效，需要将其启动脚本添加到你的 Shell 配置文件中（通常是 `~/.zshrc` 或 `~/.bash_profile`）。

```bash
# 对于 Zsh 用户
echo -e "\n. \"$(brew --prefix asdf)/libexec/asdf.sh\"" >> ~/.zshrc

# 对于 Bash 用户
echo -e "\n. \"$(brew --prefix asdf)/libexec/asdf.sh\"" >> ~/.bash_profile
```

**关键一步**：让配置立即生效。**重启终端**，或运行 `source ~/.zshrc` (或 `source ~/.bash_profile`)。

## asdf 核心工作流

`asdf` 的使用逻辑非常清晰，可以分为三步：**添加插件 -\> 安装版本 -\> 设置版本**。

### 1\. 添加插件 (Plugins)

插件是 `asdf` 用来“理解”如何下载和管理特定语言的驱动程序。

```bash
# 添加 Go 插件
asdf plugin add golang

# 添加 Python 插件
asdf plugin add python
```

### 2\. 安装版本 (Versions)

有了插件，你就可以安装任意指定版本的语言了。

```bash
# 查看所有可供安装的 Go 版本
asdf list all golang

# 安装一个具体的 Go 版本
asdf install golang 1.22.3

# 安装一个具体的 Python 版本
asdf install python 3.12.4
```

### 3\. 设置版本 (Set Versions) - 核心

这是 `asdf` 的精髓所在。`asdf` 通过 `asdf set` 命令来统一管理版本设置，它主要分为两个作用域：**全局 (Global)** 和 **局部 (Local)**。

#### 设置全局版本 (Global)

全局版本是你系统里的“默认”版本。当你不在任何一个有 `.tool-versions` 文件的目录里时，`asdf` 就会使用它。

**这是当前推荐的标准命令**，它会在你的用户主目录（`~`）下创建或更新 `.tool-versions` 文件。

```bash
# 将 Go 的全局默认版本设置为 1.22.3
asdf set global golang 1.22.3

# 将 Python 的全局默认版本设置为 3.12.4
asdf set global python 3.12.4
```

> **注意**：正如你所指出的，旧的 `asdf global golang 1.22.3` 命令在许多版本中仍然可以作为 `asdf set global ...` 的别名使用，以保证向后兼容，但 `set global` 是更现代、更清晰的写法。

#### 设置局部版本 (Local)

局部版本是**项目级别**的版本，也是 `asdf` 最强大的功能。它只在当前目录下生效。

```bash
# 1. 进入你的项目目录
cd ~/projects/my-legacy-app

# 2. 为此项目设置一个特定的 Python 版本
asdf set local python 3.10.9
```

运行此命令后，`asdf` 会在 `~/projects/my-legacy-app/` 目录下创建一个 `.tool-versions` 文件，内容如下：

```
# .tool-versions
python 3.10.9
```

现在，**只要你通过终端进入这个目录，`asdf` 就会自动将 Python 版本切换为 `3.10.9`**。当你离开这个目录，版本又会自动恢复为全局设置。

你也可以一次性为项目设置多种语言的版本：

```bash
asdf set local golang 1.21.9
asdf set local python 3.10.9
```

这会使 `.tool-versions` 文件包含多行内容，方便团队协作时统一开发环境。

## 常用命令速查表

| 命令 | 作用 |
| :--- | :--- |
| `asdf plugin add <name>` | 添加一个语言插件 |
| `asdf plugin list all` | 列出所有可用的官方插件 |
| `asdf list all <name>` | 列出指定语言所有**可安装**的版本 |
| `asdf install <name> <version>` | 安装一个新版本 |
| `asdf list <name>` | 列出本地**已安装**的该语言版本 |
| `asdf set global <name> <version>` | **【推荐】** 设置全局（用户级）默认版本 |
| `asdf set local <name> <version>` | **【推荐】** 设置局部（项目级）版本 |
| `asdf current` | 显示当前目录下所有工具的激活版本 |
| `asdf which <command>` | 显示命令（如 `python`）的实际路径 |
| `asdf uninstall <name> <version>` | 卸载一个已安装的版本 |
| `asdf plugin update --all` | 更新所有已安装的插件 |
