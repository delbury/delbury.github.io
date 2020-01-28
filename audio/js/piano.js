/**
 * @description 模拟钢琴
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 * 简谱：1 /       / 2 /       / 3 / 4 /       / 5 /       / 6 /       / 7
 */
import { NotePlay } from './music/NotePlay.js'

// 按键音符名map
const keyToName = [
  ['a', 'C4'],
  ['s', 'D4'],
  ['d', 'E4'],
  ['f', 'F4'],
  ['g', 'G4'],
  ['h', 'A4'],
  ['j', 'B4'],
  ['w', '#C4'],
  ['e', '#D4'],
  ['t', '#F4'],
  ['y', '#G4'],
  ['u', '#A4'],

  ['a+s', 'C5'],
  ['s+s', 'D5'],
  ['d+s', 'E5'],
  ['f+s', 'F5'],
  ['g+s', 'G5'],
  ['h+s', 'A5'],
  ['j+s', 'B5'],
  ['w+s', '#C5'],
  ['e+s', '#D5'],
  ['t+s', '#F5'],
  ['y+s', '#G5'],
  ['u+s', '#A5'],

  ['a+c', 'C6'],
  ['s+c', 'D6'],
  ['d+c', 'E6'],
  ['f+c', 'F6'],
  ['g+c', 'G6'],
  ['h+c', 'A6'],
  ['j+c', 'B6'],
  ['w+c', '#C6'],
  ['e+c', '#D6'],
  ['t+c', '#F6'],
  ['y+c', '#G6'],
  ['u+c', '#A6'],

  // 小键盘，简谱
  ['1', 'C4'],
  ['2', 'D4'],
  ['3', 'E4'],
  ['4', 'F4'],
  ['5', 'G4'],
  ['6', 'A4'],
  ['7', 'B4'],

  ['1+s', 'C5'],
  ['2+s', 'D5'],
  ['3+s', 'E5'],
  ['4+s', 'F5'],
  ['5+s', 'G5'],
  ['6+s', 'A5'],
  ['7+s', 'B5'],

  ['1+c', 'C6'],
  ['2+c', 'D6'],
  ['3+c', 'E6'],
  ['4+c', 'F6'],
  ['5+c', 'G6'],
  ['6+c', 'A6'],
  ['7+c', 'B6'],
]

export class BaseKey {
  constructor(actx, name, leve) {
    // this.level = leve || 4
    this.actx = actx
    this.keyName = name
    this.innerClass = 'key-inner'

    this.note = new NotePlay(actx, `${name} q`)

    this.keyBoxElement = document.createElement('div') // 外层
    this.keyElement = document.createElement('div') // 按键
    this.keyElement.className = this.innerClass
    this.keyBoxElement.appendChild(this.keyElement)
  }

  keydown() {
    this.keyElement.classList.add('is-keydown')
    this.play()
  }

  keyup() {
    this.keyElement.classList.remove('is-keydown')
  }

  play() {
    this.note.play()
  }
}

export class BlackKey extends BaseKey {
  constructor(...props) {
    super(...props)
    this.keyBoxElement.className = 'key-black'
  }
}

export class WhiteKey extends BaseKey {
  constructor(actx, { keyName, subkeyName, hasSubkey, level } = {}) {
    super(actx, keyName, level)
    this.keyBoxElement.className = 'key-white'

    if (hasSubkey) {
      this.subkey = new BlackKey(actx, subkeyName, level)
      this.keyBoxElement.appendChild(this.subkey.keyBoxElement)
    }
  }
}

export class Keyboard {
  constructor(actx, target = '#piano-keyboard', keyArr) {
    this.actx = actx
    this.target = target
    this.keyArr = keyArr
    this.keyNameMap = new Map(keyToName) // 按键和音名对应
    this.keyInstanceMap = new Map()

    this.reg = new RegExp(`^[${(Array.from(this.keyNameMap.keys())).join('')}]{1}$`, 'i') // 按键筛选正则

    this.keyboardElement = this.createKeyboardElement(target) // 获取或创建根元素
    this.createKeys() // 创建按键
  }

  // 创建按键
  createKeys() {
    this.keyArr.forEach(item => {
      const wk = new WhiteKey(this.actx, item)
      this.keyboardElement.appendChild(wk.keyBoxElement)

      if (item.hasSubkey) {
        this.keyInstanceMap.set(item.subkeyName, wk.subkey)
      }
      this.keyInstanceMap.set(item.keyName, wk)
    })
  }

