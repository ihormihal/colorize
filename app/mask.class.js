export default class Mask {
  constructor(id) {
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');

    this.ctx.strokeStyle = "#df4b26";
    this.ctx.lineJoin = "round";
    this.setRadius(10);

    this.clickX = [];
    this.clickY = [];
    this.clickDrag = [];
    this.offset = [0, 0];
    this.scale = 1;


    this.canvas.onmousedown = () => {
      this._paint = true;
      let rect = this.canvas.getBoundingClientRect();
      this.scale = this.canvas.width/rect.width;
      this.offset = [-rect.left, -rect.top];

      this._addClick(event.clientX, event.clientY);
      this._redraw();
    }

    this.canvas.onmousemove = () => {
      if(this._paint){
        this._addClick(event.clientX, event.clientY, true);
        this._redraw();
      }
    }

    this.canvas.onmouseup = () => {
      this._paint = false;
    }
  }

  setRadius(radius) {
    this.ctx.lineWidth = radius;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.clickX = [];
    this.clickY = [];
    this.clickDrag = [];
  }


  _addClick(x, y, dragging) {
    x += this.offset[0];
    y += this.offset[1];
    this.clickX.push(x*this.scale);
    this.clickY.push(y*this.scale);
    this.clickDrag.push(dragging);
  }

  _redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for(let i=0; i<this.clickX.length; i++) {
      this.ctx.beginPath();
      if(this.clickDrag[i] && i){
        this.ctx.moveTo(this.clickX[i-1], this.clickY[i-1]);
      }else{
        this.ctx.moveTo(this.clickX[i]-1, this.clickY[i]);
      }
      this.ctx.lineTo(this.clickX[i], this.clickY[i]);
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }
}
