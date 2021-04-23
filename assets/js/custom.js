/**
 * 创建 web component
 */

(function() {
  class LiItem extends HTMLElement {
    constructor() {
      super();
      const temp = document.getElementById('temp-li-item');
      const tempContent = temp.content.cloneNode(true);

      // 获取根元素
      this.root = tempContent.querySelector('.wrapper');
      // loading 元素
      this.loadingIcon = tempContent.querySelector('.loading');
      this.loading = false;
      // 获取 img 元素
      this.img = tempContent.querySelector('img');
      // 封面资源类型：image，video，null
      this.coverType = null;
      this.img.onload = ev => {
        this.loadingIcon.classList.add('none');
        this.loading = false;
      }

      // 获取视频元素
      this.video = tempContent.querySelector('video');
      this.video.oncanplay = ev => {
        this.loadingIcon.classList.add('none');
        this.loading = false;
      }
      this.root.onmouseenter = ev => {
        if(this.video.src && !this.loading) {
          this.video.play();
        }
      };
      this.root.onmouseleave = ev => {
        if(this.video.src && !this.loading) {
          this.video.pause();
        }
      };

      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.append(tempContent);
    }

    // 懒加载
    lazyLoad() {
      this.observer = new IntersectionObserver((records) => {
        if(records.some(r => r.isIntersecting)) {
          // 显示
          this.loadingIcon.classList.remove('none');
          this.loading = true;
          if(this.coverType === 'video') {
            // 视频
            this.video.src = this.video.dataset.src;
            this.video.classList.remove('hidden');
            this.img.classList.add('hidden');
          } else if(this.coverType === 'image') {
            // 图片
            this.img.src = this.img.dataset.src;
            this.img.classList.remove('hidden');
            this.video.classList.add('hidden');
          }
          this.observer.unobserve(this.root);
          this.observer = null;
        }
      });
      this.observer.observe(this.root);
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
            // 判断资源类型
            if(/.*\.mp4$/.test(newVal)) {
              // 是视频资源
              this.coverType = 'video';
              this.video.dataset.src = newVal;
            } else {
              // 是图片资源
              this.coverType = 'image';
              this.img.dataset.src = newVal;
            }
            this.lazyLoad();
          } else {
            this.coverType = null;
            this.img.src = './assets/img/nothing.svg';
            this.img.dataset.src = '';
            this.video.dataset.src = '';
            this.img.classList.remove('hidden');
            this.video.classList.add('hidden');
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
          const title = this.shadowRoot.querySelector('.title .text>span');
          title.innerText = newVal ?? '';
          title.title = newVal ?? '';
          break;
        default: return;
      }
    }

    // 监听属性变化
    static get observedAttributes() {
      return ['data-href', 'data-cover', 'data-desc', 'data-title']
    }
  }
  customElements.define('li-item', LiItem);
}());