// 是否绘制背景
const hasBg = false;
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
        cover: './assets/cover/writing-board.mp4',
        desc: '写字板',
      },
      {
        href: './canvas/clock.html',
        title: 'Clock',
        cover: './assets/cover/clock.mp4',
        desc: '简单的时钟',
      },
      {
        href: './canvas/infinity-picture.html',
        title: 'Infinity Picture',
        cover: './assets/cover/infinity-picture.mp4',
        desc: '可以无限拖动的图片',
      },
      {
        href: './canvas/particles.html',
        title: 'Radio Particles',
        cover: './assets/cover/particles.mp4',
        desc: '放射性粒子动画',
      },
      {
        href: './canvas/random-move.html',
        title: 'Random Move',
        cover: './assets/cover/random-move.mp4',
        desc: '随机移动的粒子动画',
      },
      {
        href: './canvas/ease-animation.html',
        title: 'Ease Animation',
        cover: './assets/cover/ease-animation.mp4',
        desc: '缓动的粒子动画',
      },
      {
        href: './canvas/spring-animation.html',
        title: 'Spring Animation',
        cover: './assets/cover/spring-animation.mp4',
        desc: '弹性移动的粒子动画',
      },
      {
        href: './canvas/balls-collision.html',
        title: 'Ball Collision',
        cover: './assets/cover/balls-collision.mp4',
        desc: '多边形碰撞动画',
      },
      {
        href: './canvas/polygon-change.html',
        title: 'Polygon Change',
        cover: './assets/cover/polygon-change.mp4',
        desc: '多边形变形动画',
      },
      {
        href: './canvas/particle-text.html',
        title: 'Particle Text',
        cover: './assets/cover/particle-text.mp4',
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
        cover: './assets/cover/snake.mp4',
        desc: '贪吃蛇',
      },
      {
        href: './canvasGameDemos/index.html',
        title: 'Jump Jump',
        cover: './assets/cover/jump-jump.mp4',
        desc: '障碍跳',
      },
      {
        href: './myGames/Minesweeper/minesweeper.html',
        title: 'Mineswepper',
        cover: './assets/cover/minesweeper.mp4',
        desc: '扫雷',
      },
      {
        href: './myGames/Tetris/tetris.html',
        title: 'Tetris',
        cover: './assets/cover/tetris.mp4',
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
        cover: './assets/cover/audio-analyser.mp4',
        desc: '音频分析器',
      },
      {
        href: './audio/song-play.html',
        title: 'Song Play',
        cover: './assets/img/song-play.png',
        desc: '自定义音符序列播放器',
      },
      {
        href: './audio/piano.html',
        title: 'Piano',
        cover: './assets/img/piano.png',
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
        cover: './assets/cover/jigsaw-verification.mp4',
        desc: '滑块验证',
      },
      {
        href: './components/LoadingEffects/index.html',
        title: 'Loading Effects',
        cover: './assets/cover/loading-effects.mp4',
        desc: 'loading动画 (css)',
      },
      {
        href: './components/BezierCurve/index.html',
        title: 'Bezier Curve',
        cover: './assets/cover/bezier-curve.mp4',
        desc: '贝塞尔函数生成器',
      },
      {
        href: './components/CharCode/index.html',
        title: 'Char Code',
        cover: './assets/cover/char-code.mp4',
        desc: '字符编码转换器',
      },
      // {
      //   href: './components/PerformanceMonitor/index.html',
      //   title: 'Performance Monitor',
      //   cover: './assets/img/performance-monitor.png',
      //   desc: '代码性能测试工具',
      // },
      {
        href: './components/Animations/index.html',
        title: 'Animations',
        cover: './assets/cover/animations.mp4',
        desc: '动画效果 (js)',
      },
      {
        href: './components/NoConsole/index.html',
        title: 'No Console',
        cover: '',
        desc: '禁止复制',
      },
    ],
  },
  {
    sectionTitle: 'WebGL Demos',
    items: [
      {
        href: './webgl/magic-cube.html',
        title: 'Magic Cube',
        cover: './assets/cover/magic-cube.mp4',
        desc: '魔方',
      },
      {
        href: './webgl/mouse-cube.html',
        title: 'Mouse Cube',
        cover: './assets/cover/mouse-cube.mp4',
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
    const bp = document.createElement('div'); // 创建埋点
    bp.classList.add('section-bp');
    bp.id = sec.id;
    section.prepend(bp);
    const ul = document.createElement('ul');
    for(const it of sec.items) {
      const li = document.createElement('li');
      const liItem = document.createElement('li-item');
      liItem.dataset.href = it.href;
      liItem.dataset.desc = it.desc;
      liItem.dataset.title = it.title;
      liItem.dataset.cover = it.cover;

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

  // 页面不可见时停止背景动画
  document.onvisibilitychange = ev => {
    if(document.hidden) {
      worker.postMessage({ type: 'stop' });
    } else {
      worker.postMessage({ type: 'play' });
    }
  };
}());
