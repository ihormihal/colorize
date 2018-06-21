export default class Histogram {
  constructor (id) {
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = 256*window.devicePixelRatio;
    this.canvas.height = 100*window.devicePixelRatio;

    this.ctx.transform(1, 0, 0, -1, 0, 200);
  }

  draw (map) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for(let i=0;i<map.length;i++){
      let value = map[i][4]*100;
      this.ctx.strokeStyle = `rgba( ${map[i][0]}, ${map[i][1]}, ${map[i][2]}, ${map[i][3]})`;
      this.ctx.beginPath();
      this.ctx.moveTo(i*window.devicePixelRatio, 0);
      this.ctx.lineTo(i*window.devicePixelRatio, value*window.devicePixelRatio);
      this.ctx.stroke();
    }
  }
}
