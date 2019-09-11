const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext('2d');
let index = null;
let timer = null;
let dataBackup = null;
let isStop = false;
let coords = null;
let bigCanvas = null;
let bigCtx = null;
let isMoveable = false;
// let pretime = null;

self.onmessage = ev => {
  const type = ev.data.type;
  if(type === 'init') {
    dataBackup = ev.data;
    const { img, step } = ev.data;
    const { width, height } = img;
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(img, 0, 0);

    scrollChange(width, height, step);

    // 扩展画布
    bigCanvas = new OffscreenCanvas(canvas.width * 3, canvas.height * 3);
    bigCtx = bigCanvas.getContext('2d');
  } else if(type === 'enter') {
    if(index) {
      cancelAnimationFrame(index);
      index = null;
    }
    if(timer) {
      clearTimeout(timer);
      timer = null;
    }
  } else if(type === 'leave') {
    const { img, step } = dataBackup;
    const { width, height } = img;
    isMoveable = false;
    scrollChange(width, height, step);
  } else if(type === 'move') {
    // if(pretime) {
    //   console.log(Date.now() - pretime);
    //   pretime = Date.now();
    // } else {
    //   pretime = Date.now();
    // }
    if(isMoveable) {
      const { offsetX, offsetY } = ev.data;
      const dx = -(offsetX - coords[0]) + canvas.width;
      const dy = -(offsetY - coords[1]) + canvas.height;
      
      const imgd = bigCtx.getImageData(dx, dy, canvas.width, canvas.height);
      ctx.putImageData(imgd, 0, 0);
      const res = canvas.transferToImageBitmap();
      ctx.drawImage(res, 0, 0);
      self.postMessage(res, [res]);
    }
  } else if(type === 'down') {
    const { offsetX, offsetY } = ev.data;
    coords = [offsetX, offsetY];
    isMoveable = true;

    // 扩展画布
    
    const pattern = bigCtx.createPattern(canvas, 'repeat');
    bigCtx.fillStyle = pattern;
    bigCtx.fillRect(0, 0, bigCanvas.width, bigCanvas.height);
  } else if(type === 'up') {
    isMoveable = false;
  }
}
function scrollChange(width, height, step) {
  if(isStop) return;
  const time = (Math.random() + 1) * 1000;
  randomScroll(width, height, step);
  timer = setTimeout(() => {
    if(index) cancelAnimationFrame(index);
    return scrollChange(width, height, step);
  }, time);
}
function randomScroll(width, height, step) {
  const type = Math.floor(Math.random() * 8);
  switch(type) {
    case 0: return scrollUp(width, height, step);
    case 1: return scrollDown(width, height, step);
    case 2: return scrollLeft(width, height, step);
    case 3: return scrollRight(width, height, step);
    case 4: return scrollUpLeft(width, height, step);
    case 5: return scrollDownRight(width, height, step);
    case 6: return scrollUpRight(width, height, step);
    case 7: return scrollDownLeft(width, height, step);
    default: break;
  }
}
function scrollUp(width, height, step) {
  const chip = ctx.getImageData(0, 0, width, step);
  const rest = ctx.getImageData(0, step, width, height - step);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(chip, 0, height - step);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollUp(width, height, step));
  return;
}
function scrollDown(width, height, step) {
  const chip = ctx.getImageData(0, 0, width, height - step);
  const rest = ctx.getImageData(0, height - step, width, step);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(chip, 0, step);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollDown(width, height, step));
  return;
}
function scrollLeft(width, height, step) {
  const chip = ctx.getImageData(0, 0, step, height);
  const rest = ctx.getImageData(step, 0, width - step, height);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(chip, width - step, 0);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollLeft(width, height, step));
  return;
}
function scrollRight(width, height, step) {
  const chip = ctx.getImageData(0, 0, width - step, height);
  const rest = ctx.getImageData(width - step, 0, step, height);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(chip, step, 0);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollRight(width, height, step));
  return;
}
function scrollUpLeft(width, height, steps) {
  const step = Math.round(steps / Math.round(2));
  const topleft = ctx.getImageData(0, 0, step, step);
  const top = ctx.getImageData(step, 0, width - step, step);
  const left = ctx.getImageData(0, step, step, height - step);
  const rest = ctx.getImageData(step, step, width - step, height - step);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(topleft, width - step, height - step);
  ctx.putImageData(top, 0, height - step);
  ctx.putImageData(left, width - step, 0);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollUpLeft(width, height, steps));
  return;
}
function scrollDownRight(width, height, steps) {
  const step = Math.round(steps / Math.round(2));
  const topleft = ctx.getImageData(0, 0, width - step, height - step);
  const top = ctx.getImageData(0, height - step, width - step, step);
  const left = ctx.getImageData(width - step, 0, step, height - step);
  const rest = ctx.getImageData(width - step, height - step, step, step);
  ctx.putImageData(rest, 0, 0);
  ctx.putImageData(topleft, step, step);
  ctx.putImageData(top, step, 0);
  ctx.putImageData(left, 0, step);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollDownRight(width, height, steps));
  return;
}
function scrollUpRight(width, height, steps) {
  const step = Math.round(steps / Math.round(2));
  const topleft = ctx.getImageData(width - step, 0, step, step);
  const top = ctx.getImageData(0, 0, width - step, step);
  const left = ctx.getImageData(width - step, step, step, height - step);
  const rest = ctx.getImageData(0, step, width - step, height - step);
  ctx.putImageData(rest, step, 0);
  ctx.putImageData(topleft, 0, height - step);
  ctx.putImageData(top, step, height - step);
  ctx.putImageData(left, 0, 0);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollUpRight(width, height, steps));
  return;
}
function scrollDownLeft(width, height, steps) {
  const step = Math.round(steps / Math.round(2));
  const topleft = ctx.getImageData(step, 0, width - step, height - step);
  const top = ctx.getImageData(step, height - step, width - step, step);
  const left = ctx.getImageData(0, 0, step, height - step);
  const rest = ctx.getImageData(0, height - step, step, step);
  ctx.putImageData(rest, width - step, 0);
  ctx.putImageData(topleft, 0, step);
  ctx.putImageData(top, 0, 0);
  ctx.putImageData(left, width - step, step);
  const res = canvas.transferToImageBitmap();
  ctx.drawImage(res, 0, 0);
  self.postMessage(res, [res]);
  index = requestAnimationFrame(() => scrollDownLeft(width, height, steps));
  return;
}