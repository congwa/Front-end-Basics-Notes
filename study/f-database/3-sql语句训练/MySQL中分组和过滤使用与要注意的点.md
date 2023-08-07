# MySQL中分组和过滤使用与要注意的点

```sql
# group by 用法
select 字段 from 表 where 条件 group by 字段1，字段2，字段3

select 字段 from 表  group by 字段1，字段2，字段）having 过滤条件

# where 是 先过滤，再分组
# having 是 分组后再过滤

```


## Group By中Select指定的字段限制

- select后的字段
  - 要么就要包含在Group By语句的后面，作为分组的依据
  - 要么就要被包含在聚合函数中
  
  ```sql
  # 错误： select后面的字段 salary 不在 group by 后面，所以salary无法显示全部值 (sql_model为宽松模式下不会报错，不同版本的mysql此选项默认值不同）
  SELECT name, salary FROM student GROUP BY name

  # 正确： SELECT name, salary FROM student GROUP BY name , salary    
  SELECT name, salary FROM student GROUP BY name , salary     

  # 正确：select 后的字段 salary 虽然不在 group by 后面，但是在聚合函数MAX(salary）里面，所以只会有一个值会正确
  SELECT name,MAX(salary) FROM student GROUP BY name
  ```

## having的用法

```sql
# 执行顺序：where（数据查询） -> group by（数据编组） -> having（结果过滤） -> order by（排序）
SELECT *|字段列表 [as 别名] FROM 表名 [WHERE 子句] [GROUP BY 子句][HAVING 子句][ORDER BY 子句][LIMIT 子句]

select pid FROM node group by pid having pid > 0

# 聚合函数的使用 SUM(pid)每个分组的pid的和
select pid FROM node group by pid having SUM(pid) > 2

```

## 练习

```sql
create table student(num int ,name varchar(24),age int)
insert into student values(1,'A',21);
insert into student values(2,'B',21);
insert into student values(3,'A',21);
insert into student values(4,'A',21);
insert into student values(5,'A',21);
insert into student values(6,'C',21);
insert into student values(7,'B',21);

# 查询有重复的姓名 ------ 思路 首先是分组 我们平常查重可能都会使用count 所以也要使用 我们需要找到 count > 1 的数据
# 查询重复姓名学生的所有信息 ---- select * from student可以查看所有学生的信息，怎么查看重复的呢？上面我们已经知道了有哪些是重复的名字，那么我们只需要判断，哪些名字在重复的名字里面即可
```

```sql
# count(name) > 1 分组数量大于1说明重复
select name from student group by name having count(name) > 1;

# 错误的写法 select * from student group by name having count(name) > 1;
# 因为 group by 语句中 select 后面的字段必须在 group by 语句中后面出现 * 明显不符合标准

select * from student name in (select name from student group by name having count(name) > 1);

```