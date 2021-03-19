import * as tools from './tools.js';

// 顺序：前、右、上、左、下、后
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
// const defaultColors = Array(3 * 4 * 6).fill(0.15);

// 索引值
const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, // 前
  4, 5, 6, 4, 6, 7, // 右
  8, 9, 10, 8, 10, 11, // 上
  12, 13, 14, 12, 14, 15, // 左
  16, 17, 18, 16, 18, 19, // 下
  20, 21, 22, 20, 22, 23, // 后
]);

// 边框的索引值
const borderIndices = new Uint8Array([
  0, 1, 1, 2, 2, 3, 3, 0, // 前
  4, 5, 5, 6, 6, 7, 7, 4, // 右
  8, 9, 9, 10, 10, 11, 11, 8,// 上
  12, 13, 13, 14, 14, 15, 15, 12, // 左
  16, 17, 17, 18, 18, 19, 19, 16, // 下
  20, 21, 21, 22, 22, 23, 23, 20, // 后
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
  borderIndices,
};

export default class Cube {
  // 顶点颜色
  constructor(gl, { textureImage, size, offset, colors, padding, defaultColor, id } = {}, needBuffers) {
    if(!(gl instanceof WebGL2RenderingContext) && !(gl instanceof WebGLRenderingContext)) {
      throw new TypeError('param[0] is not a Webgl or Webgl2 rendering context');
    }

    this.gl = gl;
    this.buffers = this.createBuffers({ size, offset, colors, padding, defaultColor, id }, needBuffers);
    this.texture = this.createTexture(textureImage);
    this.count = indices.length;
    this.borderCount = borderIndices.length;
  }

  // 创建所需的 buffer
  createBuffers({
    size = 2, // 立方体大小
    offset = [0, 0, 0], // 立方体平移位置
    colors = {}, // 立方体每个面的颜色
    borderColor = [0, 0, 0], // 立方体边框颜色
    padding = 0, // 立方体的填充长度
    defaultColor = [0.8, 0.8, 0.8], // 默认顶点颜色
    id = 0, // 立方体编号
  } = {}, {
    // 需要创建的 buffer
    verticeFlag = false,
    defaultColorFlag = false,
    indexFlag = false,
    colorFlag = false,
    textureFlag = false,
    normalFlag = false,
    faceFlag = false,
    borderColorFlag = false,
    borderIndexFlag = false,
    paddingVerticeFlag = false,
    idFlag = false,
  } = {}) {
    // 格式化后的顶点位置
    const realVertices = vertices.map(v => v * size);
    if(verticeFlag) {
      for(let i = 0; i < realVertices.length; i += 3) {
        realVertices[i] += offset[0];
        realVertices[i + 1] += offset[1];
        realVertices[i + 2] += offset[2];
      }
    }

    // 格式化后的顶点颜色
    const defaultColors = [...Array(4 * 6).fill(defaultColor).flat()];
    const realColors = [...defaultColors];
    if(colorFlag) {
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
    }

    // 创建边框 buffer
    const realBorderColor = [];
    if(borderColorFlag) {
      for(let i = 0; i < borderIndices.length; i++) {
        realBorderColor.push(...borderColor);
      }
    }

    // 设置 padding
    // 顺序：前、右、上、左、下、后
    const paddingVertices = [...realVertices]; // 每个面去除了 padding 的坐标
    if(paddingVerticeFlag) {
      const setPd = (val, off = 0) => val - off > 0 ? val - padding : val + padding;
      if(padding > 0 && padding < size / 2) {
        for(let i = 0; i < paddingVertices.length; i += 12) {
          const index = i / 12; // 当前的面
          for(let j = 0; j < 12; j += 3) {
            let x = paddingVertices[i + j];
            let y = paddingVertices[i + j + 1];
            let z = paddingVertices[i + j + 2];
            switch(index) {
              // 前后面，xy
              case 0:
              case 5:
                x = setPd(x, offset[0]);
                y = setPd(y, offset[1]);
                break;
              // 上下面，xz
              case 2:
              case 4:
                x = setPd(x, offset[0]);
                z = setPd(z, offset[2]);
                break;
              // 左右面，yz
              case 1:
              case 3:
                y = setPd(y, offset[1]);
                z = setPd(z, offset[2]);
                break;
              default: break;
            }
            paddingVertices[i + j] = x;
            paddingVertices[i + j + 1] = y;
            paddingVertices[i + j + 2] = z;
          }
        }
      } else if(padding !== 0) {
        throw new RangeError('padding is out of range (0, size / 2)');
      }
    }

    // 创建 id buffer
    const idArray = [];
    if(idFlag) {
      idArray.length = faces.length;
      idArray.fill(id);
    }

    const buffers = {
      verticeBuffer: verticeFlag ? tools.initArrayBuffer(this.gl, new Float32Array(realVertices), 3) : null, // 顶点 buffer
      textureBuffer: textureFlag ? tools.initArrayBuffer(this.gl, arrays.textureCoords, 2) : null, // 纹理 buffer
      defaultColorBuffer: defaultColorFlag ? tools.initArrayBuffer(this.gl, new Float32Array(defaultColors), 3) : null, // 默认顶点颜色 buffer
      colorBuffer: colorFlag ? tools.initArrayBuffer(this.gl, new Float32Array(realColors), 3) : null, // 顶点颜色 buffer
      normalBuffer: normalFlag ? tools.initArrayBuffer(this.gl, arrays.normals, 3) : null, // 顶点法向量 buffer
      faceBuffer: faceFlag ? tools.initArrayBuffer(this.gl, arrays.faces, 1, this.gl.UNSIGNED_BYTE) : null, // 选中面编号 buffer
      indexBuffer: indexFlag ? tools.initElementBuffer(this.gl, arrays.indices) : null, // 索引 buffer
      borderColorBuffer: borderColorFlag ? tools.initArrayBuffer(this.gl, new Float32Array(realBorderColor), 3) : null, // 边框颜色 buffer
      borderIndexBuffer: borderIndexFlag ? tools.initElementBuffer(this.gl, arrays.borderIndices) : null, // 边框索引 buffer
      paddingVerticeBuffer: paddingVerticeFlag ? tools.initArrayBuffer(this.gl, new Float32Array(paddingVertices), 3) : null, // padding 顶点坐标
      idBuffer: idFlag ? tools.initArrayBuffer(this.gl, new Uint8Array(idArray), 1, this.gl.UNSIGNED_BYTE) : null, // id buffer
    };

    return buffers;
  }

  // 创建纹理
  createTexture(image) {
    return image ? tools.loadTexture(this.gl, image) : null; // 创建纹理
  }
}