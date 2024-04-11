# 数据过滤与排序
import pandas as pd

path2 = "exercise_data/Euro2012_stats.csv"

euro12 = pd.read_csv(path2)

print(euro12)

print(euro12.Goals)

# 有多少球队参与了2012欧洲杯？

# 返回行数
print(euro12.shape[0]) 

# 该数据集一共有多少列
print(euro12.info())


# 将数据集中的列Team, Yellow Cards和Red Cards单独存为一个名叫discipline的数据框
discipline = euro12[['Team', 'Yellow Cards', 'Red Cards']]
print(discipline)

print('-------分界线-----')

# 对数据框discipline按照先Red Cards再Yellow Cards进行排序

print(discipline.sort_values(['Red Cards', 'Yellow Cards'], ascending = False))


# 计算每个球队拿到的黄牌数的平均值

print(euro12['Yellow Cards'].mean())
# 找到进球数Goals超过6的球队数据

# 条件表达式 euro12['Goals'] > 6 会生成一个布尔 Series，其中的每个元素都对应着 'Goals' 列中对应行的条件判断结果。当条件为真时，对应位置的值为 True；否则为 False。将这个布尔 Series 应用于 DataFrame 的方括号索引中，就可以根据条件筛选出相应的行

print(euro12[euro12['Goals'] > 6])

# 选取以字母G开头的球队数据

print(euro12[euro12.Team.str.startswith('G')])

#  选取前7列
# iloc df.iloc[row_index, column_index]
# loc  df.loc[row_label, column_label]
# at   df.at[row_label, column_label]  用于访问单个元素，类似于 loc，但更高效
# iat  df.iat[row_index, column_index] 用于访问单个元素，类似于 iloc，但更高效
print(euro12.iloc[:, :7])

#  选取除了最后3列之外的全部列

print(euro12.iloc[:, :-3])

# 找到英格兰(England)、意大利(Italy)和俄罗斯(Russia)的射正率(Shooting Accuracy)

print(euro12.loc[euro12.Team.isin(['England', 'Italy', 'Russia']), ['Team', 'Shooting Accuracy']])