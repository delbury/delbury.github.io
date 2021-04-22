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
        img: './assets/img/writing-board.png',
        desc: '写字板',
      },
      {
        href: './canvas/clock.html',
        title: 'Clock',
        img: './assets/img/clock.png',
        desc: '简单的时钟',
      },
      {
        href: './canvas/infinity-picture.html',
        title: 'Infinity Picture',
        img: './assets/img/infinity-picture.png',
        desc: '可以无限拖动的图片',
      },
      {
        href: './canvas/particles.html',
        title: 'Radio Particles',
        img: './assets/img/particles.png',
        desc: '放射性粒子动画',
      },
      {
        href: './canvas/random-move.html',
        title: 'Random Move',
        desc: '随机移动的粒子动画',
      },
      {
        href: './canvas/ease-animation.html',
        title: 'Ease Animation',
        desc: '缓动的粒子动画',
      },
      {
        href: './canvas/spring-animation.html',
        title: 'Spring Animation',
        desc: '弹性移动的粒子动画',
      },
      {
        href: './canvas/balls-collision.html',
        title: 'Ball Collision',
        desc: '多边形碰撞动画',
      },
      {
        href: './canvas/polygon-change.html',
        title: 'Polygon Change',
        desc: '多边形变形动画',
      },
      {
        href: './canvas/particle-text.html',
        title: 'Particle Text',
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
        desc: '贪吃蛇',
      },
      {
        href: './canvasGameDemos/index.html',
        title: 'Jump Jump',
        desc: '障碍跳',
      },
      {
        href: './myGames/Minesweeper/minesweeper.html',
        title: 'Mineswepper',
        desc: '扫雷',
      },
      {
        href: './myGames/Tetris/tetris.html',
        title: 'Tetris',
        desc: '俄罗斯方块',
      },
    ],
  },
  {
    sectionTitle: 'WebAudio Demos',
    items: [
      {
        href: './audio/song-play.html',
        title: 'Song Play',
        desc: '自定义音符序列播放器',
      },
      {
        href: './audio/piano.html',
        title: 'Piano',
        desc: '简单的钢琴',
      },
      {
        href: './audio/audio-analyser.html',
        title: 'Audio Analyser',
        desc: '音频分析器',
      },
    ],
  },
  {
    sectionTitle: 'Components',
    items: [
      {
        href: './components/JigsawVerification/index.html',
        title: 'Jigsaw Verification',
        desc: '滑块验证',
      },
      {
        href: './components/LoadingEffects/index.html',
        title: 'Loading Effects',
        desc: 'loading动画 (css)',
      },
      {
        href: './components/BezierCurve/index.html',
        title: 'Bezier Curve',
        desc: '贝塞尔函数生成器',
      },
      {
        href: './components/CharCode/index.html',
        title: 'Char Code',
        desc: '字符编码转换器',
      },
      {
        href: './components/PerformanceMonitor/index.html',
        title: 'Performance Monitor',
        desc: '代码性能测试工具',
      },
      {
        href: './components/Animations/index.html',
        title: 'Animations',
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
        desc: '魔方',
      },
      {
        href: './webgl/mouse-cube.html',
        title: 'Mouse Cube',
        desc: '单个立方体',
      },
    ],
  },
];

// 创建导航栏
(function() {
  if(!hasNavbar) return;

  const navbar = document.getElementById('navbar');
  let htmlText = '';
  sections.forEach((item, index) => {
    item.id = `section_${index}`;
    htmlText += `<a href="#${item.id}">${item.sectionTitle}</a>`
  });
  navbar.innerHTML = htmlText;

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
    const ul = document.createElement('ul');
    ul.id = sec.id;
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
