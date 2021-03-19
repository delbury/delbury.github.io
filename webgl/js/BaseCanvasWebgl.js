import Events from './Events.js';

export default class BaseCanvasWebgl extends Events {
  static X_DIR = [1, 0, 0, 1];
  static Y_DIR = [0, 1, 0, 1];
  static Z_DIR = [0, 0, 1, 1];
  constructor(canvas, params = {}) {
    if(!canvas || !(canvas instanceof HTMLCanvasElement)) throw new TypeError('param[0] is not a canvas element');
    if(params && typeof params !== 'object') throw new TypeError('param[1] is not a params object');

    super();
    
    const { width, height } = params;
    this.canvas = canvas;
    this.canvas.width = width ?? 800;
    this.canvas.height = height ?? 800;
    this.gl = this.canvas.getContext('webgl2') ?? this.canvas.getContext('webgl');
    this.programs = new Map(); // 着色器程序 map
    this.currentProgram = null; // 当前使用的着色其程序数组
    this.raqId = null; // 节流控制

    if(!this.gl) throw new Error('can not get webgl context');

    // 设置参数
    this.setWebglParams(params);
    // 开启功能
    this.enableFuncs();
  }

  // 开始 webgl 的部分功能特性
  enableFuncs() {
    this.gl.enable(this.gl.DEPTH_TEST); // 开启隐面消除
    this.gl.enable(this.gl.CULL_FACE); // 开启背面隐藏
  }

  // 初始化参数
  initParams() {}
  // 创建矩阵
  initMatrixs() {}
  // 设置变量数据
  initData() {}
  // 初始化
  init() {
    this.initParams();
    this.initMatrixs();
    this.initData();
  }

  // 清除缓冲区
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // 设置参数
  setWebglParams({
    clearColor = [0.0, 0.0, 0.0, 1.0],
  } = {}) {
    this.gl.clearColor(...clearColor);
  }

  // 使用着色器程序
  useProgram(program) {
    this.currentProgram = program;
    this.gl.useProgram(program);
  }

  // 绘制
  draw() {}
  // 节流绘制
  throttleDraw() {
    if(this.raqId) return; // 节流

    this.raqId = requestAnimationFrame(() => {
      this.raqId = null;
      this.draw();
    });
  }

  // canvas的宽度
  get width() {
    return this.canvas.width;
  }
  // canvas的高度
  get height() {
    return this.canvas.height;
  }
}