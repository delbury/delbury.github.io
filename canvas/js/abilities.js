/**
 * 鼠标的点击按住，移动事件
 * @param {*} dom
 * @param {*} param1
 */
function dragableElement(dom, { down, move, up } = {}) {
  const fnDown = (evDown) => {
    const { screenX: startX, screenY: startY } = evDown;
    let prevX = startX;
    let prevY = startY;
    down?.(startX, startY);

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

      move?.(diffX, diffY, prevDiffX, prevDiffY);
    };

    const fnUp = () => {
      dom.removeEventListener('mousemove', fnMove);
      document.removeEventListener('mouseup', fnUp);
      up?.();
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

function scrollableElement(dom) {
  let startX = null;
  let startY = null;
  return dragableElement(dom, {
    down: () => {
      startX = dom.scrollLeft;
      startY = dom.scrollTop;
    },
    move: (x, y) => {
      dom.scrollTo(startX - x, startY - y);
    },
  });
}

export { dragableElement, scalableElement, scrollableElement };
