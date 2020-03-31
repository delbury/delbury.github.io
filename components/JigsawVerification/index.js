const fragmentWH = [40, 40];
let notice = null;
let timer = null;

(async function() {
  const canvasBg = document.getElementById('canvas-background');
  const canvasFg = document.getElementById('canvas-fragment');
  const slider = document.getElementById('input-slider');
  const img_light = await createImage('./imgs/7.jpg');
  const img_dark = await createImage('./imgs/8.jpg');
  const img_fat = await createImage('./imgs/fat.jpg');
  const img_tall = await createImage('./imgs/tall.jpg');
  const sliderbar = document.querySelector('.slider input[type="range"]');
  const dialog = document.getElementById('dialog');

  const ctxb = canvasBg.getContext('2d');
  const ctxf = canvasFg.getContext('2d');

  const offCanvas = (function () {
    if(window.OffscreenCanvas) {
      return new OffscreenCanvas(canvasBg.width, canvasBg.height)
    } else {
      const can = document.createElement('canvas');
      can.width = canvasBg.width;
      can.height = canvasBg.height;
      return can;
    }
  })();
  const offCtx = offCanvas.getContext('2d');

  let rightScale = fillImage(ctxb, ctxf, offCtx, img_fat); // 绘图

  // 绑定滑块事件
  const inputSlider = document.getElementById('input-slider');
  // 鼠标按下
  inputSlider.onmousedown = ev => {
    // 鼠标松开
    inputSlider.onmouseup = ev => {
      
      canvasFg.classList.add('transition');
      canvasFg.ontransitionend = ev => {
        canvasFg.ontransitionend = null;
        canvasFg.classList.remove('transition');
      }
      inputSlider.onmouseup = null;
      const value = sliderbar.value / 100 * (canvasBg.width - fragmentWH[0]) / canvasBg.width;
      sliderbar.value = '0';
      canvasFg.style.left = 10 + 'px';
      sliderbar.style.background = `linear-gradient(
        to right,
        rgba(82, 196, 26, 0.2) 0%,
        rgba(82, 196, 26, 0.2) 0%,
        rgb(89, 89, 89, 0.2) 0%,
        rgb(89, 89, 89, 0.2) 100%
      )`;

      // 在此校验是否成功
      if(Math.abs(value - rightScale) < 0.01) {
        // 成功
        createNotice(true);
      } else {
        // 失败
        dialog.classList.add('shake');
        dialog.onanimationend = ev => {
          dialog.onanimationend = null;
          dialog.classList.remove('shake');
        };
        createNotice(false);
      }
    }
  };
  inputSlider.oninput = ev => {
    const percent = (+ev.target.value).toFixed(2);
    const left = +ev.target.value / 100 * (canvasBg.width - fragmentWH[0]);
    canvasFg.style.left = left + 10 + 'px';
    const string = `linear-gradient(
      to right,
      rgba(82, 196, 26, 0.2) 0%,
      rgba(82, 196, 26, 0.2) ${percent}%,
      rgb(89, 89, 89, 0.2) ${percent}%,
      rgb(89, 89, 89, 0.2) 100%
    )`;
    sliderbar.style.background = string;
  };

  // 按钮事件
  document.getElementById('btn-refresh').onclick = ev => {
    rightScale = fillImage(ctxb, ctxf, offCtx, img_fat); // 绘图
  };
})();

// 获取图片
function createImage(url) {
  const img = new Image();
  return new Promise(resolve => {
    img.onload = () => {
      resolve(img);
    };
    img.src = url
  });
}

