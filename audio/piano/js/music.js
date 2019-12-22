/**
 * 音乐
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 */

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
  middles: (() => {
    const arr = []
    for (let i = 1; i <= 12; i++) {
      arr.push(440 * Math.pow(2, (i - 10) / 12))
    }
    return arr
  })(), // 中央组的音调，C4 ~ B4
  middleLevel: 4
}

// 正则表达式
const regs = {
  space: /\s+/,
  num: /(\d+)/,
  float: /^[0-9.]$/
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
  constructor(str) {
    const params = str.split(regs.space)
    this.frequency = this.getFrequency(params[0]) || 0 // 计算频率
    this.duration = this.getDuration(params[1]) || 0 // 计算持续时间
  }

  // 根据字符串计算当前音符的频率
  getFrequency(str) {
    const params = str.split(regs.num)
    if (params[0] === '-') {
      return 0
    } else {
      return CP.middles[CP.enharmonics.get(params[0])] * (2 ** (Number(params[1]) - CP.middleLevel))
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
    this.gainNode.gain.value = 3.4
    this.gainNode.gain.linearRampToValueAtTime(1, this.actx.currentTime + 0.01);
  }

  play() {
    this.createNodes()
    this.oscNode.start(this.actx.currentTime)
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.actx.currentTime + 1);
    this.oscNode.stop(this.actx.currentTime + this.tempo * this.duration)
  }
}


/**
 * 音频序列
 */

export class Sequence {
  constructor(actx, tempo, notes) {
    this.actx = actx || new AudioContext()
    this.tempo = tempo
  }
}