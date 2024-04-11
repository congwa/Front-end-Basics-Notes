# 谷歌云存储桶gzip开启

google存储桶cdn开启gzip

gsutil -m cp -Z -r 增加-Z参数

 

在google cdn的backend增加自定义header头 Content-Encoding: gzip

```sh
  gsutil -h "Content-Encoding:gzip" -m cp -Z -r $client_path ----
```

-h参数增加
