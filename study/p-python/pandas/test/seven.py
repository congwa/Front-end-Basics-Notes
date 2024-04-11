import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# PassengerId（乘客ID）：表示乘客的唯一标识符
# Survived（是否幸存）：表示乘客是否幸存，通常用0表示未幸存，1表示幸存
# Pclass（客舱等级）：表示乘客所在的客舱等级，通常分为1、2、3三个等级
# Name（姓名）：表示乘客的姓名
# Sex（性别）：表示乘客的性别，通常用"male"表示男性，"female"表示女性
# Age（年龄）：表示乘客的年龄
# SibSp（兄弟姐妹/配偶数）：表示乘客在船上的兄弟姐妹或配偶的数量
# Parch（父母/子女数）：表示乘客在船上的父母或子女的数量
# Ticket（票号）：表示乘客的船票号码
# Fare（票价）：表示乘客支付的票价
# Cabin（客舱号）：表示乘客所在的客舱号码
# Embarked（登船港口）：表示乘客登船的港口，通常用"C"表示Cherbourg，"Q"表示Queenstown，"S"表示Southampton

path7 = 'exercise_data/train.csv'  # train.csv

titanic = pd.read_csv(path7)

# print(titanic.info())
# print(titanic.head())

print(titanic.set_index('PassengerId').head())

#  绘制一个展示男女乘客比例的扇形图

# males = (titanic['Sex'] == 'male').sum()
# females = (titanic['Sex'] == 'female').sum()

# proportions = [males, females]

# plt.pie(
#     # using proportions
#     proportions,
    
#     # with the labels being officer names
#     labels = ['Males', 'Females'],
    
#     # with no shadows
#     shadow = False,
    
#     # with colors
#     colors = ['blue','red'],
    
#     # with one slide exploded out
#     explode = (0.15 , 0),
    
#     # with the start angle at 90%
#     startangle = 90,
    
#     # with the percent listed as a fraction
#     autopct = '%1.1f%%'
#     )

# # View the plot drop above
# plt.axis('equal')

# # Set labels
# plt.title("Sex Proportion")

# # View the plot
# plt.tight_layout()
# plt.show()

# 绘制一个展示船票Fare, 与乘客年龄和性别的散点图

# lm = sns.lmplot(x = 'Age', y = 'Fare', data = titanic, hue = 'Sex', fit_reg=False)

# # set title
# lm.set(title = 'Fare x Age')

# # get the axes object and tweak it
# axes = lm.axes
# axes[0,0].set_ylim(-5,)
# axes[0,0].set_xlim(-5,85)

# 有多少人生还

print(titanic.Survived.sum())

# 绘制一个展示船票价格的直方图

df = titanic.Fare.sort_values(ascending = False)

# create bins interval using numpy
binsVal = np.arange(0,600,10)

# create the plot
plt.hist(df, bins = binsVal)

# Set the title and labels
plt.xlabel('Fare')
plt.ylabel('Frequency')
plt.title('Fare Payed Histrogram')

# show the plot
plt.show()