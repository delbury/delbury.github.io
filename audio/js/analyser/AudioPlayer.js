class OSCs {
  constructor(actx, params) {
    this.actx = actx;
    this._dt = 0.75;

    this.init(params);
  }

  init({ type = 'sine', frequency = 440, wave } = {}) {
    this._frequency = frequency;
    this.source = [
      this.actx.createOscillator(),
      this.actx.createOscillator(),
      this.actx.createOscillator(),
      this.actx.createOscillator(),
    ];
    this.source.forEach((osc, index) => {
      if (type === 'custom' && wave) {
        osc.setPeriodicWave(wave);
      } else {
        osc.type = type;
      }
      osc.frequency.value = frequency * Math.pow(2, index / 12);
    });
  }

  start(when) {
    when = when || this.actx.currentTime;
    this.source.forEach((osc, index) => osc.start(when + index * this._dt));
  }

  stop(when) {
    when = when || this.actx.currentTime;
    this.source.forEach((osc, index) => osc.stop(when + index * this._dt));
  }

  connect(dst) {
    this.source.forEach((osc) => osc.connect(dst));
  }

  setPeriodicWave(wave) {
    this.source.forEach((osc) => osc.setPeriodicWave(wave));
  }

  get frequency() {
    return { value: this._frequency };
  }
}

// 泛音列
const deltaK = Math.pow(2, 1 / 24);
const DBs = [
  // 1.A2
  {
    maxFreq: 27.5 * deltaK,
    db: [
      -34.9,
      -36.08,
      -34.9,
      -49.8,
      -38.82,
      -39.22,
      -47.06,
      -56.08,
      -41.57,
      -50.98,
      -37.65,
      -47.84,
      -48.63,
      -43.92,
      -43.53,
      -47.06,
      -61.57,
      -51.76,
      -60.78,
      -58.04,
      // -62.35, // 577.15,581.54
      -45.88,
      // -72.55, // 604.98,610.84
      -56.08,
      // -75.29, // 632.81,638.67
      -62.75,
      // -53.73, // 660.64,666.50
      -53.33,
      // -76.86, // 688.48,695.80
      -68.63,
      // -70.20, // 714.84,723.63
      -58.82,
      // -85.49, // 742.68,752.93
      -67.45,
      // -72.16, // 771.97,782.23
      -62.35,
      // -85.10, // 799.80,810.06
      -58.04,
      // -83.53, // 823.24,839.36
      -58.04,
      // -76.08, // 852.54,867.19
      -59.61,
      // -76.86, // 881.84,897.95 -48.24,

      // -74.12, // 911.13,927.25
      -69.8,
      -100,
      -100,
      -100 -
        // -82.35, // 1015.14,1029.79 -63.14,

        // -84.71, // 1044.43,1059.08
        72.55,
      // -92.94, // 1073.73,1088.38
      -78.04,
    ],
  },
  {
    maxFreq: 0,
    db: [
      -28.24, -26.67, -37.25, -43.14, -36.86, -43.53, -39.61, -46.67, -50.2, -49.8, -73.33, -56.47, -73.33, -81.96,
      -72.55,
    ],
  },
  {
    maxFreq: 500,
    db: [-22.75, -30.2, -35.69, -50.59, -49.02, -60.39, -67.06, -91.37],
  },
  {
    maxFreq: 1000,
    db: [-25.49, -55.29, -69.02, -93.33],
  },
];

export class AudioPlayer {
  constructor(options = {}) {
    this.options = options;

    this.init();
  }

  // 初始化
  async init() {
    this.actx = new AudioContext();
    this.source = null;
    this.gain = this.createGain();
    this.analyser = this.createAnalyser(this.options.analyser);
    this.filter = this.createFilter();
    this.shaper = this.createShaper();

    // 使用外部节点
    if (!this.options.getNodes) {
      this.gain
        // .connect(this.shaper)
        .connect(this.filter)
        .connect(this.analyser)
        .connect(this.actx.destination);
      this.createCustomWaves(DBs);
    }
  }

