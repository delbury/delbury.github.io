import Block from './block.js';
import Hinder from './hinder.js';
import Panel from './panel.js';
import Score from './score.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.defaultParams = { x: 50, y: 350, w: 40, h: 40 }; // 默认参数
  }

  // 初始化
  init(cb) {
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dirs = []; // 方向数组
    this.flags = {
      isSpacePressed: false,
      isGameOver: false,
      canDoubleJumped: false
    };
    this.gameSpeed = 3; // 游戏速度
    this.totalCounter = 0; // 障碍物计数
    this.block = [
      new Block(this.ctx, { ...this.defaultParams, boundary: { xmin: 0, xmax: this.canvas.width } }),
      // new Block(this.ctx, { x: 200, y: 200, w: 40, h: 40 })
    ]; // 可移动方块

    this.range = {
      start: 400,
      end: 600
    }
    const fn = () => Math.round(Math.random() * (this.range.end - this.range.start) + this.range.start);
    this.hinders = [];
    // const d1 = fn(), d2 = d1 + fn(), d3 = d2 + fn();
    // this.hinders = [
    //   this.createRandomHinder(this.defaultParams, d1),
    //   this.createRandomHinder(this.defaultParams, d2),
    //   this.createRandomHinder(this.defaultParams, d3),
    //   this.createRandomHinder(this.defaultParams, d3),
    //   this.createRandomHinder(this.defaultParams, d3)
    // ];
    const initHinders = function* () {
      let d = fn();
      yield d;
      while(true) {
        const temp = d + fn();
        yield temp;
        d = temp;

      }
    };
    const ih = initHinders();
    for(let i = 0; i < 4; i++) {
      this.hinders.push(this.createRandomHinder(this.defaultParams, ih.next().value));
    }

    this.score = new Score(this.canvas, this.ctx);

    this.block[0].jumpReset = () => this.flags.canDoubleJumped = false;
    this.block[0].speed = 5;
    this.block[0].fillColor = '#bbbbbb';

    this.bindCtrls();

    cb && cb();
  }

  // 每一帧
  tick() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.createFloor(this.defaultParams); // 地板帧
    this.score.tick(); // 分数帧

    // 控制的方块的帧
    this.block.map(item => {
      if(this.flags.isSpacePressed) {
        item.storingForce(1, 1);
      } else if(item.jumping) {
        item.releaseForce(160);
      }
      item.tick();
    });

    // 障碍物帧
    this.hinders.map(item => {
      // 向左滚动
      item.scrollLeft(this.gameSpeed);

      // 撞墙结束游戏
      if(item.isOverlap(this.block[0])) {
        this.flags.isGameOver = true;
        this.removeCtrls();
        console.log('game over !');
      }

      // 吃到星星
      if(item.star && item.star.isOverlap(this.block[0])) {
        item.killStar();
      }

      item.tick();
    });
    
    //  移除并新增障碍物
    if(this.hinders[0] && this.hinders[0].isOutofScreen()) {
      this.score.gainScore(this.gameSpeed); // 加分
      this.gainCounter(); // 计数
      this.hinders.shift();
      const index = this.hinders.length - 1;
      this.hinders.push(this.createRandomHinder(
        this.defaultParams,
        this.hinders[index].x + Math.round(Math.random() * (this.range.end - this.range.start) + this.range.start))
      );
    }
  }

  // 加速
  speedUp() {
    if(this.gameSpeed <= 12) {
      this.gameSpeed += 0.5;
    }
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
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
    this.ctx.restore();
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

  // 按键
  keyDown(ev) {
    if(ev.keyCode >= 37 && ev.keyCode <= 40) {
      // 方向键按下
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
    } else if(ev.code === 'Space') {
      // 空格键按下
      if(!this.flags.isSpacePressed && !this.hasBlockJumping() && !this.flags.canDoubleJumped) {
        this.flags.isSpacePressed = true;
        this._jumpCounter = Date.now();
        this.saveBlocks(); // 记录信息
      } else if(this.flags.canDoubleJumped) {
        this.flags.canDoubleJumped = false; // 禁止二段跳
        this.jumpBlocks(10, 0.5);
      }
      
      ev.preventDefault();
    }
  }
  // 松键
  keyUp(ev) {
    if(ev.keyCode >= 37 && ev.keyCode <= 40) {
      // 方向键松开
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
      // 空格松开
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
      this.flags.canDoubleJumped = true;
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
startGame('Game Start !', 'start');

function startGame(title, label) {
  new Panel({
    canvas: game.canvas,
    ctx: game.ctx,
    title: title,
    buttons: [
      {
        label: label,
        cb: () => game.init(tick)
      }
    ]
  });

}
function tick() {
  if(game.flags.isGameOver) {
    startGame('GAME OVER !', 'again');
    return;
  }
  game.tick();
  return requestAnimationFrame(tick);
};


