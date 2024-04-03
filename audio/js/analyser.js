import { BaseCanvas } from './analyser/BaseCanvas.js'
import { AudioPlayer } from './analyser/AudioPlayer.js'

export class AudioAnalyser {
  constructor(options = {}) {
    this.player = null
    this.timeChart = null
    this.freqChart = null
    this.running = false
    this.fileRunnable = false
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
      scaleX: 20,
      ...options
    }
  }

  // 初始化
  initCharts({ freqCanvas, timeCanvas, overtimeCanvas } = {}) {
    timeCanvas ? this.createTimeChart(timeCanvas, { scalable: true, waveType: 'time' }) : null
    freqCanvas ? this.createFreqChart(freqCanvas, { scalable: true, waveType: 'freq' }, { scaleX: this.options.scaleX }) : null
    overtimeCanvas ? this.createOvertimeChart(overtimeCanvas, { waveType: 'over-time' }) : null

    this.createAudioPlayer()
  }

  // 绑定音频播放器实例
  createAudioPlayer() {
    this.player = new AudioPlayer({
      onended: () => {
        this.running = false
        // this.timeChart && this.timeChart.clearData()
        // this.freqChart && this.freqChart.clearData()
        this.options.onendedCallback && this.options.onendedCallback() // 播放结束回调
      },
      onendedOsc: () => {
        this.running = false
        this.options.onendedOscCallback()
      },
      analyser: {
        maxDecibels: this.options.maxDecibels,
        minDecibels: this.options.minDecibels,
        fftSize: this.options.fftSize,
        smoothingTimeConstant: this.options.smoothingTimeConstant
      }, // 分析器参数
      sampleRate: this.options.sampleRate,
      getNodes: this.options.getNodes,
    })
  }

  // 绑定波形时间累计图
  createOvertimeChart(canvasEle, params, state) {
    const thek = 1
    this.overtimeChart = new BaseCanvas(canvasEle, params, state)
    this.overtimeChart.saveCoordinateParams(
      { min: -thek, max: thek, showText: true, offset: 28 },
      { min: 0, max: 100, offset: 30 }
    )
  }

  // 绑定频谱图图表
  createFreqChart(canvasEle, params, state) {
    this.freqChart = new BaseCanvas(canvasEle, params, state)
    this.freqChart.saveCoordinateParams(
      { min: this.options.minDecibels, max: this.options.maxDecibels, offset: 15, showText: true },
      { min: 0, max: this.options.sampleRate / 2, offset: 28, showText: true }
    )
  }

  // 绑定时域波形分析图图表
  createTimeChart(canvasEle, params) {
    const thek = 1
    this.timeChart = new BaseCanvas(canvasEle, params)
    this.timeChart.saveCoordinateParams(
      { min: -thek, max: thek, showText: true, offset: 10 },
      { min: 0, max: 100, offset: 28 }
    )
  }

  // 播放
  start(type, params) {
    if ((this.fileRunnable && type === 'file') || type === 'osc') {
      // if(type === 'file') {
      //   this.options.drawOverTimeChart = false
      // } else {
      //   this.options.drawOverTimeChart = true
      // }
      this.running = true
      this.player.start(type, params)
      this.timeChart && this.timeChart.start()
      this.freqChart && this.freqChart.start()
      this.overtimeChart && this.overtimeChart.start(), this.overtimeChart.setStartTime(this.player.actx.currentTime)
      this.tick()
    }
  }

  // 停止
  stop() {
    this.running = false
    this.player && this.player.stop()
  }

  // 传入文件
  async setAudioBuffer(file) {
    this.fileRunnable = false
    await this.player.setAudioBuffer(file)
    this.fileRunnable = true
  }

  // 每一帧
  tick() {
    requestAnimationFrame(() => {
      // 获取时域数据
      if (this.options.isDrawTime &&  this.player.analyser) {
        const timeData = this.player.getAnalyserData('time', this.options.drawTimeType)
        const backup = timeData.constructor === Uint8Array ? new Uint8Array(timeData) : new Float32Array(timeData)
        this.timeChart.drawTimeWave(backup)

        // 累积图
        this.options.drawOverTimeChart && this.overtimeChart.drawTimeWaveOverTime(backup, this.player.actx.currentTime)
      }

      // 获取频域数据
      if (this.options.isDrawFreq &&  this.player.analyser) {
        const freqData = this.player.getAnalyserData('freq', this.options.drawFreqType)
        const backup = freqData.constructor === Uint8Array ? new Uint8Array(freqData) : new Float32Array(freqData)
        this.freqChart.drawFreqWave(backup, this.player.analyser.maxDecibels, this.player.analyser.minDecibels)
        // this.freqData = freqData
      }


      if (this.running) {
        return this.tick()
      } else {
        this.timeChart && this.timeChart.stop()
        this.freqChart && this.freqChart.stop()
        this.overtimeChart && this.overtimeChart.stop(), this.overtimeChart.afterDrawTimeWaveOverTime()
      }
    })
  }
}
