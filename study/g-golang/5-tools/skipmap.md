# 跳表（map）


[跳表的实现- https://github1s.com/songzhibin97/gkit/blob/master/structure/skipmap/skipmap.go](https://github1s.com/songzhibin97/gkit/blob/master/structure/skipmap/skipmap.go)
[跳表的实现论文- https://people.csail.mit.edu/shanir/publications/LazySkipList.pdf](https://people.csail.mit.edu/shanir/publications/LazySkipList.pdf)


## 特点

- 元素始终保持有序,同时它的读取和遍历操作是无锁的(wait-free)
- 提供**并发安全**的 API,并具有高性能



## 使用场景

- 优先队列:
    跳表可以用于实现一个高效的优先队列数据结构。
    在需要频繁的入队、出队、查找最小元素等操作的场景中,跳表是一个很好的选择,如任务调度系统。
- 游戏排行榜:
    跳表可以用于实现高性能的游戏排行榜系统。
    跳表支持快速的查找、插入和删除操作,非常适合管理大规模的玩家分数数据
- 缓存系统
    在缓存系统中,跳表可以作为底层的数据结构,支持快速的键值对查找和管理。
    Redis 等缓存系统中广泛使用跳表来实现有序集合(Sorted Set)功能。
