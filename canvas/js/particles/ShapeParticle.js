import { CircleParticle } from './CircleParticle.js';
import { RectangleParticle } from './RectangleParticle.js';

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