// 绘制背景
function fillImage(ctxb, ctxf, offCtx, img) {
  // default : 1920x1080
  const { width: imgW, height: imgH } = img;
  const { width: canvasW, height: canvasH } = (ctxb || ctxf).canvas;
  const diff = (imgW / imgH - canvasW / canvasH);
  
  let sWidth = imgW;
  let sHeight = imgH;
  let sx = 0;
  let sy = 0;
  // 裁剪
  if(diff > Number.EPSILON) {
    // 宽度裁剪
    sWidth = canvasW / canvasH * imgH
    sx = (imgW - sWidth) / 2;
  } else if(diff < -Number.EPSILON) {
    // 高度裁剪
    sHeight = canvasH / canvasW * imgW
    sy = (imgH - sHeight) / 2;
  }
  const fragment = createFragment(canvasW, canvasH); // 拼图的随机位置
  const path = createPath(fragment, fragmentWH); // 创建图形路径
  const bgPath = createPath(fragment, fragmentWH, [canvasW, canvasH]);

  const params = [img, sx, sy, sWidth, sHeight, 0, 0, canvasW, canvasH];

  // 绘制背景
  ctxb.clearRect(0, 0, canvasW, canvasH);
  ctxb.save();
  ctxb.filter = 'brightness(50%)';
  ctxb.clip(path);
  ctxb.drawImage(...params);
  ctxb.restore();
  offCtx.clearRect(0, 0, canvasW, canvasH);
  offCtx.save();
  // offCtx.fillStyle = 'transparent';
  // offCtx.fillRect(0, 0, canvasW, canvasH);
  offCtx.clip(bgPath);
  offCtx.drawImage(...params);
  offCtx.restore();

  // 镂空效果
  ctxb.shadowColor = '#000';
  ctxb.shadowOffsetX = 2;
  ctxb.shadowOffsetY = 2;
  ctxb.shadowBlur = 3;
  ctxb.drawImage(offCtx.canvas, 0, 0);
  ctxb.restore();

  // 绘制拼图
  offCtx.clearRect(0, 0, canvasW, canvasH);
  offCtx.save();
  offCtx.clip(path);
  offCtx.drawImage(...params);
  offCtx.lineWidth = 2;
  offCtx.strokeStyle = 'yellow';
  offCtx.stroke(path);
  offCtx.restore();


  ctxf.clearRect(0, 0, canvasW, canvasH);
  ctxf.save();
  ctxf.shadowColor = '#000';
  ctxf.shadowOffsetX = 2;
  ctxf.shadowOffsetY = 2;
  ctxf.shadowBlur = 3;
  ctxf.drawImage(offCtx.canvas, -fragment[0], 0);
  // ctxf.drawImage(offCtx.canvas, 0, 0);
  ctxf.restore();

  return fragment[2];
}

// 随机生成拼图
function createFragment(canvasW, canvasH) {
  const fn = (s, e) => Math.random() * (e - s) + s;
  const scaleY = fn(0.4, 0.6);// 限制y轴范围 0.4~0.6
  const scaleX = fn(0.5, 0.8); // 限制x轴范围 0.5~0.8

  return [scaleX * canvasW, scaleY * canvasH, scaleX, scaleY];
}

// 创建路径
function createPath([x, y], [w = 40, h = 40] = [], outer) {
  const W = w;
  const H = h;
  const path = new Path2D();

  const radW = W / 8;
  const diffW =  W / 2 - radW; // 上突起的x轴偏移
  const radH = H / 8;
  const diffH =  H / 2 - radH; // 下突起的y轴偏移

  // 外框
  if(outer && outer.length) {
    const [cw, ch] = outer;
    path.moveTo(0, 0);
    path.lineTo(0, ch);
    path.lineTo(cw, ch);
    path.lineTo(cw, 0);
    path.closePath();
  }

  // 起点，左上角
  path.moveTo(x, y);
  path.lineTo(x + diffW, y);
  path.arc(x + W / 2, y, radW, Math.PI, 2 * Math.PI, false);
  // 右上角
  path.lineTo(x + W, y);
  // 右下角
  path.lineTo(x + W, y + H);
  // 左下角
  path.lineTo(x, y + H);
  path.lineTo(x, y + H - diffH);
  path.arc(x, y + H / 2, radH, 0.5 * Math.PI, 1.5 * Math.PI, true);
  path.lineTo(x, y + H);
  path.closePath();

  return path;
}

// 创建提示文字
function createNotice(flag = false) {
  if(notice) {
    notice.remove();
    notice = null;

    if(timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  notice = document.createElement('div');
  notice.className = flag ? 'notice-successed' : 'notice-failed';
  notice.innerHTML = flag ? '验证通过' : '验证失败';
  document.getElementById('canvas-box').appendChild(notice);
  setTimeout(() => {
    notice.classList.add('raise-up');
  }, 0);

  timer = setTimeout(() => {
    if(notice) {
      notice.classList.remove('raise-up');
      notice.ontransitionend = ev => {
        notice.remove();
        notice.ontransitionend = null;
        notice = null;
      }
      timer = null;
    }
  }, 800);
}
