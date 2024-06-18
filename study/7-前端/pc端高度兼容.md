# pc端高度兼容

因为高分辨率屏和浏览器操作栏，系统操作栏的占位，往往真实情况是1920*700，但是实际设计稿是1920*1080，所以需要做一些按照高度的兼容处理。

```jsx
import { useState, useEffect } from "react";

interface Box {
  height: number;
  width: number;
}

interface UseResponsiveHeightParams {
  [key: string]: Box;
}
const designHeight = 1080;

const useResponsiveHeight = (designResolutions: UseResponsiveHeightParams) => {
  const [drs] = useState(designResolutions);
  const [Resolutions, setResolutions] = useState(designResolutions);
  useEffect(() => {
    const handleResize = () => {
      // 计算当前屏幕尺寸
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const matchedResolution = Object.entries(drs).map(
        ([key, box]: [string, Box]) => {
            const r = screenHeight / designHeight
            const height = r * box.height
            const width = r * box.width
            return [key, {width, height}]
        },
      );

      setResolutions(Object.fromEntries(matchedResolution));
    };

    // 初次渲染时计算高度
    handleResize();

    // 监听窗口大小变化事件
    window.addEventListener("resize", handleResize);

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [drs]);
  return Resolutions
};

export default useResponsiveHeight;

```
