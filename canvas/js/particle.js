
// 工具类
export class Methods {
  // 范围内随机值
  static randomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 随机颜色
  static randomColor() {
    return '#' + Math.floor(Math.random() * 2 ** 24).toString(16);
  }

  // 随机位置
  static randomPosition(xmin = 0, xmax = 0, ymin = 0, ymax = 0) {
    return {
      x: Methods.randomValue(xmin, xmax),
      y: Methods.randomValue(ymin, ymax)
    }
  }

  // 随机速度
  static randomSpeed(min = 0, max = 0) {
    return {
      vx: Methods.randomValue(min, max) * (Math.random() > 0.5 ? 1 : -1),
      vy: Methods.randomValue(min, max) * (Math.random() > 0.5 ? 1 : -1)
    };
  }

  // 随机正负值范围
  static randomPlusMinus(min = 0, max = 0) {
    return Methods.randomValue(min, max) * (Math.random() > 0.5 ? 1 : -1)
  }

  // 构造函数内参数赋值
  static setParams(target, params, kv) {
    for (let [k, v] of Object.entries(kv)) {
      target[k] = params[k] || v || 0;
    }
  }
}
class Particle {
  constructor(
    ctx,
    {
      vx = 0,
      vy = 0,
      x = 0,
      y = 0,
    } = {},
    {
      fillStyle = '#000',
      StrokeStyle = '#000'
    } = {}
  ) {
    this.ctx = ctx;
    this.vx = vx;
    this.vy = vy;
    this.x = x;
    this.y = y;
    this.fillStyle = fillStyle;
    this.StrokeStyle = StrokeStyle;
  }

  // 更新状态
  change() { }

  // 每一帧
  tick() {
    change();
  }

  // get x() {
  //   if(!Number.isNaN(+this.width)) {
  //     return this._x + this.width / 2;
  //   } else {
  //     return this._x;
  //   }
  // }
  // set x(val) {
  //   if(!Number.isNaN(+this.width)) {
  //     this._x = val - this.width / 2;
  //   } else {
  //     this._x = val;
  //   }
  // }

  // get y() {
  //   if(!Number.isNaN(+this.height)) {
  //     return this._y + this.height / 2;
  //   } else {
  //     return this._y;
  //   }
  // }
  // set y(val) {
  //   if(!Number.isNaN(+this.height)) {
  //     this._y = val - this.height / 2;
  //   } else {
  //     this._y = val;
  //   }
  // }
}

// 圆形粒子
export class CircleParticle extends Particle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    const kv = {
      radius: 5,
      minRadius: 0,
      maxRadius: 0,
      growSpeed: 0.1
    };
    Methods.setParams(this, params, kv);
  }

  tick() {
    this.flicker();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.StrokeStyle;
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
      this.vy = -this.vy;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  // 闪烁
  flicker() {
    this.radius += this.growSpeed;
    if (this.radius < 0) {
      this.radius = 0;
    }

    if (this.radius <= this.minRadius || this.radius >= this.maxRadius) {
      this.growSpeed = -this.growSpeed;
    }
  }
}

// 外接圆三角型
export class CircumcenterTriangleParticle extends CircleParticle { }

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
    this.flicker();

    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.translate(this.x, this.y);
    this.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.ctx.restore();
  }

  // 闪烁
  flicker() {
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

// 形状粒子
export class ShapeParticle {
  constructor(ctx, params, options) {
    this.ctx = ctx;
    this.params = params;
    this.options = options;

    this.shape = params.shape || 'circle'; // spot, rectangle, circle, triangle, line
    this.init(this.shape, ctx, params, options);
  }

  init(...args) {
    this.createShapeParticle(...args);
  }

  createShapeParticle(shape, ...args) {
    switch (shape) {
      case 'circle':
        this.shapeParticle = new CircleParticle(...args);
        break;
      case 'rectangle':
        this.shapeParticle = new RectangleParticle(...args);
        break;
      default:
        this.shapeParticle = new CircleParticle(...args);
        break;
    }
  }
}

// 粒子创建器
export class ParticleCreater {
  constructor(
    ctx,
    {
      count = 1,
      minRadius = 2,
      maxRadius = 5,
      minV = 0.1,
      maxV = 1
    } = {}
  ) {
    this.ctx = ctx;
    this.count = count;
    this.minRadius = minRadius;
    this.maxRadius = maxRadius;
    this.minV = minV;
    this.maxV = maxV;
    this.particles = [];

    this.createParticles();
  }

  // 创建粒子
  createParticles() {
    for (let i = 0; i < this.count; i++) {
      const radius = Methods.randomValue(this.minRadius, this.maxRadius);
      const speed = Methods.randomPlusMinus(0.11, 0.17);
      this.particles.push(
        // 圆形粒子
        new CircleParticle(
          this.ctx,
          {
            ...Methods.randomPosition(radius, this.ctx.canvas.width - radius, radius, this.ctx.canvas.height - radius),
            ...Methods.randomSpeed(),
            radius,
            minRadius: 0.5,
            maxRadius: this.maxRadius,
            growSpeed: speed
          },
          {
            fillStyle: Methods.randomColor()
          }
        ),
        // 矩形粒子
        new RectangleParticle(
          this.ctx,
          {
            shape: 'rectangle',
            ...Methods.randomPosition(radius, this.ctx.canvas.width - radius, radius, this.ctx.canvas.height - radius),
            width: radius * 2,
            minWidth: 1,
            maxWidth: this.maxRadius * 2,
            height: radius * 2,
            minHeight: 1,
            maxHeight: this.maxRadius * 2,
            growSpeedWidth: speed,
            growSpeedHeight: speed
          },
          {
            fillStyle: Methods.randomColor()
          }
        )
      );
    }
  }

  // 清除粒子
  clearParticles() {
    this.particles = [];
  }
}