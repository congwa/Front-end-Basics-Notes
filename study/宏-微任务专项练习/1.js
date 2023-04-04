
// 第一天

setTimeout(() => {
  console.log(1)
}, 0)

// promise1
new Promise((resolve, reject) => {
  console.log(2)
  resolve('p1')

  // promise2
  new Promise((resolve, reject) => {
    console.log(3)
    setTimeout(() => {
      resolve('setTimeout2')
      console.log(4)
    }, 0)
    resolve('p2')
  }).then(data => {
    console.log(data)
  })

  setTimeout(() => {
    resolve('setTimeout1')
    console.log(5)
  }, 0)
}).then(data => {
  console.log(data)
})
console.log(6)


// 2 3 6 p2 p1  1 4 5

// 分析: promise2的then先入队,promise1执行完之后的then再入队，所以p2 优先 p1

// promise 已经有了执行结果,则后面的resolve和reject都不再执行（状态凝结）