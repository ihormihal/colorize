"use strict";

const pixelRatio = 2;
const settings = {
  shadows: 0,
  lights: 1
};
const source = new Image();
const target = new Image();
let colorMap = [];


const html = {
  source: document.getElementById('source'),
  target: document.getElementById('target'),
  sourceInput: document.getElementById('source-input'),
  sourceFile: document.getElementById('source-file'),
  targetFile: document.getElementById('target-file'),
  loader: document.getElementById('loader'),
  diagram: document.getElementById('diagram-canvas'),
  selection: document.getElementById('selection')
}

const sourceCanvas = document.getElementById('source-canvas');
const targetCanvas = document.getElementById('target-canvas');
const resultCanvas = document.getElementById('result-canvas');
const diagramCanvas = document.getElementById('diagram-canvas');

const diagramCtx = diagramCanvas.getContext('2d');
diagramCanvas.width = 256*pixelRatio;
diagramCanvas.height = 100*pixelRatio;

diagramCtx.transform(1, 0, 0, -1, 0, 200);


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

function drawHistoLine(index, color, count, max, ctx = diagramCtx){
  let value = count*100/max;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(index*pixelRatio,0);
  ctx.lineTo(index*pixelRatio,value*pixelRatio);
  ctx.stroke();
}

const mapColors = (canvas, selection) => {

  diagramCtx.clearRect(0, 0, diagramCanvas.width, diagramCanvas.height);

  const ctx = canvas.getContext('2d');
  const colors = {};

  let max = 0;

  let data;
  if(selection){
    data = ctx.getImageData(selection.x, selection.y, selection.width, selection.height).data;
  }else{
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

  let colorMap = [];
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

    drawHistoLine(i, `rgba( ${colorMap[i][0]}, ${colorMap[i][1]}, ${colorMap[i][2]}, ${colorMap[i][3]})`, colorMap[i][4], max);
  }
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

sourceCanvas.onmousedown = (event) => {
  moving = true;
  selection = { x: 0, y: 0, width: 0, height: 0 };
  start = [event.clientX, event.clientY];

  let rect = sourceCanvas.getBoundingClientRect();
  offset = [-rect.left, -rect.top];

  html.selection.style.width = 0;
  html.selection.style.height = 0;
  html.selection.style.left = 0;
  html.selection.style.top = 0;
}

sourceCanvas.onmousemove = (event) => {
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
  if(selection.width - selection.height){
    if(source.src){
      colorMap = mapColors(sourceCanvas, selection);
      //colorize from selection
      if(target.src){
        colorize(targetCanvas, resultCanvas, colorMap);
      }
    }
  }
}
