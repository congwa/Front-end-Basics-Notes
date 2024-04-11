# git

配置信息

```shell

# 显示当前的Git配置
git config --list
# 编辑Git配置文件，--global表示全局
git config -e [--global]
# 设置提交代码时的用户信息
git config [--global] user.name "[name]"
git config [--global] user.email "[email address]"
# 颜色设置
git config --global color.ui true   # git status等命令自动着色
git config --global color.status auto
git config --global --unset http.proxy      # 删除某个配置
```

初始化代码库

```shell
# 在当前目录新建一个Git代码库
git init
# 新建一个目录，将其初始化为Git代码库
git init [project-name]
# 关联远程仓库
git remote add <name> <git-repo-url>
# 下载一个项目和它的整个代码历史
git clone [url]
```

增删文件

```shell
# 添加指定文件到暂存区
git add [file1] [file2] ...
# 添加指定目录到暂存区，包括子目录
git add [dir]
# 添加当前目录的所有文件到暂存区（追踪所有新增的文件）
git add .
# 删除工作区/暂存区的文件
git rm [file1] [file2] ...
# 停止追踪指定文件，但该文件会保留在工作区
git rm --cached [file]
# 改名工作区/暂存区的文件
git mv [源文件名] [新文件名]
```

查看信息（日志，比对，配置）

```shell
# 查看系统配置
git config --list
# 查看暂存区的文件
git ls-files
# 查看本地 git 命令历史
git reflog
# 查看所有 git 命令
git --help -a

# 查看提交历史
# 将日志记录一行一行的显示
git log --oneline
# 查找日志记录中(commit提交时的注释)与关键字有关的记录
git log --grep="关键字"
# 记录图形化显示
git log --graph
# 将所有记录都详细的显示出来
git log --all
# 查找这个作者提交的记录
git log --author "username"
# git log -10 显示最近10次提交
git log -num
# 显示每次提交所引入的差异（按 补丁 的格式输出）
git log -p
# 查找规定的时间(如:1天/1周)之前或之后的记录
git log --before=  1  day/1  week/1  "2019-06-06"
git log --after= "2019-06-06"
# 显示每次更新的文件修改统计信息，会列出具体文件列表
git log --pretty=format:"xxx"

# 显示暂存区和工作区的差异
git diff
# 显示暂存区和上一个commit的差异
git diff --cached [file]
# 显示工作区与当前分支最新commit之间的差异
git diff HEAD
# 显示两次提交之间的差异
git diff [first-branch]...[second-branch]
# 显示今天你写了多少行代码
git diff --shortstat "@{0 day ago}"
# 显示某次提交的元数据和内容变化
git show [commit]
# 显示某次提交发生变化的文件
git show --name-only [commit]
# 显示某次提交时，某个文件的内容
git show [commit]:[filename]
# 显示当前分支的最近几次提交，能显示rebase，revert等操作
git reflog
```

分支

```shell
# 列出所有本地分支
git branch
# 列出所有远程分支
git branch -r
# 列出所有本地分支和远程分支
git branch -a
# 新建一个分支，但依然停留在当前分支
git branch [branch-name]
# 新建一个分支，并切换到该分支
git checkout -b [branch]
# 新建一个分支，指向指定commit
git branch [branch] [commit]
# 新建一个分支，与指定的远程分支建立追踪关系
git branch --track [branch] [remote-branch]
# 切换到指定分支，并更新工作区
git checkout [branch-name]
# 切换到上一个分支
git checkout -
# 建立追踪关系，在现有分支与指定的远程分支之间
git branch --set-upstream [branch] [remote-branch]
# 删除分支
git branch -d [branch-name]
# 强制删除一个本地分支，即使包含未合并更改的分支
git branch -D [branch-name]
# 删除远程分支
git push origin --delete [branch-name]
git branch -dr [remote/branch]
# 从远程分支develop创建新本地分支devel并检出
git checkout -b devel origin/develop
# 修改当前分支名
git branch -m [branch-name]
```

