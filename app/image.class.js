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

        let rect = this.canvas.getBoundingClientRect();
        this.scale = this.canvas.width/rect.width;

        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

        this.mapColors();
        resolve(this.map);
      }
    });

  }

  mapColors(selection, mask) {

    const colors = {};
    const map = [];

    let max = 0;

    let data;
    if(selection){
      data = this.ctx.getImageData(selection.x*this.scale, selection.y*this.scale, selection.width*this.scale, selection.height*this.scale).data;
    }else{
      data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }

    let maskData = [];
    if(mask){
      maskData = mask.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }

    for(let i=0; i<data.length; i = i + 4){
      if(mask && maskData[i+3] == 0){
        continue;
      }
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
