/**
 * @description 模拟钢琴
 * 音名：C / #C,bD / D / #D,bE / E / F / #F,bG / G / #G,bA / A / #A,bB / B
 * 简谱：1 /       / 2 /       / 3 / 4 /       / 5 /       / 6 /       / 7
 */
export class BaseKey {
  constructor(name) {
    this.keyName = name
    this.innerClass = 'key-inner'

    this.keyBoxElement = document.createElement('div') // 外层
    this.keyElement = document.createElement('div') // 按键
    this.keyElement.className = this.innerClass
    this.keyBoxElement.appendChild(this.keyElement)
  }

  keydown() {
    this.keyElement.classList.add('is-keydown')
  }

  keyup() {
    this.keyElement.classList.remove('is-keydown')
  }
}

export class BlackKey extends BaseKey {
  constructor(props) {
    super(props)
    this.keyBoxElement.className = 'key-black'
  }
}

export class WhiteKey extends BaseKey {
  constructor({ keyName, subkeyName, hasSubkey } = {}) {
    super(keyName)
    this.keyBoxElement.className = 'key-white'

    if (hasSubkey) {
      this.subkey = new BlackKey(subkeyName)
      this.keyBoxElement.appendChild(this.subkey.keyBoxElement)
    }
  }
}

export class Keyboard {
  constructor(target = '#piano-keyboard', keyArr) {
    this.target = target
    this.keyArr = keyArr
    this.keyNameMap = new Map([
      ['a', 'C'],
      ['s', 'D'],
      ['d', 'E'],
      ['f', 'F'],
      ['g', 'G'],
      ['h', 'A'],
      ['j', 'B'],
      ['w', '#C'],
      ['e', '#D'],
      ['t', '#F'],
      ['y', '#G'],
      ['u', '#A'],

      // 小键盘，简谱
      ['1', 'C'],
      ['2', 'D'],
      ['3', 'E'],
      ['4', 'F'],
      ['5', 'G'],
      ['6', 'A'],
      ['7', 'B'],
    ]) // 按键和音名对应
    this.keyInstanceMap = new Map()

    this.reg = new RegExp(`^[${(Array.from(this.keyNameMap.keys())).join('')}]{1}$`, 'i') // 按键筛选正则

    this.keyboardElement = this.createKeyboardElement(target) // 获取或创建根元素
    this.createKeys() // 创建按键
  }

  // 创建按键
  createKeys() {
    this.keyArr.forEach(item => {
      const wk = new WhiteKey(item)
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
    if (this.reg.test(key)) {
      const name = this.keyNameMap.get(key.toLowerCase())
      if (name) {
        const instance = this.keyInstanceMap.get(name)
        instance ? instance.keydown() : ''
      }
    }
  }

  // 键盘松开事件
  keyupEvent(ev) {
    const key = ev.key
    if (this.reg.test(key)) {
      const name = this.keyNameMap.get(key.toLowerCase())
      if (name) {
        const instance = this.keyInstanceMap.get(name)
        instance ? instance.keyup() : ''
      }
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

    this.init()
  }

  init(target, keyArr) {
    keyArr = keyArr || [
      { hasSubkey: true, keyName: 'C', subkeyName: '#C' },
      { hasSubkey: true, keyName: 'D', subkeyName: '#D' },
      { hasSubkey: false, keyName: 'E' },
      { hasSubkey: true, keyName: 'F', subkeyName: '#F' },
      { hasSubkey: true, keyName: 'G', subkeyName: '#G' },
      { hasSubkey: true, keyName: 'A', subkeyName: '#A' },
      { hasSubkey: false, keyName: 'B' },
    ]
    this.keybord = new Keyboard(target, keyArr)
    this.keybord.bindControl()
  }
}
