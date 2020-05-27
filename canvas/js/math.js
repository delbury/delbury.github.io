/**
 * @description 向量
 */
export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // 获取长度
  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  // 相加
  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  // 相减
  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  // 点积
  dotProduct(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  // 垂直的向量
  perpendicular(clockwise = true) {
    const sym = clockwise ? 1 : -1;
    return new Vector(this.y * sym, -this.x * sym);
  }

  // 归一化
  normalize(reverse = false) {
    const len = this.length;
    if (len === 0) {
      return new Vector(0, 0);
    } else {
      return reverse ? new Vector(-this.x / len, -this.y / len) : new Vector(this.x / len, this.y / len);
    }
  }

  // 反归一化
  antiNormalize(len) {
    return new Vector(this.x * len, this.y * len);
  }

  // 获取垂直单位向量
  verticalUnitVector(clockwise) {
    return this.perpendicular(clockwise).normalize();
  }

  // 获取边向量
  edgeVector(vector) {
    return this.subtract(vector);
  }

  // 反向
  reverse() {
    return new Vector(-this.x, -this.y);
  }

  // 方向象限相同
  isSameQuadrant(vector) {
    const x1 = this.x === 0 ? 0 : (this.x / (Math.abs(this.x)));
    const y1 = this.y === 0 ? 0 : (this.y / (Math.abs(this.y)));
    const x2 = vector.x === 0 ? 0 : (vector.x / (Math.abs(vector.x)));
    const y2 = vector.y === 0 ? 0 : (vector.y / (Math.abs(vector.y)));
    return x1 === x2 && y1 === y2;
  }

  // 两向量间的弧度
  radianWith(vector) {
    return Math.acos(this.dotProduct(vector) / this.length / vector.length);
  }

  // 判断两个向量之间的夹角是否锐角
  // <90：锐角，90：直角，>90：钝角
  angleWith(vector) {
    return this.radianWith(vector) / Math.PI * 180;
  }
}

/**
 * @description 投影
 */
export class Projection {
  constructor(arr) {
    this.min = Math.min(...arr);
    this.max = Math.max(...arr);
  }

  // 是否重叠，返回重叠部分的长度
  overlapWith(projection) {
    const flag = !(this.min > projection.max || this.max < projection.min);

    // 计算重叠到分离的最短长度
    if (flag) {
      const arr = [this.min, this.max, projection.min, projection.max].sort((a, b) => a - b);
      // 当一个投影完全在另一个投影中时，需要区分
      if (Math.abs(arr[3] - arr[0] - Math.max(this.max - this.min, projection.max - projection.min)) <= Number.EPSILON) {
        // 部分重叠
        return Math.min(arr[2] - arr[0], arr[3] - arr[1])
      } else {
        return arr[2] - arr[1];
      }
    }
    return null;
  }
}

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
  static perfectlyInelasticCollide(v1, v2, m1, m2, e = 1) {
    if (m1 === Infinity) {
      return [v1, -v2];
    } else if (m2 === Infinity) {
      return [-v1, v2];
    } else {
      return [
        ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2),
        ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2)
      ];
    }
  }

  // 根据圆心和角度值计算各顶点坐标
  static calcCoordinateByDegrees(x, y, radius, degrees) {
    return degrees.map(deg => [
      x + radius * Math.cos(deg / 180 * Math.PI),
      y + radius * Math.sin(deg / 180 * Math.PI)
    ]);
  }

  // 计算质心
  static calcCentroid(x, y, radius, degrees) {
    if (degrees.length) {
      const coords = Methods.calcCoordinateByDegrees(x, y, radius, degrees);
      return [
        coords.reduce((sum, xy) => xy[0] + sum, 0) / coords.length,
        coords.reduce((sum, xy) => xy[1] + sum, 0) / coords.length,
      ];
    } else {
      return [x, y]
    }
  }

  // 沿一个方向向量，分解速度为垂直和平行分量
  resolveSpeedByVector(vx, vy, vector) {
    const vxRad = new Vector(1, 0).radianWith(vector);
    const vyRad = new Vector(0, 1).radianWith(vector);

    const vParallel = 0; // 水平分量
    const vVertical = 0; // 垂直分量
  }
}
