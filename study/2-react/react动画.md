# react中的动画形式总结

这里不总结三方库的使用，只有纯原生的实现方式与思想，因为三方库也是用这个东西来做

## 直接通过定制器控制setData

直接通过定制器控制setData，setData每次更改style.left，重新渲染组件
## 高阶组件控制型动画

1. 被动画的组件
2. 创建一个中间组件，用作 被动画组件的父组件
3. 创建一个高阶组件，被动画的组件作为高阶组件的参数，中间组件在高阶组件里面，被动画的组件作为中间组件的子组件，这样由中间组件来控制动画执行

```jsx
function ToggleButton({ label, isOpen, onClick }) {
  const icon = isOpen ? (
    <i className="fas fa-toggle-off fa-lg" />
  ) : (
    <i className="fas fa-toggle-on fa-lg" />
  );
  return (
    <button className="toggle" onClick={onClick}>
      {label} {icon}
    </button>
  );
}
 
 
function Navbar({ open }) {
  return (
    <AnimatedVisibility
      visible={open}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      animationInDuration={300}
      animationOutDuration={600}
    >
      <nav className="bar nav">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </nav>
    </AnimatedVisibility>
  );
}
 
 
function Sidebar({ open }) {
  return (
    <AnimatedVisibility
      visible={open}
      animationIn="slideInLeft"
      animationOut="slideOutLeft"
      animationInDuration={500}
      animationOutDuration={600}
      className="on-top"
    >
      <div className="sidebar">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    </AnimatedVisibility>
  );
}
 
 
function App() {
  const [navIsOpen, setNavOpen] = useState(false);
  const [sidebarIsOpen, setSidebarOpen] = useState(false);
 
 
  function toggleNav() {
    setNavOpen(!navIsOpen);
  }
 
 
  function toggleSidebar() {
    setSidebarOpen(!sidebarIsOpen);
  }
 
 
  return (
    <Fragment>
      <main className="main">
        <header className="bar header">
          <ToggleButton
            label="Sidebar"
            isOpen={sidebarIsOpen}
            onClick={toggleSidebar}
          />
          <ToggleButton label="Navbar" isOpen={navIsOpen} onClick={toggleNav} />
        </header>
        <Navbar open={navIsOpen} />
        <Boxes />
      </main>
      <Sidebar open={sidebarIsOpen} />
    </Fragment>
  );
}
```

## 计时器动画

在动画开始的时候开启一个计时器，计时器的时间和动画持续时间一致，当计时器结束的时候，控制响应式变量变化 改为false

```jsx
function Box({ word }) {
  const color = colors[Math.floor(Math.random() * 9)];
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
 
 
  function hideMe() {
    setFading(true);
    setTimeout(() => setVisible(false), 650);
  }
 
 
  let style = { borderColor: color, backgroundColor: color };
 
 
  return (
    <Animated
      animationIn="zoomIn"
      animationOut="zoomOut"
      isVisible={!fading}
      style={visible ? null : { display: "none" }}
    >
      <div className="box" style={style}>
        <div className="center">{word}</div>
        <button className="button bottom-corner" onClick={hideMe}>
          <i className="center far fa-eye fa-lg" />
        </button>
      </div>
    </Animated>
  );
}

```

## react中的[FLIP动画](/study/9-animation/1-FLIP.html)



如何在react中完成flip动画呢

1. 缓存元素起始位置  - 渲染到屏幕之间
2. 将元素移动到结束的位置  - 渲染到屏幕之间
3. 获取当前的位置，并计算当前的位置与缓存的起始位置的差值。  - 渲染到屏幕之间
4. 下一帧开始时，开始做动画 

可以看出1-3是在渲染到屏幕之间
渲染到屏幕之间可以使用useLayoutEffect


做FLIP动画的逻辑就是如下

1. 在页面第一次useEffect, 元素渲染完成。这时同时缓存元素的位置。
2. state发生变化，组件需要重新渲染
3. 在组件重新渲染到屏幕那一刻，在useLayoutEffect中，我们获取最新的位置。并计算当前的位置与缓存的起始位置的差值。
4. 动画开始执行

```jsx

const { useEffect, useLayoutEffect, useState, useRef,} = React
let catchRect = null
const App = () => {
  const selfRef = useRef(null)
  const first = useRef(true)
  const [active, setActive] = useState(false)
  useEffect(() => catchRect = selfRef.current.getBoundingClientRect(), [])
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
    } else {
      // 获取到结束的位置
      const nextRect = selfRef.current.getBoundingClientRect()
      // 开始位置和结束位置作差
      const x = catchRect.x - nextRect.x;
      catchRect = nextRect;
      // 补间动画对象，帧动画对象
      const effect = new KeyframeEffect(selfRef.current, [
        { transform: `translateX(${x}px)` }, { transform: `translateX(0px)` },  // 开始位置变为相对结束位置的距离值(计算出相对结束位置的开始的值，从开始的值开始做帧动画) 此时在react中的真实渲染位置已经是结束位置了。
      ], { fill: 'auto', duration: 800, });
      const animation = new Animation(effect, document.timeline);
      animation.play();
    }
  })
  return (
    <div className="App">
      <div
        ref={selfRef}
        className={ active ? `box right` : `box left` }
        onClick={() => setActive((prev) => !prev)}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'));

```

## react-transition-group 实现原理

```jsx

<react-transition-group>
  {
    list && list.map((item) => (
      <react-transition>
        { item }
      </react-transition>
    ))
  }
<react-transition-group>
```

最外层的 <react-transition-group> 组件 并不会直接对嵌入的children进行直接渲染。而是将props.children保存为组件的内部状态state。这样我们可以在children渲染之前，对state做一些额外的操作。

<react-transition-group>会对于动态插入的节点，不会直接渲染。而是先将，新插入节点外层的<react-transition>组件的动画状态设置为'Leave'态（这里处理的目的是，即使dom渲染完成后，元素也是隐藏的状态）。然后在<react-transition>中，会先等待dom渲染完成，然后再将动画的状态设置为'Entering'，完成'Leave'态到'Entering'态的动画过渡。

<react-transition-group>会对于动态删除的节点，不会直接删除。而是先将需要删除节点外层的<react-transition>组件的动画开关设置为false，动画开始向'Leave'态过渡。动画过渡完成后，然后会触发<react-transition>组件的 onLeave 事件。在 onLeave 事件中会删除dom节点。


1. 插入的节点，先渲染dom，然后再做动画
2. 删除的节点，先做动画，然后再删除dom

[引用地址](https://zhuanlan.zhihu.com/p/429487421?utm_id=0)

## 路由动画

```jsx
// src/App5/index.js
const ANIMATION_MAP = {
  PUSH: 'forward',
  POP: 'back'
}

const Routes = withRouter(({location, history}) => (
  <TransitionGroup
    className={'router-wrapper'}
    childFactory={child => React.cloneElement(
      child,
      {classNames: ANIMATION_MAP[history.action]}
    )}
  >
    <CSSTransition
      timeout={500}
      key={location.pathname}
    >
      <Switch location={location}>
        <Route exact path={'/'} component={HomePage} />
        <Route exact path={'/about'} component={AboutPage} />
        <Route exact path={'/list'} component={ListPage} />
        <Route exact path={'/detail'} component={DetailPage} />
      </Switch>
    </CSSTransition>
  </TransitionGroup>
));
```

## gsap中的使用

TODO: gsap