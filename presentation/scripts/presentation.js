(() => {
  'use strict';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const { create, state, clamp, smooth } = window.PresentationTimeline;
  // Card backs show the scenes from story-scenes.js when a project has them;
  // the scroll timeline gets one page per scene.
  const SCENES = window.STORY_SCENES || {};
  const pagesOf = project => SCENES[project.id] || project.pages;
  const projects = window.PRESENTATION_PROJECTS;
  const timeline = create(projects.map(project => ({ ...project, pages: pagesOf(project).map(page => ({ ...page, beatCount: page.html ? window.StoryScenes.beatCount(page) : 0 })) })));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const words = text => text.split(' ').map(word => `<span class="ink-word">${escape(word)}</span>`).join(' ');
  const show = (el, opacity, interactive = false) => {
    const clamped = clamp(opacity);
    const q = Math.round(clamped * 10000);
    if (el._opQ !== q) {
      el._opQ = q;
      el.style.opacity = (q / 10000).toFixed(4);
      const vis = clamped > .005 ? 'visible' : 'hidden';
      if (el._vis !== vis) { el._vis = vis; el.style.visibility = vis; }
    }
    if (interactive) {
      const hidden = clamped < .2;
      if (el._inertState !== hidden) {
        el._inertState = hidden;
        el.inert = hidden;
        el.setAttribute('aria-hidden', String(hidden));
      }
    }
  };
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  let width = document.documentElement.clientWidth, height = innerHeight, unitHeight = innerHeight;
  let mobile = matchMedia('(max-width: 700px)').matches, rigSize = 0;
  let cardW = 240, cardH = 337, fullW = 960, fullH = 700, helixRadius = 380, helixPitch = 300;
  let roomPivotX = 0, roomPivotY = 0, roomWindowZoom = 1, fujiFrames = [], fujiFloorMax = 1, japanAssetsWarmed = false;
  let position = scrollY / unitHeight, target = position, raf = 0, lastTime = 0;
  let pointer = { x: 0, y: 0 }, mouse = { x: 0, y: 0 }, hovered = -1;
  const refs = Object.fromEntries(['lightfall-stage','samurai-stage','samurai-rig','dither-veil-container','hero-copy','hero-top','hero-learn','hero-bottom','intro-copy','project-stage','chapter-counter','story-position','room-stage','door-stage','japan-copy','photo-stage','closing','scroll-hint','progress'].map(id => [id, document.getElementById(id)]));
  const projectHeading = $('.project-heading'), inkDisplacement = $('#ink-displacement');
  const doorLeft = $('.door-left'), doorRight = $('.door-right'), doorLight = $('.door-light');
  const roomImage = $('.room-photo'), roomShade = $('.room-shade'), photoCount = $('#photo-count');
  const progressBar = $('i', refs.progress), scrollHintText = $('span', refs['scroll-hint']), cursorEl = $('#cursor');
  let bootTime = null;
  let entering = false;

  const fujiStage = $('.fuji-approach'), fujiShots = $$('img', fujiStage);
  /* Summit position (fraction of each photograph) and Fuji's relative size in it. */
  const FUJI_SHOTS = [{ x: .525, y: .2676, size: 1 }, { x: .5225, y: .2643, size: 1 }, { x: .52, y: .2491, size: 1.25 }];
  const route = $('#scroll-route');
  const anchors = { hero: 0, index: timeline.chapters[0].start, japan: timeline.japan + .45, summit: timeline.japan + .45, thanks: timeline.closing + .7 };
  timeline.chapters.forEach(c => { anchors[c.id] = c.start + .15; });
  Object.entries(anchors).forEach(([id]) => {
    let section = document.getElementById(id);
    if (!section) { section = document.createElement('section'); section.id = id; route.append(section); }
    section.style.position = 'absolute';
  });
  const jump = value => scrollTo({ top: value * unitHeight, behavior: reduced ? 'instant' : 'smooth' });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const id = link.getAttribute('href').slice(1);
    if (!(id in anchors)) return;
    event.preventDefault(); history.pushState(null, '', `#${id}`); jump(anchors[id]);
  });

  function pageMarkup(page, i) {
    const visual = window.StoryVisuals.markup(page);
    return `<section class="story-page ${page.image||page.video?'media-page':''} ${visual ? '' : 'text-only'}" aria-label="${escape(page.title)}" data-page="${i}" inert><div class="story-copy"><div class="eyebrow">${escape(page.label)}</div><h2>${words(page.title)}</h2><p>${words(page.text)}</p>${page.link ? `<a href="${escape(page.link)}" target="_blank" rel="noopener">${escape(page.linkText)} <span>↗</span></a>` : ''}</div>${visual}</section>`;
  }
  function sceneMarkup(project, scene, i, total) {
    const count = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    return `<section class="story-page scene-page" aria-label="${escape(scene.label)}" data-page="${i}" inert><header class="scene-head"><span class="sc-station"><span class="kanji" lang="ja">${project.symbol}</span><span class="dash"></span><span>${scene.label}</span></span><span class="scene-count">${escape(project.title.split(' · ')[0])} · ${count}</span></header><div class="scene-body"><div class="scene">${window.StoryScenes.markup(scene)}</div></div></section>`;
  }
  const cards = projects.map((project, i) => {
    const el = document.createElement('article'); el.className = 'project-card';
    const n = String(i + 1).padStart(2, '0');
    const scenes = SCENES[project.id];
    const body = scenes ? scenes.map((scene, p) => sceneMarkup(project, scene, p, scenes.length)).join('') : project.pages.map(pageMarkup).join('');
    el.innerHTML = `<button class="card-face card-front" aria-label="Explore ${escape(project.title)}"><video class="preview-video" muted playsinline loop aria-hidden="true"></video><span class="card-number">CHAPTER ${n} / 2026</span><span class="card-seal"><img src="logo-irvine/logo-irvine.svg" alt="Irvine Systems"></span><span class="card-symbol" lang="ja">${project.symbol}</span><span class="card-meaning">${project.meaning}</span><span class="card-title">${project.title}</span><span class="card-description">${project.summary}</span></button><div class="card-face card-back${scenes ? ' has-scenes' : ''}" inert><div class="story-header"><span><span class="symbol" lang="ja">${project.symbol}</span>${project.title}</span><span class="story-header-meta"><span class="story-count"></span><span class="story-seal"><img src="logo-irvine/logo-irvine.svg" alt="Irvine Systems"></span></span></div><div class="story-body">${body}</div><div class="story-note"><span class="story-tools"></span><span class="story-note-right"><span class="story-seal story-seal-bottom"><img src="logo-irvine/logo-irvine.svg" alt=""></span></span></div></div>`;
    $('#card-space').append(el);
    const front = $('.card-front', el), video = $('video', el);
    video.muted = true;
    const card = { el, front, back: $('.card-back', el), storyCount: $('.story-count', el), storyTools: $('.story-tools', el), video, pages: $$('.story-page', el), project, stream: null };
    card.pages.forEach(page => { page.words = $$('.ink-word', page); page.videoEl = $('video', page); if (page.videoEl) page.videoEl.muted = true; });
    front.addEventListener('click', () => jump(timeline.chapters[i].read + .36));
    const enter = () => { hovered = i; startPreview(card, i); wake(); };
    const leave = () => { if (hovered === i) hovered = -1; stopPreview(card); wake(); };
    front.addEventListener('pointerenter', enter); front.addEventListener('pointerleave', leave);
    front.addEventListener('focus', enter); front.addEventListener('blur', leave);
    const nav = document.createElement('a'); nav.href = `#${project.id}`; nav.setAttribute('aria-label', project.title);
    nav.innerHTML = `<span>${n}</span><span class="nav-label">${['Programming','Game Arena','Suica','AI Quest','Launcher'][i]}</span>`;
    $('#chapter-nav').append(nav); card.nav = nav;
    return card;
  });
  window.StoryVisuals.mount();
  const washi = window.createWashiStage?.($('#card-materials'), cards, wake, mobile);

  /* Hover teasers are live, muted video streams drawn from project motifs.
     Set project.previewSrc to a local MP4/WebM to replace a teaser with footage. */
  function startPreview(card, index) {
    if (reduced || card.previewRaf) return;
    if (card.project.previewSrc) { card.video.src = card.project.previewSrc; card.video.play().catch(() => {}); return; }
    if (!HTMLCanvasElement.prototype.captureStream) return;
    const canvas = card.previewCanvas || document.createElement('canvas');
    card.previewCanvas = canvas; canvas.width = 432; canvas.height = 612;
    const ctx = canvas.getContext('2d');
    try { card.stream = canvas.captureStream(24); card.video.srcObject = card.stream; card.video.play().catch(() => {}); }
    catch { return; }
    const paint = now => {
      const t = now / 1000, w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#e9e4db'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#6F2093'; ctx.fillStyle = '#222'; ctx.lineWidth = 2;
      if (index === 0) {
        ctx.font = '15px monospace';
        const lines = ['class Node:', '  value, next', '', 'def traverse(root):', '  while node:', '    yield node.value', '    node = node.next', '', 'assert tree.is_balanced()', 'tests: 20 passed'];
        lines.forEach((line, n) => ctx.fillText(line.slice(0, Math.floor((t * 12 + n * 4) % 40)), 25, 70 + n * 43));
      } else if (index === 1) {
        for (let n = 0; n < 6; n++) { const y = 80 + n * 80; ctx.strokeRect(25, y, 380, 60); ctx.fillRect(45 + Math.sin(t + n) * 8, y + 19, 22, 22); ctx.fillRect(110, y + 19, 22, 22); ctx.font = '20px monospace'; ctx.fillText('vs', 76, y + 37); ctx.fillText('⋮', 370, y + 39); }
        ctx.fillStyle = '#6F2093'; ctx.fillRect(w - 130 - Math.sin(t) * 35, 0, 180, h);
      } else if (index === 2) {
        ctx.strokeRect(60, 200, 312, 190); ctx.font = '28px monospace'; ctx.fillText('Suica', 90, 250);
        for (let n = 0; n < 4; n++) { ctx.globalAlpha = 1 - ((t * .45 + n / 4) % 1); ctx.beginPath(); ctx.arc(216, 295, 30 + ((t * .45 + n / 4) % 1) * 210, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
      } else if (index === 3) {
        const nodes = [];
        [3, 5, 4, 2].forEach((count, layer) => { const column = []; for (let n = 0; n < count; n++) column.push([50 + layer * 110, h / 2 + (n - (count - 1) / 2) * 85]); nodes.push(column); });
        nodes.forEach((column, layer) => column.forEach(([x, y], n) => { if (nodes[layer + 1]) nodes[layer + 1].forEach(([xx, yy], j) => { ctx.globalAlpha = .15 + .7 * Math.abs(Math.sin(t + n + j)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.stroke(); }); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 7 + Math.sin(t * 2 + n) * 3, 0, Math.PI * 2); ctx.fill(); }));
      } else {
        ctx.strokeRect(90, 40, 250, 530); ctx.font = '42px monospace'; ctx.fillText('09:41', 110, 130); ctx.font = '15px monospace'; ctx.fillText('TOKYO / MEXICO', 110, 162);
        ['TODAY', 'WORKOUT', 'NOTES', 'WORLD'].forEach((label, n) => { const y = 200 + n * 80; ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t + n)); ctx.strokeRect(110, y, 210, 60); ctx.fillText(label, 130, y + 36); }); ctx.globalAlpha = 1;
      }
      card.previewRaf = requestAnimationFrame(paint);
    };
    card.previewRaf = requestAnimationFrame(paint);
  }
  function stopPreview(card) {
    cancelAnimationFrame(card.previewRaf); card.previewRaf = 0; card.video.pause();
    if (card.stream) { card.stream.getTracks().forEach(track => track.stop()); card.stream = null; card.video.srcObject = null; }
  }

  // Restore the endless perspective wall; scrolling controls its entrance only.
  const photos = window.WALL_PHOTOS || [];
  const viewer = $('#photo-viewer');
  const wall = window.mountDriftWall($('#photo-wall'), {
    speed: 54,
    items: photos.map((photo, i) => ({ image: `photos/wall/${photo}`, title: `Japan memory ${i + 1} of ${photos.length}` })),
    onOpen(src, title) {
      window.StoryVisuals.openImage(src,title);
    }
  });
  $('button', viewer).addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { document.body.style.overflow = ''; wake(); });

  let lightfall = { wake() {}, set() {} };
  function startBackground() {
  if (window.mountLightfall) {
    try {
      lightfall = window.mountLightfall(refs['lightfall-stage'], {
        colors: ['#ffffff', '#ffffff', '#b86ee0', '#5f9573'],
        backgroundColor: '#2b1640',
        speed: 0.15,
        streakCount: 6,
        streakWidth: 0.5,
        twinkle: 0.15,
        backgroundGlow: 0.28,
        headGlow: 0.15,
        bloom: 0.25,
        mouseInteraction: false,
        holdToWarp: false,
        intro: true,
        zoom: 1.4,
        mouseRadius: 0.1,
        fade: 0.25,
        opacity: 0.68
      });
    } catch (error) { console.warn('Lightfall unavailable.', error); }
  }

  }

  let dither = { wake() {}, set() {} };
  if (!reduced) {
    try { dither = mountDitherVeil(refs['dither-veil-container'], { pattern: 'floyd', pixelSize: 1.5, revealRadius: 130, softness: .38, linger: 1.2, wander: false, inkColor: '#120f17', paperColor: '#f4f1ea' }); }
    catch (error) { console.warn('Samurai effect unavailable; using image fallback.', error); $('canvas', refs['dither-veil-container'])?.remove(); refs['dither-veil-container'].classList.remove('dither-live'); }
  }
  function updateRoomLayout() {
    const imageWidth = roomImage.naturalWidth || 1672, imageHeight = roomImage.naturalHeight || 941;
    const cover = Math.max(width / imageWidth, height / imageHeight);
    const renderedWidth = imageWidth * cover, renderedHeight = imageHeight * cover;
    roomPivotX = (width - renderedWidth) / 2 + renderedWidth * .518;
    roomPivotY = (height - renderedHeight) / 2 + renderedHeight * .495;
    roomWindowZoom = Math.max(width / (renderedWidth * .395), height / (renderedHeight * .436)) * 1.04;
    roomImage.style.transformOrigin = `${roomPivotX}px ${roomPivotY}px`;
    const closest = FUJI_SHOTS[2].size;
    const fujiX = width * .5, fujiY = height * (mobile ? .34 : .3);
    fujiFrames = fujiShots.map((shot, index) => {
      const spec = FUJI_SHOTS[index], shotWidth = shot.naturalWidth || 2000, shotHeight = shot.naturalHeight || 1120;
      const fit = Math.max(width / shotWidth, height / shotHeight), fitWidth = shotWidth * fit, fitHeight = shotHeight * fit;
      const left = (width - fitWidth) / 2, top = (height - fitHeight) / 2;
      const peakX = left + fitWidth * spec.x, peakY = top + fitHeight * spec.y;
      const shotCover = Math.max(fujiX / (peakX - left), (width - fujiX) / (left + fitWidth - peakX), fujiY / (peakY - top), (height - fujiY) / (top + fitHeight - peakY));
      shot.style.transformOrigin = `${peakX}px ${peakY}px`;
      return { dx: fujiX - peakX, dy: fujiY - peakY, mountain: fitWidth * spec.size, floor: shotCover * fitWidth * spec.size / (index === 2 ? closest : 1) };
    });
    fujiFloorMax = Math.max(...fujiFrames.map(frame => frame.floor));
  }
  roomImage.addEventListener('load', () => { updateRoomLayout(); wake(); }, { once: true });
  fujiShots.forEach(shot => shot.addEventListener('load', () => { updateRoomLayout(); wake(); }, { once: true }));

  /* Story photos (up to 2048 px) and videos would otherwise load and decode the
     first time their page is scrolled into view, stalling that frame. Decode
     them one per idle slot right after the start, while the head rises. */
  function warmStoryAssets() {
    const idle = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout: 1500 }) : fn => setTimeout(fn, 60);
    const images = $$('#card-space img');
    const next = () => {
      const img = images.shift();
      if (!img) return;
      img.loading = 'eager';
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => idle(next));
    };
    idle(next);
    idle(() => window.StoryScenes.warm?.());
  }

  /* Background music for the Japan section: it starts as the sliding doors open
     after the last card and stays low so the presenter's voice carries over it.
     Scrolling back behind the doors fades it out and rewinds it, so the song
     starts from the beginning every time the doors open. The click on "start"
     already allows playback. */
  const MUSIC_VOLUME = .18;
  const music = new Audio();
  music.src = 'audio-life-jp/' + encodeURIComponent('Lungs The Instrumentals Dog Days Are Over [OFFICIAL INSTRUMENTAL].wav');
  music.loop = true;
  music.preload = 'none';
  music.volume = 0;
  function setMusic(level) {
    const volume = MUSIC_VOLUME * clamp(level);
    if (Math.abs(music.volume - volume) > .001) music.volume = volume;
    if (volume > .001 && music.paused && !document.hidden) music.play().catch(() => {});
    else if (volume <= .001) {
      if (!music.paused) music.pause();
      if (music.currentTime > 0) music.currentTime = 0;
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) music.pause(); else wake(); });

  function warmJapanAssets() {
    if (japanAssetsWarmed) return;
    japanAssetsWarmed = true;
    music.preload = 'auto'; music.load();
    roomImage.decode?.().catch(() => {});
    fujiShots.forEach(shot => shot.decode?.().catch(() => {}));
    wall.hydrate?.();
  }

  function resize() {
    const previous = unitHeight;
    width = document.documentElement.clientWidth; height = innerHeight;
    mobile = matchMedia('(max-width: 700px)').matches;
    rigSize = refs['samurai-rig'].clientWidth;
    cardW = mobile ? 206 : Math.max(220, Math.min(258, width * .23));
    cardH = cardW * 1440 / 1024;
    fullW = Math.min(1280, width * (mobile ? .92 : .88));
    fullH = Math.min(mobile ? 900 : 820, height * (mobile ? .78 : .84));
    helixRadius = mobile ? width * .32 : Math.min(width * .3, 430);
    helixPitch = height * .3;
    cards.forEach(card => {
      card.el.style.width = `${fullW}px`;
      card.el.style.setProperty('--reading-x',`${fullW*.088}px`);
      card.el.style.setProperty('--reading-y',`${fullH*.095}px`);
      card.el.style.height = `${fullH}px`;
      card.el.style.top = '51%';
      card.front.style.width = `${cardW}px`;
      card.front.style.height = `${cardH}px`;
      card.front.style.transformOrigin = '0 0';
      card.front.style.transform = `scale(${fullW / cardW},${fullH / cardH})`;
    });
    updateRoomLayout();
    // Mobile browser chrome must not remap the whole scroll route while scrolling.
    if (Math.abs(height - previous) > 120 || width > 700 || !route.style.height) unitHeight = height;
    route.style.height = `${(timeline.end + 1) * unitHeight}px`;
    Object.entries(anchors).forEach(([id, value]) => { document.getElementById(id).style.top = `${value * unitHeight}px`; });
    washi?.resize(width, height);
    wall.resize();
    if (previous !== unitHeight) scrollTo(0, position * unitHeight);
    wake();
  }
  function render(now) {
    raf = 0;
    if (bootTime === null) { lastTime = 0; return; }
    if(window.StoryVisuals.isOpen()){lastTime=0;return;}
    const dt = lastTime ? Math.min(50, Math.max(1, now - lastTime)) : 16.67;
    lastTime = now;
    target = scrollY / unitHeight;
    const follow = reduced ? 1 : 1 - Math.exp(-dt / 55);
    position += (target - position) * follow;
    if (Math.abs(target - position) < .00008) position = target;
    const mouseFollow = reduced ? 1 : 1 - Math.exp(-dt / 85);
    mouse.x += (pointer.x - mouse.x) * mouseFollow;
    mouse.y += (pointer.y - mouse.y) * mouseFollow;
    const s = state(timeline, position);
    const intro = smooth(1.55, 1.95, position) * (1 - smooth(2.45, 3.15, position));
    const approach = smooth(2.45, 3.2, position);
    /* At the start, the Lightfall background appears first, and then the samurai
       head rises smoothly into the center. When the user scrolls, "INTERNSHIP" and the
       hero titles emerge in front of the head while the samurai recedes into
       the background; then it grows again as the project helix approaches. */
    const elapsed = (now - bootTime) / 1000;
    const riseRaw = reduced ? 1 : clamp((elapsed - .85) / 1.8);
    const headRise = smooth(0, 1, riseRaw);
    if (entering && headRise >= 1) {
      entering = false;
      document.documentElement.classList.remove('ready-starting');
      document.querySelector('.brand')?.focus({ preventScroll: true });
    }
    const headRiseAlpha = reduced ? 1 : smooth(0, 0.45, riseRaw);
    const heroFadeOut = 1 - smooth(1.25, 1.75, position);
    const learnT = smooth(0.02, 0.62, position);
    const doorCut = 1 - smooth(timeline.doors + .5, timeline.doors + .9, position);
    const samuraiHeroDim = 1 - learnT * heroFadeOut * 0.42;
    const samuraiBaseOpacity = (1 - intro * .76) * doorCut * (1 - s.detail * .78) * samuraiHeroDim;
    const samuraiOpacity = samuraiBaseOpacity * headRiseAlpha;
    let rigX = 0, rigY = 0, glitch = 0;
    if (samuraiOpacity > .001 || doorCut > .001) {
      const heroStartScale = mobile ? 0.72 : 0.70;
      const heroBackScale = mobile ? 0.48 : 0.45;
      const heroScale = lerp(heroStartScale, heroBackScale, learnT);
      const recede = smooth(1.4, 2.0, position) * (1 - approach);
      const grow = clamp((s.index + s.handoff) / (timeline.chapters.length - 1));
      const endZoom = mobile ? 1.65 : 1.6;
      const zoom = lerp(lerp(heroScale * (0.86 + 0.14 * headRise), heroBackScale * 0.9, recede), lerp(.9, endZoom, grow), approach);
      const riseOffsetY = (1 - headRise) * height * .9 * (1 - approach);
      rigY = riseOffsetY + (1 - approach) * height * 0.01 + approach * lerp(height * .02, height * .48 - rigSize * endZoom * .1, Math.pow(grow, 1.2));
      const scrollSpeed = Math.abs(target - position);
      glitch = clamp(scrollSpeed * 2.2 + Math.sin(s.handoff * Math.PI) * .45 * approach);
      dither.set({ fx: reduced ? 0 : lerp(.55, 1, approach), glitch });
      refs['samurai-rig'].style.transform = `translate3d(calc(-50% + ${rigX + (reduced ? 0 : mouse.x * 12)}px),calc(-50% + ${rigY + (reduced ? 0 : mouse.y * 7)}px),0) scale(${zoom})`;
    }
    show(refs['samurai-stage'], samuraiOpacity);
    refs['dither-veil-container'].style.visibility = samuraiOpacity > .005 ? 'visible' : 'hidden';
    if (samuraiOpacity > .005) dither.wake();

    // Subtle Lightfall background: visible at the start and whenever the samurai head is on screen.
    const lightfallOpacity = (reduced ? 1 : smooth(0, .75, elapsed)) * doorCut * lerp(0.66, 0.42 * (1 - intro * .76) * (1 - s.detail * .78), smooth(0.1, 1.8, position));
    show(refs['lightfall-stage'], lightfallOpacity);
    lightfall.set({ opacity: lightfallOpacity, paused: lightfallOpacity <= 0.005 });

    // Scrolling makes "INTERNSHIP" and the titles emerge in front of the receding samurai head.
    show(refs['hero-copy'], smooth(0.01, 0.08, position) * heroFadeOut, true);
    if (heroFadeOut > .001) {
      const learnAlpha = smooth(0.02, 0.36, position) * heroFadeOut;
      const learnScale = lerp(0.28, 1, learnT) * lerp(1, 0.92, 1 - heroFadeOut);
      const learnX = reduced ? 0 : mouse.x * 16;
      const learnY = lerp(height * 0.04, 0, learnT) - (1 - heroFadeOut) * height * 0.04 + (reduced ? 0 : mouse.y * 8);
      const learnBlur = reduced ? 0 : (1 - learnT) * 10 + (1 - heroFadeOut) * 8;
      refs['hero-learn'].style.transform = `translate3d(calc(-50% + ${learnX}px), calc(-50% + ${learnY}px), 0) scale(${learnScale})`;
      refs['hero-learn'].style.filter = learnBlur > 0.1 ? `blur(${learnBlur.toFixed(1)}px)` : 'none';
      show(refs['hero-learn'], learnAlpha);

      const topT = smooth(0.06, 0.68, position);
      const topAlpha = smooth(0.06, 0.38, position) * heroFadeOut;
      const topY = lerp(height * 0.38, 0, topT) - (1 - heroFadeOut) * height * 0.06 + (reduced ? 0 : mouse.y * 4);
      const topX = reduced ? 0 : mouse.x * 6;
      const topScale = lerp(0.32, 1, topT);
      const topBlur = reduced ? 0 : (1 - topT) * 8 + (1 - heroFadeOut) * 6;
      refs['hero-top'].style.transform = `translate3d(calc(-50% + ${topX}px), ${topY}px, 0) scale(${topScale})`;
      refs['hero-top'].style.filter = topBlur > 0.1 ? `blur(${topBlur.toFixed(1)}px)` : 'none';
      show(refs['hero-top'], topAlpha);

      const bottomT = smooth(0.10, 0.72, position);
      const bottomAlpha = smooth(0.10, 0.42, position) * heroFadeOut;
      const bottomY = lerp(-height * 0.38, 0, bottomT) + (1 - heroFadeOut) * height * 0.06 + (reduced ? 0 : mouse.y * 4);
      const bottomX = reduced ? 0 : mouse.x * 6;
      const bottomScale = lerp(0.32, 1, bottomT);
      const bottomBlur = reduced ? 0 : (1 - bottomT) * 8 + (1 - heroFadeOut) * 6;
      refs['hero-bottom'].style.transform = `translate3d(calc(-50% + ${bottomX}px), ${bottomY}px, 0) scale(${bottomScale})`;
      refs['hero-bottom'].style.filter = bottomBlur > 0.1 ? `blur(${bottomBlur.toFixed(1)}px)` : 'none';
      show(refs['hero-bottom'], bottomAlpha);
    } else {
      show(refs['hero-learn'], 0);
      show(refs['hero-top'], 0);
      show(refs['hero-bottom'], 0);
    }

    show(refs['intro-copy'], intro);
    const stageOpacity = smooth(2.8, 3.2, position) * (1 - smooth(timeline.doors, timeline.doors + .65, position));
    show(refs['project-stage'], stageOpacity, true);
    if (stageOpacity > .001) {
      projectHeading.style.opacity = 1 - s.detail;
      setText(refs['chapter-counter'], `${String(s.index + 1).padStart(2, '0')} / 05`);
      setText(refs['story-position'], s.detail > .8 ? `${s.page + 1} / ${s.chapter.pageCount}` : '');

      /* Cards ride a helix around the head's vertical axis. Scrolling turns the
         helix: each card climbs past, alternately in front of and behind the head. */
      const entry = (1 - smooth(2.8, 3.55, position)) * 1.15;
      const baseTopFrac = mobile ? .38 : .39;
      const cardPoses = [];
      cards.forEach((card, i) => {
        const distance = i - s.index - s.handoff + entry;
        const active = i === s.index;
        const detail = active ? s.detail : 0;
        const theta = ((mobile ? 26 : 38) + distance * 104) * Math.PI / 180 + (reduced ? 0 : Math.sin(now * .0004 + i * 1.7) * .05);
        const centered = active ? s.centered : 0;
        const flat = 1 - centered;
        const orbitDepth = Math.cos(theta) * helixRadius;
        const depth = orbitDepth * flat;
        const near = 1 - smooth(1.7, 2.6, Math.abs(distance));
        const opacity = near * stageOpacity * (active ? 1 : 1 - s.detail);
        show(card.el, opacity, true);
        const visible = opacity > .25 && stageOpacity > .25 && depth >= 0;
        card.front.inert = !visible || detail > .2;
        card.back.inert = !visible || detail < .98;
        // Explicit face visibility also protects 3D rendering during opacity fades.
        const frontVis = opacity > .005 && detail < .5 ? 'visible' : 'hidden';
        const backVis = opacity > .005 && detail >= .5 ? 'visible' : 'hidden';
        if (card._fVis !== frontVis) { card._fVis = frontVis; card.front.style.visibility = frontVis; }
        if (card._bVis !== backVis) { card._bVis = backVis; card.back.style.visibility = backVis; }
        const pe = visible ? 'auto' : 'none';
        if (card._pe !== pe) { card._pe = pe; card.el.style.pointerEvents = pe; }
        // Compensate for lost perspective magnification while leaving the helix:
        // the cover grows toward its showcase size instead of receding first.
        const coverH = Math.min(height * .8, width * .82 * 1440 / 1024);
        const coverW = coverH * 1024 / 1440;
        const perspective = (1600 - depth) / 1600;
        const orbitMagnification = 1600 / (1600 - orbitDepth);
        const previewW = lerp(cardW * orbitMagnification, coverW, centered) * perspective;
        const previewH = lerp(cardH * orbitMagnification, coverH, centered) * perspective;
        const w = lerp(previewW, fullW, detail), h = lerp(previewH, fullH, detail);
        const topFrac = lerp(baseTopFrac, .5, active ? s.centered : 0);
        const x = Math.sin(theta) * helixRadius * flat, y = distance * helixPitch * flat;
        const tilt = hovered === i && !reduced ? mouse.x * 5 : 0;
        // Tangent to the helix, but never turned far enough to hide the face.
        const rotY = reduced ? (detail > .5 ? 180 : 0) : detail * 180 + (Math.sin(theta) * 36 + tilt) * flat;
        const rotX = reduced ? 0 : (6 - mouse.y * 3) * flat;
        const rotZ = (-2 - clamp(distance, -2, 2) * 4) * flat;
        const drift = reduced ? 0 : Math.sin(now * .0007 + i) * 4 * flat;
        const scale = 1; // perspective supplies the size change with depth
        const shade = lerp(lerp(.6, 1, smooth(-helixRadius, helixRadius * .35, depth)), 1, centered);
        const yOffset = (topFrac - .51) * height;
        card.el.style.transform = `translate3d(calc(-50% + ${x}px),calc(-50% + ${y + drift + yOffset}px),${depth}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale3d(${w / fullW},${h / fullH},1)`;
        cardPoses.push({ x, y: height * topFrac + y + drift, z: depth,
          width: w, height: h, rx: rotX, ry: rotY, rz: rotZ, scale, opacity, shade, foreground: centered > .001 });
        const zIdx = active ? '5' : '2';
        if (card._zIdx !== zIdx) { card._zIdx = zIdx; card.el.style.zIndex = zIdx; }
        const curStr = String(active);
        if (card._cur !== curStr) { card._cur = curStr; card.nav.setAttribute('aria-current', curStr); }
        if ((!visible || detail > .1) && (card.previewRaf || !card.video.paused)) { stopPreview(card); if (hovered === i) hovered = -1; }
        card.pages.forEach((page, p) => {
          const selected = active && p === s.page && detail > .9;
          // Last page remains inked while the card folds back into the collection.
          const reveal = selected ? (position >= s.chapter.returnAt ? 1 : s.reveal) : 0;
          const dissolve = selected ? (p === card.pages.length - 1 ? 1 : s.dissolve) : 0;
          show(page, reveal * dissolve, true);
          const pageInert = !selected || detail < .98 || reveal * dissolve < .8;
          if (page._inert !== pageInert) { page._inert = pageInert; page.inert = pageInert; }
          if (selected) {
            window.StoryVisuals.progress(page,clamp((s.phase-.25)/.53));
            if (page.classList.contains('scene-page')) {
              // Wire a scene the first time it is shown; later visits only resume its videos.
              if (!page.sceneMounted) { page.sceneMounted = true; window.StoryScenes.mount(page, reduced); }
              else if (!page.wasSelected && !reduced) page.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
            } else if (page.videoEl && !page.wasSelected && !reduced) page.videoEl.play().catch(() => {});
            if (page.classList.contains('scene-page')) window.StoryScenes.progress(page, s.phase, reduced);
            page.wasSelected=true;
            const revQ = Math.round((reduced ? 1 : reveal) * 1000);
            const disQ = Math.round((reduced ? 1 : dissolve) * 1000);
            if (page._revQ !== revQ || page._disQ !== disQ) {
              page._revQ = revQ;
              page._disQ = disQ;
              const rVal = revQ / 1000, dVal = disQ / 1000;
              page.style.setProperty('--reveal', rVal);
              page.classList.toggle('is-revealed', rVal >= 0.995);
              const dispScale = (1 - dVal) * 26 + (1 - rVal) * 9;
              if (reduced || dispScale < 0.15) {
                page.style.filter = 'none';
              } else {
                page.style.filter = 'url(#ink-spread)';
                inkDisplacement.setAttribute('scale', dispScale.toFixed(2));
              }
              const len = page.words.length;
              for (let wIdx = 0; wIdx < len; wIdx++) {
                const word = page.words[wIdx];
                const ink = reduced ? 1 : smooth(wIdx / len * .35, wIdx / len * .35 + .45, rVal);
                const blur = (1 - ink) * 4 + (1 - dVal) * 8;
                word.style.setProperty('--word-opacity', ink.toFixed(3));
                word.style.filter = blur > 0.12 ? `blur(${blur.toFixed(1)}px)` : 'none';
              }
            }
            setText(card.storyCount, `${String(p + 1).padStart(2, '0')} / ${String(card.pages.length).padStart(2, '0')}`);
            setText(card.storyTools, pagesOf(card.project)[p].footer || '');
          } else {
            if (page._revQ !== undefined && page._revQ !== 0) {
              page._revQ = 0; page._disQ = 0;
              page.style.filter = 'none';
            }
            // Pause only when the page has just been left (this runs every frame).
            if (page.wasSelected) page.querySelectorAll('video').forEach(v => { if (!v.paused) v.pause(); });
            if (page.wasSelected && page.classList.contains('scene-page')) window.StoryScenes.progress(page, -1, reduced);
            page.wasSelected=false;
          }
        });
      });
      washi?.render(cardPoses, now, mouse, hovered, {
        opacity: reduced ? 0 : stageOpacity * (1 - s.detail) * (mobile ? .4 : 1),
        spin: position * .5 + now * .00024, rise: position * .11 + now * .000028, glitch,
        x: rigX, y: -rigY * .5, radius: helixRadius
      });
    } else {
      washi?.render(cards.map(() => ({ opacity: 0 })), now, mouse, hovered, { opacity: 0 });
    }

    if (position > timeline.doors - 3.5) warmJapanAssets();

    const doorLocal = position - timeline.doors;
    setMusic(smooth(1.15, 2.15, doorLocal));
    const doorVisible = doorLocal >= -0.05 && doorLocal <= 2.25;
    show(refs['door-stage'], doorLocal >= 0 && doorLocal <= 2.2 ? 1 : 0);
    if (doorVisible) {
      const closed = smooth(0, .85, doorLocal) * (1 - smooth(1.15, 2.15, doorLocal));
      doorLeft.style.transform = `translate3d(${-(1 - closed) * 102}%,0,0)`;
      doorRight.style.transform = `translate3d(${(1 - closed) * 102}%,0,0)`;
      // The beam and floor track settle into place just before the panels meet.
      refs['door-stage'].style.setProperty('--rail', smooth(0, .4, closed).toFixed(4));
      doorLight.style.opacity = closed > .98 ? .45 : 0;
    }

    const galleryEnter = smooth(timeline.photos - .1, timeline.photos + .4, position);
    const farewell = smooth(timeline.closing - .3, timeline.closing + .9, position);
    const roomOpacity = smooth(timeline.doors + .88, timeline.doors + 1.12, position) * (1 - galleryEnter);
    show(refs['room-stage'], roomOpacity);
    if (roomOpacity > .001) {
      const cameraProgress = smooth(timeline.japan + .35, timeline.photos - .5, position);
      const lakeshore = smooth(timeline.photos - .85, timeline.photos - .3, position);
      if (lakeshore < .999) {
        roomImage.style.transform = `translate3d(${(width / 2 - roomPivotX) * cameraProgress}px,${(height / 2 - roomPivotY) * cameraProgress}px,0) scale(${lerp(1, roomWindowZoom, cameraProgress)})`;
      }
      /* Past the window the camera keeps travelling toward Fuji: three photographs
         taken progressively closer. One continuous zoom drives all of them, and each
         is pinned by its summit to the same screen point at a matched mountain size,
         so the cross-fades change the foreground while Fuji itself stays put. */
      show(fujiStage, lakeshore);
      if (lakeshore > .001) {
        const openWater = smooth(timeline.closing - 1.2, timeline.closing - .3, position);
        const summit = smooth(timeline.closing + .35, timeline.closing + 1, position);
        const closest = FUJI_SHOTS[2].size;
        const fujiZoom = position < timeline.closing + .35
          ? lerp(1, closest, clamp((position - (timeline.photos - .85)) / (timeline.closing + 1.2 - timeline.photos)))
          : lerp(closest, closest * 1.1, smooth(timeline.closing + .35, timeline.end, position));
        const fujiSize = fujiFloorMax * fujiZoom;
        fujiShots.forEach((shot, index) => {
          const frame = fujiFrames[index];
          shot.style.transform = `translate3d(${frame.dx}px,${frame.dy}px,0) scale(${fujiSize / frame.mountain})`;
        });
        fujiShots[0].style.visibility = openWater < 1 ? 'inherit' : 'hidden';
        fujiShots[1].style.opacity = openWater;
        fujiShots[1].style.visibility = summit < 1 ? 'inherit' : 'hidden';
        fujiShots[2].style.opacity = summit;
      }
      roomShade.style.opacity = .78 * (1 - galleryEnter);
    }

    show(refs['japan-copy'], smooth(timeline.japan + .7, timeline.japan + 1.4, position) * (1 - smooth(timeline.photos - .65, timeline.photos - .1, position)));
    const photoOpacity = galleryEnter * lerp(1, .23, farewell);
    show(refs['photo-stage'], photoOpacity, farewell < .1);
    refs['photo-stage'].style.transform = `scale(${lerp(1, .94, farewell)})`;
    document.body.classList.toggle('japan-gallery', galleryEnter > .001);
    wall.setVisible(photoOpacity > .01 && !viewer.open);
    wall.step(dt / 1000);
    setText(photoCount, `${photos.length} photographs · Japan, 2026`);
    show(refs.closing, smooth(timeline.closing + .2, timeline.closing + 1, position), true);
    const progress = clamp(position / timeline.end);
    progressBar.style.transform = `scaleX(${progress})`;
    const progPct = Math.round(progress * 100);
    if (refs.progress._val !== progPct) { refs.progress._val = progPct; refs.progress.setAttribute('aria-valuenow', progPct); }
    let hint = 'Scroll to begin';
    if (position > 0.65) hint = 'Keep scrolling';
    if (position > 3.1 && position < timeline.doors) hint = s.detail > .8 ? 'Scroll to turn the page' : (fine ? 'Hover to preview · scroll to explore' : 'Tap a card · scroll to explore');
    if (position >= timeline.photos) hint = fine ? 'Hover to pause · click to view' : 'Tap to view';
    if (position >= timeline.closing) hint = '';
    setText(scrollHintText, hint); show(refs['scroll-hint'], hint ? 1 : 0);
    const helixActive = stageOpacity > .01 && s.detail < .999 && !reduced;
    const wallActive = photoOpacity > .01 && !reduced && !viewer.open;
    if (headRise < 1 || Math.abs(position - target) > .00008 || Math.abs(mouse.x - pointer.x) > .001 || Math.abs(mouse.y - pointer.y) > .001 || helixActive || wallActive) {
      wake();
    } else {
      lastTime = 0;
    }
  }
  function wake() { if (!raf && !document.hidden) raf = requestAnimationFrame(render); }
  document.addEventListener('media-viewer-close',wake);
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', event => {
    pointer = { x: event.clientX / width - .5, y: event.clientY / height - .5 };
    if (fine) cursorEl.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0) translate(-50%,-50%)`;
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; wake(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cards.forEach(stopPreview); else { lightfall.wake(); dither.wake(); wake(); } });
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id in anchors) jump(anchors[id]); });
  resize();
  // Every visit begins behind the black gate, independent of restored scroll/hash.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.getElementById('ready-button').addEventListener('click', () => {
    if (bootTime !== null) return;
    position = target = 0;
    pointer = mouse = { x: 0, y: 0 };
    scrollTo({ top: 0, behavior: 'instant' });
    history.replaceState(null, '', location.pathname + location.search);
    startBackground();
    bootTime = performance.now();
    entering = true;
    document.documentElement.classList.replace('ready-pending', 'ready-starting');
    document.getElementById('ready-gate').hidden = true;
    warmStoryAssets();
    wake();
  });
  document.getElementById('ready-button').focus({ preventScroll: true });
  wake();
})();
