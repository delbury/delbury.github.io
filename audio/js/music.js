/**
 * 音乐
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 */

import IRBase64 from '../resource/IR.js'

// 工具类
export class Tools {
  // 创建自定义钢琴音色波形
  static createPianoWave(actx, dbs) {
    const amps = []
    for(let i = dbs.length - 1; i >= 0; i--) {
      const ddb = dbs[i] - dbs[dbs.length - 1]
      amps.unshift(Math.pow(10, ddb / 10))
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
      }
    }
    return actx.createPeriodicWave(real, imag)
  }

  // 创建不同音高的钢琴音色波形
  static createPianoWaves(actx) {
    const options = [
      {
        freq: 0,
        db: [
          -28.24, -26.67, -37.25, -43.14,
          -36.86, -43.53, -39.61, -46.67,
          -50.20, -49.80, -73.33, -56.47,
          -73.33, -81.96, -72.55
        ]
      },
      {
        freq: 500,
        db: [-22.75, -30.20, -35.69, -50.59, -49.02, -60.39, -67.06, -91.37]
      },
      {
        freq: 1000,
        db: [-25.49, -55.29, -69.02, -93.33]
      }
    ]

    return options.map(item => {
      return {
        freq: item.freq,
        wave: Tools.createPianoWave(actx, item.db)
      }
    })
  }
}

// CONST_PARAMS，常量
export const CP = {
  enharmonics: (() => {
    const arr = ['C', '#C,bD', 'D', '#D,bE', 'E', 'F', '#F,bG', 'G', '#G,bA', 'A', '#A,bB', 'B']
    const map = new Map()
    arr.forEach((item, index) => {
      item.split(',').forEach(it => {
        map.set(it, index)
      })
    })
    return map
  })(), // 音符名
  numberNotes: (() => {
    const arr = ['1', '#1,b2', '2', '#2,b3', '3', '4', '#4,b5', '5', '#5,b6', '6', '#6,b7', '7']
    const map = new Map()
    arr.forEach((item, index) => {
      item.split(',').forEach(it => {
        map.set(it, index)
      })
    })
    return map
  })(), // 简谱
  middles: calcCenterFreq(), // 中央组的音调，C4 ~ B4
  middleLevel: 4,
  IR: null
}

