
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
      growSpeed: 0
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

// 外接圆多边形型
export class CircumcenterPolygonParticle extends CircleParticle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    const kv = {
      degrees: [0, 120, 240],
      rotateSpeed: 0,
      transitDuration: 20
    };
    Methods.setParams(this, params, kv);

    this.init();
  }

  init() {
    let random = Math.floor(Methods.randomValue(3, 10));
    this.createRegular(random);
    // this.degrees = this.randomDegrees(6, { minGap: 30 });
    setTimeout(() => {
      random = Math.floor(Methods.randomValue(3, 10));
      this.changeTo(random);
    }, 500);
  }

  tick() {
    this.transition();
    this.rotate();
    this.flicker();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.StrokeStyle;
    this.ctx.beginPath();
    this.degrees.forEach(deg => {
      const rad = deg / 180 * Math.PI;
      this.ctx.arc(this.x, this.y, this.radius, rad, rad, false);
    });
    this.ctx.fill();
    this.ctx.restore();
  }

  // 过渡到n边形
  changeTo(n, cb) {
    if (this.isRegular) {
      const from = this.degrees.length;
      const fromGap = 360 / from;
      const dn = n - from;
      this._changeState = {
        from,
        to: n,
        dn,
        fromGap,
        toGap: 360 / n,
        gapPerTick: Math.abs((fromGap - 360 / n) / (this.transitDuration))
      };
      this.toDegrees = Array.from({ length: n }, (it, index) => index * 360 / n);

      if (dn > 0) {
        this.degrees.push(...Array(dn).fill(this.degrees[0]));
        this._transiting = true;
        this._transitionCallback = cb;
      } else if (dn < 0) {
        this._transiting = true;
        this._transitionCallback = cb;
      }
    }
  }

  // 形状改变过渡效果
  transition() {
    if (this.isRegular && this._transiting) {
      let stop = false;
      if (this._changeState.dn > 0) {
        // 增加边
        this.degrees = this.degrees.map((deg, index, arr) => {
          let offGap = 0;
          if (index > this._changeState.from) {
            offGap = (index - this._changeState.from) * this._changeState.fromGap / this.transitDuration;
          }
          const gapPerTick = this._changeState.gapPerTick * index - offGap;

          deg = (deg - gapPerTick + 360) % 360;

          if (index === 1) {
            const dg = deg - arr[0] < 0 ? deg - arr[0] + 360 : deg - arr[0];
            if(Math.abs(dg - this._changeState.toGap) < 1e-5) {
              stop = true;
            }
          }
          return deg;
        });
      } else if (this._changeState.dn < 0) {
        // 减少边
        this.degrees = this.degrees.map((deg, index, arr) => {
          deg = (deg + this._changeState.gapPerTick * index) % 360;

          if (index === 1) {
            const dg = deg - arr[0] < 0 ? deg - arr[0] + 360 : deg - arr[0];
            if(Math.abs(dg - this._changeState.toGap) < 1e-5) {
              stop = true;
            }
          }
          return deg;
        });
        const len = this.degrees.length;
        if(len > this._changeState.to) {
          if(
            this._prevl !== undefined &&
            this._prevl !== null &&
            (
              this._prevl > this.degrees[len - 1] ||
              (this._prevf >= this._prevl && this.degrees[0] <= this.degrees[len - 1]) ||
              (this._prevf <= this._prevl && this.degrees[0] >= this.degrees[len - 1])
            )
          ) {
            this.degrees.pop();
            this._prevl = null;
            this._
          } else {
            this._prevl = this.degrees[len - 1];
            this._prevf = this.degrees[0];
          }
        }

      }
      // console.log(this.degrees)
      if (stop) {
        this._transiting = false;
        this._changeState = null;
        this._transitionCallback && this._transitionCallback();
      }
    }
  }

  // 旋转
  rotate() {
    if (this.degrees) {
      this.degrees = this.degrees.map(deg => {
        deg = (deg - this.rotateSpeed + 360) % 360;
        return deg;
      });
    }
  }

  // 创建正多边形
  createRegular(count = 3) {
    this.degrees = this.randomDegrees(count, { isRegular: true });
  }

  // 随机获取多边形顶点
  randomDegrees(count = 3, { minDeg = 0, maxDeg = 360, minGap = 10, isRegular = false } = {}) {
    this.isRegular = isRegular; // 是否正多边形

    count = count < 3 ? 3 : count;

    if (isRegular) {
      // 正多边形
      const gap = 360 / count;
      return Array.from({ length: count }, (it, index) => index * gap);
    } else {
      const degrees = [];
      const trueMinGap = 180 / (count - 1);
      minGap = trueMinGap < minGap ? trueMinGap : minGap;
      for (let i = 0; i < count; i++) {
        let random;
        do {
          random = Methods.randomValue(minDeg, maxDeg);
        } while (degrees.some(deg => Math.abs(deg - random) < minGap));
        degrees.push(random);
      }
      return degrees.sort((a, b) => a - b);
    }
  }
}

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
        /*
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
        ),
        */
        // 多边形粒子
        new CircumcenterPolygonParticle(
          this.ctx,
          {
            x: this.ctx.canvas.width / 2,
            y: this.ctx.canvas.height / 2,
            radius: 100,
            growSpeed: 0,
            rotateSpeed: 1
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