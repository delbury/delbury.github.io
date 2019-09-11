const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext('2d');
const particles = [];
const particleNum = 200;
class Particle {
  constructor(props) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = Math.random() * 4 - 2;
    this.vy = Math.random() * 4 - 2;
    this.speedLevel = Math.random() + 0.5;
    this.speedTotal = Math.floor((Math.random() + 1) * 200);
    this.speedCount = 0;
    this.size = Math.random() + 1;
    this.color = '#' + (Math.random() * 0xffffff << 0).toString(16).padStart(6, '0');
    this.dv = 0;
  }

  move() {
    this.speedCtrlSin();
    this.x += (this.vx + this.dv) * this.speedLevel;
    this.y += (this.vy + this.dv) * this.speedLevel;
    if(this.x < 0 || this.x > canvas.width) {
      this.vx = -this.vx;
    }
    if(this.y < 0 || this.y > canvas.height) {
      this.vy = -this.vy;
    }
  }

  draw() {
    this.move();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  speedCtrlSin() {
    const rad = this.speedCount / this.speedTotal * Math.PI * 2;
    this.dv = Math.sin(rad);
    this.speedCount++;
    if(this.speedCount > this.speedTotal) {
      this.speedCount = 0;
    }
  }
}
function animateFrame(cb) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  }
}