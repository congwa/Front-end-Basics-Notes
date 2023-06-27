# rxgo 异步编程

ReactiveX，简称为 Rx，是一个异步编程的 API。

与 callback（回调）、promise（JS 提供这种方式）和 deferred（Python 的 twisted 网络编程库就是使用这种方式）这些异步编程方式有所不同，Rx 是基于事件流的。

这里的事件可以是系统中产生或变化的任何东西，在代码中我们一般用对象表示。

事件流需要被 Observer（观察者）处理才有意义。想象一下，我们日常作为一个 Observer，一个重要的工作就是观察 BUG 的事件流。每次发现一个 BUG，我们都需要去解决它。
