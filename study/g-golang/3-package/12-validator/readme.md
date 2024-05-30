# validator

validator用于对数据进行校验。

```go
package main

import (
  "fmt"

  "gopkg.in/go-playground/validator.v10"
)

type User struct {
  Name string `validate:"min=6,max=10"`
  Age  int    `validate:"min=1,max=100"`
}

func main() {
  validate := validator.New()

  u1 := User{Name: "lidajun", Age: 18}
  err := validate.Struct(u1)
  fmt.Println(err)

  u2 := User{Name: "dj", Age: 101}
  err = validate.Struct(u2)
  fmt.Println(err)
}
```

validator在结构体标签（struct tag）中定义字段的约束

使用validator验证数据之前，我们需要调用validator.New()创建一个验证器，这个验证器可以指定选项、添加自定义约束，然后通过调用它的Struct()方法来验证各种结构对象的字段是否符合定义的约束。

在上面代码中，我们定义了一个结构体User，User有名称Name字段和年龄Age字段。通过min和max约束，我们设置Name的字符串长度为[6,10]之间，Age的范围为[1,100]。



第一个对象Name和Age字段都满足约束，故Struct()方法返回nil错误。第二个对象的Name字段值为dj，长度 2，小于最小值min，Age字段值为 101，大于最大值max，故返回错误：

```sh
<nil>
Key: 'User.Name' Error:Field validation for 'Name' failed on the 'min' tag
Key: 'User.Age' Error:Field validation for 'Age' failed on the 'max' tag
```

错误信息比较好理解，User.Name违反了min约束，User.Age违反了max约束，一眼就能看出问题所在。


## 约束

### 范围约束

- 对于数值，则约束其值；
- 对于字符串，则约束其长度；
- 对于切片、数组和map，则约束其长度。

下面如未特殊说明，则是根据上面各个类型对应的值与参数值比较。

- len：等于参数值，例如len=10；
- max：小于等于参数值，例如max=10；
- min：大于等于参数值，例如min=10；
- eq：等于参数值，注意与len不同。对于字符串，eq约束字符串本身的值，而len约束字符串长度。例如eq=10；
- ne：不等于参数值，例如ne=10；
- gt：大于参数值，例如gt=10；
- gte：大于等于参数值，例如gte=10；
- lt：小于参数值，例如lt=10；
- lte：小于等于参数值，例如lte=10；
- oneof：只能是列举出的值其中一个，这些值必须是数值或字符串，以空格分隔，如果字符串中有空格，将字符串用单引号包围，例如oneof=red green。

```go

/**
Name：字符串不能是admin；
Age：必须大于等于 18，未成年人禁止入内；
Sex：性别必须是male和female其中一个；
RegTime：注册时间必须小于当前的 UTC 时间，注意如果字段类型是time.Time，使用gt/gte/lt/lte等约束时不用指定参数值，默认与当前的 UTC 时间比较。
*/
type User struct {
  Name    string    `validate:"ne=admin"`
  Age     int       `validate:"gte=18"`
  Sex     string    `validate:"oneof=male female"`
  RegTime time.Time `validate:"lte"`
}

func main() {
  validate := validator.New()

  u1 := User{Name: "dj", Age: 18, Sex: "male", RegTime: time.Now().UTC()}
  err := validate.Struct(u1)
  if err != nil {
    fmt.Println(err)
  }

  u2 := User{Name: "admin", Age: 15, Sex: "none", RegTime: time.Now().UTC().Add(1 * time.Hour)}
  err = validate.Struct(u2)
  if err != nil {
    fmt.Println(err)
  }
}

/**
第一个对象的字段都是合法的，校验通过。第二个对象的 4 个字段都非法，通过输出信息很好定错误位置
Key: 'User.Name' Error:Field validation for 'Name' failed on the 'ne' tag
Key: 'User.Age' Error:Field validation for 'Age' failed on the 'gte' tag
Key: 'User.Sex' Error:Field validation for 'Sex' failed on the 'oneof' tag
Key: 'User.RegTime' Error:Field validation for 'RegTime' failed on the 'lte' tag
 */

```


### 跨字段约束

validator允许定义跨字段的约束，即该字段与其他字段之间的关系。

- 一种是参数字段就是同一个结构中的平级字段
- 另一种是参数字段为结构中其他字段的字段

约束语法很简单，要想使用上面的约束语义，只需要稍微修改一下

例如相等约束（eq），如果是约束同一个结构中的字段，则在后面添加一个field，使用eqfield定义字段间的相等约束。如果是更深层次的字段，在field之前还需要加上cs（可以理解为cross-struct），eq就变为eqcsfield。它们的参数值都是需要比较的字段名，内层的还需要加上字段的类型

```sh
eqfield=ConfirmPassword
eqcsfield=InnerStructField.Field
```