  // 传入音频文件
  async setAudioBuffer(file) {
    if (!/^audio/.test(file.type)) {
      throw new Error('传入必须为音频文件');
    }
    this.audioBuffer = await this.decodeFile(file);
  }

  // 解析音频文件
  async decodeFile(file) {
    const arraybuffer = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsArrayBuffer(file);
    });
    const audiobuffer = await this.actx.decodeAudioData(arraybuffer);
    return audiobuffer;
  }

  // 创建源节点
  createSource(ab) {
    const source = this.actx.createBufferSource();
    source.buffer = ab;
    return source;
  }

  // 创建自定义波形
  createCustomWaves(dbs) {
    this.customWaves = dbs.map((item) => {
      return {
        maxFreq: item.maxFreq,
        wave: this.actx.createPeriodicWave(...this.calcRealAndImag(item.db)),
      };
    });
  }

  // 创建振荡器
  createOsc({ type = 'sine', frequency = 440 } = {}) {
    const source = this.actx.createOscillator();
    if (type === 'custom') {
      source.setPeriodicWave(this.customWaves[0].wave);
    } else {
      source.type = type;
    }
    source.frequency.value = frequency;
    return source;

    // if(dbs) {
    //   this.customWaves = dbs.map(item => {
    //     return {
    //       freq: item.freq,
    //       wave: this.actx.createPeriodicWave(...this.calcRealAndImag(item.db))
    //     }
    //   })
    // }
    // return new OSCs(this.actx, { type, frequency, wave: this.customWaves[0].wave })
  }

  calcRealAndImag() {
    const arr = [
      [0, 0],
      [0, 1],
      // [0, 1],
      // [0, 1]
    ];
    const len = arr.length;
    const real = new Float32Array(len);
    const imag = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      real[i] = arr[i][0];
      imag[i] = arr[i][1];
    }
    return [real, imag];
  }

  // 将 db 数组计算为自定义波形的实部和虚部
  _calcRealAndImag(dbs) {
    const amps = [];
    for (let i = dbs.length - 1; i >= 0; i--) {
      const ddb = dbs[i] - dbs[dbs.length - 1];
      // amps.unshift(Math.pow(10, ddb / 10))
      amps.unshift(Math.pow(10, ddb / 20));
    }
    const LEN = dbs.length + 1;
    const real = new Float32Array(LEN);
    const imag = new Float32Array(LEN);

    for (let i = 0; i < LEN; i++) {
      if (i == 0) {
        imag[0] = 0;
        real[i] = 0;
      } else {
        imag[i] = amps[i - 1];
        real[i] = 0;
      }
    }

    return [real, imag];
    // return [imag, real]
  }

  // 创建畸变器
  createShaper(k = 15) {
    const shaper = this.actx.createWaveShaper();
    shaper.oversample = 'none';

    const rate = this.options.sampleRate || 48000;
    const curve = new Float32Array(rate);
    const deg = Math.PI / 180;
    for (let i = 0; i < rate; i++) {
      const x = (i * 2) / rate - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    shaper.curve = curve;

    return shaper;
  }

  // 创建滤波节点
  createFilter() {
    const filter = this.actx.createBiquadFilter();
    filter.frequency.value = 24000;
    filter.type = 'lowpass';
    return filter;
  }

  // 创建增益节点
  createGain(val = 1) {
    const gainNode = this.actx.createGain();
    gainNode.gain.value = val;
    return gainNode;
  }

  // 设置增益
  setGain(val) {
    this._gainValue = val;
    this.gain.gain.linearRampToValueAtTime(val, this.actx.currentTime + 0.01);
  }

  // 创建分析节点
  createAnalyser({ fftSize = 2048, minDecibels = -100, maxDecibels = -30, smoothingTimeConstant = 0.8 } = {}) {
    const analyser = this.actx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    return analyser;
  }

  // 获取分析数据
  getAnalyserData(domain = 'freq', type = 'byte') {
    if (!this.analyser) {
      return false;
    }
    if (!this.analyserBuffer) {
      if (type === 'byte') {
        this.analyserBuffer = new Uint8Array(this.analyser.frequencyBinCount);
      } else if (type === 'freq') {
        this.analyserBuffer = new Float32Array(this.analyser.frequencyBinCount);
      }
    }
    if (domain === 'freq') {
      if (type === 'byte') {
        this.analyser.getByteFrequencyData(this.analyserBuffer);
      } else if (type === 'float') {
        this.analyser.getFloatFrequencyData(this.analyserBuffer);
      }
    } else if (domain === 'time') {
      if (type === 'byte') {
        this.analyser.getByteTimeDomainData(this.analyserBuffer);
      } else if (type === 'float') {
        this.analyser.getFloatTimeDomainData(this.analyserBuffer);
      }
    }

    return this.analyserBuffer;
  }

  // 播放
  start(type, params) {
    this.stop();
    // 外部节点
    if (this.options.getNodes && typeof this.options.getNodes === 'function') {
      const nodes = this.options.getNodes(this.actx);
      this._outerNodes = nodes;
      nodes.lastNode.connect(this.analyser).connect(this.actx.destination);
      nodes.play();
      return;
    }

    if (type === 'file' && !this.audioBuffer) {
      return;
    }
    if (type === 'file') {
      this.source = this.createSource(this.audioBuffer);
      this.source.onended = () => {
        this.source.disconnect();
        this.source = null;
        this.options.onended && this.options.onended();
      };
    } else if (type === 'osc') {
      this.source = this.createOsc(params);
      this.source.onended = () => {
        this.source.disconnect();
        this.source = null;
        this.options.onendedOsc && this.options.onendedOsc();
      };
    }
    this.source.connect(this.gain);
    this.source.start();

    if (type === 'osc' && this.source) {
      // this.filter.type = 'lowpass'
      // this.filter.frequency.setValueAtTime(
      //   this.source.frequency.value * 15,
      //   this.actx.currentTime
      // )
      // this.filter.frequency.setTargetAtTime(
      //   this.source.frequency.value * 3,
      //   this.actx.currentTime + 0.2,
      //   0.5
      // )
      // this.filter.Q.value = 1

      if (false) {
        this.gain.gain.setValueAtTime(0, this.actx.currentTime);
        this.gain.gain.setTargetAtTime(this._gainValue, this.actx.currentTime, 0.001);
        this.gain.gain.setTargetAtTime(0, this.actx.currentTime + 0.1, 2);
        this.gain.gain.setTargetAtTime(0, this.actx.currentTime + 0.6, 0.3);
      }

      const dt = 0.5;
      const f1 = 220;
      const f2 = 0;

      // this.gain.gain.setValueAtTime(this._gainValue, this.actx.currentTime)
      for (let i = 0; i < 6; i++) {
        // this.gain.gain.linearRampToValueAtTime(this._gainValue, this.actx.currentTime + i * dt + 0.01)
        this.gain.gain.setValueCurveAtTime([0, this._gainValue], this.actx.currentTime + i * dt, 0.01);
        this.source.frequency.setValueAtTime(f1, this.actx.currentTime + i * dt);

        this.source.frequency.setValueAtTime(f2, this.actx.currentTime + (i + 0.5) * dt);
        this.gain.gain.setValueCurveAtTime([this._gainValue, 0], this.actx.currentTime + (i + 0.5) * dt - 0.01, 0.01);
        // this.gain.gain.setValueAtTime(0, this.actx.currentTime + (i + 0.5) * dt)
      }

      this.source.stop(this.actx.currentTime + 8 * dt);
    }
  }

  // 停止
  stop() {
    if (this._outerNodes) {
      this._outerNodes.stop();
      this._outerNodes = null;
    }

    if (this.source) {
      this.source.stop();
    }
  }
}
