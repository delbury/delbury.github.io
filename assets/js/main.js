// 是否绘制背景
const hasBg = true;
// 是否创建内容
const hasContent = true;
// 是否创建导航栏
const hasNavbar = true;

// 列表
const sections = [
  {
    sectionTitle: 'Canvas Demos',
    items: [
      {
        href: './canvas/writing-board.html',
        title: 'Writing Board',
        img: './assets/img/writing-board.gif',
        desc: '写字板',
      },
      {
        href: './canvas/clock.html',
        title: 'Clock',
        img: './assets/img/clock.gif',
        desc: '简单的时钟',
      },
      {
        href: './canvas/infinity-picture.html',
        title: 'Infinity Picture',
        img: './assets/img/infinity-picture.gif',
        desc: '可以无限拖动的图片',
      },
      {
        href: './canvas/particles.html',
        title: 'Radio Particles',
        img: './assets/img/particles.gif',
        desc: '放射性粒子动画',
      },
      {
        href: './canvas/random-move.html',
        title: 'Random Move',
        img: './assets/img/random-move.gif',
        desc: '随机移动的粒子动画',
      },
      {
        href: './canvas/ease-animation.html',
        title: 'Ease Animation',
        img: './assets/img/ease-animation.gif',
        desc: '缓动的粒子动画',
      },
      {
        href: './canvas/spring-animation.html',
        title: 'Spring Animation',
        img: './assets/img/spring-animation.gif',
        desc: '弹性移动的粒子动画',
      },
      {
        href: './canvas/balls-collision.html',
        title: 'Ball Collision',
        img: './assets/img/balls-collision.gif',
        desc: '多边形碰撞动画',
      },
      {
        href: './canvas/polygon-change.html',
        title: 'Polygon Change',
        img: './assets/img/polygon-change.gif',
        desc: '多边形变形动画',
      },
      {
        href: './canvas/particle-text.html',
        title: 'Particle Text',
        img: './assets/img/particle-text.gif',
        desc: '粒子文本动画',
      },
    ],
  },
  {
    sectionTitle: 'Simple Games',
    items: [
      {
        href: './myGames/Snake/snake.html',
        title: 'Snake',
        img: './assets/img/snake.gif',
        desc: '贪吃蛇',
      },
      {
        href: './canvasGameDemos/index.html',
        title: 'Jump Jump',
        img: './assets/img/jump-jump.gif',
        desc: '障碍跳',
      },
      {
        href: './myGames/Minesweeper/minesweeper.html',
        title: 'Mineswepper',
        img: './assets/img/minesweeper.gif',
        desc: '扫雷',
      },
      {
        href: './myGames/Tetris/tetris.html',
        title: 'Tetris',
        img: './assets/img/tetris.gif',
        desc: '俄罗斯方块',
      },
    ],
  },
  {
    sectionTitle: 'WebAudio Demos',
    items: [
      {
        href: './audio/audio-analyser.html',
        title: 'Audio Analyser',
        img: './assets/img/audio-analyser.gif',
        desc: '音频分析器',
      },
      {
        href: './audio/song-play.html',
        title: 'Song Play',
        img: './assets/img/song-play.png',
        desc: '自定义音符序列播放器',
      },
      {
        href: './audio/piano.html',
        title: 'Piano',
        img: './assets/img/piano.png',
        desc: '简单的钢琴',
      },
    ],
  },
  {
    sectionTitle: 'Components',
    items: [
      {
        href: './components/JigsawVerification/index.html',
        title: 'Jigsaw Verification',
        img: './assets/img/jigsaw-verification.gif',
        desc: '滑块验证',
      },
      {
        href: './components/LoadingEffects/index.html',
        title: 'Loading Effects',
        img: './assets/img/loading-effects.gif',
        desc: 'loading动画 (css)',
      },
      {
        href: './components/BezierCurve/index.html',
        title: 'Bezier Curve',
        img: './assets/img/bezier-curve.gif',
        desc: '贝塞尔函数生成器',
      },
      {
        href: './components/CharCode/index.html',
        title: 'Char Code',
        img: './assets/img/char-code.gif',
        desc: '字符编码转换器',
      },
      {
        href: './components/PerformanceMonitor/index.html',
        title: 'Performance Monitor',
        img: './assets/img/performance-monitor.png',
        desc: '代码性能测试工具',
      },
      {
        href: './components/Animations/index.html',
        title: 'Animations',
        img: './assets/img/animations.gif',
        desc: '动画效果 (js)',
      },
    ],
  },
  {
    sectionTitle: 'WebGL Demos',
    items: [
      {
        href: './webgl/magic-cube.html',
        title: 'Magic Cube',
        img: './assets/img/magic-cube.gif',
        desc: '魔方',
      },
      {
        href: './webgl/mouse-cube.html',
        title: 'Mouse Cube',
        img: './assets/img/mouse-cube.gif',
        desc: '单个立方体',
      },
    ],
  },
];

// 创建导航栏
(function() {
  if(!hasNavbar) return;

  const navbar = document.getElementById('navbar');
  const frag = document.createDocumentFragment();
  // 滚动到目标元素
  const handleClick = ev => {
    ev.preventDefault();
    const ele = document.getElementById(ev.target.dataset.toId);
    ele.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  sections.forEach((item, index) => {
    item.id = `section_${index}`;
    const a = document.createElement('a');
    a.dataset.toId = item.id;
    a.href = `#${item.id}`;
    a.innerText = item.sectionTitle;
    a.onclick = handleClick;
    frag.append(a);
  });
  navbar.append(frag);

  // 创建滚动监听
  const bp = document.getElementById('burying-point');
  const pageHeader = document.querySelector('.page-header');
  const observer = new IntersectionObserver((records) => {
    if(records[0].isIntersecting) {
      // 显示
      pageHeader.classList.remove('folded');
    } else {
      // 隐藏
      pageHeader.classList.add('folded');
    }
  })
  observer.observe(bp);
}());

// 创建内容
(function() {
  if(!hasContent) return;
  
  const container = document.getElementById('container');
  const frag = document.createDocumentFragment();
  for(const sec of sections) {
    const section = document.createElement('section');
    section.innerHTML = `<h2 class="section-title">${sec.sectionTitle}</h2>`;
    section.id = sec.id;
    const ul = document.createElement('ul');
    for(const it of sec.items) {
      const li = document.createElement('li');
      const liItem = document.createElement('li-item');
      liItem.dataset.href = it.href;
      liItem.dataset.desc = it.desc;
      liItem.dataset.title = it.title;
      liItem.dataset.img = it.img;

      li.append(liItem);
      ul.append(li);
    }
    section.append(ul);
    frag.append(section);
  }
  container.append(frag);
}());

// 创建背景
(function() {
  if(!hasBg) return;

  const worker = new Worker('./assets/js/bg.js');
  const canvas = document.getElementById('bg').transferControlToOffscreen();
  worker.postMessage({
    type: 'init',
    width: window.innerWidth,
    height: window.innerHeight,
    canvas,
  }, [canvas]);

  // 监听窗口大小变化
  const observer = new ResizeObserver(record => {
    worker.postMessage({
      type: 'resize',
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });
  observer.observe(document.documentElement);
}());
