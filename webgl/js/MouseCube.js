import BaseCanvasWebgl from './BaseCanvasWebgl.js';
import Cube from './Cube.js';
import * as tools from './tools.js';
import { Matrix4, Vector4 } from '../libs/cuon-matrix.js';

export default class MouseCube extends BaseCanvasWebgl {
  #vSource = `
    attribute vec4 a_Position; // 顶点位置
    attribute vec4 a_Color; // 顶点颜色
    attribute vec4 a_Normal; // 表面法向量
    attribute vec2 a_TexCoord; // 纹理坐标
    attribute float a_Face; // 表面编号

    uniform mat4 u_ModelMatrix; // 模型矩阵
    uniform mat4 u_ViewMatrix; // 视图矩阵
    uniform mat4 u_NormalMatrix; // 法向量变换矩阵
    uniform vec3 u_ViewPoint; // 视点位置

    varying vec4 v_Color;
    varying vec3 v_Position;
    varying vec3 v_Normal;
    varying vec2 v_TexCoord;
    varying float v_Face;
    varying float v_Distance; // 距离视点的距离

    void main() {
      gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;
      v_Color = a_Color;
      v_Position = vec3(u_ModelMatrix * a_Position); // 计算顶点的世界坐标
      v_Normal = normalize(vec3(u_NormalMatrix * a_Normal)); // 法向量归一化
      v_TexCoord = a_TexCoord;
      v_Face = a_Face;
      v_Distance = distance(v_Position, u_ViewPoint);
    }
  `;
  #fSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform vec3 u_AmbientLightColor; // 环境光颜色
    uniform vec3 u_LightColor; // 光线颜色
    uniform vec3 u_LightPosition; // 光源位置
    uniform sampler2D u_Sampler; // 纹理类型
    uniform bool u_IsJudging; // 是否处于判断选中面的模式
    uniform int u_PickedFace; // 被选中的表面编号
    uniform vec4 u_FogColor; // 雾的颜色
    uniform vec2 u_FogRange; // 雾的范围

    varying vec4 v_Color;
    varying vec3 v_Position;
    varying vec3 v_Normal;
    varying vec2 v_TexCoord;
    varying float v_Face;
    varying float v_Distance;

    void main() {
      if(u_IsJudging) {
        gl_FragColor = vec4(0.0, 0.0, v_Face / 255.0, 1.0); // 判断时，选中面设置为不同颜色分量

      } else {
        vec4 color = texture2D(u_Sampler, v_TexCoord); // 计算纹理

        if(u_PickedFace > 0 && u_PickedFace == int(v_Face)) {
          // color = color * vec4(vec3(1.5), 1.0);
        } else {
          vec3 normal = normalize(v_Normal); // 法向量归一化，防止内插后不为 1.0
          vec3 lightDirection = normalize(u_LightPosition - v_Position); // 计算光线方向并归一化
          float nDotL = max(dot(lightDirection, normal), 0.0); // 光线方向和顶点法向量的点积
          vec3 diffuse = u_LightColor * v_Color.rgb * nDotL; // 计算反射光
          vec3 ambient = u_AmbientLightColor * v_Color.rgb; // 计算环境光
          vec4 lightColor = vec4(diffuse + ambient, v_Color.a); // 计算整体光照效果
          color = color * lightColor; // 计算纹理
        }

        float fogFactor = clamp((u_FogRange.y - v_Distance) / (u_FogRange.y - u_FogRange.x), 0.0, 1.0); // 雾化因子
        // fogFactor = log2(fogFactor + 1.0); // 指数雾化
        color = mix(u_FogColor, color, fogFactor);

        gl_FragColor = color;
      }
    }
  `;
  constructor(canvas, params, { image } = {}) {
    super(canvas, params);
    // 创建 program
    this.programs.set(
      'cube',
      tools.createProgram(this.gl, this.#vSource, this.#fSource)
    );
    // 设置当前的 program
    this.useProgram(this.programs.get('cube'));
    // 创建立方体 buffers
    this.cube = new Cube(this.gl, { textureImage: image });
    // 获取着色器变量
    this.locs = tools.getLocations(this.gl, this.currentProgram, {
      attrs: [
        'a_Position', 
        'a_Color', 
        'a_Normal',
        'a_TexCoord',
        'a_Face',
      ],
      unifs: [
        'u_ModelMatrix', 
        'u_ViewMatrix', 
        'u_NormalMatrix',
        'u_AmbientLightColor',
        'u_LightColor',
        'u_LightPosition',
        'u_Sampler',
        'u_IsJudging',
        'u_PickedFace',
        'u_ViewPoint',
        'u_FogColor',
        'u_FogRange',
      ],
    });
    // 初始化参数
    this.initParams();
    // 创建矩阵
    this.initMatrixs();
    // 设置变量数据
    this.initData();
  }

  // 事件，模型变换参数改变
  transformChange() {
    const translate = [...this.modelParams.translate]; // 位移分量
    const scale = [...this.modelParams.scale]; // 缩放分量

    const e = this.currentRotateMatrix.elements;
    const degy = Math.atan2(-e[2], Math.sqrt(e[0] ** 2, e[1] ** 2));
    const cosy = Math.cos(degy);
    const degz = Math.atan2(e[1] / cosy, e[0] / cosy);
    const degx = Math.atan2(e[6] / cosy, e[10] / cosy);
    const rotate = [degx, degy, degz]; // 旋转分量

    this.dispatch('transformchange', translate, scale, rotate);
  }

  // 绘制
  draw() {
    this.clear();
    this.setModelMatrix(); // 计算模型矩阵
    this.setNormalMatrix(); // 计算法向量矩阵
    this.gl.drawElements(this.gl.TRIANGLES, this.cube.count, this.cube.buffers.indexBuffer.type, 0);
    this.transformChange(); // 触发事件
  }

  // 节流绘制
  throttleDraw() {
    if(this.raqId) return; // 节流

    this.raqId = requestAnimationFrame(() => {
      this.raqId = null;
      this.draw();
    });
  }

  // 缩放
  scale(k) {
    const [kx, ky, kz] = this.modelParams.scale;
    this.modelParams.scale = [kx + k, ky + k, kz + k];
    this.draw();
  }

  // 平移
  translate(dx = 0, dy = 0, dz = 0) {
    const [ox, oy, oz] = this.modelParams.translate;
    this.modelParams.translate = [ox + dx, oy + dy, oz + dz];
    this.throttleDraw();
  }

  // 旋转，相对角度
  rotate(xdeg, ydeg) {
    if(!this.tempRotateMatrix) {
      this.tempRotateMatrix = new Matrix4(this.modelRotateMatrix);
    } else {
      this.tempRotateMatrix.set(this.modelRotateMatrix);
    }

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
    this.modelParams.rotateXDir = xdir.elements.slice(0, 3);
    this.modelParams.rotateYDir = ydir.elements.slice(0, 3);

    this.draw();
  }

  // 判断是否选中，并高亮选中面
  select(offsetX, offsetY) {
    let selected = false;

    this.setIsJudging(true);
    this.draw();

    const pickColor = new Uint8Array(4);
    const x = offsetX;
    const y = this.height - offsetY;
    this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pickColor);
    if(pickColor[2] > 0) {
      selected = true;
      this.gl.uniform1i(this.locs.unifs.u_PickedFace, pickColor[2]);
    }

    this.setIsJudging(false);
    this.draw();

    return selected;
  }

