// 获取 dom
export const getDom = (dom) => (typeof dom === 'string' ? document.querySelector(dom) : dom);

// 获取区间随机整数
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 判断字符的宽度
export const getCharWidth = (char) => {
  if (char >= '\u4e00' && char <= '\u9fa5') {
    // 中文字符
    return 2;
  } else if (char >= '\u0800' && char <= '\u4e00') {
    // 日文、汉字补充、汉字扩展
    return 2;
  } else if (char >= '\u0080' && char <= '\u07ff') {
    // 拉丁文扩展、希腊文、西里尔文、亚美尼亚文、希伯来文、阿拉伯文等
    return 1;
  } else {
    // 基本拉丁文 (ASCII)
    return 1;
  }
};

export const getCharsWidthRange = (chars) => {
  let max = 1;
  let min = 1;
  for (let i = 0; i < chars.length; i++) {
    max = Math.max(max, getCharWidth(chars[i]));
    min = Math.min(min, getCharWidth(chars[i]));
  }
  return { min, max };
};

export const pickBy = (obj, keys) => {
  if (!keys?.length || typeof obj !== 'object') return obj;
  const set = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => set.has(k)));
};
