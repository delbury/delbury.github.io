// ==UserScript==
// @name         Swagger Click Copy
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        http://*/swagger-ui.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const tagClassName = 'opblock-tag';
    const stopClassName = 'wrapper'; // 向上查找到的根节点
    const itemClassName = '.opblock';
    const parentClassName = 'opblock-tag-section';
    const btnClassName = 'btn-copy-url';
    const btnSuccessClassName = 'btn-copy-url-success';
    const btnContainerClassName = 'btn-container';

    createStyle();
    const inputEle = createInput();

    document.addEventListener('click', (ev) => {
        let node = ev.target;
        let flag = false;
        while(node && node.className !== stopClassName) {
            if(node.className === tagClassName) {
                flag = true;
                break;
            }
            node = node.parentNode;
        }

        // 点击中
        if(flag) {
            // node.dataset.existed = true;
            let parent = node;

            window.setTimeout(() => {
                while(!parent.classList.contains(parentClassName)) {
                    parent = node.parentNode;
                    if(parent === document.body) {
                        parent = null;
                        break;
                    }
                }
                if(parent) {
                    const eles = parent.querySelectorAll(itemClassName);
                    eles.forEach(el => {
                        // 插入按钮
                        // el.classList.add(btnContainerClassName);
                        const container = el.querySelector('.opblock-summary');
                        const button = document.createElement('button');
                        button.innerHTML = '<div><div class="clickable">复制</div><div>成功</div></div>';
                        button.className = btnClassName;
                        button.querySelector('.clickable').onclick = ev => {
                            inputEle.value = el.querySelector('.opblock-summary-path>a>span').innerText;
                            inputEle.select();

                            if(document.execCommand('copy')) {
                                // 成功
                                button.classList.add(btnSuccessClassName);
                                // button.innerHTML = '成功';
                                button.ontransitionend = ev => {
                                    button.ontransitionend = null;
                                    button.classList.remove(btnSuccessClassName);
                                    // button.innerHTML = '复制';
                                };
                            }
                          ev.stopPropagation();
                        };

                        container.prepend(button);
                    });
                }
            }, 0);
        }
    });

    // 创建隐藏的input
    function createInput() {
        const input = document.createElement('input');
        input.style.cssText = 'opacity: 0; position: relative; z-index: -1;'
        document.body.appendChild(input);
        return input;
    }

    // 创建样式
    function createStyle() {
        const style = document.createElement('style');
        style.innerHTML = `
.${btnClassName} {
  padding: 0 !important;
  margin-left: 5px !important;
  margin-right: 10px !important;
  height: 24px !important;
  line-height: 24px !important;
  outline: none !important;
  border-radius: 5px !important;
  color: #fff;
  border: none;
  font-size: 90% !important;
  overflow: hidden !important;
}

.${btnClassName}>div>div:nth-of-type(1):hover {
  background-color: #46a6ff !important;
}
.${btnClassName}>div>div:nth-of-type(1):active {
  background-color: #1682e6 !important;
}

.${btnClassName}>div>div {
  height: 100%;
  padding: 0 5px !important;
}

.${btnSuccessClassName}>div {
  transform: translateY(-24px) !important;
}

.${btnClassName}>div>div:nth-of-type(1) {
  background-color: #1890ff !important;
}
.${btnClassName}>div>div:nth-of-type(2) {
  background-color: #13c1a3 !important;
}

.${btnClassName}>div{
  height: 100%;
  transition: all 1s ease;
  transform: translateY(0px);
}
`;
        document.head.appendChild(style);
    }
})();











