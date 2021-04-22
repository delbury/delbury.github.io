/**
 * 创建 web component
 */

(function() {
  class LiItem extends HTMLElement {
    constructor() {
      super();
      const temp = document.getElementById('temp-li-item');
      const tempContent = temp.content.cloneNode(true);
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.append(tempContent); 
    }

    // 属性变化回调
    attributeChangedCallback(key, oldVal, newVal) {
      newVal = newVal === 'undefined' ? undefined : newVal;
      const keyIndex = LiItem.observedAttributes.indexOf(key);
      switch(keyIndex) {
        case 0:
          this.shadowRoot.querySelector('a').href = newVal;
          break;
        case 1:
          this.shadowRoot.querySelector('img').src = newVal ?? './assets/img/nothing.svg';
          break;
        case 2:
          const desc = this.shadowRoot.querySelector('.desc');
          if(newVal) {
            desc.classList.remove('none');
          } else {
            desc.classList.add('none');
          }
          desc.innerText = newVal ?? '';
          desc.title = newVal ?? '';
          break;
        case 3:
          const title = this.shadowRoot.querySelector('.title');
          title.innerText = newVal ?? '';
          title.title = newVal ?? '';
          break;
        default: return;
      }
    }

    // 监听属性变化
    static get observedAttributes() {
      return ['data-href', 'data-img', 'data-desc', 'data-title']
    }
  }
  customElements.define('li-item', LiItem);
}());