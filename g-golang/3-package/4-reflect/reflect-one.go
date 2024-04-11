package main

import (
	"fmt"
	"reflect"
)

type Cat struct {
	Name string
}

func main() {
	var f float64 = 3.5
	t1 := reflect.TypeOf(f)
	fmt.Println(t1.String())

	c := Cat{Name: "kitty"}
	t2 := reflect.TypeOf(c)
	fmt.Println(t2.String())
}
