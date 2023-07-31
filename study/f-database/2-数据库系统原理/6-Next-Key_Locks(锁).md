# NEXT-Key Locks 临键锁

Next-Key Locks 是 MySQL 的 InnoDB 存储引擎的一种锁实现。

MVCC 不能解决幻影读问题，Next-Key Locks 就是为了解决这个问题而存在的。在可重复读（REPEATABLE READ）隔离级别下，使用 MVCC + Next-Key Locks 可以解决幻读问题。

## Record Locks 记录锁

锁定一个记录上的索引，而不是记录本身。

如果表没有设置索引，InnoDB会自动在主键上创建隐藏的聚簇索引，因此Record Locks依然可以用

[记录锁资料参考](https://www.cnblogs.com/LoveShare/p/17023767.html)

![jilu](/study/imgs/jilu.jpeg)

### 聚簇索引

聚簇索引就是按照每张表的主键构造一颗B+树，同时叶子节点中存放的就是整张表的行记录数据，也将聚集索引的叶子节点称为数据页。这个特性决定了索引组织表中数据也是索引的一部分；

一般建表会用一个自增主键做聚簇索引，没有的话MySQL会默认创建，但是这个主键如果更改代价较高，故建表时要考虑自增ID不能频繁update这点。

我们日常工作中，根据实际情况自行添加的索引都是辅助索引，辅助索引就是一个为了找主键索引的二级索引，先找到主键索引再通过主键索引找数据；

聚簇索引并不是一种单独的索引类型，而是一种数据存储方式。具体细节依赖于其实现方式。

InnoDb中的主键索引是一种聚簇索引，非聚簇索引都是辅助索引，像复合索引、前缀索引、唯一索引。

## Gap Locks 间隙锁

锁定索引之间的间隙，但是不包含索引本身。例如当一个事务执行以下语句，其它事务就不能在 t.c 中插入 15。

```sql
SELECT c FROM t WHERE c BETWEEN 10 and 20 FOR UPDATE;
```

[间隙锁](https://www.jianshu.com/p/d1aa0f50e9cd)
[间隙锁的几种情况](https://blog.csdn.net/hjxisking/article/details/107017190)

一定要注意间隙锁的危害

## Next-Key Locks 临键锁

它是 Record Locks 和 Gap Locks 的结合，不仅锁定一个记录上的索引，也锁定索引之间的间隙。它锁定一个前开后闭区间，例如一个索引包含以下值：10, 11, 13, and 20，那么就需要锁定以下区间：

```
(-∞, 10]
(10, 11]
(11, 13]
(13, 20]
(20, +∞)
```


>这里多提一嘴，update、delete 语句用不上索引是很恐怖的。
>对非索引字段进行 select .. for update、update 或者 delete 操作，由于没有索引，走全表查询，就会对所有行记录 以及 所有间隔 都进行上锁。而对于索引字段进行上述操作，只有索引字段本身和附近的间隔会被加锁。
