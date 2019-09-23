export class Base {
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  set x(val) {
    this._x = Math.round(val) || 0;
  }
  get x() {
    return this._x || 0;
  }

  set y(val) {
    this._y = Math.round(val) || 0;
  }
  get y() {
    return this._y || 0;
  }

  set w(val) {
    this._w = val || 0;
  }
  get w() {
    return this._w || 0;
  }

  set h(val) {
    this._h = val || 0;
  }
  get h() {
    return this._h || 0;
  }

  // 位置相关
  get left() {
    return this._x;
  }
  set left(val) {
    this._x = val;
  }
  get top() {
    return this._y;
  }
  set top(val) {
    this._y = val;
  }
  get right() {
    return this._x + this._w;
  }
  set right(val) {
    this._x = val - this._w;
  }
  get bottom() {
    return this._y + this._h;
  }
  set bottom(val) {
    this._y = val - this._h;
  }

  // 相对位置判断
  isleft(another) {
    return this.right < another.left;
  }
  isRight(another) {
    return this.left > another.right;
  }
  isAbove(another) {
    return this.bottom < another.top;
  }
  isBelow(another) {
    return this.top > another.bottom;
  }
  isOverlap(another) {
    return !this.isleft(another) && !this.isRight(another) && !this.isAbove(another) && !this.isBelow(another);
  }
}

export class Controller extends Base {
  constructor({ x = 0, y = 0, w = 0, h = 0, vx = 0, vy = 0 } = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0 }) {
    super(x, y, w, h);
    this.vx = vx;
    this.vy = vy;
    this.moveable = true; // 可移动
    this.forbidMoveDir = 0; // 禁止移动的方向：  0: 不禁止；  3：垂直；  12：水平
    this.jumpable = true; // 可跳跃
    this.jumping = false; // 跳跃状态中
  }
  set vx(val) {
    this._vx = val || 0;
  }
  get vx() {
    return this._vx || 0;
  }

  set vy(val) {
    this._vy = val || 0;
  }
  get vy() {
    return this._vy || 0;
  }

  // 速度系数
  set speed(val) {
    this._speed = val || 1;
  }
  get speed() {
    return this._speed || 1;
  }

  // 重力加速度
  set g(val) {
    this._g = val || 1;
  }
  get g() {
    return this._g || 1;
  }

  // 起跳初速度
  set gv(val) {
    this._gv = val || 0;
  }
  get gv() {
    return this._gv || 0;
  }


  // 移动方向，9 种状态： 上：1，下：2，左：4，右：8
  setDir(dirs) {
    const type = dirs.length ? dirs.reduce((a, b) => a + b) : 0;
    // console.log(dirs, type)
    const fn = (dir) => {
      if(this.forbidMoveDir) {
        // 禁止方向
        if(this.forbidMoveDir & dir) return;
      }
      switch(dir) {
        case 1: // 上
          this.vx = 0;
          this.vy = -1;
          break;
        case 2: // 下
          this.vx = 0;
          this.vy = 1;
          break;
        case 4: // 左
          this.vx = -1;
          this.vy = 0;
          break;
        case 8: // 右
          this.vx = 1;
          this.vy = 0;
          break;
        case 5: // 左上
          this.vx = -0.7;
          this.vy = -0.7;
          break;
        case 9: // 右上
          this.vx = 0.7;
          this.vy = -0.7;
          break;
        case 6: // 左下
          this.vx = -0.7;
          this.vy = 0.7;
          break;
        case 10: // 右下
          this.vx = 0.7;
          this.vy = 0.7;
          break;
        case 0: // 停止
          this.vx = 0;
          this.vy = 0;
          break;
        default: 
          fn(dir - dirs[0]);
      }
    };
    fn(type);
  }

  // 移动
  moveTick() {
    if(this.moveable) {
      const dx = this.vx * this.speed, dy = this.vy * this.speed;
      this.x += dx;
      this.y += dy;

      this.afterMove(dx, dy);
    }
  }

  // 跳跃
  canJump() {
    return !this.jumping && this.jumpable;
  }

  saveJumpOriginY() {
    this._originY = this.y;
  }
  jump(gv = 10, g = 0.5) {
    if(this.jumpable && !this.jumping) {
      this.gv = gv;
      this.g = g;
      this._isJumpRising = true;
      this.jumping = true;
      this._jumpTempGV = this.gv;
    }
  }
  jumpTick() {
    if(!this.jumping) return;
    if(this._isJumpRising) {
      // 上升
      this.y -= this._jumpTempGV;
      this._jumpTempGV -= this.g;
      if(this._jumpTempGV <= Number.EPSILON) {
        this._isJumpRising = false;
        this._jumpTempGV = 0;
      }
    } else {
      // 下落
      this.y += this._jumpTempGV;
      this._jumpTempGV += this.g;
      if((this._jumpTempGV - this.gv) >= Number.EPSILON) {
        this.y = this._originY ? this._originY : this.y; // 消除误差
        this.jumping = false;
        this.afterJump();
      }
    }
  }

  // 绘制
  draw() {}
  afterJump() {}
  afterMove(dx, dy) {}

  // 每一帧
  tick() {
    this.moveTick();
    this.jumpTick();
    this.draw();
  }
}

