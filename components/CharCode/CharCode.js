export default class CharCode {
  static regTestUtf8 = /^(\\x[0-9a-f]{2})+$/i; // 验证是否是utf-8编码字符串
  static regMatchUtf8 = /\\x(?<code>[0-9a-f]{2})/ig; // 解析utf-8字符串的编码
  static regTestUnicode = /(\\u{[0-9a-f]{1,8}})+/i; // 验证是否是Unicode编码字符串
  static regMatchUnicode = /\\u{(?<code>[0-9a-f]{1,8})}/ig; // 解析Unicode字符串编码

  constructor() { }

  // 拼装unicode
  assembleUnicode = arr => {
    return parseInt(arr.join(''), 2);
    // return `\\u{${parseInt(arr.join(''), 2).toString(16)}}`;
  };

  // 接续unicode字符串 exp: \u{xxxx}
  parseUnicodeString(string) {
    const tempArr = [];
    if (CharCode.regTestUnicode.test(string) && string) {
      const matches = string.matchAll(CharCode.regMatchUnicode);
      for (let item of matches) {
        tempArr.push(+parseInt(item.groups.code, 16));
      }
    }

    return tempArr;
  }

  // 字符转unicode
  charsToUnicode(string) {
    if (!string) {
      return {
        string: '',
        codes: [],
      };
    }

    const codes = [];
    const codePoints = [];
    for (let char of string) {
      const point = char.codePointAt(0);
      codePoints.push(point);
      codes.push(`\\u{${point.toString(16)}}`);
    }
    return {
      string: codes.join(''),
      codes: codePoints,
    };
  }

  // utf-8转unicode
  utf8ToUnicode(string) {
    if (string && CharCode.regTestUtf8.test(string)) {
      // 编码转换
      const matches = Array.from(string.matchAll(CharCode.regMatchUtf8));
      const transfers = [];
      const multiBytesArr = [];

      for (let item of matches) {
        const code = parseInt(item.groups.code, 16);

        if ((code & 0b1000_0000) === 0b0000_0000) {
          // 单字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }

          multiBytesArr.length = 0;
          transfers.push(code);

        } else if ((code & 0b1110_0000) === 0b1100_0000) {
          // 2字节首字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }
          multiBytesArr.length = 0;
          multiBytesArr.push((code & 0b0001_1111).toString(2).padStart(5, '0'));

        } else if ((code & 0b1111_0000) === 0b1110_0000) {
          // 3字节首字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }
          multiBytesArr.length = 0;
          multiBytesArr.push((code & 0b0000_1111).toString(2).padStart(4, '0'));

        } else if ((code & 0b1111_1000) === 0b1111_0000) {
          // 4字节首字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }
          multiBytesArr.length = 0;
          multiBytesArr.push((code & 0b0000_0111).toString(2).padStart(3, '0'));

        } else if ((code & 0b1111_1100) === 0b1111_1000) {
          // 5字节首字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }
          multiBytesArr.length = 0;
          multiBytesArr.push((code & 0b0000_0011).toString(2).padStart(2, '0'));

        } else if ((code & 0b1111_1110) === 0b1111_1100) {
          // 6字节首字节
          if (multiBytesArr.length) {
            transfers.push(this.assembleUnicode(multiBytesArr));
          }
          multiBytesArr.length = 0;
          multiBytesArr.push((code & 0b0000_0001).toString(2).padStart(1, '0'));

        } else if ((code & 0b1100_0000) === 0b1000_0000) {
          // 多字节的剩余字节
          multiBytesArr.push((code & 0b0011_1111).toString(2).padStart(6, '0'));
        }
      }

      if (multiBytesArr.length) {
        transfers.push(this.assembleUnicode(multiBytesArr));
      }

      return {
        string: transfers.map(it => `\\u{${it.toString(16)}}`).join(''),
        codes: transfers,
      };
    }

    return {
      string: '',
      codes: []
    }
  }

  // unicode转utf-8
  unicodeToUtf8(unicode) {
    let unicodeArr = [];
    if (typeof unicode === 'string') {
      // 字符串
      unicodeArr = this.parseUnicodeString(unicode);
    } else {
      // unicode数组
      unicodeArr = unicode;
    }

    // 字符处理
    const utf8Arr = [];
    for (let code of unicodeArr) {
      code = +code;
      if (code <= 0x7f) {
        // 单字节
        utf8Arr.push(parseInt(code.toString(2).padStart(8, '0'), 2).toString(16));
      } else if (code <= 0x7ff) {
        // 2字节
        const bits = code.toString(2).padStart(11, '0');
        utf8Arr.push(parseInt('110' + bits.substr(0, 5), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(5), 2).toString(16));
      } else if (code <= 0xffff) {
        // 3字节
        const bits = code.toString(2).padStart(16, '0');
        utf8Arr.push(parseInt('1110' + bits.substr(0, 4), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(4, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(10), 2).toString(16));
      } else if (code <= 0x1fffff) {
        // 4字节
        const bits = code.toString(2).padStart(21, '0');
        utf8Arr.push(parseInt('11110' + bits.substr(0, 3), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(3, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(9, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(15), 2).toString(16));
      } else if (code <= 0x3ffffff) {
        // 5字节
        const bits = code.toString(2).padStart(26, '0');
        utf8Arr.push(parseInt('111110' + bits.substr(0, 2), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(2, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(8, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(14, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(20), 2).toString(16));
      } else if (code <= 0x7fffffff) {
        // 6字节
        const bits = code.toString(2).padStart(31, '0');
        utf8Arr.push(parseInt('1111110' + bits.substr(0, 1), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(1, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(7, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(13, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(19, 6), 2).toString(16));
        utf8Arr.push(parseInt('10' + bits.substr(25), 2).toString(16));
      }
    }

    return {
      string: utf8Arr.map(str => '\\x' + str).join(''),
    };
  }

  // unicode转字符
  unicodeToChars(unicode) {
    let unicodeArr = [];

    if (typeof unicode === 'string') {
      // 字符串
      unicodeArr = this.parseUnicodeString(unicode);
    } else {
      // unicode数组
      unicodeArr = unicode;
    }

    return {
      codes: unicodeArr,
      string: unicodeArr.reduce((str, item) => str + String.fromCodePoint(item), ''),
    }
  }
}