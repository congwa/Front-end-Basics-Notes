# sql


| 功能        | 语法                            | 示例                                  |
| ----------- | ------------------------------- | ------------------------------------- |
| where       | where <条件>                     | where id=1                           |
| as          | select <字段> as <别名>          | select xxx as 'yyy'                   |
| and         | <条件1> and <条件2>              | where a=1 and b='abc'                 |
| in/not in   | where <字段> in (<集合>)        | where a in (1,2)                      |
| between and | where <字段> between <值1> and <值2> | where a between 1 and 10             |
| limit       | limit <起始位置>,<返回数量>      | limit 0,5                            |
| order by    | order by <字段1> <排序方式1>, <字段2> <排序方式2> | order by a desc, b asc               |
| group by    | group by <字段>                  | group by aaa                          |
| having      | group by <字段> having <条件>     | group by aaa having xxx > 5           |
| distinct    | select distinct <字段>           | select distinct aaa                   |
| 聚合函数    | avg、count、sum、min、max           | select count(*) from table            |
| 字符串函数  | concat、substr、length、upper、lower | select concat(first_name, last_name) from table |
| 数值函数    | round、ceil、floor、abs、mod        | select round(price, 2) from table     |
| 日期函数    | year、month、day、date、time        | select year(date) from table          |
| 条件函数    | if、case                            | select case when a>10 then 'A' else 'B' end from table |
| 系统函数    | version、database、user              | select version() from dual            |
| 类型转换函数 | convert、cast、date_format、str_to_date | select cast(price as decimal(10,2)) from table |
| 其他函数    | nullif、coalesce、greatest、least         | select coalesce(a, b) from table       |
