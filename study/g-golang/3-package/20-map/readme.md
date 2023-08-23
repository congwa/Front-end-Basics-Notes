# map

```go
map[K]V
```

key 类型的 K 必须是可比较的（comparable），也就是可以通过 == 和 != 操作符进行比较；value 的值和类型无所谓，可以是任意的类型，或者为 nil。

Go 语言中，bool、整数、浮点数、复数、字符串、指针、Channel、接口都是可比较的，包含可比较元素的 struct 和数组，这俩也是可比较的，而 slice、map、函数值都是不可比较的。


上面这些可比较的数据类型都可以作为 map 的 key 吗？显然不是。通常情况下，我们会选择内建的基本类型，比如整数、字符串做 key 的类型，因为这样最方便。


**如果使用 struct 类型做 key 其实是有坑的，因为如果 struct 的某个字段值修改了，查询 map 时无法获取它 add 进去的值**

如果要使用 struct 作为 key，我们要保证 struct 对象在逻辑上是不可变的，这样才会保证 map 的逻辑没有问题


**在 Go 中，map[key]函数返回结果可以是一个值，也可以是两个值**


**map 是无序的，所以当遍历一个 map 对象的时候，迭代的元素的顺序是不确定的**,无法保证两次遍历的顺序是一样的，也不能保证和插入的顺序一致。

