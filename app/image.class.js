import { greyStyle, interpolateColorMap } from './utils.js'

export default class ImageCanvas {
  constructor(id) {
    this.image = new Image();
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.map = null;
    this.scale = 1;
  }

  load(file) {
    return new Promise( (resolve, reject) => {
      const reader  = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        this.image.src = e.target.result;
      }
      this.image.onload = () => {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;

        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

        this.mapColors();
        resolve(this.map);
      }
    });

  }

  mapColors(selection) {

    const colors = {};
    const map = [];

    let pixelsCount = 0;
    let max = 0;

    let data;
    if(selection){
      pixelsCount = selection.width * selection.height;
      data = this.ctx.getImageData(selection.x, selection.y, selection.width, selection.height).data;
    }else{
      pixelsCount = this.canvas.width * this.canvas.height;
      data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }

    for(let i=0; i<data.length; i = i + 4){
      let r, g, b, alpha;
      r = data[i];
      g = data[i+1];
      b = data[i+2];
      alpha = data[i+3];
      let greyIndex = greyStyle(r, g, b, alpha);
      let count = colors[greyIndex] && colors[greyIndex][4] ? colors[greyIndex][4] : 0;
      count++;
      colors[greyIndex] = [r, g, b, alpha, count];
      max = count > max ? count : max;
    }

    for(let i=0; i<256; i++){
      if(colors.hasOwnProperty(i)){
        map[i] = colors[i];
        map[i][4] = map[i][4]/max;
      }
    }

    this.map = interpolateColorMap(map);

  }
}
