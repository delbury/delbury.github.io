import { Text } from './base.js';

export default class GameOver extends Text {
  constructor(canvas, ctx, text = 'GAME OVER !', cb) {
    super(canvas, ctx, text);

    this.createText();
    // this.backgroundBlur(); // 背景高斯模糊
    this.buttons = [
      (new Button(canvas, ctx, 'again')).bindEvents(null, null, 100, 40, 5, undefined, cb)
    ];
  }

  createText() {
    const { width: w, height: h } = this.canvas;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 48px sans-serif';
    const tw = this.ctx.measureText(this.text).width;
    this.ctx.fillText(this.text, (w - tw) / 2, h / 2 - 50);
    this.ctx.restore();
  }

  // backgroundBlur() {
  //   const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  //   const data = imageData.data;
  //   const worker = new Worker('./src/workers/gaussianBlur.js');
  //   worker.onmessage = (ev) => {
  //     // const imgd = new ImageData(ev.data, imageData.width, imageData.height);
  //     // imageData.data = ev.data;
  //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  //     this.ctx.putImageData(ev.data, 0, 0);
  //     this.createText();
  //     worker.terminate();
  //   };
  //   worker.postMessage(imageData);
  // }
}

class Button extends Text {
  constructor(canvas, ctx, text) {
    super(canvas, ctx, text);
    this.args = [];
  }

  /**
   * @param {Number || null} x 中心点横坐标
   * @param {Number || null} y 中心点纵坐标
   * @param {Number} w 宽
   * @param {Number} h 高
   * @param {Number} r 边框弧度
   */
  createButton(x, y, w, h, r, color = 'skyblue') {
    x = x === null ? this.canvas.width / 2 : x;
    y = y === null ? this.canvas.height / 2 : y;
    this.args = [x, y, w, h, r]; // 保存参数
    const left = x - w / 2;
    const right = x + w / 2;
    const top = y - h / 2;
    const bottom = y + h / 2;
    this.ctx.save();
    this.ctx.beginPath();
    // this.ctx.scrokeStyle = '#333333';
    this.ctx.fillStyle = color;
    this.ctx.moveTo(left, bottom - r);
    // this.ctx.lineTo(left, top + r);
    this.ctx.arcTo(left, top, left + r, top, r);
    this.ctx.arcTo(right, top, right, top + r, r);
    this.ctx.arcTo(right, bottom, right - r, bottom, r);
    this.ctx.arcTo(left, bottom, left, bottom - r, r);
    this.ctx.closePath();
    this.ctx.fill();

    // 文字
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px sans-serif';
    this.ctx.textBaseline = 'middle'
    const tw = this.ctx.measureText(this.text).width;
    this.ctx.fillText(this.text, x - ((w - tw) / 2), y);
    this.ctx.restore();

    
    return [top, right, left, bottom];
  }

  bindEvents(x, y, w, h, r, color, cb) {
    const params = this.createButton(x, y, w, h, r, color);
    this.bindHover(...params);
    this.bindClick(...params, cb);
    return this;
  }

  bindHover(top, right, left, bottom) {
    this._fnMousemove = ev => {
      const { offsetX, offsetY } = ev;
      if(offsetX >= left && offsetX <= right && offsetY >= top && offsetY <= bottom) {
        this.createButton(...this.args, '#000066');
        this.canvas.classList.add('pointer');
      } else {
        this.createButton(...this.args, 'skyblue');
        this.canvas.classList.remove('pointer');
      }
    };
    this.canvas.addEventListener('mousemove', this._fnMousemove);
  }
  bindClick(top, right, left, bottom, cb) {
    this._fnClick = ev => {
      const { offsetX, offsetY } = ev;
      if(offsetX >= left && offsetX <= right && offsetY >= top && offsetY <= bottom) {
        this.resetGame(cb);
      }
    };
    this._fnKeydown = ev => {
      if(ev.key === 'Enter') {
        this.resetGame(cb);
      }
    };
    this.canvas.addEventListener('click', this._fnClick);
    document.addEventListener('keydown', this._fnKeydown);
  }
  resetGame(cb) {
    this.canvas.classList.remove('pointer');
    this.canvas.removeEventListener('mousemove', this._fnMousemove);
    this.canvas.removeEventListener('click', this._fnClick);
    document.removeEventListener('keydown', this._fnKeydown);
    this._fnMousemove = null;
    this._fnClick = null;
    this._fnKeydown = null;
    cb && cb();
  }
}
