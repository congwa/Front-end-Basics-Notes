# display:none与css动画的分析

> 这里暂时只讨论淡入淡出的动画触发，其它的以此类推

css的原生提供的动画方案有 transition 和 animation动画

transition触发的规律是，元素一直在没有display:none的时候，一直在画布中，改变某个监听的属性，可以进行触发

animation动画在这个元素创建、或者display由none到block的时候触发

## 提出问题

### 隐藏到显示: display:none -> display: block 可以触发什么动画？

1. animation动画  突然间进行显示

对transition动画来说，元素直接出现就是最终的属性状态，无法进行transition动画

### 显示到隐藏：display: block； -> display:none; 可以触发什么动画？

元素直接display:none了，消失了，什么动画都执行不了了。

## setTimeout方案：执行动画

### 使用替代方案执行display：none -> block 动画方案

1. 直接触发 animation动画
   > 缺点： 定义序列帧的初始到最终的状态，使用模版的时候需要写很多很多模块，无法很容易的使用js定制序列帧
2. 触发 transition 动画， 首先display:block和opacity:0(占位且看不到)，执行transition动画控制透明度显示，在timeout触发的时候，移除多余属性，达到淡入动画目的。
   > 缺点：timeout的时间必须和动画的时间一致，写两遍时间会很麻烦，也不容易自定义时间

   如果此时元素处于绝对定位状态，不用考虑动画执行期间的占位问题

   > 缺点2: 直接控制元素的透明度，如果元素本身就有透明度呢，或者说之后触发none的时候元素本身的透明度数值又怎么处理，这时候可能就对状态发生丢失了，如果在setTimeout中利用闭包缓存之前的元素的状态，再在定时器出发时进行恢复也不是非常优雅。

如果发生同时也有位移的变化呢？

在 display:block和opacity:0 的时候，同时对初始位置的left、right、top、bottom进行偏移，执行transition动画控制位置进入目的地

> 缺点： 限制元素的position的值不能冲突，如果position的值进行了冲突，无法预知元素起点在哪。需要考虑的原始的position的现在的值是啥走不同的逻辑，比较复杂。
> 比如，现在是position是默认值，top有值，但是此时top没有生效，处理原始值就很困难了。

### 使用替代方案执行display: block -> none 动画方案

利用timeout，先让元素执行transition动画控制透明度使其消失，然后timeout到时移除透明度的属性，给元素添加display:none属性达成目的。

> 缺点1： timeout的时间必须和动画的时间一致，写两遍时间会很麻烦，也不容易使用js控制自定义时间
  
如果此时元素处于绝对定位状态，不用考虑动画执行期间的占位问题，直接控制元素的透明度

> 缺点2：直接控制元素的透明度，如果元素本身就有透明度呢，或者说之后触发block的时候元素本身的透明度数值又怎么处理，这时候可能就对状态发生丢失了，如果在setTimeout中利用闭包缓存之前的元素的状态，再进行恢复也不是非常优雅。


seTimeout方案，如果此时也有位移呢？

同上

## clone元素方案： 执行动画

### 隐藏到显示: display:none -> display: block 动画方案

1. 原始元素进行block进行显示，同时让其隐藏，让其占位
2. clone原始元素，创建一个新div，div绝对定位，计算原始clone的位置，把计算的位置赋值给div，让div和原始元素进行重合
3. clone元素添加到div中，对div进行transition动画，同时监听div的transitionend事件
4. 动画执行完，移除div，让原始元素进行显示

### 显示到隐藏 display: block； -> display:none; 动画方案

1. 对原始元素进行隐藏，让其占位
2. clone原始元素，创建一个div，div绝对定位，计算原始clone的位置，把计算的位置赋值给div，让div和原始元素进行重合
3. clone元素添加到div中，对div进行transition动画，同时监听div的transitionend事件
4. 动画执行完，移除div，让原始元素进行真正的消失 display:none


这里[我对clone元素方案进行了一个例子](/study/9-animation/15-display-animation/index.html)

如果不止透明度的变化，同时还要进行位移呢？

也就是对div的初始位置进行变化，让其同时执行transition触发的transform动画。

这样clone元素只计算原始元素的渲染位置，尽量避免对原始元素进行属性的更改(尽量避免纪录和恢复原始状态)，同时元素绝对定位后脱离文档流，对性能更加友好。

此想法来源 FLIP 动画的思想，[ 这里同时对FLIP动画思想进行demo实现](/study/9-animation/1-FLIP.html)


## 参考链接

[css3 动画与display:none冲突的解决方案](https://www.cnblogs.com/yangzhou33/p/9119596.html)