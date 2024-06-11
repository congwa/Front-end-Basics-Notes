# limit问题

- 历史帖子：[limit分页优化](/study/f-database/limit分页优化.md)

## 效率问题

> 当偏移量m过大的时候，查询效率会很低。因为MySQL是先查出m+n个数据，然后抛弃掉前m个数据。

- 避免数据量大时扫描过多的记录
- 可以通过子查询查出查出目标数据集合的第一个数据所在的行，然后用 >= 操作。

```sql

-- 传统limit，文件扫描
[SQL]SELECT * FROM tableName ORDER BY id LIMIT 500000,2;
受影响的行: 0
时间: 5.371s

-- 子查询方式，索引扫描
[SQL]
SELECT * FROM tableName
WHERE id >= (SELECT id FROM tableName ORDER BY id LIMIT 500000 , 1)
LIMIT 2;
受影响的行: 0
时间: 0.274s

-- JOIN分页方式
[SQL]
SELECT *
FROM tableName AS t1
JOIN (SELECT id FROM tableName ORDER BY id desc LIMIT 500000, 1) AS t2
WHERE t1.id <= t2.id ORDER BY t1.id desc LIMIT 2;
受影响的行: 0
时间: 0.278s

```

## 数据异常

当数据库中的数据少于限定条件的数量，那么limit会自动填充一些数据，这样就会出现数据异常。

- 通常查出数据来后，再进行一遍数据清洗，以防数据异常
