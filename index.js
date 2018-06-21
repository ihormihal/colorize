"use strict";

const pixelRatio = 2;
let peakWeight = 0.5; //for color map normalization
let source = new Image();
let target = new Image();
let colorMap = [];
let targetColorMap = [];

// HTML ELEMENTS

const html = {
  source: document.getElementById('source'),
  target: document.getElementById('target'),
  sourceArea: document.getElementById('source-area'),
  sourceInput: document.getElementById('source-input'),
  sourceFile: document.getElementById('source-file'),
  targetFile: document.getElementById('target-file'),
  peakWeight: document.getElementById('peak-weight'),
  selection: document.getElementById('selection')
}

const sourceCanvas = document.getElementById('source-canvas');
const targetCanvas = document.getElementById('target-canvas');
const resultCanvas = document.getElementById('result-canvas');
const histogramCanvas = document.getElementById('histogram-canvas');
const histogramTargetCanvas = document.getElementById('histogram-target-canvas');
const histogramResultCanvas = document.getElementById('histogram-result-canvas');
const drawCanvas = document.getElementById('draw-canvas');

const drawContext = drawCanvas.getContext("2d");

html.peakWeight.value = peakWeight;

histogramCanvas.width = 256*pixelRatio;
histogramCanvas.height = 100*pixelRatio;
histogramCanvas.getContext('2d').transform(1, 0, 0, -1, 0, 200);

histogramTargetCanvas.width = 256*pixelRatio;
histogramTargetCanvas.height = 100*pixelRatio;
histogramTargetCanvas.getContext('2d').transform(1, 0, 0, -1, 0, 200);

histogramResultCanvas.width = 256*pixelRatio;
histogramResultCanvas.height = 100*pixelRatio;
histogramResultCanvas.getContext('2d').transform(1, 0, 0, -1, 0, 200);

// FUNCTIONS

const rgbColor = (r, g, b, alpha = 255) => {
  return (alpha << 24) | (b << 16) | (g <<  8) | r;
}

const greyStyle = (r, g, b, alpha) => {
  let grey = Math.round((r + g + b)/3);
  if(alpha == 0) grey = 255;
  return grey;
}

const drawHistogram = (canvas, map) => {
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let i=0;i<map.length;i++){
    let value = map[i][4]*100;
    ctx.strokeStyle = `rgba( ${map[i][0]}, ${map[i][1]}, ${map[i][2]}, ${map[i][3]})`;
    ctx.beginPath();
    ctx.moveTo(i*pixelRatio,0);
    ctx.lineTo(i*pixelRatio,value*pixelRatio);
    ctx.stroke();
  }
}

const findPeak = (map) => {
  let peak = { start: 0, end: 255 };
  let count = 0;
  let total = 0;
  for(let i=0;i<map.length;i++){
    total += map[i][4];
  }
  let offset = total*(1 - peakWeight)/2;
  for(let i=0;i<map.length;i++){
    count += map[i][4];
    if(count < offset) peak.start = i;
    if(count < total - offset) peak.end = i;
  }
  return peak;
}

const alignColorMap = (sourcePeak, targetPeak, map) => {
  let outputMap = [];
  let dWidth = (sourcePeak.end - sourcePeak.start)/2;
  let tWidth = (targetPeak.end - targetPeak.start)/2;
  let sourcePeakCenter = (sourcePeak.start + sourcePeak.end)/2;
  let targetPeakCenter = (targetPeak.start + targetPeak.end)/2;
  let t = targetPeakCenter - sourcePeakCenter;
  let z = tWidth/dWidth;
  for(let i=0;i<map.length;i++){
    let newIndex = i + t;
    newIndex = Math.round(targetPeakCenter + (newIndex - targetPeakCenter)*z);

    if(newIndex >= 0 && newIndex < 256){
      let s = newIndex/i;
      let newColor = [ map[i][0]*s, map[i][1]*s, map[i][2]*s, map[i][3], map[i][4]];
      outputMap[newIndex] = [
        newColor[0] < 256 ? newColor[0] : 255,
        newColor[1] < 256 ? newColor[1] : 255,
        newColor[2] < 256 ? newColor[2] : 255,
        newColor[3],
        newColor[4]
      ];
    }
  }
  outputMap = interpolateColorMap(outputMap);
  drawHistogram(histogramResultCanvas, outputMap);
  return outputMap;
}


