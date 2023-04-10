async function async1() {
  console.log('async1 start');
  await async2();
  /*
		async2().then(res=>{
			setTimeout(function () {
			console.log('setTimeout1');
  }, 0);
		})
	*/
  setTimeout(function () {
    console.log('setTimeout1');
  }, 0);
}

async function async2() {
  setTimeout(function () {
    console.log('setTimeout2');
  }, 0);
}

console.log('script start');

setTimeout(function () {
  console.log('setTimeout3');
}, 0);

async1();

new Promise(function (resolve) {
  console.log('promise1');
  resolve();
}).then(function () {
  console.log('promise2');
});

console.log('script end');
