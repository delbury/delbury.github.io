// 音频分析用 canvas 基类

export class BaseCanvas {
  constructor(canvas, { width, height = 280, scalable = false, waveType = '' } = {}, state = {}) {
    if (!canvas || canvas.tagName !== 'CANVAS') {
      throw new TypeError('first param must be a canvas element');
    }
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.ratio = window.devicePixelRatio;
    this.baseWidth = width || canvas.parentNode.offsetWidth;
    this.baseHeight = height;
    this.canvas.style.width = this.baseWidth + 'px';
    this.canvas.style.height = this.baseHeight + 'px';
    this.canvas.width = this.baseWidth * this.ratio;
    this.canvas.height = this.baseHeight * this.ratio;
    this.ctx.scale(this.ratio, this.ratio);

    this.canvasOption = {
      lineWidth: 1,
      strokeStyle: '#333',
    };
    this.state = {
      x: 0,
      y: 0,
      scalable,
      spaceDown: false,
      scaleX: 1, // 频域横坐标，表示频率缩放，乘法，1~Infinity
      scaleY: 0, // 时域纵坐标，表示幅值缩放，加法，0~0.4
      waveType,
      currentData: null,
      peakValley: null,
      running: false,
      ...state,
    };

    this.bindEvents();
  }

  // 开始绘制
  start() {
    this.running = true;

    // 波形累积图初始参数
    this.beforeDrawTimeWaveOverTime();
  }

  // 结束绘制
  stop() {
    this.running = false;
    if (this.state.waveType === 'freq') {
      this.calcPeakValue(this.state.currentData);
    }
  }

  // 创建提示框和提示线
  createTip() {
    this.toolline = document.createElement('div');
    this.toolline.className = 'canvas-line none';
    this.toolline.style.height = `calc(100% - ${this.yParams.offset || 0}px)`;

    this.toolcircle = document.createElement('div');
    this.toolcircle.className = 'canvas-line-circle';
    this.toolline.appendChild(this.toolcircle);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'canvas-tip none';

    this.canvas.parentNode.appendChild(this.tooltip);
    this.canvas.parentNode.appendChild(this.toolline);
  }

  // 清除数据
  clearData() {
    this.running = false;
    this.state.currentData = null;
    this.state.peakValley = null;
  }

  // 筛选基波、谐波频率功率
  filterFreqDb(baseFreq) {
    const pv = this.state.peakValley;
    if (!pv) {
      return;
    }
    const temp = [];
    let count = 1;
    for (let i = 0, len = pv.length; i < len - 1; i++) {
      // 筛选最接近的频率峰
      const freq = count * baseFreq;
      if (freq >= pv[i].freq && freq < pv[i + 1].freq) {
      }
    }
  }

  // 计算峰值
  calcPeakValue(data) {
    const arr = [];
    const dy = (this.yParams.max - this.yParams.min) / 255;
    const fn = (i) => {
      return {
        index: i,
        value: data[i],
        db: dy * data[i] + this.yParams.min,
        freq: (i / data.length) * this.xParams.max,
        x: (i / data.length) * (this.baseWidth - this.xParams.offset) * this.state.scaleX + this.xParams.offset,
        y: (this.baseHeight - this.yParams.offset) * (1 - data[i] / 255),
      };
    };
    for (let i = 0, len = data.length; i < len - 1; i++) {
      if (i === 0) {
        arr.push(fn(i));
      } else if (
        (data[i - 1] <= data[i] && data[i] > data[i + 1]) ||
        (data[i - 1] < data[i] && data[i] >= data[i + 1])
        // (data[i - 1] >= data[i] && data[i] < data[i + 1]) ||
        // (data[i - 1] > data[i] && data[i] <= data[i + 1])
      ) {
        arr.push(fn(i));
      }
    }
    this.state.peakValley = arr;
  }

