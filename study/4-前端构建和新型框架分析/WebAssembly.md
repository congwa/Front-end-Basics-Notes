# wasm


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

## 判断图片类型

操作系统在识别文件类型时，并不看文件的后缀名，而是通过Magic number(魔幻数),来判断文件类型
>"魔幻数"是一个固定长度的二进制数字，它出现在文件的开头，用于识别文件的类型。每种类型的文件都有自己独特的魔幻数。

很多文件类型起始几个字节的内容是固定的(这里使用16进制是因为16进制一个字符可以表示4个二进制位，可以更方便的表示)

- JPEG/JPG - 文件头标识（2 字节）：ff，d8 文件结束标识（2 字节）：ff，d9
- TGA - 未压缩前 （5 字节）：00 00 02 00 00
- PNG未压缩前 （8 字节）：89 50 4E 47 0D 0A 1A 0A
- GIF- 未压缩前 （6 字节）：47 49 46 38 39(37) 61
- BMP- 未压缩前 （2 字节）：42 4D B M
- PCX- 未压缩前 （1 字节）：0A
- TIFF- 未压缩前 （2 字节）：4D 4D 或 49 49
- ICO- 未压缩前 （8 字节）：00 00 01 00 01 00 20 20
- CUR- 未压缩前 （8 字节）：00 00 02 00 01 00 20 20
- IFF- 未压缩前 （4 字节）：46 4F 52 4D
- ANI- 未压缩前 （4 字节）：52 49 46 46

```js
function getImageType(buffer) {
    const view = new DataView(buffer);
    if (view.getUint8(0) === 0xFF && view.getUint8(1) === 0xD8) {
        return 'jpeg';
    } else if (view.getUint8(0) === 0x89 && view.getUint8(1) === 0x50 &&
               view.getUint8(2) === 0x4E && view.getUint8(3) === 0x47 &&
               view.getUint8(4) === 0x0D && view.getUint8(5) === 0x0A &&
               view.getUint8(6) === 0x1A && view.getUint8(7) === 0x0A) {
        return 'png';
    } else if (view.getUint8(0) === 0x47 && view.getUint8(1) === 0x49 &&
               view.getUint8(2) === 0x46 && (view.getUint8(3) === 0x38 ||
                                            view.getUint8(3) === 0x39 ||
                                            view.getUint8(3) === 0x37) &&
               view.getUint8(4) === 0x61) {
        return 'gif';
    } else if (view.getUint16(0, true) === 0x424D) {
        return 'bmp';
    } else {
        return 'unknown';
    }
}
```



## 图片压缩原理

![图片压缩原理-传送门](https://www.zhoulujun.cn/html/theory/multimedia/CG-CV-IP/8396.html)