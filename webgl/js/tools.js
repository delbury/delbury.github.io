/**
 * 创建着色器对象
 * @param gl GL context
 * @param type the type of the shader object to be created
 * @param source shader program (string)
 * @return created shader object, or null if the creation has failed.
 */
export const loadShader = (gl, type, source) => {
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
export const createProgram = (gl, vshader, fshader) => {
  if(!vshader || !fshader) return new TypeError('vertex or fragment shader source is empty')

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader); // 顶点着色器
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader); // 片元着色器
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

// 变量使用 array buffer
export const useArrayBuffer = (gl, a_Attr, buffer) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_Attr, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_Attr);
}

// 变量使用 element array buffer
export const useElementBuffer = (gl, buffer) => {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
}

// 初始化 buffer
const initBuffer = (gl, bufferType, bufferData, bufferSize, dataType) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(bufferType, buffer);
  gl.bufferData(bufferType, bufferData, gl.STATIC_DRAW);

  buffer.num = bufferSize;
  buffer.type = dataType;

  return buffer;
}

// 初始化 array buffer
export const initArrayBuffer = (gl, data, num, type) => {
  type = type ?? gl.FLOAT;
  return initBuffer(gl, gl.ARRAY_BUFFER, data, num, type);
}

// 初始化 element array buffer
export const initElementBuffer = (gl, data, type) => {
  type = type ?? gl.UNSIGNED_BYTE;
  return initBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, data, null, type);
}

// 获取变量地址
export const getLocations = (gl, program, listObj) => {
  const result = {
    attrs: {},
    unifs: {},
  };
  if(!listObj || typeof listObj !== 'object') return null;

  const { attrs, unifs } = listObj;
  if(attrs && attrs.length) {
    attrs.forEach(attrName => result.attrs[attrName] = gl.getAttribLocation(program, attrName));
  }
  if(unifs && unifs.length) {
    unifs.forEach(attrName => result.unifs[attrName] = gl.getUniformLocation(program, attrName));
  }

  return result;
}

// 加载纹理
export const loadTexture = (gl, image) => {
  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
}

// 请求图片并创建纹理
export const createTextureBySrc = (gl, src) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = ev => resolve(loadTexture(gl, image));
    image.onerror = err => reject(err);
    image.src = src;
  });
}

// 弧度转换为角度
const r2d = (r) => Math.round(r / Math.PI * 180);
// 根据旋转矩阵计算旋转的角度
export const calcRotateByMatrix = (matrix) => {
  const e = matrix.elements;
  const degx = Math.atan2(e[6], e[10]);
  const degy = Math.atan2(-e[2], Math.sqrt(e[6] ** 2 + e[10] ** 2));
  const degz = Math.atan2(e[1], e[0]);

  const rotate = [r2d(degx), r2d(degy), r2d(degz)]; // 旋转分量
  return rotate;
}

// 双向循环链表
export class DoubleCircularLinkedList {
  constructor(arr) {
    this.head = null;
    this.size = 0;

    let p = null;
    arr.forEach(val => {
      const node = {
        val,
        next: null,
        prev: p,
      };
      if(!this.head) {
        this.head = node;
      } else {
        p.next = node;
      }
      p = node;
      this.size++;
    });
    p.next = this.head;
    this.head.prev = p;
  }

  // 查找到当前节点，与相对的节点偏移，查找到目标的节点
  getStateFromBy(from, by) {
    if(by === 0) return from;
    let node = this.head
    while(true) {
      if(node.val === from) break; // 找到当前的起始节点 
      if(node.next === this.head) return from; // 在当前状态循环中不存在
      node = node.next;
    }

    while(by) {
      if(by > 0) {
        // 前找
        node = node.next;
        by--;
      } else if(by < 0) {
        // 后找
        node = node.prev;
        by++;
      }
    }
    return node.val;
  }
};