/**
 * 创建 web component
 */

(function() {
  class LiItem extends HTMLElement {
    constructor() {
      super();
      const temp = document.getElementById('temp-li-item');
      const tempContent = temp.content.cloneNode(true);
      
      // 获取 img 元素
      this.img = tempContent.querySelector('img');
      this.loading = tempContent.querySelector('.loading');
      this.img.onload = ev => this.loading.classList.add('none');

      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.append(tempContent); 
    }

    // 懒加载
    lazyLoadImg() {
      this.observer = new IntersectionObserver((records) => {
        if(records[records.length - 1].isIntersecting) {
          // 显示
          this.img.src = this.img.dataset.src;
          this.img.dataset.src = '';
          this.img.classList.remove('hidden');
          this.observer.unobserve(this.img);
          this.observer = null;
        }
      });
      this.observer.observe(this.img);
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
          if(newVal) {
            this.img.dataset.src = newVal ?? './assets/img/nothing.svg';
            this.loading.classList.remove('none')
            this.lazyLoadImg();
          } else {
            this.img.dataset.src = '';
            this.img.src = './assets/img/nothing.svg';
          }
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