export class BaseCanvas {
  constructor(
    canvas,
    { width, height = 300, scalable = false, waveType = '' } = {}
  ) {
    if (!canvas || canvas.tagName !== 'CANVAS') {
      throw new TypeError('first param must be a canvas element')
    }
    this.canvas = canvas
    this.canvas.width = width || canvas.parentNode.offsetWidth
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
    this.canvasOption = {
      lineWidth: 1,
      strokeStyle: '#333'
    }
    this.state = {
      x: 0,
      y: 0,
      scalable,
      spaceDown: false,
      scaleX: 1, // 频域横坐标，表示频率缩放，乘法，1~Infinity
      scaleY: 0, // 时域纵坐标，表示幅值缩放，加法，0~0.4
      waveType,
      currentData: null,
      running: false
    }

    this.bindEvents()
  }

  // 开始绘制
  start() {
    this.running = true
  }

  // 结束绘制
  stop() {
    this.running = false
  }

  // 创建提示框和提示线
  createTip() {
    this.toolline = document.createElement('div')
    this.toolline.className = 'canvas-line none'
    this.toolline.style.height = `calc(100% - ${this.yParams.offset || 0}px)`

    this.tooltip = document.createElement('div')
    this.tooltip.className = 'canvas-tip none'
    this.canvas.parentNode.appendChild(this.tooltip)
    this.canvas.parentNode.appendChild(this.toolline)
  }

  // 清除数据
  clearData() {
    this.running = false
    this.currentData = null
  }

  // 绑定事件
  bindEvents() {
    // 鼠标移入事件
    this._onmouseenter = ev => {
      this.tooltip.classList.remove('none')
      this.toolline.classList.remove('none')
    }

    // 鼠标移出事件
    this._onmouseleave = ev => {
      this.tooltip.classList.add('none')
      this.tooltip.style.top = ''
      this.tooltip.style.left = ''

      this.toolline.classList.add('none')
      this.toolline.style.top = ''
      this.toolline.style.left = ''
    }

    // 鼠标移动事件
    this._onmousemove = ev => {
      if (this.throttle) {
        return
      }
      this.throttle = true
      setTimeout(() => {
        this.throttle = false
      }, 30)
      this.state.x = ev.offsetX
      this.state.y = ev.offsetY

      const tipOffsetX = 20
      const tipOffsetY = -30

      this.toolline.style.top = '0px'
      this.toolline.style.left = ev.offsetX + 'px'

      // 计算提示框的 y 轴坐标
      if (ev.offsetY + tipOffsetY > 10) {
        this.tooltip.style.top = ev.offsetY + tipOffsetY + 'px'
      } else {
        this.tooltip.style.top = '10px'
      }

      // 计算提示框的 x 轴坐标
      if (ev.offsetX + this.tooltip.offsetWidth + tipOffsetX - this.tooltip.parentNode.offsetWidth < 10) {
        this.tooltip.style.left = ev.offsetX + tipOffsetX + 'px'
      } else {
        this.tooltip.style.left = this.tooltip.parentNode.offsetWidth - this.tooltip.offsetWidth - 10 + 'px'
      }
      this.tooltip.innerHTML = `${ev.offsetX}, ${ev.offsetY}`
    }

    // 按下按键
    this._onkeydown = ev => {
      if (ev.keyCode === 32) {
        ev.preventDefault()
        this.state.spaceDown = true
      }
    }

    // 松开按键
    this._onkeyup = ev => {
      if (ev.keyCode === 32) {
        ev.preventDefault()
        this.state.spaceDown = false
      }
    }

    // 滚轮事件
    this._onwheel = ev => {
      if (this.state.scalable && this.state.spaceDown) {
        ev.preventDefault()
        const ds = 0.5
        const dd = 0.05

        // 下滚，缩小
        if (ev.wheelDeltaY < 0) {
          if (this.state.waveType === 'freq') {
            if (this.state.scaleX - ds <= 1) {
              this.state.scaleX = 1
            } else {
              this.state.scaleX -= ds
            }
          } else if (this.state.waveType === 'time') {
            if (this.state.scaleY - dd <= 0) {
              this.state.scaleY = 0
            } else {
              this.state.scaleY -= dd
            }
          }

          // 放大
        } else if (ev.wheelDeltaY > 0) {
          if (this.state.waveType === 'freq') {
            this.state.scaleX += ds
          } else if (this.state.waveType === 'time') {
            if (this.state.scaleY + dd >= 0.45) {
              this.state.scaleY = 0.45
            } else {
              this.state.scaleY += dd
            }
          }
        }
        this.state.scaleX = Math.round(this.state.scaleX * 100) / 100

        if (this.state.currentData && this.state.waveType) {
          if (this.state.waveType === 'time') {
            this.drawTimeWave(this.state.currentData)
          } else if (this.state.waveType === 'freq') {
            this.drawFreqWave(this.state.currentData)
          }
        } else {
          this.drawCoordinateSystem()
        }
      }
    }

    this.canvas.addEventListener('mousemove', this._onmousemove)
    this.canvas.addEventListener('wheel', this._onwheel, { passive: false })
    this.canvas.addEventListener('mouseenter', this._onmouseenter)
    this.canvas.addEventListener('mouseleave', this._onmouseleave)
    document.addEventListener('keydown', this._onkeydown)
    document.addEventListener('keyup', this._onkeyup)
  }

