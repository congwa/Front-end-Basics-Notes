# mysql索引

## 什么是索引

索引就像书籍的目录，有了索引，数据库可以快速查询到目标的内容，而不必查找整个数据表，但是如果没有的话，数据库只能一行一行的遍历数据。

本文案例表： 学生表(t_student)

```sql
CREATE TABLE `t_student` (
  `st_id` varchar(20) NOT NULL COMMENT '学号',
  `st_name` varchar(20) NOT NULL COMMENT '姓名',
  `st_sex` varchar(2) NOT NULL COMMENT '性别',
  `st_academy` varchar(20) NOT NULL COMMENT '学院',
  `st_major` varchar(20) NOT NULL COMMENT '专业',
  `st_class` varchar(20) NOT NULL COMMENT '班级',
  `st_grade` int(11) NOT NULL COMMENT '年级',
  `st_edu_len` int(11) NOT NULL COMMENT '学制',
  `st_is_at_school` varchar(4) default NULL COMMENT '是否在校',
  PRIMARY KEY  (`st_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## 索引种类

1. 单列索引，包括普通索引（index）、唯一索引(unique index)、主键索引（primary key）,一个单列索引只能包含一列属性
2. 组合索引，一个组合索引包括两个或两个以上的列
3. 全文索引（fulltext index），检索出多列文本字段上(text 类型)包含某些单词的索引

## 索引的创建

### （1）单列索引

1. 普通索引，最基本的索引
   - 第一种方式： 语法为 `create index 索引名 on 表名(要建立索引的列名)`

      ```sql
      create index i_st_class on t_student(st_class);
      ```

   - 第二种方式：语法为 `alter table 表名 add index 索引名(要建立索引的列名)`
      
      ```sql
      alter table t_student add index i_st_class(st_class);
      ```
      
2. 唯一索引，与普通索引类似，但唯一索引的每一个索引值只对应唯一数据记录，这一点又与主键索引类似，但唯一索引允许null值
   
   语法为： 在创建普通索引的语句中的index前面加上unique即可(假设学生表中的姓名不重复)
   
   ```sql
   create unique index i_st_name on t_student(st_name);
   ```

  或

  ```sql
  alter table t_student add unique index i_st_name(st_name);
  ```

  > 如果能确定某个数据列将只包含彼此各不相同的值，在为这个数据列创建索引的时候就应该用关键字UNIQUE把它定义为一个唯一索引。这么做的好处：一是简化了MySQL对这个索引的管理工作，这个索引也因此而变得更有效率；二是MySQL会在有新记录插入数据表时，自动检查新记录的这个字段的值是否已经在某个记录的这个字段里出现过了；如果是，MySQL将拒绝插入那条新记录。也就是说，唯一索引可以保证数据记录的唯一性。事实上，在许多场合，人们创建唯一索引的目的往往不是为了提高访问速度，而只是为了避免数据出现重复。

3. 主键索引，在唯一索引的基础上不允许索引列有null值。 主键索引一般用在与表中其他列无关或与业务无关的列上，一般是int，自增类型的列上。
  不能使用create index语句创建主键索引，只能在建表时创建或alter语句中：

  ```sql
  alter table t_student add primary key (st_id);
  ```

### （2）组合索引

#### 1. 创建组合索引

一个组合索引包含多个列，一个组合索引对应的数据记录必须唯一，建立组合索引的语句如下:

  ```sql
  create index i_name_major_class on t_student(st_name, st_major, st_class);
  ```

  或

  ```sql
  # 根据创建的规则，最做前缀顺序 (st_name)、(st_name,st_major)、(st_name, st_major, st_class) 
  alter table t_student add index i_name_major_class(st_name, st_major, st_class);
  ```

如果我们建立了以上的组合索引，实际上包含了三个索引，分别是(name), (name, major), (name, major, class)

那么我们在查询的时候，如果使用到组合索引，就必须遵循组合索引的`最左前缀原则`

#### 最左前缀原则

用自己的话来说，就是从嘴和索引的最左列开始，where语句中必须包含此列，且可跳过中间列，到达目标列的匹配规则。

实际上就是上方所说的三种组合(name), (name, major), (name, major, class)

以下哪些语句走组合索引呢？

```sql
select * from t_student where st_name = '123';
select * from t_student where st_name = '123' and st_major = '123';
select * from t_student where st_name='123' and st_class='123';
select * from t_student where st_name='123' and st_major='123' and st_class='123';
```

可以使用explain语句来显示mysql对查询处理的过程

不走组合索引的情况

```sql
select * from t_student where st_major='123';
select * from t_student where st_class='123';
select * from t_student where st_major='123' and st_class='123';
```

即where条件中如果不带组合索引的最左列的话，肯定不走组合索引

## 索引的删除

删除索引的格式为: `alter table 表名 drop index 索引名`

```sql
alter table t_student drop index i_name_major_class;
```

或：`drop index 索引名 on 表名`

```sql
drop index i_name_major_class on t_student;
```

## 使用索引的优缺点

### （1）优点

1. 可以通过建立唯一索引或者主键索引，保证数据表中每一行数据的唯一性
2. 建立索引可以打打提高检索的数据，提高查询性能，以减少表的检索行数
3. 在分组和排序的子句中进行数据检索，可以减少查询时间中分组和排序所消耗的时间(数据库中的记录会重新排序)


### （2）缺点

1. 创建索引和维护索引也会消耗时间
2. 每一个索引还会占用一定的物理空间，索引建的多了，数据库的文件也会变的庞大起来
3. 当对表的数据进行插入、删除、更新的操作，索引也要动态的维护，这样就会降低表的效率。

## 使用索引要注意的地方

1. 在经常需要搜索的列上建立索引，可以加快查询的速度
2. 在主键列上主键索引，可以确保此列数据的唯一性
3. 如果你对st_name字段建立了一个索引，当查询时候的语句是 `select * from t_student where st_name like '%123%'` 或 `like '%123'`,那么这个索引将不会起到作用，而`st_name like '123%'`才可以用到索引
4. 不要在列上进行运算，这样会使mysql索引失效，也会进行全表扫描
   
    ```sql
    # 当使用字符串拼接操作符时，数据库需要将每个记录的 st_name 字段值与 '001' 进行拼接，然后再与 'John001' 进行比较。这会导致每个记录都进行计算，而无法充分利用索引。
    SELECT * FROM t_student WHERE st_name + '001' = 'John001';

    # 这样就可以利用索引了
    SELECT * FROM t_student WHERE st_name = 'John';
    ```

## 不需要创建索引的情况

1. 查询中很少使用到的列，不应该创建索引，如果建立了索引，就会降低mysql的性能，也占用了存储空间
2. 当表的插入、删除、修改操作远远多于查询操作时，不应该创建索引，此时会占用数据的存储空间，降低维护效率，因为索引只能提高查询效率。