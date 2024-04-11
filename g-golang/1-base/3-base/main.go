package main

import "fmt"

type Student struct {
	name string
}

func (s Student) Speak() {
	fmt.Println("hello, golang")
}

func demo2(s Student) {
	s.Speak()
}

func demo1(s1 interface{}) {
	demo2(s1)
}

func main() {
	s1 := Student{name: "wangbm"}
	demo1(s1)
}
