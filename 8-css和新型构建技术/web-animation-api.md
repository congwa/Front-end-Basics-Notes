# web animation api

## web animation api 两个核心的对象

1. KeyFrameEffect  描述动画属性
2. Animation 控制播放

### （1）. KeyFrameEffect

描述动画属性的集合，调用`keyframes`及 [Animation Effect Timing Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function)。 然后可以使用 `Animation` 构造函数进行播放。

有三种构建方式，分别是:

```js
new KeyframeEffect(target, keyframes);
new KeyframeEffect(target, keyframes, options)
new KeyframeEffect(source)
```

当然我们可以显示的去创建 `KeyframeEffect`, 然后交付给`Animation`去播放。 但是我们通常不需要这么做， 有更加简单的API， 这就是接后面要说的[`Element.animate`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)。

```js
// new KeyframeEffect(kyEffect)基于当前复制，然后多处使用
const box1ItemEl = document.querySelector(".box1");
const box2ItemEl = document.querySelector(".box2");

const kyEffect = new KeyframeEffect(null, {
    transform: ['translateX(0)', 'translateX(200px)']
},
{ duration: 3000, fill: 'forwards' })

const ky1 = new KeyframeEffect(kyEffect);
ky1.target = box1ItemEl;

const ky2 = new KeyframeEffect(kyEffect);
ky2.target = box2ItemEl;

new Animation(ky1).play();
new Animation(ky2).play();

```


### （2）. Animation

提供播放控制、动画节点或源的时间轴。 可以接受使用 [`KeyframeEffect`](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect) 构造函数创建的对象作为参数

```js
const box1ItemEl = document.querySelector(".box1");

const kyEffect = new KeyframeEffect(box1ItemEl, {
    transform: ['translateX(0)', 'translateX(200px)']
},
{ duration: 3000, fill: 'forwards' })

const ani1 = new Animation(kyEffect);
ani1.play();

```

常用的方法
- `cancel()` 取消
- `pause()`  暂停
- `play()`  播放
- `finish()` 完成
- `reverse()` 逆转方向播放


#### Animation 事件监听

监听有两种形势

1. event 方式 因其继承于EventTarget，所有依旧有两种形式
   
    ```js
        animation.onfinish = function() {
          element.remove();
        }

        animation.addEventListener("finish", function() {
          element.remove();
        }
      

      ```

2. Promise形式
   
   ```js
    animation.finished.then(() =>
      element.remove()
    )

    // 所有动画完成后
    Promise.all( element.getAnimations().map(ani => ani.finished)
      ).then(function() {           
          // do something cool 
      })

   ```

常用的事件回调

- `oncancel` 取消
- `onfinish` 完成
- `onremove` 删除

#### 便捷的 [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)

任何 `Element` 都具备该方法，语法：

```js
animate(keyframes, options)
```

其参数和 `new KeyframeEffect(target, keyframes, options)`的后两个参数基本一样， 返回的是一个`Animation`对象。

##### params-1. keyframes

`keyframes`的参数有两种形式，数组和对象

1. 数组形式
   一组对象(关键帧)，由要迭代的属性和值组成

   关键帧的偏移可以通过提供一个offset来指定 ，值必须是在 [0.0, 1.0] 这个区间内，且须升序排列。简单理解就是进度的百分比的小数值。

   ```js
    element.animate([ { opacity: 1 },
                  { opacity: 0.1, offset: 0.7 },
                  { opacity: 0 } ],
                2000);

   ```

   并非所有的关键帧都需要设置offset。 没有指定offset的关键帧将与相邻的关键帧均匀间隔。
2. 对象形式
  一个包含key-value键值的`对象`需要包含动画的属性和要循环变化的值`数组`

  ```js
    element.animate({
      opacity: [ 0, 0.9, 1 ],
      offset: [ 0, 0.8 ], // [ 0, 0.8, 1 ] 的简写
      easing: [ 'ease-in', 'ease-out' ],
    }, 2000);

  ```


##### params-2. options

和`new KeyframeEffect(target, keyframes, options)`的第三个参数基本一样，但是多了一个可选属性，就是id，用来标记动画，也方便在 [`Element.getAnimations`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations) 结果中精确的查找



| 参数名          | 含义                                               | 默认值 |
| --------------- | -------------------------------------------------- | ------ |
| delay           | 延迟动画开始的毫秒数                               | 0      |
| direction       | 动画运动方向                                       |        |
| duration        | 动画每次迭代完成所需的毫秒数                       | 0      |
| easing          | 动画曲线函数                                       |        |
| endDelay        | 动画结束后要延迟的毫秒数                           | 0      |
| fill            | 动画结束后属性值的状态                             |        |
| iterationStart  | 描述动画应该在迭代的什么时候开始                   | 0.0    |
| iterations      | 动画应该重复的次数                                 | 1      |
| composite       | 动画和其他单独的动画之间组合方式                   | replace   |
| iterationComposite | 动画的属性值变化如何在每次动画迭代时累积或相互覆盖 |        |

更多的细节查看文档[`KeyframeEffect`](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect)


##### Element.getAnimations

我们通过Element.animate或者创建Animation给Element添加很多动画，通过这个方法可以获得所有Animation的实例。

**在需要批量修改参数，或者批量停止动画的时候，那可是大杀器。**

比如批量暂停动画：

```js
  box1ItemEl.getAnimations()
    .forEach(el=> el.pause()) // 暂停全部动画

```


## 对比css Animation

![animation vs animation api](/study/imgs/animation-vs-animationApi.png)

- duration 参数只支持毫秒
- 迭代次数无限使用的是 JS的Infinity，不是字符串 "infinite"
- 默认动画的贝塞尔是linear，而不是css的ease


## 兼容性

整体还不错，Safari偏差

如果不能兼容，加个垫片[web-animations-js](https://github.com/web-animations/web-animations-js)