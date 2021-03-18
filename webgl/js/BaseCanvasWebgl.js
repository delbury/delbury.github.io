import Events from './Events.js';

export default class BaseCanvasWebgl extends Events {
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

    if(!this.gl) throw new Error('can not get webgl context');

    // 设置参数
    this.setParams(params);
  }

  // 清除缓冲区
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  // 设置参数
  setParams({
    clearColor = [0.0, 0.0, 0.0, 1.0],
  } = {}) {
    this.gl.clearColor(...clearColor);
  }

  // 使用着色器程序
  useProgram(program) {
    this.currentProgram = program;
    this.gl.useProgram(program);
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