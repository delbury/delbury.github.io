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