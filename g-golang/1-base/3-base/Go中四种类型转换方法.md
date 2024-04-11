# Go类型转换


## 显示类型转换

使用对应的类型函数进行转换

```go


func main() {
    // 使用 int16 就可以将 int8 类型的对象转为 int16
    var a int8 = 5
    fmt.Printf("%T \n", a)
    // output: int8

    b := int16(a)
    fmt.Printf("%T \n", b)
    // output: int16

    // 先将 string 类型通过 []byte 类型函数转为 []byte （等同于 []uint8），最后又使用 string 类型函数将  []byte 转回 string
    var s1 string = "golang"
    fmt.Printf("%T \n", s1)
    // output: string

    s2 := []byte(s1)
    fmt.Printf("%T \n", s2)
    // output: []uint8

    s3 := string(s2)
    fmt.Printf("%T \n", s3)
    // output: string
}

// 能用于将结构体类型转换接口类型，而不能将接口类型转为结构体类型
type People interface {
    Speak()
}

type Student struct {
    name string
}

func (s Student) Speak() {
    fmt.Println("hello, golang")
}

func demo2(s People) {
    s.Speak()
}

func demo1(s1 Student) {
    // 结构体类型转为接口类型
    s2 := People(s1)
    demo2(s2)
}

func main() {
    s1 := Student{name: "wan"}
    demo1(s1)
}
```

## 隐式类型转换

隐式转换，是编译器所为， 在日常开发中，开发者并不会感觉到发生了变化。

隐式转换以下面两种情况最为常见，非常简单，

### 函数调用时转换

```go
func demo2(s Student) {
  s.Speak() // 接收的是Student类型
}

func demo1(s1 interface{}) {
  demo2(s1) // 发生类型转换： 接收的是interface{}会将原来的Student类型转换为interface{}类型
}

func main() {
  s1 := Student{name: "wan"}
  demo1(s1) // 1. 传入的Student类型
}
```

### 函数返回时转换

```go
func demo2(s Student) {
  s.Speak()
}

// 1. 传入 Student类型  2.返回时隐式类型转换成interface{} 类型
func demo1(s1 Student) interface{} {
  return s1
}

func main() {
  s1 := Student{name: "wan"}
  s2 := demo1(s1)
  demo2(s2)  // 3. 导致传参时类型不匹配，因为接口类型不能转换成结构体类型
}
```


## 类型断言

```go
func demo2(s Student) {
  s.Speak()
}

func demo1(s1 Student) interface{} {

  // 经过demo1函数后，s1被隐式转换为 interface{} 类型
  // 断言s1为Student，若成功，则返回 Student类型对象给 s2
  s2 := s1.(Student)
  demo2(s2)
}

func main() {
  s1 := Student{name: "wan"}
  s2 := demo1(s1)
}
```

类型断言可用于判断一个对象是否是某类型。

这其中包含两种情况：

1. 该对象是 T 类型（struct 类型），则断言该对象是 T 类型，就能断言成功
2. 该对象是 I 类型（接口类型），则断言对象是 T 类型，也能断言成功，并且返回一个静态类型为 T 的对象，也相当于类型转换了。

倘若类型断言失败，则会抛出 panic，使用的时候，请千万注意处理。若不想让其抛出 panic，可以使用另一种断言语法。

```go
s, ok := x.(T)
```

类型断言并不能用于两个通用类型的相互转换，**只能用于将静态类型为 interface{} 类型的对象，转为具体的类型**。


## 重新构造对象

```go
var a int8 = 5
fmt.Printf("%T \n", a)
// output: int8

b := (int16)(a)
fmt.Printf("%T \n", b)
// output: int16

```

