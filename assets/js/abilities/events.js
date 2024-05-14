import { getDom } from './utils.js';

/**
 * 鼠标的点击按住，移动事件
 * @param {*} dom
 * @param {*} param1
 */
function draggableElement(dom, { ondown, onmove, onup } = {}) {
  dom = getDom(dom);

  const fnDown = (evDown) => {
    const { screenX: startX, screenY: startY } = evDown;
    let prevX = startX;
    let prevY = startY;
    ondown?.(startX, startY);

    const fnMove = (evMove) => {
      const { screenX, screenY } = evMove;

      // 与最开始点击的坐标的差值
      const diffX = screenX - startX;
      const diffY = screenY - startY;

      // 与上一次坐标的差值
      const prevDiffX = screenX - prevX;
      const prevDiffY = screenY - prevY;
      prevX = screenX;
      prevY = screenY;

      onmove?.(diffX, diffY, prevDiffX, prevDiffY);
    };

    const fnUp = () => {
      dom.removeEventListener('mousemove', fnMove);
      document.removeEventListener('mouseup', fnUp);
      onup?.();
    };

    dom.addEventListener('mousemove', fnMove);
    document.addEventListener('mouseup', fnUp);
  };
  dom.addEventListener('mousedown', fnDown);

  return () => dom.removeEventListener('mousedown', fnDown);
}

/**
 * 鼠标滚轮可缩放
 * @param {*} dom
 * @param {*} cb
 */
function scalableElement(dom, cb) {
  dom = getDom(dom);

  const fnWheel = (ev) => {
    ev.preventDefault();
    const { deltaY, offsetX, offsetY } = ev;
    // 向上 deltaY < 0
    // 向下 deltaY > 0
    cb({
      event: ev,
      delta: Math.abs(deltaY),
      factor: deltaY > 0 ? -1 : 1,
      x: offsetX,
      y: offsetY,
    });
  };
  dom.addEventListener('wheel', fnWheel, { passive: false });

  return () => dom.removeEventListener('wheel', fnWheel);
}

/**
 * 鼠标拖拽可滚动元素
 * @param {*} dom
 */
function scrollableElement(dom) {
  dom = getDom(dom);

  let startX = null;
  let startY = null;
  return draggableElement(dom, {
    ondown: () => {
      startX = dom.scrollLeft;
      startY = dom.scrollTop;
    },
    onmove: (x, y) => {
      dom.scrollTo(startX - x, startY - y);
    },
  });
}

export { draggableElement, scalableElement, scrollableElement };
