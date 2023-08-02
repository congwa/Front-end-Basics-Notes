# limit 分页优化

分页算法： `limit(页码-1) * 条数 , 条数`

测试

```
+----------+------------+--------------------------------------+
| Query_ID | Duration   | Query                                |
+----------+------------+--------------------------------------+
|        1 | 0.00049325 | select * from user limit 1000 ,10    |
|        2 | 0.03135925 | select * from user limit 100000 ,10  |
|        3 | 0.25734325 | select * from user limit 1000000 ,10 |
|        4 | 0.77315600 | select * from user limit 3000000 ,10 |
+----------+------------+--------------------------------------+
```

如上测试得出结论，**limit offset,N;当offset非常大时，效率极低**

原因是： mysql并不是跳过offset行，然后单取N行。 而是取offset+N行，放弃前N行。效率极低，当offset越大时，效率越低。

![sql-offset](/study/imgs/sql-offset.png)


优化办法

1. 从业务上去解决： 办法： 不允许翻过100页，以百度为例，一般翻页到70页所有，谷歌40页左右
2. 不用offset，用条件查询，用条件替代偏移量

通过`where + order + limit` 来取代 `order + limit`偏移量，长度

```
从名为 user 的表中选择所有满足条件 id > 2000000 的记录，并按照 id 字段进行升序排序。然后，通过 LIMIT 10 限制结果集最多返回 10 条记录。
+----------+------------+------------------------------------------------------------+
| Query_ID | Duration   | Query                                                      |
+----------+------------+------------------------------------------------------------+
|        1 | 0.00030950 | select * from user where id > 2000000 order by id limit 10 |
|        2 | 0.00029175 | select * from user where id > 4000000 order by id limit 10 |
+----------+------------+------------------------------------------------------------+
```

并且使用到了索引：

```
           id: 1
  select_type: SIMPLE
        table: user
   partitions: NULL
         type: range
possible_keys: PRIMARY
          key: PRIMARY   // key代表索引  show keys from 表名; 来查看索引
      key_len: 4 
          ref: NULL
         rows: 1232052
     filtered: 100.00
        Extra: Using where
1 row in set, 1 warning (0.00 sec)
```

![where-order](/study/imgs/sql-limit-where-oreder.png)

注意

`where + order + limit`算法问题

![question](/study/imgs/sql-where-order-question.png)

通过where+order+limit实现数据获取的注意：

1. 排序的字段最好是从1开始，并且是连续自增的，这样方便where计算并获得指定的数据信息.
2. 这种方法使用次数较少 , 一般都是从业务上进行解决,就是限制显示页数.