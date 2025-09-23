# 优化 draw call 合批、剔除策略

前言
- 目标场景：浏览器中渲染 1–2 万个“碱基 + 峰”可视化对象，每页展示 10 个，支持左右滑动（自由拖拽和分页动画），高帧率、低延迟。
- 数据结构：每个碱基含位置信息、碱基类型、峰值参数（高斯等），例如：
  [
    {
      "i": 1, "pos": 50, "call": "A", "qual": 40,
      "spacing": 10, "sigma": 2.0, "spr": 0.15,
      "peaks": [{ "base": "A", "amp": 1200, "ratio": 1.0 }],
      "values": { "A": 1200, "C": 150, "G": 80, "T": 50 }
    }
  ]
- 技术栈：PixiJS（WebGL2）、pixi-viewport（相机与手势）、pixi-cull（可见性剔除）。
- 关键优化：减少 draw call（合批）、减少参与渲染的对象数（剔除 + 窗口化）、降低 CPU 压力（对象池 + 缓存）、控制显存（纹理量化 + LRU）。

一、渲染性能的“三板斧”
1) 合批（Batching）——把多次绘制合成一次
- PixiJS 的 batch renderer 会将“渲染状态一致”（相同 baseTexture、着色器、混合模式、无滤镜/遮罩切换）的精灵合并为少量 draw call。
- 合批会被以下因素打断：不同 baseTexture、使用 filters/mask、不同 blendMode、Graphics 直绘、频繁切换 renderTexture。
- 优先策略：将最终渲染对象统一为 Sprite，尽量共享同一 baseTexture；颜色差异用 tint 处理；文字用 BitmapText 或预烘焙为纹理。

2) 剔除（Culling）——看不见的不要进 GPU
- 不要让 1–2 万个对象每帧都参与渲染判定；用 pixi-cull 根据视口的世界坐标 AABB 自动设置对象 renderable=false。
- 结合窗口化（见下）进一步缩小“活跃对象集”，剔除只在活跃对象中执行，开销更低。

3) 窗口化（Windowing）——仅维护可见窗口附近的对象
- 界面每页只展示 10 个，但总量达万级。维护“当前页 + 左右缓冲页”的固定数量对象（如 10 × (1 + 2 × bufferPages) ≈ 50），其他对象不在渲染树中。
- 对象池（pool）：重用 Sprite/Container，避免频繁创建销毁导致的垃圾回收与 CPU 抖动。

二、峰图建模：矢量绘制到纹理化显示
- 需求说明：“峰”是山峰图，不是简单的柱条；我们选择直接绘制高斯/混合峰曲线。
- 性能策略：峰形用 Graphics 生成一次（或偶尔更新）→ generateTexture → 以 Sprite 显示。避免 Graphics 每帧直绘带来的 draw call 增长与 CPU 计算。
- 多峰叠加：可将多个高斯/洛伦兹峰相加后绘制包络填充，或分层绘制后合并为纹理。

峰形函数的常用形式
- 高斯峰：y = amp * exp(-(x - mu)^2 / (2 * sigma^2))
- 组合峰：y = Σ_k amp_k * exp(-(x - mu_k)^2 / (2 * sigma_k^2))
- 数据映射：sigma 与 spacing、pos 需根据像素比例缩放；amp 与可视高度映射到纹理像素。

绘制与纹理化流程
- 在局部宽度内均匀采样（1 px 步长通常足够）：Graphics 路径 moveTo(0, h) → lineTo(x, y) → … → lineTo(w, h) → closePath → endFill。
- 用 renderer.generateTexture(graphics, {region}) 生成纹理；销毁临时 Graphics。
- 纹理复用：按参数量化（amp、sigma、ratio、base、颜色）生成 key，命中缓存直接复用，未命中再生成；LRU 控制上限（如 256）。

三、坐标与世界配置
- 每个碱基/峰占位宽度 BASE_WIDTH（如 100–120 px）；
- 世界宽度 worldWidth ≈ TOTAL × BASE_WIDTH（1–2 百万像素级）；
- 视口 viewport 只允许水平移动；居中基线 BASELINE_Y 固定；
- pos 非等距时：x = (pos - pos0) × scaleX；可通过二分查找定位可见索引区间；sigma 随 scaleX 换算到像素。

