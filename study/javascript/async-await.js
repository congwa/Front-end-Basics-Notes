// async内部代码同步执行

//异步函数的内部代码执行过程和普通的函数是一致的，默认情况下也是会被同步执行

async function sayHi() {
    console.log("hi ice");
}

sayHi();

//hi ice

// 异步函数的返回值

/**
 * 异步函数的返回值和普通返回值有所区别
 *
 *  普通函数: 主动返回什么就返回什么，不返回为undefined
 *
 *  异步函数:
 *          明确有返回一个普通值，相当于Promise.resolve(返回值)
 *          返回一个thenable对象则由，then方法中的resolve,或者reject有关
 *          明确返回一个promise，则由这个promise决定
 *
 *
 */

// 异步函数中可以使用await关键字，现在在全局也可以进行await，但是不推荐。会阻塞主进程的代码执行

async function sayHi() {
    console.log(res);
}
sayHi().catch((e) => console.log(e));

//或者

async function sayHi() {
    try {
        console.log(res);
    } catch (e) {
        console.log(e);
    }
}

sayHi();

//ReferenceError: res is not defined

// iceweb.io

//异步函数的异常处理
//如果函数内部中途发生错误，可以通过try catch的方式捕获异常
//如果函数内部中途发生错误，也可以通过函数的返回值.catch进行捕获

/**
 * await 关键字
 */

// 异步函数中可以使用await关键字，普通函数不行
/**
 * 通常await关键字后面都是跟一个Promise
 *  可以是普通值
 *  可以是thenable
 *  可以是Promise主动调用resolve或者reject
 * 
 *  这个promise状态变为fulfilled才会执行await后续的代码，所以await后面的代码，相当于包括在.then方法的回调中，如果状态变为rejected，你则需要在函数内部try catch，或者进行链式调用进行.catch操作
 */

function requestData(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url.includes("iceweb")) {
                resolve(url);
            } else {
                reject("请求错误");
            }
        }, 1000);
    });
}

async function getData() {
    const res = await requestData("iceweb.io");
    console.log(res);
}

getData();

// iceweb.io
