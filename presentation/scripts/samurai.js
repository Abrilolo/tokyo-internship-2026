function mountDitherVeil(container, options = {}) {
  const settings = {
    src: options.src || window.SAMURAI_HERO_SRC || 'photos/samurai-hero.jpg',
    fit: options.fit || 'contain',
    pattern: options.pattern || 'floyd',
    pixelSize: options.pixelSize ?? 1,
    levels: options.levels ?? 2,
    palette: options.palette || 'duotone',
    inkColor: options.inkColor || '#120f17',
    paperColor: options.paperColor || '#f4f1ea',
    contrast: options.contrast ?? 1.15,
    brightness: options.brightness ?? 0.02,
    revealRadius: options.revealRadius ?? 180,
    softness: options.softness ?? 0.6,
    linger: options.linger ?? 1,
    rimColor: options.rimColor || '#000000',
    rim: options.rim ?? 0,
    reverse: options.reverse ?? false,
    wander: options.wander ?? true,
    clickBurst: options.clickBurst ?? true,
    fx: options.fx ?? 0,
    glitch: 0
  };

  const ORDERED = { bayer: 0, noise: 1, lines: 2 };
  const KERNELS = {
    atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
    floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]]
  };
  const MASK_SCALE = 0.5, MAX_BURSTS = 4, BURST_SECONDS = 1.2, HOLD = 1.6, INTRO_MS = 1100;

  const hexToRgb = hex => {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, c => c + c);
    const n = parseInt(h.slice(0, 6), 16);
    return Number.isNaN(n) ? [0, 0, 0] : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  const fitScale = (w, h, iw, ih, contain) => {
    const ratio = w / h / (iw / ih);
    if (contain) return ratio > 1 ? [ratio, 1] : [1, 1 / ratio];
    return ratio > 1 ? [1, 1 / ratio] : [ratio, 1];
  };

  const wanderAt = (t, w, h) => [
    w * (0.5 + 0.24 * Math.sin(t * 0.53) + 0.06 * Math.sin(t * 1.31 + 0.6)),
    h * (0.5 + 0.22 * Math.sin(t * 0.71 + 1.1) + 0.06 * Math.cos(t * 1.57))
  ];

  const measureEdge = (context, image) => {
    const size = 32;
    context.canvas.width = size;
    context.canvas.height = size;
    context.drawImage(image, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data;
    const sum = [0, 0, 0], squares = [0, 0, 0];
    let count = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x > 0 && y > 0 && x < size - 1 && y < size - 1) continue;
        for (let c = 0; c < 3; c++) {
          const v = data[(y * size + x) * 4 + c] / 255;
          sum[c] += v;
          squares[c] += v * v;
        }
        count++;
      }
    }
    const matte = [sum[0] / count, sum[1] / count, sum[2] / count];
    const spread = matte.reduce((total, mean, c) => total + Math.sqrt(Math.max(0, squares[c] / count - mean * mean)), 0) / 3;
    return { matte, plain: spread < 0.06 };
  };

  /* Flood-fills the plain backdrop from the image border so the head can be cut
     out: cards drawn on a layer behind the canvas show around the silhouette. */
  const buildSilhouette = (image, matte) => {
    const n = 256, c = document.createElement('canvas');
    c.width = c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, n, n);
    const src = ctx.getImageData(0, 0, n, n), d = src.data;
    const state = new Uint8Array(n * n), stack = [];
    const plain = i => Math.hypot(d[i * 4] / 255 - matte[0], d[i * 4 + 1] / 255 - matte[1], d[i * 4 + 2] / 255 - matte[2]) < 0.075;
    const visit = i => { if (!state[i] && plain(i)) { state[i] = 1; stack.push(i); } };
    for (let k = 0; k < n; k++) { visit(k); visit((n - 1) * n + k); visit(k * n); visit(k * n + n - 1); }
    while (stack.length) {
      const i = stack.pop(), x = i % n, y = (i - x) / n;
      if (x > 0) visit(i - 1);
      if (x < n - 1) visit(i + 1);
      if (y > 0) visit(i - n);
      if (y < n - 1) visit(i + n);
    }
    for (let i = 0; i < n * n; i++) { const v = state[i] ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    ctx.putImageData(src, 0, 0);
    const soft = document.createElement('canvas');
    soft.width = soft.height = n;
    const sctx = soft.getContext('2d');
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, n, n);
    sctx.filter = 'blur(1.4px)';
    sctx.drawImage(c, 0, 0);
    return soft;
  };

  const diffuse = (pixels, cols, rows, kernel, levels, rgb, grade) => {
    const channels = rgb ? 3 : 1;
    const values = new Float32Array(cols * rows * channels);
    for (let i = 0; i < cols * rows; i++) {
      const r = pixels[i * 4] / 255, g = pixels[i * 4 + 1] / 255, b = pixels[i * 4 + 2] / 255;
      if (rgb) {
        values[i * 3] = grade(r);
        values[i * 3 + 1] = grade(g);
        values[i * 3 + 2] = grade(b);
      } else {
        values[i] = grade(0.2126 * r + 0.7152 * g + 0.0722 * b);
      }
    }
    const steps = levels - 1;
    const out = new Uint8Array(cols * rows * 4);
    for (let y = 0; y < rows; y++) {
      const dir = y & 1 ? -1 : 1;
      for (let i = 0; i < cols; i++) {
        const x = dir > 0 ? i : cols - 1 - i;
        const p = y * cols + x;
        for (let c = 0; c < channels; c++) {
          const old = values[p * channels + c];
          const q = Math.min(steps, Math.max(0, Math.round(old * steps))) / steps;
          const err = old - q;
          const byte = Math.round(q * 255);
          if (rgb) out[p * 4 + c] = byte;
          else out[p * 4] = out[p * 4 + 1] = out[p * 4 + 2] = byte;
          for (let k = 0; k < kernel.length; k++) {
            const nx = x + kernel[k][0] * dir, ny = y + kernel[k][1];
            if (nx < 0 || nx >= cols || ny >= rows) continue;
            values[(ny * cols + nx) * channels + c] += err * kernel[k][2];
          }
        }
        out[p * 4 + 3] = 255;
      }
    }
    return out;
  };

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) { canvas.remove(); return { wake: () => {}, set: () => {} }; }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const floatMask = !!gl.getExtension('EXT_color_buffer_float');

  const vertexSrc = `#version 300 es
  layout(location = 0) in vec2 position;
  layout(location = 1) in vec2 uv;
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const maskFragmentSrc = `#version 300 es
  precision highp float;
  uniform sampler2D tPrev;
  uniform vec2 uSize;
  uniform vec2 uFrom;
  uniform vec2 uTo;
  uniform float uRadius;
  uniform float uSoftness;
  uniform float uStrength;
  uniform float uFade;
  uniform float uHold;
  in vec2 vUv;
  out vec4 fragColor;
  float strokeDistance(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
    return length(p - a - ab * h);
  }
  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
    float trail = max(texture(tPrev, vUv).r - uFade, 0.0);
    float band = max(uRadius * uSoftness, 1.0) * uHold;
    float d = strokeDistance(p, uFrom, uTo);
    trail = max(trail, clamp((uRadius - d) / band, 0.0, 1.0) * uStrength);
    fragColor = vec4(trail, 0.0, 0.0, 1.0);
  }`;

  const viewFragmentSrc = `#version 300 es
  precision highp float;
  precision highp int;
  uniform sampler2D tImage;
  uniform sampler2D tMask;
  uniform sampler2D tDiffused;
  uniform vec2 uResolution;
  uniform vec2 uCover;
  uniform float uLod;
  uniform float uCell;
  uniform int uPattern;
  uniform int uPalette;
  uniform float uLevels;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform vec3 uRimColor;
  uniform float uRim;
  uniform float uContrast;
  uniform float uBrightness;
  uniform float uReverse;
  uniform float uIntro;
  uniform float uHold;
  uniform vec3 uMatte;
  uniform float uKey;
  uniform vec2 uSize;
  uniform vec4 uBursts[4];
  uniform float uBurstWidth;
  uniform sampler2D tSilhouette;
  uniform float uFx;
  uniform float uGlitch;
  uniform float uTime;
  in vec2 vUv;
  out vec4 fragColor;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bayer(vec2 cell) {
    ivec2 p = ivec2(mod(cell, 8.0));
    int v = p.x ^ p.y;
    int m = ((v & 1) << 5) | ((p.y & 1) << 4) | ((v & 2) << 2) | ((p.y & 2) << 1) | ((v & 4) >> 1) | ((p.y & 4) >> 2);
    return (float(m) + 0.5) / 64.0;
  }
  vec2 imageUv(vec2 uv) { return (uv - 0.5) * uCover + 0.5; }
  float within(vec2 p) {
    vec2 s = step(vec2(0.0), p) * step(p, vec2(1.0));
    return s.x * s.y;
  }
  vec3 grade(vec3 c) {
    return pow(clamp((c - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0), vec3(1.6));
  }
  float shockwave(vec2 p) {
    float value = 0.0;
    for (int i = 0; i < 4; i++) {
      vec4 burst = uBursts[i];
      if (burst.w <= 0.0) continue;
      float offset = distance(p, burst.xy) - burst.z;
      float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
      value = max(value, clamp(1.0 - edge, 0.0, 1.0) * burst.w);
    }
    return value;
  }
  vec3 toned(vec3 c) {
    return uPalette == 1 ? grade(c) : grade(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))));
  }
  vec3 quantize(vec3 v, float t) {
    float steps = max(uLevels - 1.0, 1.0);
    vec3 s = v * steps;
    vec3 base = floor(s);
    return min(base + step(vec3(t), s - base), vec3(steps)) / steps;
  }
  // Dither level (0 ink .. 1 paper) of one cell; shared by the RGB-split taps.
  float inkLevel(vec2 c) {
    vec2 ctr = (c + 0.5) * uCell;
    vec2 suv = imageUv(vec2(ctr.x / uResolution.x, 1.0 - ctr.y / uResolution.y));
    float fr = within(suv);
    float lv;
    if (uPattern == 3) {
      lv = texelFetch(tDiffused, clamp(ivec2(c), ivec2(0), textureSize(tDiffused, 0) - 1), 0).r;
    } else {
      lv = quantize(toned(mix(uMatte, textureLod(tImage, suv, uLod).rgb, fr)), bayer(c)).r;
    }
    return lv * max(fr, uKey);
  }
  void main() {
    vec2 px = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 cell = floor(px / uCell);

    // Glitch: random horizontal slices slip sideways for a few frames.
    float tick = floor(uTime * 9.0);
    float band = floor(px.y / uResolution.y * 26.0);
    float trig = step(1.0 - (0.03 + 0.55 * uGlitch) * uFx, hash(vec2(band, tick)));
    float slip = trig * (hash(vec2(tick, band)) - 0.5) * (0.035 + 0.09 * uGlitch) * uResolution.x / uCell;
    cell.x += floor(slip + 0.5);
    float split = floor((1.0 + trig * 4.0 + uGlitch * 5.0) * uFx + 0.5);

    vec2 center = (cell + 0.5) * uCell;
    vec2 cellUv = vec2(center.x / uResolution.x, 1.0 - center.y / uResolution.y);

    vec2 sampleUv = imageUv(cellUv);
    float framed = within(sampleUv);
    vec3 level = vec3(inkLevel(cell + vec2(split, 0.0)), inkLevel(cell), inkLevel(cell - vec2(split, 0.0)));

    // Iridescence: lit dots borrow the photograph's own hue plus a slow sheen.
    vec3 hue = textureLod(tImage, sampleUv, uLod + 1.5).rgb;
    hue /= max(max(hue.r, max(hue.g, hue.b)), 0.22);
    float flow = cellUv.y * 1.5 + cellUv.x * 0.6 + uTime * 0.06;
    vec3 sheen = 0.5 + 0.5 * cos(6.2832 * (flow + vec3(0.0, 0.33, 0.67)));
    vec3 paper = mix(uPaper, clamp(mix(hue, sheen, 0.26) * 1.05 + 0.08, 0.0, 1.0), 0.82 * uFx * framed);

    vec3 color = uInk + (paper - uInk) * level;

    vec2 point = vec2(cellUv.x, 1.0 - cellUv.y) * uSize;
    float mask = clamp(texture(tMask, cellUv).r * uHold, 0.0, 1.0);
    if (uBursts[0].w > 0.0) mask = max(mask, shockwave(point));
    float shown = mix(mask, 1.0 - mask, uReverse);
    if (shown > 0.001) {
      vec3 backdrop = mix(uInk, uPaper, toned(uMatte));
      vec2 photoUv = imageUv(vUv);
      vec3 raw = texture(tImage, photoUv).rgb;
      float plain = uKey * (1.0 - smoothstep(0.05, 0.22, distance(raw, uMatte)));
      vec3 photo = mix(mix(uInk, backdrop, uKey), mix(raw, backdrop, plain), within(photoUv));
      float order = bayer(cell.yx);
      float low = order * (1.0 - uRim);
      color = mix(color, uRimColor, step(low, shown) * step(0.001, uRim));
      color = mix(color, photo, step(low + uRim, shown));
    }

    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    float spread = length((cellUv - 0.5) * aspect) / length(aspect * 0.5);
    float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);
    float silhouette = texture(tSilhouette, sampleUv).r * framed;
    float alpha = mix(1.0, max(silhouette, max(level.r, level.b) * appear), uKey);
    fragColor = vec4(mix(uInk, color, appear) * alpha, alpha);
  }`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const createProg = fragSrc => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vertexSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  };

  const getUniforms = (p, names) => Object.fromEntries(names.map(name => [name, gl.getUniformLocation(p, name)]));
  const maskProg = createProg(maskFragmentSrc);
  const viewProg = createProg(viewFragmentSrc);
  const maskUniforms = getUniforms(maskProg, ['tPrev', 'uSize', 'uFrom', 'uTo', 'uRadius', 'uSoftness', 'uStrength', 'uFade', 'uHold']);
  const viewUniforms = getUniforms(viewProg, [
    'tImage', 'tMask', 'tDiffused', 'uResolution', 'uCover', 'uLod', 'uCell', 'uPattern', 'uPalette',
    'uLevels', 'uInk', 'uPaper', 'uRimColor', 'uRim', 'uContrast', 'uBrightness', 'uReverse',
    'uIntro', 'uHold', 'uMatte', 'uKey', 'uSize', 'uBursts', 'uBurstWidth', 'tSilhouette', 'uFx', 'uGlitch', 'uTime'
  ]);
  // The canvas is now a cut-out; the CSS still image is only a no-WebGL fallback.
  container.classList.add('dither-live');

  // Fullscreen Triangle VAO
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 2, 0, 0, 2]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

  const imageTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, imageTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18, 15, 23, 255]));

  const diffusedTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, diffusedTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const silhouetteTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, silhouetteTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  const createMaskTarget = (w, h) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, floatMask ? gl.RGBA16F : gl.RGBA, w, h, 0, gl.RGBA, floatMask ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, width: w, height: h };
  };

  let masks = [createMaskTarget(2, 2), createMaskTarget(2, 2)];
  const sampler = document.createElement('canvas');
  const samplerCtx = sampler.getContext('2d', { willReadFrequently: true });

  let image = null, introStart = 0, diffusedKey = '', diffusionBlocked = false;
  let width = 1, height = 1, raf = 0, last = performance.now(), trailUntil = 0, presence = 0, drift = 0, maskDirty = true;
  let matte = [0.07, 0.06, 0.09], keyPlain = 1, cover = [1, 1];
  const inkRgb = hexToRgb(settings.inkColor), paperRgb = hexToRgb(settings.paperColor), rimRgb = hexToRgb(settings.rimColor);
  const burstFlat = new Float32Array(16);
  const pointer = { x: 0, y: 0, clientX: 0, clientY: 0, pendingMove: false, inside: false, fresh: true, placed: false };
  const brush = { x: 0, y: 0, px: 0, py: 0 };
  const bursts = [];

  const applyLayout = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const mw = Math.max(2, Math.round(width * MASK_SCALE));
    const mh = Math.max(2, Math.round(height * MASK_SCALE));
    if (mw !== masks[0].width || mh !== masks[0].height) {
      masks.forEach(m => { gl.deleteFramebuffer(m.fb); gl.deleteTexture(m.tex); });
      masks = [createMaskTarget(mw, mh), createMaskTarget(mw, mh)];
    }
    if (!pointer.placed) { pointer.x = width / 2; pointer.y = height / 2; }
  };

  const updateDiffusion = cell => {
    if (!image || !samplerCtx) return;
    const cols = Math.ceil(canvas.width / cell);
    const rows = Math.ceil(canvas.height / cell);
    const key = [settings.pattern, settings.levels, cols, rows, canvas.width, canvas.height].join('|');
    if (key === diffusedKey) return;
    diffusedKey = key;

    const [cx, cy] = cover;
    const iw = image.naturalWidth, ih = image.naturalHeight;
    sampler.width = cols;
    sampler.height = rows;
    samplerCtx.fillStyle = `rgb(${matte[0] * 255}, ${matte[1] * 255}, ${matte[2] * 255})`;
    samplerCtx.fillRect(0, 0, cols, rows);

    const sx = (0.5 - 0.5 * cx) * iw, sy = (0.5 - 0.5 * cy) * ih;
    const sw = ((cols * cell) / canvas.width) * cx * iw, sh = ((rows * cell) / canvas.height) * cy * ih;
    const x0 = Math.max(sx, 0), y0 = Math.max(sy, 0);
    const x1 = Math.min(sx + sw, iw), y1 = Math.min(sy + sh, ih);
    if (x1 > x0 && y1 > y0) {
      samplerCtx.drawImage(image, x0, y0, x1 - x0, y1 - y0, ((x0 - sx) / sw) * cols, ((y0 - sy) / sh) * rows, ((x1 - x0) / sw) * cols, ((y1 - y0) / sh) * rows);
    }
    const grade = v => Math.pow(Math.min(1, Math.max(0, (v - 0.5) * settings.contrast + 0.5 + settings.brightness)), 1.6);
    const pixels = samplerCtx.getImageData(0, 0, cols, rows).data;
    const out = diffuse(pixels, cols, rows, KERNELS[settings.pattern], settings.levels, false, grade);
    gl.bindTexture(gl.TEXTURE_2D, diffusedTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, out);
  };

  const renderFrame = now => {
    raf = 0;
    if (container.style.visibility === 'hidden') return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (pointer.pendingMove) {
      pointer.pendingMove = false;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointer.x = (pointer.clientX - rect.left) * width / rect.width;
        pointer.y = (pointer.clientY - rect.top) * height / rect.height;
      }
    }

    let targetX = pointer.x, targetY = pointer.y;
    if (!pointer.inside && settings.wander) {
      drift = Math.min(1, drift + dt / 1.2);
      const [wx, wy] = wanderAt(now / 1000, width, height);
      const k = drift * drift * (3 - 2 * drift);
      targetX += (wx - targetX) * k;
      targetY += (wy - targetY) * k;
    } else {
      drift = 0;
    }

    presence += ((pointer.inside || settings.wander ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16));
    if (pointer.fresh) {
      brush.x = brush.px = targetX;
      brush.y = brush.py = targetY;
      pointer.fresh = false;
    } else {
      const follow = 1 - Math.exp(-dt / 0.035);
      brush.x += (targetX - brush.x) * follow;
      brush.y += (targetY - brush.y) * follow;
    }

    burstFlat.fill(0);
    for (let i = bursts.length - 1; i >= 0; i--) {
      if ((now - bursts[i].start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1);
    }
    const burstWidth = Math.max(60, settings.revealRadius * 0.9);
    bursts.forEach((b, i) => {
      const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS);
      const reach = Math.hypot(Math.max(b.x, width - b.x), Math.max(b.y, height - b.y)) + burstWidth;
      burstFlat[i * 4] = b.x;
      burstFlat[i * 4 + 1] = b.y;
      burstFlat[i * 4 + 2] = reach * Math.sin((k * Math.PI) / 2);
      burstFlat[i * 4 + 3] = 1 - k * k * k;
    });

    if (presence > 0.002) {
      trailUntil = now + settings.linger * 1000 + 150;
      maskDirty = true;
    }

    // 1. Render Mask Trail Pass (only when active or decaying)
    if (presence > 0.002 || now < trailUntil || maskDirty) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, masks[1].fb);
      gl.viewport(0, 0, masks[1].width, masks[1].height);
      gl.useProgram(maskProg);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, masks[0].tex);
      gl.uniform1i(maskUniforms.tPrev, 0);
      gl.uniform2f(maskUniforms.uSize, width, height);
      gl.uniform2f(maskUniforms.uFrom, brush.px, brush.py);
      gl.uniform2f(maskUniforms.uTo, brush.x, brush.y);
      gl.uniform1f(maskUniforms.uRadius, settings.revealRadius * (0.45 + 0.55 * presence));
      gl.uniform1f(maskUniforms.uSoftness, settings.softness);
      gl.uniform1f(maskUniforms.uStrength, presence);
      const minFade = floatMask ? 0 : 1.5 / 255;
      gl.uniform1f(maskUniforms.uFade, Math.max(settings.linger > 0 ? dt / settings.linger : 1, minFade));
      gl.uniform1f(maskUniforms.uHold, HOLD);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      masks.reverse();
      if (presence <= 0.002 && now >= trailUntil) maskDirty = false;
    }
    brush.px = brush.x;
    brush.py = brush.y;

    // 2. Update Error-Diffusion Dither Texture if needed
    const cell = Math.max(1, Math.round(settings.pixelSize * dpr));
    if (image) {
      cover = fitScale(canvas.width, canvas.height, image.naturalWidth, image.naturalHeight, settings.fit === 'contain');
    }
    let patternIndex = ORDERED[settings.pattern] ?? 0;
    if (KERNELS[settings.pattern] && image && !diffusionBlocked) {
      try {
        updateDiffusion(cell);
        patternIndex = 3;
      } catch {
        diffusionBlocked = true;
      }
    }

    // 3. Render Main View Pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(viewProg);
    gl.bindVertexArray(vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTex);
    gl.uniform1i(viewUniforms.tImage, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, masks[0].tex);
    gl.uniform1i(viewUniforms.tMask, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, diffusedTex);
    gl.uniform1i(viewUniforms.tDiffused, 2);

    const texelsPerPixel = image ? (cover[0] * image.naturalWidth) / canvas.width : 1;
    const intro = image ? Math.min(1, (now - introStart) / INTRO_MS) : 0;

    gl.uniform2f(viewUniforms.uResolution, canvas.width, canvas.height);
    gl.uniform2f(viewUniforms.uCover, cover[0], cover[1]);
    gl.uniform1f(viewUniforms.uLod, Math.log2(Math.max(cell * texelsPerPixel, 1)));
    gl.uniform1f(viewUniforms.uCell, cell);
    gl.uniform1i(viewUniforms.uPattern, patternIndex);
    gl.uniform1i(viewUniforms.uPalette, 0);
    gl.uniform1f(viewUniforms.uLevels, settings.levels);
    gl.uniform3fv(viewUniforms.uInk, inkRgb);
    gl.uniform3fv(viewUniforms.uPaper, paperRgb);
    gl.uniform3fv(viewUniforms.uRimColor, rimRgb);
    gl.uniform1f(viewUniforms.uRim, settings.rim);
    gl.uniform1f(viewUniforms.uContrast, settings.contrast);
    gl.uniform1f(viewUniforms.uBrightness, settings.brightness);
    gl.uniform1f(viewUniforms.uReverse, settings.reverse ? 1 : 0);
    gl.uniform1f(viewUniforms.uIntro, 1 - Math.pow(1 - intro, 2));
    gl.uniform1f(viewUniforms.uHold, HOLD);
    gl.uniform3fv(viewUniforms.uMatte, matte);
    gl.uniform1f(viewUniforms.uKey, keyPlain);
    gl.uniform2f(viewUniforms.uSize, width, height);
    gl.uniform4fv(viewUniforms.uBursts, burstFlat);
    gl.uniform1f(viewUniforms.uBurstWidth, burstWidth);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, silhouetteTex);
    gl.uniform1i(viewUniforms.tSilhouette, 3);
    gl.uniform1f(viewUniforms.uFx, settings.fx);
    gl.uniform1f(viewUniforms.uGlitch, settings.glitch);
    gl.uniform1f(viewUniforms.uTime, (now / 1000) % 600);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const busy = settings.glitch > 0.01 || pointer.inside || settings.wander || presence > 0.002 || bursts.length > 0 || now < trailUntil || (image && intro < 1);
    if (busy && container.style.visibility !== 'hidden') {
      raf = requestAnimationFrame(renderFrame);
    }
  };

  const wake = () => {
    if (raf || container.style.visibility === 'hidden') return;
    last = performance.now();
    raf = requestAnimationFrame(renderFrame);
  };

  const img = new Image();
  img.onload = () => {
    image = img;
    gl.bindTexture(gl.TEXTURE_2D, imageTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    try {
      const edge = measureEdge(samplerCtx, img);
      matte = edge.matte;
      keyPlain = edge.plain ? 1 : 0;
      if (edge.plain) {
        gl.bindTexture(gl.TEXTURE_2D, silhouetteTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildSilhouette(img, matte));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    } catch {}
    introStart = performance.now();
    applyLayout();
    wake();
  };
  img.src = settings.src;

  window.addEventListener('pointermove', e => {
    if (container.style.visibility === 'hidden') return;
    pointer.clientX = e.clientX;
    pointer.clientY = e.clientY;
    pointer.pendingMove = true;
    pointer.placed = true;
    if (!pointer.inside) { pointer.inside = true; pointer.fresh = true; }
    wake();
  }, { passive: true });

  document.addEventListener('pointerleave', () => { pointer.inside = false; wake(); });

  window.addEventListener('pointerdown', e => {
    if (!settings.clickBurst || container.style.visibility === 'hidden') return;
    const rect = container.getBoundingClientRect();
    bursts.push({ x: (e.clientX - rect.left) * width / rect.width, y: (e.clientY - rect.top) * height / rect.height, start: performance.now() });
    if (bursts.length > MAX_BURSTS) bursts.shift();
    wake();
  }, { passive: true });

  window.addEventListener('resize', () => {
    diffusedKey = '';
    applyLayout();
    wake();
  });

  applyLayout();
  wake();
  // fx: iridescence + RGB split strength (0..1); glitch: extra slice slip (0..1).
  const set = ({ fx, glitch }) => {
    if (fx !== undefined) settings.fx = fx;
    if (glitch !== undefined) settings.glitch = glitch;
  };
  return { wake, set };
}

