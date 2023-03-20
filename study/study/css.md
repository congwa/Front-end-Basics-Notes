# css

## BFC

> 具有 BFC 特性的元素可以看作是隔离了的独立容器，容器里面的元素不会在布局上影响到外面的元素，并且 BFC 具有普通容器所没有的一些特性

- 触发 BFC
- body 根元素
  - 浮动元素：float 除 none 以外的值
  - 绝对定位元素：position (absolute、fixed)
  - display 为 inline-block、table-cells、flex
  - overflow 除了 visible 以外的值 (hidden、auto、scroll)

- BFC 特性及应用
  - 同一个 BFC 下外边距会发生折叠
  - BFC 可以包含浮动的元素（清除浮动）
  - BFC 可以阻止元素被浮动元素覆盖

## IFC

>Inline Formatting Context 内联格式化上下文。

IFC的line box（线框高度由其包含行内元素中最高的实际高度计算而来（不受到竖直方向的padding/margin影响） 
IFC的inline box一般左右都贴紧整个IFC，但是因为float元素扰乱。float元素会位于IFC与line box之间，使得line box宽度缩短。同个IFC下的多个line box高度会不同。IFC中不可能有块级元素，当插入块级元素时（如p中插入div）会产生两个匿名块与div分隔开，即产生两个IFC，每个IFC对外表现为块级元素，与div垂直排列。

- 触发 IFC
  块级元素中仅包含内联级别元素
	>dd dddd
  >需要注意的是当IFC中有块级元素插入时，会产生两个匿名块将父元素分割开来，产生两个IFC

