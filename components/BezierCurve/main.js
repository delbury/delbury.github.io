
(() => {
  // 拖动元素
  const bgGrid = document.querySelector('.bg-grid');
  const bgs = {
    '3': document.getElementById('workbench-cubic'), // 三次
    '2': document.getElementById('workbench-quadratic'), // 二次
    '1': document.getElementById('workbench-normalization'), // 归一
  };
  const toolInput = document.getElementById('tool-input'); // 用作文本复制
  const btnFun = document.getElementById('btn-copy-fun'); // 复制函数按钮

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
    '1': {
      svg: bgs['1'].querySelector('[data-id=svg]'),
      svgPath: bgs['1'].querySelector('[data-id=svg-path]'),
      svgPathStart: bgs['1'].querySelector('[data-id=svg-path-start]'),
      svgPathEnd: bgs['1'].querySelector('[data-id=svg-path-end]'),
      coords: [],
      spotList: [],
      inited: false
    }
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

  bindElementEvent('1', 'spot-start', 0);
  bindElementEvent('1', 'spot-end', 3);
  bindElementEvent('1', 'spot-start-ctrl', 1);
  bindElementEvent('1', 'spot-end-ctrl', 2);

  bindTypeRadio();

  // 绑定按钮事件
  // 绝对坐标
  document.getElementById('btn-copy-abs').onclick = ev => {
    let text = '';
    let symbol = '';
    if (state.currentType == '3') {
      symbol = 'C';
    } else if (state.currentType == '2') {
      symbol = 'Q';
    }

    const d = coords.map((coord, index) => {
      if (index === 0) {
        return `M${coord[0]} ${coord[1]}`;
      } else if (index === 1) {
        return `${symbol}${coord[0]} ${coord[1]}`;
      } else {
        return `${coord[0]} ${coord[1]}`;
      }
    }).join(' ');
    text = `<path d="${d}" fill="none"></path>`;
    toolInput.value = text;
    toolInput.select();

    document.execCommand('copy');
  };

  // 相对坐标
  document.getElementById('btn-copy-rel').onclick = ev => {
    let text = '';
    let symbol = '';
    if (state.currentType == '3') {
      symbol = 'C';
    } else if (state.currentType == '2') {
      symbol = 'Q';
    }

    const d = coords.map((coord, index) => {
      if (index === 0) {
        return `M0 0`;
      } else if (index === 1) {
        return `${symbol}${coord[0] - coords[0][0]} ${coord[1] - coords[0][1]}`;
      } else {
        return `${coord[0] - coords[0][0]} ${coord[1] - coords[0][1]}`;
      }
    }).join(' ');
    text = `<path d="${d}" fill="none"></path>`;
    toolInput.value = text;
    toolInput.select();

    document.execCommand('copy');
  };

  // 贝塞尔函数
  btnFun.onclick = ev => {
    if (state.currentType == '1') {
      const text = `cubic-bezier(${spotList[1].dataset.recoord},${spotList[2].dataset.recoord})`;
      toolInput.value = text;
      toolInput.select();

      document.execCommand('copy');
    }
  };

  // 切换数据源
  function switchDataSource(type) {
    if (type == '1') {
      btnFun.removeAttribute('disabled');
    } else {
      btnFun.setAttribute('disabled', true);
    }
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
      if (ele.checked) {
        state.currentType = ele.value;
        switchDataSource(ele.value);
      }
      ele.onchange = ev => {
        for (let key in bgs) {
          if (ev.target.value == key) {
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
      if (state.currentType == '1' && (ev.target === spotList[0] || ev.target === spotList[3])) {
        return;
      }

      const { offsetX: dx, offsetY: dy } = ev;
      const target = ev.target;
      bg.classList.add('cp');

      bg.onmousemove = ev => {
        ev.preventDefault();


        let x = ev.pageX - bgGrid.offsetLeft - dx;
        let y = ev.pageY - bgGrid.offsetTop - dy;

        if (state.currentType == '1') {
          if (x <= coords[0][0]) {
            x = coords[0][0] - 5;
          }
          if (x >= coords[3][0]) {
            x = coords[3][0] - 5;
          }
        }
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
    if (state.currentType != '1') {
      spotList.forEach((spot, index) => {
        spot.dataset.abcoord = `${coords[index][0].toFixed(0)},${coords[index][1].toFixed(0)}`;
        if (index === 0) {
          spot.dataset.recoord = '0,0';
        } else {
          spot.dataset.recoord = `${(coords[index][0] - coords[0][0]).toFixed(0)},${(coords[index][1] - coords[0][1]).toFixed(0)}`;
        }
      })
    } else {
      spotList.forEach((spot, index) => {
        spot.dataset.abcoord = `${coords[index][0].toFixed(0)},${coords[index][1].toFixed(0)}`;
        if (index === 0) {
          spot.dataset.recoord = '0,0';
        } else if (index === 3) {
          spot.dataset.recoord = '1,1';
        } else {
          const x = (coords[index][0] - coords[0][0]) / (coords[3][0] - coords[0][0]);
          const y = (coords[index][1] - coords[0][1]) / (coords[3][1] - coords[0][1]);
          spot.dataset.recoord = `${x.toFixed(2)},${y.toFixed(2)}`;
        }
      })
    }
  }

  // 设置坐标，重绘
  function setCoords(x, y, index) {
    coords[index] = [x - 5, y - 5];
    spotList[index].dataset.abcoord = `${x.toFixed(0)},${y.toFixed(0)}`;

    calcRelativeCoords();
  }

  // 初始化
  function init(type) {
    if (bezierState[type].inited) {
      return;
    }
    bezierState[type].inited = true;

    if (state.currentType != '1') {
      spotList.forEach((spot, index) => {
        coords[index] = [spot.offsetLeft + 5, spot.offsetTop + 5];
      });
    } else {
      // index = 0
      let spot = spotList[0];
      coords[0] = [spot.offsetLeft + 5, spot.offsetTop + 5];

      // index = 3
      spot = spotList[3];
      const size = spot.parentElement.offsetHeight * 0.5;
      coords[3] = [coords[0][0] + size, coords[0][1] - size];

      spot.style.left = coords[0][0] + size - 5 + 'px';
      spot.style.top = coords[0][1] - size - 5 + 'px';

      const center = +((coords[0][0] + coords[3][0]) / 2).toFixed(0);
      // index = 1
      spot = spotList[1];
      coords[1] = [center, coords[0][1]];
      spot.style.left = coords[1][0] - 5 + 'px';
      spot.style.top = coords[1][1] - 5 + 'px';

      // index = 2
      spot = spotList[2];
      coords[2] = [center, coords[3][1]];
      spot.style.left = coords[2][0] - 5 + 'px';
      spot.style.top = coords[2][1] - 5 + 'px';
    }

    calcRelativeCoords();

    const size = svg.parentElement.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    update();
  }

  // 更新绘图
  function update() {
    if (state.currentType == '3' || state.currentType == '1') {
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
    } else if (state.currentType == '2') {
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

