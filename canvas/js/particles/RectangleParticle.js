import { Particle } from './Particle.js';

// 矩形粒子
export class RectangleParticle extends Particle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    const kv = {
      width: 0,
      minWidth: 0,
      maxWidth: 0,
      height: 0,
      minHeight: 0,
      maxHeight: 0,
      growSpeedWidth: 0,
      growSpeedHeight: 0
    };
    Methods.setParams(this, params, kv);
  }

  tick() {
    this.randomMoveTick();
    this.baseMoveTick();
    this.flickerTick();

    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.translate(this.x, this.y);
    this.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.ctx.restore();
  }

  // 闪烁
  flickerTick() {
    if (this._flickering) {
      this.width += this.growSpeedWidth;
      this.height += this.growSpeedHeight;
      if (this.width <= this.minWidth || this.width >= this.maxHeight) {
        this.growSpeedWidth = -this.growSpeedWidth;
      }
      if (this.height <= this.minHeight || this.height >= this.maxHeight) {
        this.growSpeedHeight = -this.growSpeedHeight;
      }
    }
  }
}