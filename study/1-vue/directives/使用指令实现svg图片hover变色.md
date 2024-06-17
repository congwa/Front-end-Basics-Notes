# 使用指令实现svg图片hover变色

```js

/**
  <div v-color>
    <svg>
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
    </svg>
  </div>
 */
const color = {
 beforeMount(el: any) {
  const wrapDom = el;
  const svg = el.querySelector("svg");
  wrapDom.onmouseenter = function () {
   svg.style.fill = "rgb(0, 101, 179)";
  };
  wrapDom.onmouseleave = function () {
   svg.style.fill = "#C7CBCF";
  };
 }
};
// 挂载，注册
const directives = {
 install: function (app: any) {
  app.directive("color", color);
 }
};
export default directives;
```

传递颜色参数

```js
/**
 <div v-color="blue">
    <svg>
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="gary" />
    </svg>
  </div>
 */
// 拖拽的指令
const color = {
 beforeMount(el: any, binding: any) {
    // binding可以获取到指令的一些列数据，valu属性是绑定的参数
  const wrapDom = el;
  const svg = el.querySelector("svg");
    // 储存svg原本的颜色
    const originColor = svg.style.fill
  wrapDom.onmouseenter = function () {
   svg.style.fill = binding.value;
  };
  wrapDom.onmouseleave = function () {
   svg.style.fill = originColor;
  };
 }
};
// 挂载，注册
const directives = {
 install: function (app: any) {
  app.directive("color", color);
 }
};
export default directives;

```

加载不同的svg以应对不仅仅改变颜色情况

```js
// <div v-color="[home,hoverHome]"></div>
const color = {
 beforeMount(el: any, binding: any) {
    const svg = binding.value[0];
  const hoverSvg = binding.value[1];
  el.onmouseenter = function () {
   el.innerHTML = hoverSvg
  };
  el.onmouseleave = function () {
   el.innerHTML = svg
  };
 }
};
// 挂载，注册
const directives = {
 install: function (app: any) {
  app.directive("color", color);
 }
};
export default directives;


```
