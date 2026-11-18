/* Paper textures, traditional frame drawing and wet-ink shader adapted directly
   from the user-supplied active_theory_x_washi_sumi_e_showcase.html.
   Project lettering/content is owned by scripts/stories.js. */
(() => {
'use strict';
// Canvases read back with getImageData stay in CPU memory: a GPU-backed canvas
// would stall on every readback (hundreds of ms per card face).
const READBACK = { willReadFrequently: true };
let cachedBaseColor = null, cachedBaseData = null;
function getWashiBaseCanvases(width, height) {
    if (cachedBaseColor && cachedBaseData) return { baseColor: cachedBaseColor, baseData: cachedBaseData };
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = width;
    colorCanvas.height = height;
    const ctx = colorCanvas.getContext('2d');

    const dataCanvas = document.createElement('canvas');
    dataCanvas.width = width;
    dataCanvas.height = height;
    const dCtx = dataCanvas.getContext('2d');

    // 1. Eggshell Washi Paper Base (#F4F1EA)
    ctx.fillStyle = '#F4F1EA';
    ctx.fillRect(0, 0, width, height);

    dCtx.fillStyle = 'rgb(90, 0, 0)';
    dCtx.fillRect(0, 0, width, height);

    // Organic mottled pulp clouds
    for (let i = 0; i < 65; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 80 + Math.random() * 220;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        const warmShift = Math.random() > 0.5 ? 'rgba(232, 224, 208, 0.22)' : 'rgba(252, 250, 245, 0.25)';
        grad.addColorStop(0, warmShift);
        grad.addColorStop(1, 'rgba(244, 241, 234, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    // Fine paper pulp grain & bump noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const bumpData = dCtx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const bPixels = bumpData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        const grain = (Math.random() - 0.5) * 14;
        pixels[i] = Math.min(255, Math.max(0, pixels[i] + grain));
        pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + grain));
        pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + grain * 0.9));

        const tooth = 85 + (Math.random() - 0.5) * 55;
        bPixels[i] = tooth;
        bPixels[i + 1] = 0;
        bPixels[i + 2] = tooth;
    }
    ctx.putImageData(imgData, 0, 0);
    dCtx.putImageData(bumpData, 0, 0);

    // Long Kozo Mulberry Fibers embedded in the handmade paper
    ctx.save();
    dCtx.save();
    for (let f = 0; f < 420; f++) {
        const fx = Math.random() * width;
        const fy = Math.random() * height;
        const len = 18 + Math.random() * 55;
        const angle = Math.random() * Math.PI * 2;
        const curve = (Math.random() - 0.5) * 24;

        const ex = fx + Math.cos(angle) * len;
        const ey = fy + Math.sin(angle) * len;
        const cx = (fx + ex) * 0.5 - Math.sin(angle) * curve;
        const cy = (fy + ey) * 0.5 + Math.cos(angle) * curve;

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.lineWidth = 0.6 + Math.random() * 1.1;
        ctx.strokeStyle = Math.random() > 0.35
            ? 'rgba(255, 253, 248, 0.55)'
            : 'rgba(210, 198, 178, 0.35)';
        ctx.stroke();

        dCtx.beginPath();
        dCtx.moveTo(fx, fy);
        dCtx.quadraticCurveTo(cx, cy, ex, ey);
        dCtx.lineWidth = 1.0;
        dCtx.strokeStyle = 'rgba(135, 0, 135, 0.35)';
        dCtx.stroke();
    }
    ctx.restore();
    dCtx.restore();

    // Subtle Deckled Edge Vignette
    const edgeGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, width * 0.42,
        width * 0.5, height * 0.5, height * 0.62
    );
    edgeGrad.addColorStop(0, 'rgba(244, 241, 234, 0)');
    edgeGrad.addColorStop(1, 'rgba(196, 184, 164, 0.38)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, width, height);

    cachedBaseColor = colorCanvas;
    cachedBaseData = dataCanvas;
    return { baseColor: cachedBaseColor, baseData: cachedBaseData };
}

