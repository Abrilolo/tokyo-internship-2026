/* Shared landscape paper artwork from the Washi preview. */
(() => {
'use strict';
const TEX_W=1440,TEX_H=1024,INK='#150d1c';
// Canvases read back with getImageData stay in CPU memory: a GPU-backed canvas
// would stall on every readback (hundreds of ms per card face).
const READBACK = { willReadFrequently: true };
function makePaperBase() {
  const color = document.createElement('canvas'); color.width = TEX_W; color.height = TEX_H;
  const ctx = color.getContext('2d');
  const data = document.createElement('canvas'); data.width = TEX_W; data.height = TEX_H;
  const dCtx = data.getContext('2d');

  ctx.fillStyle = '#F4F1EA'; ctx.fillRect(0, 0, TEX_W, TEX_H);
  dCtx.fillStyle = 'rgb(90,0,0)'; dCtx.fillRect(0, 0, TEX_W, TEX_H);

  for (let i = 0; i < 70; i++) {
    const x = Math.random() * TEX_W, y = Math.random() * TEX_H, r = 90 + Math.random() * 240;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, Math.random() > .5 ? 'rgba(232,224,208,.24)' : 'rgba(252,250,245,.26)');
    g.addColorStop(1, 'rgba(244,241,234,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TEX_W, TEX_H);
  }
  const img = ctx.getImageData(0, 0, TEX_W, TEX_H), bump = dCtx.getImageData(0, 0, TEX_W, TEX_H);
  const px = img.data, bp = bump.data;
  for (let i = 0; i < px.length; i += 4) {
    const grain = (Math.random() - .5) * 12;
    px[i] += grain; px[i + 1] += grain; px[i + 2] += grain * .9;
    const tooth = 85 + (Math.random() - .5) * 55;
    bp[i] = tooth; bp[i + 1] = 0; bp[i + 2] = tooth;
  }
  ctx.putImageData(img, 0, 0); dCtx.putImageData(bump, 0, 0);

  for (let f = 0; f < 540; f++) {
    const fx = Math.random() * TEX_W, fy = Math.random() * TEX_H, len = 20 + Math.random() * 64;
    const a = Math.random() * Math.PI * 2, curve = (Math.random() - .5) * 26;
    const ex = fx + Math.cos(a) * len, ey = fy + Math.sin(a) * len;
    const cx = (fx + ex) * .5 - Math.sin(a) * curve, cy = (fy + ey) * .5 + Math.cos(a) * curve;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.lineWidth = .65 + Math.random() * 1.25;
    ctx.strokeStyle = Math.random() > .35 ? 'rgba(255,253,248,.62)' : 'rgba(204,190,168,.40)';
    ctx.stroke();
    dCtx.beginPath(); dCtx.moveTo(fx, fy); dCtx.quadraticCurveTo(cx, cy, ex, ey);
    dCtx.lineWidth = 1.1; dCtx.strokeStyle = 'rgba(140,0,140,.38)'; dCtx.stroke();
  }
  const edge = ctx.createRadialGradient(TEX_W * .5, TEX_H * .5, TEX_H * .42, TEX_W * .5, TEX_H * .5, TEX_W * .62);
  edge.addColorStop(0, 'rgba(244,241,234,0)'); edge.addColorStop(1, 'rgba(190,176,172,.42)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, TEX_W, TEX_H);
  return { color, data };
}

function drawOrganicRect(ctx, x, y, w, h, lw) {
  ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y);
  const n = 20;
  for (let i = 1; i <= n; i++) ctx.lineTo(x + (w * i) / n, y + Math.sin(i * 1.7) * 1.1);
  for (let i = 1; i <= n; i++) ctx.lineTo(x + w + Math.cos(i * 1.9) * 1.1, y + (h * i) / n);
  for (let i = 1; i <= n; i++) ctx.lineTo(x + w - (w * i) / n, y + h + Math.sin(i * 2.1) * 1.1);
  for (let i = 1; i <= n; i++) ctx.lineTo(x + Math.cos(i * 1.5) * 1.1, y + h - (h * i) / n);
  ctx.closePath(); ctx.stroke();
}
function drawKumikoCorner(ctx, x, y, sx, sy) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
  ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(0, 74); ctx.lineTo(74, 74); ctx.lineTo(74, 0); ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(50, 50); ctx.lineTo(50, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(26, 26); ctx.lineTo(26, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, 50); ctx.lineTo(74, 50); ctx.moveTo(50, 26); ctx.lineTo(50, 74); ctx.stroke();
  ctx.restore();
}
function drawMitsudomoe(ctx, cx, cy, radius) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineCap = 'round';
  for (let i = 0; i < 140; i++) {
    const t = i / 140;
    ctx.beginPath(); ctx.arc(0, 0, radius, t * Math.PI * 2, ((i + 1.2) / 140) * Math.PI * 2);
    ctx.lineWidth = 10 + Math.sin(t * Math.PI * 6) * 4.5; ctx.stroke();
  }
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, radius - 18, 0, Math.PI * 2); ctx.stroke();
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.rotate((k * Math.PI * 2) / 3);
    const headR = radius * .25;
    ctx.beginPath(); ctx.arc(0, -radius * .36, headR, 0, Math.PI * 2); ctx.fill();
    for (let s = 0; s < 55; s++) {
      const t = s / 55, a = -Math.PI * .5 + t * Math.PI * .92, o = radius * (.36 + t * .36);
      ctx.beginPath(); ctx.arc(Math.cos(a) * o, Math.sin(a) * o, headR * Math.pow(1 - t, .85) + 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
function drawHanko(ctx, x, y, symbol, number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.04);
  ctx.strokeStyle = ctx.fillStyle = '#6F2093';
  ctx.lineWidth = 4; ctx.strokeRect(0, 0, 84, 84);
  ctx.lineWidth = 1.5; ctx.strokeRect(6, 6, 72, 72);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 38px "Shippori Mincho", serif'; ctx.fillText(symbol, 42, 33);
  ctx.font = '700 13px "IBM Plex Mono", monospace'; ctx.fillText(number, 42, 65);
  ctx.restore();
}

/* ---------- Card face: paper + violet watermark + wet ink frame + hanko ---------- */
// opts.margin: distance from the paper edge to the outer ink border (default 68).
// opts.sealInBand: tuck the hanko into the bottom band, next to the right corner.
function drawFace(base, out, project, index, opts = {}) {
  const ctx = out.color.getContext('2d'), dCtx = out.data.getContext('2d', READBACK);
  ctx.drawImage(base.color, 0, 0); dCtx.drawImage(base.data, 0, 0);
  const margin = opts.margin ?? 68;

  // Shippō-tsunagi ground, very diluted so the copy stays readable
  ctx.save();
  ctx.beginPath(); ctx.rect(margin + 14, margin + 14, TEX_W - (margin + 14) * 2, TEX_H - (margin + 14) * 2); ctx.clip();
  ctx.strokeStyle = 'rgba(111,32,147,.038)'; ctx.lineWidth = 2;
  const r = 48;
  for (let y = margin; y <= TEX_H - margin + r; y += r) for (let x = margin; x <= TEX_W - margin + r; x += r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * .5, y + r * .5, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  // The transparent Irvine watermark is a CSS layer, keeping file:// SVGs
  // out of the canvas texture and its WebGL upload.

  // Wet ink: double brushed border + kumiko corners only
  const ink = document.createElement('canvas'); ink.width = TEX_W; ink.height = TEX_H;
  const iCtx = ink.getContext('2d', READBACK);
  iCtx.strokeStyle = iCtx.fillStyle = INK; iCtx.lineCap = iCtx.lineJoin = 'round';
  drawOrganicRect(iCtx, margin, margin, TEX_W - margin * 2, TEX_H - margin * 2, 4.6);
  drawOrganicRect(iCtx, margin + 15, margin + 15, TEX_W - (margin + 15) * 2, TEX_H - (margin + 15) * 2, 1.9);
  drawKumikoCorner(iCtx, margin + 15, margin + 15, 1, 1);
  drawKumikoCorner(iCtx, TEX_W - (margin + 15), margin + 15, -1, 1);
  drawKumikoCorner(iCtx, margin + 15, TEX_H - (margin + 15), 1, -1);
  drawKumikoCorner(iCtx, TEX_W - (margin + 15), TEX_H - (margin + 15), -1, -1);

  ctx.save(); ctx.filter = 'blur(3.6px)'; ctx.globalAlpha = .28; ctx.drawImage(ink, 0, 0); ctx.restore();
  ctx.save(); ctx.globalAlpha = .96; ctx.drawImage(ink, 0, 0); ctx.restore();

  const seal = opts.sealInBand
    ? [TEX_W - margin - 15 - 74 - 16 - 84, TEX_H - margin - 15 - 8 - 84]
    : [TEX_W - margin - 15 - 74 - 108, TEX_H - margin - 15 - 74 - 62];
  drawHanko(ctx, seal[0], seal[1], project.symbol, String(index + 1).padStart(2, '0'));

  // Data map: R = height (paper tooth + ink meniscus), G = wet mask
  const inkPx = iCtx.getImageData(0, 0, TEX_W, TEX_H).data;
  const mc = document.createElement('canvas'); mc.width = TEX_W; mc.height = TEX_H;
  const mCtx = mc.getContext('2d', READBACK); mCtx.filter = 'blur(2.2px)'; mCtx.drawImage(ink, 0, 0);
  const menPx = mCtx.getImageData(0, 0, TEX_W, TEX_H).data;
  const fin = dCtx.getImageData(0, 0, TEX_W, TEX_H), fp = fin.data;
  for (let i = 0; i < inkPx.length; i += 4) {
    const a = inkPx[i + 3] / 255, m = menPx[i + 3] / 255;
    if (a > .02 || m > .02) { fp[i] = Math.min(255, fp[i] + m * 170); fp[i + 1] = Math.round(a * 255); }
  }
  dCtx.putImageData(fin, 0, 0);
}


let base;
window.WashiPaper={makePaperBase,drawFace,create(project,index,opts){base ||= makePaperBase();const out={color:document.createElement('canvas'),data:document.createElement('canvas')};for(const c of Object.values(out)){c.width=TEX_W;c.height=TEX_H;}drawFace(base,out,project,index,opts);return out;}};
})();
