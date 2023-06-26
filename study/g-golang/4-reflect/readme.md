# reflect反射

反射是一种机制，在编译时不知道具体类型的情况下，可以透视结构的组成、更新值。使用反射，可以让我们编写出能统一处理所有类型的代码。甚至是编写这部分代码时还不存在的类型。一个具体的例子就是fmt.Println()方法，可以打印出我们自定义的结构类型。


虽然，一般来说都不建议在代码中使用反射。反射影响性能、不易阅读、将编译时就能检查出来的类型问题推迟到运行时以 panic 形式表现出来，这些都是反射的缺点。

但是，我认为反射是一定要掌握的，原因如下：

- 很多标准库和第三方库都用到了反射，虽然暴露的接口做了封装，不需要了解反射。但是如果要深入研究这些库，了解实现，阅读源码， 反射是绕不过去的。例如encoding/json，encoding/xml等；
- 如果有一个需求，编写一个可以处理所有类型的函数或方法，我们就必须会用到反射。因为 Go 的类型数量是无限的，而且可以自定义类型，所以使用类型断言是无法达成目标的。


## 反射基础

reflect包定义了一个接口reflect.Type和一个结构体reflect.Value，它们定义了大量的方法用于获取类型信息，设置值等。

在reflect包内部，只有类型描述符实现了reflect.Type接口。由于类型描述符是未导出类型，我们只能通过reflect.TypeOf()方法获取reflect.Type类型的值：

```go
  type Cat struct {
    Name string
  }
  var f float64 = 3.5
  t1 := reflect.TypeOf(f)
  fmt.Println(t1.String())

  c := Cat{Name: "kitty"}
  t2 := reflect.TypeOf(c)
  fmt.Println(t2.String())

  // float64
  // main.Cat

```

Go 语言是静态类型的，每个变量在编译期有且只能有一个确定的、已知的类型，即变量的静态类型。
静态类型在变量声明的时候就已经确定了，无法修改。一个接口变量，它的静态类型就是该接口类型。
虽然在运行时可以将不同类型的值赋值给它，改变的也只是它内部的动态类型和动态值。它的静态类型始终没有改变。

reflect.TypeOf()方法就是用来取出接口中的动态类型部分，以reflect.Type返回

--- 

相应地，reflect.ValueOf()方法自然就是获取接口中的值部分，返回值为reflect.Value类型。


```go

v1 := reflect.ValueOf(f)
fmt.Println(v1)
fmt.Println(v1.String())

v2 := reflect.ValueOf(c)
fmt.Println(v2)
fmt.Println(v2.String())

// 3.5
// <float64 Value>
// {kitty}
// <main.Cat Value>

// 由于fmt.Println()会对reflect.Value类型做特殊处理，打印其内部的值，所以上面显示调用了reflect.Value.String()方法获取更多信息。
```

获取类型如此常见，fmt提供了格式化符号%T输出参数类型：

```go
fmt.Printf("%T\n", 3) // int
```

Go 语言中类型是无限的，而且可以通过type定义新的类型。但是类型的种类是有限的

reflect包中定义了所有种类的枚举：

```go
// src/reflect/type.go
type Kind uint

const (
  Invalid Kind = iota
  Bool
  Int
  Int8
  Int16
  Int32
  Int64
  Uint
  Uint8
  Uint16
  Uint32
  Uint64
  Uintptr
  Float32
  Float64
  Complex64
  Complex128
  Array
  Chan
  Func
  Interface
  Map
  Ptr
  Slice
  String
  Struct
  UnsafePointer
)

```

一共 26 种，我们可以分类如下：

- 基础类型Bool、String以及各种数值类型（有符号整数Int/Int8/Int16/Int32/Int64，无符号整数Uint/Uint8/Uint16/Uint32/Uint64/Uintptr，浮点数Float32/Float64，复数Complex64/Complex128）
- 复合（聚合）类型Array和Struct
- 引用类型Chan、Func、Ptr、Slice和Map（值类型和引用类型区分不明显，这里不引战，大家理解意思就行）
- 接口类型Interface
- 非法类型Invalid，表示它还没有任何值（reflect.Value的零值就是Invalid类型）

**Go 中所有的类型（包括自定义的类型），都是上面这些类型或它们的组合**。


