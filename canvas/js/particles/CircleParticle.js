import { Particle } from "./Particle.js";
import { Methods } from "../math.js";

// 圆形粒子
export class CircleParticle extends Particle {
  constructor(ctx, params = {}, options) {
    super(ctx, params, options);
    const kv = {
      radius: 5,
      minRadius: 0,
      maxRadius: 0,
      growSpeed: 0,
    };
    Methods.setParams(this, params, kv);
  }

  tick() {
    this.springMoveTick();
    this.easeMoveTick();
    this.freeFallTick();
    this.moveTick();
    this.randomMoveTick();
    this.baseMoveTick();
    this.flickerTick();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
  }

  // 移动
  move() {
    if (this.x + this.vx + this.radius > this.ctx.canvas.width || this.x + this.vx - this.radius < 0) {
      this.vx = -this.vx;
    }

    if (this.y + this.vy + this.radius > this.ctx.canvas.height || this.y + this.vy - this.radius < 0) {
      if (!this._freeFalling) {
        this.vy = -this.vy;
      }
    }

    this.x += this.vx;
    if (!this._freeFalling) {
      this.y += this.vy;
    }

    if (this.vx !== 0 || this.vy !== 0) {
      if (this.currentMass === Infinity) {
        this.vx = 0;
        this.vy = 0;
      } else {
        const rad = Math.atan2(Math.abs(this.vy), Math.abs(this.vx));

        const dvx = this.friction * this.currentMass * Math.cos(rad);
        const dvy = this.friction * this.currentMass * Math.sin(rad);

        const tvx = this.vx > 0 ? this.vx - dvx : this.vx + dvx;
        const tvy = this.vy > 0 ? this.vy - dvy : this.vy + dvy;

        if ((tvx > 0 && this.vx < 0) || (tvx < 0 && this.vx > 0)) {
          this.vx = 0;
          this.vy = 0;
        } else {
          this.vx = tvx;
          this.vy = tvy;
        }
      }
    }
  }

  // 闪烁
  flickerTick() {
    if (this._flickering) {
      this.radius += this.growSpeed;
      if (this.radius < 0) {
        this.radius = 0;
      }

      if (this.radius <= this.minRadius || this.radius >= this.maxRadius) {
        this.growSpeed = -this.growSpeed;
      }
    }
  }

  // 判断坐标点是否在当前图形内
  isInside(x, y) {
    if (!this.degrees.length) {
      return (this.x - x) ** 2 + (this.y - y) ** 2 < this.radius ** 2;
      // const path = new Path2D();
      // path.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      // return this.ctx.isPointInPath(path, x, y);
    } else {
      const path = new Path2D();
      this.degrees.forEach((deg) => {
        const rad = (deg / 180) * Math.PI;
        path.arc(this.x, this.y, this.radius, rad, rad, false);
      });
      path.closePath();
      return this.ctx.isPointInPath(path, x, y);
    }
    // return false;
  }

  // 半径监听
  get radius() {
    return this._radius || 0;
  }
  set radius(val) {
    this._radius = val;

    const res = Methods.calcCentroid(0, 0, val, this.degrees || []); // 重新计算相对质心
    this._centroid = res.centroid;

    if (this.degrees.length) {
      this._vertexRange = {
        x: Methods.findMinMaxFromVertex(res.vertex, 0),
        y: Methods.findMinMaxFromVertex(res.vertex, 1),
      };
    } else {
      this._vertexRange = null;
    }
  }

  // 角度值监听
  get degrees() {
    return this._degrees || [];
  }
  set degrees(val) {
    this._degrees = val;

    const res = Methods.calcCentroid(0, 0, this.radius, val || []); // 重新计算相对质心
    this._centroid = res.centroid;

    if (this.degrees.length) {
      this._vertexRange = {
        x: Methods.findMinMaxFromVertex(res.vertex, 0),
        y: Methods.findMinMaxFromVertex(res.vertex, 1),
      };
    } else {
      this._vertexRange = null;
    }
  }

  // 质心
  get centroid() {
    return [this._centroid[0] + this.x, this._centroid[1] + this.y];
  }

  // 顶点坐标的最大最小值
  get vertexRange() {
    return this._vertexRange;
  }

  beforeSetX(val) {
    if (val <= this.radius) {
      this._frozenStatus.xn = true;
      this.vx = -this.vx;
      return this.radius;
    } else if (val >= this.ctx.canvas.width - this.radius) {
      this._frozenStatus.xp = true;
      this.vx = -this.vx;
      return this.ctx.canvas.width - this.radius;
    } else {
      this._frozenStatus.xn = false;
      this._frozenStatus.xp = false;
    }
  }
  beforeSetY(val) {
    if (val <= this.radius) {
      this._frozenStatus.yn = true;
      this.vy = -this.vy;
      return this.radius;
    } else if (val >= this.ctx.canvas.height - this.radius) {
      this._frozenStatus.yp = true;
      this.vy = -this.vy;
      return this.ctx.canvas.height - this.radius;
    } else {
      this._frozenStatus.yn = false;
      this._frozenStatus.yp = false;
    }
  }
}
