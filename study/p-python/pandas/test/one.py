import pandas as pd

path1 = "exercise_data/chipotle.tsv"

chipo = pd.read_csv(path1, sep = '\t')

# 显示前10行数据
print(chipo.head(10))

# 显示有多少列
print(chipo.shape[1])

# 打印出全部列的名称
print(chipo.columns)

# 数据集索引
print(chipo.index)

# 被下单的最多的商品是什么
c = chipo[['item_name', 'quantity']].groupby(['item_name'], as_index=False).agg({'quantity': 'sum'})
c.sort_values(['quantity'], ascending=False, inplace=True)
print(c.head())

# 在item_name这一列中，一共有多少种商品被下单?

print(len(chipo['item_name'].unique()))


# 在choice_description中，下单次数最多的商品是什么
print(chipo['choice_description'].value_counts().head())

# 一共有多少商品被下单？
print(chipo['quantity'].sum())

#  将item_price转换为浮点数
print(chipo['item_price'].head(1).apply(list))
dollarizer = lambda x: float(x[1:-1])
chipo['item_price'] = chipo['item_price'].apply(dollarizer)
print(chipo['item_price'].head())

# 在该数据集对应的时期内，收入(revenue)是多少
chipo['sub_total'] = round(chipo['item_price'] * chipo['quantity'], 2)
print(chipo['sub_total'].sum())

# 在该数据集对应的时期内，一共有多少订单？
print(chipo['order_id'].nunique())

# 每一单(order)对应的平均总价是多少？

print(chipo[['order_id', 'sub_total']].groupby(by=['order_id']).agg({'sub_total': 'sum'})['sub_total'].mean())


#  一共有多少种不同的商品被售出？
print(chipo['item_name'].nunique())