const interpolateColorMap = (map) => {
  let outputMap = [];
  for(let i=0; i<256; i++){
    if(map[i]){
      outputMap[i] = map[i];
    }else{
      let prevIndex, nextIndex;
      nextIndex = prevIndex = i;

      //find prev color
      while(!map[prevIndex] && prevIndex > 0){
        prevIndex--;
      }
      //find next color
      while(!map[nextIndex] && nextIndex < 255){
        nextIndex++;
      }
      //
      //если промежуток недостающих оттенков меньше N - интерполируем для них количество пикселей
      //иначе считаем что пикселей такого цвета точно нет
      let enhance = false;
      if(nextIndex - prevIndex < 10) enhance = true;
      enhance = true;

      let prevColor = !map[prevIndex] ? [0, 0, 0, 255, 0] : map[prevIndex];
      let nextColor = !map[nextIndex] ? [255, 255, 255, 255, 0] : map[nextIndex];

      //interpolate colors
      const st = (i - prevIndex)/(nextIndex - prevIndex);
      let middleColor = [
        Math.round(prevColor[0] + (nextColor[0] - prevColor[0])*st),
        Math.round(prevColor[1] + (nextColor[1] - prevColor[1])*st),
        Math.round(prevColor[2] + (nextColor[2] - prevColor[2])*st),
        Math.round(prevColor[3] + (nextColor[3] - prevColor[3])*st),
        enhance ? prevColor[4] + (nextColor[4] - prevColor[4])*st : 0
      ]

      outputMap[i] = middleColor;
    }
  }
  return outputMap;
}

const mapColors = (canvas, selection) => {
  let map = [];

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

  let pixelsCounter = 0;
  for(let i=0; i<256; i++){
    if(colors.hasOwnProperty(i)){
      map[i] = colors[i];
      map[i][4] = map[i][4]/max;
    }
  }
  map = interpolateColorMap(map);
  return map;
}

//
// let draw = (x,y,data,targetCtx,resultCanvas,map) => {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       let r, g, b, alpha;
//       [r, g, b, alpha] = targetCtx.getImageData(x, y, 1, 1).data;
//
//       let greyIndex = greyStyle(r, g, b, alpha);
//       [r, g, b, alpha] = map[greyIndex];
//
//       data[y*resultCanvas.width + x] = rgbColor(r, g, b, alpha);
//       resolve();
//     })
//   });
// }

const colorize = (map = colorMap, mask) => {
  console.log('colorize')
  const targetCtx = targetCanvas.getContext('2d');
  const imageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

  const buf = new ArrayBuffer(imageData.data.length);
  const buf8 = new Uint8ClampedArray(buf);
  const data = new Uint32Array(buf);


  const draw = (i) => {
    let x, y, r, g, b, alpha;
    x = (i / 4) % targetCanvas.width;
    y = ~~((i / 4) / targetCanvas.width);
    [r, g, b, alpha] = [ imageData.data[i], imageData.data[i+1], imageData.data[i+2], imageData.data[i+3] ];
    let greyIndex = greyStyle(r, g, b, alpha);
    [r, g, b, alpha] = map[greyIndex];
    data[y*resultCanvas.width + x] = rgbColor(r, g, b, alpha);
  }


  let x, y, r, g, b, alpha;
  if(mask){
    let maskCtx = mask.getContext('2d');
    let drawPixels = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
    for (let i = 0; i < drawPixels.length; i += 4) {
      if(drawPixels[i+3]) draw(i);
    }
  }else{
    for (let i = 0; i < imageData.data.length; i += 4) {
      draw(i);
    }
  }

  imageData.data.set(buf8);
  resultCanvas.getContext('2d').putImageData(imageData, 0, 0);

}

