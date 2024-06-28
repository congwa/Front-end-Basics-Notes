# 在一个 map 中获取 refs

```ts
import React from "react";

export default function useRefs() {
  const refs = React.useRef<HTMLDivElement[]>([]);

  const setRefs = React.useCallback(
    (index: number) => (el: HTMLDivElement) => {
      if (el) refs.current[index] = el;
    },
    []
  );

  const reset = React.useCallback(() => {
    refs.current = [];
  }, []);

  return [refs.current, setRefs as any, reset];
}
```

使用示例

```ts
{
  React.Children.map(validChildren, (child, index) => {
    return (
      <div className={cls(bem("slide"))}>
        {React.cloneElement(child, {
          ref: setChildrenRefs(index),
          autoHeight,
        } as any)}
      </div>
    );
  });
}
```

注意： 自定义ref示例

```ts
import React, { useRef, useEffect } from 'react';

// 一个简单的按钮组件
const MyButton = React.forwardRef((props, ref) => (
  <button ref={ref} {...props}>Click me</button>
));

// 父组件
const Parent = () => {
  const localRef = useRef();

  // 函数形式的 ref
  const customRef = (node) => {
    console.log('Ref callback:', node);
    localRef.current = node;
  };

  // 使用 cloneElement 克隆并修改 MyButton
  const clonedButton = React.cloneElement(<MyButton />, {
    ref: customRef, // 传递函数形式的 ref
    onClick: () => {
      console.log('Button clicked');
    }
  });

  return <div>{clonedButton}</div>;
};

export default Parent;

```

这里使用函数形式的ref来自定义ref
