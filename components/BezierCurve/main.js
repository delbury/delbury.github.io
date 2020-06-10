
(() => {
  // 拖动元素
  const bgGrid = document.querySelector('.bg-grid');
  const bgs = {
    '3': document.getElementById('workbench-cubic'), // 三次
    '2': document.getElementById('workbench-quadratic'), // 二次
    '1': document.getElementById('workbench-normalization'), // 归一
  };

  // svg类型
  const state = {
    currentType: ''
  };

  // 贝塞尔的相关参数
  const bezierState = {
    '3': {
      svg: bgs['3'].querySelector('[data-id=svg]'),
      svgPath: bgs['3'].querySelector('[data-id=svg-path]'),
      svgPathStart: bgs['3'].querySelector('[data-id=svg-path-start]'),
      svgPathEnd: bgs['3'].querySelector('[data-id=svg-path-end]'),
      coords: [],
      spotList: [],
      inited: false
    },
    '2': {
      svg: bgs['2'].querySelector('[data-id=svg]'),
      svgPath: bgs['2'].querySelector('[data-id=svg-path]'),
      svgPathStart: bgs['2'].querySelector('[data-id=svg-path-start]'),
      svgPathEnd: bgs['2'].querySelector('[data-id=svg-path-end]'),
      coords: [],
      spotList: [],
      inited: false
    },
    '1': {}
  }


  let svg;
  let svgPath;
  let svgPathStart;
  let svgPathEnd;
  let coords;
  let spotList;

  switchDataSource('3');
  bindElementEvent('3', 'spot-start', 0);
  bindElementEvent('3', 'spot-end', 3);
  bindElementEvent('3', 'spot-start-ctrl', 1);
  bindElementEvent('3', 'spot-end-ctrl', 2);
  init('3');

  bindElementEvent('2', 'spot-start', 0);
  bindElementEvent('2', 'spot-end', 2);
  bindElementEvent('2', 'spot-ctrl', 1);

  bindTypeRadio();

  // 切换数据源
  function switchDataSource(type) {
    state.currentType = type;
    svg = bezierState[type].svg;
    svgPath = bezierState[type].svgPath;
    svgPathStart = bezierState[type].svgPathStart;
    svgPathEnd = bezierState[type].svgPathEnd;
    coords = bezierState[type].coords;
    spotList = bezierState[type].spotList;
  }

  // 绑定切换radio事件
  function bindTypeRadio() {
    const eles = document.querySelectorAll('.ctrl-area input[name=type]');
    eles.forEach(ele => {
      if(ele.checked) {
        state.currentType = ele.value;
        switchDataSource(ele.value);
      }
      ele.onchange = ev => {
        for(let key in bgs) {
          if(ev.target.value == key) {
            bgs[key].classList.remove('none');
            switchDataSource(ev.target.value);
            init(key);
          } else {
            bgs[key].classList.add('none');
          }
        }
      }
    });
  }

  // 绑定拖动事件
  function bindElementEvent(type, id, index) {
    const bg = bgs[type];
    const spotList = bezierState[type].spotList;
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
  function init(type) {
    if(bezierState[type].inited) {
      return;
    }
    bezierState[type].inited = true;
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
    if(state.currentType == '3') {
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
    } else if(state.currentType == '2') {
      svgPath.setAttribute('d',
        `M${coords[0][0]} ${coords[0][1]} ` +
        `Q${coords[1][0]} ${coords[1][1]} ${coords[2][0]} ${coords[2][1]}`
      );
      svgPathStart.setAttribute('d',
        `M${coords[0][0]} ${coords[0][1]} L${coords[1][0]} ${coords[1][1]}`
      );
      svgPathEnd.setAttribute('d',
        `M${coords[2][0]} ${coords[2][1]} L${coords[1][0]} ${coords[1][1]}`
      );
    }
  }
})();

