# 合并
import pandas as pd
import numpy as np


raw_data_1 = {
    "subject_id": ["1", "2", "3", "4", "5"],
    "first_name": ["Alex", "Amy", "Allen", "Alice", "Ayoung"],
    "last_name": ["Anderson", "Ackerman", "Ali", "Aoni", "Atiches"],
}

raw_data_2 = {
    "subject_id": ["4", "5", "6", "7", "8"],
    "first_name": ["Billy", "Brian", "Bran", "Bryce", "Betty"],
    "last_name": ["Bonder", "Black", "Balwner", "Brice", "Btisan"],
}

raw_data_3 = {
    "subject_id": ["1", "2", "3", "4", "5", "7", "8", "9", "10", "11"],
    "test_id": [51, 15, 15, 61, 16, 14, 15, 1, 61, 16],
}

data1 = pd.DataFrame(raw_data_1, columns = ['subject_id', 'first_name', 'last_name'])
data2 = pd.DataFrame(raw_data_2, columns = ['subject_id', 'first_name', 'last_name'])
data3 = pd.DataFrame(raw_data_3, columns = ['subject_id','test_id'])

# data1和data2两个数据框按照行的维度进行合并，命名为all_data
all_data = pd.concat([data1, data2])
print(all_data)

# 将data1和data2两个数据框按照列的维度进行合并，命名为all_data_col
all_data_col = pd.concat([data1, data2], axis = 1)
print(all_data_col)

print('------分界线-列合并-----')

print(data3)

print('------分界线------')

# 按照subject_id的值对all_data和data3作合并
print(pd.merge(all_data, data3, on = 'subject_id'))
print('------分界线------')

# data1和data2按照subject_id作连接
print(pd.merge(data1, data2, on='subject_id', how='inner'))
print('------分界线------')

# 找到 data1 和 data2 合并之后的所有匹配结果
print(pd.merge(data1, data2, on='subject_id', how='outer'))