```go
type RegisterForm struct {
  Name      string `validate:"min=2"`
  Age       int    `validate:"min=18"`
  Password  string `validate:"min=10"`
  Password2 string `validate:"eqfield=Password"` // 使用eqfield约束其两次输入的密码必须相等
}

func main() {
  validate := validator.New()

  f1 := RegisterForm{
    Name:      "dj",
    Age:       18,
    Password:  "1234567890",
    Password2: "1234567890",
  }
  err := validate.Struct(f1)
  if err != nil {
    fmt.Println(err)
  }

  f2 := RegisterForm{
    Name:      "dj",
    Age:       18,
    Password:  "1234567890",
    Password2: "123",
  }
  err = validate.Struct(f2)
  if err != nil {
    fmt.Println(err)
  }
}
/**
一个对象满足约束，第二个对象两次密码明显不等。
Key: 'RegisterForm.Password2' Error:Field validation for 'Password2' failed on the 'eqfield' tag
*/
```


### 字符串

validator中关于字符串的约束有很多，这里介绍几个：

- contains=：包含参数子串，例如contains=email；
- containsany：包含参数中任意的 UNICODE 字符，例如containsany=abcd；
- containsrune：包含参数表示的 rune 字符，例如containsrune=☻；
- excludes：不包含参数子串，例如excludes=email；
- excludesall：不包含参数中任意的 UNICODE 字符，例如excludesall=abcd；
- excludesrune：不包含参数表示的 rune 字符，excludesrune=☻；
- startswith：以参数子串为前缀，例如startswith=hello；
- endswith：以参数子串为后缀，例如endswith=bye。
- lowercase： 小写
- uppercase： 大写


```go
/**
限制Name字段必须包含 UNICODE 字符☻。
*/
type User struct {
  Name string `validate:"containsrune=☻"`
  Age  int    `validate:"min=18"`
}

func main() {
  validate := validator.New()

  u1 := User{"d☻j", 18}
  err := validate.Struct(u1)
  if err != nil {
    fmt.Println(err)
  }

  u2 := User{"dj", 18}
  err = validate.Struct(u2)
  if err != nil {
    fmt.Println(err)
  }
}
```

### 唯一性

使用unqiue来指定唯一性约束，对不同类型的处理如下：

- 对于数组和切片，unique 约束没有重复的元素
- 对于map ， unique约束没有重复的**值**
- 对于元素类型为结构体的切片，unique约束结构体对象的某个字段不重复，通过unqiue=field指定这个字段名

```go
type User struct {
  Name    string   `validate:"min=2"`
  Age     int      `validate:"min=18"`
  Hobbies []string `validate:"unique"`      // 对于切片类型， 约束没有重复的元素
  Friends []User   `validate:"unique=Name"` // 元素类型为结构体的字段，User切片结构体中，Name字段不重复
}

func main() {
  validate := validator.New()

  f1 := User{
    Name: "dj2",
    Age:  18,
  }
  f2 := User{
    Name: "dj3",
    Age:  18,
  }

  u1 := User{
    Name:    "dj",
    Age:     18,
    Hobbies: []string{"pingpong", "chess", "programming"},
    Friends: []User{f1, f2},
  }
  err := validate.Struct(u1)
  if err != nil {
    fmt.Println(err)
  }

  u2 := User{
    Name:    "dj",
    Age:     18,
    Hobbies: []string{"programming", "programming"}, // 切片内元素重复
    Friends: []User{f1, f1}, // Name字段重复
  }
  err = validate.Struct(u2)
  if err != nil {
    fmt.Println(err)
  }
}

/**
Key: 'User.Hobbies' Error:Field validation for 'Hobbies' failed on the 'unique' tag
Key: 'User.Friends' Error:Field validation for 'Friends' failed on the 'unique' tag
 */
```


### 邮件

通过email限制字段必须是邮件格式：

```go
type User struct {
  Name  string `validate:"min=2"`
  Age   int    `validate:"min=18"`
  Email string `validate:"email"`
}

func main() {
  validate := validator.New()

  u1 := User{
    Name:  "dj",
    Age:   18,
    Email: "dj@example.com",
  }
  err := validate.Struct(u1)
  if err != nil {
    fmt.Println(err)
  }

  u2 := User{
    Name:  "dj",
    Age:   18,
    Email: "djexample.com", // 不满足约束的邮箱格式
  }
  err = validate.Struct(u2)
  if err != nil {
    fmt.Println(err)
  }
}

/**
Key: 'User.Email' Error:Field validation for 'Email' failed on the 'email' tag
*/
```




### 特殊

有一些比较特殊的约束：


| 标签     | 说明                 |
| -------- | -------------------- |
| -        | 跳过该字段，不检验   |
| \|       | 使用多个约束         |
| required | 字段必须设置，不能为默认值 |
| omitempty | 如果字段未设置，则忽略 |


