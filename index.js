"use strict";

import elements from './app/elements.js';
import ImageCanvas from './app/image.class.js'
import Histogram from './app/histogram.class.js'
import Mask from './app/mask.class.js'
import Selection from './app/selection.class.js'
import { rgbColor, greyStyle, findPeak, alignColorMap } from './app/utils.js';


let peakWeight = 1; //for color map normalization
let paintRadius = 50;

const source = new ImageCanvas('canvas-source');
const target = new ImageCanvas('canvas-target');
const result = new ImageCanvas('canvas-result');

const mask = new Mask('canvas-mask');

const sourceHistorgam = new Histogram('histogram-source');
const targetHistorgam = new Histogram('histogram-target');
const fitHistorgam = new Histogram('histogram-fit');

let sourcePeak, targetPeak;
let colorMap = [];

//set constrol default value
elements.peakWeight.value = peakWeight;
elements.paintRadius.value = paintRadius;

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
      colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
      fitHistorgam.draw(colorMap);
      colorize();
    })
  }
}
//on select target BLACK & WHITE IMAGE
elements.targetFile.onchange = (event) => {
  const file = event.target.files[0];
  if(file && file.type.match('image.*')){
    Promise.all([target.load(file), result.load(file)]).then(() => {
      mask.init(target.canvas.width, target.canvas.height, 250);
      targetHistorgam.draw(target.map);
      targetPeak = findPeak(target.map, peakWeight);
      colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
      fitHistorgam.draw(colorMap);
      colorize();
    })
  }
}

// MAIN
mask.onSelect = () => {
  target.mapColors(null, mask);
  targetHistorgam.draw(target.map);
  targetPeak = findPeak(target.map, peakWeight);
  colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
  fitHistorgam.draw(colorMap);
}

const colorize = (mask) => {

  if(!sourcePeak || !targetPeak) return;

  const targetData = target.ctx.getImageData(0, 0, target.canvas.width, target.canvas.height);
  const resultData = result.ctx.getImageData(0, 0, result.canvas.width, result.canvas.height);
  const data = resultData.data;

  const draw = (i) => {
    let x, y, r, g, b, alpha;
    x = (i / 4) % result.ctx.width;
    y = ~~((i / 4) / result.ctx.width);
    let greyIndex = greyStyle(targetData.data[i], targetData.data[i+1], targetData.data[i+2], targetData.data[i+3]);
    [r, g, b, alpha] = colorMap[greyIndex];

    data[i] = r;
    data[i+1] = g;
    data[i+2] = b;
    data[i+3] = alpha;
  }


  let x, y, r, g, b, alpha;
  if(mask){
    let drawPixels = mask.ctx.getImageData(0, 0, mask.canvas.width, mask.canvas.height).data;
    for (let i = 0; i < drawPixels.length; i += 4) {
      if(drawPixels[i+3]) draw(i);
    }
  }else{
    for (let i = 0; i < resultData.data.length; i += 4) {
      draw(i);
    }
  }

  resultData.data.set(data);
  result.ctx.putImageData(resultData, 0, 0);

}
// SOURCE AREA SELECTION

const selection = new Selection('source-area');

selection.onSelected = (area) => {
  source.mapColors(area);
  sourceHistorgam.draw(source.map);
  sourcePeak = findPeak(source.map, peakWeight);
  if(target.map){
    targetPeak = findPeak(target.map, peakWeight);
    colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
    fitHistorgam.draw(colorMap);
    // colorize();
  }
}

elements.peakWeight.onchange = (event) => {
  peakWeight = Number(event.target.value);
  sourcePeak = findPeak(source.map, peakWeight);
  targetPeak = findPeak(target.map, peakWeight);
  colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
  fitHistorgam.draw(colorMap);
  //colorize();
}

elements.paintRadius.onchange = (event) => {
  paintRadius = Number(event.target.value);
  mask.setRadius(paintRadius);
}

elements.clear.onclick = () => {
  mask.clear();
}

elements.colorize.onclick = () => {
  colorMap = alignColorMap(sourcePeak, targetPeak, source.map);
  colorize(mask);
  mask.clear();
}
