# 1px问题

## 1px问题原因

设计分辨率通常是750*1334 (一般高分辨率屏幕的物理分辨率)

假设在dpr=2(物理像素:750*1334 逻辑分辨率: 375*667)的设备上，使用rem布局， 1px被换算成相当于0.5px的rem数值，但是在不同设备上面0.5px的显示是不一样的。
如果不经过rem换算，直接写死1PX(注意大写-适配postcss-to-rem不被转换),那1px相当于2px的的占位

### rem布局

```html

<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=0.5, maximum-scale=0.5, minimum-scale=0.5">

<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1">

```

此时设备物理分辨率750*1334、逻辑分辨率375*667

如果在scale=1的时候，window.innerWidth === 375px
如果在scale=0.5的时候， window.innerWidth === 750px

```js
// 这个换算目的是使设备相当于物理
var dpr = window.devicePixelRatio || 1;
var scale = 1 / dpr;
//下面是根据设备dpr设置viewport
viewport.setAttribute(
    "content",
    "width=device-width,initial-scale=" +
    scale +
    ", maximum-scale=" +
    scale +
    ", minimum-scale=" +
    scale +
    ", user-scalable=no"
);

```

设置缩放，让1px等于原始物理分辨率的1px

```js
 function setRemUnit () {
    // 一直保持根节点宽度的1/10  1rem = clientWidth/10 px
    var rem = docEl.clientWidth / 10
    docEl.style.fontSize = rem + 'px'
}
```

### 计算
 
配合lib-flexible可以实现以下目的：

设计分辨率 / x = clientWidth / 10

那么
postcss-px-to-rem的转换的基准值计算为 750 / 10

### 总结

1. <meta name="viewport"... 动态计算当前逻辑分辨率和设计稿的比值，作为dpr， 使用 1 / dpr进行缩放，使其clientWidth等于设计分辨率 （这里的日常做法都是等于其设备物理分辨率）
2. 使用postcss-px-rem不需要的转换的地方可以使用 PX （大写）不进行转换。那么1PX就是1px，不会转换成rem，正好等于设计分辨率下的1px的具体值
3. 配置： postcss-px-to-rem和lib-flexible基准值计算为 设计分辨率/10,计算公式 设计分辨率 / rootFontSize = clientWidth / 10

## vw布局

使用postcss-px-to-viewport,直接把1px转化为vw单位，按照份来绘制，同样会遇到0.5px的绘制的兼容性问题。

### 解决方式

同上

### 总结

1. <meta name="viewport"... 动态计算当前逻辑分辨率和设计稿的比值，作为dpr， 使用 1 / dpr进行缩放，使其clientWidth等于设计分辨率 （这里的日常做法都是等于其设备物理分辨率）
2. postcss-px-to-viewport进行1px的白名单忽视，使其编译后不转换成vw单位，正好等于设计分辨率下的1px的具体值

## px配合scale的布局

```js
  const handleScreenAuto = () => {
    let designDraftWidth = 1072; //设计稿的宽度
    let designDraftHeight = 621; //设计稿的高度
    //根据屏幕的变化适配的比例
    const scale =
      document.documentElement.clientWidth / document.documentElement.clientHeight < document.documentElement.clientWidth /designDraftWidth

    //缩放比例
    (
      document.querySelector("#screen") as any
    ).style.transform = `scale(${scale}) translate(-50%)`;
  };

  //React的生命周期 如果你是vue可以放到mountd或created中
  useEffect(() => {
    //初始化自适应  ----在刚显示的时候就开始适配一次
    handleScreenAuto();
    //绑定自适应函数   ---防止浏览器栏变化后不再适配
    window.onresize = () => handleScreenAuto();
    //退出后自适应消失   ---这是react的组件销毁生命周期，如果你是vue则写在deleted中。最好在退出大屏的时候接触自适应
    return () => (window.onresize = null);
  }, []);

```

### 思考

好像没有1px的问题

分析: 物理分辨率750*1334  逻辑分辨率 375*667的设备 设计稿 750*1334  里面的1px的border

初始状态375未缩放1px等于2px的距离，但是缩放2倍后1px就是1px

