console.log("start");

setTimeout(() => {
  console.log("setTimeout");
}, 0);

new Promise((resolve, reject) => {
  for (var i = 0; i < 5; i++) {
    console.log(i);
  }
  resolve() //修改promise状态为成功
}).then(() => {
  console.log("promise回调函数");
})

console.log("end");

// start
// 01234
// end
// promise回调函数
// setTimeout