  // 创建键盘根元素
  createKeyboardElement(target) {
    if (typeof target !== 'string') {
      throw new TypeError('必须传入选择器字符串！')
    }
    let ele = document.querySelector(target)
    if (!ele) {
      ele = document.createElement('div')
      ele.className = 'piano-keyboard'
    }
    return ele
  }

  // 键盘按下事件
  keydownEvent(ev) {
    const key = ev.key
    if(key === 'Alt' || key === 'Control') {
      ev.preventDefault()
    }
    if (this.reg.test(key)) {
      ev.preventDefault()

      let name = ''
      if(ev.ctrlKey) {
        name = this.keyNameMap.get(key.toLowerCase() + '+c')
      } else if(ev.altKey) {
        name = this.keyNameMap.get(key.toLowerCase() + '+s')
      } else {
        name = this.keyNameMap.get(key.toLowerCase())
      }
      if (name) {
        const instance = this.keyInstanceMap.get(name)
        instance ? instance.keydown() : ''
      }
    }
  }

  // 键盘松开事件
  keyupEvent(ev) {
    const key = ev.key
    if(key === 'Alt' || key === 'Control') {
      ev.preventDefault()
    }
    if (this.reg.test(key)) {
      ev.preventDefault()
      const names = [
        this.keyNameMap.get(key.toLowerCase() + '+c'),
        this.keyNameMap.get(key.toLowerCase() + '+s'),
        this.keyNameMap.get(key.toLowerCase())
      ]
      names.map(name => {
        const instance = this.keyInstanceMap.get(name)
        instance ? instance.keyup() : ''
      })
    }
  }

  // 绑定控制器
  bindControl() {
    document.addEventListener('keydown', this.keydownEvent.bind(this))
    document.addEventListener('keyup', this.keyupEvent.bind(this))
  }

  // 移出控制器事件
  removeControl() {
    document.removeEventListener('keydown', this.keydownEvent.bind(this))
    document.removeEventListener('keyup', this.keyupEvent.bind(this))
  }
}

export class Piano {
  constructor({ target, keyArr } = {}) {
    this.keybord = null
    this.actx = new AudioContext()

    this.init()
  }

  init(target, keyArr) {
    const fn = (n) => [
      // 4
      { hasSubkey: true, keyName: 'C4', subkeyName: '#C4', level: n },
      { hasSubkey: true, keyName: 'D4', subkeyName: '#D4', level: n },
      { hasSubkey: false, keyName: 'E4', level: n },
      { hasSubkey: true, keyName: 'F4', subkeyName: '#F4', level: n },
      { hasSubkey: true, keyName: 'G4', subkeyName: '#G4', level: n },
      { hasSubkey: true, keyName: 'A4', subkeyName: '#A4', level: n },
      { hasSubkey: false, keyName: 'B4', level: n },
      // 5
      { hasSubkey: true, keyName: 'C5', subkeyName: '#C5', level: n },
      { hasSubkey: true, keyName: 'D5', subkeyName: '#D5', level: n },
      { hasSubkey: false, keyName: 'E5', level: n },
      { hasSubkey: true, keyName: 'F5', subkeyName: '#F5', level: n },
      { hasSubkey: true, keyName: 'G5', subkeyName: '#G5', level: n },
      { hasSubkey: true, keyName: 'A5', subkeyName: '#A5', level: n },
      { hasSubkey: false, keyName: 'B5', level: n },
      // 6
      { hasSubkey: true, keyName: 'C6', subkeyName: '#C6', level: n },
      { hasSubkey: true, keyName: 'D6', subkeyName: '#D6', level: n },
      { hasSubkey: false, keyName: 'E6', level: n },
      { hasSubkey: true, keyName: 'F6', subkeyName: '#F6', level: n },
      { hasSubkey: true, keyName: 'G6', subkeyName: '#G6', level: n },
      { hasSubkey: true, keyName: 'A6', subkeyName: '#A6', level: n },
      { hasSubkey: false, keyName: 'B6', level: n },
    ]
    keyArr = keyArr || fn()
    this.keybord = new Keyboard(this.actx, target, keyArr)
    this.keybord.bindControl()
  }
}