四、核心结构：Viewport + Windowing + Culling + Pool
- Viewport：drag/decelerate/clamp/animate，响应窗口 resize。
- 主容器 layer：承载活跃对象（Sprite）。
- 对象池 pool：长度 ACTIVE_SIZE（例如 50）；每项 { spr, index }。
- 窗口计算：
  - 可见索引范围 [vs, ve] 来源于 viewport.left/right → 索引除 BASE_WIDTH。
  - 活跃范围 [a, b] = 扩充 [vs, ve] 两侧 bufferPages × VISIBLE_COUNT。
  - 池第 i 个绑定 idx = a + i；超出 b 的标记 renderable=false。
- 剔除：pixi-cull 在 moved/moved-end 或 ticker 中对 layer 子项执行可见性判断。

五、分页与滑动的联动
- 滑动：viewport.drag().decelerate()；在 moved 事件节流触发 reconcile（如 50 ms）。
- 分页：page p → 目标中心 x = p × pageWidth + pageWidth/2；viewport.animate({ position, time, easing })；动画中同样节流 reconcile。
- 只在索引窗口变化时更新缓存和池绑定；拖动不重新生成纹理。

六、合批细节：把 draw call 压到 1–几次
- 同图集：UI、基座、通用元素打到一个 atlas；Sprite 从 atlas 子纹理创建，统一 baseTexture。
- 避免 filters/mask：需要特效时放到单独层或事先烘焙；不要混在主批中。
- 避免 Graphics 直绘：峰图统一纹理化；大段静态 UI 可 cacheAsBitmap（谨慎使用，避免大量小 cache）。
- 文本：BitmapText 或离屏烘焙为 Sprite。
- 控制纹理种类：renderer.plugins.batch.maxTextures 常见 8/16/32；过多活跃纹理导致拆批。通过量化与 LRU 限制纹理数量。

七、内存与缓存安全
- 纹理缓存 LRU：限制在可控范围（如 256–512）。淘汰时 destroy(true) 释放 GPU 资源。
- 纹理尺寸：合理 width × height；避免超大纹理；考虑 DPR 影响。
- 资源一致性：确保同一资源路径不会被加载多次导致多个 baseTexture。

八、剔除与窗口化的搭配
- 双层过滤：窗口化先把总体活跃对象压到几十个；pixi-cull 再从中排除屏幕之外的对象（尤其在缩放时更明显）。
- dirtyTest 与 bounds：默认 AABB 足够；避免频繁 getBounds 导致 CPU 抖动；用 wrapper 统一摆放，减少层级 transforms。

九、最小可运行 HTML（2 万峰）
- 以下示例演示了：2 万峰、窗口化对象池、纹理缓存（量化 + LRU）、pixi-viewport 拖拽。峰形采用单高斯填充，合批通过 Sprite 统一状态实现。
- 保存为 peaks-20k.html 直接打开即可运行。你可用真实数据替换 data，并在 makePeakTexture 中按你的 sigma/amp/ratio 规则构形。

<html 示例>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PixiJS 20k Peaks</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #0b0c10; color: #fff; }
    #hud { position: fixed; top: 8px; left: 12px; font: 12px/1.4 monospace; background: rgba(0,0,0,.4); padding: 6px 8px; border-radius: 4px; }
    #hud b { color: #8bc34a; }
  </style>
