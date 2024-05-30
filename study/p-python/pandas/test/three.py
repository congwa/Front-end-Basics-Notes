# 数据分组
import pandas as pd

path3 = "exercise_data/drinks.csv"

# country：国家
# beer_servings：啤酒消费量（以升为单位）
# spirit_servings：烈酒消费量（以升为单位）
# wine_servings：葡萄酒消费量（以升为单位）
# total_litres_of_pure_alcohol：纯酒精总消费量（以升为单位）
# continent：大洲

# 将数据框命名为drinks
drinks = pd.read_csv(path3)
# print(drinks.head())

# 哪个大陆(continent)平均消耗的啤酒(beer)更多？
# idxmax() 是 Pandas 中的一个方法，用于找到具有最大值的元素的索引
print(drinks.groupby('continent').beer_servings.mean().idxmax())

# 打印出每个大陆(continent)的红酒消耗(wine_servings)的描述性统计值
# 计数（count）：非缺失值的数量。
# 平均值（mean）：数据的平均值。
# 标准差（std）：数据的标准差，衡量数据的离散程度。
# 最小值（min）：数据的最小值。
# 四分位数（25%、50%、75%）：数据的四分位数，提供数据的分布情况。
# 最大值（max）：数据的最大值。
print(drinks.groupby('continent').wine_servings.describe())

print('------分界线------')

# 打印出每个大陆每种酒类别的消耗平均值
print(drinks.groupby('continent')[['beer_servings', 'wine_servings', 'spirit_servings', 'total_litres_of_pure_alcohol']].mean())

# 打印出每个大陆每种酒类别的消耗中位数

print(drinks.groupby('continent')[['beer_servings', 'wine_servings', 'spirit_servings', 'total_litres_of_pure_alcohol']].median())


# 打印出每个大陆对spirit饮品消耗的平均值，最大值和最小值

print(drinks.groupby('continent')[['spirit_servings']].agg(['mean', 'max', 'min']))