合并

```shell
# 合并指定分支到当前分支
git merge [branch]
# 合并分支，但是禁止快进式合并
git merge --no-ff [branch]
# 当前分支合并成一个新修改，让用户自己去提交
git merge --squash [branch]
# 选择一个commit，合并进当前分支
git cherry-pick [commit]
```

提交

```shell
# 提交暂存区到仓库区
git commit -m [message]

# 提交暂存区的指定文件到仓库区
git commit [file1] [file2] ... -m [message]

# 提交工作区自上次commit之后的变化，直接到仓库区
git commit -a

# 提交时显示所有diff信息
git commit -v

# 将add和commit合为一步
git commit -am 'message'

# 使用一次新的commit，替代上一次提交
# 如果代码没有任何新变化，则用来改写上一次commit的提交信息
git commit --amend -m [message]

# 重做上一次commit，并包括指定文件的新变化
git commit --amend [file1] [file2] ...

# 加入 --no-edit 标记会修复提交但不修改提交信息，编辑器不会弹出上一次提交的信息
git commit --amend --no-edit

# 跳过验证继续提交
git commit --no-verify
git commit -n
```

标签

```shell
# 列出所有tag
git tag

# 新建一个tag在当前commit
git tag [tag]

# 新建一个tag在指定commit
git tag [tag] [commit]

# 删除本地tag
git tag -d [tag]

# 删除远程tag（先删除本地 tag ，然后再删除远程 tag）
git push origin :refs/tags/[tagName]

# 推送一个本地标签
git push origin [tagname]

# 推送全部未推送过的本地标签
git push origin --tags

# 查看tag信息
git show [tag]

# 提交指定tag
git push [remote] [tag]

# 提交所有tag
git push [remote] --tags

# 新建一个分支，指向某个tag
git checkout -b [branch] [tag]
```

远程同步

```shell
# 下载远程仓库的所有变动
git fetch [remote]

# 显示所有远程仓库
git remote -v

# 显示某个远程仓库的信息
git remote show [remote]

# 增加一个新的远程仓库，并命名
git remote add [shortname] [url]

# 取回远程仓库的变化，并与本地分支合并
git pull [remote] [branch]

# 上传本地指定分支到远程仓库
git push [remote] [branch]

# 强行推送当前分支到远程仓库，即使有冲突
git push [remote] --force

# 推送所有分支到远程仓库
git push [remote] --all

# 建立当前分支和远程分支的追踪关系
git push -u origin [branch]
```

重设

```shell
# 重置暂存区的指定文件，与上一次commit保持一致，但工作区不变
git reset [file]

# 重置暂存区与工作区，与上一次commit保持一致
git reset --hard

# 重置当前分支的指针为指定commit，同时重置暂存区，但工作区不变
git reset [commit]

# 重置当前分支的HEAD为指定commit，同时重置暂存区和工作区，与指定commit一致
git reset --hard [commit]

# 将当前分支的指针指向为指定 commit（该提交之后的提交都会被移除），但保持暂存区和工作区不变
git reset --soft [commit]

# 重置当前HEAD为指定commit，但保持暂存区和工作区不变
git reset --keep [commit]
```

变基

```shell
# 从某个提交开始进行重新提交
git rebase -i HEAD
git rebase -i [commit]
```

撤销

```shell
# 生成一个撤销最近的一次提交的新提交
git revert HEAD

# 生成一个撤销最近一次提交的上n次提交的新提交
git revert HEAD~num

# 生成一个撤销指定提交版本的新提交
git revert [commit]

# 生成一个撤销指定提交版本的新提交，执行时不打开默认编辑器，直接使用 Git 自动生成的提交信息
git revert [commit] --no-edit
```

cherry-pick

```shell
# 将指定的提交 commit 应用于当前分支
git cherry-pick <commit_id>
git cherry-pick <commit_id> <commit_id>
```
