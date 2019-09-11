const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext('2d');
const particles = [];
// const particleLines = [];
const particleNum = 100;
let targetCenter = null;
class Particle {
  constructor(props) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.speedLevel = Math.random() + 0.5;
    this.size = Math.random() * 4 + 2;
    // this.size = 4;
    this.color = '#' + (Math.random() * 0xffffff << 0).toString(16).padStart(6, '0');
    // 移动到的目标点属性
    this.target = null;
    this.steps = 1;
    this.currentStep = 0;
    this.dx = 0;
    this.dy = 0;
  }

  newTarget() {
    this.steps = Math.floor((Math.random() + 0.5) * 200);
    this.currentStep = this.steps;
    if(!targetCenter) {
      this.target = [
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ];
    } else {
      // 飘到鼠标附近
      const [x0, y0] = targetCenter;
      const radius = 150;
      const xr = (Math.random() * 2 - 1) * radius + x0;
      const rs = Math.sqrt(radius ** 2 - (xr - x0) ** 2);
      const yr = (Math.random() * 2 - 1) * rs + y0;
      this.target = [xr, yr];
    }
    
    this.dx = (this.target[0] - this.x) / this.steps;
    this.dy = (this.target[1] - this.y) / this.steps;
  }

  move() {
    if(this.currentStep <= 0) {
      this.newTarget();
    }
    this.x += this.dx;
    this.y += this.dy;
    this.currentStep--;
  }

  draw() {
    this.move();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
class Line {
  constructor(props) {
    const { p1, p2 } = props;
    this.p1 = p1;
    this.p2 = p2;
    this.lineWidth = 1;
    // this.gradient = null;
  }
  draw() {
    const { x: x1, y: y1 } = this.p1;
    const { x: x2, y: y2 } = this.p2;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, this.p1.color);
    gradient.addColorStop(1, this.p2.color);
    // this.line = gradient;
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.lineWidth;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function animateFrame(cb) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画线
  const length = particles.length;
  const radius = 50;
  for(let i = 0; i < length; i++) {
    for(let j = i + 1; j < length; j++) {
      // 判断另一点是否在该点半径范围内
      const { x: x1, y: y1 } = particles[i];
      const { x: x2, y: y2 } = particles[j];
      if((x2 - x1) ** 2 + (y2 - y1) ** 2 < radius ** 2) {
        new Line({
          p1: particles[i],
          p2: particles[j]
        }).draw();
      }
    }
  }

  // 画点
  for(let item of particles) {
    item.draw();
  }
  cb && cb();
  return requestAnimationFrame(() => { animateFrame(cb) });
}
function initEffect() {
  for(let i = 0; i < particleNum; i++) {
    particles.push(new Particle());
  }
}

self.onmessage = ev => {
  const { type, data } = ev.data;
  if(type === 0) {
    canvas.width = data.width;
    canvas.height = data.height;
    initEffect();
    animateFrame(() => {
      const ib = canvas.transferToImageBitmap();
      self.postMessage(ib, [ib]);
    });
  } else if(type === 1) {
    targetCenter = [data.offsetX, data.offsetY];
    // for(let item of particles) {
    //   item.newTarget();
    // }
  } else if(type === 2) {
    targetCenter = null;
    // for(let item of particles) {
    //   item.newTarget();
    // }
  }
}