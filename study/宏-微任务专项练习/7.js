var promise = new Promise(resolve=>{
	console.log(1)
	resolve()
})
setTimeout(()=>{
	console.log(2)
})
promise.then(()=>{
	console.log(3)
})
var promise2 = getPromise()
async function getPromise(){
	console.log(5)
	await promise
	console.log(6)
} 
console.log(8)
