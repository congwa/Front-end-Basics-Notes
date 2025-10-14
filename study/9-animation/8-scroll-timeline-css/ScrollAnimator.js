/**
 * ScrollAnimator SDK
 * 
 * 基于滚动位置的动画引擎，通过配置驱动实现滚动触发的动画效果
 * 
 * 核心原理：
 * 1. 监听页面滚动事件
 * 2. 根据当前滚动位置计算动画进度（0-1之间）
 * 3. 使用线性插值（lerp）在起始值和结束值之间计算当前帧的属性值
 * 4. 应用 transform 和 opacity 等 CSS 属性实现动画效果
 * 5. 使用 requestAnimationFrame 优化性能，避免频繁重绘
 * 
 * 优势：
 * - 完全 JS 控制，无需编写 CSS 动画
 * - 配置化驱动，易于维护和复用
 * - 支持多种缓动函数（easing）
 * - 高性能：使用 RAF 节流
 * - 可扩展：支持回调、自定义缓动等
 * 
 * @author ScrollAnimator Team
 * @version 1.0.0
 */

class ScrollAnimator {
  /**
   * 构造函数
   * @param {Array} configs - 动画配置数组
   * @param {string} configs[].selector - CSS 选择器
   * @param {number} configs[].scrollStart - 动画开始的滚动位置（px）
   * @param {number} configs[].scrollEnd - 动画结束的滚动位置（px）
   * @param {Object} configs[].keyframes - 关键帧配置
   * @param {Object} configs[].keyframes.from - 起始状态 { x, y, scale, rotate, opacity }
   * @param {Object} configs[].keyframes.to - 结束状态 { x, y, scale, rotate, opacity }
   * @param {string} [configs[].easing] - 缓动函数类型（'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut'）
   * @param {Function} [configs[].onEnter] - 进入动画区域时的回调
   * @param {Function} [configs[].onLeave] - 离开动画区域时的回调
   * @param {Function} [configs[].onUpdate] - 动画更新时的回调，参数为 progress (0-1)
   * @param {Object} options - 全局配置选项
   * @param {boolean} [options.debug=false] - 是否开启调试模式
   * @param {boolean} [options.autoInit=true] - 是否自动初始化
   */
  constructor(configs = [], options = {}) {
    // 解析配置，查找对应的 DOM 元素
    this.animations = configs.map(cfg => ({
      el: document.querySelector(cfg.selector),
      ...cfg,
      _isInRange: false // 内部状态：是否在动画范围内
    })).filter(a => a.el); // 过滤掉未找到元素的配置

    this.debug = options.debug || false;
    this.autoInit = options.autoInit !== false;
    
    // 绑定滚动处理函数的上下文
    this._onScroll = this._onScroll.bind(this);
    this._rafId = null; // requestAnimationFrame ID
    
    if (this.autoInit) {
      this._init();
    }
  }

  /**
   * 初始化动画系统
   * 绑定滚动事件监听器
   * @private
   */
  _init() {
    if (this.debug) {
      console.log('[ScrollAnimator] 初始化动画数量:', this.animations.length);
      console.table(this.animations.map(a => ({
        selector: a.selector,
        scrollStart: a.scrollStart,
        scrollEnd: a.scrollEnd,
        easing: a.easing || 'linear'
      })));
    }

    // 使用 RAF 优化滚动性能
    window.addEventListener('scroll', () => {
      if (!this._rafId) {
        this._rafId = requestAnimationFrame(() => {
          this._onScroll();
          this._rafId = null;
        });
      }
    }, { passive: true }); // passive 提升滚动性能

    this._onScroll(); // 首次渲染，确保初始状态正确
  }

  /**
   * 线性插值函数
   * 在两个值之间根据进度 t 进行插值
   * @param {number} a - 起始值
   * @param {number} b - 结束值
   * @param {number} t - 进度 (0-1)
   * @returns {number} 插值结果
   * @private
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * 缓动函数：easeInOut（二次方）
   * 开始和结束时缓慢，中间加速
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   * @private
   */
  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * 缓动函数：easeIn（二次方）
   * 开始缓慢，逐渐加速
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   * @private
   */
  _easeIn(t) {
    return t * t;
  }

