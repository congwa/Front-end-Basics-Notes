# docker命令和分层


## create 

给`镜像`添加了一个可读写层

## start

为`容器`创建了一个隔离空间

## run

实际是 docker create + docker start两个过程


## ps

显示出来都是启动的，即有隔离空间

## ps -a

仅仅列出有隔离空间(启动中)的容器

## images

仅列出顶层镜像

说明:实际上,在这里我们没有办法区分一个镜像和一个只读层,所以我们提出了top-level镜像。只有创建容器时使用的镜像或者是直接pull下来的镜像能被称为顶层(t
op-level)镜像,并且每一个顶层镜像下面都隐藏了多个镜像层。

## images -a

列出顶层镜像和中间层所有镜像


