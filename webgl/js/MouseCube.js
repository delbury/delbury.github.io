import BaseCanvasWebgl from './BaseCanvasWebgl.js';
import Cube from './Cube.js';

export default class MouseCube extends BaseCanvasWebgl {
  #vSource = `
    void main() {
      //
    }
  `;
  #fSource = `
    void main() {
      //
    }
  `;
  constructor(...params) {
    super(...params);

    this.clear();

    this.programs.push(
      this.createProgram(this.gl, this.#vSource, this.#fSource),
    );
    this.useProgram(program);

    const cube = new Cube(this.gl);

  }
}