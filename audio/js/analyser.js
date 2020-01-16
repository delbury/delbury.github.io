export class BaseCanvas {
  constructor(canvas, { width, height = 300 } = {}) {
    if(!canvas || canvas.tagName !== 'CANVAS') {
      throw new TypeError('first param must be a canvas element')
    }
    this.canvas = canvas
    this.canvas.width = width || canvas.parentNode.offsetWidth
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')

    this.drawCoordinateSystem({ min: -100, max: 0 }, { min: 0, max: 100, offset: 30 })
  }

  // 绘制坐标系
  drawCoordinateSystem(yParams, xParams) {
    const { min: ymin, max: ymax, offset: yoffset = 0, div: ydiv = 10 } = yParams || {}
    const { min: xmin, max: xmax, offset: xoffset = 0, div: xdiv = 10 } = xParams || {}
    const yTextOffsetX = 1
    const yTextOffsetY = 3
    const xTextOffsetX = 3
    const xTextOffsetY = 3
    this.ctx.save()
    
    // 绘制 y 轴
    if(yParams) {
      const dy = (this.canvas.height - yoffset) / ydiv
      const dVal = (ymax - ymin) / ydiv

      for(let i = 0; i <= ydiv; i++) {
        this.ctx.beginPath()
        this.ctx.moveTo(0, i * dy)

        this.ctx.lineWidth = 1
        this.ctx.strokeStyle = '#333'
        this.ctx.setLineDash([])
        // 绘制刻度值
        if(i === 0) {
          this.ctx.strokeText(Math.floor((ymax - dVal * i) * 10) / 10, yTextOffsetX, i * dy + 10)
        } else {
          this.ctx.strokeText(Math.floor((ymax - dVal * i) * 10) / 10, yTextOffsetX, i * dy - yTextOffsetY)
        }

        // 绘制刻度线
        if(i === ydiv) {
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
    if(xParams) {
      const dx = (this.canvas.width - xoffset) / xdiv
      const dVal = (xmax - xmin) / xdiv

      for(let i = 0; i <= xdiv; i++) {
        this.ctx.beginPath()
        this.ctx.moveTo(xoffset + i * dx, 0)

        this.ctx.lineWidth = 1
        this.ctx.strokeStyle = '#333'
        this.ctx.setLineDash([])
        
        // 绘制刻度值
        if(i === xdiv) {
          this.ctx.strokeText(Math.floor((xmin + dVal * i) * 10) / 10, xoffset + i * dx + xTextOffsetX - 30, this.canvas.height - xTextOffsetY)
        } else {
          this.ctx.strokeText(Math.floor((xmin + dVal * i) * 10) / 10, xoffset + i * dx + xTextOffsetX, this.canvas.height - xTextOffsetY)
        }

        // 绘制刻度线
        if(i === 0) {
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
}

export class AudioPlayer {
  constructor(file) {
    if(!(/^audio/).test(file.type)) {
      throw new Error('传入必须为音频文件')
    }

    this.init(file)
  }

  // 初始化
  async init(file) {
    this.actx = new AudioContext()
    this.audioBuffer = await this.decodeFile(file)
    this.source = null
    this.gain = this.createGain(2)
    this.gain.connect(this.actx.destination)
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
  createAnalyser({size, min, max, smooth} = {}) {
    const analyser = this.actx.createAnalyser()
    analyser.fftSize = size
    analyser.minDecibels = min
    analyser.maxDecibels = max
    analyser.smoothingTimeConstant = smooth
    return analyser
  }

  getAnalyserData(domain = 'freq', type = 'btye') {
    if(!this.analyser) {
      return
    }
    if(!this.analyserBuffer) {
      if(type === 'byte') {
        this.analyserBuffer = new Uint8Array(this.analyser.frequencyBinCount)
      } else if(type === 'freq') {
        this.analyserBuffer = new Float32Array(this.analyser.frequencyBinCount)
      }
    }
    if(domain === 'freq') {
      if(type === 'byte') {
        this.analyser.getByteFrequencyData(this.analyserBuffer)
      } else if(type === 'float') {
        this.analyser.getFloatFrequencyData(this.analyserBuffer)
      }
    } else if(domain === 'time') {
      if(type === 'byte') {
        this.analyser.getByteTimeDomainData(this.analyserBuffer)
      } else if(type === 'float') {
        this.analyser.getFloatTimeDomainData(this.analyserBuffer)
      }
    }

    return this.analyserBuffer
  }

  // 播放
  start() {
    if(this.source) {
      this.source.stop()
      this.source.disconnect()
      this.source = null
    }
    this.source = this.createSource(this.audioBuffer)
    this.source.connect(this.gain)
    this.source.start()
  }

  // 停止
  stop() {
    if(this.source) {
      this.source.stop()
      this.source.disconnect()
      this.source = null
    }
  }
}
