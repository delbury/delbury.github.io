import { getAutoSaveTools } from '../../../assets/js/abilities/index.js';

// 音频分析用 canvas 基类
export class BaseCanvas {
  constructor(
    canvas,
    {
      width,
      height = 280,
      scalable = false,
      waveType = '',
      // 用来指定参数自动保存的key
      autoSaveKey,
    } = {},
    state = {}
  ) {
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

    const initData = {
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
    const saveTools = autoSaveKey ? getAutoSaveTools({ customKey: autoSaveKey, initData, pickKeys: ['scaleX'] }) : null;
    this.state = saveTools
      ? new Proxy(
          { ...saveTools.data },
          {
            set: (target, prop, val) => {
              saveTools?.update(prop, val);
              target[prop] = val;
              return true;
            },
          }
        )
      : initData;
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
  calcPeakValue(data, includeBottom = false) {
    const arr = [];
    const dy = (this.yParams.max - this.yParams.min) / 255;
    const fn = (i, type) => {
      return {
        index: i,
        value: data[i],
        db: dy * data[i] + this.yParams.min,
        freq: (i / data.length) * this.xParams.max,
        x: (i / data.length) * (this.baseWidth - this.xParams.offset) * this.state.scaleX + this.xParams.offset,
        y: (this.baseHeight - this.yParams.offset) * (1 - data[i] / 255),
        type,
      };
    };
    for (let i = 0, len = data.length; i < len; i++) {
      const diffLeft = data[i] - (data[i - 1] ?? -Infinity);
      const diffRight = data[i] - (data[i + 1] ?? -Infinity);

      if ((diffLeft >= 0 && diffRight > 0) || (diffLeft > 0 && diffRight >= 0)) {
        // 山峰
        arr.push(fn(i, 'top'));
      } else if ((includeBottom && diffLeft <= 0 && diffRight < 0) || (diffLeft < 0 && diffRight <= 0)) {
        // 山谷
        arr.push(fn(i, 'bottom'));
      }
    }
    this.state.peakValley = arr;
    return arr;
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

  // 缩放
  scaleTo(toValue) {
    if (this.state.waveType === 'time' || this.state.waveType === 'over-time') {
      this.state.scaleY = toValue;
      this.drawCoordinateSystem();
      this.state.currentData && this.drawTimeWave(this.state.currentData);
    } else if (this.state.waveType === 'freq') {
      this.state.scaleX = toValue;
      this.drawCoordinateSystem();
      this.state.currentData && this.drawFreqWave(this.state.currentData);
    }
  }
  scaleBy(diff) {
    const toValue = this.state.waveType === 'freq' ? this.state.scaleX * diff : this.state.scaleY + diff;
    this.scaleTo(toValue);
  }

  // 重置缩放
  resetScale() {
    const toValue = this.state.waveType === 'freq' ? 1 : 0;
    this.scaleTo(toValue);
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
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.fillStyle = '#333';
    this.ctx.setLineDash([]);
    this.ctx.fillText(String(text), x, y);
    this.ctx.restore();
  }

  // 绘制波形累计图
  drawTimeWaveOverTime(data, time) {
    // 偏移
    const xoffset = this.xParams.offset || 0;
    const yoffset = this.yParams.offset || 0;
    const length = data.length;
    const byteMax = 128;
    const div = 150;
    const di = 1;
    const dx = (this.baseWidth - xoffset) / length / div; // x轴间隔
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
          this.baseHeight - yoffset + 10
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
          if (i === 0) {
            this.drawText(String(Math.round((ymax - dVal * i) * 100) / 100), yTextOffsetX, i * dy + 10);
          } else {
            this.drawText(String(Math.round((ymax - dVal * i) * 100) / 100), yTextOffsetX, i * dy - yTextOffsetY);
          }
        }

        // 绘制刻度线
        this.ctx.moveTo(xoffset, i * dy);
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
          if (i === xdiv) {
            const text = Math.round((xmin + dVal * i) * 10) / 10;
            const offsetLast = this.ctx.measureText(text).width;
            this.drawText(String(text), xoffset + i * dx - offsetLast - 5, this.baseHeight - xTextOffsetY);
          } else {
            this.drawText(
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
          this.ctx.lineTo(xoffset + i * dx, this.baseHeight - yoffset);
          this.state.xScales = [xoffset + i * dx];
        } else {
          this.ctx.strokeStyle = '#999';
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([3, 3, 6]);
          this.ctx.lineTo(xoffset + i * dx, this.baseHeight - yoffset);
          this.state.xScales.push(xoffset + i * dx);
        }
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  // 在频谱图上绘制的主要频率分量
  drawFreqPeaks() {
    const xoffset = this.xParams.offset || 0;
    const yoffset = this.yParams.offset || 0;
    const scaledMin = this.xParams.min / this.state.scaleX;
    const scaledMax = this.xParams.max / this.state.scaleX;
    const scaledRange = scaledMax - scaledMin;
    const theWidth = this.baseWidth - xoffset;

    const data = this.state.currentData ?? [];
    let rawPeaks = this.calcPeakValue(data, true);
    // 如果连续两个都是 top 或者 bottom 的话，表示这两个值一定相等，则丢弃这个点
    rawPeaks = rawPeaks.filter((p, i, arr) => i === arr.length - 1 || p.type !== arr[i + 1].type);

    // 滤掉一些抖动的山峰和山谷
    const filteredPeaks = [];
    const filteredThreshold = (this.yParams.max - this.yParams.min) * 0.02;
    for (let i = 0; i < rawPeaks.length; i++) {
      const curr = rawPeaks[i];
      if (i < rawPeaks.length - 1) {
        const next = rawPeaks[i + 1];
        // 当前点与下一个点的值差值在一定范围内，直接过滤掉当前点和下一个点
        const diff = Math.abs(curr.db - next.db);
        if (diff < filteredThreshold) {
          i++;
          continue;
        }
      }
      filteredPeaks.push(rawPeaks[i]);
    }

    // 过滤比左右峰值都大的峰值，因为值都 < 0
    const realThreshold = (this.yParams.max - this.yParams.min) * 0.15;
    const realPeaks = [];
    for (let i = 0; i < filteredPeaks.length; i++) {
      if (filteredPeaks[i].type !== 'top') continue;
      if (realPeaks.length && Math.abs((filteredPeaks[i].freq - realPeaks.at(-1).freq) / scaledRange) < 0.001) continue;

      const leftBottom = filteredPeaks[i - 1];
      const rightBottom = filteredPeaks[i + 1];

      const diffLeft = filteredPeaks[i].db - (leftBottom?.db ?? -Infinity);
      const diffRight = filteredPeaks[i].db - (rightBottom?.db ?? -Infinity);

      if (diffLeft > realThreshold && diffRight > realThreshold) {
        realPeaks.push(filteredPeaks[i]);
      }
    }

    // 绘制
    this.ctx.save();
    const setColorByIndex = (index) => {
      const color = index % 2 ? '#f5222d' : '#1677ff';
      this.ctx.strokeStyle = color;
      this.ctx.fillStyle = color;
    };
    this.ctx.font = '8px sans-serif';
    let baseFreq = null;
    // 绘制定位线
    for (let i = 0; i < realPeaks.length; i++) {
      const peak = realPeaks[i];
      const percent = (peak.freq - scaledMin) / scaledRange;
      const offset = theWidth * percent + xoffset;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(offset, 0);
      this.ctx.lineTo(offset, this.baseHeight - yoffset);
      this.ctx.setLineDash([2, 2]);
      setColorByIndex(i);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 每一根定位线上的文本为了不重叠，可能错开成多行显示
    // 用来记录每一行的文本的最后 x 轴坐标
    this.ctx.save();
    const textLineLastPositions = [0];
    const gap = 5;
    // 绘制文本
    for (let i = 0; i < realPeaks.length; i++) {
      const peak = realPeaks[i];
      const percent = (peak.freq - scaledMin) / scaledRange;
      const offset = theWidth * percent + xoffset;

      let text = '';
      if (i == 0) {
        baseFreq = peak.freq;
        text = baseFreq.toFixed(1) + 'Hz';
      } else {
        text = (peak.freq / baseFreq).toFixed(1);
      }
      const { width: tw } = this.ctx.measureText(text);
      const htw = tw / 2;
      this.ctx.save();
      let x = offset - htw;
      let y = 10;
      let yoff = 0;
      const end = x + tw;
      const rowIndex = textLineLastPositions.findIndex((p) => !p || p + gap < x);
      if (rowIndex > -1) {
        yoff = 10 * rowIndex;
        textLineLastPositions[rowIndex] = end;
      } else {
        yoff = 10 * textLineLastPositions.length;
        textLineLastPositions.push(end);
      }

      y += yoff;
      this.ctx.clearRect(x, y, tw, 10);
      setColorByIndex(i);
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(text, x, y + 1);

      this.ctx.restore();
    }
    this.ctx.restore();
  }
}
