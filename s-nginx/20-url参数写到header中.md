# 20-url参数写到header中


```nginx
http {
  server {
    listen 80;
    server_name example.com;

    map $args $sign_header {
      default         '';
      ~sign=(?<sign>[^&]+)   $sign;
    }

    map $args $uid_header {
      default         '';
      ~uid=(?<uid>[^&]+)   $uid;
    }

    location / {
      add_header sign $sign_header;
      add_header uid $uid_header;

      # 其他配置...
    }
  }
}

```