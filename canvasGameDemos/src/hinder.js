import Block from './block.js';
import Star from './star.js';

export default class Hinder extends Block {
  constructor(ctx, props) {
    super(ctx, props);
    this.moveable = false;
    this.jumpable = false;

    this.starSize = 50;
    this.starProbable = 75; // 0 ~ 100%
    const flag = Math.floor(Math.random() * 100) < this.starProbable;
    this.star = flag
      ? new Star(ctx, this.x + ((this.w - this.starSize) / 2), this.y - this.starSize - 20, this.starSize, this.starSize, 3)
      : null;
  }
  scrollLeft(dx) {
    this.x -= dx;
    if(this.star && !this.star.isDead) {
      this.star.scrollLeft(dx);
    }
  }
  isOutofScreen() {
    return this.right < 0;
  }

  tick() {
    super.tick();
    if(this.star && !this.star.isDead) {
      this.star.tick();
    }
  }

  killStar() {
    this.star.dead();
  }
}
