# 委托和控制反转

## 嵌入

### 结构体嵌入

```go
type Widget struct {
    X, Y int
}
type Label struct {
    Widget        // Embedding (delegation)
    Text   string // Aggregation
}

label := Label{Widget{10, 10}, "State:"}

label.X = 11
label.Y = 12
```

### 重名

如果在Label 结构体里出现了重名，就需要解决重名问题，例如，如果成员 X 重名，我们就要用 label.X表明是自己的X ，用 label.Wedget.X 表明是嵌入过来的。


```go
type Button struct {
    Label // Embedding (delegation)
}

type ListBox struct {
    Widget          // Embedding (delegation)
    Texts  []string // Aggregation
    Index  int      // Aggregation
}
```

### 方法重写

```go
type Painter interface {
    Paint()
}
 
type Clicker interface {
    Click()
}


func (label Label) Paint() {
  fmt.Printf("%p:Label.Paint(%q)\n", &label, label.Text)
}

//因为这个接口可以通过 Label 的嵌入带到新的结构体，
//所以，可以在 Button 中重载这个接口方法
func (button Button) Paint() { // Override
    fmt.Printf("Button.Paint(%s)\n", button.Text)
}
func (button Button) Click() {
    fmt.Printf("Button.Click(%s)\n", button.Text)
}


func (listBox ListBox) Paint() {
    fmt.Printf("ListBox.Paint(%q)\n", listBox.Texts)
}
func (listBox ListBox) Click() {
    fmt.Printf("ListBox.Click(%q)\n", listBox.Texts)
}
```

Button.Paint() 接口可以通过 Label 的嵌入带到新的结构体

如果 Button.Paint() 不实现的话，会调用 Label.Paint() ，所以，在 Button 中声明 Paint() 方法，相当于 Override


### 嵌入结构体多态

```go
button1 := Button{Label{Widget{10, 70}, "OK"}}
button2 := NewButton(50, 70, "Cancel")
listBox := ListBox{Widget{10, 40}, 
    []string{"AL", "AK", "AZ", "AR"}, 0}

for _, painter := range []Painter{label, listBox, button1, button2} {
    painter.Paint()
}
 
for _, widget := range []interface{}{label, listBox, button1, button2} {
  // 都实现了 interface 接口， 通过断言展现多态
  widget.(Painter).Paint()
  if clicker, ok := widget.(Clicker); ok {
    clicker.Click()
  }
  fmt.Println() // print a empty line 
}
```

**[使用接口来多态](/study/g-golang/4-document/1-go的多态性/readme.md)，也可以使用泛型的 interface{} 来多态，但是需要有一个类型转换**

## 反转控制

```go
type IntSet struct {
    data map[int]bool
}
func NewIntSet() IntSet {
    return IntSet{make(map[int]bool)}
}
func (set *IntSet) Add(x int) {
    set.data[x] = true
}
func (set *IntSet) Delete(x int) {
    delete(set.data, x)
}
func (set *IntSet) Contains(x int) bool {
    return set.data[x]
}

type UndoableIntSet struct { // Poor style
    IntSet    // Embedding (delegation)
    functions []func()
}
 
func NewUndoableIntSet() UndoableIntSet {
    return UndoableIntSet{NewIntSet(), nil}
}
 

func (set *UndoableIntSet) Add(x int) { // Override
    if !set.Contains(x) {
        set.data[x] = true
        set.functions = append(set.functions, func() { set.Delete(x) })
    } else {
        set.functions = append(set.functions, nil)
    }
}


func (set *UndoableIntSet) Delete(x int) { // Override
    if set.Contains(x) {
        delete(set.data, x)
        set.functions = append(set.functions, func() { set.Add(x) })
    } else {
        set.functions = append(set.functions, nil)
    }
}

func (set *UndoableIntSet) Undo() error {
    if len(set.functions) == 0 {
        return errors.New("No functions to undo")
    }
    index := len(set.functions) - 1
    if function := set.functions[index]; function != nil {
        function()
        set.functions[index] = nil // For garbage collection
    }
    set.functions = set.functions[:index]
    return nil
}
```

- 我们在 UndoableIntSet 中嵌入了IntSet ，然后 Override 了 它的 Add()和 Delete() 方法；
- Contains() 方法没有 Override，所以，就被带到 UndoableInSet 中来了。
- 在 Override 的 Add()中，记录 Delete 操作；
- 在 Override 的 Delete() 中，记录 Add 操作；
- 在新加入的 Undo() 中进行 Undo 操作

Undo 操作其实是一种控制逻辑，并不是业务逻辑，所以，在复用 Undo 这个功能时，是有问题的，因为其中加入了大量跟 IntSet 相关的业务逻辑。

## 反转依赖

```go
type Undo []func()

func (undo *Undo) Add(function func()) {
  *undo = append(*undo, function)
}

func (undo *Undo) Undo() error {
  functions := *undo
  if len(functions) == 0 {
    return errors.New("No functions to undo")
  }
  index := len(functions) - 1
  if function := functions[index]; function != nil {
    function()
    functions[index] = nil // For garbage collection
  }
  *undo = functions[:index]
  return nil
}

type IntSet struct {
    data map[int]bool
    undo Undo
}
 
func NewIntSet() IntSet {
    return IntSet{data: make(map[int]bool)}
}

func (set *IntSet) Undo() error {
    return set.undo.Undo()
}
 
func (set *IntSet) Contains(x int) bool {
    return set.data[x]
}

func (set *IntSet) Add(x int) {
    if !set.Contains(x) {
        set.data[x] = true
        set.undo.Add(func() { set.Delete(x) })
    } else {
        set.undo.Add(nil)
    }
}
 
func (set *IntSet) Delete(x int) {
    if set.Contains(x) {
        delete(set.data, x)
        set.undo.Add(func() { set.Add(x) })
    } else {
        set.undo.Add(nil)
    }
}
```

看到这里，你不必觉得奇怪， Undo 本来就是一个类型，不必是一个结构体，是一个函数数组也没有什么问题。

然后，我们在 IntSet 里嵌入 Undo，接着在 Add() 和 Delete() 里使用刚刚的方法，就可以完成功能了。

这个就是控制反转，不是由控制逻辑 Undo 来依赖业务逻辑 IntSet，而是由业务逻辑 IntSet 依赖 Undo 。这里依赖的是其实是一个协议，这个协议是一个没有参数的函数数组。可以看到，这样一来，我们 Undo 的代码就可以复用了。
