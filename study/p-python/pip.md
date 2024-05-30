# pip

## 1. 单虚拟环境生成requirements.txt

```sh
pip freeze > requirements.txt
```

## 2. 全局环境使用pipreqs生成requirements.txt

```sh
pip install pipreqs
pipreqs . --encoding=utf8 --force
```

## 3. requirements.txt 安装依赖

```sh
pip install -r requirements.txt
```

## 4. 删除所有依赖

```sh
pip freeze >requirements.txt

pip uninstall -r requirements.txt -y
```

## 切换源

```sh
#  切换为阿里云的源
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

#查看当前源
pip config get global.index-url

```