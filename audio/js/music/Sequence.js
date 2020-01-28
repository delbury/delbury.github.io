import { Note } from './Note.js'
import { CP, Tools } from './Tools.js'

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
    return Tools.calcCenterFreq(offset)
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