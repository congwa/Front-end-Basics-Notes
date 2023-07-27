# redis常用命令

redis的类型有很多: 字符串（string）、列表（list）、集合（set）、有序集合（sorted set)、哈希表（hash）、地理信息（geospatial）、位图（bitmap）等。


## string

```sh
# set
set

# get
get

# 递增
incr

# 通过 keys 'dong*' 查询dong开头的keys  keys * 查询所有key
keys
```

## list

```sh
# LPUSH key value [value ...]  
# 将一个或多个值插入到列表的左侧（头部）。
# 返回执行操作后列表的长度。
lpush

# LPOP key
# 从列表的左侧（头部）移除并返回一个值。
# 返回被移除的值，如果列表为空则返回 nil。
lpop


# LLEN key
# 返回列表的长度（即包含的元素数量）
# 返回列表的长度，如果列表不存在则返回 0。
llen

# lrange list1 0 -1
# lrange list1 0 -1 就是查询 list1 的全部数据
lrange

# LMOVE source destination LEFT|RIGHT LEFT|RIGHT value
# 指定的元素从源列表移动到目标列表。
# 返回移动操作的结果，成功返回 1，失败返回 0。
lmove

# LTRIM key start stop
# 修剪列表，只保留指定范围内的元素，其它的元素将被删除。
# 返回值：无
ltrim


rpush

rpop
```

## set 无序并且元素不重复

set 只能去重、判断包含，不能对元素排序。

```sh
sadd

# 通过 sismember 判断是否是集合中的元素
sismember

```


## sorted set

```sh
zadd zset1 5 guang

zrange zset1 0 2
```

## hash

```sh
hset

hget


```


## geo

```sh
# redis 实际使用 zset 存储的，把经纬度转化为了二维平面的坐标：
geoadd loc 13.361389 38.115556 "guangguang" 15.087269 37.502669 "dongdong" 

geodist loc guangguang dogndong
```

## expire 

```sh
expire dogn1 30
```