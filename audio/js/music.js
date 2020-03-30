import { Sequence } from './music/Sequence.js'

// 歌曲
export class Song {
  constructor(song) {
    this.song = song
    this.accompanyOn = true
    this.actx = new AudioContext()

    this.main = new Sequence(this.actx, song.notes, {
      gain: 1,
      loop: false,
      waveType: 'custom', // sine | square | sawtooth | triangle | custom
      ...song
    })

    this.sub = new Sequence(this.actx, song.accompany || [], {
      gain: 1,
      loop: false,
      waveType: 'custom', // sine | square | sawtooth | triangle | custom
      ...song
    })
  }

  play() {
    this.main && this.main.play()
    this.sub && this.accompanyOn && this.sub.play()
  }

  stop() {
    this.main && this.main.stop()
    this.sub && this.accompanyOn && this.sub.stop()
  }

  setWaveType(type) {
    this.main && (this.main.waveType = type)
    this.sub && this.accompanyOn && (this.sub.waveType = type)
  }

  // 切歌
  changeNotes(params) {
    this.song = params
    this.main && this.main.changeNotes(params)
    this.sub && this.accompanyOn && this.sub.changeNotes({ ...params, notes: params.accompany || [] })
  }
} 
