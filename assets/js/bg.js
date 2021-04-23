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
    this.safeRadius = this.radius * 1.2; // 切换位置的防止闪烁安全距离
  }
  scale(kx, ky) {
    this.x *= kx;
    this.y *= ky;
  }
}

// 取范围内随机值
function getRandom(min, max) {
  return Math.random() * ( max - min ) + min;
}

// 创建粒子集合
function create(count, ranges) {
  const parts = [];
  const getMinMax = (range) => {
    const center = (range[0] + range[1]) / 2;
    const min = getRandom(range[0], center);
    const max = getRandom(center, range[1]);
    return [min, max];
  }
  for(let i = 0; i < count; i++) {
    const [blurMin, blurMax] = getMinMax(ranges.blur);
    const [lightnessMin, lightnessMax] = getMinMax(ranges.lightness);

    parts.push(new Particle({
      x: getRandom(...ranges.width),
			y: getRandom(...ranges.height),
      angle: getRandom(0, Math.PI * 2),
      speed: getRandom(...ranges.speed),
      radius: getRandom(...ranges.radius),
      // 虚化范围
      blur: getRandom(blurMin, blurMax),
      blurMin,
      blurMax,
      blurDir: Math.random() > 0.5 ? 1 : -1,
      hue: getRandom(...ranges.hue),
      saturation: getRandom(...ranges.saturation),
      // 明暗变化
      lightness: getRandom(lightnessMin, lightnessMax),
      lightnessMin,
      lightnessMax,
      lightnessDir: Math.random() > 0.5 ? 1 : -1,
      alpha: getRandom(...ranges.alpha),
    }));
  }
  // 排序
  parts.sort((a, b) => a.blurMin - b.blurMin);
  return parts;
}

// 绘制
function draw(ctx, parts) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.globalCompositeOperation = 'lighter';
  parts.forEach(part => {
    part.x += part.speed * Math.cos(part.angle);
    part.y += part.speed * Math.sin(part.angle);

    // 从另一端进入
    if(
      part.x - part.safeRadius >= ctx.canvas.width || 
      part.x + part.safeRadius <= 0 || 
      part.y - part.safeRadius >= ctx.canvas.height || 
      part.y + part.safeRadius <= 0
    ) {
      part.x = ctx.canvas.width - part.x;
      part.y = ctx.canvas.height - part.y;
    }

    // 动态亮度
    part.lightness += part.lightnessDir * getRandom(0.1, 0.5);
    if(
      (part.lightness >= part.lightnessMax && part.lightnessDir > 0) ||
      (part.lightness <= part.lightnessMin && part.lightnessDir < 0)
    ) {
      part.lightnessDir = -part.lightnessDir;
    }

    // ctx.fillStyle = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha})`;
    // ctx.fillStyle = `#fff`;
    ctx.shadowColor = `hsla(${part.hue},${part.saturation}%,${part.lightness}%,${part.alpha * 0.5})`;

    // 动态虚化
    part.blur += part.blurDir * getRandom(0.1, 0.3);
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

let backCanvas = null;
let bctx = null;
let backParts = [];
let raf = null;
let tick = null;

self.onmessage = ev => {
  if(ev.data.type === 'init') {
    // main
    const { width, height, canvas } = ev.data;
    
    // 创建 canvas
    // const backCanvas = document.createElement('canvas');
    // backCanvas.classList.add('bg-canvas');
    backCanvas = canvas;
    backCanvas.width = width;
    backCanvas.height = height;
    // document.body.append(backCanvas);
    bctx = backCanvas.getContext('2d');
    
    const plainSize = width + height; // 窗口背景大小基准
    const count = 100; // 粒子数量
    const hue = getRandom(220, 260); // 色相
    // 参数
    const ranges = {
      width: [0, width],
      height: [0, height],
      radius: [10, plainSize * 0.04],
      blur: [5, plainSize * 0.04],
      hue: [hue - 45, hue + 45],
      saturation: [70, 90],
      lightness: [70, 90],
      alpha: [0.5, 0.8],
      speed: [0.2, 0.5],
    }
    
    backParts = create(count, ranges); // 背景粒子数组
    
    // 动画
    tick = function() {
      draw(bctx, backParts);
      raf = requestAnimationFrame(tick);
    };
    tick();
  } else if(ev.data.type === 'resize') {
    const rewidth = ev.data.width;
    const reheight = ev.data.height;
    const kx = rewidth / backCanvas.width;
    const ky = reheight / backCanvas.height;
    backCanvas.width = rewidth;
    backCanvas.height = reheight;
    backParts.forEach(p => p.scale(kx, ky));
  } else if(ev.data.type === 'stop') {
    if(raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  } else if(ev.data.type === 'play') {
    if(!raf) {
      tick();
    }
  }
};
