import { Note } from './Note.js'
import { Tools } from './Tools.js'
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
    this.filterNode = this.actx.createBiquadFilter() // 低通滤波器模拟衰减

    this.oscNode.connect(this.filterNode)
    this.filterNode.connect(this.gainNode)
    this.gainNode.connect(this.actx.destination)

    this.customWaves = Tools.createPianoWaves(this.actx)
    
    // 根据频率挑选合适的波峰（因为高低音的泛音分布不同）
    let wave = this.customWaves[0].wave;
    for (let i = 0; i < this.customWaves.length; i++) {
       if (this.frequency >= this.customWaves[i].freq) {
         wave = this.customWaves[i].wave;
       }
    }
    
    this.oscNode.setPeriodicWave(wave)
    this.oscNode.frequency.value = this.frequency
    
    this.filterNode.type = 'lowpass';
  }

  play() {
    if (!this.frequency) return; // 休止符不发声
    this.createNodes()
    const now = this.actx.currentTime;
    const duration = this.tempo * this.duration;

    // ADSR包络 - 极致的快速起音 (Punchy Attack) 赋予清脆的打击感
    this.gainNode.gain.setValueAtTime(0.001, now);
    // 瞬时爆发 (0.005秒内到达峰值)，模拟琴锤清脆敲击
    this.gainNode.gain.exponentialRampToValueAtTime(2.5, now + 0.005);
    // 迅速回落到一个较高的延音点，保持琴弦的持续明亮共振
    this.gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.15);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // 滤波器包络 - 完全放开高频，甚至在起始点加入极高的截止上限，之后再极其缓慢地衰减到足够亮的位置
    this.filterNode.frequency.setValueAtTime(22050, now); 
    this.filterNode.Q.setValueAtTime(1.5, now); // 增加一点点 Q 值共鸣，让琴声带有明亮的质感
    this.filterNode.frequency.exponentialRampToValueAtTime(this.frequency * 10, now + 2.0);

    this.oscNode.start(now);
    this.oscNode.stop(now + duration);
  }
}