export class BaseKey {
  constructor() {
    this.keyElement = document.createElement('div')
  }
}

export class BlackKey extends BaseKey {
  constructor(props) {
    super(props)
    this.keyElement.className = 'key-black'
  }
}

export class WhiteKey extends BaseKey {
  constructor(props = {}) {
    super(props)
    const { hasSubkey } = props
    this.keyElement.className = 'key-white'

    if(hasSubkey) {
      this.subkey = new BlackKey()
      this.keyElement.appendChild(this.subkey.keyElement)
    }
  }
}

export class Keyboard {
  constructor(target = '#piano-keyboard', keyArr = [1, 1, 0, 1, 1, 1, 0]) {
    this.target = target
    this.keyArr = keyArr
    this.keyboardElement = this.createKeyboardElement(target) // 获取或创建根元素
    this.keyElements = this.createKeys() // 创建按键
  }

  // 创建按键
  createKeys() {
    this.keys = this.keyArr.map(item => {
      const wk = new WhiteKey({ hasSubkey: item === 1 })
      this.keyboardElement.appendChild(wk.keyElement)
      return wk
    })
  }

  // 创建键盘根元素
  createKeyboardElement(target) {
    if(typeof target !== 'string') {
      throw new TypeError('必须传入选择器字符串！')
    }
    let ele = document.querySelector(target)
    if(!ele) {
      ele = document.createElement('div')
      ele.className = 'piano-keyboard'
    }
    return ele
  }
}

export class Piano {
  constructor({ target, keyArr } = {}) {
    this.keybord = null

    this.init()
  }

  init(target, keyArr) {
    this.keybord = new Keyboard(target, keyArr)
  }
}
