const SIGMA = 1.5;
const RADIUS = .5;

self.onmessage = ev => {
  // const { data: datas, rows, cols, type } = ev.data;
  let imgd = null;
  // if(type === 'blur') {
  const startTime = Date.now();
  // gaussianBlur({ datas, rows, cols });
  imgd = otherGaussBlur(ev.data, RADIUS, SIGMA);
  const endTime = Date.now();
  console.log('spend time: ', endTime - startTime);
  // }
  self.postMessage(imgd);
  self.close();
}

// 计算高斯模糊
function gaussianBlur({ datas, rows, cols }) {
  // const rows = canvas.heigt;
  // const cols = canvas.width;
  const coords = getCoords(...[0, 0]);
  const weights = getWeights(...[0, 0], coords);
  for(let j = 0; j < rows; j++) {
    for(let i = 0; i < cols; i++) {
      const xy = [i, j];
      const arr = getValueArr({ datas, coords, weights, rows, cols });
      const index = getIndex(...xy, cols);
      [datas[index], datas[index + 1], datas[index + 2]] = arr;
    }
  }
}

// 根据权重计算中心点的值
function getValueArr({ datas, coords, weights, rows, cols }) {
  let sum = [0, 0, 0];
  coords.map((item, index) => {
    let [x, y] = item;
    const dataArr = getDataByXY({ datas, xy: [x, y], rows, cols });
    sum[0] += dataArr[0] * weights[index];
    sum[1] += dataArr[1] * weights[index];
    sum[2] += dataArr[2] * weights[index];
  });
  return sum;
}

// 根据坐标返回数据
function getDataByXY({datas, xy: [x, y], rows, cols}) {
  if(x < 0) {
    x = 0;
  } else if(x > cols - 1) {
    x = cols - 1
  }
  if(y < 0) {
    y = 0;
  } else if(y > rows - 1) {
    y = rows - 1
  }

  // 二维坐标计算成一维坐标
  const index = getIndex(x, y, cols);
  return [datas[index], datas[index + 1], datas[index + 2]];
}

function getIndex(x, y, cols) {
  return (x + y * cols) * 4;
}

// 根据坐标计算权重
function getWeights(x0, y0, coords) {
  let sum = 0;
  const arr = coords.map(item => {
    const [x, y] = item;
    const weight = gaussian(x - x0, y - y0);
    sum += weight;
    return weight;
  });
  return arr.map(item => item / sum);
}

// 计算坐标
function getCoords(x0, y0, r = 1) {
  r = RADIUS;
  const arr = [];
  for(let j = y0 - r, jl = y0 + r; j <= jl; j++ ) {
    for(let i = x0 - r, il = x0 + r; i <= il; i++) {
      arr.push([i, j]);
    }
  }
  return arr;
}

// 平面高斯函数
function gaussian(x, y, sigma = 1.5) {
  sigma = SIGMA;
  const k = 2 * sigma ** 2;
  return 1 / (k * Math.PI ) * Math.exp(-(x ** 2 + y ** 2) / k);
}

function otherGaussBlur(imgData, radius, sigma) {
  let pixes = imgData.data;
  let width = imgData.width;
  let height = imgData.height;
  let gaussMatrix = [],
      gaussSum = 0,
      x, y,
      r, g, b, a,
      i, j, k, len;


  radius = Math.floor(radius) || 3;
  sigma = sigma || radius / 3;

  a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  b = -1 / (2 * sigma * sigma);
  //生成高斯矩阵
  for (i = 0, x = -radius; x <= radius; x++, i++){
    g = a * Math.exp(b * x * x);
    gaussMatrix[i] = g;
    gaussSum += g;
  }
  //归一化, 保证高斯矩阵的值在[0,1]之间
  for (i = 0, len = gaussMatrix.length; i < len; i++) {
      gaussMatrix[i] /= gaussSum;
  }
  //x 方向一维高斯运算
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for(j = -radius; j <= radius; j++){
        k = x + j;
        if(k >= 0 && k < width){//确保 k 没超出 x 的范围
          //r,g,b,a 四个一组
          i = (y * width + k) * 4;
          r += pixes[i] * gaussMatrix[j + radius];
          g += pixes[i + 1] * gaussMatrix[j + radius];
          b += pixes[i + 2] * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      i = (y * width + x) * 4;
      // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
      // console.log(gaussSum)
      pixes[i] = r / gaussSum;
      pixes[i + 1] = g / gaussSum;
      pixes[i + 2] = b / gaussSum;
      // pixes[i + 3] = a ;
    }
  }
  //y 方向一维高斯运算
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for(j = -radius; j <= radius; j++){
        k = y + j;
        if(k >= 0 && k < height){//确保 k 没超出 y 的范围
          i = (k * width + x) * 4;
          r += pixes[i] * gaussMatrix[j + radius];
          g += pixes[i + 1] * gaussMatrix[j + radius];
          b += pixes[i + 2] * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      i = (y * width + x) * 4;
      pixes[i] = r / gaussSum;
      pixes[i + 1] = g / gaussSum;
      pixes[i + 2] = b / gaussSum;
      // pixes[i] = r ;
      // pixes[i + 1] = g ;
      // pixes[i + 2] = b ;
      // pixes[i + 3] = a ;
    }
  }
  //end
  imgData.data = pixes;
  return imgData;
}