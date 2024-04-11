import pandas as pd

raw_data = {
    "name": ["Bulbasaur", "Charmander", "Squirtle", "Caterpie"],
    "evolution": ["Ivysaur", "Charmeleon", "Wartortle", "Metapod"],
    "type": ["grass", "fire", "water", "bug"],
    "hp": [45, 39, 44, 45],
    "pokedex": ["yes", "no", "yes", "no"],
}


pokemon = pd.DataFrame(raw_data)
pokemon.head()

# 数据框的列排序是字母顺序，请重新修改为name, type, hp, evolution, pokedex这个顺序

pokemon = pokemon[['name', 'type', 'hp', 'evolution', 'pokedex']]

print(pokemon)

# 添加一个列 place
pokemon['place'] = ['park', 'street', 'lake', 'forest']

print(pokemon)

# 查看每个列的数据类型

print(pokemon.dtypes)