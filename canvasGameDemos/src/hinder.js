import Block from './block.js';

export default class Hinder extends Block {
  constructor(ctx, props) {
    super(ctx, props);
    this.moveable = false;
    this.jumpable = false;
  }
  scrollLeft(dx) {
    this.x -= dx;
  }
  isOutofScreen() {
    return this.right < 0;
  }
}
