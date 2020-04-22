import { ParticleCreater, CircleParticle, CircumcenterPolygonParticle, Methods } from './particle.js';
import { ParticleText } from './particle-text.js';

class _Base {
  constructor(ele) {
    if (!ele || ele.tagName != 'CANVAS') {
      throw new TypeError('错误的canvas元素');
    }

    this.ctx = ele.getContext('2d');
    this.canvas = this.ctx.canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.instance = null;
  }

  // 初始化
  init() { }

  // 每一帧的操作
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.instance && this.instance.length) {
      this.instance.forEach(item => item.tick());
    } else {
      this.instance.tick();
    }
  }

  // 每一帧
  tick() {
    if (!this.instance) {
      return;
    }

    this.draw();

    return requestAnimationFrame(() => {
      this.tick();
    });
  }
}

// 弹性碰撞
export class BallsCollision extends _Base {
  constructor(props) {
    super(props);

    this.init();
    this.tick();
  }

  init() {
    this.instance = [
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: this.ctx.canvas.width / 3 * 1,
          y: this.ctx.canvas.height / 2,
          vx: -3,
          vy: -5,
          radius: 30,
          // degrees: [30, 135, 290],
          mass: 5,
          // friction: 0.004,
        },
        {
          fillStyle: 'yellowgreen'
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: this.ctx.canvas.width / 3 * 2,
          y: this.ctx.canvas.height / 2,
          vx: -6,
          vy: 4,
          radius: 60,
          // degrees: [20, 130, 230, 310],
          mass: 8,
          // friction: 0.004,
        },
        {
          fillStyle: 'skyblue'
        }
      ),
    ];

    this.instance[0].collisionDetect = () => {
      if (this.instance[1] && this.instance[0].collideWith(this.instance[1])) {
        // this.instance[0].reverseSpeed();
        // this.instance[1].reverseSpeed();

        this.instance[0].perfectlyCollide(this.instance[1]);
        return true;
      }
      return false;
    };
  }

  // 点击选中
  grabBall(x, y) {
    let selected = null;
    this.instance.forEach(item => {
      if (item.isInside(x, y)) {
        selected = item;
      }
    });
    return selected;
  }

  // 恢复运动
  resume() {
    this.instance.forEach(item => {
      item.resume();
    });
  }
}
