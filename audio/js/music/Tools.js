import IRBase64 from '../../resource/IR.js';

/**
 * 音乐
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 */

function calcCenterFreq(offset = 0) {
  const arr = [];
  for (let i = 1; i <= 12; i++) {
    arr.push(440 * Math.pow(2, (i + offset - 10) / 12));
  }
  return arr;
}

// CONST_PARAMS，常量
export const CP = {
  enharmonics: (() => {
    const arr = ['C', '#C,bD', 'D', '#D,bE', 'E', 'F', '#F,bG', 'G', '#G,bA', 'A', '#A,bB', 'B'];
    const map = new Map();
    arr.forEach((item, index) => {
      item.split(',').forEach((it) => {
        map.set(it, index);
      });
    });
    return map;
  })(), // 音符名
  numberNotes: (() => {
    const arr = ['1', '#1,b2', '2', '#2,b3', '3', '4', '#4,b5', '5', '#5,b6', '6', '#6,b7', '7'];
    const map = new Map();
    arr.forEach((item, index) => {
      item.split(',').forEach((it) => {
        map.set(it, index);
      });
    });
    return map;
  })(), // 简谱
  middles: calcCenterFreq(), // 中央组的音调，C4 ~ B4
  middleLevel: 4,
  IR: null,
  regs: {
    space: /\s+/,
    num: /(\d+)/,
    float: /^[0-9.]$/,
    simple: /(^[#b]?\d{1})/,
  }, // 正则表达式
};

// 工具类
export class Tools {
  // 创建自定义钢琴音色波形
  static createPianoWave(actx, dbs) {
    const amps = [];
    for (let i = dbs.length - 1; i >= 0; i--) {
      const ddb = dbs[i] - dbs[dbs.length - 1];
      amps.unshift(Math.pow(10, ddb / 10));
    }
    const LEN = dbs.length + 1;
    let real = new Float32Array(LEN);
    let imag = new Float32Array(LEN);
    for (let i in real) {
      real[i] = 0;
    }
    for (let i in imag) {
      if (i == 0) {
        imag[0] = 0;
      } else {
        imag[i] = amps[i - 1];
      }
    }
    return actx.createPeriodicWave(real, imag);
  }

  // 创建不同音高的钢琴音色波形
  static createPianoWaves(actx) {
    if (this.pianoWaves) return this.pianoWaves;

    const options = [
      {
        freq: 0,
        db: [
          -28.24, -26.67, -37.25, -43.14, -36.86, -43.53, -39.61, -46.67, -50.2, -49.8, -73.33, -56.47, -73.33, -81.96,
          -72.55,
        ],
      },
      {
        freq: 500,
        db: [-22.75, -30.2, -35.69, -50.59, -49.02, -60.39, -67.06, -91.37],
      },
      {
        freq: 1000,
        db: [-25.49, -55.29, -69.02, -93.33],
      },
    ];

    this.pianoWaves = options.map((item) => {
      return {
        freq: item.freq,
        wave: Tools.createPianoWave(actx, item.db),
      };
    });
    return this.pianoWaves;
  }

  // 计算中央组的频率
  static calcCenterFreq = calcCenterFreq;

  // 获取 IR
  static async getIR() {
    const bs = atob(IRBase64);
    const len = bs.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bs.charCodeAt(i);
    }
    CP.IR = await new AudioContext().decodeAudioData(bytes.buffer);
  }
}
