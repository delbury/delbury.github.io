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

// 面 => 法向量 map
const FACE_NORMAL = new Map([
  [1, BaseCanvasWebgl.Z_DIR],
  [2, BaseCanvasWebgl.X_DIR],
  [3, BaseCanvasWebgl.Y_DIR],
  [4, BaseCanvasWebgl.X_DIR_REVERSE],
  [5, BaseCanvasWebgl.Y_DIR_REVERSE],
  [6, BaseCanvasWebgl.Z_DIR_REVERSE],
]);

// 法向量 => 面 map
const NORMAL_FACE = new Map();
for(let [key, val] of FACE_NORMAL.entries()) {
  NORMAL_FACE.set(val.join(','), key);
}

// 每个面旋转的状态转移
// const statesX = new tools.DoubleCircularLinkedList([1, 5, 6, 3]);
// const statesY = new tools.DoubleCircularLinkedList([1, 2, 6, 4]);
// const statesZ = new tools.DoubleCircularLinkedList([2, 3, 4, 5]);
// const STATES = [statesX, statesY, statesZ];
export default class MagicCube extends BaseCanvasWebgl {
  #vSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute float a_Face; // 表面编号
    attribute float a_Id; // 立方体编号

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;

    varying vec4 v_Color;
    varying float v_Face;
    varying float v_Id;

