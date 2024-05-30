// Promise

/**
 * 使用promise的时候，给它一个承诺，我们可以将他划分为三个阶段
 *
 * pending(待定)，执行了executor，状态还在等待中，没有被兑现，也没有被拒绝
 *
 * fulfilled(已兑现)，执行了resolve函数则代表了已兑现状态
 *
 * rejected(已拒绝)，执行了reject函数则代表了已拒绝状态
 *
 * 首先，状态只要从待定状态，变为其他状态，则状态不能再改变
 *
 */

// 状态一旦从待定状态改变，不可逆

const promise1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("失败");
        resolve("成功");
    }, 3000);
});

promise1.then((res) => console.log(res)).catch((err) => console.log(err, "\n"));

/**
 *  resolve不同值的区别
 */

//如果resolve传入一个普通的值或者对象，只能传递接受一个参数，那么这个值会作为then回调的参数

const promise2 = new Promise((resolve, reject) => {
    resolve({ name: "ice", age: 22 });
});

promise2.then((res) => console.log(res, "\n"));

// {name: 'ice', age: 22}

// 如果resolve中传入的是另外一个Promise，那么这个新Promise会决定原Promise的状态
const promise3 = new Promise((resolve, reject) => {
    resolve(
        new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve("ice");
            }, 3000);
        })
    );
});

promise3.then((res) => console.log(res, "\n"));

//3s后 ice

// 如果resolve中传入的是一个对象，并且这个对象有实现then方法，
//      那么会执行该then方法，then方法会传入resolve，reject函数。此时的promise状态取决于你调用了resolve，
//      还是reject函数。这种模式也称之为: thenable

const promise4 = new Promise((resolve, reject) => {
    resolve({
        then(res, rej) {
            res("hi ice");
        },
    });
});

promise4.then((res) => console.log(res));

// hi ice

/**
 * Promise的实例方法
 * 实例方法，存放在Promise.prototype上的方法，也就是Promise的显示原型上，当我new Promise的时候，会把返回的改对象的 promise[[prototype]]（隐式原型） === Promise.prototype (显示原型)。
 * 即new返回的对象的隐式原型指向了Promise的显示原型
 */

/**
 * then
 */
// then方法可以接受参数，一个参数为成功的回调，另一个参数为失败的回调
// then的多次调用

// 返回一个普通值 状态:fulfilled
const promise5 = new Promise((resolve, reject) => {
    resolve("hi ice");
});

promise5
    .then((res) => ({ name: "ice", age: 22 }))
    .then((res) => console.log(res));

//{name:'ice', age:22}

// 明确返回一个promise 状态:fulfilled
const promise6 = new Promise((resolve, reject) => {
    resolve("hi ice");
});

promise6
    .then((res) => {
        return new Promise((resolve, reject) => {
            resolve("then 的返回值");
        });
    })
    .then((res) => console.log(res));

// 回一个thenable对象 状态：fulfilled

const promise7 = new Promise((resolve, reject) => {
    resolve("hi ice");
});

promise7
    .then((res) => {
        return {
            then(resolve, reject) {
                resolve("hi webice");
            },
        };
    })
    .then((res) => console.log(res));
//返回了一个thenable对象，其状态取决于你是调用了resolve,还是reject

//hi webice

/**
 * catch的返回值
 */

//返回一个普通对象

//明确返回一个promise

// 返回thenable对象

/**
 * finally方法
 * finally(最后)，无论promise状态是fulfilled还是rejected都会执行一次finally方法
 */

/**
 *  Promise中的类方法/静态方法
 */
/**
 *
 * Promise.reslove
 */

/**
 *
 * Promise.reject
 */

/**
 * Promise.all
 */

//            Promise.all有一个缺陷，就是当遇到一个rejected的状态，那么对于后面是resolve或者reject的结果我们是拿不到的
// fulfilled 状态
//         all方法的参数传入为一个可迭代对象，返回一个promise，只有三个都为resolve状态的时候才会调
//         只要有一个promise的状态为rejected，则会回调.catch方法

// rejected状态
//          当遇到rejectd的时候，后续的promise结果我们是获取不到，并且会把reject的实参，传递给catch的err形参中

/**
 *  Promise.allSettled
 * 无论状态是fulfilled/rejected都会把参数返回给我们
 * 该方法会在所有的Promise都有结果，无论是fulfilled，还是rejected，才会有最终的结果
 */

const promiseallSettled1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("hi ice");
    }, 1000);
});

const promiseallSettled2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("hi panda");
    }, 2000);
});

const promiseallSettled3 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("hi grizzly");
    }, 3000);
});

Promise.allSettled([
    promiseallSettled1,
    promiseallSettled2,
    promiseallSettled3,
]).then((res) => console.log(res));

/* [
    { status: 'rejected', reason: 'hi ice' },
    { status: 'fulfilled', value: 'hi panda' },
    { status: 'rejected', reason: 'hi grizzly' }
  ] */

// 其中一个promise没有结果 则什么都结果都拿不到（同all）

const promisenNo1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("hi ice");
    }, 1000);
});

const promiseNo2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("hi panda");
    }, 2000);
});

const promiseNo3 = new Promise((resolve, reject) => {});

Promise.allSettled([promisenNo1, promiseNo2, promiseNo3]).then((res) =>
    console.log(res)
);
// 什么都不打印

/**
 * Promise.race(竞争竞赛)
 * 优先获取第一个返回的结果，无论结果是fulfilled还是rejectd
 */

const promiserace1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("hi error");
    }, 1000);
});

const promiserace2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("hi panda");
    }, 2000);
});

Promise.race([promiserace1, promiserace1])
    .then((res) => console.log(res))
    .catch((e) => console.log(e));

//hi error

/**
 * Promise.any
 * 与race类似，只获取第一个状态为fulfilled，如果全部为rejected则报错AggregateError
 */
const promiseany1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject("hi error");
    }, 1000);
});

const promiseany2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("hi panda");
    }, 2000);
});

Promise.any([promiseany1, promiseany2])
    .then((res) => console.log(res))
    .catch((e) => console.log(e));

//hi panda
