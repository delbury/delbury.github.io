import { ShapeParticle, Methods } from './particle.js'

export class ParticleText {
  constructor(
    ctx,
    {
      gridX = 10,
      gridY = 10
    } = {},
    {
      textSize = 100,
      textBaseline = 'middle',
      textAlign = 'center',
      scale = 2
    } = {}
  ) {
    this.ctx = ctx;
    this.font = `bold ${textSize}px aria`;
    this.textBaseline = textBaseline;
    this.textAlign = textAlign;
    this.scale = scale;

    this.gridX = gridX;
    this.gridY = gridY;
    this.particles = []; // 粒子实例

    this.init();
  }

  // 初始化
  init() {
    // 创建辅助 canvas
    const OffCanvas = window.OffscreenCanvas ?
      new window.OffscreenCanvas(1, 1) :
      document.createElement('canvas');
    OffCanvas.width = this.ctx.canvas.width;
    OffCanvas.height = this.ctx.canvas.height;
    this.offCtx = OffCanvas.getContext('2d');
  }

  // 创建粒子文本
  createEffect(text, x, y) {
    const imageData = this.paintText(text, x, y);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    // this.ctx.drawImage(this.offCtx.canvas, 0, 0);
    // this.ctx.putImageData(imageData, 0, 0);
    this.imageData = imageData
    this.createParticles(imageData);
  }

  // 绘制文字
  paintText(text, xAxis = this.ctx.canvas.width / 2, yAxis = this.ctx.canvas.height / 2) {
    this.offCtx.save();
    this.offCtx.clearRect(0, 0, this.offCtx.canvas.width, this.offCtx.canvas.height);
    this.offCtx.font = this.font;
    this.offCtx.textBaseline = this.textBaseline;
    this.offCtx.textAlign = this.textAlign;
    this.offCtx.scale(this.scale, this.scale);
    this.offCtx.translate(xAxis / this.scale, yAxis / this.scale);
    this.offCtx.fillText(text, 0, 0);
    // this.offCtx.fillText(text, xAxis, yAxis);
    this.offCtx.restore();

    return this.offCtx.getImageData(0, 0, this.offCtx.canvas.width, this.offCtx.canvas.height);
  }

  // 创建粒子
  createShapeParticle(currentIndex, i, j, shape = 'circle') {
    // 圆形
    const circle = {
      shape: 'circle',
      ...Methods.randomPosition(0, this.ctx.canvas.width, 0, this.ctx.canvas.height),
      target: [i, j],
      radius: Methods.randomValue(1.5, 2),
      maxRadius: 2.3,
      minRadius: 0.8,
      growSpeed: Methods.randomPlusMinus(0.07, 0.11)
    };

    // 方形
    const wh = Methods.randomValue(2, 3);
    const speed = Methods.randomPlusMinus(0.07, 0.17);
    const rect = {
      shape: 'rectangle',
      // x: i,
      // y: j,
      ...Methods.randomPosition(0, this.ctx.canvas.width, 0, this.ctx.canvas.height),
      target: [i, j],
      width: wh,
      minWidth: 1,
      maxWidth: 5,
      height: wh,
      minHeight: 1,
      maxHeight: 5,
      growSpeedWidth: speed,
      growSpeedHeight: speed
    };
    // if (this.particles[currentIndex]) {
    // this.particles[currentIndex].shapeParticle.moveTo([i, j]);
    // } else {
    this.particles[currentIndex] = new ShapeParticle(
      this.ctx,
      {
        ...circle,
        // ...rect,
      },
      {
        fillStyle: Methods.randomColor()
      }
    );
    // }
  }

  // 创建像素粒子集合
  createParticles({ width, height, data }) {
    const uint32 = new Uint32Array(data.buffer);
    // 列
    let currentIndex = 0;
    this.particles = [];
    for (let j = 0; j < height; j += this.gridY) {
      //行
      for (let i = 0; i < width; i += this.gridX) {
        // 判断该对应一维坐标的像素上是否有值
        const index = j * width + i; // 
        if (uint32[index] > 0) {
          this.createShapeParticle(currentIndex, i, j);
          currentIndex++;
        }
      }
    }
    this.particles.length = currentIndex;
  }

  focus() {
    this.particles.forEach(item => {
      item.shapeParticle.startRandomMove(Methods.randomSpeed(2.19, 0.37));
    });
  }
  blur() {
    this.particles.forEach(item => {
      item.shapeParticle.stopRandomMove();
    });
  }
}
