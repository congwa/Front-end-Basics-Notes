# Promise

## Promise实现

* 1. 是个构造函数
* 2. 传入一个可执行函数 函数的入参第一个为 fulFill函数 第二个为 reject函数；  函数立即执行，  参数函数异步执行
* 3. 状态一旦更改就不可以变更  只能 pending => fulfilled 或者  pending => rejected
* 4. then 的时候要处理入参的情况 successCallback 和failCallback 均可能为非函数
* 默认的 failCallback 一定要将异常抛出， 这样下一个promise便可将其捕获 异常冒泡的目的
* 5. then 中执行回调的时候要捕获异常 将其传给下一个promise
* 如果promise状态未变更 则将回调方法添加到对应队列中
* 如果promise状态已经变更 需要异步处理成功或者失败回调
* 因为可能出现 回调结果和当前then返回的Promise一致 从而导致死循环问题
* 6. catch只是then的一种特殊的写法 方便理解和使用
* 7. finally 特点 1. 不管resolve或者reject都会执行
* 2. 回调没有参数
* 3. 返回一个Promise 且值可以穿透到下一个then或者catch
* 8. Promise.resolve, Promise.reject 根据其参数返回对应的值 或者状态的Promise即可
* 9. Promise.all 特点  1. 返回一个Promise
* 2. 入参是数组 resolve的情况下出参也是数组 且结果顺序和调用顺序一致
* 3. 所有的值或者promise都完成才能resolve 
* 4. 只要有一个为reject 返回的Promise便reject
* 10. Promise.race 特点 1. 返回一个Promise
* 2. 入参是数组 那么出参根据第一个成功或者失败的参数来确定
* 3. 只要有一个resolve 或者reject 便更改返回Promise的状态

promise就是一个类 在执行这个类的时候 需要传递一个执行器进去 执行器会立即执行
promise 中有三种状态 分别是 成功 fulfilled 失败 rejected 等待 pending
● pending -> fulfilled
● pending -> rejected
● 一旦状态确定就不可更改
resolve和reject函数是用来更改状态的
● resolve:fulfilled
● reject:rejected

```javascript
  // 初始状态
  const PENDING = "pending";
  // 完成状态
  const FULFILLED = "fulfilled";
  // 失败状态
  const REJECTED = "rejected";

  class MyPromise {
    status = PENDING;
    value = undefined;
    reason = undefined;
    successCallbacks = [];
    failCallbacks = [];

    constructor(exc) {
      exc(this.resolve, this.reject)
    }

    // Promise.resolve, Promise.reject 根据其参数返回对应的值 或者状态的Promise即可
    resolve(value) {
      // 如果状态已经完成则直接返回
      if(this.status !== PENDING) {
        return
      }
      this.value = value;
      this.status = FULFILLED;
      // 执行所有成功回调
      while(this.successCallbacks.length) this.successCallbacks.shift()()
    }

    // Promise.resolve, Promise.reject 根据其参数返回对应的值 或者状态的Promise即可
    reject(reason) {
      if(this.status !== PENDING) {
        return
      }
      this.reason = reason;
      this.status = REJECTED;
      if(!this.failCallbacks.length){
        throw '(in MyPromise)'
      }
      while(this.failCallbacks.length) this.failCallbacks.shift()()
    }
    
    // then 函数就是传入一个成功回调和失败回调， 判断当前的状态，如果成功执行成功的回调，如果失败执行失败的回调，如果等待中，把两个参数分别传入成功的回到数组和失败的回调数组
    then(successCallback, failCallback) {
      
       successCallback =
      typeof successCallback == "function" ? successCallback : (v) => v;
      // 失败函数处理 忽略函数之外的其他值 抛出异常  实现catch冒泡的关键
      failCallback = typeof failCallback == "function"
          ? failCallback
          : (reason) => {
              throw reason;
            };

      
      let promise = new MyPromise((resolve, reject) => {
          const execFun = (fn, val) => {
              try {
                fn(val);
              } catch (e) {
                reject(e);
              }
            };
            // 执行成功回调
            const execSuccessCallback = () => execFun(successCallback, this.value);
            // 执行失败回调
            const execFailCallback = () => execFun(failCallback, this.reason);
            if(this.status == PENDING) {
              this.successCallbacks.push(successCallback)
              this.failCallback.push(failCallback)
            }
            // 同步将对应成功或者失败回调事件加入对应回调队列
            asyncExecFun(() => {
              // 如果已经 fulfilled 可直接调用成功回调方法
              if (this.status === FULFILLED) {
                execSuccessCallback();
                // 如果已经 rejected 可直接调用失败回调方法
              } else if (this.status === REJECTED) {
                execFailCallback();
              }
            });
      })
      return promise
    }

    // all 传入一个数组，数组内可以都是promise对象，也可能是值，如果是值直接返回，如果是promise对象执行执行then方法，如果失败一个调用reject，全部成功后调用resove
    all(array) {
      let index = 0;
      let result = [];
      
      return new MyPromise((resolve, reject) =>  {
        const addData = function(i, value) {
          index ++;
          result[i] = value
          // 全部成功
          if(result.length === array.length) {
            resolve(result)
          }
        }
        for(let i = 0; i < array.length; i++) {
          if(array[i] instanceof MyPromise) {
            return array[i].then((value) => {
              addData(i, value)
              // 失败直接调用reject退出
            }, (reason) => reject(reason))
          } else {
            // 如果不是promise 对象
            addData(i,array[i])
          }
        }
      })
    }

    // 本质上往failCallbacks数组中添加一个失败回调
    catch(callback) {
      return this.then(undefined, callback)
    }
    // 传入一个数组，只要有一个成功或者失败就返回
    race(array) {
      return new Promise((resolve, reject) => {
        for(let i = 0; i < array.length) {
          if(array[i] instanceof MyPromise) {
            array[i].then((value) => {
              resolve(value)
            },
            (reason) => reject(reason)
            )
          } else {
            resolve(array[i])
          }
        }
      })
    }
    /**
     * 无论promise对象最终是成功还是失败，finally方法的回调函数始终会被执行一次。
     * 可以链式调用then,可以拿到当前这个promise对象返回的结果。
     * finally 方法回调函数中 return 可以返回 Promise对象，后续 then 方法的回调函数应该等待这个 Promise 执行完才能继续进行
     */
    finally(callback) {
      return this.then(
      value => this.resolve(callback()).then(() => value),
      reason => this.reject(callback()).then(() => throw reason))
    }
  }
```