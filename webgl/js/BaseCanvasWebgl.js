export default class BaseCanvasWebgl {
  constructor(canvas, params = {}) {
    if(!canvas || !(canvas instanceof HTMLCanvasElement)) throw new TypeError('param[0] is not a canvas element');
    if(params && typeof params !== 'object') throw new TypeError('param[1] is not a params object');

    const { width, height } = params;
    this.canvas = canvas;
    this.canvas.width = width ?? 800;
    this.canvas.height = height ?? 800;
    this.gl = this.canvas.getContext('webgl2') ?? this.canvas.getContext('webgl');
    this.programs = []; // 着色器程序数组
    this.currentProgram = null; // 当前使用的着色其程序数组

    if(!this.gl) throw new Error('can not get webgl context');

    // 设置参数
    this.setParams(params);
  }

  // 清除缓冲区
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  // 设置参数
  setParams({
    clearColor = [0.0, 0.0, 0.0, 1.0],
  } = {}) {
    this.gl.clearColor(...clearColor);
  }

  // canvas的宽度
  get width() {
    return this.canvas.width;
  }
  // canvas的高度
  get height() {
    return this.canvas.height;
  }

  // 变量使用 buffer
  useArrayBuffer(program, a_Attr, buffer) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(a_Attr, buffer.num, this.gl.FLOAT, false, 0, 0);
  }
  useElementBuffer(program, a_Attr, buffer) {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.vertexAttribPointer(a_Attr, buffer.num, this.gl.UNSIGNED_BYTE, false, 0, 0);
  }

  // 使用着色器程序
  useProgram(program) {
    this.currentProgram = program;
  }

  /**
   * 创建着色器对象
   * @param gl GL context
   * @param type the type of the shader object to be created
   * @param source shader program (string)
   * @return created shader object, or null if the creation has failed.
   */
  loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (shader == null) {
      console.log('unable to create shader');
      return null;
    }

    gl.shaderSource(shader, source); // 加载着色器代码
    gl.compileShader(shader); // 编译着色器

    // 检查编译状态
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      const error = gl.getShaderInfoLog(shader);
      console.log('Failed to compile shader: ' + error);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * 创建着色器程序
   * @param gl GL context
   * @param vshader a vertex shader program (string)
   * @param fshader a fragment shader program (string)
   * @return created program object, or null if the creation has failed
   */
  createProgram(gl, vshader, fshader) {
    if(!vshader || !fshader) return new TypeError('vertex or fragment shader source is empty')

    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vshader); // 顶点着色器
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fshader); // 片元着色器
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram(); // 创建程序对象
    if (!program) {
      return null;
    }

    // 附加着色器
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // 连接程序
    gl.linkProgram(program);

    // 检查连接状态
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const error = gl.getProgramInfoLog(program);
      console.log('Failed to link program: ' + error);
      gl.deleteProgram(program);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      return null;
    }
    return program;
  }
}