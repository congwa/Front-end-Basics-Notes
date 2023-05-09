# wsam


- 这里是我对[wasm在网站上的应用总结仓库](https://github.com/congwa/wasm-codecs-browser)


## JS检测PNG图片是否有透明背景

在前端进行图片压缩的时候，需要判断png类型的图片有没有透明度来选择支持的压缩算法

[JS检测PNG图片是否有透明背景、抠图等相关处理-参考资料](https://www.zhangxinxu.com/wordpress/2018/05/canvas-png-transparent-background-detect/)

```js
img.onload = function () {
    // 图片原始尺寸
    var originWidth = this.width;
    var originHeight = this.height;
    // canvas尺寸设置
    canvas.width = originWidth;
    canvas.height = originHeight;
    // 清除画布
    context.clearRect(0, 0, originWidth, originHeight);
    // 图片绘制在画布上
    context.drawImage(img, 0, 0);
    // 获取图片像素信息
    var imageData = context.getImageData(0, 0, originWidth, originHeight).data;
    // 检测有没有透明数据
    isAlphaBackground = false;
    for (var index = 3; index < imageData.length; index += 4) {
        if (imageData[index] != 255) {
            isAlphaBackground = true;
            break;    
        }
    }
    // isAlphaBackground就是最后石头有透明或半透明背景色的结果
};
```