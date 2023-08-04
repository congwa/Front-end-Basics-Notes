# jsx

## jsx的使用

TODO: JSX使用


[babel实现了jsx转化](https://github.com/babel/babel/blob/main/packages/babel-parser/src/plugins/jsx/index.ts)

同时 [typescript 天然的支持了 jsx的转化](https://github.com/microsoft/TypeScript/blob/main/src/compiler/transformers/jsx.ts)


## 利用babel把jsx代码输出成js代码 

这里使用React.createElement更能起到容易理解的作用，可以根据自己的情况换成其它的**函数字符串名字**

```js
javascript
const babel = require('@babel/core');
const t = require('@babel/types');

// 定义一个 AST 转换器 visitor
const visitor = {
  JSXElement(path) {
    const openingElement = path.node.openingElement;
    const closingElement = path.node.closingElement;
    const children = path.node.children;
    
    // 创建一个函数调用表达式节点：React.createElement(tagName, attributes, ...children)
    const createElementCall = t.callExpression(
      t.identifier('React.createElement'),
      [
        t.stringLiteral(openingElement.name.name), // 标签名作为字符串字面量
        openingElement.attributes.length > 0 ? buildAttributes(openingElement.attributes) : t.nullLiteral(), // 属性对象或者 null
        ...buildChildren(children) // 所有的子节点
      ]
    );

    // 替换 JSX 元素节点为函数调用表达式节点
    path.replaceWith(createElementCall);
  }
};

// 创建属性对象节点
function buildAttributes(attributes) {
  const props = [];

  for (const attribute of attributes) {
    if (t.isJSXAttribute(attribute)) {
      const name = attribute.name.name;
      const value = attribute.value;

      if (t.isJSXExpressionContainer(value)) {
        // 处理属性值为表达式的情况
        props.push(t.objectProperty(t.identifier(name), value.expression));
      } else {
        // 处理属性值为字符串字面量的情况
        props.push(t.objectProperty(t.identifier(name), t.stringLiteral(value.value)));
      }
    }
  }

  return t.objectExpression(props);
}

// 创建子节点数组
function buildChildren(children) {
  const result = [];

  for (const child of children) {
    if (t.isJSXText(child)) {
      // 处理文本节点
      result.push(t.stringLiteral(child.value.trim())); // 移除空格和换行符
    } else if (t.isJSXElement(child)) {
      // 处理嵌套的 JSX 元素
      result.push(child);
    }
    // 可以继续添加其他类型的子节点处理逻辑，如 JSXExpressionContainer、JSXFragment 等
  }

  return result;
}

// 要转换的 JSX 代码
const jsxCode = `
  <div className="container">
    <h1>Hello, world!</h1>
    <p>This is a JSX to JavaScript conversion example.</p>
  </div>
`;

// 使用 Babel 进行转换
const transformedCode = babel.transformSync(jsxCode, {
  plugins: [
    { visitor }
  ]
}).code;

console.log(transformedCode);
/**
console.log ---

React.createElement("div", { className: "container" },
    React.createElement("h1", null, "Hello, world!"),
    React.createElement("p", null, "This is a JSX to JavaScript conversion example.")
);
*/
```


## 参考资料

- [learn.microsoft-jsx](https://learn.microsoft.com/zh-cn/training/modules/react-get-started/2-javascript-xml?source=recommendations) -- 教程强绑定react 不是很推荐


- [featbook的jsx解释-https://facebook.github.io/jsx/](https://facebook.github.io/jsx/)

- [关于facebook对jsx解析后的ast的介绍](https://github.com/facebook/jsx/blob/main/AST.md)
- 
- [babel如何把ast转化成js代码的](https://www.cnblogs.com/goloving/p/14078228.html) - visitor的实现