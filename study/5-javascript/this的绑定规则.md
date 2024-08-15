# this的绑定规则

## 1. 默认绑定

- 默认绑定：当一个函数独立调用，不带任何修饰符的时候
- 函数在哪个词法作用域下生效，函数中的this就指向哪里
  
```js
function foo(){//foo独立调用
    console.log(this);//this指代window（全局）
}
foo();

function foo(){//foo独立调用
    console.log(this);//this指代window（全局）
}
function bar(){
    foo()
}
function baz(){
    bar()
}
baz()

// 函数foo，bar，baz，的词法作用域都是全局，所以，这里的this，还是指代window（全局）

```

只要是默认绑定，this一定指向windows

## 2. 隐式绑定

- 隐式绑定: 当函数的引用有上下文对象时(当函数被某个对象所拥有时)
- 函数的this指向引用它的对象

```js
var obj = {
    a:1,
    foo:foo//引用foo
}
function foo(){
    console.log(this.a)//1
}
obj.foo()

// 函数foo在对象obj中引用，那对象obj是函数foo的‘老大’
```

隐式丢失：当一个函数被多个对象链式引用时，函数的this指向就近的那个对象

## 3. 显式绑定

用显式绑定方法实现使函数foo中的this指向对象obj

```js
var obj = {
    a:1
}
function foo(){
    console.log(this.a)//1
}
foo.call(obj)

// 利用call（）方法,强行将foo的this指向对象obj
```

## 4. new绑定

- new绑定：this指向创建出来的实例对象


```js
function Person(){
    this.name = 'midsummer'
}
let p = new Person()//实例对象
```

## 箭头函数

this写在全局和函数体内,（箭头函数）不承认this,没有this这个概念，但可以有this
写在箭头函数中的this是它外层非箭头函数的this

```js
var obj  = {
    a: 1,
    b: function(){
        const fn =() =>{
            console.log(this.a);
        }
        fn()
    }
}
obj.b() // 1

```


