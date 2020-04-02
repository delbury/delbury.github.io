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
    // this.ctx.drawImage(this.offCtx.canvas, 0, 0);
    // this.ctx.putImageData(imageData, 0, 0);
    this.imageData = imageData
    this.createParticles(imageData);
  }

  // 绘制文字
  paintText(text, xAxis = this.ctx.canvas.width / 2, yAxis = this.ctx.canvas.height / 2) {
    this.offCtx.save();
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

  createShapeParticle(shape = 'circle', i, j) {

  }

  // 创建粒子
  createParticles({ width, height, data }) {
    const uint32 = new Uint32Array(data.buffer);
    this.particles = [];
    // 列
    for(let j = 0; j < height; j += this.gridY) {
      //行
      for(let i = 0; i < width; i += this.gridX) {
        // 判断该对应一维坐标的像素上是否有值
        const index = j * width + i; // 
        if(uint32[index] > 0) {
          // 圆形
          const circle = {
            shape: 'circle',
            x: i,
            y: j,
            radius: Methods.randomValue(2, 3),
            maxRadius: 4.5,
            minRadius: 0.5,
            growSpeed: Methods.randomPlusMinus(0.11, 0.17)
          };

          // 方形
          const wh = Methods.randomValue(2, 3);
          const speed = Methods.randomPlusMinus(0.11, 0.17);
          const rect = {
            shape: 'rectangle',
            x: i,
            y: j,
            width: wh,
            minWidth: 1,
            maxWidth: 5,
            height: wh,
            minHeight: 1,
            maxHeight: 5,
            growSpeedWidth: speed,
            growSpeedHeight: speed
          };
          this.particles.push(new ShapeParticle(
            this.ctx,
            {
              // ...circle,
              ...rect,
            },
            {
              fillStyle: Methods.randomColor()
            }
          ));
        }
      }
    }
  }
}