// 正则表达式
const regs = {
  space: /\s+/,
  num: /(\d+)/,
  float: /^[0-9.]$/,
  simple: /(^[#b]?\d{1})/
}

// getIR()

/**
 * 计算中央组的频率
 */
function calcCenterFreq(offset = 0) {
  const arr = []
  for (let i = 1; i <= 12; i++) {
    arr.push(440 * Math.pow(2, (i + offset - 10) / 12))
  }
  return arr
}


/**
 * 获取 IR
 */

async function getIR() {
  const bs = atob(IRBase64)
  const len = bs.length
  const bytes = new Uint8Array(len)
  for(let i = 0; i < len; i++) {
    bytes[i] = bs.charCodeAt(i)
  }
  CP.IR = await (new AudioContext()).decodeAudioData(bytes.buffer)
}


/**
 * 音符
 * 四分音符为一拍，每小节有四拍
 * new Note('A4 q') === 440Hz, 四分音符 --> 1
 * new Note('- e') === 0Hz, 休止符，八分音符 --> 0.5
 * new Note('A4 es') === 440Hz, 附点八分音符，即 0.5 + 0.25
 * new Note('A4 0.125') 任意数字，4 / N(分音符).
 * new Note('#1+- q') 简谱字符串，数字表示
 */
export class Note {
  constructor(str, isNumber = false, middles = CP.middles, ) {
    this.middles = middles
    if(isNumber) {
      this.translateNumberString(str)
    } else {
      this.translateString(str)
    }
  }

  // 转换曲谱
  translateString(str) {
    const params = str.split(regs.space)
    this.setFrequency(params[0]) // 计算频率
    this.setDuration(params[1]) // 计算持续时间
  }

  // 转换简谱字符串
  translateNumberString(str) {
    const params = str.split(regs.space)
    const freStrs = params[0].split('/') // 频率字符串数组

    if(freStrs.length === 1) {
      const freParams = freStrs[0].split(regs.simple)
      freParams.shift()
      this.frequency = this.calcNumberFre(freParams)
    } else {
      this.frequency = {
        freqs: [],
        isOrder: false
      }
      
      if(freStrs[0] === '~') {
        this.frequency.isOrder = true
        freStrs.shift()
      }
      freStrs.forEach(str => {
        const freParams = str.split(regs.simple)
        freParams.shift()
        this.frequency.freqs.push(this.calcNumberFre(freParams))
      })
    }
    this.setDuration(params[1])
  }

  // 计算简谱的频率
  calcNumberFre(freParams) {
    // 统计字符
    let octaveCount = 4 // 升降八度计数
    freParams[1].split('').map(str => {
      switch(str) {
        case '+': // 升八度
          octaveCount++
          break
        case '-': // 降八度
        octaveCount--
          break
      }
    })

    if(freParams[0] === '0') {
      return 0
    } else {
      return this.middles[CP.numberNotes.get(freParams[0])] * (2 ** (octaveCount - CP.middleLevel))
    }
  }

  // 根据字符串计算当前音符的频率
  setFrequency(str) {
    const strs = str.split('/')

    // 单音
    if(strs.length === 1) {
      const params = strs[0].split(regs.num)
      if (params[0] === '-') {
        this.frequency = 0
      } else {
        this.frequency = this.middles[CP.enharmonics.get(params[0])] * (2 ** (Number(params[1]) - CP.middleLevel))
      }

    // 和弦音
    } else {
      this.frequency = []
      strs.forEach(str => {
        const params = str.split(regs.num)
        if (params[0] === '-') {
          this.frequency.push(0)
        } else {
          this.frequency.push(
            this.middles[CP.enharmonics.get(params[0])] * (2 ** (Number(params[1]) - CP.middleLevel))
          )
        }
      })
    }
  }

  // 根据字符串计算当前音符的持续时间
  setDuration(str) {
    // 判断是否为浮点数
    if (regs.float.test(str)) {
      this.duration = parseFloat(str)
    } else {
      /**
       * w: 全音符（whole）
       * h: 二分音符（half）
       * q: 四分音符（quarter）
       * e: 八分音符（eighth）
       * s: 十六分音符（sixteenth）
       * t: 三十二分音符
       */
      this.duration = str.toLowerCase().split('').reduce((sum, curr) => {
        switch (curr) {
          case 'w': return 4 + sum
          case 'h': return 2 + sum
          case 'q': return 1 + sum
          case 'e': return 0.5 + sum
          case 's': return 0.25 + sum
          case 't': return 0.125 + sum
          default: return 0 + sum
        }
      }, 0) || 0
    }
  }
}

/**
 * 弹奏音符
 */

export class NotePlay extends Note {
  constructor(actx, str) {
    super(str)
    this.actx = actx || new AudioContext()
    this.tempo = 120 / 120
  }

  createNodes() {
    this.gainNode = this.actx.createGain()
    this.oscNode = this.actx.createOscillator()

    this.oscNode.connect(this.gainNode)
    this.gainNode.connect(this.actx.destination)


    // this.oscNode.type = 'sine'
    this.customWaves = Tools.createPianoWaves(this.actx)
    this.oscNode.setPeriodicWave(this.customWaves[0].wave)
    this.oscNode.frequency.value = this.frequency
    // this.oscNode.detune.value = 1200
    // this.gainNode.gain.value = 3.4
    this.gainNode.gain.exponentialRampToValueAtTime(1, this.actx.currentTime + 0.001)
  }

  play() {
    this.createNodes()
    this.oscNode.start(this.actx.currentTime)
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.actx.currentTime + this.tempo * this.duration);
    this.oscNode.stop(this.actx.currentTime + this.tempo * this.duration)
  }
}


/**
 * 音频序列
 * @param {AudioContext} actx
 * @param {Array} notes 
 * @param {Object}  
 */

export class Sequence {
  constructor(actx, notes, {
    tempo = 120, loop = false, staccato = 0, waveType = 'sine', tone = 'C', isNumber = false, gain = 0.5
  } = {}) {
    this.actx = actx || new AudioContext()
    this.tempo = tempo
    this.waveType = waveType
    this.staccato = staccato
    this.loop = loop
    this.tone = tone
    this.gainValue = gain

    this.middles = this.createTone()
    this.notes = this.createNotes(notes, isNumber)
    this.customWaves = Tools.createPianoWaves(this.actx)
  }

  // 变换歌曲
  changeNotes({ notes, isNumber, tone, tempo }) {
    if(tempo) {
      this.tempo = tempo
    }
    if(tone) {
      this.tone = tone
      this.middles = this.createTone()
    }
    this.notes = this.createNotes(notes, isNumber)
  }

  // 变调
  // changeTone(tone) {
  //   this.tone = tone
  //   this.middles = this.createTone()
  // }

  // 创建曲调
  createTone() {
    const offset = CP.enharmonics.get(this.tone)
    return calcCenterFreq(offset)
  }

  // 创建音符实例
  createNotes(notes, isNumber) {
    return notes.map(item => {
      if(typeof item === 'object') {
        this.tone = item.tone
        this.middles = this.createTone()
        return null
      }
      return new Note(item, isNumber, this.middles)
    }).filter(item => !!item)
  }

  // 创建播放列表
  scheduleNote(index, when) {
    const duration = 60 / this.tempo * this.notes[index].duration
    const cutoff = duration * (1 - this.staccato || 0)

    let osc, filterNode, gainNode
    if(index % 2 === 0) {
      osc = this.osc
      filterNode = this.filterNode
      gainNode = this.gainNode
    } else {
      osc = this.oscSub
      filterNode = this.filterNodeSub
      gainNode = this.gainNodeSub
    }

    const fn = (fre, i = 0 , dt = 0) => {
      filterNode.frequency.setValueAtTime(Math.min(fre * 15, 20000), when)
      filterNode.frequency.setTargetAtTime(Math.min(fre * 3, 20000), when + 0.01, 0.5)

      osc[i].frequency.setValueAtTime(fre, when + dt) // 设置频率
      osc[i].frequency.setValueAtTime(0, when + dt + cutoff)

      // gainNode.gain.linearRampToValueAtTime(this.gainValue, when + dt + 0.001) // 设置增益
      gainNode.gain.setTargetAtTime(this.gainValue, when + 0.0001, 0.001)
      gainNode.gain.setTargetAtTime(0, when + dt + 0.01, 0.2)
      gainNode.gain.setTargetAtTime(0, when + dt + 0.2, 0.3)
      // gainNode.gain.setTargetAtTime(0, when + cutoff - 0.001, 0.001)

    }

    // 是否和弦
    if(this.notes[index].frequency.constructor === Object) {
      const flag = this.notes[index].frequency.isOrder
      this.notes[index].frequency.freqs.forEach((fre, index) => {
        const dt = flag ? 0.075 * index : 0

        fn(fre, index, dt)
      })
    } else {
      fn(this.notes[index].frequency)
    }

    return when + duration // TODO 计算下一个时间
  }

  // 创建效果节点
  createEffectNodes() {
    const gainNode = this.actx.createGain()
    const filterNode = this.actx.createBiquadFilter()
    gainNode.gain.value = 0
    filterNode.type = 'lowpass'
    filterNode.Q.value = 0.707

    gainNode.connect(filterNode).connect(this.actx.destination)

    return [gainNode, filterNode]
  }

  // 创建音源节点
  createSourceNode(effectNode) {
    const oscNode = [
      // 主振源
      this.actx.createOscillator(),

      // 和弦
      this.actx.createOscillator(),
      this.actx.createOscillator(),
      this.actx.createOscillator()
    ]
    oscNode.forEach((osc, index) => {
      if(this.waveType === 'custom') {
        osc.setPeriodicWave(this.customWaves[1].wave)
      } else {
        osc.type = this.waveType
      }
      osc.frequency.value = 0 // 设置频率
      osc.connect(effectNode)
    })

    return oscNode
  }

  // 停止播放
  stop() {
    if(this.osc) {
      this.osc.forEach(osc => {
        osc.onended = null
        osc.stop()
        osc.disconnect(this.effectNode)
      })
      this.osc = null
      this.effectNode.disconnect()
      this.effectNode = null
    }

    if(this.oscSub) {
      this.oscSub.forEach(osc => {
        osc.onended = null
        osc.stop()
        osc.disconnect(this.effectNodeSub)
      })
      this.oscSub = null
      this.effectNodeSub.disconnect()
      this.effectNodeSub = null
    }
  }

  // 开始播放
  play(when) {
    this.stop() // 关闭

    this.initNodes()

    const startTime = (when || this.actx.currentTime) + 0
    this.osc.forEach(osc => osc.start(startTime))
    this.oscSub.forEach(osc => osc.start(startTime))

    when = startTime
    this.notes.forEach((note, index) => {
      when = this.scheduleNote(index, when)
    })
    this.osc.forEach(osc => osc.stop(when))
    this.oscSub.forEach(osc => osc.stop(when))
    this.osc[0].onended = () => {
      this.loop ? this.play() : null
    }
  }

  initNodes() {
    ;([this.effectNode, this.filterNode] = this.createEffectNodes())
    this.gainNode = this.effectNode
    ;([this.effectNodeSub, this.filterNodeSub] = this.createEffectNodes())
    this.gainNodeSub = this.effectNodeSub

    this.osc = this.createSourceNode(this.effectNode)
    this.oscSub = this.createSourceNode(this.effectNodeSub)
  }
}

// 歌曲
export class Song {
  constructor(song) {
    this.song = song
    this.actx = new AudioContext()

    this.main = new Sequence(this.actx, song.notes, {
      gain: 0.75,
      loop: false,
      waveType: 'custom', // sine | square | sawtooth | triangle | custom
      ...song
    })

    if(song.accompanyOff) {
      this.sub = new Sequence(this.actx, song.accompany || [], {
        gain: 0.75,
        loop: false,
        waveType: 'custom', // sine | square | sawtooth | triangle | custom
        ...song
      })
    }
  }

  play() {
    this.main && this.main.play()
    this.sub && this.song.accompanyOff && this.sub.play()
  }

  stop() {
    this.main && this.main.stop()
    this.sub && this.song.accompanyOff && this.sub.stop()
  }

  setWaveType(type) {
    this.main && (this.main.waveType = type)
    this.sub && this.song.accompanyOff && (this.sub.waveType = type)
  }

  // 切歌
  changeNotes(params) {
    this.main && this.main.changeNotes(params)
    this.sub && this.song.accompanyOff && this.sub.changeNotes({ ...params, notes: params.accompany || [] })
  }
} 
