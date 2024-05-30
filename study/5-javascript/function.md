# function

1. compose  组合函数
    > 我们可以把函数想象为处理数据的管道，我们输入一个数据就会得到一个结果。而函数组合可以把多个一元函数组合成一个功能强大的函数。

    ```javascript
        const compose = (...argus) => value => argus.reduceRight((acc,func) => func(acc), value)

    ```

2. pipe 管道函数

    ```javascript
        const pipe = (...argus) => value => argus.reduce((acc,func) => func(acc), value)

    ```

3. 柯里化
    > 函数多个参数时，只传递部分参数，让函数返回新的函数，新的函数接收剩余参数，并返回结果

    ```javascript  
        const curry = (fn) => {
            const curriedFunc = (...argus) => {
                // fn.length 获取传入函数的参数的长度
                if(argus.length < fn.length) {
                    return (...argus2) => {
                        return curriedFunc(...argus, ...argus2)
                    }
                } else {
                    return fn(...argus)
                }
            }
            return curriedFunc
        }

        const add = (x, y) => x + y
        const _add = curry(add)
        _add(4)(5)
    ```

4. 
