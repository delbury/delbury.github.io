// 获取 dom
export const getDom = (dom) => (typeof dom === 'string' ? document.querySelector(dom) : dom);

// 获取区间随机整数
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
