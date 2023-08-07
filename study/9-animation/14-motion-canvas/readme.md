# motion canvas

## 和常规canvas游戏引擎对比
motion-canvas和eva.js pixiJS cocosJS这种互动引擎的对比
- 更强调动画，暂时没有办法对canvas内的node节点进行 点击事件 等事件的监听，如需要监听需要在canvas之外的上册添加分层dom来做，然后对motion-canvas的node节点进行响应操控
- 对程序员的友好的交互，motion-canvas/core和motion-canvas/2d库配合，结合ts的jsx天然支持，可以使布局标签化。
- 更加人性化的动画编辑， 一方面官方集成了一个editor可以对动画实时预览，对时间线注册event来操控，另一方面使用生成器天然的支持timeline的动画。

## 官方库说明

- motion-canvas/core 核心渲染包
- motion-canvas/2d 2d渲染支持的组件包
- motion-canvas/ui 使用preset写的驱动editor的包、可以实时的预览，注册event的操控，render出序列帧动画、视频等功能
- motion-canvas/player 使用customElements自定义了组件`<motion-canvas-player>`播放project
- motion-canvas/vite-plugin 
  - 集成了 motion-canvas/ui 的editor
  - 在vite的插件参数上传入project的能力，以方便editor的驱动
  - 使用vite内置esbuild兼容motion-canvas/2d的jsx语法
  

## 使用

### 1. 生成project

- @motion-canvas/core的makeProject方法，可传入多scene
  - **生成scene**,通过@motion-canvas/2d包makeScene2D方法的返回值， 同样也可以使用new Scene的方式
  
### 2. 使用project

在@motion-canvas/core包app模块里面的stage上面有finalBuffer属性，正好是canvas的dom，进行挂载到dom上面就可以，这里在官方有一个[示例](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L82)

用project 初始化 player 就可以

## 疑问

1. 为什么可以支持jsx
  @motion-canvas/2d部分巧妙的利用了typescript4.1引入的jsxImportSource选项(此功能专门给react17支持的，在这里巧妙了运用了这个特性),jsxImportSource指向本库自己自定义的jsx-runtime那么编译器编译后就引入自己库的jsx来解析

    ```js
    /**
     {
        "compilerOptions": {
          "target": "esnext",
          "module": "commonjs",
          "jsx": "react-jsx",
        }
      }
    */
    "use strict";
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    const jsx_runtime_1 = require("react/jsx-runtime");
    const react_1 = __importDefault(require("react"));
    function App() {
        return (0, jsx_runtime_1.jsx)("h1", { children: "Hello World" });
    }

    /**
     * 
      {
        "compilerOptions": {
          "target": "esnext",
          "module": "es2020",
          "jsx": "react-jsx",
          "jsxImportSource": "@motion-canvas/2d/lib", // 将添加 @motion-canvas/2d/lib/jsx-runtime 作为 _jsx 工厂的导入。
          "skipLibCheck": true,
          "paths": {
            "@motion-canvas/2d/lib/jsx-runtime": ["jsx-runtime.ts"]
          },
        }
      }
    */

    "use strict";
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    const jsx_runtime_1 = require("@motion-canvas/2d/lib/jsx-runtime");
    function App() {
        return (0, jsx_runtime_1.jsx)("h1", { children: "Hello World" });
    }

    ```

    [es-build jsx支持](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/vite-plugin/src/main.ts#L467), 在vite-plugin中对jsx进行了天然的支持配置，使用了vite内置的esbuild进行编译

    在@motion-canvas/create包中，ts选项直接使用ts的编译jsx选项。 js选项，那么必然会自动导入@motion-canvas/vite-plugin包，在vite-plugin包中自定义config使用esbuild的jsxImportSource选项

    参考资料

    - [esbuild - jsxImportSource](https://esbuild.github.io/api/#jsx-import-source)
    - [typescript - jsxImportSource](https://www.typescriptlang.org/tsconfig#jsxImportSource) **@motion-canvas/2d中使用的此选项**
    - [奇技淫巧：通过 jsx-runtime 实现自动使用 classnames / clsx](https://zhuanlan.zhihu.com/p/420248803)
    - [babel- importSource](https://babeljs.io/docs/babel-preset-react#importsource)
    - [react新版本jsx解析，不再转换成React.createElement](https://zh-hans.legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
    - [React 17 JSX 工厂- TypeScript 4.1 通过 jsx 编译器选项的两个新选项支持 React 17 即将推出的 jsx 和 jsxs 工厂函数](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#jsx-factories)
    - [createlement-rfc/text/0000-create-element-changes](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#detailed-design)

1. stage和player之间的关系

  stage和player同时都能设置config[配置](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L256),player要渲染在stage上面，[stage.render(player)](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/player/src/main.ts#L244)

3. player和project的关系
  初始化player的时候可以传入project作为构造参数

4. 如何定制类似于@motion-canvas/2d的组件
  这个功能在[官方文档上有详细的说明](https://motioncanvas.io/docs/custom-components)


## 总结

motion-canvas大致生产流程就是@motion-canvas/2d提供的官方组件或者由motion-canvas/core提供的api自定义一些组件

通过code any editor --产出--> scene --传入--> project --传入--> player --传入--> stage
   
scene由

## 参考资料

[motion-canvas](https://github1s.com/motion-canvas/motion-canvas/blob/HEAD/packages/2d/package.json)