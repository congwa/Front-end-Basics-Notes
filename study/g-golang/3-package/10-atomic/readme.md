# atomic  sync/atomic

atomic是Go中sync下的一个package，它实现了同步算法底层的原子的内存操作原语，提供了一套原子操作的方法接口。

atomic原子操作包：用于保护用户变量的更新

atomic中原子操作由底层硬件指令直接提供支持；指令在执行的过程中是不允许中断的，因此原子操作可以在lock-free的情况下保证并发安全，并且它的性能也能做到随CPU个数的增多而线性扩展

对于一个变量更新，原子操作通常会更有效率，并且更能利用计算机多核的优势。

所有原子操作方法的**操作数形参必须是指针类型**。被操作数形参必须是指针类型，通过指针变量可以获取被操作数在内存中的地址，从而施加特殊的CPU指令，**确保同一时间只有一个goroutine能够进行操作**。

适用场景：**适用于需要对整型数字做并发安全控制的场景**



## go中的原子操作

Go的原子读（Load）和原子写（Store），都是借助硬件层通过汇编实现的

- 原子读 ：依赖硬件层的 总线锁 或 缓存锁 实现
- 原子写 ：依赖硬件层的CPU指令 CMPXCHG

对于这部分，只需要知道Go底层的Load、Store操作等是通过硬件支持的即可

CMPXCHG指令的思想基于CAS

## cas

[名词 - cas](/study/h-后端/名词.md)

## TODO: GO - atomic go的原子操作

- Increase() ：原子性的自增
- Decrease() ：原子性的自减
- Add(x) ：原子性的对某个数字增加X


```go
// 使用示例
func main() {
    var money int32
    wg := sync.WaitGroup{}

    wg.Add(1000)
    for i := 1; i <= 1000; i++ {
        go func() {
            atomic.AddInt32(&money, 1)
            wg.Done()
        }()
    }
    wg.Wait()
    fmt.Printf("money = %d \n", money)
}
```

![atomic](/study/imgs/atomic.jpeg)


Golang的atomic包提供了一组原子操作函数，包括Add、CompareAndSwap、Load、Store、Swap等函数。这些函数的具体作用如下：

- Add函数：用于对一个整数型的变量进行加法操作，并返回新的值。
- CompareAndSwap函数：用于比较并交换一个指针型的变量的值。如果变量的值等于旧值，就将变量的值设置为新值，并返回true；否则，不修改变量的值，并返回false。
- Load函数：用于获取一个指针型的变量的值。
- Store函数：用于设置一个指针型的变量的值。
- Swap函数：用于交换一个指针型的变量的值，并返回旧值。

```go
func AddInt32(addr *int32, delta int32) (new int32)
func AddInt64(addr *int64, delta int64) (new int64)
func AddUint32(addr *uint32, delta uint32) (new uint32)
func AddUint64(addr *uint64, delta uint64) (new uint64)
func AddUintptr(addr *uintptr, delta uintptr) (new uintptr)

func CompareAndSwapInt32(addr *int32, old, new int32) (swapped bool)
func CompareAndSwapInt64(addr *int64, old, new int64) (swapped bool)
func CompareAndSwapUint32(addr *uint32, old, new uint32) (swapped bool)
func CompareAndSwapUint64(addr *uint64, old, new uint64) (swapped bool)
func CompareAndSwapUintptr(addr *uintptr, old, new uintptr) (swapped bool)
func CompareAndSwapPointer(addr *unsafe.Pointer, old, new unsafe.Pointer) (swapped bool)

func LoadInt32(addr *int32) (val int32)
func LoadInt64(addr *int64) (val int64)
func LoadUint32(addr *uint32) (val uint32)
func LoadUint64(addr *uint64) (val uint64)
func LoadUintptr(addr *uintptr) (val uintptr)
func LoadPointer(addr *unsafe.Pointer) (val unsafe.Pointer)

func LoadInt32(addr *int32) (val int32)
func LoadInt64(addr *int64) (val int64)
func LoadUint32(addr *uint32) (val uint32)
func LoadUint64(addr *uint64) (val uint64)
func LoadUintptr(addr *uintptr) (val uintptr)
func LoadPointer(addr *unsafe.Pointer) (val unsafe.Pointer)

func SwapInt32(addr *int32, new int32) (old int32)
func SwapInt64(addr *int64, new int64) (old int64)
func SwapUint32(addr *uint32, new uint32) (old uint32)
func SwapUint64(addr *uint64, new uint64) (old uint64)
func SwapUintptr(addr *uintptr, new uintptr) (old uintptr)
func SwapPointer(addr *unsafe.Pointer, new unsafe.Pointer) (old unsafe.Pointer)


```

