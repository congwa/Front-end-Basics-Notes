# react路由动画


## gsap

```js
const handleRouteAnimation = () => {
  // 前一个路由元素的退出动画
  gsap.to(prevRouteRef.current, {
    duration: 0.5,
    opacity: 0,
    onComplete: () => {
      // 动画完成后，移除前一个路由元素
      prevRouteRef.current.remove();
    }
  });

  // 当前路由元素的进入动画
  gsap.fromTo(
    currentRouteRef.current,
    {
      opacity: 0
    },
    {
      duration: 0.5,
      opacity: 1
    }
  );
};

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Switch, Route, useLocation } from "react-router-dom";

const App = () => {
  const location = useLocation();
  const prevRouteRef = useRef(null);
  const currentRouteRef = useRef(null);

  useEffect(() => {
    // 首次加载时不进行动画
    if (prevRouteRef.current === null) {
      prevRouteRef.current = currentRouteRef.current;
      return;
    }

    handleRouteAnimation();

    prevRouteRef.current = currentRouteRef.current;
  }, [location]);

  const handleRouteAnimation = () => {
    // 前一个路由元素的退出动画
    gsap.to(prevRouteRef.current, {
      duration: 0.5,
      opacity: 0,
      onComplete: () => {
        // 动画完成后，移除前一个路由元素
        prevRouteRef.current.remove();
      }
    });

    // 当前路由元素的进入动画
    gsap.fromTo(
      currentRouteRef.current,
      {
        opacity: 0
      },
      {
        duration: 0.5,
        opacity: 1
      }
    );
  };

  return (
    <div>
      <Switch>
        <Route path="/route1">
          <div ref={currentRouteRef}>route1</div>
        </Route>
        <Route path="/route2">
          <div ref={currentRouteRef}>route2</div>
        </Route>
        <Route path="/route3">
          <div ref={currentRouteRef}>route3</div>
        </Route>
        <Route path="/route4">
          <div ref={currentRouteRef}>route4</div>
        </Route>
        <Route path="/route5">
          <div ref={currentRouteRef}>route5</div>
        </Route>
      </Switch>
    </div>
  );
};

```