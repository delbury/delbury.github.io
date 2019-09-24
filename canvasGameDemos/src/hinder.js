import Block from './block.js';
import Star from './star.js';

export default class Hinder extends Block {
  constructor(ctx, props) {
    super(ctx, props);
    this.moveable = false;
    this.jumpable = false;
    this.starAlive = true;

    this.starSize = 50;
    this.star = new Star(ctx, this.x + ((this.w - this.starSize) / 2), this.y - this.starSize - 20, this.starSize, this.starSize, 3);
  }
  scrollLeft(dx) {
    this.x -= dx;
    if(this.starAlive) {
      this.star.x -= dx;
    }
  }
  isOutofScreen() {
    return this.right < 0;
  }

  tick() {
    super.tick();
    if(this.starAlive) {
      this.star.tick();
    }
  }

  killStar() {
    this.starAlive = false;
  }
}