```go
type MyInt int

func main() {
  var i int
  var j MyInt

  i = int(j) // 必须强转

  ti := reflect.TypeOf(i)
  fmt.Println("type of i:", ti.String())

  tj := reflect.TypeOf(j)
  fmt.Println("type of j:", tj.String())

  fmt.Println("kind of i:", ti.Kind())
  fmt.Println("kind of j:", tj.Kind())
}

// type of i: int
// type of j: main.MyInt
// kind of i: int
// kind of j: int

//上面两个变量的静态类型分别为int和MyInt，是不同的。虽然MyInt的底层类型（underlying type）也是int。它们之间的赋值必须要强制类型转换。但是它们的种类是一样的，都是int。
```

## 用法

### 透视数据组成


透视结构体组成，需要以下方法：

- reflect.ValueOf()：获取反射值对象；
- reflect.Value.NumField()：从结构体的反射值对象中获取它的字段个数；
- reflect.Value.Field(i)：从结构体的反射值对象中获取第i个字段的反射值对象；
- reflect.Kind()：从反射值对象中获取种类；
- reflect.Int()/reflect.Uint()/reflect.String()/reflect.Bool()：这些方法从反射值对象做取出具体类型。

```go
// 遍历
type User struct {
  Name    string
  Age     int
  Married bool
}

func inspectStruct(u interface{}) {
  v := reflect.ValueOf(u)
  for i := 0; i < v.NumField(); i++ {
    field := v.Field(i)
    switch field.Kind() {
    case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
      fmt.Printf("field:%d type:%s value:%d\n", i, field.Type().Name(), field.Int())

    case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
      fmt.Printf("field:%d type:%s value:%d\n", i, field.Type().Name(), field.Uint())

    case reflect.Bool:
      fmt.Printf("field:%d type:%s value:%t\n", i, field.Type().Name(), field.Bool())

    case reflect.String:
      fmt.Printf("field:%d type:%s value:%q\n", i, field.Type().Name(), field.String())

    default:
      fmt.Printf("field:%d unhandled kind:%s\n", i, field.Kind())
    }
  }
}

func main() {
  u := User{
    Name:    "dj",
    Age:     18,
    Married: true,
  }

  inspectStruct(u)
}
```

结合使用reflect.Value的NumField()和Field()方法可以遍历结构体的每个字段。然后针对每个字段的Kind做相应的处理。

有些方法只有在原对象是某种特定类型时，才能调用。例如NumField()和Field()方法只有原对象是结构体时才能调用，否则会panic


识别出具体类型后，可以调用反射值对象的对应类型方法获取具体类型的值

例如上面的field.Int()/field.Uint()/field.Bool()/field.String()

但是为了减轻处理的负担，Int()/Uint()方法对种类做了合并处理，它们只返回相应的最大范围的类型，Int()返回Int64类型，Uint()返回Uint64类型。而Int()/Uint()内部会对相应的有符号或无符号种类做处理，转为Int64/Uint64返回。



也可以透视标准库中的结构体，并且可以透视其中的未导出字段。使用上面定义的inspectStruct()方法：


```go

inspectStruct(bytes.Buffer{})

type Buffer struct {
  buf      []byte
  off      int   
  lastRead readOp
}

// field:0 unhandled kind:slice
// field:1 type:int value:0
// field:2 type:readOp value:0


```


**透视map组成**，需要以下方法：

- reflect.Value.MapKeys()：将每个键的reflect.Value对象组成一个切片返回；
- reflect.Value.MapIndex(k)：传入键的reflect.Value对象，返回值的reflect.Value；
- 然后可以对键和值的reflect.Value进行和上面一样的处理。

```go
// 透视map的组成
func inspectMap(m interface{}) {
  v := reflect.ValueOf(m)
  for _, k := range v.MapKeys() {
    field := v.MapIndex(k)

    fmt.Printf("%v => %v\n", k.Interface(), field.Interface())
  }
}

func main() {
  inspectMap(map[uint32]uint32{
    1: 2,
    3: 4,
  })
}

// 1 => 2
// 3 => 4

```

**透视切片或数组组成**，需要以下方法：

- reflect.Value.Len()：返回数组或切片的长度；
- reflect.Value.Index(i)：返回第i个元素的reflect.Value值；
- 然后对这个reflect.Value判断Kind()进行处理。\


```go
// 透视切片组成
func inspectSliceArray(sa interface{}) {
  v := reflect.ValueOf(sa)

  fmt.Printf("%c", '[')
  for i := 0; i < v.Len(); i++ {
    elem := v.Index(i)
    fmt.Printf("%v ", elem.Interface())
  }
  fmt.Printf("%c\n", ']')
}

func main() {
  inspectSliceArray([]int{1, 2, 3})
  inspectSliceArray([3]int{4, 5, 6})
}

// [1 2 3 ]
// [4 5 6 ]
```

**透视函数类型**，需要以下方法：

