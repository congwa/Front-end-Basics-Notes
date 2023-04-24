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
