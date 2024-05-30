# grid网格布局

二维布局，可以同时处理行和列上的布局。使用网格布局，兄弟节点可以被指定布局到网格的某个位置。


像流布局和Flex布局，他们都是一维布局。一维布局一次只能处理一个维度上的元素布局，一行或者一列。


## 网格容器 display：grid 或 display：inline-grid


元素上声明 display：grid 或 display：inline-grid 来创建一个网格容器


在网格容器节点行，我们可以通过`grid-template-columns`和`grid-template-rows`指定当前容器的行和列

```css
display: grid;
grid-template-columns: 1fr 1fr 1fr;  /* 指定 3 列*/
grid-template-rows: 1fr 1fr; /* 指定 2行 */
```


## 网格轨道

通过`grid-template-columns`和`grid-template-rows`指定当前容器的行和列后，这里的**行和列就是网格轨道**。

但在实际页面中，由于页面的内容不确定，内容可能会**超过**`grid-template-columns`和`grid-template-rows`指定的网格轨道个数，这个时候网格将会在隐式网格中创建行和列。**按照默认，这些轨道将自动定义尺寸，所以会根据它里面的内容改变尺寸**。


```html
<div class="grid-box-2">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
  <div>5</div>
  <div>6</div>
  <div>7</div>
  <div>8</div>
  <div>9</div>
  <div>10</div>
  <div>11</div>
</div>

<style>
.grid-box-2 {
  border: 1px solid #999;
  width: 300px;
  height: 200px;
  display: grid;
  margin: 20px;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
/* 子div的数量多出来了，那么多出来的自定义尺寸 */
</style>
```


### 隐式网格

超出指定网格轨道的子节点就是隐式网格，隐式网格不会根据网格轨道的样式来进行设置。

设置隐式网格的样式，通过`grid-auto-rows`和`grid-auto-columns`可以对隐式网格的行列进行设置

```css
.grid-box-2 {
  grid-auto-rows: 40px; /* 添加隐式网格的行高40px */
}
```


## 网格线

设置网格轨道时，Grid会为我们创建带编号的网格线来让我们来定位每一个网格元素。

![grid_line](/study/imgs/grid_line.webp)

有了网格线，我们可以通过网格线指定跨轨道的网格元素，从而实现网格元素占多行多列的效果。

子元素通过`grid-column-start`，`grid-column-end`，`grid-row-start`，`grid-row-end`或者`grid-column`和`grid-row`，或者通过`grid-area`这一个属性来设置来指定元素占据的网格轨道。

```css
.grid-box-3 > div:nth-of-type(1) {
  grid-column-start: 1;
  grid-column-end: 4;
  grid-row-start: 1;
  grid-row-end: 2; /* 如果只占一行或一列，grid-xx-end属性可以不用写 */

  /* 等同于下面的代码 */
  grid-area: 1 / 1 / 2 / 4;  /* 这里的顺序是：row-start / column-start / row-end / column-end */ 
}
.grid-box-3 > div:nth-of-type(2) {
  grid-row: 2 / 4; /* grid-row 是 grid-row-start 和 grid-row-end的缩写 */
}
.grid-box-3 > div:nth-of-type(3) {
  grid-column: 2 / span 2; /* span表示占据几行，这里表示从2开始，占据2行，也就是网格线2到4 */
}
.grid-box-3 > div:nth-of-type(6) {
  grid-column: 1 / span 3;
}
```

![多行多列](/study/imgs/grid_more.webp)


## 网格单元和网格间距

**一个网格单元是在一个网格元素中最小的单位**

比如上面的例子中，4行3列，那么网格布局的父元素就被划分成4*3=12个网格单元,子级元素将会排列在每个事先定义好的网格单元中。

网格元素可以向行或着列的方向扩展一个或多个单元，并且会创建一个网格区域。

网格区域的形状应该是一个矩形（也就是说你不可能创建出一个类似于“L”形的网格区域）。

**网格单元之间可以通过`grid-column-gap`，`grid-row-gap`或者`grid-gap`设置网格间距**。


下面的例子就是把网格列间距设置为2px，网格行间距设置为6px。
>现在好像是改成column-gap，row-gap和 gap了。gap的顺序是row-gap column-gap。

```css
.grid-box-4 {
  /* 等同于 gap: 6px 2px; */
  grid-column-gap: 2px;
  grid-row-gap: 6px;
}
```

![网格间距](/study/imgs/grid_space.webp)


## 使用repeat设置行列

```css
.grid-box-6 {
  /* 等同于 grid-template-columns: 1fr 1fr 1fr; */
	grid-template-columns: repeat(3, 1fr);
}
```


## 不确定容器尺寸下的自动填充

