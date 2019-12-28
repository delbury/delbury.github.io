/**
 * 音乐
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 */

import IRBase64 from '../resource/IR.js'

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
  float: /^[0-9.]$/
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
 * new Note('A4 0.125') 任意数字，4 / N(分音符)
 */
export class Note {
  constructor(str, middles = CP.middles, isNumber = false) {
    const params = str.split(regs.space)
    this.middles = middles
    this.frequency = this.getFrequency(params[0], isNumber) || 0 // 计算频率
    this.duration = this.getDuration(params[1]) || 0 // 计算持续时间
  }

  // 根据字符串计算当前音符的频率
  getFrequency(str, isNumber) {
    if(isNumber) {
      // 简谱
    } else {
      const params = str.split(regs.num)
      if (params[0] === '-') {
        return 0
      } else {
        return this.middles[CP.enharmonics.get(params[0])] * (2 ** (Number(params[1]) - CP.middleLevel))
      }
    }
  }

  // 根据字符串计算当前音符的持续时间
  getDuration(str) {
    // 判断是否为浮点数
    if (regs.float.test(str)) {
      return parseFloat(str)
    } else {
      /**
       * w: 全音符（whole）
       * h: 二分音符（half）
       * q: 四分音符（quarter）
       * e: 八分音符（eighth）
       * s: 十六分音符（sixteenth）
       */
      return str.toLowerCase().split('').reduce((sum, curr) => {
        switch (curr) {
          case 'w': return 4 + sum
          case 'h': return 2 + sum
          case 'q': return 1 + sum
          case 'e': return 0.5 + sum
          case 's': return 0.25 + sum
          default: return 0 + sum
        }
      }, 0)
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
    this.tempo = 60 / 120
  }

  createNodes() {
    this.gainNode = this.actx.createGain()
    this.oscNode = this.actx.createOscillator()

    this.oscNode.connect(this.gainNode)
    this.gainNode.connect(this.actx.destination)


    this.oscNode.type = 'sine'
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
  constructor(actx, notes, { tempo = 120, loop = false, staccato = 0, waveType = 'sine', tone = 'C' } = {}) {
    this.actx = actx || new AudioContext()
    this.tempo = tempo
    this.waveType = waveType
    this.staccato = staccato
    this.loop = loop
    this.tone = tone

    this.middles = this.createTone()
    this.notes = this.createNotes(notes)
    this.effectNode = this.createEffectNodes()
  }

  // 变调
  createTone() {
    const offset = CP.enharmonics.get(this.tone)
    return calcCenterFreq(offset)
  }

  // 创建音符实例
  createNotes(notes) {
    return notes.map(item => {
      return new Note(item, this.middles)
    })
  }

  // 创建播放列表
  scheduleNote(index, when) {
    const duration = 60 / this.tempo * this.notes[index].duration
    const cutoff = duration * (1 - this.staccato || 0)

    this.osc.frequency.setValueAtTime(this.notes[index].frequency, when) // 设置频率
    this.gainNode.gain.linearRampToValueAtTime(1, when + 0.01) // 设置增益

    this.osc.frequency.setValueAtTime(0, when + cutoff)
    this.gainNode.gain.exponentialRampToValueAtTime(0.01, when + cutoff)

    return when + duration // TODO 计算下一个时间
  }

  // 创建效果节点
  createEffectNodes() {
    this.gainNode = this.actx.createGain()
    this.gainNode.connect(this.actx.destination)

    return this.gainNode
  }

  // 创建音源节点
  createSourceNode() {
    this.stop() // 关闭

    this.osc = this.actx.createOscillator()
    this.sourceNode = this.osc
    this.sourceNode.connect(this.effectNode)

    this.osc.type = this.waveType
  }

  // 停止播放
  stop() {
    if(this.sourceNode) {
      this.sourceNode.onended = null
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  // 开始播放
  play(when) {
    when = when || this.actx.currentTime
    this.createSourceNode()
    this.sourceNode.start()
    this.notes.forEach((note, index) => {
      when = this.scheduleNote(index, when)
    })
    this.osc.stop(when)
    this.osc.onended = () => {
      this.loop ? this.play() : null
    }
  }
}