"use strict";

const pixelRatio = 2;
const peakWeight = 0.8; //for color map normalization
const settings = {
  shadows: 0,
  lights: 1
};
const source = new Image();
const target = new Image();
let colorMap = [];
let peak = { start: 0, end: 255 };

// HTML ELEMENTS

const html = {
  source: document.getElementById('source'),
  target: document.getElementById('target'),
  sourceArea: document.getElementById('source-area'),
  sourceInput: document.getElementById('source-input'),
  sourceFile: document.getElementById('source-file'),
  targetFile: document.getElementById('target-file'),
  selection: document.getElementById('selection')
}

const sourceCanvas = document.getElementById('source-canvas');
const targetCanvas = document.getElementById('target-canvas');
const resultCanvas = document.getElementById('result-canvas');
const histogramCanvas = document.getElementById('histogram-canvas');

const histogramCtx = histogramCanvas.getContext('2d');
histogramCanvas.width = 256*pixelRatio;
histogramCanvas.height = 100*pixelRatio;
histogramCtx.transform(1, 0, 0, -1, 0, 200);

// FUNCTIONS

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

const drawHistogram = (colorMap, max) => {
  histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);
  for(let i=0;i<colorMap.length;i++){
    let value = colorMap[i][4]*100/max;
    histogramCtx.strokeStyle = `rgba( ${colorMap[i][0]}, ${colorMap[i][1]}, ${colorMap[i][2]}, ${colorMap[i][3]})`;
    histogramCtx.beginPath();
    histogramCtx.moveTo(i*pixelRatio,0);
    histogramCtx.lineTo(i*pixelRatio,value*pixelRatio);
    histogramCtx.stroke();
  }
}

const findPeak = (colorMap, total) => {
  peak = { start: 0, end: 255 };
  let count = 0;
  let offset = total*(1 - peakWeight)/2;
  for(let i=0;i<colorMap.length;i++){
    count += colorMap[i][4];
    if(count < offset) peak.start = i;
    if(count < total - offset) peak.end = i;
  }
}

const alignColorMap = () => {

}

const mapColors = (canvas, selection) => {

  const ctx = canvas.getContext('2d');
  const colors = {};

  let pixelsCount = 0;
  let max = 0;

  let data;
  if(selection){
    pixelsCount = selection.width * selection.height;
    data = ctx.getImageData(selection.x, selection.y, selection.width, selection.height).data;
  }else{
    pixelsCount = canvas.width * canvas.height;
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
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

  colorMap = [];
  let pixelsCounter = 0;
  for(let i=0; i<256; i++){
    if(colors.hasOwnProperty(i)){
      colorMap[i] = colors[i];
    }else{
      let prevIndex, nextIndex;
      nextIndex = prevIndex = i;

      //find prev color
      while(!colors.hasOwnProperty(prevIndex) && prevIndex > 0){
        prevIndex--;
      }
      //find next color
      while(!colors.hasOwnProperty(nextIndex) && nextIndex < 255){
        nextIndex++;
      }
      //
      let prevColor = !colors.hasOwnProperty(prevIndex) ? [0, 0, 0, 255] : colors[prevIndex];
      let nextColor = !colors.hasOwnProperty(nextIndex) ? [255, 255, 255, 255] : colors[nextIndex];

      //interpolate colors
      const st = (i - prevIndex)/(nextIndex - prevIndex);
      let middleColor = [
        Math.round(prevColor[0] + (nextColor[0] - prevColor[0])*st),
        Math.round(prevColor[1] + (nextColor[1] - prevColor[1])*st),
        Math.round(prevColor[2] + (nextColor[2] - prevColor[2])*st),
        Math.round(prevColor[3] + (nextColor[3] - prevColor[3])*st),
        0
      ]
      colorMap[i] = middleColor;

    }

  }

  // findPeak(colorMap, pixelsCount);
  drawHistogram(colorMap, max);
  return colorMap;
}


const colorize = (targetCanvas, canvas, colorMap) => {
  console.log('colorize')
  const imageData = targetCanvas.getContext('2d').getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  const ctx = canvas.getContext('2d');

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
}

//IMAGES ON LOAD

source.onload = () => {
  html.source.style.display = 'block';
  sourceCanvas.width = source.width;
  sourceCanvas.height = source.height;
  sourceCanvas.getContext('2d').drawImage(source, 0, 0, source.width, source.height);

  colorMap = mapColors(sourceCanvas);
  if(target.src){
    colorize(targetCanvas, resultCanvas, colorMap);
  }
}

target.onload = () => {
  targetCanvas.width = resultCanvas.width = target.width;
  targetCanvas.height = resultCanvas.height = target.height;
  targetCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);
  resultCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);

  if(source.src && colorMap.length == 256){
    colorize(targetCanvas, resultCanvas, colorMap);
  }
}

//CONTROLS

// FILE inputs

html.sourceInput.onmouseup = () => {
  html.sourceFile.click();
}

html.target.onclick = () => {
  html.targetFile.click();
}

html.sourceFile.onchange = (e) => {
  const file = e.target.files[0];
  if(file.type.match('image.*')) {
    const reader  = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      if( e.target.readyState == FileReader.DONE) {
	    	source.src = e.target.result;
			}
    }
  }
}

html.targetFile.onchange = (e) => {
  const file = e.target.files[0];
  if(file.type.match('image.*')) {
    const reader  = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      if( e.target.readyState == FileReader.DONE) {
        target.src = e.target.result;
			}
    }
  }
}


// SOURCE AREA SELECTION

let moving, start, selection, offset;

html.sourceArea.onmousedown = (event) => {
  moving = true;
  selection = { x: 0, y: 0, width: 0, height: 0 };
  start = [event.clientX, event.clientY];

  let rect = html.sourceArea.getBoundingClientRect();
  offset = [-rect.left, -rect.top];

  html.selection.style.width = 0;
  html.selection.style.height = 0;
  html.selection.style.left = 0;
  html.selection.style.top = 0;
}

html.sourceArea.onmousemove = (event) => {
  if(moving){

    let move = [event.clientX - start[0], event.clientY - start[1]];

    selection.width = Math.abs(move[0]);
    selection.height = Math.abs(move[1]);

    selection.x = move[0] >= 0 ? start[0] : event.clientX;
    selection.y = move[1] >= 0 ? start[1] : event.clientY;

    selection.x += offset[0];
    selection.y += offset[1];

    html.selection.style.left = selection.x;
    html.selection.style.top = selection.y;
    html.selection.style.width = selection.width;
    html.selection.style.height = selection.height;
  }
}

document.onmouseup = (event) => {
  moving = false;
  if(selection && selection.width - selection.height){
    if(source.src){
      mapColors(sourceCanvas, selection);
      //colorize from selection
      if(target.src){
        colorize(targetCanvas, resultCanvas, colorMap);
      }
    }
  }
}
