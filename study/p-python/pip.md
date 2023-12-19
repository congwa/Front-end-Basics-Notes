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