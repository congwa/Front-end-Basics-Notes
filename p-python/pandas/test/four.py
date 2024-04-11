import numpy as np
import pandas as pd
# 年份，人口，总计，暴力犯罪，财产犯罪，谋杀，强奸，抢劫，严重伤害，入室盗窃，盗窃，汽车盗窃
path4 = 'exercise_data/US_Crime_Rates_1960_2014.csv' 

crime = pd.read_csv(path4)

print(crime.head())

print(crime.info())

# 将Year的数据类型转换为 datetime64

crime.Year = pd.to_datetime(crime.Year, format='%Y')
print(crime.info())

# 将列Year设置为数据框的索引
crime = crime.set_index('Year', drop = True)
print(crime.head())

#删除名为Total的列

# del crime['Total']
# print(crime.head())

# 按照Year对数据框进行分组并求和
crimes = crime.resample('10AS').sum()
population = crime['Population'].resample('10AS').max()

crimes['Population'] = population

print(crimes.head())

# 何时是美国历史上生存最危险的年代？
# 总计最多的那一行

print(crime.loc[crime['Total'].idxmax()])