export const calcBezier = (nums = 10, x1 = 0, y1 = 0.5, x2 = 1, y2 = 0.5) => {
  let arr = [];
  // const fn = (t, xy1, xy2) => 3 * xy1 * t * (1 - t ** 2) + 3 * xy2 * (t ** 2) * (1 - t) + t ** 3;
  const fn = (t, xy1, xy2) => 3 * xy1 * (1 - 3 * t ** 2) + 3 * xy2 * (2 * t - 3 * t ** 2) + 3 * t ** 2;
  let max = 0;
  for(let i = 0; i < nums; i++) {
    const x = fn(i / (nums - 1), x1, x2);
    // const y = fn(i / nums, y1, y2);
    arr.push(x);
    if(x > max) max = x;
  }
  arr = arr.map(item => item /= max);
  return arr;
};