function createWashiCardTextures(project, logoImg) {
    const width = 1024;
    const height = 1440;
    const { baseColor, baseData } = getWashiBaseCanvases(width, height);

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = width;
    colorCanvas.height = height;
    const ctx = colorCanvas.getContext('2d');
    ctx.drawImage(baseColor, 0, 0);

    const dataCanvas = project.back ? null : document.createElement('canvas');
    let dCtx = null;
    if (dataCanvas) {
        dataCanvas.width = width;
        dataCanvas.height = height;
        dCtx = dataCanvas.getContext('2d', READBACK);
        dCtx.drawImage(baseData, 0, 0);
    }

    // 2. Traditional Japanese Frame & Wet Sumi-e Ink Layer
    const inkCanvas = document.createElement('canvas');
    inkCanvas.width = width;
    inkCanvas.height = height;
    const iCtx = inkCanvas.getContext('2d', READBACK);

    if (!project.back) drawJapaneseFrame(iCtx, width, height, project.borderStyle);
    if (!project.back) drawSumiCalligraphyAndArt(iCtx, width, height, project);

    // Subtle absorbed ink bleed halo
    ctx.save();
    ctx.filter = 'blur(3.5px)';
    ctx.globalAlpha = 0.28;
    ctx.drawImage(inkCanvas, 0, 0);
    ctx.restore();

    // Crisp wet black sumi ink
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(inkCanvas, 0, 0);
    ctx.restore();

    // Hanko Artist Stamp with Irvine Logo (Front & Back)
    if (!project.back) {
        drawHankoSeal(ctx, width - 220, height - 240, project.number, logoImg);
    } else {
        drawHankoSeal(ctx, width - 220, height - 240, 'IRV', logoImg);
    }

    if (!project.back) {
        // Transfer Ink Layer into Data Canvas (G = wet mask, R = raised ink meniscus)
        const inkPixels = iCtx.getImageData(0, 0, width, height).data;
        const finalData = dCtx.getImageData(0, 0, width, height);
        const fPixels = finalData.data;

        const meniscusCanvas = document.createElement('canvas');
        meniscusCanvas.width = width;
        meniscusCanvas.height = height;
        const mCtx = meniscusCanvas.getContext('2d', READBACK);
        mCtx.filter = 'blur(2.2px)';
        mCtx.drawImage(inkCanvas, 0, 0);
        const meniscusPixels = mCtx.getImageData(0, 0, width, height).data;

        for (let i = 0; i < inkPixels.length; i += 4) {
            const inkAlpha = inkPixels[i + 3] / 255;
            const meniscusAlpha = meniscusPixels[i + 3] / 255;

            if (inkAlpha > 0.02 || meniscusAlpha > 0.02) {
                fPixels[i] = Math.min(255, fPixels[i] + meniscusAlpha * 165);
                fPixels[i + 1] = Math.min(255, Math.round(inkAlpha * 255));
            }
        }
        dCtx.putImageData(finalData, 0, 0);
    }

    const colorTex = new THREE.CanvasTexture(colorCanvas);
    colorTex.anisotropy = 4;
    colorTex.needsUpdate = true;

    const dataTex = project.back ? null : new THREE.CanvasTexture(dataCanvas);
    if (dataTex) {
        dataTex.anisotropy = 4;
        dataTex.needsUpdate = true;
    }

    return { colorTex, dataTex };
}

function drawJapaneseFrame(ctx, w, h, style) {
    const margin = 64;
    const band = 56;
    const innerX = margin + band;
    const innerY = margin + band;
    const innerW = w - (margin + band) * 2;
    const innerH = h - (margin + band) * 2;

    ctx.save();
    ctx.strokeStyle = '#0c0c0e';
    ctx.fillStyle = '#0c0c0e';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawOrganicRect(ctx, margin, margin, w - margin * 2, h - margin * 2, 5.5);
    drawOrganicRect(ctx, margin + 10, margin + 10, w - (margin + 10) * 2, h - (margin + 10) * 2, 2.2);

    drawOrganicRect(ctx, innerX, innerY, innerW, innerH, 4.5);
    drawOrganicRect(ctx, innerX - 8, innerY - 8, innerW + 16, innerH + 16, 1.8);

    ctx.save();
    ctx.beginPath();
    ctx.rect(margin + 10, margin + 10, w - (margin + 10) * 2, h - (margin + 10) * 2);
    ctx.rect(innerX - 8, innerY - 8, innerW + 16, innerH + 16);
    ctx.clip('evenodd');

    if (style === 'seigaiha') {
        const r = 34;
        for (let row = 0; row < h / (r * 0.5) + 2; row++) {
            const y = row * (r * 0.52);
            const offsetX = (row % 2) * r;
            for (let col = -1; col < w / (r * 2) + 2; col++) {
                const x = col * (r * 2) + offsetX;
                ctx.beginPath();
                ctx.arc(x, y, r, Math.PI, 0);
                ctx.fillStyle = '#F4F1EA';
                ctx.fill();

                for (let ring = 1; ring <= 3; ring++) {
                    ctx.beginPath();
                    ctx.arc(x, y, (r / 3) * ring, Math.PI, 0);
                    ctx.lineWidth = ring === 3 ? 3.2 : 2.0;
                    ctx.strokeStyle = '#0c0c0e';
                    ctx.stroke();
                }
            }
        }
    } else if (style === 'asanoha') {
        const step = 48;
        ctx.lineWidth = 2.1;
        for (let y = 0; y <= h + step; y += step) {
            for (let x = 0; x <= w + step; x += step) {
                const cx = x + ((Math.round(y / step) % 2) * step * 0.5);
                const cy = y;
                for (let a = 0; a < 6; a++) {
                    const rad = (a * Math.PI) / 3;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(rad) * step * 0.58, cy + Math.sin(rad) * step * 0.58);
                    ctx.stroke();
                }
                ctx.strokeRect(x - step * 0.5, y - step * 0.5, step, step);
            }
        }
    } else {
        const r = 28;
        const dx = r * 1.732;
        const dy = r * 1.5;
        ctx.lineWidth = 2.4;
        for (let row = 0; row < h / dy + 2; row++) {
            for (let col = 0; col < w / dx + 2; col++) {
                const cx = col * dx + (row % 2) * (dx * 0.5);
                const cy = row * dy;
                drawHexagon(ctx, cx, cy, r * 0.92);
                drawHexagon(ctx, cx, cy, r * 0.55);
            }
        }
    }
    ctx.restore();

    drawJapaneseCornerCloud(ctx, innerX + 8, innerY + 8, 1, 1);
    drawJapaneseCornerCloud(ctx, innerX + innerW - 8, innerY + 8, -1, 1);
    drawJapaneseCornerCloud(ctx, innerX + 8, innerY + innerH - 8, 1, -1);
    drawJapaneseCornerCloud(ctx, innerX + innerW - 8, innerY + innerH - 8, -1, -1);

    ctx.restore();
}

