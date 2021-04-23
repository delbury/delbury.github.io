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

  if(!document.head || !document.body) return;

  const moveScale = 1.5; // 拖动距离与滚动距离的系数

  let originPosition = null; // 开始原点位置
  let moveFlag = false; // 移动标志
  let startFlag = false; // 开始标志
  let scrollElement = null; // 当前滚动元素
  let currentScrollPosition = null; // 当前的滚动元素的滚动位置
  let frameCb = null; // 帧回调 handler

  // 构造style
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = '.scroll-grabbing { cursor: grabbing !important; } .will-scroll { will-change: scroll-position; }';
  document.head.appendChild(style);

  const fnMove = ev => {
    if(!startFlag) return;

    if(!moveFlag) {
      // ((ev.screenX - originPosition.x) ** 2 + (ev.screenY - originPosition.y) ** 2 > 0) // 移动范围控制
      moveFlag = true;
      document.body.classList.add('scroll-grabbing');
    }

    // 拖动滚动
    if(moveFlag && scrollElement) {
      const dx = ev.screenX - originPosition.x;
      const dy = ev.screenY - originPosition.y;

      if(!frameCb) {
        frameCb = requestAnimationFrame(() => {
          scrollElement && scrollElement.scrollTo(currentScrollPosition.x - dx * moveScale, currentScrollPosition.y - dy * moveScale);
          frameCb = null;
        });
      }
    }
  };

  // 松开鼠标清除事件
  document.addEventListener('mouseup', ev => {
    // document.removeEventListener('mousemove', fnMove);
    startFlag = false;

    scrollElement && scrollElement.classList.remove('will-scroll');
    scrollElement = null;

    frameCb = null;

    document.body.classList.remove('scroll-grabbing'); // scroll-grabbing
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
        scrollElement.classList.add('will-scroll');
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
    while(current) {
      if(current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth) {
        const { overflowX, overflowY } = getComputedStyle(current);
        if(overflowX === 'auto' || overflowX === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') {
          return current;
        }
      }

      current = current.parentElement;
    }

    return document.documentElement;
  }
})();