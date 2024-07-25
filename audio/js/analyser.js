import { BaseCanvas } from './analyser/BaseCanvas.js';
import { AudioPlayer } from './analyser/AudioPlayer.js';
import * as dsp from '../../assets/sdk/dsp.js';
import FFT from '../../assets/sdk/fft.js';

export class AudioAnalyser {
  constructor(options = {}) {
    this.player = null;
    this.timeChart = null;
    this.freqChart = null;
    this.running = false;
    this.fileRunnable = false;
    this.options = {
      isDrawTime: true,
      drawTimeType: 'byte',
      isDrawFreq: true,
      drawFreqType: 'byte',
      fftSize: 2048 * 16,
      maxDecibels: 0,
      minDecibels: -100,
      smoothingTimeConstant: 0.8,
      sampleRate: 48000,
      drawOverTimeChart: false,
      scaleX: 1,
      ...options,
    };
  }

  // 初始化
  initCharts({ freqCanvas, timeCanvas, overtimeCanvas } = {}) {
    timeCanvas ? this.createTimeChart(timeCanvas, { scalable: true, waveType: 'time' }) : null;
    freqCanvas
      ? this.createFreqChart(
          freqCanvas,
          { scalable: true, waveType: 'freq', autoSaveKey: 'freq' },
          { scaleX: this.options.scaleX }
        )
      : null;
    overtimeCanvas ? this.createOvertimeChart(overtimeCanvas, { waveType: 'over-time' }) : null;

    this.createAudioPlayer();
  }

  // 绑定音频播放器实例
  createAudioPlayer() {
    this.player = new AudioPlayer({
      onended: () => {
        this.running = false;
        // this.timeChart && this.timeChart.clearData()
        // this.freqChart && this.freqChart.clearData()
        this.options.onendedCallback && this.options.onendedCallback(); // 播放结束回调
      },
      onendedOsc: () => {
        this.running = false;
        this.options.onendedOscCallback();
      },
      analyser: {
        maxDecibels: this.options.maxDecibels,
        minDecibels: this.options.minDecibels,
        fftSize: this.options.fftSize,
        smoothingTimeConstant: this.options.smoothingTimeConstant,
      }, // 分析器参数
      sampleRate: this.options.sampleRate,
      getNodes: this.options.getNodes,
    });
  }

  // 绑定波形时间累计图
  createOvertimeChart(canvasEle, params, state) {
    const thek = 1;
    this.overtimeChart = new BaseCanvas(canvasEle, params, state);
    this.overtimeChart.saveCoordinateParams(
      { min: -thek, max: thek, showText: true, offset: 28 },
      { min: 0, max: 100, offset: 28 }
    );
  }

  // 绑定频谱图图表
  createFreqChart(canvasEle, params, state) {
    this.freqChart = new BaseCanvas(canvasEle, params, state);
    this.freqChart.saveCoordinateParams(
      { min: this.options.minDecibels, max: this.options.maxDecibels, offset: 15, showText: true },
      { min: 0, max: this.options.sampleRate / 2, offset: 28, showText: true }
    );
  }

  // 绑定时域波形分析图图表
  createTimeChart(canvasEle, params) {
    const thek = 1;
    this.timeChart = new BaseCanvas(canvasEle, params);
    this.timeChart.saveCoordinateParams(
      { min: -thek, max: thek, showText: true, offset: 10 },
      { min: 0, max: 100, offset: 28 }
    );
  }

  // 计算有效峰值
  calcPeaks(arr, itemFormatter) {
    const peaks = [];
    for (let i = 0; i < arr.length; i++) {
      const diffLeft = arr[i] - (arr[i - 1] ?? -Infinity);
      const diffRight = arr[i] - (arr[i + 1] ?? -Infinity);

      let type = '';
      if (diffLeft >= 0 && diffRight > 0) {
        // 山峰
        type = 'top';
      } else if ((diffLeft <= 0 && diffRight < 0) || (diffLeft < 0 && diffRight <= 0)) {
        // 山谷
        type = 'bottom';
      } else {
        continue;
      }
      peaks.push(itemFormatter(type, i));
    }
    // 计算频谱分布
    const freqs = [];
    for (let i = 0; i < peaks.length; i++) {}
    return peaks;
  }

  // 计算 fft
  calcFFT() {
    if (!this.timeChart.state.currentData) return;

    const inputData = this.timeChart.state.currentData;
    const fftSize = this.options.fftSize;
    const bufferSize = fftSize / 2;

    const rate = this.options.sampleRate;
    const fft = new dsp.FFT(bufferSize, rate);
    fft.forward(inputData);

    // 计算峰值
    const amps = [];
    for (let i = 0; i < bufferSize; i++) {
      amps.push(Math.sqrt(fft.real[i] ** 2 + fft.imag[i] ** 2));
    }
    const peaks = this.calcPeaks(amps, (type, index) => ({
      type,
      index,
      freq: index * fft.bandwidth,
      amp: amps[index],
    }));

    console.log(peaks);
    console.log('another');
    console.log(fft);
    console.log('real', fft.real);
    console.log('imag', fft.imag);
    console.log('peak', peaks);
  }

  // 播放
  start(type, params) {
    if ((this.fileRunnable && type === 'file') || type === 'osc') {
      this.running = true;
      this.player.start(type, params);
      this.timeChart && this.timeChart.start();
      this.freqChart && this.freqChart.start();
      this.overtimeChart && this.overtimeChart.start(), this.overtimeChart.setStartTime(this.player.actx.currentTime);
      this.tick();
    }
  }
  setOverTimeEnable(flag) {
    this.options.drawOverTimeChart = flag;
  }

  // 停止
  stop() {
    this.running = false;
    this.setOverTimeEnable(false);
    this.player && this.player.stop();
  }

  // 传入文件
  async setAudioBuffer(file) {
    this.fileRunnable = false;
    await this.player.setAudioBuffer(file);
    this.fileRunnable = true;
  }

  // 每一帧
  tick() {
    requestAnimationFrame(() => {
      // 获取时域数据
      if (this.options.isDrawTime && this.player.analyser) {
        const timeData = this.player.getAnalyserData('time', this.options.drawTimeType);
        const backup = timeData.constructor === Uint8Array ? new Uint8Array(timeData) : new Float32Array(timeData);
        this.timeChart.drawTimeWave(backup);

        // 累积图
        this.options.drawOverTimeChart && this.overtimeChart.drawTimeWaveOverTime(backup, this.player.actx.currentTime);
      }

      // 获取频域数据
      if (this.options.isDrawFreq && this.player.analyser) {
        const freqData = this.player.getAnalyserData('freq', this.options.drawFreqType);
        const backup = freqData.constructor === Uint8Array ? new Uint8Array(freqData) : new Float32Array(freqData);
        this.freqChart.drawFreqWave(backup, this.player.analyser.maxDecibels, this.player.analyser.minDecibels);
        // this.freqData = freqData
      }

      if (this.running) {
        return this.tick();
      } else {
        this.timeChart?.stop();
        this.freqChart?.stop();
        this.overtimeChart?.stop();
        this.overtimeChart?.afterDrawTimeWaveOverTime();
      }
    });
  }
}
