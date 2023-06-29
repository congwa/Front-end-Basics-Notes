# js图片操作

## JS检测PNG图片是否有透明背景

[传送门](/study/4-%E5%89%8D%E7%AB%AF%E6%9E%84%E5%BB%BA%E5%92%8C%E6%96%B0%E5%9E%8B%E6%A1%86%E6%9E%B6%E5%88%86%E6%9E%90/WebAssembly.md)

## 判断图片类型

[传送门](/study/4-%E5%89%8D%E7%AB%AF%E6%9E%84%E5%BB%BA%E5%92%8C%E6%96%B0%E5%9E%8B%E6%A1%86%E6%9E%B6%E5%88%86%E6%9E%90/WebAssembly.md)

## 图片压缩原理

[传送门](/study/4-%E5%89%8D%E7%AB%AF%E6%9E%84%E5%BB%BA%E5%92%8C%E6%96%B0%E5%9E%8B%E6%A1%86%E6%9E%B6%E5%88%86%E6%9E%90/WebAssembly.md)

## 图片转换数据

图片转换成像素数据按以下两步操作.

- 调用ctx.drawImage将图片绘制到画布上
- 调用ctx.getImageData获取像素数据

```html
<body>
  <p class="image">
     <img src="./img/rect.png" width="300" height="300" />
  </p>
  <canvas id="myCanvas" width="300" height="300"></canvas>
<body>
```

```js
    const dom = document.getElementById("myCanvas"); // canvas画布

    getImageData(dom,"./img/rect.png").then((data)=>{
      console.log(data); // 打印输出像素数据
    })

    function getImageData(dom,url){
        const ctx = dom.getContext("2d");   // 设置在画布上绘图的环境
        const image = new Image();
        image.src= url;
        //获取画布宽高
        const w = dom.width;
        const h = dom.height;
        return new Promise((resolve)=>{
            image.onload = function(){
                ctx.drawImage(image, 0, 0 ,w,h);                           // 将图片绘制到画布上
                const imgData = ctx.getImageData(0,0,w,h);    // 获取画布上的图像像素
                resolve(imgData.data)  // 获取到的数据为一维数组,包含图像的RGBA四个通道数据
                ctx.clearRect(0,0,w,h);
            }     
    }) 
}
// data = [255, 255, 255, 255, 255, 61, 61, 255, 255, 0, 0, 255, 255,...]
```

data是一维数组,数组的前四个值[255, 255, 255, 255]为图片第一个像素点的rgba值(ctx.getImageData返回的透明度大小范围是从0 - 255的),[255, 61, 61, 255] 是图片第二个像素点的rgba值,后面依次类推.如此便成功的将图片转化成了数据.


## 数据格式化

虽然图片成功转化成了数据,但这样的数据结构很难操作,我们期待能够将数据结构的表现形式与图片展示效果保持一致.

假如存在四个都是黑色的像素点(如下图),总宽高都为2,值为[0, 0, 0, 255,0, 0, 0, 255,0, 0, 0, 255,0, 0, 0, 255].

通过某个函数转换,数据就变成了下列格式.

```json
[
   [[0, 0, 0, 255],[[0, 0, 0, 255]]], // 第一行
   [[0, 0, 0, 255],[[0, 0, 0, 255]]]  // 第二行
]
```

上列数据格式和图片的展示结构保持了一致,可以很清晰的看出当前图形有多少行,每一行又有多少个像素点, 以及每一个像素点的rgba值.


综合上面描述,可以编写函数`normalize`(代码如下)实现数据格式的转换.

```js
const dom = document.getElementById("myCanvas"); // canvas画布

getImageData(dom,"./img/rect.png").then((data)=>{
  console.log(normalize(data,dom.width,dom.height)); // 打印格式化后的像素数据
})

function normalize(data,width,height){
  const list = [];
  const result = [];
  const len = Math.ceil(data.length/4);
  // 将每一个像素点的rgba四个值组合在一起
  for(i = 0;i<len;i++){
    const start = i*4;
    list.push([data[start],data[start+1],data[start+2],data[start+3]]);
  }
  //根据图形的宽和高将数据进行分类
  for(hh = 0;hh < height;hh++){
     const tmp = [];
     for(ww = 0; ww < width;ww++){
      tmp.push(list[hh*width + ww]);
     }
     result.push(tmp);
  }
  return result;
}
```


## 给图片换肤

通过`normalize`函数的转换,一维数组的图片数据转换成了矩阵形式.有了矩阵,我们就可以更加方便的实现编辑图片的需求.

首选我们简单实现一个图片换肤的需求,将图片中的黑色全部变成黄色

实现代码如下,peeling函数负责变换图片的颜色.

