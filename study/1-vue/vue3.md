# vue3


## suspense 配合 异步setup进行延迟渲染组件

```js
// 子组件
async setup() {
    const peoples = ref(null);
    const headers = { "Content-Type": "application/json" };
    const fetchPeoples = await fetch("https://swapi.dev/api/people", {
        headers,
    });
    peoples.value = await fetchPeoples.json();
    return { peoples };
}


```

```html
<!-- 父组件 -->
 <suspense>
    <template #default>
        <CyPeoples />
    </template>
    <template #fallback>
        <div>
            <h3>数据加载中……</h3>
        </div>
    </template>
    </suspense>


```

## vue3响应系统原理

> vue3使用Proxy和reactive、effect、track、trigger、ref、toRefs、computed等方法重写了响应式系统。

```javascript
    const isObject = (val) => val !== null && typeof value === 'object'
    const covert = target => (isObject(target)?  reactive(target) : target)
    const hasOwn = (target,key) => Object.prototype.hasOwnProperty.call(target, key)

    // 接收一个参数，判断参数是否是对象。 不是对象直接返回这个参数，不做响应式处理
    function reactive(target) {
        if(!isObject(target)) return target;

        const handler  = {

            get(target, key, receiver) {
                // 收集依赖
                track(target, key)
                const result = Reflect.get(target, key, receiver)
                return covert(result)
            },

            // 设置的新值和旧值不相等时候，删除这个key并触发更新(trigger)
            set(target, key , value, receiver) {
                const oldValue = Reflect.get(target, key, receiver)
                let result = true
                if(oldValue !== value) {
                    result = Reflect.set(target, key ,value ,receiver)

                    // 触发更新
                    trigger(target, key)
                }
                return result
            },

            deleteProperty(target, key) {
                const hadKey = hasOwn(target, key)
                const result = Relect.deleteProperty(target, key)
                if(hadKey && result) {
                    trigger(target, key)
                }
                return result
            }
        }
        return new Proxy(target, handler)
    }
    // 当前活动的effect函数
    let activeEffect = null;

    // 模板类型
    // const callback = () => (document.getElementById('#1').innerText = this.data.a) // 模板触发响应式

    // 非模板类型的模拟副作用函数
    const callback = function() {
        function add() {
            return this.data.a
        }

        const update = () =>  {
            document.getElementById('#1').innerText = this.data.a
        }
        if(activeEffect) {
            add()
        } else {
            update()
        }
    }.bind(vm)


    const watchEffect = function (watchEffectCallBack) {
        effect(watchEffectCallBack)
    }

    // vue的组件中
    // watchEffect(function() {
    //     this.data.a = ref.value.data.b + ref.value.data.c
    // }) 

    function effect(callback) {
        activeEffect = callback
        callback() //访问响应式对象属性，去收集依赖
        activeEffect = null
    }
    let targetMap = new WeakMap();

    // 触发更新
    function trigger(target, key) {
        const depsMap = targetMap.get(target)
        if(!depsMap) return
        const dep = depsMap.get(key)
        if(dep) {
            dep.forEach(effect => {
                effect()
            })
        }
    }

    // 收集依赖，将activeEffect存入dep
    function track(target,key) {
        if(!activeEffect) return;
        let depsMap = targetMap.get(target);
        if(!depsMap) {
            // 创建depsMap
            targetMap.set(target, (depsMap = new Map()))
        }
        let depMap = depsMap.get(key)
        if(!dep) {
            // 创建dep
            depsMap.set(key, (dep = new Set()))
        }
        dep.add(activeEffect)
    }

    const ref = function (raw) {
        if(isObject(raw) && raw.__is_ref) {
            return raw
        }
        // 如果是对象proxy 如果值 raw
        value = covert(raw)
        // 值proxy包起来
        let v =  {
            __is_ref: true,
            get value () {
                track(v, 'value')
                return value
            },
            set value (newValue) {
                raw = newValue
                value = covert(raw)
                trigger(v, 'value')
            }
        }
        return v
    }

    /**
     * 将reactive返回的每一个属性转换为类似ref返回的对象
     */
    const toRefs = function (proxy) {
        const ret = proxy instanceof Array ? new Array(proxy.length): {}
        for (const key in proxy) {
            ret[key] = toProxyRef(proxy, key)
        }
    }

    // 转换成类似Ref对象
    const toProxyRef = function(proxy, key) {
        const r = {
            _v__ref: true,
            get value() {
                return proxy[key]
            },
            set value(newValue) {
                proxy[key] = newValue
            }
        }
        return r
    }

    // 通过effect监听getter内部的变化，
    // getter中访问响应式数据属性的时候收集响应式依赖，
    // 当数据发送变化时候重新执行effect函数，把getter的结果存到result中
    const computed = function(getter) {
        const result = ref()
        effect(() => (result.value = getter()))
        return result
    }


```

