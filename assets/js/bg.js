// 粒子
class Particle {
  // x, // 当前 x 坐标
  // y, // 当前 y 坐标
  // radius, // 半径大小
  // angle, // 移动的方向
  // speed, // 移动的速度
  // blur, // 虚化
  // hue, // 色相
  // saturation, // 饱和度
  // lightness, // 亮度
  // alpha, // 透明度
  constructor(options) {
    for(let key in options) {
      this[key] = options[key];
    }
  }
}

// 取范围内随机值
function getRandom(min, max) {
  return Math.random() * ( max - min ) + min;
}

// 创建粒子集合
function create(count, ranges) {
  const parts = [];
  for(let i = 0; i < count; i++) {
    parts.push(new Particle({
      x: getRandom(...ranges.width),
			y: getRandom(...ranges.height),
      angle: getRandom(0, Math.PI * 2),
      speed: getRandom(...ranges.speed),
      radius: getRandom(...ranges.radius),
      blur: getRandom(...ranges.blur),
      hue: getRandom(...ranges.hue),
      saturation: getRandom(...ranges.saturation),
      lightness: getRandom(...ranges.lightness),
      alpha: getRandom(...ranges.alpha),
    }));
  }
  return parts;
}

// 绘制
function draw(ctx, parts) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.globalCompositeOperation = 'darken';
  parts.forEach(part => {
    // ctx.fillStyle = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha})`;
    ctx.fillStyle = `#fff`;
    ctx.shadowColor = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha * 0.5})`;
    ctx.shadowBlur = part.blur;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}


// main
(function(){
  const width = window.innerWidth;
	const height = window.innerHeight;

  // 创建 canvas
  const backCanvas = document.createElement('canvas');
  backCanvas.width = width;
  backCanvas.height = height;
  backCanvas.classList.add('bg-canvas');
  document.body.append(backCanvas);
  const bctx = backCanvas.getContext('2d');

  const plainSize = width + height; // 窗口背景大小基准
	const count = Math.floor(plainSize * 0.2); // 粒子数量
	const hue = getRandom(0, 360); // 色相
  // 参数
	const ranges = {
    width: [0, width],
    height: [0, height],
    radius: [5, plainSize * 0.04],
    blur: [10, plainSize * 0.04],
    hue: [hue, hue + 90],
    saturation: [10, 70],
    lightness: [20, 50],
    alpha: [0.1, 0.5],
    speed: [0.1, 0.5],
	}

  const backParts = create(count, ranges); // 背景粒子数组
  
  const tick = function() {
    draw(bctx, backParts);

    requestAnimationFrame(tick);
  };
  tick();
}());