    void main() {
      gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;
      v_Color = a_Color;
      v_Face = a_Face;
      v_Id = a_Id;
    }
  `;
  #fSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform bool u_IsJudging; // 是否处于判断选中面的模式
    uniform int u_PickedFace; // 被选中的表面编号
    uniform int u_PickedCube; // 被选中的立方体编号

    varying vec4 v_Color;
    varying float v_Face;
    varying float v_Id;

    void main() {
      if(u_IsJudging) {
        gl_FragColor = vec4(v_Id / 255.0, 0.0, v_Face / 255.0, 1.0); // 判断时，选中面设置为不同颜色分量

      } else {
        vec4 color = v_Color;
        if(u_PickedFace > 0 && u_PickedFace == int(v_Face) && u_PickedCube == int(v_Id)) {
          color *= vec4(vec3(0.5), 1.0);
        }
        gl_FragColor = color;
      }
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
        'a_Face',
        'a_Id',
      ],
      unifs: [
        'u_ModelMatrix', 
        'u_ViewMatrix', 
        'u_IsJudging',
        'u_PickedFace',
        'u_PickedCube',
      ],
    });
    this.cubePositionIdMap = new Map(); // 立方体位置 => id
    this.cubeIdPositionMap = new Map(); // 立方体 id => 位置
    this.commonCube = new Cube(this.gl, {
      defaultColor: Array(3).fill(0.15),
    }, {
      verticeFlag: false,
      colorFlag: false,
      defaultColorFlag: true,
      indexFlag: true,
      textureFlag: true,
      normalFlag: true,
      faceFlag: true,
      borderColorFlag: true,
      borderIndexFlag: true,
    });
    this.currentPlainCubeIds = new Set(); // 当前旋转的立方体 id 列表
    this.cubes = this.createCubes();
    this.init();
  }

  changeOrder(size, order) {
    if(this._rotatePlainAnimating) return;
    this.cubes = this.createCubes(size, order);
    this.draw();
  }

  // 开始 webgl 的部分功能特性
  // @override
  enableFuncs() {
    this.gl.enable(this.gl.DEPTH_TEST); // 开启隐面消除
    this.gl.enable(this.gl.CULL_FACE); // 开启背面隐藏
    this.gl.enable(this.gl.POLYGON_OFFSET_FILL);
    // this.gl.enable(this.gl.BLEND); // 开启混合模式
    // this.gl.blendFunc(this.gl.SRC_COLOR, this.gl.ZERO); // 混合函数
  }

  draw(selectDraw = false) {
    this.clear();

    // 绘制所有立方体
    for(let { cube, matrix } of this.cubes.values()) {
      this.setModelMatrix(matrix); // 计算模型矩阵

      // 绑定索引
      tools.useArrayBuffer(this.gl, this.locs.attrs.a_Id, cube.buffers.idBuffer);
      tools.useElementBuffer(this.gl, this.commonCube.buffers.indexBuffer);

      // 绘制立方体底色面
      tools.useArrayBuffer(this.gl, this.locs.attrs.a_Position, cube.buffers.verticeBuffer);
      tools.useArrayBuffer(this.gl, this.locs.attrs.a_Color, this.commonCube.buffers.defaultColorBuffer);
      this.gl.polygonOffset(1, 1);
      this.gl.drawElements(this.gl.TRIANGLES, this.commonCube.count, this.commonCube.buffers.indexBuffer.type, 0);

      if(!selectDraw) {
        // 绘制立方体彩色面
        tools.useArrayBuffer(this.gl, this.locs.attrs.a_Position, cube.buffers.paddingVerticeBuffer);
        tools.useArrayBuffer(this.gl, this.locs.attrs.a_Color, cube.buffers.colorBuffer);
        this.gl.polygonOffset(0, 0);
        this.gl.drawElements(this.gl.TRIANGLES, this.commonCube.count, this.commonCube.buffers.indexBuffer.type, 0);
        // 绘制立方体边框
        tools.useArrayBuffer(this.gl, this.locs.attrs.a_Position, cube.buffers.verticeBuffer);
        tools.useArrayBuffer(this.gl, this.locs.attrs.a_Color, this.commonCube.buffers.borderColorBuffer);
        tools.useElementBuffer(this.gl, this.commonCube.buffers.borderIndexBuffer);
        this.gl.drawElements(this.gl.LINES, this.commonCube.borderCount, this.commonCube.buffers.borderIndexBuffer.type, 0);
      }
    }
  }

  // 判断是否选中，并高亮选中面
  select(offsetX, offsetY) {
    if(this._rotatePlainAnimating) {
      return;
    }
    let selected = false;

    this.gl.uniform1i(this.locs.unifs.u_IsJudging, true);
    this.draw(true);

    const pickColor = new Uint8Array(4);
    const x = offsetX;
    const y = this.height - offsetY;
    this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pickColor);
    if(pickColor[2] > 0) {
      selected = true;
      this.gl.uniform1i(this.locs.unifs.u_PickedFace, pickColor[2]);
      this.gl.uniform1i(this.locs.unifs.u_PickedCube, pickColor[0]);
      this.setRotatePlain(pickColor[0], pickColor[2]);
    }

    this.gl.uniform1i(this.locs.unifs.u_IsJudging, false);
    this.draw();

    return selected;
  }

  // 释放选中状态
  unselect() {
    this.gl.uniform1i(this.locs.unifs.u_PickedFace, 0);
    this.draw();
  }

  // 旋转，相对角度
  rotate(xdeg, ydeg) {
    if(!this.tempRotateMatrix) {
      this.tempRotateMatrix = new Matrix4(this.modelRotateMatrix);
    } else {
      this.tempRotateMatrix.set(this.modelRotateMatrix);
    }

    this._rotateX = ydeg;
    this._rotateY = xdeg;
    this.tempRotateMatrix.rotate(ydeg, ...this.modelParams.rotateXDir); // 绕 x 轴旋转
    this.tempRotateMatrix.rotate(xdeg, ...this.modelParams.rotateYDir); // 绕 y 轴旋转
    
    this.throttleDraw();
  }

  // 结束旋转
  rotateEnd() {
    if(!this.tempRotateMatrix) return;

    this.modelRotateMatrix.set(this.tempRotateMatrix);
    this.tempRotateMatrix = null;

    this.tempMatrix.set(this.modelRotateMatrix).invert(); // 计算旋转矩阵的逆矩阵
    const xdir = this.tempMatrix.multiplyVector4(new Vector4(BaseCanvasWebgl.X_DIR));
    const ydir = this.tempMatrix.multiplyVector4(new Vector4(BaseCanvasWebgl.Y_DIR));
    const zdir = this.tempMatrix.multiplyVector4(new Vector4(BaseCanvasWebgl.Z_DIR));
    this.modelParams.rotateXDir = xdir.elements.slice(0, 3);
    this.modelParams.rotateYDir = ydir.elements.slice(0, 3);
    this.modelParams.rotateZDir = zdir.elements.slice(0, 3);

    this.draw();
  }

  // 旋转回
  rotateBack() {
    if(!this._rotateBackRate) {
      this._rotateBackRate = 1;
    }
    const dx = this._rotateX * this._rotateBackRate;
    const dy = this._rotateY * this._rotateBackRate;
    this._rotateBackRate *= 0.7;

    if(!this.tempRotateMatrix) {
      this.tempRotateMatrix = new Matrix4();
    }
    this.tempRotateMatrix.setRotate(dx, ...this.modelParams.rotateXDir); // 绕 x 轴旋转
    this.tempRotateMatrix.rotate(dy, ...this.modelParams.rotateYDir); // 绕 y 轴旋转
    this.draw();

    if(Math.max(Math.abs(dx), Math.abs(dy)) < 1) {
      this._rotateBackRate = 0;
      this.tempRotateMatrix = null;
      return;
    };
    requestAnimationFrame(this.rotateBack.bind(this));
  }

  // 命令式地旋转平面
  rotatePlainCommand(axis, index, reverse) {
    return new Promise((resolve, reject) => {
      if(this._rotatePlainAnimating) return reject();
      if(this.order !== 3) return reject(); // 暂只支持三阶魔方
      const position = Array(this.order).fill(this.positionRange[1]);
      position[axis] -= index; // 计算虚拟点击方块的位置

      // 计算当前旋转面的方块坐标集合
      this.currentPlainCubeIds.clear();
      for(let i = this.positionRange[0]; i <= this.positionRange[1]; i++) {
        const pp = [];
        pp[axis] = position[axis];

        if(pp[0] === undefined) {
          pp[0] = i;
        } else if(pp[1] === undefined) {
          pp[1] = i;
        } else if(pp[2] === undefined) {
          pp[2] = i;
        }
        for(let j = this.positionRange[0]; j <= this.positionRange[1]; j++) {
          const ppp = [...pp];
          if(ppp[0] === undefined) {
            ppp[0] = j;
          } else if(ppp[1] === undefined) {
            ppp[1] = j;
          } else if(ppp[2] === undefined) {
            ppp[2] = j;
          }
          this.currentPlainCubeIds.add(this.cubePositionIdMap.get(ppp.join(',')));
        }
      }

      // 设置旋转方向
      switch(axis) {
        case 0: this._rotatePlainDir = BaseCanvasWebgl.X_DIR; break;
        case 1: this._rotatePlainDir = BaseCanvasWebgl.Y_DIR; break;
        case 2: this._rotatePlainDir = BaseCanvasWebgl.Z_DIR_REVERSE; break;
        default: break;
      }
      const dDeg = 90 * (reverse ? 1 : -1);
      // for(let id of this.currentPlainCubeIds) {
      //   const cube = this.cubes.get(id);
      //   cube.matrix.rotate(dDeg, ...cube.dirMatrix.multiplyVector4(new Vector4(this._rotatePlainDir)).elements).round();
      // }
      // this.draw();
      this._totalRotatePlainDeg = dDeg;
      this.rotatePlainTo(dDeg, () => {
        resolve();
      });
   });
  }

  // 播放一组平面旋转
  async playRotatePlains(arr) {
    for await(let { axis, index, reverse } of arr) {
      await this.rotatePlainCommand(axis, index, reverse);
    }
  }

  // 判断要旋转的平面
  setRotatePlain(cubeId, face) {
    // 获取点击的方块当前坐标
    const position = this.cubeIdPositionMap.get(cubeId).split(',');
    // 获取以该点为中心的三个平面的坐标集合
    const plains = [];
    position.forEach((pos, ind) => {
      const plain = [];
      for(let i = this.positionRange[0]; i <= this.positionRange[1]; i++) {
        const pp = [];
        pp[ind] = pos;

        if(pp[0] === undefined) {
          pp[0] = i;
        } else if(pp[1] === undefined) {
          pp[1] = i;
        } else if(pp[2] === undefined) {
          pp[2] = i;
        }
        for(let j = this.positionRange[0]; j <= this.positionRange[1]; j++) {
          const ppp = [...pp];
          if(ppp[0] === undefined) {
            ppp[0] = j;
          } else if(ppp[1] === undefined) {
            ppp[1] = j;
          } else if(ppp[2] === undefined) {
            ppp[2] = j;
          }
          plain.push(ppp.join(','));
        }
      }
      plains.push(plain);
    });
    
    this.currentPlainCubeIds.clear();
    this._willRotatePlains = plains; // 保存可能旋转的平面

    const tcube = this.cubes.get(cubeId);
    // console.log('*'.repeat(40));
    console.log('position: ', this.cubeIdPositionMap.get(cubeId));
    // console.log('selected: ', cubeId, face);
    // console.log(tcube.matrix);

    const currentFaceNormal = tcube.matrix.multiplyVector4(new Vector4(FACE_NORMAL.get(face))).elements; // 旋转过后的面法向量
    const currentFace = NORMAL_FACE.get(currentFaceNormal.join(','));
    this._currentFace = currentFace;
  }

  // 旋转平面
  rotatePlain(dx, dy) {
    if(this._rotatePlainAnimating) return; // 等待动画播放
    
    // 判断旋转的面
    if(this._willRotatePlains && !this.currentPlainCubeIds.size) {
      let dir = null;
      if(Math.abs(dx) >= Math.abs(dy)) {
        this._rotatePlainDir = BaseCanvasWebgl.Y_DIR;
        dir = 1;
      } else {
        if(this._currentFace === 1) {
          // 正面
          this._rotatePlainDir = BaseCanvasWebgl.X_DIR;
          dir = 0;
        } else if(this._currentFace === 2) {
          // 右面
          this._rotatePlainDir = BaseCanvasWebgl.Z_DIR_REVERSE;
          dir = 2;
        }
      }
      if(dir === null) return;
      this._willRotatePlains[dir].forEach(p => {
        this.currentPlainCubeIds.add(this.cubePositionIdMap.get(p));
      });
    }

    const dDeg = this._rotatePlainDir === BaseCanvasWebgl.Y_DIR ? dx : -dy; // 转动角度
    // 一次旋转中累计偏转角度
    if(this._diffRotateDeg === undefined || this._diffRotateDeg === null) {
      this._diffRotateDeg = 0;
    }
    this._diffRotateDeg += dDeg;

    // 设置自身旋转矩阵
    for(let id of this.currentPlainCubeIds) {
      const cube = this.cubes.get(id);
      cube.matrix.rotate(dDeg, ...cube.dirMatrix.multiplyVector4(new Vector4(this._rotatePlainDir)).elements);
    }
    this.throttleDraw();

    console.log(this._rotatePlainDir)
  }

  // 旋转平面结束
  rotatePlainEnd() {
    if(!this._diffRotateDeg) return;

    const reset = this._diffRotateDeg % 90;
    const resetDeg1 = reset >= 0 ? reset : reset + 90; // 需要多转动的角度，原方向逆向
    const resetDeg2 = 90 - resetDeg1; // 需要多转动的角度，原方向正向
    const deg = resetDeg1 >= resetDeg2 ? resetDeg2 : -resetDeg1; // 转到正 90 度需要多偏移的角度
    // 旋转至
    this._totalRotatePlainDeg = Math.round(this._diffRotateDeg + deg);
    this.rotatePlainTo(deg);
    this._diffRotateDeg = null;
  }

  // 旋转平面至
  rotatePlainTo(deg, cb) {
    if(this._rotatePlainAnimating && Math.abs(this._rotatePlainEndDeg) <= 0.2) {
      // 结束动画
      const ddeg = this._rotatePlainEndDeg;
      for(let id of this.currentPlainCubeIds) {
        const cube = this.cubes.get(id);
        cube.matrix.rotate(
          ddeg, 
          ...cube.dirMatrix.multiplyVector4(new Vector4(this._rotatePlainDir)).elements,
        ).round();
      }
      this.draw();

      this._rotatePlainAnimating = false;
      this._willRotatePlains = null;
      this.rotatePlainPosition(this.currentPlainCubeIds); // 旋转平面坐标
      this.currentPlainCubeIds.clear();

      cb && cb(); // 回调
      return;
    }
    if(!this._rotatePlainAnimating) {
      this._rotatePlainAnimating = true;
      this._rotatePlainEndDeg = deg;
    }
    const ddeg = this._rotatePlainEndDeg * 0.35;
    this._rotatePlainEndDeg -= ddeg;

    for(let id of this.currentPlainCubeIds) {
      const cube = this.cubes.get(id);
      cube.matrix.rotate(
        ddeg, 
        ...cube.dirMatrix.multiplyVector4(new Vector4(this._rotatePlainDir)).elements,
      );
    }
    this.draw();

    requestAnimationFrame(() => this.rotatePlainTo(null, cb));
  }

  // 旋转平面坐标
  rotatePlainPosition(ids) {
    if(this._totalRotatePlainDeg === 0) return;

    const c0 = (this.positionRange[1] + this.positionRange[0]) / 2;
    const [xIndex, yIndex] = 
      this._rotatePlainDir === BaseCanvasWebgl.Y_DIR ? [0, 2] : 
      this._rotatePlainDir === BaseCanvasWebgl.X_DIR ? [2, 1] : [0, 1];
    const td = -this._totalRotatePlainDeg / 180 * Math.PI;
    for(let id of ids) {
      const pos = this.cubeIdPositionMap.get(id).split(','); // 根据 id 获取位置
      const x = pos[xIndex];
      const y = pos[yIndex];
      const x1 = Math.round((x - c0) * Math.cos(td) - (y - c0) * Math.sin(td) + c0);
      const y1 = Math.round((x - c0) * Math.sin(td) + (y - c0) * Math.cos(td) + c0);
      pos[xIndex] = x1;
      pos[yIndex] = y1;
      // 旋转后的坐标
      const posString = pos.join(',');
      this.cubePositionIdMap.set(posString, id);
      this.cubeIdPositionMap.set(id, posString);
      
      // 设置旋转后的旋转轴旋转矩阵
      this.cubes.get(id).dirMatrix.rotate(-this._totalRotatePlainDeg, ...this._rotatePlainDir).round();
    }
  }

  // 创建立方体
  createCubes(size = 1, order = 3, { gap = 0, padding = size * 0.05 } = {}) {
    if(order < 2) return;
    this.cubePositionIdMap.clear();
    this.cubeIdPositionMap.clear();
    const cubes = new Map();
    const { left, right, top, bottom, front, back } = CUBE_COLORS;
    const half = Math.floor(order / 2); // 阶数的一半
    const start = -half, end = order - half - 1;
    const isOdd = (order % 2 === 1); // 是否是奇数阶，若为偶数阶，则 >= 0 的正方向偏移，< 0 的负方向偏移
    const stepOffset = isOdd ? 0 : (size / 2 + gap / 2); // 偶数阶数需要额外的位移量
    const dd = (k) => {
      let offset = stepOffset;

      if(!isOdd && k < 0) {
        k += 1;
        offset *= -1;
      }
      return k * size + k * gap + offset;
    };
    this.order = order; // 设置魔方阶数
    this.positionRange = [start, end]; // 坐标范围

    let dx = 0, dy = 0, dz = 0; // 偏移量
    let id = 1; // 立方体 id
    for(let k = start; k <= end; k++) {
      // y 轴
      dy = dd(k);

      for(let j = start; j <= end; j++) {
        // z 轴
        dz = dd(j);

        for(let i = start; i <= end; i++) {
          // x 轴
          dx = dd(i);
          
          const colorObj = {};
          if(k === start) colorObj.bottom = bottom;
          if(k === end) colorObj.top = top;
          if(i === start) colorObj.left = left;
          if(i === end) colorObj.right = right;
          if(j === start) colorObj.back = back;
          if(j === end) colorObj.front = front;
          const location = [i, k, j];
          cubes.set(id, {
            cube: new Cube(this.gl, {
              size: size,
              offset: [dx, dy, dz],
              colors: colorObj,
              padding: padding,
              id,
            }, {
              verticeFlag: true,
              colorFlag: true,
              paddingVerticeFlag: true,
              idFlag: true,
            }),
            id,
            matrix: new Matrix4(), // 自身的旋转矩阵
            dirMatrix: new Matrix4(), // 旋转轴的变换矩阵
          });
          const pos = location.join(',');
          this.cubePositionIdMap.set(pos, id);
          this.cubeIdPositionMap.set(id, pos);
          id++;
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
      rotateZ: 0, // 绕 y 轴旋转角度
      rotateZDir: [...BaseCanvasWebgl.Z_DIR.slice(0, 3)], // 绕 y 轴旋转轴向量
      translate: [0, 0, 0], // 平移距离
      scale: [1, 1, 1], // 缩放系数
    };
    // 视图参数
    this.viewParams = {
      perspective: [30, this.width / this.height, 1, 100], // 投影参数
      lookAtFrom: [8, 8, 12], // 摄像机位置
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
    this.tempRotateMatrix = null; // 旋转开始前的旋转矩阵
    this.tempMatrix = new Matrix4(); // 临时矩阵

    this.modelRotateMatrix.rotate(this.modelParams.rotateX, ...this.modelParams.rotateXDir);
    this.modelRotateMatrix.rotate(this.modelParams.rotateY, ...this.modelParams.rotateYDir);
    this.modelRotateMatrix.rotate(this.modelParams.rotateZ, ...this.modelParams.rotateZDir);
  }

  // 初始化数据
  // @override
  initData() {
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_Face, this.commonCube.buffers.faceBuffer);
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
  setModelMatrix(selfMatrix) {
    this.modelMatrix.setTranslate(...this.modelParams.translate);
    this.modelMatrix.multiply(this.currentRotateMatrix);
    this.modelMatrix.multiply(selfMatrix);

    this.gl.uniformMatrix4fv(this.locs.unifs.u_ModelMatrix, false, this.modelMatrix.elements);
  }

  // 当前使用的旋转矩阵
  get currentRotateMatrix() {
    return this.tempRotateMatrix ? this.tempRotateMatrix : this.modelRotateMatrix;
  }

  // 当前的 mvp 矩阵
  get currentMvpMatrix() {
    return new Matrix4(this.viewMatrix).multiply(this.modelMatrix).multiply(this.currentRotateMatrix);
  }
}