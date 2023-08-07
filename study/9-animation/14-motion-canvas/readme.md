# motion canvas

## 和常规canvas游戏引擎对比
motion-canvas和eva.js pixiJS cocosJS这种互动引擎的对比
- 更强调动画，暂时没有办法对canvas内的node节点进行 点击事件 等事件的监听，如需要监听需要在canvas之外的上册添加分层dom来做，然后对motion-canvas的node节点进行响应操控
- 对程序员的友好的交互，motion-canvas/core和motion-canvas/2d库配合，结合ts的jsx天然支持，可以使布局标签化。
- 更加人性化的动画编辑， 一方面官方集成了一个editor可以对动画实时预览，对时间线注册event来操控，另一方面使用生成器天然的支持timeline的动画。

## 官方库说明

- motion-canvas/core 核心渲染包
- motion-canvas/2d 2d渲染支持的组件包
- motion-canvas/ui 使用preset写的驱动editor的包、可以实时的预览，注册event的操控，render出序列帧动画、视频等功能
- motion-canvas/player 使用customElements自定义了组件`<motion-canvas-player>`播放project
- motion-canvas/vite-plugin 
  - 集成了 motion-canvas/ui 的editor
  - 在vite的插件参数上传入project的能力，以方便editor的驱动
  - 使用vite内置esbuild兼容motion-canvas/2d的jsx语法
  

## 使用

### 1. 生成project

- @motion-canvas/core的makeProject方法，可传入多scene
  - **生成scene**,通过@motion-canvas/2d包makeScene2D方法的返回值， 同样也可以使用new Scene的方式
  
### 2. 使用project

在@motion-canvas/core包app模块里面的stage上面有finalBuffer属性，正好是canvas的dom，进行挂载到dom上面就可以，这里在官方有一个[示例](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L82)

用project 初始化 player 就可以

## 疑问

1. 为什么可以支持jsx
  [es-build jsx支持](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/vite-plugin/src/main.ts#L467), 在vite-plugin中对jsx进行了天然的支持配置，使用了vite内置的esbuild进行编译

2. stage和player之间的关系

  stage和player同时都能设置config[配置](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L256),player要渲染在stage上面，[stage.render(player)](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L244)

3. player和project的关系
  初始化player的时候可以传入project作为构造参数

4. 如何定制类似于@motion-canvas/2d的组件
  这个功能在[官方文档上有详细的说明](https://motioncanvas.io/docs/custom-components)


## 总结

motion-canvas大致生产流程就是@motion-canvas/2d提供的官方组件或者由motion-canvas/core提供的api自定义一些组件

通过code any editor --产出--> scene --传入--> project --传入--> player --传入--> stage
   
scene由

## 参考资料

[motion-canvas](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/2d/package.json)