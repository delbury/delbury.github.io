class BaseCanvas {
  ctx = null;
  canvas = null;
  // 元素宽度
  width;
  // 元素高度
  height;
  // 实际宽度像素
  realWidth;
  // 实际高度像素
  realHeight;
  // requestAnimationFrame 的返回 id
  #tickId = null;

  constructor(domQuery, params) {
    this.initCanvas(domQuery, params);
  }
  /**
   * 根据传入的 DOM query 创建 canvas 2d context，并做一些初始化操作
   * @param {*} domQuery
   * @param {*} param1
   * @returns
   */
  initCanvas(domQuery, { width = 300, height = 150, autoSize = false } = {}) {
    const canvas = document.querySelector(domQuery);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 自适应父元素宽高
    if (autoSize) {
      const parent = canvas.parentElement;
      const { scrollWidth, scrollHeight } = parent;
      width = scrollWidth;
      height = scrollHeight;
    }
    const ratio = window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    this.ctx = ctx;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.realWidth = canvas.width;
    this.realHeight = canvas.height;

    return ctx;
  }

  /**
   * 将图片绘制到 canvas 中心，宽或高溢出会进行等比例缩放
   * @param {*} ctx
   * @param {*} img
   */
  drawImageAutoFit(img) {
    const ctx = this.ctx;
    const canvasW = parseInt(ctx.canvas.style.width);
    const canvasH = parseInt(ctx.canvas.style.height);
    let imgW = img.width;
    let imgH = img.height;

    if (imgW >= canvasW || imgH >= canvasH) {
      const imgRatio = imgW / imgH;
      const canvasRatio = canvasW / canvasH;
      if (imgRatio > canvasRatio) {
        imgW = canvasW;
        imgH = imgW / imgRatio;
      } else {
        imgH = canvasH;
        imgW = imgH * imgRatio;
      }
    }
    const cw = (canvasW - imgW) / 2;
    const ch = (canvasH - imgH) / 2;
    this.clearCanvas();
    ctx.drawImage(img, cw, ch, imgW, imgH);

    // 返回参数，作为初始参数
    return [img, cw, ch, imgW, imgH];
  }

  /**
   * 清空画布
   */
  clearCanvas() {
    // this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  /**
   * 获取当前整个画布的 ImageData
   */
  getImageDataFull() {
    return this.ctx.getImageData(0, 0, this.realWidth, this.realHeight);
  }

  /**
   * 帧绘制
   */
  tick(cb) {
    if (this.#tickId) {
      cancelAnimationFrame(this.#tickId);
    }
    this.#tickId = requestAnimationFrame(() => {
      cb();
      this.#tickId = null;
    });
  }

  /**
   * 计算灰度值
   * @param {*} r
   * @param {*} g
   * @param {*} b
   * @returns
   */
  calcGrey(r, g, b, a) {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 根据在 canvas 中的 x, y 坐标，计算对应的 ImageData 的像素点下标
  calcImageDataIndex(x, y) {
    return 4 * (y * this.realWidth + x);
  }
}

export { BaseCanvas };
