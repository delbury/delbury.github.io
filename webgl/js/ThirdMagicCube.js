import BaseCanvasWebgl from './BaseCanvasWebgl.js';
import Cube from './Cube.js';
import * as tools from './tools.js';
import { Matrix4, Vector4 } from '../libs/cuon-matrix.js';

// 魔方方向：上 下 左 右 前 后
// 魔方颜色：黄 白 红 橙 绿 蓝
const CUBE_COLORS = {
  top: [1, 1, 0],
  bottom: [1, 1, 1],
  left: [1, 0, 0],
  right: [1, 0.502, 0],
  front: [0, 1, 0],
  back: [0, 0, 1],
}
export default class ThirdMagicCube extends BaseCanvasWebgl {
  #vSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;

    varying vec4 v_Color;

    void main() {
      gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;
      v_Color = a_Color;
    }
  `;
  #fSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    varying vec4 v_Color;

    void main() {
      gl_FragColor = v_Color;
    }
  `;
  constructor(canvas, params) {
    super(canvas, params);
    // 创建 program
    this.programs.set(
      'cube',
      tools.createProgram(this.gl, this.#vSource, this.#fSource)
    );
    // 设置当前的 program
    this.useProgram(this.programs.get('cube'));
    this.locs = tools.getLocations(this.gl, this.currentProgram, {
      attrs: [
        'a_Position', 
        'a_Color', 
      ],
      unifs: [
        'u_ModelMatrix', 
        'u_ViewMatrix', 
      ],
    });
    this.cubes = this.createCubes();
    this.init();
  }

  draw() {
    this.clear();
    this.setModelMatrix(); // 计算模型矩阵

    for(let i = 0; i < this.cubes.length; i++) {
      const cube = this.cubes[i];
      tools.useArrayBuffer(this.gl, this.locs.attrs.a_Position, cube.buffers.verticeBuffer);
      tools.useArrayBuffer(this.gl, this.locs.attrs.a_Color, cube.buffers.colorBuffer);
      tools.useElementBuffer(this.gl, cube.buffers.indexBuffer);
      this.gl.drawElements(this.gl.TRIANGLES, cube.count, cube.buffers.indexBuffer.type, 0);
    }
  }

  // 创建立方体
  createCubes(size = 1, order = 3) {
    if(order < 2) return;

    const { left, right, top, bottom, front, back } = CUBE_COLORS;
    const cubes = [];
    const stepOffset = (order % 2 === 0) ? (size / 2) : 0; // 偶数阶数需要额外的位移量
    const half = Math.floor(order / 2); // 阶数的一半
    const start = -half, end = order - half;
    const isOdd = (order % 2 === 1); // 是否是奇数阶，若为偶数阶，则 >= 0 的正方向偏移，< 0 的负方向偏移
    const dd = (k) => isOdd ? k * size : k >= 0 ? k * size + stepOffset : (k + 1) * size - stepOffset;

    let dx = 0, dy = 0, dz = 0; // 偏移量
    for(let k = start; k < end; k++) {
      // y 轴
      dy = dd(k);

      for(let j = start; j < end; j++) {
        // x 轴
        dx = dd(j);

        for(let i = start; i < end; i++) {
          // z 轴
          dz = dd(i);
          
          cubes.push(new Cube(this.gl, { size: 1, offset: [dx, dy, dz] }));
        }
      }
    }

    return cubes;
  }

  // 初始化视图、模型参数
  // @override
  initParams() {
    // 模型参数
    this.modelParams = {
      // 绕视图的 x, y 轴旋转
      rotateX: 0, // 绕 x 轴旋转角度
      rotateXDir: [...BaseCanvasWebgl.X_DIR.slice(0, 3)], // 绕 x 轴旋转轴向量
      rotateY: 0, // 绕 y 轴旋转角度
      rotateYDir: [...BaseCanvasWebgl.Y_DIR.slice(0, 3)], // 绕 y 轴旋转轴向量
      translate: [0, 0, 0], // 平移距离
      scale: [1, 1, 1], // 缩放系数
    };
    // 视图参数
    this.viewParams = {
      perspective: [30, this.width / this.height, 1, 100], // 投影参数
      lookAtFrom: [3, 3, 15], // 摄像机位置
      lookAtTo: [0, 0, 0], // 摄像机观察点
      lookAtDir: [0, 1, 0], // 摄像机正方向
    };
  }

  // 初始化矩阵变量
  // @override
  initMatrixs() {
    this.viewMatrix = new Matrix4(); // 视图矩阵
    this.modelMatrix = new Matrix4(); // 模型矩阵

    this.modelRotateMatrix = new Matrix4(); // 模型旋转矩阵
    // this.modelRotateMatrix.setRotate(this.modelParams.rotateX, ...this.modelParams.rotateXDir); // 绕 x 轴旋转
    // this.modelRotateMatrix.rotate(this.modelParams.rotateY, ...this.modelParams.rotateYDir); // 绕 y 轴旋转

    this.tempRotateMatrix = null; // 旋转开始前的旋转矩阵
    this.tempMatrix = new Matrix4(); // 临时矩阵
  }

  // 初始化数据
  // @override
  initData() {
    this.setViewMatrix();

    this.draw();
  }

  // 设置视图矩阵
  setViewMatrix() {
    this.viewMatrix.setPerspective(...this.viewParams.perspective);
    this.viewMatrix.lookAt(
      ...this.viewParams.lookAtFrom,
      ...this.viewParams.lookAtTo,
      ...this.viewParams.lookAtDir,
    );

    this.gl.uniformMatrix4fv(this.locs.unifs.u_ViewMatrix, false, this.viewMatrix.elements);
  }

  // 设置模型矩阵
  setModelMatrix() {
    this.modelMatrix.setTranslate(...this.modelParams.translate);
    this.modelMatrix.multiply(this.currentRotateMatrix);
    this.modelMatrix.scale(...this.modelParams.scale);

    this.gl.uniformMatrix4fv(this.locs.unifs.u_ModelMatrix, false, this.modelMatrix.elements);
  }

  // 当前使用的旋转矩阵
  get currentRotateMatrix() {
    return this.tempRotateMatrix ? this.tempRotateMatrix : this.modelRotateMatrix;
  }
}