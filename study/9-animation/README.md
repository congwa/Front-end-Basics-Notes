# animation

Some nice front-end animation breakdowns

## 查看
  
  ```js
    cd 11-Segmented-timeline-scroll
    npm install anywhere
    anywhere
  ```

### --

#### FLIP动画

flip动画分解

#### timeline

timeline时间线动画分解

#### timeline-scroll

滚动视差动画、滚动视差时间线动画

#### timeline frames animation

时间线配合帧动画 --  苹果官网动画高级感分解

#### timeline frames animation by gsap

通过gsap驱动帧动画、滚动视差帧动画

#### svg animation by gsap 

通过gsap驱动svg动画

- 描边动画- stroke
- 路径动画- path
- 变形动画- morphing 
- 闪烁动画- blink 
- 图案动画- pattern

#### video animation by scroll

通过滚动控制视频播放(感谢@zuoxiaobai大佬提供demo和指导)
> 通过滚动来改变视频的currentTime实现关联关系。
> 视频预加载可以使用 video.pause()来实现

#### Segmented timeline scroll animation by GSAP 

滚动式动画分段播放动画

#### In one shot by GSAP and PIXI (future)

通过gsap和pixi驱动的一镜到底动画

> 使用pixi绘制长图，根据滚动距离换算出当前整个动画轴的进度，使用gsap的timeline.seek(progress)设置当前动画进度就可以了.

<details><summary><b>总结</b></summary>

动画组成因素：

1. pixi绘制长图
2. 监听滚动距离，设置pixi.stage.position为滑动距离，达到镜头移动效果
3. 初始化timeline，设置多个动画，包含每个动画的起始时间，动画时长
4. timeline时间轴(gsap为时间单位)和滚动距离轴等比，使用map函数换算同一单位 -- map函数在 **5-Scroll-TimeLine**章节有具体实现和说明
5. 根据滚动距离计算当前timeline播放进度，使用timeline.seek(progress)设置当前动画进度

</details>

### grid mobile

[grid模拟手机app图标布局](/13-grid-mobile/)


### 14. motion-canvas

专注于绘制演示(播放)动画的canvas库，[在这里对其实现方式的源码进行分析、解析](./14-motion-canvas/)

- jsx渲染类(由canvas元素生成的类)的节点(非常新颖的方式)
- 复杂event时间事件，提供一个编辑器来代替代码书写的复杂性
- 提供timeline的flow的动画输入方式
- 导出视频、序列帧动画
- 内置多种动画效果，书写代码量少和理解简单的特点

### 15. display-animation

通过控制 display:none/block控制动画执行

我这里[写了一篇详细的文章来介绍这种方式](https://github.com/congwa/Front-end-Basics-Notes/blob/main/study/8-css%E5%92%8C%E6%96%B0%E5%9E%8B%E6%9E%84%E5%BB%BA%E6%8A%80%E6%9C%AF/display%3Anone%E4%B8%8Ecss%E5%8A%A8%E7%94%BB%E7%9A%84%E5%88%86%E6%9E%90.md)

我这里同样[实现了简单的示例](./15-display-animation/index.html)

结合vue中的`transition`动画的原理再，合并`FLIP`动画技术，提出的动画实现方案

### 16. web-animation-api 有人简称 WAAPI

与纯粹的声明式CSS不同，JavaScript还允许我们动态地将属性值设置为持续时间。 对于构建自定义动画库和创建交互式动画，Web动画API可能是完成工作的完美工具。

web Animations API 和 css动画，不是谁替换谁。结合使用，效果更佳。

复杂的逻辑动画，因为web Animations API和JS天然的亲和力，是更优的选择。

如果不行， 加个垫片 [web-animations-js](https://github.com/web-animations/web-animations-js)

[在这里对其实现方式的源码进行分析、解析](./16-web-animation-api/)
[在这里对使用的用法进行总结]()