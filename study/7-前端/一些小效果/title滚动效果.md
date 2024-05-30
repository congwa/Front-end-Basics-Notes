# title滚动效果

```js
/**
 * title滚动效果
 * @param title ?标题
 * @param time ?切换滚动的时间
 * @returns [开启滚动效果函数, 暂停滚动效果函数]
 */
export const scrollTitle = (title = document.title, time = 400) => {
  const documentTitle = document.title
  let step = 0;
  let timer = 0;
  const scrollMSG = () => {
    document.title = title.substring(step, title.length) + title.substring(0, step);
    document.title += '...'; step++;
    if (step > title.length) step = 0;
  }
  timer = setInterval(scrollMSG, time);
  return [
    () => timer = setInterval(scrollMSG, time),
    () => {
      clearInterval(timer);
      document.title = documentTitle;
    }
  ]
}
```