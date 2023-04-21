# vite4.3

无意间看到了一个图,vite4.3的效率提升竟然这么大，究竟使用了什么魔法？
![效率图](../imgs/vite4.3%E6%95%88%E7%8E%87%E5%9B%BE.png)
[How we made Vite 4.3 faaaaster 🚀](https://sun0day.github.io/blog/vite/why-vite4_3-is-faster.html)


## 策略的更改

优化冗余逻辑和不必要的模块搜索，减少计算和fs调用
  

## 并行优化

括导入分析、提取 deps 的导出、解析模块 url和运行批量优化器

## HMR防抖

增加缓存，统一批次去更新

## Javascript 优化

- *yield用回调代替
- 替换startsWith为endsWith 用===  比较了str.startsWith('x')和 的str[0] === 'x'执行基准，发现===比 . 快约 20% startsWith。并且比同时期endsWith慢了大约 60%
- 避免重新创建正则表达式
- 放弃生成自定义错误


都是基于策略的优化，没有引入比较新的技术，但是让性能像有魔法般上升了一个新的高度。