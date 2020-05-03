import { Vector, Projection } from './math.js';

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

  // 完全弹性碰撞后的速度
  static perfectlyInelasticCollide(v1, v2, m1, m2) {
    if (m1 === Infinity) {
      return [v1, -v2];
    } else if (m2 === Infinity) {
      return [-v1, v2];
    } else {
      return [
        ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2),
        ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2)
      ];
    }
  }
}
class Particle {
  constructor(
    ctx,
    {
      initStates = {
        flickering: true
      },
      vx = 0,
      vy = 0,
      x = 0,
      y = 0,
      target = null, // 移动的目的地坐标
      acceleration = 0, // 直线运动的加速度
      gravity = 0, // 重力加速度
      reduction = 1, // 反弹衰减
      mass = 0, // 质量
      friction = 0, // 摩擦力系数
      moveMode = 'step' // ease, step, spring
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
    this.acceleration = acceleration;
    this.gravity = gravity;
    this.reduction = reduction;
    this.mass = mass;
    this.friction = friction;
    this.fillStyle = fillStyle;
    this.StrokeStyle = StrokeStyle;
    this.moveMode = moveMode;
    this.initStates = initStates;

    this._flickering = !!initStates.flickering;

    if (target) {
      switch (this.moveMode) {
        case 'step':
          this.moveTo(target);
          break;
        case 'ease':
          this.startEaseMove(target);
          break;
        case 'spring':
          this.startSpringMove(target);
        default: break;
      }
    }
  }

  // 开始弹性移动
  startSpringMove(target, spring = 0.01, friction = 0.95) {
    this.target = target;
    this._springMoving = true;
    this._springMoveState = {
      spring,
      friction
    };
  }

  // 弹性移动帧
  springMoveTick() {
    if (this._springMoving) {
      this.vx += (this.target[0] - this.x) * this._springMoveState.spring;
      this.vx *= this._springMoveState.friction;
      this.vy += (this.target[1] - this.y) * this._springMoveState.spring;
      this.vy *= this._springMoveState.friction;

      this.x += this.vx;
      this.y += this.vy;

      if (Math.abs(this.vx) < 0.005 && Math.abs(this.vy) < 0.005) {
        [this.x, this.y] = this.target;
        this.vx = 0;
        this.vy = 0;
        this._springMoving = false;
        this._springMoveState = null;
      }
    }
  }

  // 开始缓动
  startEaseMove(target, ease = 0.05) {
    this.target = target;
    this._easeMoving = true;
    this._easeMoveState = {
      ease
    };
  }

  // 缓动移动帧
  easeMoveTick() {
    if (this._easeMoving) {
      this.vx = (this.target[0] - this.x) * this._easeMoveState.ease;
      this.vy = (this.target[1] - this.y) * this._easeMoveState.ease;

      this.x += this.vx;
      this.y += this.vy;

      if (Math.abs(this.vx) < 0.01 && Math.abs(this.vy) < 0.01) {
        this.vx = 0;
        this.vy = 0;
        this._easeMoving = false;
        this._easeMoveState = null;
      }
    }
  }

  // 加速运动帧
  speedUpTick() {
    this.vx = this.vx >= 0 ? this.vx + this.acceleration : this.vx - this.acceleration;
    this.vy = this.vy >= 0 ? this.vy + Math.abs(this.vy / this.vx * this.acceleration) : this.vy - Math.abs(this.vy / this.vx * this.acceleration)
  }

  // 开始移动到目标点
  moveTo(target, duration = 80, step = 2) {
    if (!target || target.length < 2) {
      return;
    }
    if (!this._baseMoving) {
      this.target = target;
      this._baseMoving = true;
      this._prevClosingDx = Math.abs(this.x - this.target[0]);
      // this.vx = (this.target[0] - this.x) / duration;
      // this.vy = (this.target[1] - this.y) / duration;
      this.vx = (this.target[0] - this.x) >= 0 ? step : -step;
      this.vy = (this.target[1] - this.y) / Math.abs(this.target[0] - this.x) * step;
    }
  }

  // 向目标移动帧
  baseMoveTick() {
    if (this._baseMoving) {
      this.x += this.vx;
      this.y += this.vy;
      this.speedUpTick();
      // 接近中
      const dx = Math.abs(this.x - this.target[0])
      if (dx > this._prevClosingDx) {
        this.x = this.target[0];
        this.y = this.target[1];
        this._baseMoving = false;
        // this.target = null;
      } else {
        this._prevClosingDx = dx
      }
    }
  }

  // 开始随机移动
  startRandomMove({ vx, vy }) {
    this._baseMoving = false;
    this._randomMoving = true;
    this._easeMoving = false;
    this._springMoving = false;
    this.vx = vx;
    this.vy = vy;
  }

  // 停止随机移动
  stopRandomMove() {
    this._randomMoving = false;
    if (this.target) {
      switch (this.moveMode) {
        case 'step':
          this.moveTo(this.target);
          break;
        case 'ease':
          this.startEaseMove(this.target);
          break;
        case 'spring':
          this.startSpringMove(this.target);
        default: break;
      }
    }
  }

  // 随机移动帧
  randomMoveTick() {
    if (this._randomMoving) {
      if (this.x + this.vx > this.ctx.canvas.width || this.x + this.vx < 0) {
        this.vx = -this.vx;
      }

      if (this.y + this.vy > this.ctx.canvas.height || this.y + this.vy < 0) {
        this.vy = -this.vy;
      }

      this.x += this.vx;
      this.y += this.vy;

      this.vx += Methods.randomValue(0, 0.7) * (Math.random() > 0.5 ? 1 : -1);
      this.vy += Methods.randomValue(0, 0.11) * (Math.random() > 0.5 ? 1 : -1);
    }
  }

  // 开始自由落体运动
  startFreeFall({ vy0, gravity, reduction, stopY, rebound = true } = {}) {
    this.reduction = reduction || this.reduction;
    this.gravity = gravity || this.gravity;
    this._freeFallState = {
      stopY,
      rebound,
      startPosition: [this.x, this.y]
    };
    this.vy = vy0;
    this._freeFalling = true;
  }

  // 停止自由落体运动
  stopFreeFall() {
    this.vy = 0;
    this._freeFalling = false;
  }

  // 自由落体运动帧
  freeFallTick() {
    if (this._freeFalling) {
      if (this.y + this.vy >= this._freeFallState.stopY) {
        this.y = this._freeFallState.stopY;

        // 是否反弹
        if (this._freeFallState.rebound && Math.abs(this.vy) >= 2) {
          this.vy *= -this.reduction;

        } else {
          this.vy = 0;
          this._freeFalling = false;
        }
      } else {
        this.y += this.vy;
        this.vy += this.gravity;
      }
    }
  }

  // 无动画移动
  directMoveTo(x, y) {
    this.x = x;
    this.y = y;
  }

  // 反向速度
  reverseSpeed() {
    this.vx = -this.vx;
    this.vy = -this.vy;
  }

  // 获取当前位置
  getPosition() {
    return {
      x: this.x,
      y: this.y
    };
  }

  // 设置速度
  setSpeed(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  // 开始闪烁
  startFlicker() {
    this._flickering = true;
  }

  // 停止闪烁
  stopFlicker() {
    this._flickering = false;
  }

  // 每一帧
  tick() {
  }

  /**
    get x() {
      if(!Number.isNaN(+this.width)) {
        return this._x + this.width / 2;
      } else {
        return this._x;
      }
    }
    set x(val) {
      if(!Number.isNaN(+this.width)) {
        this._x = val - this.width / 2;
      } else {
        this._x = val;
      }
    }

    get y() {
      if(!Number.isNaN(+this.height)) {
        return this._y + this.height / 2;
      } else {
        return this._y;
      }
    }
    set y(val) {
      if(!Number.isNaN(+this.height)) {
        this._y = val - this.height / 2;
      } else {
        this._y = val;
      }
    }
  */
}

// 圆形粒子
export class CircleParticle extends Particle {
  constructor(ctx, params = {}, options) {
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
    this.springMoveTick();
    this.easeMoveTick();
    this.freeFallTick();
    this.randomMoveTick();
    this.baseMoveTick();
    this.flickerTick();
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

    if (this.vx !== 0 && this.vy !== 0) {
      const rad = Math.atan2(Math.abs(this.vy), Math.abs(this.vx));

      const dvx = this.friction * this.mass * Math.cos(rad);
      const dvy = this.friction * this.mass * Math.sin(rad);

      const tvx = this.vx > 0 ? this.vx - dvx : this.vx + dvx;
      const tvy = this.vy > 0 ? this.vy - dvy : this.vy + dvy;

      if ((tvx > 0 && this.vx < 0) || tvx < 0 && this.vx > 0) {
        this.vx = 0;
        this.vy = 0;
      } else {
        this.vx = tvx;
        this.vy = tvy;
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

  isInside(x, y) {
    return (this.x - x) ** 2 + (this.y - y) ** 2 < this.radius ** 2;
  }
}

// 外接圆多边形型
export class CircumcenterPolygonParticle extends CircleParticle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    const kv = {
      degrees: [],
      rotateSpeed: 0,
      transitDuration: 20
    };
    Methods.setParams(this, params, kv);

    this.pauseMove = false;
    this.init();
  }

  init() {
    // this.randomChange();
    // this.moveTo([0, 0]);
  }

  // 完全弹性碰撞
  perfectlyCollide(cpp) {
    const thisMass = this.pauseMove ? Infinity : this.mass;
    const cppMass = cpp.pauseMove ? Infinity : cpp.mass;
    const vxs = Methods.perfectlyInelasticCollide(this.vx, cpp.vx, thisMass, cppMass);
    const vys = Methods.perfectlyInelasticCollide(this.vy, cpp.vy, thisMass, cppMass);
    [this.vx, this.vy] = [vxs[0], vys[0]];
    [cpp.vx, cpp.vy] = [vxs[1], vys[1]];
  }

  // 检测碰撞
  collideWith(cpp) {
    let isCollided = true;
    if (this.degrees.length && cpp.degrees.length) {
      // 两个都是多边形
      const thisVectors = this.getVertexVector();
      const anotherVectors = cpp.getVertexVector();
      const axises = [...this.getVertexAxis(thisVectors), ...this.getVertexAxis(anotherVectors)];

      // 循环判断各轴
      for (let i = 0, len = axises.length; i < len; i++) {
        const thisProjection = new Projection(thisVectors.map(vector => vector.dotProduct(axises[i])));
        const anotherProjection = new Projection(anotherVectors.map(vector => vector.dotProduct(axises[i])));

        if (!thisProjection.isOverlapWith(anotherProjection)) {
          isCollided = false;
          break;
        }
      }


    } else if (!this.degrees.length && !cpp.degrees.length) {
      // 两个都是圆
      isCollided = (this.x - cpp.x) ** 2 + (this.y - cpp.y) ** 2 <= (this.radius + cpp.radius) ** 2

    } else {
      // 一个是圆，另一个是多边形
      let circle = null;
      let polygon = null;
      if (!this.degrees.length) {
        circle = this;
        polygon = cpp;
      } else {
        circle = cpp;
        polygon = this;
      }

      const polygonVectors = polygon.getVertexVector();
      let circleAxis = null;
      polygonVectors.map(vector => {
        const cv = vector.subtract(new Vector(circle.x, circle.y));
        if (!circleAxis || cv.length < circleAxis.length) {
          circleAxis = cv;
        }
      });
      circleAxis = circleAxis.normalize();
      const circleVector = [
        (new Vector(circle.x, circle.y)).subtract(circleAxis.antiNormalize(circle.radius)),
        (new Vector(circle.x, circle.y)).add(circleAxis.antiNormalize(circle.radius))
      ];
      const axises = [circleAxis, ...this.getVertexAxis(polygonVectors)];

      // 循环判断各轴
      for (let i = 0, len = axises.length; i < len; i++) {
        const circleProjection = new Projection(circleVector.map(vector => vector.dotProduct(axises[i])));
        const polygonProjection = new Projection(polygonVectors.map(vector => vector.dotProduct(axises[i])));

        if (!circleProjection.isOverlapWith(polygonProjection)) {
          isCollided = false;
          break;
        }
      }

    }

    if (this._prevTickCollided && isCollided) {
      return false;
    } else {
      this._prevTickCollided = isCollided;
      return isCollided;
    }
  }

  // 获取顶点向量
  getVertexVector() {
    return this.degrees.map(deg => new Vector(
      this.x + this.radius * Math.cos(deg / 180 * Math.PI),
      this.y + this.radius * Math.sin(deg / 180 * Math.PI)
    ));
  }

  // 获取投影轴
  getVertexAxis(vectors) {
    return vectors.map(((vc, index) => vc.edgeVector(vectors[(index + 1) % vectors.length]).verticalUnitVector()));
  }

  // 随机变形
  randomChange() {
    this.createRegular(3);
    const randomDuration = Math.floor(Methods.randomValue(500, 1500));
    setTimeout(() => {
      let random;
      do {
        random = Math.floor(Methods.randomValue(3, 10));
      } while (random === this.degrees.length);
      this.changeTo(random);
    }, randomDuration);
  }

  // 移动帧
  moveTick() {
    if (!this._baseMoving && !this._randomMoving && !this._freeFalling) {
      this.move();
    }
  }

  // 暂停
  pause() {
    this.vx = 0;
    this.vy = 0;
    this.pauseMove = true;
  }

  // 恢复
  resume() {
    if (this.pauseMove === true) {
      this.pauseMove = false;
    }
  }

  tick() {
    if (!this.pauseMove) {
      this.randomMoveTick();
      this.baseMoveTick();
      this.moveTick();
    }
    this.collisionDetect && this.collisionDetect();
    this.transitionTick();
    this.rotateTick();
    this.flickerTick();
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.StrokeStyle;
    this.ctx.beginPath();
    if (this.degrees.length) {
      this.degrees.forEach(deg => {
        const rad = deg / 180 * Math.PI;
        this.ctx.arc(this.x, this.y, this.radius, rad, rad, false);
      });
    } else {
      this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    }

    this.ctx.fill();
    this.ctx.restore();
  }

  // 过渡到n边形
  changeTo(n, cb) {
    if (n < 3 || this._transiting) {
      return;
    }
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
  transitionTick() {
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
            if (Math.abs(dg - this._changeState.toGap) < 1e-5) {
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
            if (Math.abs(dg - this._changeState.toGap) < 1e-5) {
              stop = true;
            }
          }
          return deg;
        });
        const len = this.degrees.length;
        if (len > this._changeState.to) {
          if (
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
  rotateTick() {
    if (this.degrees) {
      this.degrees = this.degrees.map(deg => {
        deg = (deg - this.rotateSpeed + 360) % 360;
        return deg;
      });
    }
  }

  // 创建正多边形
  createRegular(count = 3) {
    if (count < 3) {
      return;
    }
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