  // 移除事件
  removeEvents() {
    this._onmousemove && this.canvas.removeEventListener('mousemove', this._onmousemove)
    this._onwheel && this.canvas.removeEventListener('wheel', this._onwheel)
    this._onmouseenter && this.canvas.removeEventListener('mouseenter', this._onmouseenter)
    this._onmouseleave && this.canvas.removeEventListener('mouseleave', this._onmouseleave)
    this._onkeydown && document.removeEventListener('keydown', this._onkeydown)
    this._onkeyup && document.removeEventListener('keyup', this._onkeyup)
  }

  // 重置缩放
  resetScale() {
    if (this.state.waveType === 'time') {
      this.state.scaleY = 0
      this.drawCoordinateSystem()
      this.drawTimeWave(this.state.currentData)
    } else if (this.state.waveType === 'freq') {
      this.state.scaleX = 1
      this.drawCoordinateSystem()
      this.drawFreqWave(this.state.currentData)
    }
  }

  // 绘制波形图
  drawTimeWave(data) {
    // this.state.waveType = 'time'
    this.state.currentData = data
    this.drawCoordinateSystem()
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = this.canvasOption.lineWidth
    this.ctx.strokeStyle = this.canvasOption.strokeStyle

    // 偏移
    const yoffset = this.yParams.offset || 0
    const xoffset = this.xParams.offset || 0
    const length = data.length
    const byteMax = 256
    const dx = (this.canvas.width - xoffset) / length // x轴间隔
    const dy = (this.canvas.height - yoffset) / (1 - 2 * this.state.scaleY) // y轴间隔
    for (let i = 0; i < length; i++) {
      if (i === 0) {
        this.ctx.moveTo(xoffset + i * dx, (1 - this.state.scaleY) * dy - data[i] * dy / byteMax)
      } else {
        this.ctx.lineTo(xoffset + i * dx, (1 - this.state.scaleY) * dy - data[i] * dy / byteMax)
      }
    }
    this.ctx.stroke()
    this.ctx.restore()
  }

  // 绘制频谱图
  drawFreqWave(data) {
    const min = this.yParams.min || -100
    const max = this.yParams.max || -30
    // this.state.waveType = 'freq'
    this.state.currentData = data
    this.drawCoordinateSystem()
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = this.canvasOption.lineWidth
    this.ctx.strokeStyle = this.canvasOption.strokeStyle

    // 偏移
    const yoffset = this.yParams.offset || 0
    const xoffset = this.xParams.offset || 0
    const length = data.length
    const dx = (this.canvas.width - xoffset) / length * this.state.scaleX // x轴间隔
    const dy = (this.canvas.height - yoffset) / (max - min) // y轴间隔
    for (let i = 0; i < length; i++) {
      if (i === 0) {
        this.ctx.moveTo(xoffset + i * dx, this.canvas.height - yoffset - data[i] * dy)
      } else {
        this.ctx.lineTo(xoffset + i * dx, this.canvas.height - yoffset - data[i] * dy)
      }
    }
    this.ctx.stroke()
    this.ctx.restore()
  }

  // 保存坐标系参数
  saveCoordinateParams(yParams, xParams) {
    this.yParams = yParams
    this.xParams = xParams

    this.drawCoordinateSystem()
    this.createTip()
  }

  // 绘制坐标系
  drawCoordinateSystem() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let { min: ymin, max: ymax, offset: yoffset = 0, div: ydiv = 10, showText: yText = false } = this.yParams || {}
    let { min: xmin, max: xmax, offset: xoffset = 0, div: xdiv = 10, showText: xText = false } = this.xParams || {}
    const yTextOffsetX = 1
    const yTextOffsetY = 3
    const xTextOffsetX = 3
    const xTextOffsetY = 3

    // 坐标轴偏移，以右下角为原点
    this.yoffset = yoffset // 原点上移
    this.xoffset = xoffset // 原点右移


