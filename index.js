"use strict";

import elements from './app/elements.js';
import ImageCanvas from './app/image.class.js'
import Histogram from './app/histogram.class.js'
import Mask from './app/mask.class.js'
import Selection from './app/selection.class.js'
import { rgbColor, greyStyle, findPeak, alignColorMap } from './app/utils.js';


let peakWeight = 0.5; //for color map normalization

const source = new ImageCanvas('canvas-source');
const target = new ImageCanvas('canvas-target');
const result = new ImageCanvas('canvas-result');

const mask = new Mask('canvas-mask');

const sourceHistorgam = new Histogram('histogram-source');
const targetHistorgam = new Histogram('histogram-target');
const fitHistorgam = new Histogram('histogram-fit');

let sourcePeak, targetPeak;

//set constrol default value
elements.peakWeight.value = peakWeight;

// FILE inputs
elements.sourceInput.onmouseup = () => {
  elements.sourceFile.click();
}
elements.targetInput.onmouseup = () => {
  elements.targetFile.click();
}

//on select source COLOR IMAGE
elements.sourceFile.onchange = (event) => {
  const file = event.target.files[0];
  if(file && file.type.match('image.*')){
    source.load(file).then(() => {
      sourceHistorgam.draw(source.map);
      sourcePeak = findPeak(source.map, peakWeight);
      colorize();
    })
  }
}
//on select target BLACK & WHITE IMAGE
elements.targetFile.onchange = (event) => {
  const file = event.target.files[0];
  if(file && file.type.match('image.*')){
    Promise.all([target.load(file), result.load(file)]).then(() => {
      targetHistorgam.draw(target.map);
      targetPeak = findPeak(target.map, peakWeight);
      colorize();
    })
  }
}

// MAIN
const colorize = (mask) => {


  console.log(sourcePeak, targetPeak)

  if(!sourcePeak || !targetPeak) return;

  let colorMap = alignColorMap(sourcePeak, targetPeak, source.map);

  const targetData = target.ctx.getImageData(0, 0, target.canvas.width, target.canvas.height);
  const resultData = result.ctx.getImageData(0, 0, result.canvas.width, result.canvas.height);

  const buf = new ArrayBuffer(resultData.data.length);
  const buf8 = new Uint8ClampedArray(buf);
  const data = new Uint32Array(buf);


  const draw = (i) => {
    let x, y, r, g, b, alpha;
    x = (i / 4) % target.ctx.width;
    y = ~~((i / 4) / target.ctx.width);
    [r, g, b, alpha] = [ targetData.data[i], targetData.data[i+1], targetData.data[i+2], targetData.data[i+3] ];
    let greyIndex = greyStyle(r, g, b, alpha);
    [r, g, b, alpha] = colorMap[greyIndex];
    // data[y*result.ctx.width + x] = rgbColor(r, g, b, alpha);
  }


  let x, y, r, g, b, alpha;
  if(mask){
    let maskCtx = mask.getContext('2d');
    let drawPixels = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
    for (let i = 0; i < drawPixels.length; i += 4) {
      if(drawPixels[i+3]) draw(i);
    }
  }else{
    for (let i = 0; i < resultData.data.length; i += 4) {
      draw(i);
    }
  }

  resultData.data.set(buf8);
  result.ctx.putImageData(resultData, 0, 0);

}


target.onload = () => {
  targetCanvas.width = resultCanvas.width = drawCanvas.width = target.width;
  targetCanvas.height = resultCanvas.height = drawCanvas.height = target.height;
  targetCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);
  resultCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);

  targetColorMap = mapColors(targetCanvas);
  drawHistogram(histogramTargetCanvas, targetColorMap);
  targetPeak = findPeak(targetColorMap, peakWeight);
  if(source.src && colorMap.length == 256){
    alignColorMap(sourcePeak, targetPeak, colorMap);
    colorize();
  }
}

// SOURCE AREA SELECTION

const selection = new Selection('source-area');

selection.onSelected = (area) => {
  console.log(area)
  source.mapColors(area);
  sourceHistorgam.draw(source.map);
  sourcePeak = findPeak(source.map, peakWeight);
  if(target.map){
    targetPeak = findPeak(target.map, peakWeight);
    colorize(alignColorMap(sourcePeak, targetPeak, source.map));
  }
}

elements.peakWeight.onchange = (event) => {
  peakWeight = Number(event.target.value);
  sourcePeak = findPeak(source.map, peakWeight);
  colorize();
}