function drawOrganicRect(ctx, x, y, w, h, baseWidth) {
    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const steps = 16;
    for (let i = 1; i <= steps; i++) {
        ctx.lineTo(x + (w * i) / steps, y + Math.sin(i * 1.7) * 1.2);
    }
    for (let i = 1; i <= steps; i++) {
        ctx.lineTo(x + w + Math.cos(i * 1.9) * 1.2, y + (h * i) / steps);
    }
    for (let i = 1; i <= steps; i++) {
        ctx.lineTo(x + w - (w * i) / steps, y + h + Math.sin(i * 2.1) * 1.2);
    }
    for (let i = 1; i <= steps; i++) {
        ctx.lineTo(x + Math.cos(i * 1.5) * 1.2, y + h - (h * i) / steps);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawHexagon(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawJapaneseCornerCloud(ctx, x, y, sx, sy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    ctx.fillStyle = '#F4F1EA';
    ctx.strokeStyle = '#0c0c0e';
    ctx.lineWidth = 4.2;

    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(115, -12);
    ctx.bezierCurveTo(125, 12, 95, 28, 72, 18);
    ctx.bezierCurveTo(85, 42, 55, 58, 36, 40);
    ctx.bezierCurveTo(54, 66, 38, 92, 16, 76);
    ctx.bezierCurveTo(24, 102, 4, 124, -12, 112);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(28, 26, 12, 0.2, Math.PI * 1.65);
    ctx.lineWidth = 3.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 12, 8, 0.4, Math.PI * 1.7);
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.restore();
}

/* ---------- Ink symbols: one bold brush mark per project ----------
   Same brush as the original ensō: dense segments whose line width swells
   with the pressure curve sin(t·π), so the wet-ink shader reads them alike. */

function sumiStroke(ctx, pts, maxW, minW = 6) {
    for (let i = 0; i < pts.length - 1; i++) {
        const t = i / (pts.length - 1);
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
        ctx.lineWidth = Math.sin(t * Math.PI) * maxW + minW;
        ctx.stroke();
    }
}
function arcPath(cx, cy, r, a0, a1, n = 90) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n, a = a0 + (a1 - a0) * t;
        const rr = r + Math.sin(t * 8) * 3;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
}
function cubicPath(p0, p1, p2, p3, n = 40) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push([
            u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        ]);
    }
    return pts;
}

const INK_SYMBOLS = {
    // 基 Programming Fundamentals: a pair of code braces.
    braces(ctx) {
        for (const side of [-1, 1]) {
            const m = ([x, y]) => [512 + side * (512 - x), y];
            const top = cubicPath([462, 318], [392, 322], [418, 470], [362, 528]).map(m);
            const bottom = cubicPath([362, 528], [418, 586], [392, 734], [462, 740]).map(m);
            sumiStroke(ctx, top.concat(bottom.slice(1)), 34, 6);
        }
    },

    // 共 Game Arena · Building Together: two ensō rings overlapping.
    linked_rings(ctx) {
        sumiStroke(ctx, arcPath(424, 530, 160, -Math.PI * .7, Math.PI * 1.15), 30, 5);
        sumiStroke(ctx, arcPath(600, 530, 160, Math.PI * .3, Math.PI * 2.15), 30, 5);
    },

    // 旅 Suica · From Tap to Insight: the contactless tap waves.
    tap_waves(ctx) {
        const cx = 372, cy = 530;
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
        [[105, 30], [185, 34], [265, 38]].forEach(([r, w]) =>
            sumiStroke(ctx, arcPath(cx, cy, r, -Math.PI * .27, Math.PI * .27, 60), w, 5));
    },

    // 知 AI Quest: a single neuron, three inputs brushed into one output.
    neuron(ctx) {
        const out = [668, 530];
        [[356, 352], [340, 530], [356, 708]].forEach(([x, y]) => {
            sumiStroke(ctx, cubicPath([x, y], [x + 120, y], [out[0] - 150, out[1] + (y - out[1]) * .2], out), 24, 6);
            ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.fill();
        });
        ctx.beginPath(); ctx.arc(out[0], out[1], 46, 0, Math.PI * 2); ctx.fill();
    },

    // 静 Minimal Launcher: a phone outline drawn in one open ensō-like stroke.
    phone(ctx) {
        const x = 392, y = 312, w = 240, h = 440, r = 52, pts = [];
        const corners = [[x + r, y + r, Math.PI], [x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2]];
        corners.forEach(([cx, cy, a], k) => {
            for (let i = 0; i <= 14; i++) {
                const aa = a + (Math.PI / 2) * i / 14;
                pts.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r]);
            }
            const [nx, ny, na] = corners[(k + 1) % 4];
            const ex = nx + Math.cos(na) * r, ey = ny + Math.sin(na) * r, [sx, sy] = pts[pts.length - 1];
            if (k < 3) for (let i = 1; i < 16; i++) pts.push([sx + (ex - sx) * i / 16, sy + (ey - sy) * i / 16]);
        });
        // Leave the stroke open on the left side, like the ensō's gap.
        const [lx, ly] = pts[pts.length - 1];
        for (let i = 1; i <= 12; i++) pts.push([lx, ly - (h - 2 * r - 60) * i / 12]);
        sumiStroke(ctx, pts.map(([px, py], i) => [px + Math.sin(i * .4) * 1.5, py]), 32, 6);
    }
};

