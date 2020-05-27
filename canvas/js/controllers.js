import { ParticleCreater, CircleParticle, CircumcenterPolygonParticle, Methods } from './particle.js';
import { ParticleText } from './particle-text.js';

class _Base {
  constructor(ele) {
    if ((!ele || ele.tagName != 'CANVAS') && (self.OffscreenCanvas && !(ele instanceof OffscreenCanvas))) {
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
export class BallsCollisionController extends _Base {
  constructor(props) {
    super(props);

    this.init();
    this.tick();
  }

  // 随机速度
  randomSpeed() {
    return Methods.randomSpeed(1, 10);
    // return {};
  }

  // 创建七巧板
  creatNeves(sideLength = 300, totalWeight = 100) {
    const cw = this.ctx.canvas.width / 2;
    const ch = this.ctx.canvas.height / 2;
    this.instance = [
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw - sideLength / 2,
          y: ch,
          radius: sideLength / 2,
          mass: totalWeight / 4,
          degrees: [0, 90, 270],
        },
        {
          fillStyle: 'yellowgreen'
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw,
          y: ch - sideLength / 2,
          radius: sideLength / 2,
          mass: totalWeight / 4,
          degrees: [0, 90, 180]
        },
        {
          fillStyle: 'skyblue'
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw,
          y: ch + sideLength / 4,
          radius: sideLength / 4,
          mass: totalWeight / 16,
          degrees: [0, 180, 270],
          text: 2,
        },
        {
          fillStyle: 'crimson',
          textOptions: {
            // textOffsetY: -sideLength / 10
          }
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw + sideLength / 4,
          y: ch,
          radius: sideLength / 4,
          mass: totalWeight / 8,
          degrees: [0, 90, 180, 270],
          text: 3
        },
        {
          fillStyle: 'burlywood'
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw + sideLength / 2,
          y: ch - sideLength / 4,
          radius: sideLength / 4,
          mass: totalWeight / 16,
          degrees: [90, 180, 270]
        },
        {
          fillStyle: 'navy '
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw + sideLength / 4,
          y: ch + sideLength / 4,
          radius: sideLength / 2 / Math.sqrt(2),
          mass: totalWeight / 8,
          degrees: [45, 135, 315]
        },
        {
          fillStyle: 'orchid '
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw,
          y: ch + sideLength / 4,
          radius: sideLength / 4,
          mass: totalWeight / 8,
          degrees: [0, 90, 180],
          text: 7
        },
        {
          fillStyle: 'teal ',
          textOptions: {
            // textOffsetY: sideLength / 10
          }
        }
      ),
      new CircumcenterPolygonParticle(
        this.ctx,
        {
          x: cw - sideLength / 4,
          y: ch + sideLength / 2,
          radius: sideLength / 4,
          mass: totalWeight / 8,
          degrees: [0, 180, 270],
          text: 8
        },
        {
          fillStyle: 'teal ',
          textOptions: {
            // textOffsetY: -sideLength / 10
          }
        }
      ),
    ];
    // ].filter((item, index) => index === 6 || index == 7);
  }

  init() {
    textInit.call(this);
    // this.creatNeves();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.instance && this.instance.length) {
      this.instance.forEach(item => item.changeStatus());
      // 碰撞检测
      for (let i = 0, len = this.instance.length; i < len - 1; i++) {
        for (let j = i + 1; j < len; j++) {
          const { status, minAxis, collidedAxises } = this.instance[i].collideWith(this.instance[j])

          if (status !== 0) {
            const dx = (minAxis.axis.x * minAxis.overlapLength);
            const dy = (minAxis.axis.y * minAxis.overlapLength);

            if (this.instance[i].currentMass === Infinity && this.instance[j].currentMass === Infinity) {
              // 两者质量都为无限
              this.instance[i].setAbsolutePosition(dx / 2, dy / 2);
              this.instance[j].setAbsolutePosition(dx / 2, dy / 2);
            } else if (this.instance[i].currentMass === Infinity) {
              // 其中一个质量为无限，抓起前面的
              this.instance[j].setAbsolutePosition(dx, dy);
            } else if (this.instance[j].currentMass === Infinity) {
              // 其中一个质量为无限，抓起后面的
              this.instance[i].setAbsolutePosition(-dx, -dy);
            } else {
              // 否则
              const scale = this.instance[i].currentMass / this.instance[j].currentMass;
              this.instance[i].setAbsolutePosition(-dx * scale, -dy * scale);
              this.instance[j].setAbsolutePosition(dx * scale, dy * scale);
            }
          }
          if (status === 1) {
            // 完全弹性碰撞
            this.instance[i].perfectlyCollide(this.instance[j], 0.9);
          }
        }
      }
      this.instance.forEach(item => item.draw());
    } else {
      this.instance.tick();
    }
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

// 粒子文本
export class ParticleTextController extends _Base {
  constructor(props, defaults) {
    super(props);
    this.defaults = { text: 'Hello', ...defaults };

    this.init();
    this.tick();
  }

  // 初始化
  init() {
    this.instance = new ParticleText(
      this.ctx,
      { gridX: 5, gridY: 5, moveMode: 'spring' },
      { textSize: 100 }
    );
    this.instance.createEffect(this.defaults.text);
  }

  tick() {
    // 清除画板
    // this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    // this.instance.ctx.putImageData(this.instance.imageData, 0, 0);
    this.instance.particles.forEach(part => {
      part.shapeParticle.tick();
    });

    return requestAnimationFrame(this.tick.bind(this));
  }

  // 改变文本
  changeText(text) {
    this.instance.createEffect(text);
  }

  focus() {
    this.instance.focus();
  }
  blur() {
    this.instance.blur();
  }
}

export class PolygonShapeChangeController extends _Base {
  constructor(props, defaults) {
    super(props);
    this.defaults = { edges: 3, ...defaults };

    this.init();
    this.tick();
  }

  init() {
    this.instance = new CircumcenterPolygonParticle(
      this.ctx,
      {
        x: this.ctx.canvas.width / 2,
        y: this.ctx.canvas.height / 2,
        radius: 100,
        // degrees: [],
      },
      {
        fillStyle: 'yellowgreen'
      }
    );
    this.instance.createRegular(this.defaults.edges);
  }

  changeShape(n) {
    this.instance.changeTo(n);
  }
}

function textInit() {
  const friction = 0;
  this.instance = [
    new CircumcenterPolygonParticle(
      this.ctx,
      {
        x: 390,
        y: 50,
        // ...this.randomSpeed(),
        vy: 2,
        radius: 35,
        mass: 5,
        text: '1',
        friction
      },
      {
        fillStyle: 'chocolate'
      }
    ),
    new CircumcenterPolygonParticle(
      this.ctx,
      {
        x: 410,
        y: 300,
        // ...this.randomSpeed(),
        vy: -2,
        radius: 35,
        mass: 5,
        text: '2',
        friction
      },
      {
        fillStyle: 'darkred'
      }
    ),

  ];
}
