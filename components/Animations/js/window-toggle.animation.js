export default class WindowToggleAnimation {
  #dragging = false; // 是否可拖动
  #currentDraggingEvent = null; // 当前的拖动回调函数
  #mouseStartPosition = null; // 开始拖动时的鼠标位置
  #draggingTick = null; // 拖动帧
  #currentTargetPosition = null; // 当前元素的位置
  #isMinimized = false; // 是否是最小化
  #showMask = false; // 是否显示遮罩
  #transiting = false; // 正在动画中
  constructor(el) {
    if (!el) {
      throw new TypeError('not a element');
    }
    this.target = el; // 绑定的元素
    this.generateStyle();
    this.getCurrentTargetPosition();
    this.mask = this.createMask(); // 遮罩
  }

  // 创建包裹元素
  createWrapper() {
    const wrapper = document.createElement('div');
    document.body.replaceChild(wrapper, this.target);
    wrapper.append(this.target);

    return wrapper;
  }

  // 创建最小化后的遮罩
  createMask() {
    const mask = document.createElement('div');
    mask.className = 'window-mask none';
    mask.onclick = () => this.toggle(false);
    this.target.append(mask);

    return mask;
  }

  // 切换显示遮罩
  toggleMask(status) {
    if (this.#transiting) return;
    this.#showMask = status ?? !this.#showMask;

    if (this.#showMask) { // 显示
      this.mask.classList.remove('none');
      setTimeout(() => {
        this.mask.classList.add('fade-show');
      });

    } else {
      this.mask.classList.remove('fade-show');
      this.mask.classList.add('fade-hidden');

      this.mask.ontransitionend = ev => {
        this.mask.classList.add('none');
        this.mask.classList.remove('fade-hidden');
        this.mask.ontransitionend = null;
      };
    }
  }

  // 计算当前元素额的位置，并设置值
  getCurrentTargetPosition() {
    const style = window.getComputedStyle(this.target);
    this.#currentTargetPosition = {
      left: style.left,
      top: style.top,
      // right: style.right,
      // bottom: style.bottom,
    };
    this.target.style.left = style.left;
    this.target.style.top = style.top;
    // this.target.style.right = style.right;
    // this.target.style.bottom = style.bottom;
  }

  // 拖动事件
  draggingEvent(ev) {
    this.draggingTick(ev);
  }

  // 拖动帧
  draggingTick(ev) {
    if (this.#draggingTick) {
      window.cancelAnimationFrame(this.#draggingTick);
    }
    this.#draggingTick = window.requestAnimationFrame(() => {
      if (this.#mouseStartPosition) {
        const rpx = ev.pageX - this.#mouseStartPosition[0];
        const rpy = ev.pageY - this.#mouseStartPosition[1];

        this.target.style.left = rpx + 'px';
        this.target.style.top = rpy + 'px';
      }
      this.#draggingTick = null;
    });
  }

  // 开始拖动  
  startDragging(x, y) {
    if (this.#isMinimized) return;

    if (this.#dragging) {
      this.stopDragging();
    }
    this.#dragging = true;
    this.#mouseStartPosition = [x - this.target.offsetLeft, y - this.target.offsetTop];
    document.documentElement.style.cursor = 'move';
    this.#currentDraggingEvent = this.draggingEvent.bind(this);
    document.addEventListener('mousemove', this.#currentDraggingEvent);
  }

  // 结束拖动
  stopDragging() {
    this.#dragging = false;
    this.#mouseStartPosition = null;
    document.documentElement.style.cursor = '';
    document.removeEventListener('mousemove', this.#currentDraggingEvent);
    this.#currentDraggingEvent = null;

    this.getCurrentTargetPosition(); // 更新位置
  }

  // 最小化/还原
  toggle(status) {
    if (this.#transiting) return;
    this.#isMinimized = status ?? !this.#isMinimized;
    this.toggleMask();

    this.#transiting = true;
    if (!this.#isMinimized) { // 还原
      this.target.classList.add('window-transition');
      this.target.style.left = this.#currentTargetPosition.left;
      this.target.style.top = this.#currentTargetPosition.top;
      // this.target.style.width = '';
      // this.target.style.height = '';
      this.target.style.transform = 'scale(1, 1)';

      this.target.ontransitionend = ev => {
        this.target.classList.remove('window-transition');
        this.target.ontransitionend = null;
        this.#transiting = false;
      };

    } else { // 最小化
      this.target.classList.add('window-transition');
      this.target.style.left = window.innerWidth - this.target.offsetWidth * 0.2 - 20 + 'px';
      this.target.style.top = window.innerHeight - this.target.offsetHeight * 0.2 - 20 + 'px';
      // this.target.style.width = '50px';
      // this.target.style.height = '50px';
      this.target.style.transform = 'scale(0.2, 0.2)';

      this.target.ontransitionend = ev => {
        this.target.classList.remove('window-transition');
        this.target.ontransitionend = null;
        this.#transiting = false;

        const style = window.getComputedStyle(this.target);
        this.target.style.left = style.left;
        this.target.style.top = style.top;
      };
    }
  }

  // 生成class
  generateStyle() {
    const style = document.createElement('style');
    style.innerHTML = `
      .window-wrapper {
        perspective: 500px;
        transform-style: preserve-3d;
      }
      .base-window {
        position: fixed;
        overflow: hidden;
        transform-origin: left top;
      }
      .window-mask {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: all 500ms;
        opacity: 0;
      }
      .window-transition {
        transition: all 500ms;
        transition-timing-function: ease;
      }
    `;
    document.head.append(style);
    this.target.classList.add('base-window');
    this.target.parentNode.classList.add('window-wrapper');
  }

  get dragging() {
    return this.#dragging;
  }

  get isMinimized() {
    return this.#isMinimized;
  }

  get showMask() {
    return this.#showMask;
  }
}