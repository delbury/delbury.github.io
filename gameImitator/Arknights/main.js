(() => {
  // const pieces = new Pieces({
  //   canvas: '#canvas',
  //   text: 'Hello World',
  //   items: [0]
  // });

  // pieces.showPieces();

  bindSystemTime(); // 绑定显示时间的元素

  function bindSystemTime() {
    const ele = document.getElementById('system-time');
    ele.innerText = getCurrentDateTime();

    const fn = () => {
      setTimeout(() => {
        ele.innerText = getCurrentDateTime();
        return fn();
      }, 1000);
    };
    fn();
  }

  function getCurrentDateTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${year}/${month}/${day} ${hour}:${minute}`;
  }
})();