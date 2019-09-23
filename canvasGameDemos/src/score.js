import { Text } from './base.js';

export default class Score extends Text {
  constructor(canvas, ctx, text = 'score: ') {
    super(canvas, ctx, text);
    this.scoreLevel = 10; // 游戏分数系数
  }
  set value(val) {
    this._value = val || 0;
  }
  get value() {
    return this._value || 0;
  }
  gainScore(val) {
    this.value += Math.round(val * this.scoreLevel);
  }

  createText() {
    this.ctx.save();
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 24px sans-serif';
    this.ctx.fillText(this.text, 25, 30);

    this.ctx.textAlign = 'right';
    this.ctx.font = '20px sans-serif'
    this.ctx.fillText(this.value, 160, 30);
    this.ctx.restore();
  }

  tick() {
    this.createText();
  }
}