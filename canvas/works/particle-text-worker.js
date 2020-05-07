import { ParticleTextController } from '../js/controllers.js';

let controller = null;

self.onmessage = ev => {
  const { type, text, canvas } = ev.data;
  switch (type) {
    case 'init':
      controller = new ParticleTextController(canvas, { text });
      break;
    case 'change-text':
      controller.changeText(text);
      break;
    case 'focus':
      controller.focus();
      break;
    case 'blur':
      controller.blur();
      break;
    default: break;
  }
};