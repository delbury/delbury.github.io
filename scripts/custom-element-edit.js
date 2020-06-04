// ==UserScript==
// @name         Select Element
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       delbury
// @include      https://*
// @include      http://*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const queryList = [];
  loadConfig(); // 加载设置
  createStyle();
  const contextmenu = createCustomContextmenu();

  let hoveringEle = null; // 当前hover的元素
  let contextEle = null; // 右键点击的元素
  document.addEventListener('mousemove', ev => {
    // 动画效果
    if(ev.altKey && ev.target !== document.body && ev.target !== document.documentElement && !contextmenu.contains(ev.target)) {
      if(hoveringEle && hoveringEle !== ev.target) {
        hoverOverAnimate(hoveringEle);
      }
      hoveringEle = ev.target;
      hoverAnimate(hoveringEle);
    } else if(hoveringEle) {
      hoverOverAnimate(hoveringEle);
      hoveringEle = null;
    }
  });

  // click事件
  document.addEventListener('click', ev => {
    if(ev.altKey && hoveringEle) {
      ev.stopPropagation();
      ev.preventDefault();
      //
    }
  });

  // 鼠标事件
  document.addEventListener('mousedown', ev => {
    if(ev.altKey && ev.button === 2) {
      ev.stopPropagation();
      ev.preventDefault();
      if(hoveringEle) {
        contextEle = ev.target;
      }

      openCustomContextmenu(ev.clientX, ev.clientY);
    } else {
      // 关闭
      if(contextmenu.dataset.hidden === 'false') {
        if(!contextmenu.contains(ev.target)) {
          closeCustomContextmenu();
        }
      }
    }
  });
  document.addEventListener('contextmenu', ev => {
    if(ev.altKey) {
      ev.stopPropagation();
      ev.preventDefault();
    } else {
      closeCustomContextmenu();
    }
  })

  // 关闭右键菜单
  function closeCustomContextmenu() {
    contextEle = null;
    contextmenu.dataset.hidden = true;
    contextmenu.classList.add('custom-hidden');
  }
  // 打开右键菜单
  function openCustomContextmenu(x, y) {
    contextmenu.dataset.hidden = false;
    contextmenu.style.left = x + 'px';
    contextmenu.style.top = y + 'px';
    contextmenu.classList.remove('custom-hidden');
    if(contextEle) {
      // 启用
      contextmenu.querySelectorAll('li[data-ctrltype=selected]').forEach(function(ele) {ele.dataset.disabled = false});

    } else {
      // 禁用部分按钮
      contextmenu.querySelectorAll('li[data-ctrltype=selected]').forEach(function(ele) {ele.dataset.disabled = true});
    }
  }

  // 创建右键菜单栏
  function createCustomContextmenu() {
    const ul = document.createElement('ul');
    ul.className = 'custom-contentmenu custom-hidden';
    ul.dataset.hidden = 'true';

    // 隐藏元素
    const itemHidden = document.createElement('li');
    itemHidden.dataset.ctrltype = 'selected';
    itemHidden.innerHTML = '隐藏';
    itemHidden.onmousedown = ev => {
      if(contextEle && itemHidden.dataset.disabled !== 'true') {
        const selected = getLonelyParent(contextEle);
        const query = assembleQuery(selected);
        selected.style.display = 'none';
        queryList.push({
          query,
          hidden: true
        });
        closeCustomContextmenu();
        saveConfig();
      }

    };
    ul.appendChild(itemHidden);

    // 删除元素
    const itemDelete = document.createElement('li');
    itemDelete.dataset.ctrltype = 'selected';
    itemDelete.innerHTML = '删除';
    itemDelete.onmousedown = ev => {
      if(contextEle && itemDelete.dataset.disabled !== 'true') {
        const selected = getLonelyParent(contextEle);
        const query = assembleQuery(selected);
        selected.remove();
        queryList.push({
          query,
          remove: true
        });
        closeCustomContextmenu();
        saveConfig();
      }
    };
    ul.appendChild(itemDelete);

    // 分割线
    const divder = document.createElement('li');
    divder.className = 'divder';
    ul.appendChild(divder);

    // 清除隐藏
    const itemClearAll = document.createElement('li');
    itemClearAll.dataset.ctrltype = 'haslist';
    itemClearAll.innerHTML = '清除全部';
    itemClearAll.onmousedown = ev => {
      if(itemClearAll.dataset.disabled !== 'true') {
        queryList.length = 0;
        clearConfig();
        window.location.reload();
      }
    };
    ul.appendChild(itemClearAll);

    document.body.appendChild(ul);
    return ul;
  }

  // 读取设置
  function loadConfig() {
    queryList.length = 0;
    const json = window.localStorage.getItem('customElementConfig');
    if(json) {
      try {
        const arr = JSON.parse(json);
        queryList.push(...arr);
        queryList.forEach(item => {
          document.querySelectorAll(item.query).forEach(ele => {
            if(item.remove) {
              // 删除
              ele.remove();
            } else if(item.hidden) {
              // 隐藏
              ele.style.display = 'none';
            }
          });
        });
      } catch(err) {
        console.log(err);
      }
    }

  }

  // 保存设置
  function saveConfig() {
    window.localStorage.setItem('customElementConfig', JSON.stringify(queryList));
  }

  // 清除设置
  function clearConfig() {
    window.localStorage.removeItem('customElementConfig');
  }

  // 根据元素拼装其query条件
  function assembleQuery(ele) {
    let query = '';
    while(ele) {
      let sub = ele.tagName.toLowerCase();

      if(ele.id) {
        // id
        sub += `#${ele.id}`;
      }
      if(ele.classList.length) {
        // class
        ele.classList.forEach(function (name){sub += `.${name}`});
      }
      ele = ele.parentElement;
      if(query) {
        query = `${sub}>${query}`;
      } else {
        query = sub;
      }
      if(ele === document.body) {
        ele = null;
        query = 'body>' + query;
      }
    }
    return query;
  }

  // 获取其只有一个子元素的父元素，或自身
  function getLonelyParent(ele) {
    let current = ele;
    let currentSize = current.getBoundingClientRect();
    let parentSize = current.parentElement.getBoundingClientRect();
    while(
      current.parentElement &&
      current.parentElement !== document.body &&
      current.parentElement.children.length === 1 &&
      currentSize.width === parentSize.width &&
      currentSize.heigth === parentSize.heigth
    ) {
      current = current.parentElement;
      currentSize = current.getBoundingClientRect();
      parentSize = current.parentElement.getBoundingClientRect();
    }

    return current;
  }

  // hover动画
  function hoverAnimate(ele) {
    ele.classList.add('select-element-hover');
  }
  // hover结束动画
  function hoverOverAnimate(ele) {
    ele.classList.remove('select-element-hover');
    ele.classList.add('select-element-hover-over');
    const fn = () => {
      ele.classList.remove('select-element-hover-over');
      ele.removeEventListener('transitionend', fn);
    };
    ele.addEventListener('transitionend', fn);
  }
  // 创建样式
  function createStyle() {
    const style = document.createElement('style');
    style.innerHTML = `
.select-element-hover {
  background-color: #ccc !important;
  box-shadow: 3px 3px 3px #666;
  transition-property: background-color, box-shadow;
  transition-duration: 200ms;
  cursor: default;
}
.select-element-hover-over {
  box-shadow: none;
  transition: box-shadow 100ms;
}
.custom-contentmenu {
  position: fixed;
  margin: 0;
  padding: 5px 0;
  width: 8em;
  border: 1px solid #888;
  list-style: none;
  font-size: 12px;
  border-radius: 3px;
  box-shadow: 2px 2px 3px #bbb;
  overflow: hidden;
  z-index: 999999;
  background-color: #fff;
}
.custom-contentmenu>li {
  box-sizing: border-box;
  padding: 5px 10px;
  background-color: #fff;
  cursor: default;
  user-select: none;
}
.custom-contentmenu>li[data-disabled=true] {
  color: #ccc;
}
.custom-contentmenu>li.divder {
  padding: 0;
  margin: 5px 0;
  border-bottom: 1px dashed #ccc;
}
.custom-contentmenu>li:hover:not(.divder):not([data-disabled=true]) {
  background-color: #ddd;
}
.custom-hidden {
  display: none !important;
}
    `;
    document.head.appendChild(style);
  }
})();