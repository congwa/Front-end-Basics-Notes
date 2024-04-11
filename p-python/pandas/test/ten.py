import pandas as pd
import numpy as np


path10 ='exercise_data/iris.csv' 
iris = pd.read_csv(path10)
print(iris.head())

# 数据框中有缺失吗
print(pd.isnull(iris).sum())

#  将列petal_length的第10到19行设置为缺失值
iris.iloc[10:20, 2:3] = np.nan

print(iris.head(20))
print(iris.info())

# 将缺失值全部替换为1.0
iris.fillna(1, inplace=True)

print(iris.head(20))

# 将数据的前三行设置为缺失值

iris.iloc[:3, :] = np.nan
print(iris.head())

# 删除列
# del iris['class']

# print(iris.head())

#  删除有缺失的行
# dropna() 方法的常用参数有：
# axis：指定要删除的轴，axis=0（或 axis='index'）表示按行删除，axis=1（或 axis='columns'）表示按列删除。
# how：指定删除行或列的条件。how='any' 表示只要存在缺失值，就删除对应的行或列；how='all' 表示只有当整行或整列都是缺失值时，才删除。
# subset：指定要考虑的列或索引标签，仅在这些列或标签中的缺失值才会被考虑删除。
iris = iris.dropna(how='any')
print(iris.head())

# 重新设置索引
print('----------分界线--------')
print(iris.head())
print('----------分界线--------')
iris = iris.reset_index(drop = True)
print(iris.head())