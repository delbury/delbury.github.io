import { CircleParticle } from './CircleParticle.js';
import { Vector, Projection, Methods } from '../math.js';

// 外接圆多边形型
export class CircumcenterPolygonParticle extends CircleParticle {
  constructor(ctx, params, options) {
    super(ctx, params, options);

    const kv = {
      degrees: [],
      rotateSpeed: 0,
      transitDuration: 25
    };
    Methods.setParams(this, params, kv);

    this.pauseMove = false;
    this.init();
  }

  init() {
    // this.randomChange();
    // this.moveTo([0, 0]);
  }

  beforeSetX(val) {
    if (!this.degrees.length) {
      return super.beforeSetX(val);
    } else {
      const { min, max } = this.vertexRange.x
      if (min + val <= 0) {
        this._frozenStatus.xn = true;
        this.vx = -this.vx;
        return -min;
      } else if (max + val >= this.ctx.canvas.width) {
        this._frozenStatus.xp = true;
        this.vx = -this.vx;
        return this.ctx.canvas.width - max;
      } else {
        this._frozenStatus.xn = false;
        this._frozenStatus.xp = false;
        return val;
      }
    }
  }
  beforeSetY(val) {
    if (!this.degrees.length) {
      return super.beforeSetY(val);
    } else {
      const { min, max } = this.vertexRange.y;
      if (min + val <= 0) {
        this._frozenStatus.yn = true;
        this.vy = -this.vy;
        return -min;
      } else if (max + val >= this.ctx.canvas.height) {
        this._frozenStatus.yp = true;
        this.vy = -this.vy;
        return this.ctx.canvas.height - max;
      } else {
        this._frozenStatus.yn = false;
        this._frozenStatus.yp = false;
        return val;
      }
    }
  }

  // 非对心碰撞
  noncentricCollide(cpp) {
    const thisSpeedVector = new Vector(this.vx, this.vy); // VA的速度向量
    const cppSpeedVector = new Vector(cpp.vx, cpp.vy); // VB的速度向量
    const centroidVector = new Vector(cpp.centroid[0] - this.centroid[0], cpp.centroid[1] - this.centroid[1]).normalize(); // AB质心连线的向量
    const centroidVerticalVector = centroidVector.verticalUnitVector(false); // AB质心连线的法向量（逆时针）

    const thisSpeedParallel = thisSpeedVector.dotProduct(centroidVector);
    const thisSpeedVertical = thisSpeedVector.dotProduct(centroidVerticalVector);

    const cppSpeedParallel = cppSpeedVector.dotProduct(centroidVector);
    const cppSpeedVertical = cppSpeedVector.dotProduct(centroidVerticalVector);

    const [thisVP, cppVP] = Methods.perfectlyInelasticCollide(thisSpeedParallel, cppSpeedParallel, this.currentMass, cpp.currentMass); // 质心连线向量上的动量守恒

    // 碰撞后的分量速度重新换算成 vx,vy
    const thisVx = centroidVector.multiply(thisVP).dotProduct(new Vector(1, 0)) +
      centroidVerticalVector.multiply(thisSpeedVertical).dotProduct(new Vector(1, 0));
    const thisVy = centroidVector.multiply(thisVP).dotProduct(new Vector(0, 1)) +
      centroidVerticalVector.multiply(thisSpeedVertical).dotProduct(new Vector(0, 1));

    const cppVx = centroidVector.multiply(cppVP).dotProduct(new Vector(1, 0)) +
      centroidVerticalVector.multiply(cppSpeedVertical).dotProduct(new Vector(1, 0));
    const cppVy = centroidVector.multiply(cppVP).dotProduct(new Vector(0, 1)) +
      centroidVerticalVector.multiply(cppSpeedVertical).dotProduct(new Vector(0, 1));

    this.vx = thisVx;
    this.vy = thisVy;
    cpp.vx = cppVx;
    cpp.vy = cppVy;
  }

