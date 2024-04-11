// canvas 的公共方法

if (window) {
  window.utils = {
    bezierTriangular,
    rotateByCenter,
    initCanvas,
  };
}

/**
 * @description 提供一组三角型顶点坐标，用二次贝塞尔曲线将其个点平滑连接
 * @param {CanvasRenderingContext2D Object} ctx
 * @param {Array [[x1, y1], [x2, y2], [x3, y3]]} coords
 */
function bezierTriangular(ctx, coords) {
  const [[xa, ya], [xb, yb], [xc, yc]] = coords;
  const x1 = xa + xb - xc;
  const y1 = ya + yb - yc;
  const x2 = xb + xc - xa;
  const y2 = yb + yc - ya;
  const x3 = xa + xc - xb;
  const y3 = ya + yc - yb;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(xa, ya);
  ctx.quadraticCurveTo(x1, y1, xb, yb);
  ctx.quadraticCurveTo(x2, y2, xc, yc);
  ctx.quadraticCurveTo(x3, y3, xa, ya);
  ctx.stroke();
  ctx.restore();
}

function rotateByCenter(ctx, cx, cy, degree) {
  const { cos, sin } = Math;
  const angle = degree ? (degree / 180) * Math.PI : 0;
  const xx = cx * cos(angle) + cy * sin(angle);
  const yy = -cx * sin(angle) + cy * cos(angle);
  const dx = xx - cx;
  const dy = yy - cy;

  ctx.rotate(angle);
  ctx.translate(dx, dy);
}

// 根据传入的 DOM query 创建 canvas 2d context，并做一些初始化操作
function initCanvas(domQuery, { width = 300, height = 150, autoSize = false } = {}) {
  const canvas = document.querySelector(domQuery);
  const ctx = canvas.getContext('2d');

  // 自适应父元素宽高
  if (autoSize) {
    const parent = canvas.parentElement;
    const { scrollWidth, scrollHeight } = parent;
    width = scrollWidth;
    height = scrollHeight;
  }
  const ratio = window.devicePixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);

  return ctx;
}
