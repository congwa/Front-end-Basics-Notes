# cast 小巧、实用的类型转换库


cast实现了多种常见类型之间的相互转换,返回最符合直觉的结果


## 基础转换

基础转换就是 ToInt  ToString ToBool

- nil转为string的结果为""，而不是"nil"
- true转为string的结果为"true"，而true转为int的结果为1
- interface{}转为其他类型，要看它里面存储的值类型


## 高级转换

### 时间和时长转换

#### 时间转换 ToTime

根据传入的类型执行不同的处理

- 如果是time.Time，直接返回；
- 如果是整型，将参数作为时间戳（自 UTC 时间1970.01.01 00:00:00到现在的秒数）调用time.Unix生成时间。Unix接受两个参数，第一个参数指定秒，第二个参数指定纳秒；
- 如果是字符串，调用StringToDate函数依次尝试以下面这些时间格式调用time.Parse解析该字符串。如果某个格式解析成功，则返回获得的time.Time。否则解析失败，返回错误；
- 其他任何类型都无法转换为time.Time。


#### 时长转换 ToDuration

根据传入的类型执行不同的处理

- 如果是time.Duration类型，直接返回；
- 如果是整型或浮点型，将其数值强制转换为time.Duration类型，单位默认为ns；
- 如果是字符串，分为两种情况：如果字符串中有时间单位符号nsuµmh，直接调用time.ParseDuration解析；否则在字符串后拼接ns再调用time.ParseDuration解析；
- 其他类型解析失败。




### 切片转换

#### ToIntSlice
根据传入参数的类型：

- 如果是nil，直接返回错误；
- 如果是[]int，不用转换，直接返回；
- 如果传入类型为切片或数组，新建一个[]int，将切片或数组中的每个元素转为int放到该[]int中。最后返回这个[]int；
- 其他情况，不能转换。

#### ToStringSlice

根据传入的参数类型：

- 如果是[]interface{}，将该参数中每个元素转为string，返回结果切片；
- 如果是[]string，不需要转换，直接返回；
- 如果是interface{}，将参数转为string，返回只包含这个值的切片；
- 如果是string，调用strings.Fields函数按空白符将参数拆分，返回拆分后的字符串切片；
- 其他情况，不能转换。

### map转换 ToStringMapString

根据传入的参数类型：

- 如果是map[string]string，不用转换，直接返回；
- 如果是map[string]interface{}，将每个值转为string存入新的 map，最后返回新的 map；
- 如果是map[interface{}]string，将每个键转为string存入新的 map，最后返回新的 map；
- 如果是map[interface{}]interface{}，将每个键和值都转为string存入新的 map，最后返回新的 map；
- 如果是string类型，cast将它看成一个 JSON 串，解析这个 JSON 到map[string]string，然后返回结果；
- 其他情况，返回错误。


## 示例

```go
package main

import (
	"fmt"
	"time"

	"github.com/spf13/cast"
)

func main() {
	// 基础转换示例
	fmt.Println("Basic Conversions:")
	fmt.Println(cast.ToString(nil))           // 输出: ""
	fmt.Println(cast.ToString(true))          // 输出: "true"
	fmt.Println(cast.ToInt(true))             // 输出: 1
	fmt.Println(cast.ToString(123))           // 输出: "123"
	fmt.Println(cast.ToBool("true"))          // 输出: true

	// 时间和时长转换示例
	fmt.Println("\nTime and Duration Conversions:")
	t := time.Now()
	fmt.Println(cast.ToTime(t))               // 输出: 当前时间
	fmt.Println(cast.ToTime(t.Unix()))        // 输出: 当前时间
	fmt.Println(cast.ToTime("2023-01-01"))    // 输出: 2023-01-01 00:00:00 +0000 UTC
	fmt.Println(cast.ToDuration(10))          // 输出: 10ns
	fmt.Println(cast.ToDuration("2s"))        // 输出: 2s

	// 切片转换示例
	fmt.Println("\nSlice Conversions:")
	fmt.Println(cast.ToIntSlice([]int{1, 2, 3}))               // 输出: [1 2 3]
	fmt.Println(cast.ToStringSlice([]interface{}{1, "2", true})) // 输出: [1 2 true]

	// map转换示例
	fmt.Println("\nMap Conversions:")
	fmt.Println(cast.ToStringMapString(map[string]string{"name": "John", "age": "25"}))                           // 输出: map[name:John age:25]
	fmt.Println(cast.ToStringMapString(map[string]interface{}{"name": "John", "age": 25}))                        // 输出: map[name:John age:25]
	fmt.Println(cast.ToStringMapString(map[interface{}]string{"name": "John", "age": "25"}))                      // 输出: map[name:John age:25]
	fmt.Println(cast.ToStringMapString(map[interface{}]interface{}{"name": "John", "age": 25})))                 // 输出: map[name:John age:25]
	fmt.Println(cast.ToStringMapString(`{"name": "John", "age": "25"}`))                                         // 输出: map[name:John age:25]
}
```