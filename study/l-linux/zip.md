# zip

压缩

```sh
# 压缩文件
zip filename.zip  文件

# 压缩目录
zip -r filename.zip  目录(./*)
```


unzip解压文件

```sh
unzip -o -d /home/sunny myfile.zip

# 把myfile.zip文件解压到 /home/sunny/
# -o:不提示的情况下覆盖文件;
# -d:-d /home/sunny指明将文件解压缩到/home/sunny目录下。
```

zip删除压缩文件中指定文件

```sh
# 从名为 "filename.zip" 的ZIP压缩文件中删除名为 "file" 的文件
zip -d filename.zip file
```

zip向压缩文件中myfile.zip中添加rpm_info.txt文件

```sh
zip -m myfile.zip ./rpm_info.txt
```




