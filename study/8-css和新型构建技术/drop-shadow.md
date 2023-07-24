# drop-shadow的总结

## box-shadow

```css
/* offset-x | offset-y | color */
box-shadow: 60px -16px teal;

/* offset-x | offset-y | blur-radius | color */
box-shadow: 10px 5px 5px black;

/* offset-x | offset-y | blur-radius | spread-radius | color */
box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);

/* inset | offset-x | offset-y | color */
box-shadow: outset 5em 1em gold;

/* Any number of shadows, separated by commas */
box-shadow: 3px 3px red, -1em 0 0.4em olive;

/* Global keywords */
box-shadow: inherit;
box-shadow: initial;
box-shadow: unset;
```

取值说明：

- `inset`: 默认阴影在边框外。使用`inset`后，阴影在边框内（即使是透明边框），背景之上内容之下。也有些人喜欢把这个值放在最后，浏览器也支持。`outset`则就是外阴影
- `<offset-x>` `<offset-y>`: 这是头两个`<length>`值，用来设置阴影偏移量。`<offset-x>`设置水平偏移量，如果是负值则阴影位于元素左边。`<offset-y>`设置垂直偏移量，如果是负值则阴影位于元素上面。可用单位请查看`<length>`。如果两者都是0，那么阴影位于元素后面。这时如果设置了`<blur-radius>`或`<spread-radius>`则有模糊效果。
- `<blur-radius>`: 这是第三个`<length>`值。值越大，模糊面积越大，阴影就越大越淡。不能为负值。默认为0，此时阴影边缘锐利。
- `<spread-radius>` : 这是第四个`<length>`值。取正值时，阴影扩大；取负值时，阴影收缩。默认为0，此时阴影与元素同样大。
- `<color>` :相关事项查看`<color>`。如果没有指定，则由浏览器决定——通常是color的值，不过目前Safari取透明。

![box-shadow](/study/imgs/box-shadow.png)
1. 内阴影和外阴影
   内阴影和外阴影使用`inset`,`outset`进行控制
2. 单边阴影
   
  ```css
    <!-- 右侧单边 -->
    box-shadow: 5px 0 5px rgba(0, 0, 0, 0.2);
    <!-- 底部单边 -->
    box-shadow: 0 5px 5px rgba(0, 0, 0, 0.2);
    <!-- 左侧单边 -->
    box-shadow: -5px 0 5px rgba(0, 0, 0, 0.2);
    <!-- 顶部单边 -->
    box-shadow: 0 -5px 5px rgba(0, 0, 0, 0.2);
  ```

  x或者y的偏移量一个为0就可以实现这样的效果
2. 双边阴影

  ```css
  <!-- 上方和下方 -->
  box-shadow: 0 5px 5px rgba(0, 0, 0, 0.2), 0 -5px 5px rgba(0, 0, 0, 0.2);

  <!-- 加左侧和右侧 -->
  box-shadow: -5px 0 5px rgba(0, 0, 0, 0.2), 5px 0 5px rgba(0, 0, 0, 0.2);

  <!-- 上方、右侧、下方和左侧 -->
  box-shadow: 0 -5px 5px rgba(0, 0, 0, 0.2), 5px 0 5px rgba(0, 0, 0, 0.2), 0 5px 5px rgba(0, 0, 0, 0.2), -5px 0 5px rgba(0, 0, 0, 0.2);

  <!-- 右方和下方 -->
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.2);

  <!-- 左方和上方 -->
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.2);

  ```

  双边阴影可以一条一条的画，也可以相邻的直接x和y进行偏移
3. 三边阴影
  三边阴影当然是可以一条一条的画，也可以用一个左上偏移加一个下偏移组成双边
4. 更多边阴影 - 以上类推


## drop-shadow

我们发现box-shadow只能作用于框，无法对不规则的图形进行阴影控制。 如果需要不规则图形控制，可以使用drop-shadow，drop-shadow更像一个光的投影效果。

### 非矩形形状





使用 drop-shadow 可以让我们给一个元素添加阴影，这个阴影并不对应于它的边界框，，而是使用该元素的Alpha蒙版。例如，我们可以在**透明的PNG或SVG徽标中添加投影**。

```css
/* 对一个png图片进行阴影 */
img {
  filter: drop-shadow(0.35rem 0.35rem 0.4rem rgba(0, 0, 0, 0.5));
}
```

![drop-shadow_png](/study/imgs/drop-shadow_png.png)

使用 box-shadow 为我们提供了一个矩形阴影，即使元素没有背景，而 drop-shadow 则**为图像的非透明部分创建阴影**。

生效范围
1. 内联html中
2. 内联svg中
3. img标签中
4. css背景图像  -  同时也可以给渐变背景图像添加阴影

### 裁剪元素

如果我们使用 clip-path 或 mask-image 修剪或遮罩元素，则我们添加的任何 box-shadow 也会被修剪——因此，如果它在修剪区域之外，则将不可见。

但我们可以通过在元素的父元素上应用 drop-shadow 滤镜，在剪切的元素上创建一个阴影。

drop-shadow 滤镜应用于剪切形状的父元素。

![clip-path](/study/imgs/drop-shadow_clip.png)

### 分组元素

有时候，我需要构建由重叠元素组成的组件，这本身就需要投射阴影。

如果我们在整个组件上添加 box-shadow ，则会留下奇怪的空白区域：

![box-shadow_space](/study/imgs/box-shadow_space.png)


通过在整个组件上使用 drop-shadow，我们可以准确地在我们想要的地方得到阴影

![drop-shadow_space](/study/imgs/drop-shadow_space.png)

[demo](https://codepen.io/michellebarker/pen/poyogzm)

### 多重投射阴影

可以使用多个阴影以获得一些很酷的效果

```html
<div class="parent-element">
  <div class="clipped-element"></div>
</div>
<style>
.parent-element {
  filter: drop-shadow(10rem 0 0 rgba(0, 30, 200, 0.8)) drop-shadow(-10rem 0 0 rgba(0, 30, 200, 0.8)) drop-shadow(20rem 0 0 rgba(0, 30, 200, 0.8)) drop-shadow(-20rem 0 0 rgba(0, 30, 200, 0.8));
  transition: filter 600ms;
}

.parent-element:hover {
  filter: drop-shadow(0 0 0 rgba(0, 30, 200, 0.8));
}

.clipped-element {
  width: 20rem;
  height: 20rem;
  margin: 0 auto;
  background-color: deeppink;
  clip-path: polygon(0 0, 50% 0, 100% 50%, 50% 100%, 0 100%, 50% 50%)
}
</style>

```

### 兼容

可以使用特性查询来实现，并使用 box-shadow 回退

```css
/* 选取my-element下的所有子元素 */
.my-element > * {
  box-shadow: 0 0.2rem 0.25rem rgba(0, 0, 0, 0.2);
}

@supports (filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.2))) {
  .my-element {
    filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.2));
  }

  .my-element > * {
    box-shadow: none;
  }
}
```

## 总结

看起来像

drop-shadow 更像是一束光生成的投影。而 box-shadow 是 元素自身的复制