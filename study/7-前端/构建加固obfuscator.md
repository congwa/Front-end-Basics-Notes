# Vite 代码加固：vite-plugin-javascript-obfuscator 技术要点

目标：

- 在构建阶段对前端产物进行混淆，提升逆向成本。
- 避免对现网运行与调试产生不可控影响。

可优化内容：

- 变量重命名。
- 字符串提取和加密。
- 死代码注入。
- 控制流平坦化。
- 各种代码转换。
- [more...](https://github.com/javascript-obfuscator/javascript-obfuscator?tab=readme-ov-file#javascript-obfuscator-options)

## 1. 工作原理（基于源码与文档）

- 插件阶段：
  - Vite 插件以 `enforce: 'post'` 参与 `transform`，在其他插件/编译（TS、Babel、esbuild、define/替换等）之后调用。
  - 匹配控制：`include`/`exclude` 使用 anymatch（字符串、glob、正则、函数），默认 `include: /\.(jsx?|tsx?|cjs|mjs)$/`，`exclude: /node_modules|\.nuxt/`。
  - 匹配路径归一化：字符串模式会被 `resolve('.', matcher)` 转为项目根相对的绝对路径（且路径分隔符正则化为 `/`），要注意你的匹配应与构建产物路径对应。
  - 混淆实现：命中文件后调用 `javascript-obfuscator.obfuscate(src, options)`，返回混淆后的 `code`，以及可选 `map`。
  - Source map：当 `options.sourceMap === true` 且 `options.sourceMapMode !== 'inline'` 时，插件返回 `result.map`（字符串），交由 Vite 继续处理。
  - 触发时机：`apply` 可限制在 `build`/`serve` 或使用函数判断（如排除 SSR 构建）。
- 产出形态：对模块源代码进行 AST 混淆变换，可能插入运行时代码（字符串数组、控制流扁平等）。

## 2. 与压缩的区别

- 压缩（minify/uglify/terser）：主要做去空格、改名、折叠，目标是体积与性能。
- 混淆（obfuscation）：通过控制流扁平、字符串数组、编码等手段，显著增加可读性与可逆向难度，目标是提高逆向成本。
- 两者可叠加，但混淆会增加体积与构建/运行开销。

## 3. 优点

- 增加逆向成本：白盒场景（浏览器侧）对关键逻辑做混淆，降低脚本小偷复制代码的可读性。
- 选择性混淆：`include`/`exclude` 精准控制，尽量只混淆敏感业务模块。
- 与 Vite 生态兼容：后置 `transform`，不破坏常规编译链。
- 可选 source map：配合 `build.sourcemap: 'hidden'` 做内部问题定位。

## 4. 缺点与风险

- 构建时间与产物体积显著增加（控制流扁平、字符串数组、编码最明显）。
- 运行时性能下降（热路径/渲染关键路径慎用；老旧移动端影响更大）。
- 调试困难：即便有 source map，运行时堆栈与定位成本依然升高。
- 兼容性问题：
  - 已知问题：有用户反馈构建后 `import.meta.env` 读取异常（参考仓库 issue）。避免对依赖运行时常量替换/环境变量读取的模块做激进混淆，或关闭会影响对象属性/全局名的开关（如 `transformObjectKeys`/`renameGlobals`）。
  - 对第三方库混淆可能破坏其内部约定（反射、字符串键访问、全局符号等）。
  - 某些策略（如 `debugProtection`）可能影响 DevTools 或引发监控 JS 注入不稳定。
- 安全边界：混淆不是安全措施，敏感信息不能放在前端。算法/密钥请转移到服务端或以更稳妥的形式（如 wasm + 动态策略）处理。
- CSP/监控/埋点：字符串数组与运行时代码注入可能与严格 CSP 或监控注入策略冲突。

## 5. 适用边界与使用建议

- 适合混淆的目标：业务核心算法、反作弊逻辑、风控规则触发点、付费逻辑的关键拼接/判定。
- 不建议混淆：
  - 第三方依赖与 polyfill。
  - 与 `import.meta.env` 强耦合、框架引导（bootstrap）的入口文件。
  - 热路径（渲染主流程、频繁执行的 hooks/指令）。
- SSR/Node 侧：浏览器混淆对 SSR、Node 产物意义有限，建议通过 `apply` 函数排除 SSR 构建。
- Web Worker/Service Worker：需要额外测试（消息传递、缓存键名、scope 影响）。

## 6. 推荐配置（基线与严格）

- 基线（生产可用，尽量平衡体积/性能/稳定性）：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'

export default defineConfig(({ command, mode, ssrBuild }) => ({
  build: {
    // 建议 hidden：产出 sourcemap 供排查，但不暴露给浏览器
    sourcemap: 'hidden',
  },
  plugins: [
    obfuscatorPlugin({
      apply: (config, env) => env.command === 'build' && !env.ssr,
      include: ['src/**/*.js', 'src/**/*.ts', /src\\/features\\/secure\\/.+\\.(t|j)sx?$/],
      exclude: [
        /node_modules/,
        /vendor/,
        /polyfill/,
        // 排除入口与强依赖 env 的文件，降低 import.meta/env 风险
        /src\\/main\\.(t|j)s$/,
        /src\\/env\\.(t|j)s$/,
      ],
      options: {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        stringArray: true,
        stringArrayThreshold: 0.1,
        rotateStringArray: true,
        renameGlobals: false,
        transformObjectKeys: false,
        numbersToExpressions: false,
        simplify: true,
        // 慎用 debugProtection/selfDefending，会影响调试与监控
        debugProtection: false,
        selfDefending: false,
        // 源图仅用于内部排查
        sourceMap: true,
        sourceMapMode: 'separate',
      },
      debugger: false, // 如需排查匹配路径可临时置 true
    }),
  ],
}))
```

- 严格（更强混淆，注意构建/运行开销与兼容性）：

```ts
options: {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.8,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  stringArray: true,
  stringArrayThreshold: 1.0,
  stringArrayEncoding: ['base64'], // rc4 更重
  splitStrings: true,
  splitStringsChunkLength: 8,
  rotateStringArray: true,
  unicodeEscapeSequence: false,
  renameGlobals: false,            // 谨慎开启，易破坏全局
  transformObjectKeys: false,      // 谨慎开启，易破坏动态属性访问
  simplify: true,
  numbersToExpressions: true,
  // 高风险：可能影响 DevTools/监控脚本
  debugProtection: false,
  debugProtectionInterval: false,
  selfDefending: false,
  sourceMap: true,
  sourceMapMode: 'separate',
}
```

## 7. 与 Vite/Source Map 的协同

- 若要内部排查问题：
  - `build.sourcemap: 'hidden'`，插件 `options.sourceMap: true`、`sourceMapMode: 'separate'`。
  - CI 打包工件保留 `.map`，CDN 不下发到客户端。
- 若要最大化隐藏细节：
  - 关闭 source map（插件与 Vite 同时关闭），但故障定位成本上升。
- 注意：obfuscator 的 `inline` 模式不建议在生产使用（易泄露）。

## 8. 常见问题与定位

- 白屏/运行异常：
  - 临时将 `debugger: true`，查看命中/排除的文件路径。
  - 先缩小 `include` 范围，仅混淆单个目录或文件，逐步扩大。
  - 关闭高危开关（`controlFlowFlattening`、`deadCodeInjection`、`stringArrayEncoding: 'rc4'`、`renameGlobals`、`transformObjectKeys'`）。
- 环境变量/运行时常量异常：
  - 确保混淆发生在变量替换之后（插件已 `post`）；若仍异常，排除入口与运行时配置模块。
- 体积/耗时过大：
  - 仅混淆敏感模块；降低阈值；关闭控制流扁平与死代码注入；调低 `stringArrayThreshold`。
- 监控/安全策略冲突：
  - 检查 CSP/监控脚本注入；禁用 `debugProtection`、`selfDefending`。

## 9. 生产落地建议

- 只在 `build` 环境启用，`serve` 禁用。
- 只混淆必要模块，持续基准测试构建时间与首屏性能。
- 与错误上报配合（建议 `hidden sourcemap`），保障可定位。
- 和安全策略统一评审（CSP、监控注入、A/B 开关）。
- 对 SSR 构建显式禁用（`apply` 函数判定 `!env.ssr`）。

## 10. 结论

- 该插件通过 `transform` 阶段调用 javascript-obfuscator 对命中模块进行混淆，适合作为“提高逆向成本”的一道工序。
- 建议“点状混淆、禁用激进选项、仅在生产构建启用、配合 hidden sourcemap 保障可运维”。
- 任何敏感逻辑与密钥不能依赖混淆来“保密”，需从架构层面解决（服务端/鉴权/策略/风控）。


