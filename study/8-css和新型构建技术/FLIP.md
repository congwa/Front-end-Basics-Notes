# FLIP

- F: Fist -- 一个元素的起始位置

- Last -- 另一个元素的终止位置(重点:另一个)

- I: Invert -- 计算 F 与 L 的差异，包括位置、大小等，并将差异用 transfromn 属性,添加到终止元素上,让它回到起始位置，也是此技术的核心

- Play--- 添加 transion 过渡效果,清除 Invert 阶段添加进来 transform，播放动画

```javascript
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FLIP-demo</title>
    <style>
      .container {
        display: flex;
        flex-wrap: wrap;
        text-align: center;
      }

      .box {
        border: 1px solid #ccc;
        margin-left: 10px;
        margin-top: 10px;
      }
      .box_0 {
        width: 200px;
        height: 250px;
        background-color: #ffa39e;
        color: #000000;
        line-height: 250px;
      }

      .box_1 {
        width: 160px;
        height: 210px;
        background-color: #ffd8bf;
        line-height: 210px;
      }
      .box_2 {
        width: 190px;
        height: 270px;
        background-color: #ffd591;
        line-height: 270px;
      }
      .box_3 {
        width: 210px;
        height: 300px;
        background-color: #ffe58f;
        line-height: 300px;
      }
      .box_4 {
        height: 160px;
        width: 210px;
        background-color: #780650;
        color: #ffffff;
        line-height: 160px;
      }
      .box_5 {
        height: 190px;
        width: 270px;
        background-color: #22075e;
        color: #ffffff;
        line-height: 190px;
      }
      .box_6 {
        height: 210px;
        width: 300px;
        background-color: #061178;
        color: #ffffff;
        line-height: 210px;
      }
      .mask {
        position: fixed;
        width: 100%;
        height: 100%;
        background: #000000;
        opacity: 0.7;
        z-index: 1;
        display: none;
        text-align: center;
      }
      .picture-zoom-in {
        position: fixed;
        z-index: 2;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(2);
        text-align: center;
      }
    </style>
  </head>

  <body>
    <!-- 蒙层 -->
    <div class="mask"></div>
    <!-- 放大图片的容器 -->
    <div id="pic"></div>
    <!-- 图片容器及列表 -->
    <div class="container">
      <div class="box box_0">200px*250px</div>
      <div class="box box_0">200px*250px</div>
      <div class="box box_0">200px*250px</div>
      <div class="box box_0">200px*250px</div>
      <div class="box box_1">160px*210px</div>
      <div class="box box_2">190px*270px</div>
      <div class="box box_3">210px*300px</div>
      <div class="box box_4">210px*160px</div>
      <div class="box box_5">270px*190px</div>
      <div class="box box_6">300px*210px</div>
    </div>

    <script>
      let container_dom = document.getElementsByClassName("container")[0];
      let mask_dom = document.getElementsByClassName("mask")[0];
      let pic_dom = document.getElementById("pic");

      mask_dom.addEventListener("click", (e) => {
        mask_dom.style.display = "none";
        pic_dom.innerHTML = "";
      });

      //dom 比较多采用事件代理
      container_dom.addEventListener("click", (e) => {
        //获得点击位置的dom节点
        let boxDom = e.target;
        //判断点击的是不是模拟图片的dom
        if (boxDom.className.indexOf("box") === -1) {
          return;
        }
        // 打开蒙层
        mask_dom.style.display = "block";

        //克隆被点击的节点
        let cloneDom = boxDom.cloneNode(true);

        //第一步、获得初始位置信息
        let firstInfo = boxDom.getBoundingClientRect();

        //第二步、获取结束时的位置信息——添加全局居中样式
        cloneDom.className = cloneDom.className + " picture-zoom-in";
        //第二步、获取结束时的位置信息——放到容器中
        pic_dom.appendChild(cloneDom);
        //第二步、获取结束时的位置信息
        let lastInfo = cloneDom.getBoundingClientRect();

        //第三步、计算变化的数据数据
        let invertInfo = {
          x: firstInfo.x - lastInfo.x,
          y: firstInfo.y - lastInfo.y,
        };
        // 第三步、计算变化的数据数据 - 将克隆节点赋值变化的数据 回到初始位置
        //特别说明 由于有scale，会导致transformOrigin发生变化，在修改scale时需要将transformOrigin归零
        cloneDom.style.transformOrigin = "0 0";
        cloneDom.style.transform = `scale(1) translate(calc(-100% + ${invertInfo.x}px),calc(-100% + ${invertInfo.y}px))`;
        //第四步、设定过度动画，删除第三步的transform
        setTimeout(() => {
          cloneDom.style.transition = "all .5s";
          cloneDom.style.transformOrigin = "";
          cloneDom.style.transform = ``;
        });
      });
    </script>
  </body>
</html>



```
