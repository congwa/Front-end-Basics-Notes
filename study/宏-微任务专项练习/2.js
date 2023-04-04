// 第二天 https://blog.csdn.net/xiaoxiaotututu/article/details/118885414

function testSometing() {
  console.log("执行testSometing");
  return "testSometing";
}

async function testAsync() {
  console.log("执行testAsync");
  return Promise.resolve("hello async");
}

async function test() {
  console.log("test start...");
  const v1 = await testSometing();//关键点1 微1
  console.log(v1);
  const v2 = await testAsync(); // 微3
  console.log(v2);
  console.log(v1, v2);
}

test();

var promise = new Promise((resolve) => {
  console.log("promise start..");
  resolve("promise");
});//关键点2
promise.then((val) => console.log(val)); // 微2

console.log("test end...")

// test start...
// 执行testSometing
// promise start..
// test end...
// testSometing
// 执行testAsync
// promise
// hello async
// testSometing hello async