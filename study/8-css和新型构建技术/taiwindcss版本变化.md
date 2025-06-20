# tailwindcss 版本变化

## Tailwind CSS v1.x (2019)

V1.0 是 Tailwind 真正走向成熟的基石，确立了其核心的原子化 CSS 理念和配置体系。

### 核心理念与初始写法

- **Utility-First:** 核心思想，直接在 HTML 元素上组合类名，例如 `class="flex justify-center items-center p-4"`。
- **Responsive Variants:** 引入**断点前缀**，用于响应式设计。
  - **写法：** `sm:`, `md:`, `lg:`, `xl:`
  - **示例：** `<div class="text-center md:text-left"></div>` (中等屏幕以上文本左对齐)
- **Pseudo-class Variants:** 引入**伪类前缀**，用于交互状态。
  - **写法：** `hover:`, `focus:`, `active:` 等。
  - **示例：** `<button class="bg-blue-500 hover:bg-blue-700">Click</button>` (悬停时背景变深)
- **`tailwind.config.js`:** 强大的配置文件，用于**自定义和扩展设计系统**（颜色、间距、字体等）。
  - **写法：** 在配置文件中 `theme.extend` 定义 `colors: { 'my-custom-color': '#abcdef' }`，然后在 HTML 中使用 `bg-my-custom-color`。
- **`@apply` Directive:** 在自定义 CSS 中组合多个 Tailwind 工具类。
  - **写法：**

    ```css
    .btn-primary {
      @apply py-2 px-4 bg-blue-500 text-white rounded-lg;
    }
    ```

- **JIT 模式的萌芽 (v1.9 实验性引入)：** 虽未成为主流，但其在 v1.9 中实验性地引入了 **Just-in-Time (JIT) 编译器**，为后续版本的任意值和更快的编译速度奠定了基础。

---

## Tailwind CSS v2.x (2020)

V2.0 是一个重大更新，扩展了默认设计系统，并引入了对暗模式和 JIT 模式的强化。

### 写法与特性新增

- **Expanded Color Palette:** 默认颜色调色板扩展到 220 种，每个颜色有 10 个色阶，提供更细致的选择。
  - **写法：** `bg-red-50`, `text-gray-400`。
- **Dark Mode Modifier:** 内置 `dark:` 变体，支持基于媒体查询或手动 `class` 切换的暗模式样式。
  - **写法：** `<div class="bg-white dark:bg-gray-800"></div>` (暗模式下背景变深)
- **New 2XL Breakpoint:** 增加了一个 `2xl` 断点 (`min-width: 1536px`)。
  - **写法：** `2xl:text-xl`。
- **Ring Utilities:** 引入 `ring-*` 系列工具类，用于创建易于访问的焦点环。
  - **写法：** `focus:ring-2 focus:ring-blue-500`。
- **Pseudo-element Variants (v2.2):** 支持 `::before` 和 `::after` 伪元素。
  - **写法：** `before:block`, `before:content-['*']`, `after:absolute`。
- **Peer Variants (v2.2):** 引入 `peer-*` 变体，允许根据兄弟元素的状态来样式化另一个兄弟元素。
  - **写法：** `<input type="checkbox" class="peer"><label class="peer-checked:text-blue-600">` (当复选框选中时，label 文本变蓝)
- **Arbitrary Values (v2.2 引入):** 在 JIT 模式下，开始支持在方括号 `[]` 中使用任意值，而无需在 `tailwind.config.js` 中预定义。
  - **写法：** `w-[240px]`, `text-[#1da1f1]`, `top-[calc(50%-10px)]` (这在 v3 中成为默认且更常用)

---

## Tailwind CSS v3.x (2021)

V3.0 将 JIT 模式作为默认行为，彻底改变了开发体验，并进一步强化了任意值和新特性。

### 写法与特性全面增强

- **JIT Mode by Default:** JIT 编译器成为默认，所有工具类都是按需生成，**极大地提升了编译速度和开发体验**。
- **Arbitrary Values (全面普及与强化):** 任意值的使用变得普遍且强大，几乎任何 CSS 属性值都可以直接在类名中指定。这是 V3 最重要的改进之一。
  - **写法：** `grid-cols-[200px_1fr]`, `bg-[url('/img/hero-pattern.svg')]`, `h-[var(--header-height)]`, `text-[#FF5733]`, `mx-[clamp(1rem,5vw,3rem)]`, `bg-[hsl(200,100%,50%)]`, `translate-y-[-50%]`, `backdrop-blur-[2px]`。
  - **`[&_tr>th]:!bg-neutral-50` 就是在这里得到了广泛且强力的支持**，它是一个**任意变体（Arbitrary Variant）**，允许你直接嵌入任何 CSS 选择器作为变体前缀。
    - **写法：** `[arbitrary-selector]:`。
    - **示例：** `[&_tr>th]:!bg-neutral-50` (当是 `tr` 下的 `th` 时，强制背景色为 `neutral-50`)。
    - **示例：** `[>div]:text-red-500` (当是直接子 `div` 时，文本红色)。
    - **示例：** `[&:nth-child(3)]:font-bold` (当是第三个子元素时，字体加粗)。
    - **示例：** `[&[data-selected]]:bg-blue-500` (当元素有 `data-selected` 属性时，背景为蓝色)。
    - **示例：** `[.dark_&]:text-white` (在 `.dark` 主题下，文本为白色)。
    - **示例：** `[&:has(button:focus)]:ring-2` (当内部的按钮获得焦点时，添加轮廓环)。
  - **组合使用示例：**
    - `hover:[&>span]:underline` (悬停时，使其中的 span 元素添加下划线)
    - `md:[&:not(:first-child)]:ml-4` (在中等屏幕下，非第一个子元素左边距为4)
    - `dark:lg:[&_.icon]:text-blue-300` (在暗模式和大屏幕下，内部 .icon 类元素文本为蓝色)
