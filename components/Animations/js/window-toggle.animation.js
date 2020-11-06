export default class WindowToggleAnimation {
  #dragging = false; // 是否可拖动
  #currentDraggingEvent = null; // 当前的拖动回调函数
  #mouseStartPosition = null; // 开始拖动时的鼠标位置
  #draggingTick = null; // 拖动帧
  #currentTargetPosition = null; // 当前元素的位置
  #isMinimized = false; // 是否是最小化
  constructor(el) {
    if (!el) {
      throw new TypeError('not a element');
    }
    this.target = el; // 绑定的元素
    this.generateStyle();
    this.getCurrentTargetPosition();
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
  toggle() {
    if (this.#isMinimized) { // 还原
      this.target.classList.add('transition');
      this.target.style.left = this.#currentTargetPosition.left;
      this.target.style.top = this.#currentTargetPosition.top;
      // this.target.style.width = '';
      // this.target.style.height = '';
      this.target.style.transform = 'scale(1, 1)';

      this.target.ontransitionend = ev => {
        this.target.classList.remove('transition');
        this.target.ontransitionend = null;
      };

    } else { // 最小化
      this.target.classList.add('transition');
      this.target.style.left = window.innerWidth - this.target.offsetWidth * 0.2 - 20 + 'px';
      this.target.style.top = window.innerHeight - this.target.offsetHeight * 0.2 - 20 + 'px';
      // this.target.style.width = '50px';
      // this.target.style.height = '50px';
      this.target.style.transform = 'scale(0.2, 0.2)';

      this.target.ontransitionend = ev => {
        this.target.classList.remove('transition');
        this.target.ontransitionend = null;

        const style = window.getComputedStyle(this.target);
        this.target.style.left = style.left;
        this.target.style.top = style.top;
      };
    }

    this.#isMinimized = !this.#isMinimized;
  }

  // 生成class
  generateStyle() {
    const style = document.createElement('style');
    style.innerHTML = `
      .base-window {
        overflow: hidden;
        transform-origin: left top;
      }
      .transition {
        transition: all 1000ms;
        transition-timing-function: ease;
      }
    `;
    document.head.append(style);
    this.target.classList.add('base-window');
  }

  get dragging() {
    return this.#dragging;
  }

  get isMinimized() {
    return this.#isMinimized;
  }
}