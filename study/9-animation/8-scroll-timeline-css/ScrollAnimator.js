/**
 * ScrollAnimator SDK - CSS Animation Delay 版本
 * 
 * 基于滚动位置的动画引擎，通过动态控制 CSS animation-delay 实现滚动驱动动画
 * 
 * 🎯 核心原理:
 * 1. CSS 定义 @keyframes 动画，设置 animation-play-state: paused (暂停状态)
 * 2. 监听页面滚动事件
 * 3. 根据当前滚动位置计算动画进度 (progress = scrollY / scrollRange)
 * 4. 计算动画应该播放到的时间点 (currentTime = duration * progress)
 * 5. 设置负的 animation-delay 值 (animation-delay = -currentTime)
 * 6. 浏览器会自动将动画渲染到对应的时间帧上
 * 
 * 🧠 关键技术点:
 * - animation-play-state: paused → 动画不会自动播放
 * - animation-delay: -Xs → 代表动画已经播放了 X 秒，浏览器会渲染到该时间点的状态
 * - 通过动态修改 animation-delay，实现"手动拖动"动画进度的效果
 * 
 * 📊 示例:
 * 假设动画时长 duration = 2s，滚动范围 scrollRange = 800px
 * - scroll = 0px   → progress = 0   → currentTime = 0s   → animation-delay: 0s
 * - scroll = 400px → progress = 0.5 → currentTime = 1s   → animation-delay: -1s
 * - scroll = 800px → progress = 1   → currentTime = 2s   → animation-delay: -2s
 * 
 * ✅ 优势:
 * - 利用 CSS 动画引擎，性能更好
 * - 代码更简洁，逻辑更清晰
 * - 可以复用现有的 CSS @keyframes 动画
 * - 支持复杂的多属性动画(transform, opacity, filter 等)
 * - 浏览器硬件加速支持
 * 
 * 📦 使用方式:
 * 1. 在 CSS 中定义 @keyframes 动画
 * 2. 给元素添加 animation 属性，设置 animation-play-state: paused
 * 3. 配置 ScrollAnimator 时指定 animationName 和 duration
 * 
 * @author ScrollAnimator Team
 * @version 2.0.0 (Animation Delay Edition)
 */

class ScrollAnimator {
  /**
   * 构造函数
   * @param {Array} configs - 动画配置数组
   * @param {string} configs[].selector - CSS 选择器
   * @param {number} configs[].scrollStart - 动画开始的滚动位置（px）
   * @param {number} configs[].scrollEnd - 动画结束的滚动位置（px）
   * @param {string} configs[].animationName - CSS 动画名称（对应 @keyframes 中定义的名称）
   * @param {number} configs[].duration - 动画时长（秒）
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
        animationName: a.animationName,
        duration: a.duration,
        scrollStart: a.scrollStart,
        scrollEnd: a.scrollEnd
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
   * 滚动事件处理函数
   * 计算每个动画的当前状态并更新 animation-delay
   * @private
   */
  _onScroll() {
    const scrollY = window.scrollY;

    this.animations.forEach(anim => {
      const { el, scrollStart, scrollEnd, animationName, duration, onEnter, onLeave, onUpdate } = anim;
      if (!el) return;

      // 计算原始进度：当前滚动位置在动画区间中的比例
      let progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
      
      // 限制进度在 [0, 1] 范围内
      progress = Math.min(Math.max(progress, 0), 1);

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
        onUpdate(progress);
      }

      // 🎯 核心逻辑：根据进度计算当前应该处于的动画时间点
      const currentTime = duration * progress;
      
      // 🔑 关键步骤：设置负的 animation-delay
      // 负值表示动画已经播放了这么长时间，浏览器会渲染到对应的时间帧
      el.style.animationDelay = `-${currentTime}s`;

      // 调试模式：输出详细信息
      if (this.debug && progress > 0 && progress < 1) {
        const scrollPercent = ((progress * 100).toFixed(1) + '%').padEnd(6);
        const delayValue = `-${currentTime.toFixed(3)}s`.padEnd(8);
        console.log(
          `[ScrollAnimator] ${anim.selector.padEnd(20)} | ` +
          `progress: ${scrollPercent} | ` +
          `delay: ${delayValue} | ` +
          `scroll: ${Math.round(scrollY)}px`
        );
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
