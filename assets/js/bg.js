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
  // center, // 中心点
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
    const blurCenter = (ranges.blur[0] + ranges.blur[1]) / 2;
    const blurMin = getRandom(ranges.blur[0], blurCenter);
    const blurMax = getRandom(blurCenter, ranges.blur[1]);

    parts.push(new Particle({
      x: getRandom(...ranges.width),
			y: getRandom(...ranges.height),
      angle: getRandom(0, Math.PI * 2),
      speed: getRandom(...ranges.speed),
      radius: getRandom(...ranges.radius),
      blur: getRandom(blurMin, blurMax),
      blurMin,
      blurMax,
      blurDir: Math.random() > 0.5 ? 1 : -1,
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
    part.x += part.speed * Math.cos(part.angle);
    part.y += part.speed * Math.sin(part.angle);

    // 从另一端进入
    if(
      part.x - part.radius >= ctx.canvas.width || 
      part.x + part.radius <= 0 || 
      part.y - part.radius >= ctx.canvas.height || 
      part.y + part.radius <= 0
    ) {
      part.x = ctx.canvas.width - part.x;
      part.y = ctx.canvas.height - part.y;
    }

    // ctx.fillStyle = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha})`;
    ctx.fillStyle = `#fff`;
    ctx.shadowColor = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha * 0.5})`;
    part.blur += part.blurDir * getRandom(0.1, 0.2);
    if(
      (part.blur >= part.blurMax && part.blurDir > 0) ||
      (part.blur <= part.blurMin && part.blurDir < 0)
    ) {
      part.blurDir = -part.blurDir;
    }
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
	const hue = getRandom(220, 260); // 色相
  // 参数
	const ranges = {
    width: [0, width],
    height: [0, height],
    radius: [5, plainSize * 0.04],
    blur: [5, plainSize * 0.04],
    hue: [hue - 45, hue + 45],
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
