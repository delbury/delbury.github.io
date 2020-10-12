// ==UserScript==
// @name         Right Click Drag
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  右键拖动可滚动元素
// @author       delbury
// @include      https://*
// @include      http://*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const moveScale = 1.5; // 拖动距离与滚动距离的系数

  let originPosition = null; // 开始原点位置
  let moveFlag = false; // 移动标志
  let startFlag = false; // 开始标志
  let scrollElement = null; // 当前滚动元素
  let currentScrollPosition = null; // 当前的滚动元素的滚动位置

  // 构造style
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = '.scroll-grabbing { cursor: grabbing !important; }';
  document.head.appendChild(style);

  const fnMove = ev => {
    if(!startFlag) return;

    if(!moveFlag && ((ev.screenX - originPosition.x) ** 2 + (ev.screenY - originPosition.y) ** 2 > 0)) {
      moveFlag = true;
      document.body.classList.add('scroll-grabbing');
    }

    // 拖动滚动
    if(moveFlag && scrollElement) {
      const dx = ev.screenX - originPosition.x;
      const dy = ev.screenY - originPosition.y;

      scrollElement.scrollTo(currentScrollPosition.x - dx * moveScale, currentScrollPosition.y - dy * moveScale);
    }
  };

  // 松开鼠标清除事件
  document.addEventListener('mouseup', ev => {
    // document.removeEventListener('mousemove', fnMove);
    startFlag = false;
    scrollElement = null;
    document.body.classList.remove('scroll-grabbing');
  });

  // 鼠标移动事件
  document.addEventListener('mousemove', fnMove);

  // 判断阻止默认右键菜单
  document.addEventListener('contextmenu', ev => {
    if(moveFlag) {
      ev.preventDefault();
    }
  });

  // 右键拖动开始
  document.addEventListener('mousedown', ev => {
    if(ev.button === 2) {
      originPosition = null;
      moveFlag = false;
      startFlag = true;

      originPosition = {
        x: ev.screenX,
        y: ev.screenY,
      };

      // 寻找可拖动元素
      scrollElement = findScrollableElement(ev.target);
      if(scrollElement) {
        currentScrollPosition = {
          x: scrollElement.scrollLeft,
          y: scrollElement.scrollTop,
        };
      }

      // document.addEventListener('mousemove', fnMove);
    }
  });


  // 向上寻找可滚动元素
  function findScrollableElement(current) {
    while(current && current !== document.body) {
      if(current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth) {
        const { overflowX, overflowY } = getComputedStyle(current);
        if(overflowX === 'auto' || overflowX === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') {
          break;
        }
      }

      current = current.parentElement;
    }

    return current === document.body ? document.documentElement : current;
  }
})();