class OSCs {
  constructor(actx, params) {
    this.actx = actx
    this._dt = 0.75

    this.init(params)
  }

  init({ type = 'sine', frequency = 440, wave } = {}) {
    this._frequency = frequency
    this.source = [
      this.actx.createOscillator(),
      this.actx.createOscillator(),
      this.actx.createOscillator(),
      this.actx.createOscillator()
    ]
    this.source.forEach((osc, index) => {
      if(type === 'custom' && wave) {
        osc.setPeriodicWave(wave)
      } else {
        osc.type = type
      }
      osc.frequency.value = frequency * Math.pow(2, index / 12)
    })
  }

  start(when) {
    when = when || this.actx.currentTime
    this.source.forEach((osc, index) => osc.start(when + index * this._dt))
  }

  stop(when) {
    when = when || this.actx.currentTime
    this.source.forEach((osc, index) => osc.stop(when + index * this._dt))
  }

  connect(dst) {
    this.source.forEach(osc => osc.connect(dst))
  }

  setPeriodicWave(wave) {
    this.source.forEach(osc => osc.setPeriodicWave(wave))
  }

  get frequency() {
    return { value: this._frequency }
  }
}

export class AudioPlayer {
  constructor(options = {}) {
    this.options = options
    this.init()
  }

  // 初始化
  async init() {
    this.actx = new AudioContext()
    this.source = null
    this.gain = this.createGain()
    this.analyser = this.createAnalyser(this.options.analyser)
    this.filter = this.createFilter()
    this.gain.connect(this.filter).connect(this.analyser).connect(this.actx.destination)
  }

  // 传入音频文件
  async setAudioBuffer(file) {
    if (!(/^audio/).test(file.type)) {
      throw new Error('传入必须为音频文件')
    }
    this.audioBuffer = await this.decodeFile(file)
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

  // 创建振荡器
  createOsc({ type = 'sine', frequency = 440, dbs } = {}) {
    const source = this.actx.createOscillator()
    if(type === 'custom' && dbs && dbs.length) {
      this.customWaves = dbs.map(item => {
        return {
          freq: item.freq,
          wave: this.actx.createPeriodicWave(...this.calcRealAndImag(item.db))
        }
      })
      source.setPeriodicWave(this.customWaves[0].wave)
    } else {
      source.type = type
    }
    source.frequency.value = frequency
    return source

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

  // 将 db 数组计算为自定义波形的实部和虚部
  calcRealAndImag(dbs) {
    const amps = []
    for(let i = dbs.length - 1; i >= 0; i--) {
      const ddb = dbs[i] - dbs[dbs.length - 1]
      // amps.unshift(Math.pow(10, ddb / 10))
      amps.unshift(Math.pow(10, ddb / 20))
    }
    const LEN = dbs.length + 1
    let real = new Float32Array(LEN)
    let imag = new Float32Array(LEN)
    for (let i in real) {
      real[i] = 0
    }
    for (let i in imag) {
      if(i == 0) {
        imag[0] = 0
      } else {
        imag[i] = amps[i - 1]
        // real[i] = amps[i - 1]
      }
    }
    return [real, imag]
    // return [imag, real]
  }

  // 创建滤波节点
  createFilter() {
    const filter = this.actx.createBiquadFilter()
    filter.frequency.value = 24000
    filter.type = 'lowpass'
    return filter
  }

  // 创建增益节点
  createGain(val = 1) {
    const gainNode = this.actx.createGain()
    gainNode.gain.value = val
    return gainNode
  }

  // 设置增益
  setGain(val) {
    this._gainValue = val
    this.gain.gain.linearRampToValueAtTime(val, this.actx.currentTime + 0.01)
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

  // 获取分析数据
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
  start(type, params) {
    this.stop()
    if(type === 'file' && !this.audioBuffer) {
      return
    }
    if(type === 'file') {
      this.source = this.createSource(this.audioBuffer)
      this.source.onended = () => {
        this.source.disconnect()
        this.source = null
        this.options.onended && this.options.onended()
      }
    } else if(type === 'osc') {
      this.source = this.createOsc(params)
      this.source.onended = () => {
        this.source.disconnect()
        this.source = null
        this.options.onendedOsc && this.options.onendedOsc()
      }
    }
    this.source.connect(this.gain)
    this.source.start()

    if(type === 'osc' && this.source) {
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

      // this.filter.gain.value = 10
      this.gain.gain.value = 0
      this.gain.gain.linearRampToValueAtTime(this._gainValue, this.actx.currentTime + 0.001)
      this.gain.gain.setTargetAtTime(0, this.actx.currentTime + 0.01, 0.2)
      this.gain.gain.setTargetAtTime(0, this.actx.currentTime + 0.2, 0.3)

      this.source.stop(this.actx.currentTime + 2)
    }
  }

  // 停止
  stop() {
    if (this.source) {
      this.source.stop()
    }
  }
}