function drawSumiCalligraphyAndArt(ctx, w, h, project) {
    ctx.save();
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#09090b';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Symbols are drawn around (512, 530); shrink them into the band above the
    // kanji (which starts near y = 630) so the two never overlap.
    const symbol = INK_SYMBOLS[project.brushType];
    if (symbol) {
        ctx.save();
        ctx.translate(w * .5, 392);
        ctx.scale(.7, .7);
        ctx.translate(-512, -530);
        symbol(ctx, w, h);
        ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 260px "Shippori Mincho", serif';
    ctx.fillText(project.symbol, w * .5, h * .53);
    ctx.textAlign = 'left';
    ctx.font = '500 30px "IBM Plex Mono", monospace';
    ctx.fillText('NO.' + project.number + ' / 2026', 164, 1000);
    ctx.font = '700 62px "Shippori Mincho", serif';
    ctx.fillText(project.title, 160, 1100, 700);
    ctx.font = '500 34px "IBM Plex Mono", monospace';
    ctx.fillText(project.meaning.toUpperCase(), 164, 1180, 600);

    ctx.restore();
}

function drawTaperedBrushStroke(ctx, x1, y1, cx, cy, x2, y2, maxThickness) {
    const steps = 45;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const invT = 1 - t;
        const px = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
        const py = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
        const radius = Math.sin(t * Math.PI) * (maxThickness * 0.5) + 1.5;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawHankoSeal(ctx, x, y, idText, logoImg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.04);

    ctx.strokeStyle = '#6F2093';
    ctx.fillStyle = '#6F2093';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 76, 76);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(5, 5, 66, 66);

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, 10, 9, 56, 37);
    } else {
        ctx.font = '800 26px "Shippori Mincho", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('作', 38, 28);
    }
    ctx.font = '700 14px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(idText, 38, 59);

    ctx.restore();
}

function createPaperEdgeTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#E5DFD2';
    ctx.fillRect(0, 0, 256, 128);

    for (let y = 0; y < 128; y += 3) {
        ctx.fillStyle = y % 6 === 0
            ? 'rgba(182, 170, 150, 0.45)'
            : 'rgba(252, 249, 242, 0.5)';
        ctx.fillRect(0, y, 256, 1.5);
    }

    for (let i = 0; i < 600; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(160,148,128,0.35)' : 'rgba(255,255,255,0.4)';
        ctx.fillRect(Math.random() * 256, Math.random() * 128, 3, 1.5);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 1);
    return tex;
}

// --- CUSTOM WET-INK SPECULAR & LIQUID RIPPLE SHADER MATERIAL ---

