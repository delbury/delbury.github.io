export class CanvasEffect {
  constructor(ele) {
    if(!ele || ele.tagName != 'CANVAS') {
      throw new TypeError('错误的canvas元素');
    }

    this.ctx = ele.getContext('2d');
    this.canvas = this.ctx.canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.pcs = null;
    this.init();
  }

  // 初始化
  init() {
    this.pcs = new ParticleCreater(this.ctx);
    this.tick();
  }

  // 帧动画
  tick() {
    if(!this.pcs) {
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.pcs.particles.forEach(part => {
      part.tick();
    });
    return requestAnimationFrame(() => {
      this.tick();
    });
  }
}

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

  // 移动
  move() {}

  // 每一帧
  tick() {}
}

// 圆形粒子
class CircleParticle extends Particle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    this.radius = params.radius;
  }

  tick() {
    this.move();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.StrokeStyle;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.restore();
  }

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
}

class ParticleCreater {
  constructor(
    ctx,
    {
      count = 50,
      minRadius = 3,
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
  randomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 随机位置
  randomPosition(
    xmin = 0,
    xmax = this.ctx.canvas.width,
    ymin = 0,
    ymax = this.ctx.canvas.width
  ) {
    return {
      x: this.randomValue(xmin, xmax),
      y: this.randomValue(ymin, ymax)
    }
  }

  // 随机速度
  randomSpeed(min = this.minV, max = this.maxV) {
    return {
      vx: this.randomValue(min, max),
      vy: this.randomValue(min, max)
    }
  }

  // 随机颜色
  randomColor() {
    return '#' + Math.floor(Math.random() * 2 ** 24).toString(16);
  }

  // 随机大小
  randomSize() {
    return this.randomValue(this.minRadius, this.maxRadius);
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
          radius
        },
        {
          fillStyle: this.randomColor()
        }
      ));
    }
  }

  // 清除粒子
  clearParticles() {
    this.particles = [];
  }
}