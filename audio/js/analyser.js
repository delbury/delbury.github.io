export class BaseCanvas {
  constructor(canvas) {
    if(!canvas || canvas.tagName !== 'CANVAS') {
      throw new TypeError('first param must be a canvas element')
    }

    console.dir(canvas)
  }
}