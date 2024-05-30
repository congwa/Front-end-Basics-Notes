// 生成器

// 生成器是ES6新增的一种可以对函数控制的方案，能灵活的控制函数的暂停执行，继续执行等

/**
 * 生成器函数和普通函数的不同
 * 定义: 普通函数function定义，生成器函数function*，要在后面加*
 * 生成器函数可以通过 yield 来控制函数的执行
 * 生成器函数返回一个生成器(generator)，生成器是一个特殊的迭代器
 *
 */

function* bar() {
  console.log("fn run");
}

const generator = bar();

console.log(generator.next());

//fn run
//{ value: undefined, done: true }

function* bar1() {
  console.log("fn run start");
  yield 100;
  console.log("fn run...");
  yield 200;
  console.log("fn run end");
  return 300;
}
const generator1 = bar1();

//1. 执行到第一个yield，暂停之后，并且把yield的返回值 传入到value中
console.log(generator1.next());
//2. 执行到第一个yield，暂停之后，并且把yield的返回值 传入到value中
console.log(generator1.next());
//3. 执行剩余代码
console.log(generator1.next());

console.log(generator1.next());
console.log(generator1.next());

function* bar2(nickName) {
  const str1 = yield nickName;
  const str2 = yield str1 + nickName;

  return str2 + str1 + nickName;
}

const generator2 = bar2("ice");

console.log(generator2.next());
console.log(generator2.next("panda "));
console.log(generator2.next("grizzly "));
console.log(generator2.next());

console.log("\n");

// 生成器代替迭代器

// 生成器是一个特殊的迭代器，那生成器必定是可以代替迭代器对象的

let bears = ["ice", "panda", "grizzly"];

function* createArrIterator(bears) {
  for (let bear of bears) {
    yield bear;
  }
}

const generator3 = createArrIterator(bears);

console.log(generator3.next());
console.log(generator3.next());
console.log(generator3.next());
console.log(generator3.next(), "\n");

// 其实这里还有一种语法糖的写法yield*
//  yield* 依次迭代这个可迭代对象，相当于遍历拿出每一项 yield item(伪代码)

function* createArrIterator(bears) {
  yield* bears;
}

const generator4 = createArrIterator(bears);

console.log(generator4.next());
console.log(generator4.next());
console.log(generator4.next());
console.log(generator4.next(), '\n');

// 可迭代对象的终极封装

class myInfo {
  constructor(name, age, friends) {
    this.name = name;
    this.age = age;
    this.friends = friends;
  }

  *[Symbol.iterator]() {
    yield* this.friends;
  }
}

const info = new myInfo("ice", 22, ["panda", "grizzly"]);

for (let bear of info) {
  console.log(bear);
}