- **Every Color Out of the Box:** 所有预定义的颜色（包括所有色阶）默认都可用，无需在配置文件中扩展。
- **Colored Box Shadows:** 支持带颜色的阴影，并可控制透明度。
  - **写法：** `shadow-lg shadow-blue-500/50` (蓝色半透明大阴影)。
- **Print Modifier:** 引入 `print:` 变体，用于针对打印页面应用特定样式。
  - **写法：** `<header class="print:hidden">` (打印时隐藏头部)。
- **Aspect Ratio Utilities:** 支持 `aspect-ratio` CSS 属性。
  - **写法：** `aspect-video`, `aspect-[4/3]`。
- **Text Decoration Utilities (v3.1):** 扩展了文本下划线、上划线等装饰的样式，如颜色、样式、偏移量。
  - **写法：** `underline decoration-blue-500 decoration-wavy underline-offset-4`。
- **Logical Properties (v3.3):** 支持 CSS 逻辑属性，更好地处理国际化和 RTL (从右到左) 语言。
  - **写法：** `ms-4` (margin-inline-start，在 LTR 中是 `ml-4`)。
- **Line-height Modifier (v3.3):** 新的字体大小/行高组合写法。
  - **写法：** `text-lg/7` (font-size large, line-height 1.75rem)。
- **Line-clamp out of the box (v3.3):** 无需插件即可截断多行文本。
  - **写法：** `line-clamp-3`。
- **Arbitrary Properties (v3.4):** 可以在方括号中直接写任意 CSS 属性和值，无需预定义。
  - **写法：** `[transform:rotateY(180deg)]`, `[--my-custom-prop:value]`。
- **Data Attributes Variant (v3.4):** 根据 HTML 元素上的 `data-` 属性状态应用样式。
  - **写法：** `<div data-checked class="data-[checked]:bg-blue-500">`。
- **New `not-*` Variant (v3.4):** `not-` 变体，用于样式化不匹配特定条件（如伪类、断点、状态等）的元素。
  - **写法：** `not-hover:text-gray-500` (非悬停状态下文本颜色为灰色)。

---

## Tailwind CSS v4.0 (预计 2025 年发布)

V4.0 代表着 Tailwind 的一次**底层重构和范式转变**，旨在提供更极致的性能、更原生的 CSS 体验和更彻底的灵活性。

### 革命性变化与未来写法

- **CSS-First Configuration (颠覆性改变):** 不再强制使用 `tailwind.config.js` 文件。许多配置可以直接在 CSS 文件中使用 `@theme` 指令、CSS 变量和 `@property` 来完成。
  - **写法（CSS 中）：**

    ```css
    @theme {
      --color-primary: #3b82f6;
      --space-sm: 0.5rem;
    }
    .my-component {
      background-color: var(--color-primary);
      padding: var(--space-sm);
    }
    ```

  - 这使得 Tailwind 更像一个“CSS 引擎”而非仅仅一个类名生成器。
- **Native CSS Variables by Default:** 所有设计令牌（如颜色、间距、字体大小）默认都编译成 CSS 变量。这意味着你可以在任何 CSS 规则中引用它们，并能通过 JavaScript 动态修改它们。
  - **写法：** `<div style="background-color: var(--tw-colors-blue-500);">`
- **Dynamic Utility Values and Variants (极致自由):** 任意值和任意变体的能力被推向极致。你可能能够直接在类名中表达几乎任何 CSS。
  - **写法：** `w-[calc(100%-var(--sidebar-width))]`, `grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))]`。
- **New High-Performance Engine (Tailwind Oxide):** 底层编译器重写，旨在实现前所未有的构建速度，特别是增量构建。
- **First-Class Container Queries:** 内置对容器查询 (`@container`) 的支持，无需额外插件。允许组件根据其容器的大小而非视口大小进行响应式布局。
  - **写法：** `<div class="container/[sidebar]"><div class="@sidebar:text-lg"></div></div>` (sidebar 容器宽度达到一定时，内部文本变大)
- **New 3D Transform Utilities:** 新增对 3D 转换的工具类。
- **Expanded Gradient APIs:** 渐变功能更加强大，支持径向渐变、锥形渐变、插值模式等现代 CSS 渐变特性。
- **`@starting-style` Support:** 支持 CSS 的 `@starting-style` 规则，便于实现平滑的进入和退出过渡动画。
- **`not-*` Variant (增强):** 更强大的 `not-` 变体，用于否定匹配选择器、媒体查询或功能查询。
- **Native Cascade Layers (`@layer`):** 更好地控制样式层叠，减少冲突，与原生 CSS 对齐。

---
