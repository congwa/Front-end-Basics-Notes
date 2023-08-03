FROM openresty/openresty:bullseye-fat

#RUN docker run -p 8000:80 -d --name openresty -v /Users/cong/code/my/bio/study/s-nginx/openResty/nginx.conf:/etc/nginx/conf.d/default.conf --privileged=true openresty/openresty

WORKDIR /etc/nginx/conf.d

RUN opm install thibaultcha/lua-resty-jit-uuid

COPY ./nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

COPY ./hello.lua ./hello.lua

EXPOSE 80

#  docker run --name openresty-demo1 -p 8099:80