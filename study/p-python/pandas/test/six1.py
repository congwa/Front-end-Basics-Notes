# # 统计
import pandas as pd
import numpy as np
import datetime

path6 = "exercise_data/wind.data"


data = pd.read_table(path6, sep = "\s+", parse_dates = [[0,1,2]]) 
print(data.head())

# 2061年？我们真的有这一年的数据？创建一个函数并用它去修复这个bug

def fix_century(x):
    year = x.year - 100 if x.year >= 1921 else x.year
    return datetime.date(year, x.month, x.day)

data['Yr_Mo_Dy'] = data['Yr_Mo_Dy'].apply(fix_century)

print(data.head())

#  将日期设为索引，注意数据类型，应该是datetime64[ns]
# to_datetime 它用于将表示日期或时间的字符串或字符串序列转换为datetime对象
data['Yr_Mo_Dy'] = pd.to_datetime(data['Yr_Mo_Dy'])

data = data.set_index('Yr_Mo_Dy')
print(data.head())

# 对应每一个location，一共有多少数据值缺失
print(data.isnull().sum())

# 对应每一个location，一共有多少完整的数据值

print(data.notnull().sum())

print('--------分界线-------')
# pandas的神奇之处了，**pandas中计算会自动对齐索引**
print(data.shape[0] - data.isnull().sum())

print(data.shape[0])

# 创建一个名为loc_stats的数据框去计算并存储每个location的风速最小值，最大值，平均值和标准差
loc_stats = pd.DataFrame()

loc_stats['min'] = data.min()
loc_stats['max'] = data.max()
loc_stats['mean'] = data.mean()
loc_stats['std'] = data.std()

print(loc_stats)

# 对于全体数据，计算风速的平均值

print(data.mean())
print('--------分界线-------')
print(data.mean().mean())

# 对于每一个location，计算一月份的平均风速

data['date'] = data.index

data['month'] = data['date'].apply(lambda date: date.month)
data['year'] = data['date'].apply(lambda date: date.year)
data['day'] = data['date'].apply(lambda date: date.day)

january_winds = data.query('month == 1')
print(january_winds)
print('--------分界线-------')

print(january_winds.loc[:, 'RPT': "MAL"].mean())

# 对于数据记录按照年为频率采样
print(data.query('month == 1 and day == 1'))
# print(data)

#  对于数据记录按照月为频率取样
print('day == 1')


# 测试