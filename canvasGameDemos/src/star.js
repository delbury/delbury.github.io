import { Base } from './base.js';
import * as utils from './lib/utils.js';


const BEZ_NUM = 50;
const beziers = utils.calcBezier(BEZ_NUM);
export default class Star extends Base {
  constructor(ctx, x, y, w, h, br) {
    super(x, y, w, h);
    this.ctx = ctx;
    this.radius = this.w / 2;
    this.borderRadius = br;
    // this.BEZ_NUM = BEZ_NUM;
    this.spinScale = 0;
    this.vertexs = this.calcVertexs();
    // this.beziers = beziers;

    this.gradient = this.ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
    this.gradient.addColorStop(0, 'orange');
    this.gradient.addColorStop(1, 'orangered');
    this.radial = this.ctx.createRadialGradient(0, this.radius, 0, 0, this.radius, this.radius);
    this.radial.addColorStop(0, 'white');
    this.radial.addColorStop(0.6, 'white');
    this.radial.addColorStop(1, 'grey');
    this.isDead = false;
    this.isDying = false;
    this.degree = 0;
    this.alpha = 1;
  }

  getScale() {
    return beziers[this.spinScale];
  }

  calcVertexs(scale = 1) {
    const { sin, cos, PI } = Math;
    const rad54 = 54 / 180 * PI, rad18 = 18 / 180 * PI;
    return [
      [0, -this.w / 2], // 1
      [0 + this.radius * cos(rad54) * scale, +this.radius * sin(rad54)], // 3
      [0 - this.radius * cos(rad18) * scale, -this.radius * sin(rad18)], // 5
      [0 + this.radius * cos(rad18) * scale, -this.radius * sin(rad18)], // 2
      [0 - this.radius * cos(rad54) * scale, +this.radius * sin(rad54)] // 4
    ];
  }

  draw() {
    // 画光环
    if(!this.isDying) {
      this.ctx.save();
      this.ctx.beginPath();
      // this.ctx.translate(0, 0);
      this.ctx.scale(1, 0.5);
      this.ctx.translate(this.centerX, this.centerY / 0.5);
      this.ctx.arc(0, this.radius, this.radius, 0, 2 * Math.PI);
      this.ctx.closePath();
      this.ctx.fillStyle = this.radial;
      // this.ctx.stroke();
      this.ctx.fill();
      this.ctx.restore();
    }

    const sc = this.getScale();
    if(!sc && !this.isDying) return; // 防止除数为 0
    this.ctx.save();
    this.ctx.beginPath();

    // 调整画布，星星z轴旋转效果
    if(!this.isDying) {
      // this.ctx.translate(0, 0);
      this.ctx.scale(sc, 1);
      this.ctx.translate(this.centerX / sc, this.centerY);
    } else {
      if(this.degree >= 360) {
        this.degree = 0;
      }
      this.ctx.translate(this.centerX, this.centerY);
      this.ctx.rotate(this.degree * Math.PI / 180);
      this.degree += 10;
      this.y -= 5;
      if(this.y < -this.h) {
        this.isDying = false;
        this.isDead = true;
      }
    }


    // 构造星星圆角
    this.ctx.arc(0, 0, this.radius - this.borderRadius, 0, 2 * Math.PI);
    this.ctx.closePath();
    this.ctx.clip();

    // 绘制五角星
    this.ctx.beginPath();
    this.vertexs.map((item, index) => {
      if(index === 0) {
        this.ctx.moveTo(...item);
      } else {
        this.ctx.lineTo(...item);
      }
    });
    this.ctx.closePath();
    this.ctx.fillStyle = this.gradient;
    this.ctx.save();
    if(this.isDying) {
      this.ctx.globalAlpha = this.alpha;
      this.alpha -= 0.01; 
    }
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.restore();
  }

  spin() {
    if(this._spinHalf) {
      if(this.spinScale <= 0) {
        this.spinScale++;
        this._spinHalf = false;
      } else {
        this.spinScale--;
      }
    } else {
      if(this.spinScale >= BEZ_NUM) {
        this.spinScale--;
        this._spinHalf = true;
      } else {
        this.spinScale++;
      }
    }
  }

  tick() {
    if(!this.isDead) {
      this.spin();
      this.draw();
    }
  }

  scrollLeft(dx) {
    this.x -= dx;
  }
  dead() {
    this.isDying = true;
  }
}