  // 绑定事件
  bindEvents() {
    // 鼠标移入事件
    this._onmouseenter = (ev) => {
      if (this.state.currentData) {
        this.tooltip.classList.remove('none');
        this.toolline.classList.remove('none');
      }
    };

    // 鼠标移出事件
    this._onmouseleave = (ev) => {
      this.tooltip.classList.add('none');
      this.tooltip.style.top = '';
      this.tooltip.style.left = '';

      this.toolline.classList.add('none');
      this.toolline.style.top = '';
      this.toolline.style.left = '';
    };

    // 鼠标移动事件
    this._onmousemove = (ev) => {
      // 节流
      if (this.throttle) {
        return;
      }
      this.throttle = true;
      setTimeout(() => {
        this.throttle = false;
      }, 30);
      this.state.x = ev.offsetX;
      this.state.y = ev.offsetY;

      // 绘制 tooltip
      if (!this.state.currentData) {
        return this.tooltip.classList.add('none');
      } else {
        this.tooltip.classList.remove('none');
      }

      const tipOffsetX = 20;
      const tipOffsetY = -30;

      this.toolline.style.top = '0px';
      // 设置提示线为离鼠标最近的数据
      let temp = {};
      if (this.state.peakValley) {
        // 左侧
        if (ev.offsetX <= this.state.peakValley[0].x) {
          temp = this.state.peakValley[0];
          // 右侧
        } else if (ev.offsetX >= this.state.peakValley[this.state.peakValley.length - 1].x) {
          temp = this.state.peakValley[this.state.peakValley.length - 1];
          // 中间
        } else {
          for (let i = 1, len = this.state.peakValley.length - 1; i < len; i++) {
            if (this.state.peakValley[i].x >= ev.offsetX) {
              temp = this.state.peakValley[i];
              break;
            }
          }
        }
        this.toolcircle.style.top = temp.y + 'px';
      }

      // 设置提示线位置
      if (ev.offsetX <= this.xParams.offset) {
        this.toolline.style.left = this.xParams.offset + 'px';
      } else {
        this.toolline.style.left = (temp.x || ev.offsetX) + 'px';
      }

      // 计算提示框的 y 轴坐标
      if (ev.offsetY + tipOffsetY > 10) {
        this.tooltip.style.top = ev.offsetY + tipOffsetY + 'px';
      } else {
        this.tooltip.style.top = '10px';
      }

      // 计算提示框的 x 轴坐标
      if (ev.offsetX + this.tooltip.offsetWidth + tipOffsetX - this.tooltip.parentNode.offsetWidth < 10) {
        this.tooltip.style.left = ev.offsetX + tipOffsetX + 'px';
      } else {
        this.tooltip.style.left = this.tooltip.parentNode.offsetWidth - this.tooltip.offsetWidth - 10 + 'px';
      }

      // 计算值
      if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
        this.tooltip.innerHTML = '暂无数据';
      } else if (this.state.waveType === 'freq') {
        this.tooltip.innerHTML = `
            <div class="msg"><span>db: </span><span>${(temp.db || 0).toFixed(2)}</span></div>
            <div class="msg"><span>freq: </span><span>${(temp.freq || 0).toFixed(2)}</span></div>
          `;
      }
    };

    // 按下按键
    this._onkeydown = (ev) => {
      if (ev.keyCode === 32) {
        ev.preventDefault();
        this.state.spaceDown = true;
      }
    };

    // 松开按键
    this._onkeyup = (ev) => {
      if (ev.keyCode === 32) {
        ev.preventDefault();
        this.state.spaceDown = false;
      }
    };

    // 滚轮事件
    this._onwheel = (ev) => {
      if (this.state.scalable && this.state.spaceDown) {
        ev.preventDefault();
        const ds = 0.5;
        const dd = 0.1;

        // 下滚，缩小
        if (ev.wheelDeltaY < 0) {
          if (this.state.waveType === 'freq') {
            if (this.state.scaleX - ds <= 1) {
              this.state.scaleX = 1;
            } else {
              this.state.scaleX -= ds;
            }
          } else if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
            if (this.state.scaleY - dd <= 0) {
              this.state.scaleY = 0;
            } else {
              this.state.scaleY -= dd;
            }
          }

          // 放大
        } else if (ev.wheelDeltaY > 0) {
          if (this.state.waveType === 'freq') {
            this.state.scaleX += ds;
          } else if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
            if (this.state.scaleY + dd >= 0.9) {
              this.state.scaleY = 0.9;
            } else {
              this.state.scaleY += dd;
            }
          }
        }
        this.state.scaleX = Math.round(this.state.scaleX * 100) / 100;

