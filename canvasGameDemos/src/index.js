import Block from './block.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.dirs = []; // 方向数组
    this.flags = {
      isSpacePressed: false,
    };
    this.block = [
      new Block(this.ctx, { x: 50, y: 200, w: 40, h: 40 }),
      // new Block(this.ctx, { x: 200, y: 200, w: 40, h: 40 })
    ]; // 可移动方块
    // this.block[1].moveable = false;
  }

  // 初始化
  init() {
    this.bindCtrls();
    this.block[0].speed = 5;
  }

  // 每一帧
  tick() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.moveTo(0, 240);
    this.ctx.lineTo(800, 240);
    this.ctx.stroke();

    const time = 160;
    this.block.map(item => {
      if(this.flags.isSpacePressed) {
        item.storingForce(1, 1);
      } else if(item.jumping) {
        item.releaseForce(time);
      }
      item.tick();
    });
  }

  // 控制所有方块
  setBlocksDir() {
    this.block.map(item => item.setDir(this.dirs));
  }
  jumpBlocks(gv, g) {
    this.block.map(item => item.jump(gv, g));
  }
  saveBlocks() {
    this.block.map(item => {
      item.saveJumpOriginY();
      item.saveStatus()
    });
  }
  differBlocks() {
    this.block.map(item => item.differStatus());
  }

  hasBlockJumping() {
    return this.block.some(item => item.jumping);
  }

  // 方向键按下
  keyDown(ev) {
    if(ev.keyCode >= 37 && ev.keyCode <= 40) {
      const fn = type => {
        const last = this.dirs[this.dirs.length - 1];
        if(last !== undefined && last === type) return;
        if(this.dirs.length < 2) {
          this.dirs.push(type);
        } else {
          this.dirs.shift();
          this.dirs.push(type);
        }
        this.setBlocksDir();
      };
      switch(ev.key) {
        case 'ArrowUp':
          fn(1);
          break;
        case 'ArrowDown':
          fn(2);
          break;
        case 'ArrowLeft':
          fn(4);
          break;
        case 'ArrowRight':
          fn(8);
          break;
        default: break;
      }
      ev.preventDefault();
    } else if(ev.code === 'Space' && !this.flags.isSpacePressed && !this.hasBlockJumping()) {
      this.flags.isSpacePressed = true;
      this._jumpCounter = Date.now();
      this.saveBlocks(); // 记录信息
      ev.preventDefault();
    }
  }
  // 方向键松开
  keyUp(ev) {
    if(ev.keyCode >= 37 && ev.keyCode <= 40) {
      const fn = type => {
        const index = this.dirs.indexOf(type);
        if(index >= 0) {
          this.dirs.splice(index, 1);
        }
        this.setBlocksDir();
      };
      switch(ev.key) {
        case 'ArrowUp':
          fn(1);
          break;
        case 'ArrowDown':
          fn(2);
          break;
        case 'ArrowLeft':
          fn(4);
          break;
        case 'ArrowRight':
          fn(8);
          break;
        default: break;
      }
      ev.preventDefault();
    } else if(ev.code === 'Space' && this.flags.isSpacePressed) {
      this.flags.isSpacePressed = false;
      const counter = Date.now() - this._jumpCounter;
      let gv = 0;
      if(counter <= 200) {
        gv = 10;
      } else if(counter <= 500) {
        gv = Math.ceil(counter / 100) + 10;
      } else {
        gv = 15;
      }
      this.jumpBlocks(gv, 0.5);
      this.differBlocks();
      ev.preventDefault();
    }
  }
  bindCtrls() {
    document.addEventListener('keydown', this.keyDown.bind(this));
    document.addEventListener('keyup', this.keyUp.bind(this));
  }
  removeCtrls() {
    document.removeEventListener('keydown', this.keyDown.bind(this));
    document.removeEventListener('keyup', this.keyUp.bind(this));
  }
}

const game = new Game(document.getElementById('canvas'));
game.init();

requestAnimationFrame(function tick() {
  game.tick();
  return requestAnimationFrame(tick);
});
