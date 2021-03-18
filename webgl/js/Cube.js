import * as tools from './tools.js';

// 顶点坐标
const vertices = new Float32Array([
  1, 1, 1, -1, 1, 1,-1, -1, 1, 1, -1, 1, // 前 0, 1, 2, 3
  1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, // 右 0, 3, 4, 5
  1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, // 上 0, 5, 6, 1
  -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, // 左 1, 6, 7, 2
  -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, // 下 7, 4, 3, 2
  1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, // 后 4, 7, 6, 5
]);

// 对应纹理坐标
const textureCoords = new Float32Array([
  1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
  0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
  1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
  1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
  0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
  0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
]);

// 顶点法向量
const normals = new Float32Array([
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
]);

// 顶点颜色
const colors = new Float32Array([
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
]);

// 索引值
const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, // 前
  4, 5, 6, 4, 6, 7, // 右
  8, 9, 10, 8, 10, 11, // 上
  12, 13, 14, 12, 14, 15, // 左
  16, 17, 18, 16, 18, 19, // 下
  20, 21, 22, 20, 22, 23, // 后
]);

// 用于判断选中面的颜色值
const faces = new Uint8Array([
  1, 1, 1, 1,
  2, 2, 2, 2,
  3, 3, 3, 3,
  4, 4, 4, 4,
  5, 5, 5, 5,
  6, 6, 6, 6,
]);

const arrays = {
  vertices,
  textureCoords,
  colors,
  normals,
  faces,
  indices,
};

export default class Cube {
  // 顶点颜色
  #colors = arrays.colors;
  constructor(gl, image) {
    if(!(gl instanceof WebGL2RenderingContext) && !(gl instanceof WebGLRenderingContext)) {
      throw new TypeError('param[0] is not a Webgl or Webgl2 rendering context');
    }

    this.gl = gl;
    this.setColors(); // 设置颜色
    this.buffers = this.createBuffers();
    this.texture = this.createTexture(image);
    this.count = indices.length;
  }

  // 设置立方体颜色
  // 3 个为一组，4 组为一个面
  setColors() {
    const arr = [];
    for(let i = 0; i < 6; i++) {
      for(let j = 0; j < 4; j++) {
        arr.push(0.5, 0.5, 0.5);
      }
    }

    this.#colors = new Float32Array(arr);
  }

  // 创建所需的 buffer
  createBuffers() {
    const buffers = {
      verticeBuffer: tools.initArrayBuffer(this.gl, arrays.vertices, 3), // 顶点 buffer
      textureBuffer: tools.initArrayBuffer(this.gl, arrays.textureCoords, 2), // 纹理 buffer
      colorBuffer: tools.initArrayBuffer(this.gl, this.#colors, 3), // 顶点颜色 buffer
      normalBuffer: tools.initArrayBuffer(this.gl, arrays.normals, 3), // 顶点法向量 buffer
      faceBuffer: tools.initArrayBuffer(this.gl, arrays.faces, 1, this.gl.UNSIGNED_BYTE), // 选中面编号 buffer
      indexBuffer: tools.initElementBuffer(this.gl, arrays.indices), // 索引 buffer
    };

    return buffers;
  }

  // 创建纹理
  createTexture(image) {
    return tools.loadTexture(this.gl, image); // 创建纹理
  }
}