父容器的尺寸是不确定的，我们需要把子元素往父容器中逐个填充,可以利用`auto-fill`

- grid-template-columns: repeat(auto-fill, 50px);表示，每一列都是50px，但是具体有几列，需要根据子元素填充的情况来定。能放下8列，就放8列，不够9列的部分空白

```css
/* Grid 容器尺寸不固定，自动适配子元素 */
.grid-box-6 {
  border: 1px solid #999;
  display: grid;
  margin: 20px;
  grid-template-columns: repeat(auto-fill, 50px);
}
.grid-box-6 > div {
  height: 50px;
  background-color: bisque;
  border-radius: 4px;
  border: 1px solid #ccc;
}
```

![auto_fill](/study/imgs/auto_fill.awebp)

如果不希望后面有空白呢，这个时候就需要**子节点有适当的宽度适配**。

**子节点不再是固定宽度，而是通过minmax函数指定最小值。如果容器的行不够整数，那么就按照1:1的比例去适当增宽子节点.**

```css
.grid-box-6 {
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) ;
}
```

![auto_fill_space](/study/imgs/auto_fill_space.awebp)



## 网格项目重叠

每一个网格项目都可以指定占据的网格单元。

如果多个网格项目占据同一个网格单元呢。比如上面的例子，网格项目1和网格项目2都需要占据左上角这个网格单元。效果会是下面这样：

![zindex1](/study/imgs/grid_zindex1.awebp)

我们会发现是2盖住了1， 按照先后顺序，默认情况是后面的DOM节点盖住前面的DOM节点。不过我们可以通过设置z-index来改变覆盖顺序。

```css
.grid-box-5 > div:nth-of-type(1) {
  z-index: 2;
}
```

![zindex2](/study/imgs/grid_zindex2.awebp)


## 网格线的命名

虽然我们可以通过指定网格线来确定网格区域，但是网格线还是太不直观了。接下来我们讲一讲怎么通过对网格线命名来解决这个问题。使用Chrome Dev Tools布局查看，可以看到命名的网格线名字。

```css
/* 进行重命名 */
.grid-box-7 {
  grid-template-columns: [main-start] 1fr [content-start] 1fr [content-end] 1fr [main-end];
  grid-template-rows: [main-start] 40px [content-start] 40px [content-end] 40px [main-end];
}
.grid-box-7 > div:nth-of-type(1) {
  grid-column-start: main-start;
  grid-column-end: main-end;
  grid-row-start: main-start;
  grid-row-end: content-start;
}
.grid-box-7 > div:nth-of-type(2) {
  grid-column: main-start / content-start;
  grid-row: content-start / main-end;
}

```

## 网格模板区域

虽然可以指定网格线的名字，但是网格线用起来还是不够方便，Grid布局提供了一个模板区域的设置方法。
网格项目中的属性`grid-area`会指定当前网格项目的名字，在网格容器中的属性`grid-template-areas`会通过参数中的名字， 设置对应网格项目的位置和所占空间，其中.表示1fr的空白。

```css
.grid-box-8 {
  border: 1px solid #999;
  width: 400px;
  height: 120px;
  margin: 20px;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  /* 设置模版区域 */
  grid-template-areas:
    "hd hd hd hd hd hd hd hd hd"
    "sd sd sd main main main main . ."
    "sd sd sd ft ft ft ft ft ft";
}
.grid-box-8 > div {
  background-color: bisque;
  border-radius: 4px;
  border: 1px solid #ccc;
}
/* 设置第一个div元素使用模版hd */
.grid-box-8 > div:nth-of-type(1){
  grid-area: hd;
}
.grid-box-8 > div:nth-of-type(2){
  grid-area: ft;
}
.grid-box-8 > div:nth-of-type(3) {
  grid-area: main;
}
.grid-box-8 > div:nth-of-type(4) {
  grid-area: sd;
}

```

![grid_template](/study/imgs/grid_template.webp)


## 填充缺口

有的场景下，由于子元素宽度的不确定性，会出现空格，前面通过了`grid-template-columns: repeat(auto-fill, minmax(50px, 1fr))`解决了部分情况。但是如果网格项目的宽度是不变的，但是顺序可变。这个时候，我们就可以通过`grid-auto-flow`来解决。

`grid-auto-flow`是控制自动布局算法怎样运作的属性，它能精确指定在网格中被自动布局的元素怎样排列。

它有3个属性值：`column`，`row(默认)`，`dense`。

- 如果是`columns`网格项目就是先把一列排满，再填如第二列。
- `row`就是先填满一行，因为这个是默认值，所以前面的例子都是先填满一行，再填下一行。
- `dense`,指定自动布局算法使用一种“稠密”堆积算法，如果后面出现了稍小的元素，则会试图去填充网格中前面留下的空白,这样做会填上稍大元素留下的空白，但同时也可能导致原来出现的次序被打乱。

