package main

import "fmt"

type Person interface {
	job()
	growUp()
}

type Student struct {
	age int
}

func (p *Student) job() {
	fmt.Println("student", p.age)
	return
}

func (p *Student) growUp() {
	p.age += 1
	return
}

type Programmer struct {
	age int
}

func (p Programmer) job() {
	fmt.Println("programmer")
	return
}

func (p Programmer) growUp() {
	p.age += 10
	return
}

func whatJob(p Person) {
	p.job()
}

func growUp(p Person) {
	p.growUp()
}

func main() {
	qcrao := Student{age: 18}
	whatJob(&qcrao)

	growUp(&qcrao)
	fmt.Println(qcrao)

	stefno := Programmer{age: 100}
	whatJob(stefno)

	growUp(stefno)
	fmt.Println(stefno)
}

/**
student 18
{19}
programmer
{100}
*/

// 这里要注意值接收和指针接收的问题。

// 如果方法的接收者是值类型，无论调用者是对象还是对象指针，修改的都是对象的副本，不影响调用者；如果方法的接收者是指针类型，则调用者修改的是指针指向的对象本身。

// stefno就是接收者是值类型的

/**

在这里的多态性的指的是，实现了Person接口，那么会自动找到实现这个接口所对应的结构体实例。

从例子中表明： whatJob 和 growUp方法根据传入的是类型是interface类型，那么这个interface类型自动转化为了对应的结构体类型。


同样的只要一个类型实现了这个接口，这么就可以把这个类型的的值赋值给这个接口类型的值
*/
