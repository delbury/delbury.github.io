import { getDom } from './utils.js';

/**
 * 用于自动保存数据到本地
 * @param {*} dataKey
 */
function getAutoSaveTools() {
  // 挂载到 window 下
  if (window.autoSaveTools) {
    return window.autoSaveTools;
  }

  const localKey = '__auto_save';
  const localData = (() => {
    let res = {};
    try {
      res = JSON.parse(localStorage.getItem(localKey)) ?? res;
    } catch {
      localStorage.removeItem(localKey);
    }
    return res;
  })();
  const save = (key, val) => {
    localData[key] = val;
    localStorage.setItem(localKey, JSON.stringify(localData));
  };

  const clear = () => {
    localStorage.removeItem(localKey);
    location.reload();
  };

  window.autoSaveTools = {
    data: localData,
    save,
    clear,
  };
  return window.autoSaveTools;
}

/**
 * 代理 input 元素
 * @param {*} dom
 */
function proxyInputElement(
  dom,
  {
    defaultValue,
    onchange,
    // 表示值的字段 key，一般为 value，复选框可设置为 checked
    valueField = 'value',
    // input radio：dom 需要是 radio 的父元素，监听父元素的 onchange
    radioName,
    // 自动将值保存到本地，可以取字符串值，表示指定保存的字段名
    autoSave = true,
    // 是否在初始化的时候执行一次 onchange
    triggerAtInit = false,
    // 输入的值格式化方法
    inputValueFormatter,
  } = {}
) {
  dom = getDom(dom);

  // 保存在本地的配置，优先级高于默认值
  const ast = autoSave ? getAutoSaveTools() : null;
  const autoSaveField = typeof autoSave === 'string' ? autoSave : dom.id;
  if (autoSave && !autoSaveField) {
    console.error('auto save: some input config has no field name');
  }

  // 设置 dom 的值
  const setDomValue = (elm, v) => {
    if (radioName) {
      // radio wrapper 元素
      document.querySelectorAll(`input[name="${radioName}"]`).forEach((radio) => (radio.checked = radio.value === v));
    } else {
      // 一般的 input 元素
      elm[valueField] = v;
    }
  };

  // 事件函数
  const handleChange = (val, dom) => {
    onchange?.(val, dom);
    callbackSet.forEach((cb) => cb(val, dom));
  };

  const initValue = autoSave ? ast?.data[autoSaveField] ?? defaultValue : defaultValue;
  const data = new Proxy(
    { value: initValue, dom },
    {
      set(obj, prop, val) {
        if (obj[prop] !== val) {
          switch (prop) {
            case 'value':
              setDomValue(dom, val);
              handleChange(val, dom);
              autoSave && ast?.save(autoSaveField, val);
              break;
            default:
              break;
          }
        }
        return Reflect.set(...arguments);
      },
    }
  );

  const fnChange = (ev) => {
    if (ev.target.tagName === 'INPUT') {
      data.value = inputValueFormatter ? inputValueFormatter(ev.target[valueField]) : ev.target[valueField];
      setDomValue(dom, data.value);
    }
  };

  setDomValue(dom, initValue);
  // 监听 change 事件
  dom.addEventListener('change', fnChange);
  data.removeEvent = () => dom.removeEventListener('change', fnChange);
  // 发布订阅
  const callbackSet = new Set();
  data.on = (cb) => callbackSet.add(cb);
  data.off = (cb) => callbackSet.delete(cb);
  data.once = (cb) => {
    const fn = () => {
      cb();
      callbackSet.delete(fn);
    };
    callbackSet.add(fn);
  };
  data.clear = () => callbackSet.clear();

  triggerAtInit && handleChange(data.value, dom);
  return data;
}

/**
 * 监听 input 代理值的改变
 * @param {*} input
 * @param {*} callback
 */
function watchInputValue(input, callback, { triggerAtInit = false } = {}) {
  input.on(callback);
  triggerAtInit && callback(input.value, input.dom);
  return () => input.off(callback);
}

/**
 * 监听 inputs 代理值的改变
 * @param {*} inputs
 * @param {*} callback
 */
function watchInputValues(inputs, callback, { triggerAtInit = false } = {}) {
  // 考虑做一些合并操作
  inputs.forEach((input, index) => {
    input.on((val, dom) => {
      const vals = inputs.map((it) => it.value);
      const doms = inputs.map((it) => it.dom);
      vals[index] = val;
      doms[index] = dom;
      callback(vals, doms);
    });

    triggerAtInit &&
      callback(
        inputs.map((it) => it.value),
        inputs.map((it) => it.dom)
      );
  });
  return () => inputs.forEach((input) => input.off(callback));
}

export { proxyInputElement, watchInputValue, watchInputValues };
