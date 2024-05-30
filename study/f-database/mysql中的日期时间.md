# mysql中的日期和时间


## 日期和时间在mysql中的表示

1. DATE：表示日期，格式为 'YYYY-MM-DD'，范围从 '1000-01-01' 到 '9999-12-31'。
2. TIME：表示时间，格式为 'HH:MM:SS'，范围从 '-838:59:59' 到 '838:59:59'。
3. DATETIME：表示日期和时间，格式为 'YYYY-MM-DD HH:MM:SS'，范围从 '1000-01-01 00:00:00' 到 '9999-12-31 23:59:59'。
4. TIMESTAMP：表示日期和时间，格式为 'YYYY-MM-DD HH:MM:SS'，范围从 '1970-01-01 00:00:01' UTC 到 '2038-01-19 03:14:07' UTC。TIMESTAMP 列的值将自动在插入或更新时设置为当前时间戳。
5. YEAR：表示年份，格式为 'YYYY'，范围从 1901 到 2155（4位数存储，最大值为 2155）。

此外，MySQL 还有一些与时区相关的日期和时间类型，例如：

1. DATETIME(6)、TIMESTAMP(6)：精确到微秒级别的日期和时间类型。
2. TIMEZONE：时区偏移量类型。

## 查询的时候索引使用情况

如果给列 date 添加索引，要使用索引那么就要对整个date进行过滤， 在select语句中进行 `day()`等函数的过滤 

## 日期格式

![sql_day](/study/imgs/sql_day.webp)

```sql
SELECT
  NOW() AS "现在时间",
  DATE_FORMAT(NOW(), '%Y.%m.%d') AS '格式化日期',
  TIME_FORMAT(NOW(), '%h:%i:%s') AS '格式化时间'
```

## 日期函数

在DBMS中日期和时间值以特殊的格式存储，以便能快速和有效地排序或过滤。常见的日期数据格式有两种：'yyyy-MM-dd' 和 'yyyyMMdd'。


## 时间戳-日期格式转化

时间戳是数据库中自动生成的唯一二进制数字，表明数据库中数据修改发生的相对顺序，其记录形式类似：1627963699 ，在实际工作环境中，对于用户行为发生的时间通常都是用时间戳进行记录，时间戳和日期格式之间可以利用`from_unixtime`和 `unix_timestamp`进行转换。


### unix_timestamp unix_timestamp(string timestame) 输入的时间戳格式必须为'yyyy-MM-dd HH:mm:ss',如不符合则返回null

```sql
select date as 原始时间, unix_timestamp(date) as 转换后的时间 from table

-- 原始时间 2021-05-03
--  1619971200
```

### unix_timestamp(string date,string pattern)  将指定时间字符串格式字符串转化成unix时间戳,如不符合则返回null

```sql
-- 返回'2022-11-29'的unix时间戳
select unix_timestamp('2022-11-29','yyyy-MM-dd') as time;

-- 将返回 Unix 时间戳 1156219870 对应的日期和时间，格式为 'YYYY-MM-DD HH:MM:SS'
SELECT from_unixtime(1156219870, "%Y-%m-%d %H:%m:%s")；
```

## 年月日截取

使用函数，分别为year(),month(),day() 函数

## 参考资料

[SQL日期函数大全 看这一篇就够！](https://zhuanlan.zhihu.com/p/533691995)

