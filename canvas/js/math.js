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
  normalize() {
    const len = this.length;
    if (len === 0) {
      return new Vector(0, 0);
    } else {
      return new Vector(this.x / len, this.y / len);
    }
  }

  // 反归一化
  antiNormalize(len) {
    return new Vector(this.x * len, this.y * len);
  }

  // 获取垂直单位向量
  verticalUnitVector() {
    return this.perpendicular().normalize();
  }

  // 获取边向量
  edgeVector(vector) {
    return this.subtract(vector);
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

  // 是否重叠
  isOverlapWith(projection) {
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
