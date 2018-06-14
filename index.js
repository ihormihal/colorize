"use strict";

const sourceCanvas = document.getElementById('source-canvas');
const distCanvas = document.getElementById('dist-canvas');

const sourceCtx = sourceCanvas.getContext('2d');
const distCtx = distCanvas.getContext('2d');

const img = new Image();
img.src = 'image.png';


const rgbColor = (red, green, blue, alpha = 255) => {
  return (alpha << 24) | (blue << 16) | (green <<  8) | red;
}

const greyStyle = (red, green, blue) => {
  let grey = (red + green + blue)/3;
  return [grey, grey, grey];
}

const processImage = () => {
  const imageData = distCtx.getImageData(0, 0, img.width, img.height);
  const buf = new ArrayBuffer(imageData.data.length);
  const buf8 = new Uint8ClampedArray(buf);
  const data = new Uint32Array(buf);

  for(let y=0; y<img.height; y++){
    for(let x=0; x<img.width; x++){
      let r, g, b, alpha;
      [r, g, b, alpha] = sourceCtx.getImageData(x, y, 1, 1).data;

      [r, g, b] = greyStyle(r, g, b);

      data[y*img.width + x] = rgbColor(r, g, b, alpha);
    }
  }
  imageData.data.set(buf8);
  distCtx.putImageData(imageData, 0, 0);
}

img.onload = () => {
  sourceCanvas.width = distCanvas.width = img.width;
  sourceCanvas.height = distCanvas.height = img.height;
  sourceCtx.drawImage(img, 0, 0, img.width, img.height);
  processImage();
}

// document.getElementById('shadow').onchange = (el) => {
//   let shadow = parseInt(el.target.value);
//   console.log(shadow)
// }
// document.getElementById('light').onchange = (el) => {
//   let light = parseInt(el.target.value);
//   console.log(light)
// }
