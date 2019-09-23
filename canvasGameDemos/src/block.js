import { Controller } from './base.js';

export default class Block extends Controller {
  constructor(ctx, props) {
    if(!(ctx instanceof CanvasRenderingContext2D)) throw new Error('need canvas 2d context');
    super(props);
    this.fillColor = '#999999';
    this.strokeColor = '#666666';
    this.ctx = ctx;

    this.forbidMoveDir = 3;
  }

  draw() {
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.fillRect(this.x, this.y, this.w, this.h);
    this.ctx.restore();
  }

  
  saveStatus() {
    this._tempW = this.w;
    this._tempH = this.h;
    this._tempX = this.x;
    this._tempY = this.y;
  }
  storingForce(dx = 0, dy = 0) {
    if(!this._storingCounter) {
      this._storingCounter = 0;
    }
    if(this._storingCounter * 16 >= 500) {
      return;
    }
    this.w += dx;
    this.h -= dy;
    this.x -= dx / 2;
    this.y += dy;
    this._storingCounter++;
  }

  differStatus() {
    this._dw = this.w - this._tempW;
    this._dh = this._tempH - this.h;
    this._dx = this._tempX - this.x;
    this._dy = this.y - this._tempY;
  }
  releaseForce(time = 160) {
    if(!this._jumpConter) {
      this._jumpConter = 0;
    }
    if(this._jumpConter * 16 >= time) {
      return;
    }
    this.w -= 16 * this._dw / time;
    this.h += 16 * this._dh / time;
    this.x += 16 * this._dx / time;
    this.y -= 16 * this._dy / time;
    this._jumpConter++;
  }
  afterJump() {
    this._jumpConter = null;
    this._storingCounter = null;
  }
  afterMove(dx, dy) {
    if(this._tempX) {
      this._tempX += dx;
    }
    if(this._tempY) {
      this._tempY += dy;
    }
  }
}