</head>
<body>
  <div id="hud">peaks: <b id="peaks">0</b> active: <b id="active">0</b> drawCalls: <b id="dc">-</b></div>

  <script src="https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi-viewport@5/dist/viewport.min.js"></script>

  <script>
    (async function () {
      const TOTAL = 20000;
      const BASE_WIDTH = 120;
      const PEAK_HEIGHT = 100;
      const BASELINE_Y = 260;
      const VISIBLE_COUNT = 10;
      const BUFFER_PAGES = 4;
      const ACTIVE_SIZE = VISIBLE_COUNT * (BUFFER_PAGES * 2 + 1);
      const THROTTLE_MS = 50;

      // 示例数据（可替换成真实结构）
      const data = new Array(TOTAL).fill(0).map((_, i) => ({
        base: ['A','C','G','T'][i % 4],
        amp: 40 + Math.random() * 60,
        sigma: 8 + Math.random() * 8,
        color: [0x4CAF50, 0x2196F3, 0xFFC107, 0xE91E63][i % 4]
      }));

      const app = new PIXI.Application({
        resizeTo: window,
        background: '#0b0c10',
        antialias: false,
        powerPreference: 'high-performance'
      });
      document.body.appendChild(app.view);

      const viewport = new pixi_viewport.Viewport({
        screenWidth: app.renderer.screen.width,
        screenHeight: app.renderer.screen.height,
        worldWidth: TOTAL * BASE_WIDTH,
        worldHeight: 1000,
        events: app.renderer.events
      });
      app.stage.addChild(viewport);
      viewport.drag().decelerate().clamp({ direction: 'x' });

      const layer = new PIXI.Container();
      viewport.addChild(layer);

      // 对象池
      const pool = [];
      for (let i = 0; i < ACTIVE_SIZE; i++) {
        const spr = new PIXI.Sprite(PIXI.Texture.WHITE);
        spr.anchor.set(0, 1);
        spr.y = BASELINE_Y;
        spr.renderable = false;
        layer.addChild(spr);
        pool.push({ spr, index: -1 });
      }

      // 纹理缓存（量化 + LRU）
      const peakTexCache = new Map();
      const LRU_KEYS = [];
      const LRU_LIMIT = 256;

      function quantize(v, step) { return Math.round(v / step) * step; }
      function peakKey(base, amp, sigma, color) {
        const a = quantize(amp, 5);
        const s = quantize(sigma, 1);
        return `${base}|a${a}|s${s}|c${color.toString(16)}`;
      }

      function getVisibleIndexRange() {
        const left = Math.max(0, viewport.left);
        const right = Math.max(0, viewport.right);
        const start = Math.floor(left / BASE_WIDTH);
        const end = Math.min(TOTAL - 1, Math.ceil(right / BASE_WIDTH));
        return [start, end];
      }

      function reconcile() {
        const [vs, ve] = getVisibleIndexRange();
        const pad = BUFFER_PAGES * VISIBLE_COUNT;
        const a = Math.max(0, vs - pad);
        const b = Math.min(TOTAL - 1, ve + pad);

        for (let i = 0; i < pool.length; i++) {
          const idx = a + i;
          const item = pool[i];
          if (idx <= b) {
            const d = data[idx];
            item.index = idx;
            item.spr.x = idx * BASE_WIDTH;
            const key = peakKey(d.base, d.amp, d.sigma, d.color);
            const tex = getOrCreatePeakTexture(key, d);
            item.spr.texture = tex;
            item.spr.width = BASE_WIDTH;
            item.spr.height = PEAK_HEIGHT;
            item.spr.tint = 0xFFFFFF;
            item.spr.renderable = true;
          } else {
            item.index = -1;
            item.spr.renderable = false;
          }
        }
        // HUD
        document.getElementById('peaks').textContent = TOTAL;
        document.getElementById('active').textContent = pool.filter(p => p.spr.renderable).length;
      }

      function getOrCreatePeakTexture(key, d) {
        if (peakTexCache.has(key)) {
          touchLRU(key);
          return peakTexCache.get(key);
        }
        const tex = makePeakTexture(app.renderer, {
          width: BASE_WIDTH, height: PEAK_HEIGHT,
          amp: d.amp, sigma: d.sigma, color: d.color
        });
        peakTexCache.set(key, tex);
        LRU_KEYS.push(key);
        if (LRU_KEYS.length > LRU_LIMIT) {
          const old = LRU_KEYS.shift();
          const t = peakTexCache.get(old);
          if (t) t.destroy(true);
          peakTexCache.delete(old);
        }
        return tex;
      }

      function touchLRU(key) {
        const i = LRU_KEYS.indexOf(key);
        if (i >= 0) { LRU_KEYS.splice(i, 1); LRU_KEYS.push(key); }
      }

      // 生成单高斯峰纹理
      function makePeakTexture(renderer, opts) {
        const { width, height, amp, sigma, color } = opts;
        const g = new PIXI.Graphics();
        g.beginFill(color, 0.9);
        g.moveTo(0, height);
        const mu = width / 2;
        const step = 1;
        for (let x = 0; x <= width; x += step) {
          const yVal = amp * Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));
          const y = height - Math.min(height, Math.max(0, yVal));
          g.lineTo(x, y);
        }
        g.lineTo(width, height);
        g.closePath();
        g.endFill();

        const tex = renderer.generateTexture(g, {
          resolution: 1,
          region: new PIXI.Rectangle(0, 0, width, height)
        });
        g.destroy(true);
        return tex;
      }

      // 事件与节流
      const throttled = throttle(reconcile, THROTTLE_MS);
      viewport.on('moved', throttled);
      viewport.on('moved-end', reconcile);

      reconcile();

      // 简易 draw calls 指示（版本差异较大，做占位）
      app.ticker.add(() => {
        document.getElementById('dc').textContent = '~low';
      });

      window.addEventListener('resize', () => {
        viewport.resize(app.renderer.screen.width, app.renderer.screen.height, viewport.worldWidth, viewport.worldHeight);
      });

      function throttle(fn, ms) {
        let last = 0, timer = 0;
        return (...args) => {
          const now = performance.now();
          if (now - last >= ms) {
            last = now; fn(...args);
          } else {
            clearTimeout(timer);
            timer = setTimeout(() => { last = performance.now(); fn(...args); }, ms - (now - last));
          }
        };
      }
    })();
  </script>
