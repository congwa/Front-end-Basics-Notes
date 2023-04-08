// 第四天

async function async1() {
    console.log(1);
    const result = await async2();
    console.log(3);
}

async function async2() {
    console.log(2);
}

Promise.resolve().then(() => {
    console.log(4);
});

setTimeout(() => {
    console.log(5);
});

async1();
console.log(6);

/**
1. 首先遇到 async1 函数的调用，进入 async1 函数体，输出 1。
2. 调用 async2 函数，输出 2，但是由于 async2 函数没有返回 Promise 对象，所以并不会等待其执行完毕。
3. 继续执行同步代码，输出 6。
4. 到达 Promise.resolve().then()，此时创建一个微任务，并在当前事件循环的末尾执行，输出 4。
5. 直接执行 setTimeout 函数，创建一个宏任务，等待下一轮事件循环。
6. async1 函数全部执行完毕，输出 3。
7. 下一轮事件循环开始，执行 setTimeout 的回调函数，输出 5。
 */

// 126435

// async1() 注意下调用的时机

