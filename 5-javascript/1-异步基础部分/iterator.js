
/**
 * 
 * JS中的迭代器
 * 其本质就是一个对象，符合迭代器协议（iterator protocol）
 * 
 * 迭代器协议
 * 
 * 1. 其对象返回一个next函数
 * 2. 调用next函数返回一个对象，其对象中包含两个属性
 *    done(完成)，它的值为布尔类型，也就是true/false
 *          如果这个迭代器没有迭代完成即返回{done:false}
 *          当这个迭代器完成了即返回{done:true}
 * 
 *    value(值)，它可以返回js中的任何值，TS中表示可为:value:any类型
 */

let index = 0
const bears = ['ice', 'panda', 'grizzly']

let iterator = {
    next() {
        if( index < bears.length) {
            return {done: false, value: bears[index++]}
        }
        return {done: true, value: undefined}
    }
}

console.log(iterator.next()) //{ done: false, value: 'ice' }
console.log(iterator.next()) //{ done: false, value: 'panda' }
console.log(iterator.next()) //{ done: false, value: 'grizzly' }
console.log(iterator.next()) //{ done: true, value: undefined }

// iterator 是一个对象，实现了next方法，next方法返回了一个对象，有done属性和value属性，且key的值类型也为boolean或any，符合迭代器协议，是一个妥妥的迭代器没跑了



/**
 *  迭代器的封装实现
 * 
 * 
 */


function createArrIterator(arr) {
  let index = 0

  let _iterator = {
    next() {
      if (index < arr.length) {
        return { done: false, value: arr[index++] }
      }

      return { done: true, value: undefined }
    }
  }

  return _iterator
}

let iter = createArrIterator(bears)

console.log(iter.next())
console.log(iter.next())
console.log(iter.next())
console.log(iter.next())

/**
 * 可迭代对象
 * 首先就是一个对象，且符合可迭代对象协议(iterable protocol)
 * 
 * 可迭代对象协议
 * 实现了[Symbol.iterator]为key的方法，且这个方法返回了一个迭代器对象
 * for of 的时候，其本质就是调用的这个函数，也就是[Symbol.iterator]为key的方法
 * 
 * 原生可迭代对象(JS内置)
 * String
 * Array
 * Set
 * Map
 * NodeList类数组对象
 * Arguments类数组对象
 */

let str = 'The Three Bears'

for( let text of str) {
  console.log(text) //字符串每个遍历打印
}

for( let bear of bears) {
  console.log(bear)
}

/**
 * 内置的[Symbol.iterator]方法
 */

const Symboliter = bears[Symbol.iterator]()
console.log(Symboliter.next())
console.log(Symboliter.next())
console.log(Symboliter.next())
console.log(Symboliter.next())

const nickName = 'ice'
//字符串的Symbol.iterator方法
const strIter = nickName[Symbol.iterator]()

console.log(strIter.next())
console.log(strIter.next())
console.log(strIter.next())
console.log(strIter.next())



/**
 * 可迭代对象的实现
 */

let info = {
    bears: ['ice', 'panda', 'grizzly'],
    [Symbol.iterator]: function() {
        let index = 0
        let _iterator = {
            next: () => {
                if(index < this.bears.length) {
                    return {done: false, value: this.bears[index++]}
                }
                return {done: true, value: undefined}
            }
        }
        return _iterator
    }
}

let iiter = info[Symbol.iterator]()
console.log(iiter.next())
console.log(iiter.next())
console.log(iiter.next())
console.log(iiter.next())

//符合可迭代对象协议 就可以利用 for of 遍历
for (let bear of info) {
    console.log(bear)
}

// 符合可迭代对象协议，是一个对象，有[Symbol.iterator]方法，并且这个方法返回了一个迭代器对象
// 当我利用for of 遍历，就会自动的调用这个方法


/**
 * 可迭代对象的应用
 * for of
 * 展开语法 [...x]
 * 解构语法 [x, y] = obj
 * promise.all(iterable)
 * promise.race(iterable)
 * Array.from(iterable)
 * 
 */

//  自定义类迭代实现

class myInfo {
    constructor(name, age, friends) {
        this.name = name
        this.age = age
        this.friends = friends
    }

    [Symbol.iterator]() {
        let index = 0

        let _iterator = {
            next: () => {
                const friends = this.friends
                if (index < friends.length) {

                    return {done: false, value: friends[index++]}
                }

                return {done: true, value: undefined}
            }
        }
        return _iterator
    }
}

const infoObject = new myInfo('ice', 22, ['panda','grizzly'])

for (let bear of infoObject) {
    console.log(bear)
}

//panda
//grizzly

class Foo {
    constructor(...args) {
        console.log(args, typeof args, Array.isArray(args), arguments, typeof arguments)
        this.args = args;
    }

    * [Symbol.iterator]() {
        for (let arg of this.args) {
            yield arg;
        }
    }
}
  
for (let x of new Foo('hello', 'world')) {
    console.log(x);
}
  // hello
  // world