## provide inject

建议尽可能将任何对响应式状态的变更都保持在供给方组件中

### provide

vue3**组合式api**

1. provide传递**值类型**
2. provide传递**对象类型**
3. provide传递**响应式类型**
    - 子组件为响应式
4. provide传递**computed**
   - 子组件为响应式
5. provide传递**响应式类型和函数**
   - 子组件为响应式
6. provide传递**readonly和函数** 
   - 子组件为响应式
   > 官方推荐这样

### inject


## toRefs逆向

```ts
import { reactive, isRef, ref } from 'vue'

type ValueType = null | undefined | string | number | boolean

function fromRefs<T extends object>(obj: { [K in keyof T]: ValueType | Ref<ValueType> }): T {
  const result: { [K in keyof T]: ValueType } = {} as any
  for (const key in obj) {
    if (isRef(obj[key])) {
      result[key] = (obj[key] as Ref<ValueType>).value
    } else {
      result[key] = obj[key] as ValueType
    }
  }
  return reactive(result) as T
}

```


## props透传原理

创建proxy对象去获取Props

因为我们知道代码中我们可以通过this. 的方式去获取props的值，而且props已经被挂载到了组件实例对象中。

因此创建一个proxy对象（后续通过bind的方式将这个对象挂载到render函数等位置，this.的时候由props去映射到对应的props中）

```js
// 这种说法是错误的，破坏了vue的单向数据流
instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance
        // 如果在传入的props中，则返回的对应的值 （props）
        if (hasOwn(props, key)) {
            return props[key]
        }
    }
}
```

正确是说法在《vue3设计与实现》给出了如下的解释

```js
function mountComponent(vnode, container, anchor){
	const componentOptions = vnode.type
	// 从组建选项对象中取出props定义，即propsOption
	const {render, data, props: propsOption /* 其他省略 */ } = componentOptions
	
	beforeCreate && beforeCreate()
	const state = reactive(data())
	// 调用resolveProps函数解析出最终的props数据与attrs数据
	const [props, attrs] = resolveProps(propsOption, vnode.props)
	const instance = {
		state,
		// 将解析出的props数据包装为shallowReactive并定义到组件实例上
		props: shallowReactive(props),
		isMounted: false,
		subTree: null
	}
	vnode.component = instance

	// 省略部分代码
	
}

// resolveProps 函数用于解析组件props和attrs数据
function resolveProps(options, propsData){
	const props = {}
	const attrs = {}
	// 遍历为组件传递的props数据
	for (const key in propsData){
		if(key in options){
			// 如果为组件传递的props数据在组件自身的props选项中有定义，则将其视为合法的props
			props[key] = propsData[key]
		}else{
			// 否则将其作为attrs
			attrs[key] = propsData[key]
		}
	}
	
	return [props,attrs]

}
```

但是可能会有一个疑问就是，父组件传值的话，虽然没有破坏单向数据流，但是子组件是如何知道更新的？

在patchComponent中我们可以看到如下代码

1. 在path的过程中，会检测子组件是否真的需要更新，因为子组件的props可能不变
2. 如果需要更新，则更新子组件的props,slots等内容

```js
function patchComponent(n1,n2,anchor){
	// 获取组件实例，即n1.component,同时让新的组件虚拟节点 n2.component也指向组件实例
	// 将组件实例添加到新的组件vnode对象上，即n2.component = n1.component
	const instance = (n2.component = n1.component) 
	// 获取当前的props数据
	const {props} = instance
	// 调用hasPropsChanged检测为子组件传递的props是否发生变化，如果没有变化，则不需要更新
	if(hasPropsChanged(n1.props, n2.props)){
		// 调用 resolveProps函数重新获取props数据
		const {nextProps} = resolveProps(n2.type.props, n2.props)
		// 更新props
		for(const k in nextProps){
			props[k] = nextProps[k]
		}
		// 删除不存在的props
		for(const k in props){
			if(!(k in nextProps)) delete props[k]
		}
	}
}

function hasPropsChanged(prevProps,nextProps){
	const nextKeys = Object.keys(nextProps)
	// 如果旧props的数量变了，则说明有变化
	if(nextKeys.length !== Object.keys(prevProps).length){
		return true
	}
	for(let i=0;i<nextKeys.length;i++){
		const key = nextKeys[i]
		// 有不相等的props, 则说明有变化
		if(nextProps[key] !== prevProps[key]) return true
	}
	return false

}

```

由此可见，vue2和vue3在透传props方面差距是不大的。