如果我们想要按照 key 的顺序获取 map 的值，需要先取出所有的 key 进行排序，然后按照这个排序的 key 依次获取对应的值。而如果我们想要保证元素有序，比如按照元素插入的顺序进行遍历，可以使用辅助的数据结构，比如[orderedmap](https://github.com/elliotchance/orderedmap)，来记录插入顺序

## map要进行初始化

```go
func main() { 
  var m map[int]int 

  // 从一个 nil 的 map 对象中获取值不会 panic，而是会得到零值
  fmt.Println(m[100])
  // 对未初始化的 map 进行赋值会直接panic
  m[100] = 100

  // 解决办法就是初始化
  m := make(map[int]int)
}
```


## map不是并发安全的


如果没有注意到并发问题，程序在运行的时候就有可能出现并发读写导致的 panic

Go 内建的 map 对象不是线程（goroutine）安全的，**并发读写的时候运行时会有检查，遇到并发问题就会导致 panic**


```go
func main() {
    var m = make(map[int]int,10) // 初始化一个map
    go func() {
        for {
            m[1] = 1 //设置key
        }
    }()

    go func() {
        for {
            _ = m[2] //访问这个map
        }
    }()
    select {}
}

// 即便对map各自操作不同的元素，但是运行时检测到同时对 map 对象有并发访问，就会直接 panic
```


## 解决并发问题


### 1. 加读写锁：扩展 map，支持并发读写

```go
// 线程安全的 map[int][int]
type RWMap struct { // 一个读写锁保护的线程安全的map
    sync.RWMutex // 读写锁保护下面的map字段
    m map[int]int
}
// 新建一个RWMap
func NewRWMap(n int) *RWMap {
    return &RWMap{
        m: make(map[int]int, n),
    }
}
func (m *RWMap) Get(k int) (int, bool) { //从map中读取一个值
    m.RLock()
    defer m.RUnlock()
    v, existed := m.m[k] // 在锁的保护下从map中读取
    return v, existed
}

func (m *RWMap) Set(k int, v int) { // 设置一个键值对
    m.Lock()              // 锁保护
    defer m.Unlock()
    m.m[k] = v
}

func (m *RWMap) Delete(k int) { //删除一个键
    m.Lock()                   // 锁保护
    defer m.Unlock()
    delete(m.m, k)
}

func (m *RWMap) Len() int { // map的长度
    m.RLock()   // 锁保护
    defer m.RUnlock()
    return len(m.m)
}

func (m *RWMap) Each(f func(k, v int) bool) { // 遍历map
    m.RLock()             //遍历期间一直持有读锁
    defer m.RUnlock()

    for k, v := range m.m {
        if !f(k, v) {
            return
        }
    }
}

```


### 2. 分片加锁： 更高效的并发map

虽然使用读写锁可以提供线程安全的 map，但是在大量并发读写的情况下，锁的竞争会非常激烈

在并发编程中，我们的一条原则就是尽量减少锁的使用。一些单线程单进程的应用（比如 Redis 等），基本上不需要使用锁去解决并发线程访问的问题，所以可以取得很高的性能。但是对于 Go 开发的应用程序来说，并发是常用的一个特性，在这种情况下，我们能做的就是，**尽量减少锁的粒度和锁的持有时间**。

**减少锁的粒度常用的方法就是分片（Shard）**，将一把锁分成几把锁，每个锁控制一个分片。


Go 比较知名的分片并发 map 的实现是[orcaman/concurrent-map](https://github.com/orcaman/concurrent-map)

它默认采用 32 个分片，GetShard 是一个关键的方法，能够根据 key 计算出分片索引。

```go
// 分片加锁的伪代码

type Shard struct {
    data  map[string]interface{}
    mutex sync.Mutex
}
numShards := 10
shards := make([]Shard, numShards)

func getShardIndex(key string) int {
    // 使用哈希函数计算分片索引
    // ...
    return shardIndex
}

key := "example"
shardIndex := getShardIndex(key)

// 通过为每个分片分配独立的互斥锁，确保了每个分片都有自己独立的临界区。
// 在并发访问时，每个分片的互斥锁只会阻塞其他访问该分片的 goroutine，而不会影响其他分片的并发操作
shards[shardIndex].mutex.Lock()
defer shards[shardIndex].mutex.Unlock()

// 访问或修改分片数据
value := shards[shardIndex].data[key]
shards[shardIndex].data[key] = newValue

```

### 3. 官方包，应对特殊场景的 sync.Map

Go 1.9 中增加了一个线程安全的 map，也就是 sync.Map。

我们一定要记住，**这个 sync.Map 并不是用来替换内建的 map 类型的，它只能被应用在一些特殊的场景里**。

> 大部分的场景用不到并发安全的map，而且使用锁会影响性能。所以内建的map没有提供并发安全的能力。

特殊场景是什么？ [官方文档](https://pkg.go.dev/sync#Map)，指出了以下场景，，在以下两个场景中使用 `sync.Map`，会比使用 `map+RWMutex` 的方式，性能要好得多

1. 只会增长的缓存系统中，一个 key 只写入一次而被读很多次；
2. 多个 goroutine 为不相交的键集读、写和重写键值对。


所以，我们可以把 `sync.Map` 看成一个生产环境中很少使用的同步原语

#### sync.Map的实现


- 空间换时间。通过冗余的两个数据结构（只读的 read 字段、可写的 dirty），来减少加锁对性能的影响。对只读字段（read）的操作不需要加锁
- 优先从 read 字段读取、更新、删除，因为对 read 字段的读取不需要锁。
- 动态调整。miss 次数多了之后，将 dirty 数据提升为 read，避免总是从 dirty 中加锁读取。
- double-checking。加锁之后先还要再检查 read 字段，确定真的不存在才操作 dirty 字段。
- 延迟删除。删除一个键值只是打标记，只有在提升 dirty 字段为 read 字段的时候才清理删除的数据。

**没有 Len 这样查询 sync.Map 的包含项目数量的方法，并且官方也不准备提供。如果你想得到 sync.Map 的项目数量的话，你可能不得不通过 Range 逐个计数**

TODO: sync.Map的实现



## 其它的map实现

- [timedmap](https://github.com/zekroTJA/timedmap)- 带有过期功能
- [treemap](https://pkg.go.dev/github.com/emirpasic/gods/maps/treemap) - 使用红黑树实现的 key 有序的