例子

```go
// Add函数用于对一个整数型的变量进行加法操作
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0
    for i := 0; i < 100; i++ {
        go func() {
            atomic.AddInt32(&count, 1)
        }()
    }
    for atomic.LoadInt32(&count) < 100 {
    }
    fmt.Println("count:", count)
}

```

```go
// CompareAndSwap函数用于比较并交换一个指针型的变量的值。如果变量的值等于旧值，就将变量的值设置为新值，并返回true；否则，不修改变量的值，并返回false
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0
    for i := 0; i < 100; i++ {
        go func() {
            for {
                old := atomic.LoadInt32(&count)
                new := old + 1
                if atomic.CompareAndSwapInt32(&count, old, new) {
                    break
                }
            }
        }()
    }
    for atomic.LoadInt32(&count) < 100 {
    }
    fmt.Println("count:", count)
}

```

```go
// Load函数用于获取一个指针型的变量的值
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0
    go func() {
        for {
            fmt.Println("count:", atomic.LoadInt32(&count))
        }
    }()
    for i := 0; i < 100; i++ {
        atomic.AddInt32(&count, 1)
    }
    fmt.Println("count:", count)
}

=======
结果：
count: 100

```

```go
// Store函数用于设置一个指针型的变量的值。
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0
    atomic.StoreInt32(&count, 100)
    fmt.Println("count:", count)
}

=======
结果：
count: 100
```

```go
// Swap函数用于交换一个指针型的变量的值，并返回旧值。
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0
    old := atomic.SwapInt32(&count, 100)
    fmt.Println("old:", old)
    fmt.Println("count:", count)
}

=======
结果：
old: 0
count: 100

```


使用atomic包的原子操作时，需要保证对共享变量的操作都是原子性的。如果在原子操作之外对共享变量进行了操作，就可能会导致竞态条件的发生。

## 疑问

1. 为什么原子操作只能是AddInt32或者AddInt64，而没有AddInt16和AddInt128呢？
    在大多数平台上，CPU并不支持原子操作16位整数。在这些平台上，对16位整数进行原子操作需要使用32位整数或64位整数来实现。因此，在Go语言的atomic包中，没有提供AddInt16函数
2. 为什么CPU并不支持原子操作16位整数？
  在早期的CPU架构中，16位整数并不是主流的数据类型，因此CPU并没有专门为16位整数提供原子操作的支持。相反，CPU更加关注32位整数和64位整数的原子操作，因为这些数据类型更加常见和重要。

  此外，原子操作需要保证多个CPU同时访问同一内存地址时的正确性，因此需要使用锁机制来实现。锁机制会增加CPU的开销和复杂度，因此CPU需要权衡性能和功能的考虑。在这种情况下，CPU更倾向于支持更常见和重要的数据类型，而不是支持所有可能的数据类型。
3. 使用原子操作，如何保证业务逻辑正确性？
  使用原子操作可以保证多个线程或进程同时访问同一内存地址时的正确性，但并不能保证业务逻辑的正确性。因此，在使用原子操作时，需要注意以下几点，以确保业务逻辑的正确性：
- 原子操作的粒度：原子操作应该尽可能小，只包含必要的操作。如果原子操作的粒度过大，可能会导致锁的竞争过于激烈，从而影响程序的性能
- 原子操作的错误处理：原子操作应该正确处理错误情况。如果原子操作的错误处理不正确，可能会导致数据的不一致性
4. 如何保证原子操作成功？
  对原子操作返回的结果进行判断处理，至少需要有失败重试机制

原子操作，只能保证操作的原子性，但是不能保证操作一定成功。