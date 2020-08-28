export default class PerformanceMonitor {
  #funcAssignReg = /(?<name>[_$a-zA-Z0-9]+)\s*=\s*function(\s+[_$a-zA-Z0-9]+\s*|\s*)\((?<args>.*)\)\s*\{(?<codes>.*)\}/s; // const funcName = function xxx() {}赋值形式
  #funcArrowReg = /(?<name>[_$a-zA-Z0-9]+)\s*=\s*\((?<args>.*)\)\s*=>\s*\{(?<codes>.*)\}/s; // const funcName = () => {} 箭头函数形式
  #funcNormalReg = /function\s+(?<name>[_$a-zA-Z0-9]+)\s*\((?<args>.*)\)\s*\{(?<codes>.*)\}/s; // function funcName() {} 声明形式

  constructor() {
    this.codes = null;
  }

  // 解析运行代码字符串
  runCode(codes, cases = []) {
    this.setCodes(codes);

    const res = this.parseFuncString(codes);
    if(res) {
      const mainFunc = Function(res.args, res.codes);

      performance.mark('testStart');
      this.runTestCases(mainFunc, cases);
      performance.mark('testEnd');
      const measure = performance.measure('test', 'testStart', 'testEnd');

      console.log(measure);
      console.log(`run time: ${measure.duration}ms`);
    }
  }

  // 运行测试代码
  runTestCases(fn , cases) {
    for(let args of cases) {
      fn(...args);
    }
  }

  // 设置codes
  setCodes(codes) {
    this.codes = codes;
  }

  // 解析函数字符串
  parseFuncString(codes) {
    const matched = codes.match(this.#funcNormalReg) || codes.match(this.#funcArrowReg) || codes.match(this.#funcAssignReg);

    return matched?.groups ?? null;
  }
}