  // 完全弹性碰撞
  perfectlyCollide(cpp, e = 1) {
    const vxs = Methods.perfectlyInelasticCollide(this.vx, cpp.vx, this.currentMass, cpp.currentMass, e);
    const vys = Methods.perfectlyInelasticCollide(this.vy, cpp.vy, this.currentMass, cpp.currentMass, e);
    [this.vx, this.vy] = [vxs[0], vys[0]];
    [cpp.vx, cpp.vy] = [vxs[1], vys[1]];
  }

  // 检测碰撞
  collideWith(cpp) {
    let isCollided = true;
    const collidedAxises = []; // 产生碰撞的投影轴
    if (this.degrees.length && cpp.degrees.length) {
      // 两个都是多边形

      // 获取各多边形的顶点向量
      const thisVectors = this.getVertexVector();
      const anotherVectors = cpp.getVertexVector();
      const axises = [...this.getVertexAxis(thisVectors), ...this.getVertexAxis(anotherVectors)]; // 获取投影轴向量

      // 循环判断各轴
      for (let i = 0, len = axises.length; i < len; i++) {
        // 计算各边在投影轴上的投影
        const thisProjection = new Projection(thisVectors.map(vector => vector.dotProduct(axises[i])));
        const anotherProjection = new Projection(anotherVectors.map(vector => vector.dotProduct(axises[i])));

        const len = thisProjection.overlapWith(anotherProjection)
        if (!len) {
          isCollided = false;
          break;
        } else {
          // const source = i >= this.degrees.length ? cpp.degrees.length : this.degrees.length;
          const reverse = i < this.degrees.length;

          // 计算质心
          const thisCentroid = this.centroid;
          const cppCentroid = cpp.centroid;

          collidedAxises.push({
            axis: reverse ? axises[i].reverse() : axises[i],
            overlapLength: len,
            centerVector: new Vector(cppCentroid[0] - thisCentroid[0], cppCentroid[1] - thisCentroid[1])
            // source,
            // reverse
          });
        }
      }


    } else if (!this.degrees.length && !cpp.degrees.length) {
      // 两个都是圆
      isCollided = (this.x - cpp.x) ** 2 + (this.y - cpp.y) ** 2 <= (this.radius + cpp.radius) ** 2
      if (isCollided) {
        collidedAxises.push({
          axis: new Vector(cpp.x - this.x, cpp.y - this.y),
          overlapLength: (this.radius + cpp.radius) - Math.sqrt((this.x - cpp.x) ** 2 + (this.y - cpp.y) ** 2)
        });
      }
    } else {
      // 一个是圆，另一个是多边形
      let circle = null;
      let polygon = null;
      let clockwise = true;
      if (!this.degrees.length) {
        circle = this;
        polygon = cpp;
      } else {
        circle = cpp;
        polygon = this;
        clockwise = false;
      }

      const polygonVectors = polygon.getVertexVector(); // 多边形的顶点向量
      let circleAxis = null;
      polygonVectors.map(vector => {
        const cv = vector.subtract(new Vector(circle.x, circle.y));
        if (!circleAxis || cv.length < circleAxis.length) {
          circleAxis = cv;
        }
      });
      circleAxis = circleAxis.normalize(!clockwise); // 圆心到多变形最近的顶点的投影轴向量

      const axises = [circleAxis, ...this.getVertexAxis(polygonVectors, clockwise)]; // 需要计算的各投影轴

      // 循环判断各轴
      for (let i = 0, len = axises.length; i < len; i++) {
        // 计算圆相对于投影轴的顶点向量
        const circleVector = [
          (new Vector(circle.x, circle.y)).subtract(axises[i].antiNormalize(circle.radius)),
          (new Vector(circle.x, circle.y)).add(axises[i].antiNormalize(circle.radius))
        ];

        const circleProjection = new Projection(circleVector.map(vector => vector.dotProduct(axises[i])));
        const polygonProjection = new Projection(polygonVectors.map(vector => vector.dotProduct(axises[i])));

        const len = circleProjection.overlapWith(polygonProjection)
        if (!len) {
          isCollided = false;
          break;
        } else {
          collidedAxises.push({
            axis: axises[i],
            overlapLength: len,
            centerVector: new Vector(cpp.centroid[0] - this.centroid[0], cpp.centroid[1] - this.centroid[1])
          });
        }
      }

    }

    // 计算最短碰撞重叠向量
    let minAxis = null;
    if (isCollided) {
      minAxis = collidedAxises[0];
      for (let i = 1; i < collidedAxises.length; i++) {
        if (collidedAxises[i].overlapLength < minAxis.overlapLength) {
          minAxis = collidedAxises[i];
        }
      }

      let reverse = false;
      if (minAxis.centerVector && minAxis.centerVector.angleWith(minAxis.axis) > 90) {
        // 判断是否需要反向
        // 若为钝角，则反向
        reverse = true;
      }
      minAxis = {
        ...minAxis,
        axis: minAxis.axis.normalize(reverse),
        overlapLength: minAxis.overlapLength,
        reverse
      }
    }

    if (this._prevTickCollided && isCollided) {
      // 碰撞后重叠
      return { status: -1, collidedAxises, minAxis };
    } else {
      this._prevTickCollided = isCollided;
      return { status: Number(isCollided), collidedAxises, minAxis };
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
  getVertexAxis(vectors, clockwise) {
    return vectors.map(((vc, index) => vc.edgeVector(vectors[(index + 1) % vectors.length]).verticalUnitVector(clockwise)));
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
    if (!this._baseMoving && !this._randomMoving) {
      this.move();
    }
  }

  // 暂停
  pause() {
    this.vx = 0;
    this.vy = 0;
    this.pauseMove = true;
    this._freeFalling = false;
  }

  // 恢复
  resume(params = {}) {
    if (this.pauseMove === true) {
      this.pauseMove = false;
    }

    if (!params || typeof params !== 'object') {
      return;
    }
    if (params.fallOptions) {
      this.startFreeFall(params.fallOptions)
    }
  }

  // 移动帧
  move() {
    // if (this.x + this.vx + this.radius > this.ctx.canvas.width || this.x + this.vx - this.radius < 0) {
    //   this.vx = -this.vx;
    // }

    // if (this.y + this.vy + this.radius > this.ctx.canvas.height || this.y + this.vy - this.radius < 0) {
    //   if (!this._freeFalling) {
    //     this.vy = -this.vy;
    //   }
    // }

    if (this.vx) {
      this.x += this.vx;
    }
    if (!this._freeFalling && this.vy) {
      this.y += this.vy;
    }

    if (this.vx !== 0 || this.vy !== 0) {
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

  // 状态改变
  changeStatus() {
    if (!this.pauseMove) {
      this.randomMoveTick();
      this.baseMoveTick();
      this.moveTick();
    }
    this.freeFallTick();
    this.transitionTick();
    this.rotateTick();
    this.flickerTick();

  }

  // 绘制
  draw() {
    this.ctx.save();
    this.ctx.fillStyle = this.fillStyle;
    // this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.beginPath();
    const dx = 0;
    const dy = 0;
    // this.ctx.setTransform(this.transform[0], this.transform[1], this.transform[2], this.transform[3], dx, dy); // 设置形变
    if (this.degrees.length) {
      this.degrees.forEach(deg => {
        const rad = deg / 180 * Math.PI;
        this.ctx.arc(this.x - dx, this.y - dy, this.radius, rad, rad, false);
      });
    } else {
      this.ctx.arc(this.x - dx, this.y - dy, this.radius, 0, Math.PI * 2, false);
    }

    this.ctx.fill();
    if (this.text) {
      // 绘制文本
      this.ctx.fillStyle = this.textOptions.textColor;
      this.ctx.font = this.textOptions.fontType;
      this.ctx.textBaseline = 'middle';
      const width = this.ctx.measureText(this.text).width;
      const position = this.centroid;
      this.ctx.fillText(this.text, position[0] - width / 2 + this.textOptions.textOffsetX - dx, position[1] + this.textOptions.textOffsetY - dy);
    }

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 还原形变
    this.ctx.restore();
  }

  tick() {
    this.changeStatus();
    this.draw();
  }

  // 过渡到n边形
  changeTo(to, cb) {
    if (to < 3 || this._transiting || to === this.degrees.length) {
      cb && cb();
      return;
    }
    if (this.isRegular) {
      const from = this.degrees.length;
      const fromGap = 360 / from;
      const toGap = 360 / to;
      const dn = to - from;

      this.toDegrees = Array.from({ length: to }, (it, index) => +(index * 360 / to).toFixed(2));
      if(dn < 0) {
        this.toDegrees.push(...Array(-dn).fill(0));
      }
      this._changeState = {
        from,
        to,
        dn,
        fromGap,
        toGap,
        gapPerTick: Math.abs((fromGap - 360 / to) / (this.transitDuration)),
        gapPerTicks: Array.from({ length: Math.max(to, from) }, (it, index) => {
          if(dn > 0) {
            return ((index < from ? this.degrees[index] : 360) - this.toDegrees[index]) / this.transitDuration;

          } else if(dn < 0) {
            return Math.abs(index < to ? (this.degrees[index] - this.toDegrees[index]) : (360 - this.degrees[index])) / this.transitDuration;
            
          }
        }),
      };

      if (dn > 0) {
        this.degrees.push(...Array(dn).fill(360));
        this._transiting = true;
        this._transitionCallback = cb;
      } else if (dn < 0) {
        this._transiting = true;
        this._transitionCallback = cb;
      }
      this.toDegressGT = this.toDegrees.map((td, index) => td >= this.degrees[index]); // 目标角度是否大于等于原始角度

      // console.log('****************');
      // console.log(this._changeState);
      // console.log(this.degrees);
      // console.log(this.toDegrees);
      // console.log(this.toDegressGT);
      // console.log('****************');
    }
  }

  // 形状改变过渡效果
  transitionTick() {
    if (this.isRegular && this._transiting) {
      let stop = false;
      if (this._changeState.dn > 0) {
        // 增加边
        this.degrees = this.degrees.map((deg, index, arr) => {
          if(deg !== this.toDegrees[index]) {
            deg = deg - this._changeState.gapPerTicks[index];

          } else {
            return +(deg).toFixed(2);
          }
          
          if(
            (this.toDegressGT[index] && (deg + 360 <= this.toDegrees[index])) || 
            (!this.toDegressGT[index] && (deg <= this.toDegrees[index]))
          ) {
            deg = this.toDegrees[index];
          }

          return +((deg + 360) % 360).toFixed(2);
        });

      } else if (this._changeState.dn < 0) {
        // 减少边
        this.degrees = this.degrees.map((deg, index, arr) => {
          if(deg !== this.toDegrees[index]) {
            deg = deg + this._changeState.gapPerTicks[index];

          } else {
            return +(deg).toFixed(2);
          }
          
          if(
            (this.toDegressGT[index] && (deg >= this.toDegrees[index])) || 
            (!this.toDegressGT[index] && (deg - 360 >= this.toDegrees[index]))
          ) {
            deg = this.toDegrees[index];
          }
          return +((deg + 360) % 360).toFixed(2);
        });
      }

      if(this.degrees[this.degrees.length - 1] === this.toDegrees[this.degrees.length - 1]) stop = true;

      if (stop) {
        this.degrees.length = this._changeState.to;
        this._transiting = false;
        this._changeState = null;
        const cb = this._transitionCallback;
        this._transitionCallback = null;
        cb && cb();
      }
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

  // 开始旋转
  startRotating() {
    this._rotating = true;
  }

  // 停止旋转
  stopRotating() {
    this._rotating = false;
  }

  // 旋转
  rotateTick() {
    if (this.degrees && this._rotating) {
      this.degrees = this.degrees.map(deg => {
        deg = (deg - this.rotateSpeed + 360) % 360;
        return deg;
      }); // 赋值后，重新计算了质心的位置
    }
  }

  // 旋转至，绕质心旋转
  rotateToDegrees(degrees) {
    const c1 = [...this.centroid]; // 记录旋转前的质心位置
    this.degrees = degrees;
    const c2 = [...this.centroid]; // 记录旋转后的质心位置
    this.x = c1[0] - c2[0] + this.x;
    this.y = c1[1] - c2[1] + this.y;
  }
}