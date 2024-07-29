# lscq（Lightweight Scalable Concurrent Queue）高度可伸缩、无界限、支持多生产者和多消费者的并发安全的FIFO队列


- [实现 https://github1s.com/songzhibin97/gkit/blob/master/structure/lscq/lscq.go](https://github1s.com/songzhibin97/gkit/blob/master/structure/lscq/lscq.go)
- [论文A https://arxiv.org/abs/1908.04511](https://arxiv.org/abs/1908.04511)
- [论文B https://www.cs.tau.ac.il/~mad/publications/ppopp2013-x86queues.pdf](https://www.cs.tau.ac.il/~mad/publications/ppopp2013-x86queues.pdf)

## 特性

- LSCQ使用了一种基于Treiber栈的无锁队列结构,能够有效避免竞争条件。
- 支持多生产者和多消费者,能够充分利用多核处理器的并行计算能力。
- 无界限设计,可以存储无限数量的元素,不会因为队列大小受限而出现阻塞或丢失数据的问题。
- 内存高效,只需要分配一次内存,可以重复使用,不需要频繁的内存分配和释放

## 使用场景


- 在微服务架构中,各个服务之间需要频繁的消息传递和任务调度。LSCQ可以提供高并发、低延迟的队列支持,帮助提高整个系统的性能和可扩展性。
- 在分布式系统中,多个节点之间需要通过消息队列进行协调和数据交换。LSCQ的无界限设计和高性能特性,非常适合这类场景。
- 对于需要处理大量数据的应用,如日志处理、ETL(提取-转换-加载)等,LSCQ可以提供高效的队列支持,帮助应用程序快速处理海量数据。
- 在事件驱动的架构中,各个组件之间通过事件队列进行异步通信。LSCQ的高并发和可伸缩性,非常适合这类场景。
- 在一些游戏和实时应用中,需要处理大量的实时事件和消息。LSCQ的高性能特性,可以帮助这类应用程序更好地处理大量并发请求。
- 一些基于消息中间件的应用,如消息队列服务、RabbitMQ等,也可以考虑使用LSCQ作为其底层的队列实现,以提高整体的性能和可伸缩性。