    this.ctx.save()
    // 绘制 y 轴
    if (this.yParams) {
      const dy = (this.canvas.height - yoffset) / ydiv
      if (this.state.waveType === 'time') {
        ymax -= this.state.scaleY
        ymin += this.state.scaleY
      }
      const dVal = (ymax - ymin) / ydiv

      for (let i = 0; i <= ydiv; i++) {
        this.ctx.beginPath()

        // 绘制刻度值
        if (yText) {
          this.ctx.lineWidth = 1
          this.ctx.strokeStyle = '#333'
          this.ctx.setLineDash([])
          if (i === 0) {
            this.ctx.strokeText(Math.round((ymax - dVal * i) * 100) / 100, yTextOffsetX, i * dy + 10)
          } else {
            this.ctx.strokeText(Math.round((ymax - dVal * i) * 100) / 100, yTextOffsetX, i * dy - yTextOffsetY)
          }
        }

        // 绘制刻度线
        this.ctx.moveTo(0, i * dy)
        if (i === ydiv) {
          this.ctx.strokeStyle = '#333'
          this.ctx.lineWidth = 2
          this.ctx.setLineDash([])
          this.ctx.lineTo(this.canvas.width, i * dy)
        } else {
          this.ctx.strokeStyle = '#999'
          this.ctx.lineWidth = 1
          this.ctx.setLineDash([3, 3, 6])
          this.ctx.lineTo(this.canvas.width, i * dy)
        }
        this.ctx.stroke()
      }
    }

    // 绘制 x 轴
    if (this.xParams) {
      const dx = (this.canvas.width - xoffset) / xdiv
      const dVal = (xmax / this.state.scaleX - xmin) / xdiv

      for (let i = 0; i <= xdiv; i++) {
        this.ctx.beginPath()

        // 绘制刻度值
        if (xText) {
          this.ctx.lineWidth = 1
          this.ctx.strokeStyle = '#333'
          this.ctx.setLineDash([])
          if (i === xdiv) {
            const text = Math.round((xmin + dVal * i) * 10) / 10
            const offsetLast = this.ctx.measureText(text).width
            this.ctx.strokeText(text, xoffset + i * dx - offsetLast - xTextOffsetX, this.canvas.height - xTextOffsetY)
          } else {
            this.ctx.strokeText(Math.round((xmin + dVal * i) * 10) / 10, xoffset + i * dx + xTextOffsetX, this.canvas.height - xTextOffsetY)
          }
        }


        // 绘制刻度线
        this.ctx.moveTo(xoffset + i * dx, 0)
        if (i === 0) {
          this.ctx.strokeStyle = '#333'
          this.ctx.lineWidth = 2
          this.ctx.setLineDash([])
          this.ctx.lineTo(xoffset + i * dx, this.canvas.height)
        } else {
          this.ctx.strokeStyle = '#999'
          this.ctx.lineWidth = 1
          this.ctx.setLineDash([3, 3, 6])
          this.ctx.lineTo(xoffset + i * dx, this.canvas.height)
        }
        this.ctx.stroke()
      }
    }
    this.ctx.restore()
  }

  // 绘制图形
}

export class AudioPlayer {
  constructor(file, options = {}) {
    if (!(/^audio/).test(file.type)) {
      throw new Error('传入必须为音频文件')
    }

    this.options = options
    this.init(file)
  }

  // 初始化
  async init(file) {
    this.actx = new AudioContext()
    this.audioBuffer = await this.decodeFile(file)
    this.source = null
    this.gain = this.createGain(2)
    this.analyser = this.createAnalyser(this.options.analyser)
    this.gain.connect(this.analyser).connect(this.actx.destination)
  }