        if (this.state.currentData && this.state.waveType) {
          if (this.state.peakValley) {
            this.calcPeakValue(this.state.currentData);
          }
          if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
            this.drawTimeWave(this.state.currentData);
          } else if (this.state.waveType === 'freq') {
            this.drawFreqWave(this.state.currentData);
          }
        } else {
          this.drawCoordinateSystem();
        }
      }
    };

    this.canvas.addEventListener('mousemove', this._onmousemove);
    this.canvas.addEventListener('wheel', this._onwheel, { passive: false });
    this.canvas.addEventListener('mouseenter', this._onmouseenter);
    this.canvas.addEventListener('mouseleave', this._onmouseleave);
    document.addEventListener('keydown', this._onkeydown);
    document.addEventListener('keyup', this._onkeyup);
  }

  // 移除事件
  removeEvents() {
    this._onmousemove && this.canvas.removeEventListener('mousemove', this._onmousemove);
    this._onwheel && this.canvas.removeEventListener('wheel', this._onwheel);
    this._onmouseenter && this.canvas.removeEventListener('mouseenter', this._onmouseenter);
    this._onmouseleave && this.canvas.removeEventListener('mouseleave', this._onmouseleave);
    this._onkeydown && document.removeEventListener('keydown', this._onkeydown);
    this._onkeyup && document.removeEventListener('keyup', this._onkeyup);
  }

  // 重置缩放
  resetScale() {
    if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
      this.state.scaleY = 0;
      this.drawCoordinateSystem();
      this.state.currentData && this.drawTimeWave(this.state.currentData);
    } else if (this.state.waveType === 'freq') {
      this.state.scaleX = 1;
      this.drawCoordinateSystem();
      this.state.currentData && this.drawFreqWave(this.state.currentData);
    }
  }

  setStartTime(time) {
    this._startTime = time;
  }

  // 初始波形累积图化参数
  beforeDrawTimeWaveOverTime() {
    if (this.state.waveType === 'over-time') {
      this._offsetRecord = this.xParams.offset;
      this.drawCoordinateSystem();
      this.ctx.save();
      this.ctx.lineWidth = this.canvasOption.lineWidth;
      this.ctx.strokeStyle = this.canvasOption.strokeStyle;
      this.ctx.beginPath();
      this.ctx.moveTo(this._offsetRecord, (this.baseHeight - this.yParams.offset) / 2);
      this._timeScales = [];
    }
  }

  // 波形累积图结束回调
  afterDrawTimeWaveOverTime() {
    if (this.state.waveType === 'over-time') {
      this._offsetRecord = 0;
      this.ctx.restore();
    }
  }

  drawText(text, x, y) {
    this.ctx.save();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#333';
    this.ctx.setLineDash([]);
    this.ctx.strokeText(String(text), x, y);
    this.ctx.restore();
  }

  // 绘制波形累计图
  drawTimeWaveOverTime(data, time) {
    // 偏移
    const yoffset = this.yParams.offset || 0;
    const length = data.length;
    const byteMax = 128;
    const div = 150;
    const di = 1;
    const dx = (this.baseWidth - this.xParams.offset) / length / div; // x轴间隔
    const max = this.yParams.max - this.state.scaleY;
    const min = this.yParams.min - this.state.scaleY;
    for (let i = 0; i < length; i += di) {
      const sy = ((max - (data[i] / byteMax - 1)) / (max - min)) * (this.baseHeight - yoffset);
      if (i === 0) {
        this.ctx.lineTo(this._offsetRecord + dx * di, sy);
      } else {
        this.ctx.lineTo(this._offsetRecord + dx * di, sy);
      }
      this._offsetRecord += dx * di;

      if (this.state.xScales[this._timeScales.length] - this._offsetRecord <= Number.EPSILON) {
        this._timeScales.push(time - this._startTime);
        const index = this._timeScales.length - 1;
        const textOffset = index === 0 ? 0 : index === this.state.xScales.length - 1 ? -22 : -5;
        this.drawText(
          (time - this._startTime).toFixed(2),
          this.state.xScales[index] + textOffset,
          this.baseHeight - this.yParams.offset + 10
        );
      }
    }
    this.ctx.stroke();
  }

  // 绘制波形图
  drawTimeWave(data) {
    // this.state.waveType = 'time'
    this.state.currentData = data;
    this.drawCoordinateSystem();
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = this.canvasOption.lineWidth;
    this.ctx.strokeStyle = this.canvasOption.strokeStyle;

    // 偏移
    const xoffset = this.xParams.offset || 0;
    const yoffset = this.yParams.offset || 0;
    const length = data.length;
    const byteMax = 128;
    const dx = (this.baseWidth - xoffset) / length; // x轴间隔
    const max = this.yParams.max - this.state.scaleY;
    const min = this.yParams.min + this.state.scaleY;
    for (let i = 0; i < length; i++) {
      const sy = ((max - (data[i] / byteMax - 1)) / (max - min)) * (this.baseHeight - yoffset);
      if (i === 0) {
        this.ctx.moveTo(xoffset + i * dx, sy);
      } else {
        this.ctx.lineTo(xoffset + i * dx, sy);
      }
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  // 绘制频谱图
  drawFreqWave(data) {
    // this.state.waveType = 'freq'
    this.state.currentData = data;
    this.drawCoordinateSystem();
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = this.canvasOption.lineWidth;
    this.ctx.strokeStyle = this.canvasOption.strokeStyle;

    // 偏移
    const yoffset = this.yParams.offset || 0;
    const xoffset = this.xParams.offset || 0;
    const length = data.length;
    const dx = ((this.baseWidth - xoffset) / length) * this.state.scaleX; // x轴间隔
    const dy = (this.baseHeight - yoffset) / 255; // y轴间隔

    for (let i = 0; i < length; i++) {
      if (i === 0) {
        this.ctx.moveTo(xoffset + i * dx, this.baseHeight - yoffset - data[i] * dy);
      } else {
        this.ctx.lineTo(xoffset + i * dx, this.baseHeight - yoffset - data[i] * dy);
      }
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  // 保存坐标系参数
  saveCoordinateParams(yParams = {}, xParams = {}) {
    this.yParams = { offset: 0, ...yParams };
    this.xParams = { offset: 0, ...xParams };

    this.drawCoordinateSystem();
    this.createTip();
  }

  // 绘制坐标系
  drawCoordinateSystem() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    let { min: ymin, max: ymax, offset: yoffset = 0, div: ydiv = 10, showText: yText = false } = this.yParams || {};
    let { min: xmin, max: xmax, offset: xoffset = 0, div: xdiv = 10, showText: xText = false } = this.xParams || {};
    const yTextOffsetX = 1;
    const yTextOffsetY = -2;
    const xTextOffsetX = -10;
    const xTextOffsetY = 3;

    this.ctx.save();
    // 绘制 y 轴
    if (this.yParams) {
      const dy = (this.baseHeight - yoffset) / ydiv;
      if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
        ymax -= this.state.scaleY;
        ymin += this.state.scaleY;
      }
      const dVal = (ymax - ymin) / ydiv;

      for (let i = 0; i <= ydiv; i++) {
        this.ctx.beginPath();

        // 绘制刻度值
        if (yText) {
          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = '#333';
          this.ctx.setLineDash([]);
          if (i === 0) {
            this.ctx.strokeText(String(Math.round((ymax - dVal * i) * 100) / 100), yTextOffsetX, i * dy + 10);
          } else {
            this.ctx.strokeText(String(Math.round((ymax - dVal * i) * 100) / 100), yTextOffsetX, i * dy - yTextOffsetY);
          }
        }

        // 绘制刻度线
        this.ctx.moveTo(this.xParams.offset, i * dy);
        if (i === ydiv) {
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([]);
          this.ctx.lineTo(this.baseWidth, i * dy);
        } else {
          this.ctx.strokeStyle = '#999';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3, 6]);
          this.ctx.lineTo(this.baseWidth, i * dy);
        }
        this.ctx.stroke();
      }
    }

    // 绘制 x 轴
    if (this.xParams) {
      const dx = (this.baseWidth - xoffset) / xdiv;
      const dVal = (xmax / this.state.scaleX - xmin) / xdiv;

      for (let i = 0; i <= xdiv; i++) {
        this.ctx.beginPath();

        // 绘制刻度值
        if (xText) {
          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = '#333';
          this.ctx.setLineDash([]);
          if (i === xdiv) {
            const text = Math.round((xmin + dVal * i) * 10) / 10;
            const offsetLast = this.ctx.measureText(text).width;
            this.ctx.strokeText(String(text), xoffset + i * dx - offsetLast - 5, this.baseHeight - xTextOffsetY);
          } else {
            this.ctx.strokeText(
              String(Math.round((xmin + dVal * i) * 10) / 10),
              xoffset + i * dx + xTextOffsetX + (i === 0 ? 10 : 0),
              this.baseHeight - xTextOffsetY
            );
          }
        }

        // 绘制刻度线
        this.ctx.moveTo(xoffset + i * dx, 0);
        if (i === 0) {
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([]);
          this.ctx.lineTo(xoffset + i * dx, this.baseHeight - this.yParams.offset);
          this.state.xScales = [xoffset + i * dx];
        } else {
          this.ctx.strokeStyle = '#999';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3, 6]);
          this.ctx.lineTo(xoffset + i * dx, this.baseHeight - this.yParams.offset);
          this.state.xScales.push(xoffset + i * dx);
        }
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  // 绘制图形
}
