import { ParticleCreater, CircleParticle } from './particle.js';
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
  draw() { }

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

//粒子特效
export class CanvasEffectParticles extends _Base {
  constructor(ele) {
    super(ele);

    this.init();
  }

  // 初始化
  init() {
    this.instance = new ParticleCreater(this.ctx, { count: 1, maxRadius: 40 });
    this.tick();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.instance.particles.forEach(part => {
      part.tick();
    });
  }
}

// 粒子文本
export class CanvasEffectParticleText extends _Base {
  constructor(ele) {
    super(ele);

    this.init();
  }
  init() {
    this.instance = new ParticleText(this.ctx, { gridX: 5, gridY: 5 });
    this.instance.createEffect('A');
    this.tick();
  }
  draw() {
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
  }
}

// 测试粒子
class TestController extends _Base {
  constructor(ele) {
    super(ele);

    this.instance = new CircleParticle(
      this.ctx,
      {
        x: this.ctx.canvas.width / 2,
        y: 0,
        radius: 40
      },
      {
        fillStyle: 'skyblue'
      }
    );
    // this.instance.startFreeFall({
    //   vy0: 3,
    //   gravity: 0.4,
    //   rebound: true,
    //   reduction: 0.75,
    //   stopY: this.ctx.canvas.height - 40
    // });

    this.tick();
  }
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.instance.tick();
  }
}

export class CanvasEffectController {
  constructor(ele) {
    // this.instance = new CanvasEffectParticles(ele);
    // this.instance = new CanvasEffectParticleText(ele);
    this.instance = new TestController(ele);
  }

  // 改变文本
  changeText(text) {
    if (!this.instance) return;
    this.instance.instance.createEffect && this.instance.instance.createEffect(text);
  }

  // 粒子聚焦
  focus() {
    if (!this.instance) return;
    this.instance.instance.focus && this.instance.instance.focus();
  }

  // 粒子发散
  blur() {
    if (!this.instance) return;
    this.instance.instance.blur && this.instance.instance.blur();
  }

  // 鼠标移入
  isMouseMoveIn(x, y) {
    return this.instance.instance.isInside(x, y);
  }

  // 移动
  moveTo(x, y) {
    return this.instance.instance.directMoveTo(x, y);
  }

  // 开始自由落体
  startFreeFall() {
    this.instance.instance.startFreeFall({
      vy0: 0,
      gravity: 0.4,
      rebound: true,
      reduction: 0.75,
      stopY: this.instance.instance.ctx.canvas.height - 40
    });
  }

  // 结束
  stopFreeFall() {
    this.instance.instance.stopFreeFall();
  }
}