### 其它

TODO: ASCII/UNICODE字母、数字、十六进制、十六进制颜色值、大小写、RBG 颜色值，HSL 颜色值、HSLA 颜色值、JSON 格式、文件路径、URL、base64 编码串、ip 地址、ipv4、ipv6、UUID、经纬度等[https://github.com/go-playground/validator](https://github.com/go-playground/validator)


## 验证两个变量约束的VarWithValue方法 - 只需要传入要验证的两个变量和约束即可对两个变量进行比较

在一些很简单的情况下，我们仅仅想对两个变量进行比较，如果每次都要先定义结构和tag就太繁琐了。validator提供了VarWithValue()方法，我们只需要传入要验证的两个变量和约束即可

```go
func main() {
  name1 := "dj"
  name2 := "dj2"

  validate := validator.New()
  fmt.Println(validate.VarWithValue(name1, name2, "eqfield"))

  fmt.Println(validate.VarWithValue(name1, name2, "nefield"))
}
```

## 自定义约束

除了使用validator提供的约束外，还可以定义自己的约束。

例如现在有个奇葩的需求，产品同学要求用户必须使用回文串作为用户名，我们可以自定义这个约束：

```go
type RegisterForm struct {
  Name string `validate:"palindrome"`
  Age  int    `validate:"min=18"`
}

func reverseString(s string) string {
  runes := []rune(s)
  for from, to := 0, len(runes)-1; from < to; from, to = from+1, to-1 {
    runes[from], runes[to] = runes[to], runes[from]
  }

  return string(runes)
}

func CheckPalindrome(fl validator.FieldLevel) bool {
  value := fl.Field().String()
  return value == reverseString(value)
}

func main() {
  validate := validator.New()
  validate.RegisterValidation("palindrome", CheckPalindrome)

  f1 := RegisterForm{
    Name: "djd",
    Age:  18,
  }
  err := validate.Struct(f1)
  if err != nil {
    fmt.Println(err)
  }

  f2 := RegisterForm{
    Name: "dj",
    Age:  18,
  }
  err = validate.Struct(f2)
  if err != nil {
    fmt.Println(err)
  }
}
/**
Key: 'RegisterForm.Name' Error:Field validation for 'Name' failed on the 'palindrome' tag
*/
```

限制小数点后最多两位

```go
type MyStruct struct {
    Number float64 `validate:"pattern=^\\d+(\\.\\d{1,2})?$"`  // 使用正则表达式限制小数点后最多两位
}

func main() {
    v := validator.New()

    s := MyStruct{
        Number: 12.345,
    }

    err := v.Struct(s)
    if err != nil {
        // 验证失败，处理错误
        fmt.Println(err)
    } else {
        // 验证通过
        fmt.Println("验证通过")
    }
}

```


## 错误处理

在上面的例子中，校验失败时我们仅仅只是输出返回的错误。其实，我们可以进行更精准的处理。

validator返回的错误实际上只有两种，一种是参数错误，一种是校验错误。

参数错误时，返回InvalidValidationError类型；

校验错误时返回ValidationErrors，它们都实现了error接口。

而且ValidationErrors是一个错误切片，它保存了每个字段违反的每个约束信息：

```go
// src/gopkg.in/validator.v10/errors.go
type InvalidValidationError struct {
  Type reflect.Type
}

// Error returns InvalidValidationError message
func (e *InvalidValidationError) Error() string {
  if e.Type == nil {
    return "validator: (nil)"
  }

  return "validator: (nil " + e.Type.String() + ")"
}

type ValidationErrors []FieldError

func (ve ValidationErrors) Error() string {
  buff := bytes.NewBufferString("")
  var fe *fieldError

  for i := 0; i < len(ve); i++ {
    fe = ve[i].(*fieldError)
    buff.WriteString(fe.Error())
    buff.WriteString("\n")
  }
  return strings.TrimSpace(buff.String())
}
```

所以validator校验返回的结果只有 3 种情况：

- nil：没有错误；
- InvalidValidationError：输入参数错误；
- ValidationErrors：字段违反约束。

我们可以在程序中判断err != nil时，依次将err转换为InvalidValidationError和ValidationErrors以获取更详细的信息：

```go
func processErr(err error) {
  if err == nil {
    return
  }

  invalid, ok := err.(*validator.InvalidValidationError)
  if ok {
    fmt.Println("param error:", invalid)
    return
  }

  validationErrs := err.(validator.ValidationErrors)
  for _, validationErr := range validationErrs {
    fmt.Println(validationErr)
  }
}

func main() {
  validate := validator.New()

  err := validate.Struct(1)
  processErr(err)

  err = validate.VarWithValue(1, 2, "eqfield")
  processErr(err)
}
```