  // 解析音频文件
  async decodeFile(file) {
    const arraybuffer = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result)
      }
      reader.readAsArrayBuffer(file)
    })
    const audiobuffer = await this.actx.decodeAudioData(arraybuffer)
    return audiobuffer
  }

  // 创建源节点
  createSource(ab) {
    const source = this.actx.createBufferSource()
    source.buffer = ab
    return source
  }

  // 创建增益节点
  createGain(val = 1) {
    const gainNode = this.actx.createGain()
    gainNode.gain.value = val
    return gainNode
  }

  // 创建分析节点
  createAnalyser({ fftSize = 2048, minDecibels = -100, maxDecibels = -30, smoothingTimeConstant = 0.8 } = {}) {
    const analyser = this.actx.createAnalyser()
    analyser.fftSize = fftSize
    analyser.minDecibels = minDecibels
    analyser.maxDecibels = maxDecibels
    analyser.smoothingTimeConstant = smoothingTimeConstant
    return analyser
  }

  getAnalyserData(domain = 'freq', type = 'byte') {
    if (!this.analyser) {
      return false
    }
    if (!this.analyserBuffer) {
      if (type === 'byte') {
        this.analyserBuffer = new Uint8Array(this.analyser.frequencyBinCount)
      } else if (type === 'freq') {
        this.analyserBuffer = new Float32Array(this.analyser.frequencyBinCount)
      }
    }
    if (domain === 'freq') {
      if (type === 'byte') {
        this.analyser.getByteFrequencyData(this.analyserBuffer)
      } else if (type === 'float') {
        this.analyser.getFloatFrequencyData(this.analyserBuffer)
      }
    } else if (domain === 'time') {
      if (type === 'byte') {
        this.analyser.getByteTimeDomainData(this.analyserBuffer)
      } else if (type === 'float') {
        this.analyser.getFloatTimeDomainData(this.analyserBuffer)
      }
    }

    return this.analyserBuffer
  }

  // 播放
  start() {
    if (this.source) {
      this.source.stop()
      this.source.onended = null
      this.source.disconnect()
      this.source = null
    }
    this.source = this.createSource(this.audioBuffer)
    this.source.onended = this.options.onended || null
    this.source.connect(this.gain)
    this.source.start()
  }

  // 停止
  stop() {
    if (this.source) {
      this.source.stop()
      this.source.disconnect()
      this.source = null
    }
  }
}

export class AudioAnalyser {
  constructor(options = {}) {
    this.player = null
    this.timeChart = null
    this.freqChart = null
    this.running = false
    this.runnable = false
    this.options = {
      isDrawTime: true,
      drawTimeType: 'byte',
      isDrawFreq: true,
      drawFreqType: 'byte',
      fftSize: 2048 * 2,
      maxDecibels: 50,
      minDecibels: -100,
      sampleRate: 48000,
      ...options
    }
  }

  // 初始化
  initCharts({ freqCanvas, timeCanvas }) {
    timeCanvas ? this.createTimeChart(timeCanvas, { scalable: true, waveType: 'time' }) : null
    freqCanvas ? this.createFreqChart(freqCanvas, { scalable: true, waveType: 'freq' }) : null
  }

  // 绑定音频播放器实例
  createAudioPlayer(file) {
    this.player = new AudioPlayer(file, {
      onended: () => {
        this.running = false
        this.timeChart && this.timeChart.clearData()
        this.freqChart && this.freqChart.clearData()
        this.options.onendedCallback && this.options.onendedCallback() // 播放结束回调
      },
      analyser: {
        maxDecibels: this.options.maxDecibels,
        minDecibels: this.options.minDecibels,
        fftSize: this.options.fftSize
      } // 分析器参数
    })
    this.runnable = true
  }

  // 绑定频谱图图表
  createFreqChart(canvasEle, params) {
    this.freqChart = new BaseCanvas(canvasEle, params)
    this.freqChart.saveCoordinateParams(
      { min: this.options.minDecibels, max: this.options.maxDecibels, offset: 15, showText: true },
      { min: 0, max: this.options.sampleRate / 2, offset: 30, showText: true }
    )
  }

  // 绑定时域波形分析图图表
  createTimeChart(canvasEle, params) {
    this.timeChart = new BaseCanvas(canvasEle, params)
    this.timeChart.saveCoordinateParams(
      { min: 0, max: 1, showText: true },
      { min: 0, max: 100, offset: 30 }
    )
  }

  // 播放
  start() {
    if (this.runnable) {
      this.running = true
      this.player.start()
      this.timeChart && this.timeChart.start()
      this.freqChart && this.freqChart.start()
      this.tick()
    }
  }

  // 停止
  stop() {
    if (this.runnable) {
      this.running = false
      this.player.stop()
      this.timeChart && this.timeChart.stop()
      this.freqChart && this.freqChart.stop()
    }
  }

  // 每一帧
  tick() {
    requestAnimationFrame(() => {
      // 获取时域数据
      if (this.options.isDrawTime) {
        const timeData = this.player.getAnalyserData('time', this.options.drawTimeType)
        const backup = timeData.constructor === Uint8Array ? new Uint8Array(timeData) : new Float32Array(timeData)
        this.timeChart.drawTimeWave(backup)
      }

      // 获取频域数据
      if (this.options.isDrawFreq) {
        const freqData = this.player.getAnalyserData('freq', this.options.drawFreqType)
        const backup = freqData.constructor === Uint8Array ? new Uint8Array(freqData) : new Float32Array(freqData)
        this.freqChart.drawFreqWave(backup, this.player.analyser.maxDecibels, this.player.analyser.minDecibels)
        // this.freqData = freqData
      }

      if (this.running && this.runnable) {
        return this.tick()
      }
    })
  }
}
