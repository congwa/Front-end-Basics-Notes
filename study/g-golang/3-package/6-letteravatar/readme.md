# 生成文字头像


钉钉、飞书的头像默认是以姓名的文字生成的,letteravatar工具的作者图像处理工具imaging的作者

该工具可以将文字生成一个100*100的头像


## FreeType和TrueType

FreeType是一个可移植的，高效的字体引擎。

TrueType是一个字体。


 字体在电脑上的显示有两种方式：点阵和矢量。对于一个字，点阵字体保存的是每个点的渲染信息。这个方式的劣势在于保存的数据量非常大，并且对放大缩小等操作支持不好。因此出现了矢量字体。 对于一个字，矢量字体保存的是字的绘制公式。这个绘制公式包括了字体轮廓（outline）和字体精调（hint）。字体轮廓使用贝塞尔曲线来绘制出字的外部线条。在大分辨率的情况下就需要对字体进行精调了。这个绘制字的公式就叫做字体数据（glyph）。在字体文件中，每个字对应一个glyph。那么字体文件中就存在一个字符映射表（charmap）。 对于矢量字体，其中用的最为广泛的是TrueType。它的扩展名一般为otf或者ttf。在windows，linux，osx上都得到广泛支持。我们平时看到的.ttf和.ttc的字体文件就是TrueType字体。其中ttc是多个ttf的集合文件（collection）


 TrueType只是一个字体，而要让这个字体在屏幕上显示，就需要字体驱动库了。其中FreeType就是这么一种高效的字体驱动引擎。一个汉字从字体到显示，FreeType大致有几个步骤：加载字体、设置字体大小、加载glyph、字体对应大小等转换、绘制字体。 这里特别注意的是FreeType并不只能驱动TrueType字体，它还可以驱动其他各种矢量字体，甚至也可以驱动点阵字体


## 基本使用

```go
// 生成一个100*100大小的以字母‘A’为图像的头像：
img, err := letteravatar.Draw(100, 'A', nil)
```

还可以自定义字体、背景颜色、字体颜色等。如下，通过letteravatar.Options参数进行设置：

```go
type Options struct {
    Font        *truetype.Font //指定字体，默认字体是不支持中文显示的
    Palette     []color.Color //指定背景的调色板
    LetterColor color.Color // 指定文字的颜色
    PaletteKey  string // 通过该key，可以hash到Palette中指定的背景颜色
}
```

背景色只使用以下三种颜色，则可以对Options参数进行如下设置：

```go
img, err := letteravatar.Draw(100, 'A', &letteravatar.Options{
    Palette: []color.Color{
        color.RGBA{255, 0, 0, 255},
        color.RGBA{0, 255, 0, 255},
        color.RGBA{0, 0, 255, 255},
    },
})
```

该包默认的字体是不支持中文绘制的。所以，如果想使用中文绘制头像，就需要下载中文的ttf字体，并通过Options中的Font参数指定。

本文使用思源宋体的字体文件来进行中文的绘制。如下：


```go
package main

import (
    "fmt"
    "github.com/golang/freetype"          // 导入字体处理库
    "image/png"                           // 导入PNG图片处理库
    "io/ioutil"
    "log"
    "os"
    "unicode/utf8"

    "github.com/disintegration/letteravatar" // 导入生成字母头像的库
)

func main() {
    fontFile, _ := ioutil.ReadFile("./SourceHanSerifSC-VF.ttf") // 读取字体文件内容
    font, _ := freetype.ParseFont(fontFile)                     // 解析字体文件内容为字体对象
    options := &letteravatar.Options{                           // 创建Options结构体，设置字体选项
        Font: font,
    }
    name := "渔夫子"                                             // 设置名称
    firstLetter, _ := utf8.DecodeRuneInString(name)             // 获取名称的第一个字符

    img, err := letteravatar.Draw(75, firstLetter, options)      // 使用Options绘制字母头像
    if err != nil {
        log.Fatal(err)
    }

    file, err := os.Create(name + ".png")                        // 创建PNG文件
    if err != nil {
        log.Fatal(err)
    }

    err = png.Encode(file, img)                                  // 将生成的图片写入文件
    if err != nil {
        log.Fatal(err)
    }   
}

// 渔
```

