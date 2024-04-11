package main

import (
	"fmt"
	"github.com/golang/freetype" // 导入字体处理库
	"image/png"                  // 导入PNG图片处理库
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
	name := "渔夫子"                                   // 设置名称
	firstLetter, _ := utf8.DecodeRuneInString(name) // 获取名称的第一个字符

	img, err := letteravatar.Draw(75, firstLetter, options) // 使用Options绘制字母头像
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Create(name + ".png") // 创建PNG文件
	if err != nil {
		log.Fatal(err)
	}

	err = png.Encode(file, img) // 将生成的图片写入文件
	if err != nil {
		log.Fatal(err)
	}
}
