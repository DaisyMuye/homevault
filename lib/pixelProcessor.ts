const MINECRAFT_PALETTE = [
  '#FFFFFF', '#D9D9D9', '#B0B0B0', '#808080',
  '#555555', '#2B2B2B', '#000000', '#7BBC5B',
  '#5B8731', '#3B5B1B', '#8B5A2B', '#6B3A1B',
  '#4B2A0B', '#BC9862', '#A0784C', '#84663A',
  '#3C44AA', '#2C348A', '#5C5CB8', '#8888CC',
  '#D05B5B', '#B03B3B', '#FFB05B', '#E0903B',
];

const PIXEL_SIZE = 16;
const OUTPUT_SIZE = 128;

export function getPixelArtHtml(imageBase64: string): string {
  const palette = JSON.stringify(MINECRAFT_PALETTE);
  return `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"></head>
<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
<canvas id="c"></canvas>
<script>
const img = new Image();
img.onload = function() {
  const palette = ${palette};
  const pw = ${PIXEL_SIZE}, os = ${OUTPUT_SIZE};
  const canvas = document.getElementById('c');
  canvas.width = os; canvas.height = os;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, pw, pw);

  const srcData = ctx.getImageData(0, 0, pw, pw);
  const d = srcData.data;

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r,g,b];
  }

  const palRgb = palette.map(hexToRgb);

  function closestColor(r, g, b) {
    let minDist = Infinity, best = 0;
    for (let i = 0; i < palRgb.length; i++) {
      const dr = r - palRgb[i][0], dg = g - palRgb[i][1], db = b - palRgb[i][2];
      const dist = dr*dr + dg*dg + db*db;
      if (dist < minDist) { minDist = dist; best = i; }
    }
    return best;
  }

  for (let i = 0; i < d.length; i += 4) {
    const ci = closestColor(d[i], d[i+1], d[i+2]);
    const [cr, cg, cb] = palRgb[ci];
    d[i] = cr; d[i+1] = cg; d[i+2] = cb;
  }
  srcData.data.set(d);
  ctx.putImageData(srcData, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, pw, pw, 0, 0, os, os);

  const result = canvas.toDataURL('image/png');
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', data: result }));
};
img.onerror = function() {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: 'Image load failed' }));
};
img.src = '${imageBase64}';
</script>
</body>
</html>`;
}
