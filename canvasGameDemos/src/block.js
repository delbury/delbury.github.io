import { Controller } from './base.js';

export default class Block extends Controller {
  constructor(ctx, props) {
    if(!(ctx instanceof CanvasRenderingContext2D)) throw new Error('need canvas 2d context');
    super(props);
    this.fillColor = '#999999';
    this.strokeColor = '#666666';
    this.ctx = ctx;
  }

  draw() {
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.fillRect(this.x, this.y, this.w, this.h);
    this.ctx.restore();
  }
}