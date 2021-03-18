import * as tools from './tools.js';

// 顶点坐标
const vertices = [
  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // 前 0, 1, 2, 3
  0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // 右 0, 3, 4, 5
  0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // 上 0, 5, 6, 1
  -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // 左 1, 6, 7, 2
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // 下 7, 4, 3, 2
  0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, // 后 4, 7, 6, 5
];

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
const defaultColors = Array(3 * 4 * 6).fill(0.5);

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

// array buffer
const arrays = {
  textureCoords,
  normals,
  faces,
  indices,
};

export default class Cube {
  // 顶点颜色
  constructor(gl, { textureImage, size, offset, colors } = {}) {
    if(!(gl instanceof WebGL2RenderingContext) && !(gl instanceof WebGLRenderingContext)) {
      throw new TypeError('param[0] is not a Webgl or Webgl2 rendering context');
    }

    this.gl = gl;
    this.buffers = this.createBuffers({ size, offset, colors });
    this.texture = this.createTexture(textureImage);
    this.count = indices.length;
  }

  // 创建所需的 buffer
  createBuffers({
    size = 2,
    offset = [0, 0, 0],
    colors = {},
  } = {}) {
    // 格式化后的顶点位置
    const realVertices = vertices.map(v => v * size);
    for(let i = 0; i < realVertices.length; i += 3) {
      realVertices[i] += offset[0];
      realVertices[i + 1] += offset[1];
      realVertices[i + 2] += offset[2];
    }

    // 格式化后的顶点颜色
    const realColors = [...defaultColors];
    // 前 右 上 左 下 后
    const colorArr = [colors.front, colors.right, colors.top, colors.left, colors.bottom, colors.back];
    for(let i = 0; i < realColors.length; i += 12) {
      const color = colorArr.shift();
      if(!color) continue;

      for(let j = 0; j < 12; j += 3) {
        realColors[i + j] = color[0];
        realColors[i + j + 1] = color[1];
        realColors[i + j + 2] = color[2];
      }
    }

    const buffers = {
      verticeBuffer: tools.initArrayBuffer(this.gl, new Float32Array(realVertices), 3), // 顶点 buffer
      textureBuffer: tools.initArrayBuffer(this.gl, arrays.textureCoords, 2), // 纹理 buffer
      colorBuffer: tools.initArrayBuffer(this.gl, new Float32Array(realColors), 3), // 顶点颜色 buffer
      normalBuffer: tools.initArrayBuffer(this.gl, arrays.normals, 3), // 顶点法向量 buffer
      faceBuffer: tools.initArrayBuffer(this.gl, arrays.faces, 1, this.gl.UNSIGNED_BYTE), // 选中面编号 buffer
      indexBuffer: tools.initElementBuffer(this.gl, arrays.indices), // 索引 buffer
    };

    return buffers;
  }

  // 创建纹理
  createTexture(image) {
    return image ? tools.loadTexture(this.gl, image) : null; // 创建纹理
  }
}