  // 释放选中状态
  unselect() {
    this.gl.uniform1i(this.locs.unifs.u_PickedFace, 0);
    this.draw();
  }

  // 初始化变量数据
  // @override
  initData() {
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_Position, this.cube.buffers.verticeBuffer);
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_Color, this.cube.buffers.colorBuffer);
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_Normal, this.cube.buffers.normalBuffer);
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_TexCoord, this.cube.buffers.textureBuffer);
    tools.useArrayBuffer(this.gl, this.locs.attrs.a_Face, this.cube.buffers.faceBuffer);
    tools.useElementBuffer(this.gl, this.cube.buffers.indexBuffer);

    this.setViewMatrix(); // 初始化视图矩阵
    this.setModelMatrix(); // 初始化模型矩阵
    this.setNormalMatrix(); // 初始化法向量矩阵
    this.setLightParams(); // 初始化光照参数
    this.setFogParams(); // 设置雾化参数

    // 应用纹理
    this.setTexture(this.cube.texture, 0);

    // 设置为非选中
    this.setIsJudging(false);

    // 绘制第一帧
    this.clear();
    this.gl.drawElements(this.gl.TRIANGLES, this.cube.count, this.cube.buffers.indexBuffer.type, 0);
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
    // 光照参数
    this.lightParams = {
      lightPosition: [0, 0, 7], // 光源位置
      lightColor: [1, 1, 1], // 光线颜色
      ambientLightColor: [0.5, 0.5, 0.5], // 环境光颜色
    };
    // 雾化参数
    this.fogParams = {
      fogColor: [0.05, 0.05, 0.05, 1.0],
      fogRange: [15, 16],
    };
    // 节流控制
    this.raqId = null;
  }

  // 初始化矩阵变量
  // @override
  initMatrixs() {
    this.viewMatrix = new Matrix4(); // 视图矩阵
    this.modelMatrix = new Matrix4(); // 模型矩阵
    this.normalMatrix = new Matrix4(); // 法向量举证

    this.modelRotateMatrix = new Matrix4(); // 模型旋转矩阵
    this.modelRotateMatrix.setRotate(this.modelParams.rotateX, ...this.modelParams.rotateXDir); // 绕 x 轴旋转
    this.modelRotateMatrix.rotate(this.modelParams.rotateY, ...this.modelParams.rotateYDir); // 绕 y 轴旋转

    this.tempRotateMatrix = null; // 旋转开始前的旋转矩阵

    this.tempMatrix = new Matrix4(); // 临时矩阵
  }

  // 设置雾化参数
  setFogParams() {
    this.gl.uniform3fv(this.locs.unifs.u_ViewPoint, this.viewParams.lookAtFrom); // 设置视点
    this.gl.uniform4fv(this.locs.unifs.u_FogColor, this.fogParams.fogColor); // 设置雾的颜色
    this.gl.uniform2fv(this.locs.unifs.u_FogRange, this.fogParams.fogRange); // 设置雾的范围
  }

  // 切换渲染模式是否为判断选中面
  setIsJudging(flag) {
    this.gl.uniform1i(this.locs.unifs.u_IsJudging, flag);
  }

  // 设置纹理
  setTexture(texture, index = 0) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.activeTexture(this.gl['TEXTURE' + index]);
    this.gl.uniform1i(this.locs.unifs.u_Sampler, index);
  }

  // 设置光源参数
  setLightParams() {
    this.gl.uniform3fv(this.locs.unifs.u_AmbientLightColor, this.lightParams.ambientLightColor); // 设置环境光颜色
    this.gl.uniform3fv(this.locs.unifs.u_LightColor, this.lightParams.lightColor); // 设置光线颜色
    this.gl.uniform3fv(this.locs.unifs.u_LightPosition, this.lightParams.lightPosition); // 设置光源位置
  }

  // 设置法向量矩阵
  setNormalMatrix() {
    this.normalMatrix.set(this.modelMatrix); // 设置为模型矩阵
    this.normalMatrix.invert().transpose(); // 模型矩阵的逆转置矩阵

    this.gl.uniformMatrix4fv(this.locs.unifs.u_NormalMatrix, false, this.normalMatrix.elements);
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