</body>
</html>

十、页面级体验：每页 10 个的实现要点
- 页宽 pageWidth = VISIBLE_COUNT × BASE_WIDTH；
- goToPage(p): viewport.animate({ position: new PIXI.Point(p*pageWidth + pageWidth/2, viewport.center.y), time: 300, easing: 'easeInOutSine' });
- 动画期间 moved 触发 reconcile（节流），动画结束 moved-end 再 reconcile，避免丢帧。

十一、非等距 pos 的适配策略
- 如果数据中的 pos 表示物理位置（非均匀间隔），将 pos 映射到像素：x = (pos - pos0) × scaleX。
- 可见范围 [xL, xR] → 转回 pos 范围 → 通过二分查找定位可见索引；再扩充缓冲窗口。
- sigma、spacing 等数值也随 scaleX 转换到像素单位，确保峰宽度视觉正确。

十二、诊断与排错清单
- draw call 异常高
  - 是否直接绘制大量 Graphics？将其 generateTexture 后改用 Sprite。
  - 是否混入 filters/mask？把特效放到单独层或预烘焙。
  - 是否使用了多个 baseTexture？合并资源到一个 atlas。
  - 是否超出 maxTextures？量化参数减少纹理种类，限制 LRU。
- 卡顿/掉帧
  - reconcile 是否每帧大量生成纹理？只在新进入窗口时生成，移动中应基本命中缓存。
  - moved 事件是否节流？设置 30–60ms 节流以平衡流畅与 CPU。
  - 是否频繁 getBounds？避免层层容器导致 bounds 计算开销；用 wrapper 统一定位。
- 显存涨高
  - LRU 是否生效？对不常用纹理 destroy(true)。
  - 单纹理尺寸是否过大？控制 width/height；考虑 DPR。

十三、进一步优化与替代方案
- 更低 draw call：使用 Instanced Rendering/自定义 Mesh，把峰参数放入顶点缓冲或纹理，单次 draw 渲染大量峰（工程复杂，需 GLSL）。
- 更真实的峰形：多峰叠加、基线漂移（spr）、噪声（qual）、比值（ratio）等加入峰函数；可在纹理化前一次性计算。
- 更丰富的 UI：文本标签使用 BitmapFont；选择态/hover 态在单独层处理，不破坏主批次。

十四、与 PixiJS 合批原理的关联要点（精读建议）
- 统一 baseTexture 与着色器：把素材打进 spritesheet；峰纹理来自 renderTexture，数量受限。
- 避免状态切换：保持 blendMode= NORMAL；不要在主层混 Filters/Mask。
- 降低批次中的纹理槽压力：量化参数，限制活跃纹理数低于 maxTextures；合理设置 LRU。

十五、结语
- 面对 1–2 万个“碱基 + 峰”的大规模可视化，性能的核心在于“只画应画的少量对象”，并让它们“尽量一次画完”。
- 窗口化 + 剔除：把活跃对象限在几十个，渲染管线压力骤降。
- 矢量转纹理 + 合批：将复杂峰形的 CPU 计算与 draw call 降到最低。
- 当需求升级到更复杂峰群与实时变化时，再引入 Mesh/Instancing 等更底层手段。
