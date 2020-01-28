import { CP } from './Tools.js'

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
    const params = str.split(CP.regs.space)
    this.setFrequency(params[0]) // 计算频率
    this.setDuration(params[1]) // 计算持续时间
  }

  // 转换简谱字符串
  translateNumberString(str) {
    const params = str.split(CP.regs.space)
    const freStrs = params[0].split('/') // 频率字符串数组

    if(freStrs.length === 1) {
      const freParams = freStrs[0].split(CP.regs.simple)
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
        const freParams = str.split(CP.regs.simple)
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
      const params = strs[0].split(CP.regs.num)
      if (params[0] === '-') {
        this.frequency = 0
      } else {
        this.frequency = this.middles[CP.enharmonics.get(params[0])] * (2 ** (Number(params[1]) - CP.middleLevel))
      }

    // 和弦音
    } else {
      this.frequency = []
      strs.forEach(str => {
        const params = str.split(CP.regs.num)
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
    if (CP.regs.float.test(str)) {
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