const colorizeSelection = () => {
}

//IMAGES ON LOAD

let sourcePeak, targetPeak;

source.onload = () => {
  html.source.style.display = 'block';
  sourceCanvas.width = source.width;
  sourceCanvas.height = source.height;
  sourceCanvas.getContext('2d').drawImage(source, 0, 0, source.width, source.height);

  colorMap = mapColors(sourceCanvas);
  drawHistogram(histogramCanvas, colorMap);
  sourcePeak = findPeak(colorMap);
  if(target.src){
    colorize();
  }
}

target.onload = () => {
  targetCanvas.width = resultCanvas.width = drawCanvas.width = target.width;
  targetCanvas.height = resultCanvas.height = drawCanvas.height = target.height;
  targetCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);
  resultCanvas.getContext('2d').drawImage(target, 0, 0, target.width, target.height);

  targetColorMap = mapColors(targetCanvas);
  drawHistogram(histogramTargetCanvas, targetColorMap);
  targetPeak = findPeak(targetColorMap);
  if(source.src && colorMap.length == 256){
    alignColorMap(sourcePeak, targetPeak, colorMap);
    colorize();
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
  //check if inside
  let rect = html.sourceArea.getBoundingClientRect();
  if(event.clientX >= rect.left && event.clientX <= rect.left+rect.width && event.clientY >= rect.top && event.clientY <= rect.top + rect.height){
    if(selection && selection.width - selection.height){
      if(source.src){
        colorMap = mapColors(sourceCanvas, selection);
        drawHistogram(histogramCanvas, colorMap);
        sourcePeak = findPeak(colorMap);
        if(targetColorMap){
          targetPeak = findPeak(targetColorMap);
          let alignedColorMap = alignColorMap(sourcePeak, targetPeak, colorMap);
          colorize(alignedColorMap);
        }
      }
    }
  }
}

html.peakWeight.onchange = (event) => {
  peakWeight = Number(event.target.value);
  sourcePeak = findPeak(colorMap);
  if(targetColorMap){
    targetPeak = findPeak(targetColorMap);
    let alignedColorMap = alignColorMap(sourcePeak, targetPeak, colorMap);
    colorize(alignedColorMap);
  }
}













const drawRadius = 10;
let clickX = [];
let clickY = [];
let clickDrag = [];
let paint;
let drawOffset;

let drawAreaScale = 1;

let drawPixels = [];

function addClick(x, y, dragging)
{
  clickX.push(x*drawAreaScale);
  clickY.push(y*drawAreaScale);
  clickDrag.push(dragging);
}


const redraw = () => {
  drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawContext.strokeStyle = "#df4b26";
  drawContext.lineJoin = "round";
  drawContext.lineWidth = drawRadius;

  for(let i=0; i< clickX.length; i++) {
    drawContext.beginPath();
    if(clickDrag[i] && i){
      drawContext.moveTo(clickX[i-1], clickY[i-1]);
    }else{
      drawContext.moveTo(clickX[i]-1, clickY[i]);
    }
    drawContext.lineTo(clickX[i], clickY[i]);
    drawContext.closePath();
    drawContext.stroke();
  }
}

drawCanvas.onmousedown = function(event) {
  paint = true;
  // drawAreaScale = drawCanvas

  let rect = drawCanvas.getBoundingClientRect();
  drawAreaScale = drawCanvas.width/rect.width;
  drawOffset = [-rect.left, -rect.top];
  addClick(event.clientX + drawOffset[0], event.clientY + drawOffset[1]);
  redraw();
}
drawCanvas.onmousemove = function(event) {
  if(paint){
    addClick(event.clientX + drawOffset[0], event.clientY + drawOffset[1], true);
    redraw();
  }
}
drawCanvas.onmouseup = (event) => {
  paint = false;
  colorize(colorMap, drawCanvas);
  drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  clickX = [];
  clickY = [];
}
