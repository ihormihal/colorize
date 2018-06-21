export const rgbColor = (r, g, b, alpha = 255) => {
  return (alpha << 24) | (b << 16) | (g <<  8) | r;
}

export const greyStyle = (r, g, b, alpha) => {
  let grey = Math.round((r + g + b)/3);
  if(alpha == 0) grey = 255;
  return grey;
}

export const findPeak = (map, peakWeight) => {
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

export const interpolateColorMap = (map) => {
  const enhanceDist = 10;
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
      let enhance = nextIndex - prevIndex < enhanceDist;

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

export const alignColorMap = (sourcePeak, targetPeak, map) => {
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
  // drawHistogram(histogramResultCanvas, outputMap);
  return outputMap;
}