  /**
   * 缓动函数：easeOut（二次方）
   * 开始快速，逐渐减速
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   * @private
   */
  _easeOut(t) {
    return t * (2 - t);
  }

  /**
   * 应用缓动函数
   * @param {number} progress - 原始进度 (0-1)
   * @param {string} easingType - 缓动类型
   * @returns {number} 缓动后的进度
   * @private
   */
  _applyEasing(progress, easingType) {
    switch (easingType) {
      case 'ease':
      case 'easeInOut':
        return this._easeInOutQuad(progress);
      case 'easeIn':
        return this._easeIn(progress);
      case 'easeOut':
        return this._easeOut(progress);
      case 'linear':
      default:
        return progress;
    }
  }

  /**
   * 滚动事件处理函数
   * 计算每个动画的当前状态并更新 DOM
   * @private
   */
  _onScroll() {
    const scrollY = window.scrollY;

    this.animations.forEach(anim => {
      const { el, scrollStart, scrollEnd, keyframes, easing, onEnter, onLeave, onUpdate } = anim;
      if (!el) return;

      // 计算原始进度：当前滚动位置在动画区间中的比例
      let progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
      
      // 限制进度在 [0, 1] 范围内
      progress = Math.min(Math.max(progress, 0), 1);

      // 应用缓动函数
      const t = this._applyEasing(progress, easing || 'linear');

      // 检测是否进入/离开动画区域（用于触发回调）
      const isInRange = progress > 0 && progress < 1;
      if (isInRange && !anim._isInRange && onEnter) {
        onEnter(el);
      } else if (!isInRange && anim._isInRange && onLeave) {
        onLeave(el);
      }
      anim._isInRange = isInRange;

      // 触发更新回调
      if (onUpdate) {
        onUpdate(progress, t);
      }

      // 从 keyframes 中提取起始和结束值
      const kf = keyframes;
      
      // 计算当前帧的各个属性值
      const tx = this._lerp(kf.from.x || 0, kf.to.x || 0, t);
      const ty = this._lerp(kf.from.y || 0, kf.to.y || 0, t);
      const sc = this._lerp(kf.from.scale || 1, kf.to.scale || 1, t);
      const rt = this._lerp(kf.from.rotate || 0, kf.to.rotate || 0, t);
      const op = this._lerp(kf.from.opacity ?? 1, kf.to.opacity ?? 1, t);

      // 应用样式到 DOM 元素
      el.style.transform = `
        translate(${tx}px, ${ty}px)
        scale(${sc})
        rotate(${rt}deg)
      `;
      el.style.opacity = op;

      // 调试模式：输出详细信息
      if (this.debug && Math.abs(progress - 0.5) < 0.01) { // 只在中间位置输出，避免刷屏
        console.log(`[ScrollAnimator] ${anim.selector} - progress: ${progress.toFixed(2)}, t: ${t.toFixed(2)}`);
      }
    });
  }

  /**
   * 销毁动画系统
   * 移除事件监听器，清理资源
   * @public
   */
  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this.debug) {
      console.log('[ScrollAnimator] 已销毁');
    }
  }

  /**
   * 手动触发更新
   * 用于在非滚动场景下手动刷新动画状态
   * @public
   */
  update() {
    this._onScroll();
  }

  /**
   * 添加新的动画配置
   * @param {Object} config - 动画配置对象
   * @public
   */
  addAnimation(config) {
    const el = document.querySelector(config.selector);
    if (el) {
      this.animations.push({
        el,
        ...config,
        _isInRange: false
      });
      if (this.debug) {
        console.log('[ScrollAnimator] 添加新动画:', config.selector);
      }
    }
  }

  /**
   * 移除指定选择器的动画
   * @param {string} selector - CSS 选择器
   * @public
   */
  removeAnimation(selector) {
    const index = this.animations.findIndex(a => a.selector === selector);
    if (index !== -1) {
      this.animations.splice(index, 1);
      if (this.debug) {
        console.log('[ScrollAnimator] 移除动画:', selector);
      }
    }
  }
}

// 支持 ES6 模块和传统脚本标签
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollAnimator;
}