观察代码,,由于黑色的rgb值是(0,0,0).那么只需要判断出像素点是黑色,就重置其rgb值为(255,255,0)便能将图片中所有的黑色换成黄色.

```js
const dom = document.getElementById("myCanvas"); // canvas画布

getImageData(dom,"./img/rect.png").then((data)=>{
  data = peeling(data,dom.width,dom.height); // 换肤
  drawImage(dom,data); // 绘制图像
})

function peeling(data,w,h){
  data = normalize(data,w,h); // 转化成多维数组
  // 将黑色变成黄色 (0,0,0) -> (255,255,0)   
  for(let i = 0;i<data.length;i++){
    for(let j = 0;j<data[i].length;j++){
      //排除透明度的比较
      if(data[i][j].slice(0,3).join("") == "000"){
        data[i][j] = [255,255,0,data[i][j][3]];
      }
    }
  }
  return restoreData(data); // 转化成一维数组
}

// 矩阵的数据操作完了,还需要调用restoreData函数将多维数组再转回一维数组传给浏览器渲染.
function restoreData(data){
    const result = [];
    for(let i = 0;i<data.length;i++){
      for(let j = 0;j<data[i].length;j++){
        result.push(data[i][j][0],data[i][j][1],data[i][j][2],data[i][j][3]);
      }
    }
    return result;
}

// 渲染图片
function drawImage(dom,data){
  const ctx = dom.getContext("2d");
  // ctx.createImageData.创建新的空白ImageData对象,通过.data.set重新赋值.
  const matrix_obj = ctx.createImageData(dom.width,dom.height);
  matrix_obj.data.set(data);
  // ctx.putImageData.将像素数据绘制到画布上.
  ctx.putImageData(matrix_obj,0,0);  
}

```

编辑图像主要分解成以下三步.

- 将原始图片转化成矩阵数据(多维数组)
- 依据需求操作矩阵
- 将修改后的矩阵数据渲染成新图片


## 图片旋转

假定存在最简单的情况如下图所示,其中左图存在四个像素点.第一行有两个像素点1和2(这里用序号代替rgba值).

第二行也有两个像素点3和4.数据源转换成矩阵data后的值为 [[[1],[2]],[[3],[4]]]

![图片旋转](/study/imgs/js%E5%9B%BE%E7%89%87%E6%97%8B%E8%BD%AC.webp)

如何将左图按顺时针旋转90度变成右图?

通过观察图中位置关系,只需要将data中的数据做位置变换,让data = [[[1],[2]],[[3],[4]]]变成data = [[[3],[1]],[[4],[2]]],就可以实现图片变换.

四个像素点可以直接用索引交换数组的值,但一张图片动辄几十万个像素,那该如何进行操作?

这种情况下通常需要编写一个基础算法来实现图片的旋转.

首先从下图中寻找规律,图中有左 - 中 - 右三种图片状态,为了从左图的1-2-3-4变成右图的3-1-4-2,可以通过以下两步实现.

![图片旋转过程](/study/imgs/js_image_rotate.webp)

- 寻找矩阵的高度的中心轴线,上下两侧按照轴线进行数据交换.比如左图1 - 2和3 - 4之间可以画一条轴线,上下两侧围绕轴线交换数据,第一行变成了3 - 4,第二行变成了1 - 2.通过第一步操作变成了中图的样子.
- 中图的对角线3 - 2和右图一致,剩下的将对角线两侧的数据对称交换就可以变成右图.比如将中图的1和4进行值交换.操作完后便实现了图片的旋转.值得注意的是4的数组索引是[0][1],而1的索引是[1][0],刚好索引顺序颠倒.


```js
const dom = document.getElementById("myCanvas"); // canvas画布

// getImageData 获取像素数据 
getImageData(dom,"./img/rect.png").then((data)=>{
  data = rotate90(data,dom.width,dom.height); // 顺时针旋转90度
  drawImage(dom,data); // 绘制图像
})

function rotate90(data,w,h){
  data = normalize(data,w,h); // 转化成矩阵
  // 围绕中间行上下颠倒
  const mid = h/2; // 找出中间行
  for(hh = 0;hh < mid;hh++){
    const symmetric_hh = h - hh -1; // 对称行的索引
    for(ww = 0;ww<w;ww++){
        let tmp = data[hh][ww];
        data[hh][ww] = data[symmetric_hh][ww];
        data[symmetric_hh][ww] = tmp;
    }
  }
  // 根据对角线进行值交换
  for(hh = 0;hh < h;hh++){
    for(ww = hh+1;ww<w;ww++){
      let tmp = data[hh][ww];
      data[hh][ww] = data[ww][hh];
      data[ww][hh] = tmp;
    }
  }
  return restoreData(data); // 转化成一维数组
}
```










