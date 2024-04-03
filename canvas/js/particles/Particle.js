import { Methods } from "../math.js";

export class Particle {
  constructor(
    ctx,
    {
      initStates = {
        flickering: false,
        baseMoving: false,
        freeFalling: false,
        springMoving: false,
        easeMoving: false,
        pauseMove: true,
        rotating: false,
        moving: false,
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
      moveMode = "step", // ease, step, spring
      text = "", // 显示的文字
    } = {},
    {
      fillStyle = "#000",
      strokeStyle = "#000",
      textOptions = {},
      // transform = [1, 0, 0, 1] // 矩阵变换, 前四个参数，不包括位移
    } = {}
  ) {
    // 四个方向上的冻结状态
    this._frozenStatus = {
      xp: false, // x 轴正方向，右
      xn: false, // x 轴负方向，左
      yp: false, // y 轴正方向，下
      yn: false, // y 轴负方向，上
    };
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
    this.strokeStyle = strokeStyle;
    // this.transform = transform;
    this.textOptions = {
      fontType: "24px SimHei",
      textColor: "#fff",
      textOffsetX: 0,
      textOffsetY: 0,
      ...textOptions,
    };

    this.moveMode = moveMode;
    this.initStates = initStates;
    this.text = text;

    this._flickering = !!initStates.flickering;
    this._baseMoving = !!initStates.baseMoving;
    this._freeFalling = !!initStates.freeFalling;
    this._springMoving = !!initStates.springMoving;
    this._easeMoving = !!initStates.easeMoving;
    this.pauseMove = !!initStates.pauseMove;
    this._rotating = !!initStates.rotating;
    this._moving = !!initStates.moving;
    this._speedDirection = {}; // 根据上次的位置判断当前的移动方向

    if (target) {
      switch (this.moveMode) {
        case "step":
          this.moveTo(target);
          break;
        case "ease":
          this.startEaseMove(target);
          break;
        case "spring":
          this.startSpringMove(target);
        default:
          break;
      }
    }
  }

  // 开始弹性移动
  startSpringMove(target, spring = 0.01, friction = 0.95) {
    this.target = target;
    this._springMoving = true;
    this._springMoveState = {
      spring,
      friction,
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
      ease,
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
    this.vy =
      this.vy >= 0
        ? this.vy + Math.abs((this.vy / this.vx) * this.acceleration)
        : this.vy - Math.abs((this.vy / this.vx) * this.acceleration);
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
      this.vx = this.target[0] - this.x >= 0 ? step : -step;
      this.vy = ((this.target[1] - this.y) / Math.abs(this.target[0] - this.x)) * step;
    }
  }

  // 向目标移动帧
  baseMoveTick() {
    if (this._baseMoving) {
      this.x += this.vx;
      this.y += this.vy;
      this.speedUpTick();
      // 接近中
      const dx = Math.abs(this.x - this.target[0]);
      if (dx > this._prevClosingDx) {
        this.x = this.target[0];
        this.y = this.target[1];
        this._baseMoving = false;
        // this.target = null;
      } else {
        this._prevClosingDx = dx;
      }
    }
  }

  // 开始移动
  startMove({ vx, vy }) {
    this._moving = true;
    this._baseMoving = false;
    this._randomMoving = false;
    this._easeMoving = false;
    this._springMoving = false;
    this.vx = vx;
    this.vy = vy;
  }

  // 结束移动
  stopMove() {
    this._moving = false;
  }

  // 移动帧
  moveTick(force = false) {
    if (this._moving || force) {
      if (this.x + this.vx > this.ctx.canvas.width || this.x + this.vx < 0) {
        this.vx = -this.vx;
      }

      if (this.y + this.vy > this.ctx.canvas.height || this.y + this.vy < 0) {
        this.vy = -this.vy;
      }

      this.x += this.vx;
      this.y += this.vy;
    }
  }

  // 开始随机移动
  startRandomMove({ vx, vy }) {
    this._moving = false;
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
        case "step":
          this.moveTo(this.target);
          break;
        case "ease":
          this.startEaseMove(this.target);
          break;
        case "spring":
          this.startSpringMove(this.target);
        default:
          break;
      }
    }
  }

  // 随机移动帧
  randomMoveTick() {
    if (this._randomMoving) {
      this.moveTick(true);

      this.vx += Methods.randomValue(0, 0.7) * (Math.random() > 0.5 ? 1 : -1);
      this.vy += Methods.randomValue(0, 0.11) * (Math.random() > 0.5 ? 1 : -1);
    }
  }

  // 开始自由落体运动
  startFreeFall({ vy0, stopY, gravity, reduction, rebound = true, keeping = false } = {}) {
    this.reduction = reduction || this.reduction;
    this.gravity = gravity || this.gravity;
    this._freeFallState = {
      stopY,
      rebound,
      startPosition: [this.x, this.y],
      lastReboundedV: null,
      keeping,
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
        if (this._freeFallState.rebound) {
          this.vy *= -this.reduction;

          if (this._freeFallState.lastReboundedV !== null && this.vy - this._freeFallState.lastReboundedV <= 0.5) {
            this.vy = 0;
            !this._freeFallState.keeping && (this._freeFalling = false);
          } else {
            this._freeFallState.lastReboundedV = this.vy;
          }
        } else {
          this.vy = 0;
          !this._freeFallState.keeping && (this._freeFalling = false);
        }
      } else {
        this.y += this.vy;
        this.vy += this.gravity;
      }
    }
  }

  // 无动画移动
  directMoveTo(x, y) {
    // 记录移动方向
    // this.speedDirection = {
    //   vxDir: x - this.x === 0 ? 1 : (x - this.x) / Math.abs(x - this.x),
    //   vyDir: y - this.y === 0 ? 1 : (y - this.y) / Math.abs(y - this.y),
    // };

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
      y: this.y,
    };
  }

  // 设置速度
  setSpeed(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  // 设置相对位置
  setAbsolutePosition(dx, dy) {
    if (!(this._frozenStatus.xn && dx < 0) || !(this._frozenStatus.xp && dx > 0)) {
      this.x += dx;
    }
    if (!(this._frozenStatus.yn && dy < 0) || !(this._frozenStatus.yp && dy > 0)) {
      this.y += dy;
    }
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
  tick() {}

  // 当前的质量
  get currentMass() {
    return this.pauseMove ? Infinity : this.mass || 0;
  }

  // 速度方向
  get speedDirection() {
    if (!this.pauseMove) {
      // 移动时
      return {
        vxDir: this.vx === 0 ? 1 : this.vx / Math.abs(this.vx),
        vyDir: this.vy === 0 ? 1 : this.vy / Math.abs(this.vy),
      };
    } else {
      // 手动拖动时
      return this._speedDirection;
    }
  }
  set speedDirection(val) {
    this._speedDirection = val;
  }

  // 设置坐标监听
  beforeSetX() {
    return null;
  }
  get x() {
    return this._x || 0;
  }
  set x(val) {
    // if ((this._frozenStatus.xn && val - this.x < 0) || (this._frozenStatus.xp && val - this.x > 0)) {
    //   return;
    // }
    if (Number.isNaN(+val)) {
      throw new TypeError(`x: ${val}`);
    }
    const returnVal = this.beforeSetX(val);
    if (returnVal === false) {
      return;
    }
    if (returnVal !== null && returnVal !== undefined) {
      return (this._x = returnVal);
    }
    this._x = val;

    if (!this.prevX) {
      this.prevX = [val];
    } else {
      this.prevX.unshift(val);
      this.prevX.length = 2;
    }
  }

  beforeSetY() {
    return null;
  }
  get y() {
    return this._y || 0;
  }
  set y(val) {
    // if ((this._frozenStatus.yn && val - this.y < 0) || (this._frozenStatus.yp && val - this.y > 0)) {
    //   return;
    // }
    if (Number.isNaN(+val)) {
      throw new TypeError(`y: ${val}`);
    }
    const returnVal = this.beforeSetY(val);
    if (returnVal === false) {
      return;
    }
    if (returnVal !== null && returnVal !== undefined) {
      return (this._y = returnVal);
    }
    this._y = val;

    if (!this.prevY) {
      this.prevY = [val];
    } else {
      this.prevY.unshift(val);
      this.prevY.length = 2;
    }
  }
}
