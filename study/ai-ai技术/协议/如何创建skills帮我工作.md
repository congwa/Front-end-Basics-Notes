# 如何创建Skills帮我工作

上周给PPT换主题，折腾了半小时。

选颜色、配字体、调对比度。改了五六遍，还是不满意。

后来我发现：这破事儿每次做PPT都要来一遍。

于是用Skills解决了。现在说一句"用海洋主题"，AI自动把配色字体全套应用上去。30秒搞定。

这篇文章，拿`theme-factory`这个真实的Skill当例子，教你怎么创建第一个属于自己的Skill。

## 什么是Skill？

一句话：**Skill是打包好的能力，让AI按需加载。**

你可以把它理解成"教程包"。

以前你让AI帮你干活，得把所有要求说一遍：
> "帮我换PPT主题，用深蓝色做主色，配一个青色的强调色，标题用粗体，正文用常规字重，注意对比度..."

每次都说，烦。Token也烧得厉害。

现在用Skill，你提前把这些规则写好，打包成一个文件夹。下次只需要说：
> "用海洋主题"

AI自动识别、加载规则、执行。

**说白了：重复的话只说一次，以后AI自己记着。**

## Skill长什么样？

拿`theme-factory`这个Skill举例。它的文件结构是这样的：

```
theme-factory/
├── SKILL.md              # 核心指令（必需）
├── theme-showcase.pdf    # 主题预览图
└── themes/               # 10个主题配置
    ├── ocean-depths.md
    ├── sunset-boulevard.md
    ├── forest-canopy.md
    └── ... 其他7个
```

三种文件，分工不同：

- **SKILL.md**：告诉AI这Skill干嘛、怎么用
- **themes/**：存每个主题的颜色和字体
- **theme-showcase.pdf**：预览图，给人看的

没了。不用写代码，不用配API。

## SKILL.md怎么写？

这是整个Skill的核心。拆开看`theme-factory`的SKILL.md：

### 第一部分：元数据（必须有）

```yaml
---
name: theme-factory
description: Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creating, or can generate a new theme on-the-fly.
---
```

两个字段：

**name**：Skill的ID。小写字母、数字、连字符，最多64个字符。

**description**：最重要的字段。它决定了AI什么时候会想起这个Skill。

写description的公式：
> 做什么 + 什么时候用 + 触发关键词

theme-factory的description包含了：
- 做什么：styling artifacts with a theme
- 什么时候用：slides, docs, reportings, HTML landing pages
- 触发关键词：theme, colors, fonts

当你说"给PPT换个主题"，AI看到"主题"这个词，就会匹配到这个Skill。

### 第二部分：使用说明

```markdown
## Usage Instructions

To apply styling to a slide deck or other artifact:

1. **Show the theme showcase**: Display the `theme-showcase.pdf` file
2. **Ask for their choice**: Ask which theme to apply to the deck
3. **Wait for selection**: Get explicit confirmation about the chosen theme
4. **Apply the theme**: Once a theme has been chosen, apply the selected theme's colors and fonts
```

这部分告诉AI具体怎么操作。步骤越清晰越好。

注意：这是写给AI看的，不是写给人看的文档。

### 第三部分：资源说明

```markdown
## Theme Details

Each theme is defined in the `themes/` directory with complete specifications including:
- Cohesive color palette with hex codes
- Complementary font pairings for headers and body text
```

告诉AI：需要的时候去`themes/`目录找具体配置。

这叫"渐进式披露"。AI不会一上来就加载全部主题文件。你选了哪个，它才去读哪个。省Token。

## 主题配置文件怎么写？

看`ocean-depths.md`这个例子：

```markdown
# Ocean Depths

A professional and calming maritime theme that evokes the serenity of deep ocean waters.

## Color Palette

- **Deep Navy**: `#1a2332` - Primary background color
- **Teal**: `#2d8b8b` - Accent color for highlights and emphasis
- **Seafoam**: `#a8dadc` - Secondary accent for lighter elements
- **Cream**: `#f1faee` - Text and light backgrounds

## Typography

- **Headers**: DejaVu Sans Bold
- **Body Text**: DejaVu Sans

## Best Used For

Corporate presentations, financial reports, professional consulting decks, trust-building content.
```

结构很清楚：
- 颜色配色（带hex值）
- 字体搭配
- 适用场景

AI读到这个文件，就知道该怎么配色了。

## 动手做你的第一个Skill

### 先想清楚：你要解决什么问题？

问自己：
- 我老是重复跟AI说的规则是什么？
- 这规则能写成固定流程吗？

举几个例子：
- 写代码老说"驼峰命名、加注释" → 代码规范Skill
- 审校文章老说"去AI味、短句、口语化" → 审校Skill  
- 做PPT老要选配色 → 主题Skill

### 然后建文件夹

最简版：

```
my-skill/
└── SKILL.md
```

就一个文件。先能跑再说。

后面需要配置、文档，再加：

```
my-skill/
├── SKILL.md
├── references/    # 参考文档
└── scripts/       # 脚本（高级玩法）
```

### 最后写SKILL.md

模板：

```markdown
---
name: 你的skill名称
description: |
  这个Skill做什么。
  使用场景：什么时候用、触发关键词。
---

# Skill名称

一句话说明用途。

## 使用流程

1. 第一步
2. 第二步
3. 第三步

## 注意事项

- 注意点1
- 注意点2
```

写完保存，放到`.windsurf/skills/`或`.claude/skills/`目录下。

AI会自动发现并加载。

## 踩过的坑，分享给你

**description一定要写长**。触发词越多越好。别写"处理PPT"，写"给PPT、幻灯片、演示文稿应用主题、配色、字体样式"。我吃过亏，写太短AI根本想不起来用。

**一个Skill只干一件事**。别贪心，把"选题+写稿+审校+配图"全塞一个Skill里。拆开。需要哪个加载哪个，省Token。

**别想一步到位**。第一版20行够了。用几次，发现问题，再补规则。我的审校Skill，从20行改到300行，迭代了一个月。

**格式的事让AI干**。你把需求说清楚就行，让AI帮你生成SKILL.md。它写格式比你熟。

## 写在最后

Skills是什么？

**就是把你脑子里的经验，变成AI能用的格式。**

你花时间摸出来的流程、踩过的坑、总结的规则——这些东西以前只在你脑子里。每次都得手动告诉AI。

现在写成Skill，存下来。AI自己去读，自己去用。

你管"知道怎么做"，AI管"每次都这么做"。

分工明确，效率拉满。
