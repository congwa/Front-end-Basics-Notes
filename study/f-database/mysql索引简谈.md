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
4. 前缀索引- 通过字段前n位创建的索引就称为“前缀索引”

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

### (3) 全文索引

什么是全文索引

1. 其他索引是把字段的内容作为一个整体进行索引设计。
2. 全文索引，是把内容中的一些“单词”拆出来作为索引字段使用。

类似我们有一篇作文，把作文中的一些关键字给获取出来当成是索引内容

![sql full](/study/imgs/sql-full.png)

全文索引可以帮助我们解决： **模糊查询不能使用索引问题**：

例如：

```sql
select * from 表 where introduce like ‘%美国%’;  //不会使用索引
```

创建语法 :`alter table 表名 add fulltext key(字段)`

使用语法: `select * from 表名 where match(字段) against('模糊内容');` ,模糊内容外有引号，千万别使用like，否则索引无效。

**注意**，mysql本身的全文索引在做模糊查询的时候会有"自身的考虑",把一些不常见的特殊内容给设计为索引内容，一些生活等常见语(what where how SQL等)就不给设计为索引内容了

全文索引注意：

1. 字段类型必须为 `varchar char text`类型
2. mysql 5.6.4之前只有myisam支持，5.6.4之后innoDb添加了支持
3. mysql中的全文索引目前只支持英文(不支持中文),**如果需要支持中文可以使用sphinx,mysql自带全文索引在国内基本不用**
4. 生产活动中mysql的全文索引不常使用,可以使用sphinx代替
5. mysql全文索引会自作聪明，对关键词的收录有自己的考虑。 例如生活常用单词、频繁使用单词都不给创建索引(比如 for when where run等等)

#### sphinx 

Sphinx是一个基于SQL的全文检索引擎，可以结合MySQL,PostgreSQL做全文搜索，它可以提供比数据库本身更专业的搜索功能，使得应用程序更容易实现专业化的全文检索。Sphinx特别为一些脚本语言设计搜索API接口，如Java，PHP，Python，Perl，Ruby等，同时为MySQL也设计了一个存储引擎插件

Sphinx 单一索引最大可包含1亿条记录，在1千万条记录情况下的查询速度为0.x秒（毫秒级）。Sphinx创建索引的速度为：创建100万条记录的索引只需 3～4分钟，创建1000万条记录的索引可以在50分钟内完成，而只包含最新10万条记录的增量索引，重建一次只需几十秒。

高速索引 （在新款CPU上，近10 MB/秒）; 高速搜索 (2-4G的文本量中平均查询速度不到0.1秒); 高可用性 （单CPU上最大可支持100 GB的文本，100M文档）; 提供良好的相关性排名 支持分布式搜索； 提供文档摘要生成； 提供从MySQL内部的插件式存储引擎上搜索 支持布尔，短语， 和近义词查询； 支持每个文档多个全文检索域（默认最大32个）; 支持每个文档多属性； 支持断词； 支持单字节编码与UTF-8编码；

### （4）前缀索引

通过字段前n位创建的索引就称为“前缀索引”。如果一个字段内容的前边的n位信息已经足够标识当前的字段内容，就可以把字段的前n位获得出来并创建索引，该索引占据空间更小、运行速度更快.

例如：

- **关**伟伟
- **关**小宝
- **吕**纪无
- **刘**尚香
- **王**云斐

以上4个记录信息创建索引，完全可以把第一个字给获得出来创建索引，第一个字完全可以唯一标识每个字段内容。

语法：`alter table 表名 add key (字段(前n位位数))`

#### 到底前几位可以唯一标识字段的内容？

获取制作前缀索引的n的信息：

1. 去除字段重复内容并计算总数目
2. 取字段的前(n)1、2、3.....位不重复的信息并计算总数目，n从1开始不断累加，直到总数目 与 ①计算的总数目相等，此时n就是我们设计前缀索引的数字n信息.

mysql中截取字段的前n位信息，使用函数left(字段,长度).例如截取前5位信息： left(字段,5).

#### 制作前缀索引

计算全部字段不重复记录的总条数: `select count(distinct 字段) from 表;`

计算前n位不重复记录的总条数，n从1开始累加： `select count(distinct left(字段，n)) from 表;`



## 索引的删除

删除索引的格式为: `alter table 表名 drop index 索引名`

```sql
alter table t_student drop index i_name_major_class;
```

或：`drop index 索引名 on 表名`

```sql
drop index i_name_major_class on t_student;
```

比较两个统计的数据是否一致,如果一致就取N的值作为前缀索引. 前缀索引比普通索引速度要快很多.
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

    此项也叫 列独立- 只有参与条件表达式的字段独立在关系运算符的一侧，该字段才可能使用到索引。“独立的列”是指索引列不能是表达式的一部分，也不能是函数的参数。
   
    ```sql
    # 当使用字符串拼接操作符时，数据库需要将每个记录的 st_name 字段值与 '001' 进行拼接，然后再与 'John001' 进行比较。这会导致每个记录都进行计算，而无法充分利用索引。
    SELECT * FROM t_student WHERE st_name + '001' = 'John001';

    # 这样就可以利用索引了
    SELECT * FROM t_student WHERE st_name = 'John';

    select * from  表 where age + 10 = 30;			//age 参与了计算,不是独立的一列
    select * from  表 where age= 30 - 10;		//age 是独立的一列
    ```
    
5. or运算都具有索引 - 如果出现OR(或者)运算，要求所有参与运算的字段都存在索引，才会使用到索引。
6. mysql智能选择 - 如果mysql认为，全表扫描不会慢于使用索引，则mysql会选择放弃索引，直接使用全表扫描。一般当取出的数据量超过表中数据的20%，优化器就不会使用索引，而是全表扫描
7. 注意复合索引的最左前缀原则才能利用索引生效

## 不需要创建索引的情况

1. 查询中很少使用到的列，不应该创建索引，如果建立了索引，就会降低mysql的性能，也占用了存储空间
2. 当表的插入、删除、修改操作远远多于查询操作时，不应该创建索引，此时会占用数据的存储空间，降低维护效率，因为索引只能提高查询效率。