export default class NumberDifferenceAnimation {
  // 配置
  #config = new Proxy(
    {
      duration: 500, // 动画持续时间，ms
      function: 'linear', // 动画效果，linear: 线性
      ease: 0.3,
      // needTicks: Math.floor(1000 / 16), // 需要的帧数
    },
    {
      get(target, propKey) {
        if(propKey === 'needTicks') {
          return Math.floor(target.duration / 16);
        }

        return target[propKey];
      },
      set(target, propKey, value) {
        if(target.hasOwnProperty(propKey)) {
          target[propKey] = value

          return true;
        }
        return false;
      }
    }
  );
  // 临时状态
  #temp = {
    tickCount: 0, // 帧计数
    deltaValue: 0, // 每次的累计值
    transiting: false, // 过渡中
  };
  constructor(el, val = 0) {
    if(!el) {
      throw new TypeError('not a element');
    }
    this.target = el; // 绑定的元素
    this.currentValue = val; // 当前值
    this.fromValue = val; // 初始值
    this.toValue = val; // 目标值
  }

  // 改变值
  changeValue(number, type = 'linear') {
    number = +number;
    if(Number.isNaN(number)) {
      throw new TypeError('not a number');
    }
    this.fromValue = this.currentValue;
    this.toValue = number;

    // 线性
    if(type === 'linear') {
      this.#temp.tickCount = this.#config.needTicks;
      this.#temp.deltaValue = (this.toValue - this.fromValue) / this.#temp.tickCount;
      this.#temp.transiting = true;
      this.linearTick();
    } else if(type === 'ease') {
      this.#temp.transiting = true;
      this.easeTick();
    }
  }

  // 数字格式化并输出
  valueFormatter(value) {
    this.target.innerText = value.toFixed(2);
  }

  // 线性帧改变
  linearTick() {
    this.currentValue += this.#temp.deltaValue;
    this.valueFormatter(this.currentValue);

    this.#temp.tickCount--;
    if(this.#temp.tickCount > 0) {
      return requestAnimationFrame(this.linearTick.bind(this));
    } else {
      this.valueFormatter(this.toValue);
      this.currentValue = this.toValue;
      this.#temp.transiting = false;
    }
  }

  // 缓动帧改变
  easeTick() {
    this.#temp.deltaValue = (this.toValue - this.currentValue) * this.#config.ease;
    this.currentValue += this.#temp.deltaValue;
    this.valueFormatter(this.currentValue);

    if(Math.abs(this.#temp.deltaValue) > 0.1) {
      return requestAnimationFrame(this.easeTick.bind(this));
    } else {
      this.valueFormatter(this.toValue);
      this.currentValue = this.toValue;
      this.#temp.transiting = false;
    }
  }
}