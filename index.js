"use strict";

const sourceCanvas = document.getElementById('source-canvas');
const distCanvas = document.getElementById('dist-canvas');

const sourceCtx = sourceCanvas.getContext('2d');
const distCtx = distCanvas.getContext('2d');

const img = new Image();
img.src = 'image.jpg';
img.crossOrigin = "Anonymous";


img.onload = () => {
  sourceCtx.drawImage(img, 0, img.width, img.height);
  const imageData = distCtx.getImageData(0, 0, img.width, img.height);
  const buf = new ArrayBuffer(imageData.data.length);
  const buf8 = new Uint8ClampedArray(buf);
  const data = new Uint32Array(buf);

  for(let y=0; y<img.height; y++){
    for(let x=0; x<img.width; x++){
      data[]
      // let pixel = ctx.getImageData(x, y, 1, 1).data;
      // console.log(pixel)
    }
  }

}
