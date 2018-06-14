"use strict";

const html = {
  shadowRange: document.getElementById('shadow'),
  lightRange: document.getElementById('light'),
  shadowValue: document.getElementById('shadow-value'),
  lightValue: document.getElementById('light-value'),
  loader: document.getElementById('loader')
}

const sourceCanvas = document.getElementById('source-canvas');
const distCanvas = document.getElementById('dist-canvas');

const source = new Image();
const dist = new Image();
const settings = {
  shadows: 0,
  lights: 1
}



const rgbColor = (r, g, b, alpha = 255) => {
  return (alpha << 24) | (b << 16) | (g <<  8) | r;
}

const greyStyle = (r, g, b, alpha) => {
  let grey = (r + g + b)/3;
  grey = (255 - (255 - grey)*(1 - settings.shadows))*settings.lights;

  grey = Math.round(grey);
  if(alpha == 0) grey = 255;
  return grey;
}


const mapColors = (canvas) => {
  const ctx = canvas.getContext('2d');
  const colors = {};

  let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for(let i=0; i<data.length; i = i + 4){
    let r, g, b, alpha;
    r = data[i];
    g = data[i+1];
    b = data[i+2];
    alpha = data[i+3];
    let greyIndex = greyStyle(r, g, b, alpha);
    colors[greyIndex] = [r, g, b, alpha];
  }

  // for(let y=0; y<canvas.height; y++){
  //   for(let x=0; x<canvas.width; x++){
  //     let r, g, b, alpha;
  //     [r, g, b, alpha] = ctx.getImageData(x, y, 1, 1).data;
  //     let key = greyStyle(r, g, b, alpha).join('-');
  //     colorMap[key] = [r, g, b, alpha];
  //   }
  // }

  // for(let y=0; y<pixels.length; y++){
  //   for(let x=0; x<pixels[y].length; x++){
  //     let r, g, b, alpha;
  //     [r, g, b, alpha] = greyStyle(pixels[y][x][0], pixels[y][x][1], pixels[y][x][2], pixels[y][x][3]);
  //
  //     data[y*img.width + x] = rgbColor(r, g, b, alpha);
  //   }
  // }

  // imageData.data.set(buf8);
  // distCtx.putImageData(imageData, 0, 0);
  // html.lightValue.innerHTML = settings.lights;
  // html.shadowValue.innerHTML = settings.shadows;

  // console.log(Object.keys(allColors))
  // html.lightValue.innerHTML = settings.lights;
  // html.shadowValue.innerHTML = settings.shadows;
  // loader.style.display = 'none';

  // console.log('Total colors: '+Object.keys(colorMap).length);

  // let keys = Object.keys(colors).sort((a, b) => {
  //   return Number(a) - Number(b);
  // });
  //
  // let sortedColors = Object.values(colors).map((color) => {
  //
  // })



  // console.log(keys)

  let colorMap = [];
  for(let i=0; i<256; i++){
    if(colors.hasOwnProperty(i)){
      colorMap[i] = colors[i];
    }else{
      colorMap[i] = [0, 0, 0, 0];
    }
  }

  return colorMap;
}

const findMiddleColor = (undefinedGrey, colorMap) => {

}

const colorize = (canvas, colorMap) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buf = new ArrayBuffer(imageData.data.length);
  const buf8 = new Uint8ClampedArray(buf);
  const data = new Uint32Array(buf);


  for(let y=0; y<canvas.height; y++){
    for(let x=0; x<canvas.width; x++){
      let r, g, b, alpha;
      [r, g, b, alpha] = ctx.getImageData(x, y, 1, 1).data;

      let greyIndex = greyStyle(r, g, b, alpha);
      [r, g, b, alpha] = colorMap[greyIndex];

      data[y*canvas.width + x] = rgbColor(r, g, b, alpha);
    }
  }

  imageData.data.set(buf8);
  ctx.putImageData(imageData, 0, 0);

  loader.style.display = 'none';
}

source.src = 'image.png';
source.onload = () => {
  sourceCanvas.width = source.width;
  sourceCanvas.height = source.height;
  sourceCanvas.getContext('2d').drawImage(source, 0, 0, source.width, source.height);

  dist.src = 'target.png';
  dist.onload = () => {
    distCanvas.width = dist.width;
    distCanvas.height = dist.height;
    distCanvas.getContext('2d').drawImage(dist, 0, 0, dist.width, dist.height);
    colorize(distCanvas, mapColors(sourceCanvas));
  }
}



html.shadowRange.onchange = (el) => {
  settings.shadows = parseInt(el.target.value)/100;
  loader.style.display = 'block';
  setTimeout(() => {
    colorize(distCanvas, mapColors(sourceCanvas));
  }, 100);
}
html.lightRange.onchange = (el) => {
  settings.lights = parseInt(el.target.value)/100;
  loader.style.display = 'block';
  setTimeout(() => {
    colorize(distCanvas, mapColors(sourceCanvas));
  }, 100);
}