这样我们就可以利用`grid-auto-flow: dense`来解决空白问题。（不能完美解决，只能让空白变小。）


比如下面这个例子，第一个子节点占了三列，第二个子节点占了2列，那么第一行就会空一个。添加了g`rid-auto-flow: row dense`后，就能自动匹配能填充到这个空间的子节点。（`grid-auto-flow: dense`也是同样的效果）

```css
.grid-box-9 {
  width: 200px;
  display: grid;
  gap: 2px;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 50px;
  /* grid-auto-flow: row dense; */
}
.grid-box-9 > div:nth-of-type(1){
  grid-column-end: span 3;
}
.grid-box-9 > div:nth-of-type(2n){
  grid-column-end: span 2;
  grid-row-end: span 2;
}
```

![auto-flow](/study/imgs/grid_auto-flow.awebp)


## 元素的对齐

和flex类似，Grid布局有以下容器属性用于对齐：`justify-content`，`justify-item`，`align-content`，`align-item`，另外，Grid还增加了`place-content`和 `place-item`用于缩写。子元素也有三个用于对齐属性：`justify-self`，`align-self`，`place-self`

简单记忆：`justify`是在垂直方向对齐方式，`align`是水平方向对齐对齐，`place`是前面两个属性的缩写，先`align`再`justify`；`content`是容器子元素的对齐，`item`是子元素所在自己空间的对齐；`self`是子元素的属性，用于覆盖父容器对应的`item`样式


- justify-items: 垂直方向(列维度)的子元素在自己空间的对齐
- align-items: 水平方向(行维度)的子元素在自己空间的对齐
- justify-content: 垂直方向上，子元素在容器空间中的对齐
- align-content: 水平方向上，子元素在容器空间中的对齐
- justify-self 和 align-self
  - justify-self：子元素属性，垂直方向上的对齐方式，覆盖父元素中justify-items的值。具体的值和效果，同justify-items。
  - align-self: 子元素属性，水平方向上的对齐方式，覆盖父元素中align-items的值。具体的值和效果，同align-items。



## justify-self 和 align-self

- justify-self：子元素属性，垂直方向上的对齐方式，覆盖父元素中justify-items的值。具体的值和效果，同justify-items。
- align-self: 子元素属性，水平方向上的对齐方式，覆盖父元素中align-items的值。具体的值和效果，同align-items。



## grid布局的应用

[实现一个手机app的图标手机桌面的小组件](https://github.com/congwa/animation/tree/main/13-grid-mobile)

## 利用grid实现瀑布流，最简单的瀑布流方法

```css
.list {
  display: grid;
  grid-auto-rows: 5px;
  grid-template-columns: repeat(auto-fill, calc(50% - 5px));
  align-items: start;
  justify-content: space-between;
}
```

```vue
watch: {
  immediate: true,
  handler() {
    this.$nextTick(() => {
      const el = this.$refs.root
      const rows = Math.ceil(el.clientHeight / 5) + 2
      el.style.gridRowEnd = `span ${rows}`
    })
  },
}
```

1. Grid 布局我们知道他是像 Excel 表格一样一行一行的，使用 grid 布局是无法让不定高度的项目依次堆叠在一起的。 这里我们首先将 grid 网格设置的特别密集，通过 grid-auto-rows: 5px; 来将每一行网格设置为 5px 高度
2. 然后我们使用 align-item: start 让项目不会被自动拉伸，因为后续我们需要获取到他真实的高度。 然后我们在 dom 渲染后执行一些操作，这里我使用的是 vue，所以监听卡片数据 info 发生变化，然后 nextTick 保证 dom 已经渲染出来，之后我们首先获取到卡片的 dom，然后使用 clientHeight 来获取卡片的真实高度。 我们用这个真实高度除以5，也就是网格一行的高度，就得到了卡片占了多少行了。这里加上2是为了两个卡片之间的堆叠有10px的间距，不然都挤在一起了。 最后我们为卡片添加内联样式 grid-row-end: span 行数，这样卡片就得到了适合他高度的网格数
3. grid 布局使用 grid-row-end: span 行数 来排布时，是浏览器自动排序，我们只是告诉浏览器这个卡片占了多少格，而没有限定死他的位置，浏览器会自动堆叠，并且是真正的哪有坑就往哪堆，并不是左右左右的固定顺序，因此实现效果完全是真瀑布流的效果。 因为 js 做的事情非常少，堆叠排布和元素宽度变化都是浏览器自动处理的，因此性能损失很少

[真是天才的实现方法](https://zhuanlan.zhihu.com/p/648073709)
