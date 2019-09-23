import Block from './block.js';
import Hinder from './hinder.js';
import GameOver from './over.js';
import Score from './score.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');  
  }

  // 初始化
  init(cb) {
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dirs = []; // 方向数组
    this.flags = {
      isSpacePressed: false,
      isGameOver: false
    };
    this.gameSpeed = 4; // 游戏速度
    this.totalCounter = 0; // 障碍物计数
    this.defaultParams = { x: 50, y: 350, w: 40, h: 40 };
    this.block = [
      new Block(this.ctx, { ...this.defaultParams, boundary: { xmin: 0, xmax: this.canvas.width } }),
      // new Block(this.ctx, { x: 200, y: 200, w: 40, h: 40 })
    ]; // 可移动方块

    const fn = () => Math.round(Math.random() * 200 + 400);
    const d1 = fn(), d2 = d1 + fn(), d3 = d2 + fn();
    this.hinders = [
      this.createRandomHinder(this.defaultParams, d1),
      this.createRandomHinder(this.defaultParams, d2),
      this.createRandomHinder(this.defaultParams, d3)
    ];
    this.score = new Score(this.canvas, this.ctx);

    this.bindCtrls();
    this.block[0].speed = 5;

    cb && cb();
  }

  // 每一帧
  tick() {
    this.createFloor(this.defaultParams);
    this.score.tick();
    this.block.map(item => {
      if(this.flags.isSpacePressed) {
        item.storingForce(1, 1);
      } else if(item.jumping) {
        item.releaseForce(160);
      }
      item.tick();
    });
    this.hinders.map(item => {
      item.scrollLeft(this.gameSpeed);
      item.tick();
      if(item.isOverlap(this.block[0])) {
        this.flags.isGameOver = true;
        console.log('game over !');
      }
    });
    
    //  移除并新增障碍物
    if(this.hinders[0] && this.hinders[0].isOutofScreen()) {
      this.score.gainScore(this.gameSpeed); // 加分
      this.gainCounter(); // 计数
      this.hinders.shift();
      const index = this.hinders.length - 1;
      this.hinders.push(this.createRandomHinder(
        this.defaultParams,
        this.hinders[index].x + Math.round(Math.random() * 200 + 400))
      );
    }
  }

  // 加速
  speedUp() {
    this.gameSpeed *= 1.05;
  }

  // 计数
  gainCounter() {
    this.totalCounter++;
    if(this.totalCounter === 5) {
      this.speedUp();
      this.totalCounter = 0;
    }
  }

  // 创建障碍物
  createRandomHinder(params, x) {
    const w = Math.round((Math.random() + 1) * params.w);
    const h = Math.round((Math.random() * 3 + 1) * params.h);
    const y = params.y + params.h - h;
    return new Hinder(this.ctx, { ...params, w, h, x, y });
  }

  // 水平线
  createFloor(params) {
    const y = params.y + params.h;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
  }

  // 控制所有方块
  setBlocksDir() {
    this.block.map(item => item.setDir(this.dirs));
  }
  jumpBlocks(gv, g) {
    this.block.map(item => item.jump(gv, g));
  }
  saveBlocks() {
    this.block.map(item => item.saveStatus());
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
  if(game.flags.isGameOver) {
    const over = new GameOver(game.canvas, game.ctx, undefined, () => {
      game.init(tick);
    });
    return;
  }
  game.tick();
  return requestAnimationFrame(tick);
});
