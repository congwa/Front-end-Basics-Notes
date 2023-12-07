# grep 管道

它允许您在文件中查找**包含指定模式（字符串）的行**

```sh
grep [选项] 模式 文件

# -i：忽略大小写。
# -n：显示匹配行的行号。
# -r 或 -R：递归地搜索子目录。
# -v：反向选择，即显示不匹配的行。
# -c：仅显示匹配行的计数。
# -l：仅显示包含匹配项的文件名。
# -e：指定多个模式。

```

示例

```sh
# 在文件中搜索包含 "example" 的行：
grep "example" filename.txt

# 在多个文件中递归搜索 "pattern"，并显示匹配的行和文件名
grep -r "pattern" directory/

# 搜索不区分大小写的 "word" 并显示行号：
grep -i -n "word" filename.txt

# 显示包含匹配项的文件名：
grep -l "pattern" directory/*

# 查看前100行
grep -B 100 '字符串' [filename]

# 查看后100行
grep -A 100 '字符串' [filename]
```