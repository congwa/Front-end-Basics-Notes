// 第三天

async function async1() {
  console.log('2 async1 start');
  await async2(); // await 后面的代码相当于then()的回调函数
  console.log('6 async1 end')
}
async function async2() {
  console.log('3 async2')
}
console.log('1 script start');
setTimeout(function () {
  console.log('8 setTimeout')
}, 0);
async1();
new Promise(function (resolve) {
  console.log('4 promise1');
  resolve()
}).then(function () {
  console.log('7 promise2')
});
console.log('5 script end')

// 1 script start
// 2 async1 start
// 3 async2
// 4 promise1
// 5 script end
// 6 async1 end
// 7 promise2
// 8 setTimeout

/**
 * 分析：
 * 1. 当前事件循环
 * 2. 进入async1执行 
 * 3. 执行async2，改变promise的状态，压入微任务
 * 4. 进入promise
 * 5. 执行最后一句话
 * 6. 执行微任务第一个
 * 7. 执行微任务第二个
 * 8. 进入下一个事件循环
 * 
 */