# autoAnimation

[只需一行代码即可将动画添加到应用中](https://auto-animate.formkit.com/#usage-vue)

AutoAnimate 是一个零配置的插入式动画实用程序，可为您的 Web 应用程序添加平滑过渡。您可以将它与 React、Solid、Vue、Svelte 或任何其他 JavaScript 应用程序一起使用.

## 方式1： 直接传入父的dom节点

```vue
<script setup>
import { ref, onMounted } from "vue"
import autoAnimate from "@formkit/auto-animate"

const dropdown = ref() // we need a DOM node
const show = ref(false)

onMounted(() => {
  autoAnimate(dropdown.value) // thats it!
})
</script>

<template>
  <div ref="dropdown" class="dropdown">
    <strong class="dropdown-label" @click="show = !show">
      Click me to open!
    </strong>
    <p class="dropdown-content" v-if="show">Lorum ipsum...</p>
  </div>
</template>

```

## 配置： 参数

```js
// AutoAnimate 允许您使用以下选项将第二个参数传递给： autoAnimate
autoAnimate(el, {
  // Animation duration in milliseconds (default: 250)
  duration: 250,
  // Easing for motion (default: 'ease-in-out')
  easing: 'ease-in-out'
  // When true, this will enable animations even if the user has indicated
  // they don’t want them via prefers-reduced-motion.
  disrespectUserMotionPreference: false
})
```

## 方式二： useAutoAnimate (react hook)

```jsx
import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'

const App = function () {
  const [items, setItems] = useState([0, 1, 2])
  const [parent, enableAnimations] = useAutoAnimate(/* optional config */)
  const add = () => setItems([...items, items.length])
  return <>
  <ul ref={parent}>
    {items.map(
      item => <li key={item}>{ item }</li>
    )}
  </ul>
  <button onClick={add}>Add number</button>
  <button onClick={() => enableAnimations(false)}>Disable</button>
</>
}

export default App
```

## 方式三： v-auto-animate (vue指令)

```js
import { createApp } from 'vue'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import App from 'App.vue'

createApp(App).use(autoAnimatePlugin).mount('#app')
```

```vue
<script setup>
import { ref } from 'vue'
const items = ref(["😏","😐","😑","😒","😕", ... ])
function removeItem(toRemove) {
  items.value = items.value.filter((item) => item !== toRemove)
}
</script>

<template>
  <h5>Click emojis to remove them.</h5>
  <ul v-auto-animate>
    <li
      v-for="item in items"
      :key="item"
      @click="removeItem(item)"
    >
      {{ item }}
    </li>
  </ul>
</template>
```

## 方式4：useAutoAnimate (vue composable)

```vue
<script setup>
import { ref } from 'vue'
import { useAutoAnimate } from '@formkit/auto-animate/vue'

const items = ref(["React", "Vue", "Svelte", "Angular"])

function sortAsc() {
  items.value.sort()
}
function sortDesc() {
  items.value.sort().reverse()
}

const [parent] = useAutoAnimate()
</script>

<template>
  <div>
    <button @click="sortAsc">Sort A-Z ↑</button>
    <button @click="sortDesc">Sort Z-A ↓</button>
  </div>
  <ul ref="parent">
    <li
      v-for="item in items"
      :key="item"
    >
      {{ item }}
    </li>
  </ul>
</template>
```

## 自定义关键帧

提供一个函数作为该 autoAnimate 函数的第二个参数，此函数将在每个动画之前调用，并且必须返回 KeyframeEffect

```js
import autoAnimate, { getTransitionSizes } from '@formkit/auto-animate'

autoAnimate(parentElement, (el, action, oldCoords, newCoords) => {
  let keyframes
  // supply a different set of keyframes for each action
  if (action === 'add') {
    keyframes = [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1)', opacity: 1 }
    ]
  }
  // keyframes can have as many "steps" as you prefer
  // and you can use the 'offset' key to tune the timing
  if (action === 'remove') {
    keyframes = [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.33 },
      { transform: 'scale(0.75)', opacity: 0.1, offset: 0.5 },
      { transform: 'scale(0.5)', opacity: 0 }
    ]
  }
  if (action === 'remain') {
    // for items that remain, calculate the delta
    // from their old position to their new position
    const deltaX = oldCoords.left - newCoords.left
    const deltaY = oldCoords.top - newCoords.top
    // use the getTransitionSizes() helper function to
    // get the old and new widths of the elements
    const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(el, oldCoords, newCoords)
    // set up our steps with our positioning keyframes
    const start = { transform: `translate(${deltaX}px, ${deltaY}px)` }
    const mid = { transform: `translate(${deltaX * -0.15}px, ${deltaY * -0.15}px)`, offset: 0.75 }
    const end = { transform: `translate(0, 0)` }
    // if the dimensions changed, animate them too.
    if (widthFrom !== widthTo) {
      start.width = `${widthFrom}px`
      mid.width = `${widthFrom >= widthTo ? widthTo / 1.05 : widthTo * 1.05}px`
      end.width = `${widthTo}px`
    }
    if (heightFrom !== heightTo) {
      start.height = `${heightFrom}px`
      mid.height = `${heightFrom >= heightTo ? heightTo / 1.05 : heightTo * 1.05}px`
      end.height = `${heightTo}px`
    }
    keyframes = [start, mid, end]
  }
  // return our KeyframeEffect() and pass
  // it the chosen keyframes.
  return new KeyframeEffect(el, keyframes, { duration: 600, easing: 'ease-out' })
}))
```

我们将为 add 和 remove 的动作创建一组新的关键帧，这些 remain 动作会超过其目的地，以创建“弹跳”动画效果