
(() => {
  // 拖动元素
  const bgGrid = document.querySelector('.bg-grid');
  const bg = document.getElementById('workbench-cubic');

  const svg = bg.querySelector('[data-id=svg]');
  const svgPath = bg.querySelector('[data-id=svg-path]');
  const svgPathStart = bg.querySelector('[data-id=svg-path-start]');
  const svgPathEnd = bg.querySelector('[data-id=svg-path-end]');

  const coords = [];
  const spotList = [];
  bingElementEvent('spot-start', 0);
  bingElementEvent('spot-end', 3);
  bingElementEvent('spot-start-ctrl', 1);
  bingElementEvent('spot-end-ctrl', 2);
  init();



  function bingElementEvent(id, index) {
    const ele = bg.querySelector(`[data-id=${id}]`);
    spotList[index] = ele;


    ele.onmousedown = ev => {
      const { offsetX: dx, offsetY: dy } = ev;
      const target = ev.target;
      bg.classList.add('cp');

      bg.onmousemove = ev => {
        ev.preventDefault();

        const x = ev.pageX - bgGrid.offsetLeft - dx;
        const y = ev.pageY - bgGrid.offsetTop - dy;
        target.style.left = x + 'px';
        target.style.top = y + 'px';

        setCoords(x + 10, y + 10, index);
        update();
      };



      document.onmouseup = ev => {
        bg.classList.remove('cp');
        bg.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  // 计算相对坐标
  function calcRelativeCoords() {
    spotList.forEach((spot, index) => {
      spot.dataset.abcoord = `${coords[index][0].toFixed(0)},${coords[index][1].toFixed(0)}`;
      if (index === 0) {
        spot.dataset.recoord = '0,0';
      } else {
        spot.dataset.recoord = `${(coords[index][0] - coords[0][0]).toFixed(0)},${(coords[index][1] - coords[0][1]).toFixed(0)}`;
      }
    })
  }

  // 设置坐标，重绘
  function setCoords(x, y, index) {
    coords[index] = [x - 5, y - 5];
    spotList[index].dataset.abcoord = `${x.toFixed(0)},${y.toFixed(0)}`;

    calcRelativeCoords();
  }

  // 初始化
  function init() {
    spotList.forEach((spot, index) => {
      coords[index] = [spot.offsetLeft + 5, spot.offsetTop + 5];

    });
    calcRelativeCoords();

    const size = svg.parentElement.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);

    update();
  }

  // 更新绘图
  function update() {
    svgPath.setAttribute('d',
      `M${coords[0][0]} ${coords[0][1]} ` +
      `C${coords[1][0]} ${coords[1][1]} ${coords[2][0]} ${coords[2][1]} ${coords[3][0]} ${coords[3][1]}`
    );
    svgPathStart.setAttribute('d',
      `M${coords[0][0]} ${coords[0][1]} L${coords[1][0]} ${coords[1][1]}`
    );
    svgPathEnd.setAttribute('d',
      `M${coords[3][0]} ${coords[3][1]} L${coords[2][0]} ${coords[2][1]}`
    );
  }
})();

