
// 粒子
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
  change() {}

  // 每一帧
  tick() {
    change();
  }
}

// 圆形粒子
export class CircleParticle extends Particle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    this.radius = params.radius || 5;
    this.minRadius = params.minRadius || 0;
    this.maxRadius = params.maxRadius || this.radius * 2;
    this.growSpeed = (params.growSpeed || 0.1) * (Math.random() > 0.5 ? -1 : 1);
  }

  tick() {
    this.change();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.StrokeStyle;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
  }

  change() {
    this.flicker();
  }

  // 移动
  move() {
    if(this.x + this.vx + this.radius > this.ctx.canvas.width || this.x + this.vx - this.radius < 0) {
      this.vx = -this.vx;
    }

    if(this.y + this.vy + this.radius > this.ctx.canvas.height || this.y + this.vy - this.radius < 0) {
      this.vy = -this.vy;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  // 闪烁
  flicker() {
    this.radius += this.growSpeed;
    if(this.radius < 0) {
      this.radius = 0;
    }

    if(this.radius <= this.minRadius || this.radius >= this.maxRadius) {
      this.growSpeed = -this.growSpeed;
    }
  }
}

export class ParticleCreater {
  constructor(
    ctx,
    {
      count = 50,
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
  
  // 范围内随机值
  static randomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 随机颜色
  static randomColor() {
    return '#' + Math.floor(Math.random() * 2 ** 24).toString(16);
  }

  // 随机位置
  randomPosition(
    xmin = 0,
    xmax = this.ctx.canvas.width,
    ymin = 0,
    ymax = this.ctx.canvas.width
  ) {
    return {
      x: ParticleCreater.randomValue(xmin, xmax),
      y: ParticleCreater.randomValue(ymin, ymax)
    }
  }

  // 随机速度
  randomSpeed(min = this.minV, max = this.maxV) {
    return {
      vx: ParticleCreater.randomValue(min, max),
      vy: ParticleCreater.randomValue(min, max)
    }
  }

  // 随机大小
  randomSize() {
    return ParticleCreater.randomValue(this.minRadius, this.maxRadius);
  }

  // 创建粒子
  createParticles() {
    for(let i = 0; i < this.count; i++) {
      const radius = this.randomSize();
      this.particles.push(new CircleParticle(
        this.ctx,
        {
          ...this.randomPosition(radius, this.ctx.canvas.width - radius, radius, this.ctx.canvas.height - radius),
          ...this.randomSpeed(),
          radius,
          minRadius: 0.5,
          maxRadius: this.maxRadius,
          growSpeed: ParticleCreater.randomValue(0.2, 0.3)
        },
        {
          fillStyle: ParticleCreater.randomColor()
        }
      ));
    }
  }

  // 清除粒子
  clearParticles() {
    this.particles = [];
  }
}