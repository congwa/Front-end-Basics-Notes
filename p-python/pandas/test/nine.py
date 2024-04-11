import pandas as pd
import numpy as np

# visualization
import matplotlib.pyplot as plt

path9 = 'exercise_data/Apple_stock.csv'   # Apple_stock.csv
apple = pd.read_csv(path9)
print(apple.head())
print(apple.dtypes)

# 将Date这个列转换为datetime类型

apple['Date'] = pd.to_datetime(apple['Date'])
print(apple['Date'].head())

apple = apple.set_index('Date')

print(apple.head())

# 有重复的日期吗

print(apple.index.is_unique)


# 将index设置为升序

apple.sort_index(ascending=True, inplace=True)

print(apple.head())

# 找到每个月的最后一个交易日(business day)
# esample()函数可以根据指定的频率对时间序列数据进行降采样（将高频率数据聚合为低频率）或升采样（将低频率数据转换为高频率）
# B 工作日
# M 月 每月的工作日，排序后取最后一个就是每月最后一个工作日 按照BM聚合
apple_month = apple.resample('BM').last()
print(apple_month)

#  数据集中最早的日期和最晚的日期相差多少天？
# (apple.index.max() - apple.index.min()) 的结果是一个时间差（Timedelta）对象, 可以取components对象，可以接天、小时、分钟、秒
# 如果是月和年需要转换为Period对象是pandas中的一个数据结构，用于表示时间范围中的固定周期。它可以表示特定的年份、季度、月份、周或天，具体取决于指定的频率。
print((apple.index.max() - apple.index.min()).days)
# (apple.index.max() - apple.index.min()).days

month_diff = (apple.index.max().to_period('M') - apple.index.min().to_period('M')).n
print(month_diff)


# 在数据中一共有多少个月

apple_months = apple.resample('BM').mean()
print(len(apple_months.index))

# 按照时间顺序可视化Adj Close值
appl_open = apple['Adj Close'].plot(title = "Apple Stock")

# changes the size of the graph
fig = appl_open.get_figure()
fig.set_size_inches(13.5, 9)

plt.show()