- reflect.Type.NumIn()：获取函数参数个数；
- reflect.Type.In(i)：获取第i个参数的reflect.Type；
- reflect.Type.NumOut()：获取函数返回值个数；
- reflect.Type.Out(i)：获取第i个返回值的reflect.Type。

```go
//透视函数类型
func Add(a, b int) int {
  return a + b
}

func Greeting(name string) string {
  return "hello " + name
}

func inspectFunc(name string, f interface{}) {
  t := reflect.TypeOf(f)
  fmt.Println(name, "input:")
  for i := 0; i < t.NumIn(); i++ {
    t := t.In(i)
    fmt.Print(t.Name())
    fmt.Print(" ")
  }
  fmt.Println()

  fmt.Println("output:")
  for i := 0; i < t.NumOut(); i++ {
    t := t.Out(i)
    fmt.Print(t.Name())
    fmt.Print(" ")
  }
  fmt.Println("\n===========")
}

func main() {
  inspectFunc("Add", Add)
  inspectFunc("Greeting", Greeting)
}

// Add input:
// int int
// output:
// int
// ===========
// Greeting input:
// string
// output:
// string
// ===========
```

**透视结构体中定义的方法**，需要以下方法：

- reflect.Type.NumMethod()：返回结构体定义的方法个数；
- reflect.Type.Method(i)：返回第i个方法的reflect.Method对象；

```go

// src/reflect/type.go
// reflect.Method定义如下
type Method struct {
  Name    string // 方法名
  PkgPath string

  Type  Type  // 方法类型（即函数类型）
  Func  Value // 方法值（以接收器作为第一个参数）
  Index int   // 是结构体中的第几个方法
}

// 透视结构体中定义的方法
func inspectMethod(o interface{}) {
  t := reflect.TypeOf(o)

  for i := 0; i < t.NumMethod(); i++ {
    m := t.Method(i)

    fmt.Println(m)
  }
}

type User struct {
  Name    string
  Age     int
}

func (u *User) SetName(n string) {
  u.Name = n
}

func (u *User) SetAge(a int) {
  u.Age = a
}

func main() {
  u := User{
    Name:    "dj",
    Age:     18,
  }
  inspectMethod(&u)
}
```

事实上，reflect.Value也定义了NumMethod()/Method(i)这些方法。区别在于：


reflect.Type.Method(i)返回的是一个reflect.Method对象，可以获取方法名、类型、是结构体中的第几个方法等信息。如果要通过这个reflect.Method调用方法，必须使用Func字段，而且要传入接收器的reflect.Value作为第一个参数：

```go
m.Func.Call(v, ...args)
```

但是reflect.Value.Method(i)返回一个reflect.Value对象，它总是以调用Method(i)方法的reflect.Value作为接收器对象，不需要额外传入。而且直接使用Call()发起方法调用：

```go
m.Call(...args)
```


reflect.Type和reflect.Value有不少同名方法，使用时需要注意甄别。


### 调用函数或方法


调用函数，需要以下方法：

- reflect.Value.Call()：使用reflect.ValueOf()生成每个参数的反射值对象，然后组成切片传给Call()方法。Call()方法执行函数调用，返回[]reflect.Value。其中每个元素都是原返回值的反射值对象。


```go
func Add(a, b int) int {
  return a + b
}

func Greeting(name string) string {
  return "hello " + name
}

func invoke(f interface{}, args ...interface{}) {
  v := reflect.ValueOf(f)

  argsV := make([]reflect.Value, 0, len(args))
  for _, arg := range args {
    argsV = append(argsV, reflect.ValueOf(arg))
  }

  rets := v.Call(argsV)

  fmt.Println("ret:")
  for _, ret := range rets {
    fmt.Println(ret.Interface())
  }
}

func main() {
  invoke(Add, 1, 2)
  invoke(Greeting, "dj")
}
// ret:
// 3
// ret:
// hello dj
```

方法的调用也是类似的：

```go
type M struct {
  a, b int
  op   rune
}

func (m M) Op() int {
  switch m.op {
  case '+':
    return m.a + m.b

  case '-':
    return m.a - m.b

  case '*':
    return m.a * m.b

  case '/':
    return m.a / m.b

  default:
    panic("invalid op")
  }
}

func main() {
  m1 := M{1, 2, '+'}
  m2 := M{3, 4, '-'}
  m3 := M{5, 6, '*'}
  m4 := M{8, 2, '/'}
  invoke(m1.Op)
  invoke(m2.Op)
  invoke(m3.Op)
  invoke(m4.Op)
}
// ret:
// 3
// ret:
// -1
// ret:
// 30
// ret:
// 4
```