function createWashiWetInkMaterial(colorTex, dataTex) {
    return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uColorMap: { value: colorTex },
            uDataMap: { value: dataTex },
            uTime: { value: 0 },
            uLightPos: { value: new THREE.Vector3(1.5, 2.0, 4.5) },
            uWetIntensity: { value: 1.0 },
            uHover: { value: 0.0 },
            uOpacity: { value: 1.0 },
            uShade: { value: 1.0 },
            uVideoMap: { value: colorTex },
            uHasVideo: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormalWorld;
            varying vec3 vWorldPos;

            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPosition.xyz;
                vNormalWorld = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D uColorMap;
            uniform sampler2D uDataMap;
            uniform float uTime;
            uniform vec3 uLightPos;
            uniform float uWetIntensity;
            uniform float uHover;
            uniform float uOpacity;
            uniform float uShade;
            uniform sampler2D uVideoMap;
            uniform float uHasVideo;

            varying vec2 vUv;
            varying vec3 vNormalWorld;
            varying vec3 vWorldPos;

            void main() {
                vec2 texel = vec2(1.0 / 1024.0, 1.0 / 1440.0);

                // Sample data map: R = paper + ink meniscus height, G = wet ink liquid mask
                vec4 centerData = texture2D(uDataMap, vUv);
                float wetMask = centerData.g;

                // Ambient air-current & breeze ripples across the wet ink surface (active even with zero mouse input)
                vec2 rippleOffset = vec2(0.0);
                if (wetMask > 0.05) {
                    float breezePhase = uTime * 1.65 + vWorldPos.x * .014 - vWorldPos.y * .011;
                    float wave1 = sin(vUv.x * 36.0 + breezePhase) + 0.5 * sin(vUv.x * 74.0 - uTime * 2.2);
                    float wave2 = cos(vUv.y * 42.0 - breezePhase * 0.85) + 0.5 * cos(vUv.y * 80.0 + uTime * 1.8);
                    rippleOffset = vec2(wave1, wave2) * 0.00055 * wetMask * uWetIntensity;
                }

                vec4 albedo = texture2D(uColorMap, vUv + rippleOffset);
                if (uHasVideo * uHover > 0.001) {
                    vec3 preview = texture2D(uVideoMap, vUv).rgb;
                    float mono = dot(preview, vec3(.2126, .7152, .0722));
                    float videoArea = smoothstep(.13, .18, vUv.x) * (1.0 - smoothstep(.82, .87, vUv.x))
                        * smoothstep(.18, .25, vUv.y) * (1.0 - smoothstep(.83, .88, vUv.y));
                    albedo.rgb *= 1.0 - (1.0 - mono) * .42 * uHover * uHasVideo * videoArea * (1.0 - wetMask);
                }

                // Compute micro-surface normal from height map gradients (Paper tooth + raised wet ink dome)
                float hL = texture2D(uDataMap, vUv - vec2(texel.x, 0.0)).r;
                float hR = texture2D(uDataMap, vUv + vec2(texel.x, 0.0)).r;
                float hD = texture2D(uDataMap, vUv - vec2(0.0, texel.y)).r;
                float hU = texture2D(uDataMap, vUv + vec2(0.0, texel.y)).r;

                // Amplify meniscus curvature on wet ink for authentic liquid dome reflections
                float bumpStrength = mix(1.6, 5.2, wetMask);
                float liquidRippleX = 0.0;
                float liquidRippleY = 0.0;
                if (wetMask > 0.01) {
                    // Autonomous traveling air-breeze waves perturbing the liquid meniscus normal
                    float airGust = sin(uTime * 0.9 + vWorldPos.x * .008) * 0.35 + 0.85;
                    liquidRippleX = (
                        sin(vUv.y * 68.0 + uTime * 2.4 + vUv.x * 14.0) * 0.065 +
                        cos(vUv.x * 45.0 - uTime * 1.7) * 0.04
                    ) * wetMask * uWetIntensity * airGust;

                    liquidRippleY = (
                        cos(vUv.x * 72.0 - uTime * 2.1 + vUv.y * 12.0) * 0.065 +
                        sin(vUv.y * 50.0 + uTime * 1.5) * 0.04
                    ) * wetMask * uWetIntensity * airGust;
                }

                vec3 localNormal = normalize(vec3(
                    (hL - hR) * bumpStrength + liquidRippleX,
                    (hD - hU) * bumpStrength + liquidRippleY,
                    1.0
                ));

                // Transform perturbed local normal into world space
                vec3 worldNormal = normalize(vNormalWorld + vec3(localNormal.x, localNormal.y, 0.0) * 0.65);

                // Lighting vectors
                vec3 lightDir = normalize(uLightPos - vWorldPos);
                float diff = max(dot(worldNormal, lightDir), 0.0);
                float ambient = 0.62;
                vec3 paperLighting = albedo.rgb * (ambient + diff * 0.48);

                // Deep wet ink darkening (fresh ink looks richer & deeper black)
                vec3 finalColor = mix(paperLighting, paperLighting * 0.58, wetMask * 0.65);

                if (wetMask > 0.01) {
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    vec3 halfVec = normalize(lightDir + viewDir);
                    float shininess = mix(12.0, 145.0, wetMask);
                    float specAngle = max(dot(worldNormal, halfVec), 0.0);
                    float specular = pow(specAngle, shininess);
                    float fresnel = pow(1.0 - max(dot(worldNormal, viewDir), 0.0), 3.0);
                    float wetReflection = (specular * 1.35 + fresnel * 0.32 * diff) * wetMask * uWetIntensity;
                    finalColor += vec3(0.98, 0.97, 0.94) * wetReflection * (1.0 + uHover * 0.25);
                }
                gl_FragColor = vec4(finalColor * uShade, uOpacity);
            }
        `
    });
}

// Scene adapter follows.
window.createWashiStage = function createWashiStage(container, cards, requestRender) {
  if (!window.THREE) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 5000);
  camera.position.z = 1600;
  scene.add(new THREE.AmbientLight(0xf4f1ea, .72));
  const key = new THREE.DirectionalLight(0xfffcf5, .85); key.position.set(400, 600, 800); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd6d3d1, .45); rim.position.set(-500, -300, 400); scene.add(rim);
  const meshes = [], artStyles = ['braces', 'linked_rings', 'tap_waves', 'neuron', 'phone'];
  const borders = ['seigaiha', 'asanoha', 'kikkou', 'seigaiha', 'asanoha'];
  let width = 1, height = 1, ready = false, lost = false, backDirty = false, frontDirty = false, staticDetailKey = '';

  /* The samurai head sits between two card layers. Cards and particles on the
     far side of the helix (z < 0) are rendered first and copied to this canvas
     beneath the head; the near side stays on the WebGL canvas above it. */
  const backLayer = document.createElement('canvas');
  backLayer.id = 'card-back-layer';
  backLayer.setAttribute('aria-hidden', 'true');
  const backCtx = backLayer.getContext('2d', { alpha: true });
  const samuraiStage = document.getElementById('samurai-stage');
  if (samuraiStage) samuraiStage.before(backLayer); else document.body.prepend(backLayer);

  // Iridescent motes orbiting the head on the same helix as the cards.
  const MOTES = 620, moteColors = ['#b79cff', '#5f9573', '#82ba96', '#6fe0d0', '#f1c56b', '#f4f1ea', '#b86ee0'];
  const motePositions = new Float32Array(MOTES * 3), moteSeeds = new Float32Array(MOTES * 3), moteTints = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) {
    // position = (orbit angle, height 0..1, radius factor); clustered like pollen.
    const cluster = Math.floor(Math.random() * 14);
    motePositions[i * 3] = cluster * 2.4 + (Math.random() - .5) * 1.1;
    motePositions[i * 3 + 1] = (cluster * .173 + (Math.random() - .5) * .16 + 1) % 1;
    motePositions[i * 3 + 2] = .32 + Math.pow(Math.random(), 1.6) * .95;
    moteSeeds[i * 3] = 2.2 + Math.pow(Math.random(), 2) * 8;
    moteSeeds[i * 3 + 1] = Math.random() * 6.283;
    moteSeeds[i * 3 + 2] = .65 + Math.random() * .7;
    const tint = new THREE.Color(moteColors[Math.floor(Math.random() * moteColors.length)]);
    moteTints[i * 3] = tint.r; moteTints[i * 3 + 1] = tint.g; moteTints[i * 3 + 2] = tint.b;
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  moteGeometry.setAttribute('aSeed', new THREE.BufferAttribute(moteSeeds, 3));
  moteGeometry.setAttribute('aTint', new THREE.BufferAttribute(moteTints, 3));
  const moteMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSpin: { value: 0 }, uRise: { value: 0 }, uTime: { value: 0 }, uSide: { value: 1 }, uOpacity: { value: 0 }, uGlitch: { value: 0 },
      uCenter: { value: new THREE.Vector2() }, uRadius: { value: 300 }, uHeight: { value: 900 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec3 aSeed; attribute vec3 aTint;
      uniform float uSpin, uRise, uTime, uSide, uOpacity, uRadius, uHeight, uPixelRatio, uGlitch; uniform vec2 uCenter;
      varying vec3 vTint; varying float vAlpha; varying float vBroken; varying float vSeed;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float a = position.x + uSpin * aSeed.z + sin(uTime * .3 + aSeed.y) * .12;
        float h = fract(position.y + uRise * aSeed.z) - .5;
        float r = uRadius * position.z * (1. + .18 * sin(h * 11. + aSeed.y));
        vec3 p = vec3(uCenter.x + sin(a) * r, uCenter.y + h * uHeight + sin(uTime * .5 + aSeed.y) * 6., cos(a) * r);
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSeed.x * 1.35 * uPixelRatio * 1600. / -mv.z;
        vTint = aTint;
        vAlpha = uOpacity * (1. - smoothstep(.36, .5, abs(h))) * (.55 + .45 * sin(uTime * .9 + aSeed.y * 3.));
        /* Corrupted-signal look, in step with the head: whole scanline bands slip
           sideways, motes drop frames, and some smear into broken streaks. */
        float tick = floor(uTime * 9.);
        float band = floor((gl_Position.y / gl_Position.w * .5 + .5) * 26.);
        float slip = step(1. - (.05 + .5 * uGlitch), hash(vec2(band, tick)));
        gl_Position.x += slip * (hash(vec2(tick, band)) - .5) * (.06 + .2 * uGlitch) * gl_Position.w;
        vBroken = step(.84 - .35 * uGlitch, hash(vec2(aSeed.y * 7.3, floor(uTime * 4.))));
        vAlpha *= step(.07 + .2 * uGlitch, hash(vec2(aSeed.y * 3.1, tick)));
        gl_PointSize *= 1. + vBroken * 1.9;
        vSeed = aSeed.y;
        // Each pass keeps only its own half of the orbit.
        if (p.z * uSide < 0.) gl_Position = vec4(2., 2., 2., 1.);
      }`,
    fragmentShader: `
      varying vec3 vTint; varying float vAlpha; varying float vBroken; varying float vSeed;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float blob(vec2 c) { return step(length(c - .5), .46); }
      void main() {
        // Each mote is a coarse 5x5 sprite with missing pixels and an RGB split.
        vec2 cell = (floor(gl_PointCoord * 5.) + .5) / 5.;
        float shift = .2 + .2 * vBroken;
        vec3 rgb = vec3(blob(cell + vec2(shift, 0.)), blob(cell), blob(cell - vec2(shift, 0.)));
        float hole = step(.24, hash(cell * 17. + vSeed));
        float streak = mix(1., step(abs(cell.y - .5), .11), vBroken);
        float lit = max(rgb.r, max(rgb.g, rgb.b)) * hole * streak;
        vec3 fringe = mix(vec3(1.), vTint, .72) * rgb + vTint * .18;
        gl_FragColor = vec4(fringe, vAlpha * lit);
      }`
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.frustumCulled = false; motes.renderOrder = 5; scene.add(motes);

  function resize(w, h) {
    width = w; height = h; renderer.setSize(w, h);
    backLayer.width = Math.max(1, w); backLayer.height = Math.max(1, h);
    staticDetailKey = '';
    camera.aspect = w / h; camera.fov = 2 * Math.atan(h / 3200) * 180 / Math.PI; camera.updateProjectionMatrix();
  }
  /* Painting the five cards takes over a second of main-thread time, and the
     first frame that shows them would also compile the shaders and upload ten
     1024x1440 textures. Both happen ahead of time instead: one card face per
     idle slot, then the GPU work, so neither the start gate nor the first
     scroll into the helix stalls. */
  const idle = window.requestIdleCallback
    ? fn => requestIdleCallback(fn, { timeout: 400 })
    : fn => setTimeout(fn, 16);
  function build(logoImg) {
    const edgeTexture = createPaperEdgeTexture();
    const backs = [];
    const steps = [() => getWashiBaseCanvases(1024, 1440)];
    cards.forEach((card, index) => steps.push(
      () => { backs[index] = backCardTexture(card, index); },
      () => buildCard(card, index, edgeTexture, logoImg, backs[index])
    ));
    const step = () => {
      const run = steps.shift();
      if (run) { run(); idle(step); return; }
      ready = true; document.documentElement.classList.add('webgl-cards'); requestRender();
      idle(() => warmGpu(edgeTexture));
    };
    idle(step);
  }
  function backCardTexture(card, index) {
    const texture = new THREE.CanvasTexture(window.WashiPaper.create(card.project, index, { margin: 26, sealInBand: true }).color);
    texture.anisotropy = 4;
    return texture;
  }
  function warmGpu(edgeTexture) {
    if (lost) return;
    const textures = [edgeTexture];
    meshes.forEach(({ front, back }) => textures.push(front.uniforms.uColorMap.value, front.uniforms.uDataMap.value, back.map));
    const upload = () => {
      if (lost) return;
      const texture = textures.shift();
      if (texture) { renderer.initTexture(texture); idle(upload); return; }
      renderer.compile(scene, camera);
    };
    upload();
  }
  function buildCard(card, index, edgeTexture, logoImg, backTexture) {
    const data = { ...card.project, number: String(index + 1).padStart(2, '0'), borderStyle: borders[index], brushType: artStyles[index] };
    const texture = createWashiCardTextures(data, logoImg);
    const front = createWashiWetInkMaterial(texture.colorTex, texture.dataTex);
    const edgeTone = new THREE.Color(0xe6dfd1), backTone = new THREE.Color(0xffffff);
    const edge = new THREE.MeshStandardMaterial({ map: edgeTexture, color: 0xe6dfd1, roughness: .92, metalness: .02, transparent: true });
    const back = new THREE.MeshBasicMaterial({ map: backTexture, color: 0xffffff, transparent: true });
    // Four true side faces, plus separately shaded front and back. Thickness
    // follows the reference's 0.095 / 2.45 heavy cardstock proportion.
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [edge, edge, edge, edge, front, back]);
    mesh.visible = false; scene.add(mesh);
    meshes.push({ mesh, front, edge, back, edgeTone, backTone, video: card.video, videoTexture: null, hover: 0 });
  }
  const IRVINE_STAMP_SRC = 'data:image/png;base64,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';
  const logoPromise = new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = IRVINE_STAMP_SRC;
  });
  Promise.all([document.fonts.ready, logoPromise]).then(([, logoImg]) => build(logoImg)).catch(error => console.warn('Paper material unavailable; using accessible fallback.', error));
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; document.documentElement.classList.remove('webgl-cards'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; document.documentElement.classList.add('webgl-cards'); requestRender(); });
  function render(poses, now, pointer, hovered, orbit = {}) {
    if (!ready || lost) return;
    const moteOpacity = orbit.opacity || 0;
    if (moteOpacity <= .005 && poses.every(pose => pose.opacity <= .005)) {
      // Nothing to draw: clear both layers once and stay idle.
      if (backDirty) { backCtx.clearRect(0, 0, backLayer.width, backLayer.height); backDirty = false; }
      if (frontDirty) { renderer.clear(); frontDirty = false; }
      staticDetailKey = '';
      return;
    }
    // When a single card is fully flipped open (detail === 1), its back face and
    // lighting are completely static and motes are hidden; render once and cache.
    if (moteOpacity <= .005) {
      let shownCount = 0, openIndex = -1;
      for (let i = 0; i < poses.length; i++) {
        if (poses[i].opacity > .005) { shownCount++; openIndex = i; }
      }
      if (shownCount === 1 && openIndex >= 0) {
        const p = poses[openIndex];
        if (Math.abs(p.ry - 180) < 0.05 && p.opacity > 0.999 && p.rx === 0 && p.rz === 0 && p.z === 0) {
          const key = `${openIndex}|${Math.round(p.width)}|${Math.round(p.height)}|${Math.round(p.y)}`;
          if (key === staticDetailKey) return;
          staticDetailKey = key;
        } else {
          staticDetailKey = '';
        }
      } else {
        staticDetailKey = '';
      }
    } else {
      staticDetailKey = '';
    }

    const u = moteMaterial.uniforms;
    u.uSpin.value = orbit.spin || 0; u.uRise.value = orbit.rise || 0; u.uTime.value = (now / 1000) % 600;
    u.uOpacity.value = moteOpacity; u.uGlitch.value = orbit.glitch || 0; u.uCenter.value.set(orbit.x || 0, orbit.y || 0);
    u.uRadius.value = orbit.radius || 300; u.uHeight.value = height * 1.25;
    motes.visible = moteOpacity > .005;
    let hasBehind = motes.visible, hasFront = motes.visible;
    meshes.forEach((item, index) => {
      const pose = poses[index];
      item.shown = pose.opacity > .005;
      item.behind = !pose.foreground && (pose.z || 0) < 0;
      // The showcased cover sits above the orbit, including foreground motes.
      // Restore normal depth ordering as soon as it rejoins the helix.
      item.mesh.renderOrder = pose.foreground ? 10 : 0;
      item.front.depthTest = item.edge.depthTest = item.back.depthTest = !pose.foreground;
      if (!item.shown) { item.mesh.visible = false; return; }
      if (item.behind) hasBehind = true; else hasFront = true;
      item.hover += ((hovered === index ? 1 : 0) - item.hover) * .12;
      item.mesh.position.set(pose.x, height / 2 - pose.y, pose.z || 0);
      item.mesh.rotation.set(-pose.rx * Math.PI / 180, pose.ry * Math.PI / 180, -pose.rz * Math.PI / 180);
      item.mesh.scale.set(pose.width * pose.scale, pose.height * pose.scale, 9 * pose.scale);
      item.front.uniforms.uTime.value = now / 1000;
      item.front.uniforms.uLightPos.value.set(pointer.x * 650 + 300, -pointer.y * 650 + 450, 1100);
      item.front.uniforms.uHover.value = item.hover;
      item.front.uniforms.uOpacity.value = pose.opacity;
      // Cards on the far side of the helix sit in the head's shadow.
      const shade = pose.shade ?? 1;
      item.front.uniforms.uShade.value = shade;
      item.edge.color.copy(item.edgeTone).multiplyScalar(shade);
      item.back.color.copy(item.backTone).multiplyScalar(shade);
      item.front.depthWrite = pose.opacity > .99;
      item.edge.opacity = pose.opacity; item.edge.depthWrite = pose.opacity > .99;
      item.back.opacity = pose.opacity; item.back.depthWrite = pose.opacity > .99;
      if (item.video.readyState >= 2 && !item.video.paused) {
        if (!item.videoTexture) item.videoTexture = new THREE.VideoTexture(item.video);
        item.front.uniforms.uVideoMap.value = item.videoTexture;
        item.front.uniforms.uHasVideo.value = 1;
      } else item.front.uniforms.uHasVideo.value = 0;
    });
    // Far half first, copied beneath the samurai only when behind objects exist; then the near half on top.
    if (hasBehind) {
      meshes.forEach(item => { item.mesh.visible = item.shown && item.behind; });
      u.uSide.value = -1;
      renderer.render(scene, camera);
      backCtx.clearRect(0, 0, backLayer.width, backLayer.height);
      backCtx.drawImage(renderer.domElement, 0, 0, backLayer.width, backLayer.height);
      backDirty = true;
    } else if (backDirty) {
      backCtx.clearRect(0, 0, backLayer.width, backLayer.height);
      backDirty = false;
    }
    if (hasFront) {
      meshes.forEach(item => { item.mesh.visible = item.shown && !item.behind; });
      u.uSide.value = 1;
      renderer.render(scene, camera);
      frontDirty = true;
    } else if (frontDirty) {
      renderer.clear();
      frontDirty = false;
    }
  }
  return { resize, render };
};
})();
