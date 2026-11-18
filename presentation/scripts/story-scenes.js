/* Card content based on commit af85a1e ("scroll presentacion"), re-set on Washi
   paper. Every scene must fit the card without scrolling. Paths are relative
   to presentation/ and rewritten by markup(). */
(() => {
'use strict';
const S = (label, html) => ({ label, html });

/* Photo the user still has to drop in: shows a dashed slot until the file exists. */
const slot = (src, hint, ratio) => `<figure class="sc-slot"><div class="sc-frame"${ratio ? ` style="aspect-ratio:${ratio.toFixed(4)}"` : ''}><img src="${src}" alt="${hint}"></div>
  <figcaption class="sc-slot-hint"><b>${hint}</b><span>Add photo · presentation/${src}</span></figcaption></figure>`;

/* Screenshots stacked at their real proportion (see .sc-media in the CSS). */
const media = items => {
  const inv = items.reduce((t, item) => t + 1 / item[2], 0);
  return `<div class="sc-media" style="--n:${items.length};--inv:${inv.toFixed(4)}">${items.map(([src, hint, r]) => slot(src, hint, r)).join('')}</div>`;
};

const ARENA_STEPS = ['Task', 'Setup', 'Team feature', 'Result'];
const stepper = active => `<ol class="sc-stepper">${ARENA_STEPS.map((s, i) =>
  `<li class="${i === active ? 'on' : i < active ? 'done' : ''}"><i>${i + 1}</i>${s}</li>`).join('')}</ol>`;

/* Icon-only controls (no text) for the live previews. */
const ICONS = {
  touch: '<path d="M9 3.5v10.2l2.6-2.4 2.2 4.9 2.1-.9-2.2-4.9h3.6z" fill="currentColor" stroke="none"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6"/>',
  collapse: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* Mini live preview of an HTML page. With a screenshot it starts as the picture;
   without one it shows the page itself as a still thumbnail. Click to use it
   in place, or expand it a little larger than the card.
   ratio: the page's own proportion; vw: the width the page is laid out at. */
const ratioOf = r => { const [a, b = 1] = String(r).split('/').map(Number); return a / b; };
const live = (url, title, ratio, shot, vw = 1280) => `<figure class="sc-shot sc-live${shot ? '' : ' thumb'}${ratioOf(ratio) < 1 ? ' portrait' : ''}" data-live="${url}" data-title="${title}" data-ratio="${ratio}" data-vw="${vw}">
  <div class="sc-frame" style="aspect-ratio:${ratio}">${shot ? `<img src="${shot}" alt="${title}">` : ''}</div>
  <figcaption class="sc-live-hint">${icon('touch')}</figcaption></figure>`;

const phone = (file, label) => `<div class="sc-phone"><img src="external/android-launcher/docs/design/app/${file}" alt="${label}"><span>${label}</span></div>`;

window.STORY_SCENES = {
  foundations: [
    S('Overview', `
      <h2 class="sc-title"><em>Introductory Quest</em></h2>
      <p class="sc-lede">I worked through <b>11 engineering tasks</b> and <b>9 data structure problems</b> to practice algorithms, memory management, and reading existing code.</p>
      <div class="sc-beats">
        <article class="sc-beat"><h4>01 · Data Structures</h4><h3>Lists, trees & <b>hash tables</b></h3><p>Implemented <b>linked lists</b>, <b>stacks</b>, <b>queues</b>, <b>self-balancing trees</b>, and a <b>hash table with collision avoidance</b>. I also tested <b>8 optimization steps</b> on a slow C program and built a <b>Linux service watchdog</b>.</p></article>
        <article class="sc-beat"><h4>02 · Logic & Cipher</h4><h3><b>IrvineLang</b> & Cryptanalysis</h3><p>Built the interpreter for <b>IrvineLang</b> (a bit-tape virtual machine controlled by the letters <b>I‑r‑v‑i‑n‑e</b>) and broke a <b>substitution cipher</b> using <b>letter frequencies</b> and word patterns.</p>
          <div class="sc-cipher" tabindex="0"><small>hover to decrypt</small><span>Ig. Sqlod, qz fro Iulqg Zugi, ruc aqmeoc fro rol-rqhdod</span></div></article>
        <article class="sc-beat"><h4>03 · New Tools for Me</h4><h3>What I learned & used here</h3><div class="sc-chips"><span>C++</span><span>Ruby</span><span>pytest</span></div>
          <p class="sc-gap">These were the tools <b>I didn't know before</b> and got to use in these assignments: working with pointers and memory in <b>C / C++</b>, writing recursion and structs in <b>Ruby</b>, and running <b>automated tests with pytest</b>.</p></article>
      </div>`),
    S('Repository map', `
      <div class="sc-map-center">
        <p class="sc-map-caption"><b>Repository map</b> Made with <em>Archify</em></p>
        ${live('external/archify/repo-structure.html', 'Interactive repository map', '2048/1320', 'external/archify/repo-structure.visual-check.2048x1320.dark.png')}
      </div>`)
  ],

  arena: [
    S('Overview', `
      <div class="sc-arena">
        <div class="sc-arena-head">
          <div>
            <h2 class="sc-title">Frontend features for <em>Game Arena</em></h2>
          </div>
          <p class="sc-lede"><b>Game Arena</b> is the platform where bots play matches against each other. I worked on the <b>admin panel frontend</b>. It was my first time contributing code to a <b>shared team project</b>.</p>
          <ol class="sc-stepper">${ARENA_STEPS.map((s, i) => `<li><i>${i + 1}</i>${s}</li>`).join('')}</ol>
        </div>
        ${media([['photos/game-arena/slide-01.png', 'Game Arena platform', 2786 / 1474], ['photos/game-arena/slide-01-2.png', 'Match actions side panel', 2824 / 1484]])}
      </div>`),
    S('Step 1 · Task', `
      <div class="sc-arena">
        <div class="sc-arena-head">
          <div>
            ${stepper(0)}
            <h3 class="sc-big">From two loose buttons to <em>one side panel</em></h3>
          </div>
          <p class="sc-lede">In the admin <b>Matches</b> table, every row had <b>two separate buttons</b> while other tables used a menu. I replaced them with a <b>three-dot menu (⋯)</b> that opens a <b>side panel</b> with the match details, player links, and the same <b>Replay & Stats</b> actions.</p>
        </div>
        ${media([['photos/game-arena/slide-02.png', 'Replacing two row buttons with one three-dot menu', 2054 / 1014]])}
      </div>`),
    S('Step 2 · Setup', `
      <div class="sc-arena">
        <div class="sc-arena-head">
          <div>
            ${stepper(1)}
            <h3 class="sc-big">Reading <em>Nour's documentation</em> on Redmine</h3>
          </div>
          <div>
            <p class="sc-lede">Before writing any code, I had to read and follow the <b>setup documentation that Nour left in the Redmine ticket</b>. Getting the whole local environment up and running <b>took me time</b>.</p>
            <div class="sc-chips sc-gap"><span>Redmine</span><span>Docker</span><span>Angular</span><span>GitLab</span></div>
          </div>
        </div>
        ${media([['photos/game-arena/slide-03.png', 'Nour’s developer documentation on Redmine', 2864 / 1418]])}
      </div>`),
    S('Step 3 · Team feature', `
      <div class="sc-arena">
        <div class="sc-arena-head">
          <div>
            ${stepper(2)}
            <h3 class="sc-big">Temporary <em>bot-vs-bot rooms</em></h3>
          </div>
          <p class="sc-lede">To create temporary practice rooms, a teammate built the <b>backend</b> and I built the <b>frontend</b>. Users select <b>Bot vs Bot</b>, pick a game, and get a <b>shareable room ID</b> with terminal commands. Afterward, we merged our branches and fixed <b>Git conflicts together</b>.</p>
        </div>
        ${media([['photos/game-arena/slide-04.png', 'Bot vs Bot practice setup', 2676 / 1036], ['photos/game-arena/slide-04-2.png', 'Room ready to share', 2786 / 1234]])}
      </div>`),
    S('Step 4 · Result', `
      <div class="sc-arena">
        <div class="sc-arena-head">
          <div>
            ${stepper(3)}
            <h3 class="sc-big">Reviewed, tested and <em>merged</em></h3>
          </div>
          <div>
            <p class="sc-lede">Both features passed <b>code review</b> and all <b>40 automated tests</b> in the GitLab pipeline, and were <b>merged into main</b>.</p>
            <div class="sc-checks sc-checks-row sc-gap"><span>✓ Code review approved</span><span>✓ All 40 tests passed</span><span>✓ Merged into main</span></div>
          </div>
        </div>
        ${media([['photos/game-arena/slide-05.png', 'GitLab merge request & passing pipeline', 1440 / 946]])}
      </div>`),
    S('42 Tokyo', `
      <div class="sc-grid2 sc-grid2-featured">
        <figure class="sc-shot"><div class="sc-frame"><img src="photos/42-tokyo/1788579266646.jpg" alt="Game Arena at 42 Tokyo"></div>
          <figcaption class="sc-cap"><div><b>Game Arena at 42 Tokyo</b><span>Students and developers testing their bots</span></div><i>↘</i></figcaption></figure>
        <figure class="sc-shot"><div class="sc-frame"><img src="photos/42-tokyo/1788579267705.jpg" alt="Bots playing live matches at 42 Tokyo"></div>
          <figcaption class="sc-cap"><div><b>Live matches in action</b><span>Watching our frontend changes used live</span></div><i>↘</i></figcaption></figure>
      </div>`)
  ],

  suica: [
    S('Overview', `
      <div class="sc-split">
        <div>
          <h2 class="sc-title">Reading my <em>Suica card</em> with Python</h2>
          <p class="sc-lede">A physical <b>Suica card</b> only keeps your <b>last 20 trips</b>. With a <b>Sony USB NFC reader</b>, my Python script reads the <b>raw bytes</b> from the card, translates each station from <b>hex to Japanese and English</b>, and exports everything to <b>Excel and a web dashboard</b>.</p>
        </div>
        <div>
          <div class="sc-card3d">
            <div class="waves">)))</div>
            <small>Suica · FeliCa · latest balance</small>
            <div class="bal">¥<span data-count="2215">2,215</span></div>
            <small>Read from my own card</small>
          </div>
          <div class="sc-flow"><div><b>nfcpy</b>16-byte raw blocks</div><div><b>ekicode.csv</b>Hex → 日本語 (大宮)</div><div><b>pykakasi</b>Kanji → Omiya</div><div><b>openpyxl</b>Excel + Web</div></div>
        </div>
      </div>`),
    S('Dashboard', `
      <div class="sc-split" style="grid-template-columns:1.25fr .75fr;align-items:stretch">
        ${live('external/transportation/dashboard/index.html', 'Live Suica dashboard', '1200/958', 'video-card/suica.png')}
        <div class="sc-stack">
          <article class="sc-beat"><h4>01 · Raw Bytes</h4><h3>Reading with <b>nfcpy</b></h3><p>Using <b>nfcpy</b>, the script reads service <b>0x090F</b> and unpacks each <b>16-byte block</b> bit by bit: date, balance, and <b>hex station codes</b>.</p></article>
          <article class="sc-beat"><h4>02 · Libraries Pipeline</h4><h3><b>Bytes</b> → <b>Japanese</b> → <b>English</b></h3><p>We map the hex codes with <b>ekicode.csv</b> to get the station in <b>Japanese (kanji/kana)</b>, convert it to <b>romaji / English</b> with <b>pykakasi</b>, and build the spreadsheet with <b>openpyxl</b>.</p></article>
          <article class="sc-beat"><h4>03 · History</h4><h3>Keeping <b>more than 20 trips</b></h3><p>Every scan merges into <b>transactions.json</b> by sequence number, keeping a <b>complete travel history</b> without duplicates even after the card overwrites old trips.</p></article>
        </div>
      </div>`)
  ],

  ai: [
    S('Overview', `
      <h2 class="sc-title">AI Quest: <em>learning AI</em> through neural networks</h2>
      <p class="sc-lede">Each part builds on the last: starting from <b>a single neuron in Python</b>, moving to <b>genetic algorithms</b> in games, and finishing with a <b>Transformer</b> and a <b>local agent with tools</b>.</p>
      <div class="sc-acts">
        <article class="sc-actcard"><b>01</b><h3><b>Neural networks</b></h3><p>Forward pass and <b>backpropagation</b> in Python. One neuron learned <b>AND</b>; adding a <b>hidden layer</b> solved <b>XOR</b> and classified <b>Iris</b> (plus speed benchmarks against <b>PyTorch tensors</b>).</p><strong><span data-count="96.67" data-dec="2">96.67</span>% accuracy on Iris</strong></article>
        <article class="sc-actcard"><b>02</b><h3><b>Genetic algorithms</b></h3><p>Agents in <b>Flappy Bird</b> and <b>autonomous racing (NEAT)</b> that improve across generations through <b>selection, crossover, and mutation</b> without labelled data.</p><strong><span data-count="150">150</span> birds per generation</strong></article>
        <article class="sc-actcard"><b>03</b><h3><b>Language models (LLMs)</b></h3><p>Built the core pieces of an LLM: a <b>BPE tokenizer</b>, a <b>next-character predictor</b>, a <b>causal self-attention Transformer</b>, and a <b>tool-using agent</b>.</p><strong><span data-count="15742">15,742</span> parameters</strong></article>
      </div>`),
    S('Flappy Bird', `
      <div class="sc-split" style="grid-template-columns:.64fr 1.36fr">
        <div>
          <h3 class="sc-big">Flappy Bird with <em>genetic algorithms</em></h3>
          <p class="sc-lede">Each generation runs <b>150 birds</b>. The ones that fly farthest are selected, and their neural networks are <b>combined and mutated</b> for the next generation. I ran controlled experiments comparing <b>1, 2, and 4 inputs</b> across <b>Easy, Medium, and Hard</b> levels.</p>
          ${live('external/ai_quest/part_2_flappy/presentation.html', 'Flappy results deck', '16/9')}
        </div>
        <figure class="sc-video" style="--ar:1674/1510"><video src="video-card/flappy-ai.mp4" muted loop playsinline preload="metadata" aria-label="Flappy Bird agents with a live view of the active neural network"></video></figure>
      </div>`),
    S('Autonomous racing', `
      <div class="sc-split" style="grid-template-columns:.52fr 1.48fr">
        <div>
          <h3 class="sc-big">Autonomous racing <em>with NEAT</em></h3>
          <p class="sc-lede">Cars read the road with <b>raycast sensors</b> while <b>NEAT</b> evolves both their weights and network connections. I tested <b>5 tracks</b> up to the <b><span data-count="3337">3,337</span> m Monaco circuit</b>, rewarding <b>speed along the racing line</b> so cars cannot score by sliding sideways.</p>
        </div>
        <figure class="sc-video" style="--ar:16/9"><video src="video-card/racing-ia.mp4" muted loop playsinline preload="metadata" aria-label="NEAT cars driving with raycast sensors and a live network panel"></video></figure>
      </div>`),
    S('Language models', `
      <div class="sc-split sc-llm-split" style="grid-template-columns:1.08fr .92fr">
        <div>
          <h3 class="sc-big">What is an <em>LLM</em>? · Are they <em>just autocomplete?</em></h3>
          <div class="sc-stack sc-llm-steps">
            <article class="sc-beat"><h4>01 · How an LLM Works</h4><h3><b>Tokens</b> & next-token prediction</h3><p>An LLM turns text into IDs with a <b>tokenizer (BPE / characters)</b> and predicts the <b>next token</b> one by one. At the training objective level, <b>it is autocomplete</b>.</p></article>
            <article class="sc-beat"><h4>02 · Internal Computation</h4><h3><b>Bigram (2.484)</b> vs. <b>Transformer (2.476)</b></h3><p>How it computes that prediction matters: a <b>bigram</b> only counts pairs, my first neural net scored <b>2.733 NLL</b>, and my <b>15,742-parameter Transformer (4 heads, causal self-attention)</b> mixes context across <b>32 positions</b>. On a tiny 1.8 KB corpus, <b>more complexity barely beat counting</b>.</p></article>
            <article class="sc-beat"><h4>03 · Local Agent with Tools</h4><h3><b>Ollama</b> + file reader + calculator</h3><p>Connected <b>qwen2.5-coder:3b</b> via a <b>JSON action protocol</b> to read <b>order.txt</b> and run an <b>AST calculator</b> (<b>17 × $23.75 − 12% = $355.30</b>).</p></article>
          </div>
        </div>
        <blockquote class="sc-answer">
          <small>Why this leads to my conclusion</small>
          <p><b>1. More than "just" autocomplete:</b> Calling an LLM "just autocomplete" describes its training objective, but ignores the <b>internal representations (self-attention)</b> it learns and what it can do when paired with <b>external tools</b>.</p>
          <p class="sc-gap"><b>2. Fluent output ≠ truth:</b> At first, our local model printed <b>fake JSON text</b> without actually running any tool. A confident answer is never proof that it is right, so <em>you have to separate the model from the system and test every part.</em></p>
          <div class="sc-chips sc-gap"><span>Python</span><span>PyTorch</span><span>BPE</span><span>Self-attention</span><span>Ollama</span></div>
        </blockquote>
      </div>`)
  ],

  launcher: [
    S('Overview', `
      <div class="sc-split" style="grid-template-columns:.64fr 1.36fr">
        <div>
          <h2 class="sc-title">A custom Android <em>home screen</em></h2>
          <p class="sc-lede">A minimalist launcher I built for my <b>Galaxy S24+</b> with <b>Kotlin</b> and <b>Jetpack Compose</b>. Designed in <b>black & white text only</b> so each widget shows what I need <b>without opening distracting apps</b>.</p>
          ${live('external/android-launcher/docs/design/concept/Main.dc.html', 'Design prototype', '390/844', null, 390)}
        </div>
        <div class="sc-phones">${phone('inicio.png', 'Home')}${phone('cajon-apps.png', 'Drawer')}${phone('modulos.png', 'Modules')}${phone('mundo.png', 'MX ↔ Tokyo')}</div>
      </div>`),
    S('Modules', `
      <div class="sc-phones sc-phones-row">${phone('ejercicio-hoy.png', 'Workout')}${phone('ejercicio-semana.png', 'Week plan')}${phone('dieta.png', 'Diet')}${phone('semana.png', 'Week')}${phone('respaldo.png', 'Backup')}</div>
      <p class="sc-caption">Built-in modules for <b>workouts</b>, <b>diet</b>, <b>notes</b>, and <b>backup</b> · Visible apps change by time of day: <b>Morning · Work · Night</b></p>`)
  ]
};

/* Rewrites relative src/href/data-live so the same scenes work from any folder. */
let assetFn = x => x;
function markup(scene, asset = x => x) {
  assetFn = asset;
  return scene.html.replace(/(src|href|data-live)="(?!https?:|#|data:)([^"]+)"/g, (_, attr, path) => `${attr}="${asset(path)}"`);
}

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz';
const PLAIN = 'Mr. Jones, of the Manor Farm, had locked the hen-houses';

function countUp(el, reduced) {
  const to = +el.dataset.count, dec = +(el.dataset.dec || 0);
  const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  if (reduced) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const tick = t => { const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1 && el.isConnected) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

function wireCipher(box, reduced) {
  const sp = box.querySelector('span'), label = box.querySelector('small'), scrambled = sp.textContent;
  let raf = 0, cur = scrambled;
  const go = to => {
    cancelAnimationFrame(raf);
    if (reduced) { sp.textContent = cur = to; return; }
    const t0 = performance.now(), n = Math.max(cur.length, to.length);
    const f = t => {
      const k = Math.min(1, (t - t0) / 900); let s = '';
      for (let i = 0; i < n; i++) { const c = to[i] || ''; s += i < k * n ? c : (/[a-z]/i.test(c) ? GLYPHS[(Math.random() * 26) | 0] : c); }
      sp.textContent = cur = s; if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
  };
  const open = () => { go(PLAIN); label.textContent = 'Animal Farm — George Orwell'; };
  const close = () => { go(scrambled); label.textContent = 'hover to decrypt'; };
  box.addEventListener('pointerenter', open); box.addEventListener('focus', open);
  box.addEventListener('pointerleave', close); box.addEventListener('blur', close);
}

function wireBoard(board) {
  const tip = board.querySelector('.sc-board-tip');
  board.addEventListener('click', e => {
    const m = e.target.closest('[data-m]');
    if (m) {
      board.dataset.mode = m.dataset.m; board.classList.remove('open');
      board.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === m));
      const before = m.dataset.m === 'before';
      tip.textContent = before ? '← two loose buttons on every row' : '← one menu. click the three dots!';
      tip.classList.toggle('good', !before);
    } else if (e.target.closest('.dots3')) board.classList.add('open');
    else if (e.target.closest('.x')) board.classList.remove('open');
  });
}

/* Live dashboard: the screenshot turns into a scaled, fully usable iframe. */
const LIVE_W = 1280;
/* Runs heavy work once the scene has settled (and only if it is still shown). */
const SETTLE_MS = 450;
const videoCache = new Map();
function keepVideo(fresh) {
  const key = fresh.getAttribute('src');
  if (!videoCache.has(key)) { fresh.muted = true; fresh.preload = 'auto'; videoCache.set(key, fresh); }
  const v = videoCache.get(key);
  v.setAttribute('aria-label', fresh.getAttribute('aria-label') || '');
  return v;
}
let lastScroll = 0;
addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
// Waits until the page has stopped scrolling for SETTLE_MS, then runs fn if el is still shown.
const afterSettle = (el, fn) => {
  const check = () => {
    if (!el.isConnected) return;
    const quiet = performance.now() - lastScroll;
    if (quiet >= SETTLE_MS) fn(); else setTimeout(check, SETTLE_MS - quiet + 16);
  };
  setTimeout(check, SETTLE_MS);
};
const iconButton = (name, label, cls) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = `sc-icon-btn ${cls}`; b.setAttribute('aria-label', label); b.innerHTML = icon(name);
  return b;
};
const makeFrame = (url, title, vw, ratio) => {
  const f = document.createElement('iframe');
  f.src = url; f.title = title; f.width = vw; f.height = Math.round(vw / ratio);
  return f;
};

/* Expanded view: a fixed layer a little larger than the card, shaped like the page. */
/* Expanded view: a fixed layer a little larger than the card, shaped like its
   content. makeContent() returns the element to show and an optional fit(w, h). */
function openExpanded(source, title, ratio, makeContent) {
  const card = source.closest('.card-content, .project-card')?.getBoundingClientRect() || { width: innerWidth * .8, height: innerHeight * .8 };
  const size = () => {
    const maxW = Math.min(card.width * 1.12, innerWidth * .96), maxH = Math.min(card.height * 1.12, innerHeight * .92);
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    return { w, h };
  };
  const layer = document.createElement('div');
  layer.className = 'sc-expand-layer'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', title);
  const box = document.createElement('div'); box.className = 'sc-expand-box';
  const content = makeContent();
  const collapse = iconButton('collapse', 'Close expanded view', 'sc-expand-close');
  box.append(content.el, collapse); layer.append(box);
  const fit = () => {
    const { w, h } = size();
    box.style.width = w + 'px'; box.style.height = h + 'px';
    content.fit?.(w, h);
  };
  const html = document.documentElement, prevOverflow = html.style.overflow, back = document.activeElement;
  const close = () => {
    layer.classList.remove('in'); removeEventListener('resize', fit); removeEventListener('keydown', onKey, true);
    html.style.overflow = prevOverflow;
    setTimeout(() => layer.remove(), 260); back?.focus?.();
  };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  collapse.addEventListener('click', close);
  layer.addEventListener('click', e => { if (e.target === layer) close(); });
  html.style.overflow = 'hidden';               // keep the scroll route from moving underneath
  addEventListener('resize', fit); addEventListener('keydown', onKey, true);
  fit(); document.body.append(layer);
  void layer.offsetWidth;                       // commit the start state, then fade in
  layer.classList.add('in'); collapse.focus();
}

function expandLive(fig) {
  const title = fig.dataset.title || 'Live page';
  const ratio = ratioOf(fig.dataset.ratio), vw = +fig.dataset.vw || LIVE_W;
  openExpanded(fig, title, ratio, () => {
    const iframe = makeFrame(fig.dataset.live, title, vw, ratio);
    return { el: iframe, fit: w => { iframe.style.transform = `scale(${w / vw})`; } };
  });
}

/* Photos and videos: the same expanded view, at the media's own proportion. */
function expandMedia(host) {
  const media = host.querySelector('img, video');
  if (!media) return;
  const isVideo = media.tagName === 'VIDEO';
  const w = isVideo ? media.videoWidth : media.naturalWidth, h = isVideo ? media.videoHeight : media.naturalHeight;
  if (!w || !h) return;
  const title = media.getAttribute('alt') || media.getAttribute('aria-label') || 'Photo';
  openExpanded(host, title, w / h, () => {
    let el;
    if (isVideo) {
      el = document.createElement('video');
      el.src = media.currentSrc || media.src; el.muted = true; el.loop = true; el.playsInline = true; el.autoplay = true;
      el.currentTime = media.currentTime || 0;
    } else {
      el = document.createElement('img'); el.src = media.currentSrc || media.src; el.alt = title;
    }
    el.className = 'sc-expand-media';
    return { el };
  });
}

function wireLive(fig) {
  const frame = fig.querySelector('.sc-frame'), img = frame.querySelector('img');
  const title = fig.dataset.title || 'Live page';
  const ratio = ratioOf(fig.dataset.ratio), vw = +fig.dataset.vw || LIVE_W;
  let iframe = null, ro = null;
  // The page is laid out at its own width (vw) and scaled down to the frame.
  const fit = () => { if (iframe) iframe.style.transform = `scale(${frame.clientWidth / vw})`; };
  const load = () => {
    if (iframe) return;
    iframe = makeFrame(fig.dataset.live, title, vw, ratio); iframe.loading = 'lazy';
    frame.append(iframe); fit();
    ro = new ResizeObserver(fit); ro.observe(frame);
  };
  const tools = document.createElement('div'); tools.className = 'sc-live-tools';
  const expandBtn = iconButton('expand', `Expand ${title}`, 'sc-live-expand');
  const closeBtn = iconButton('close', `Stop using ${title}`, 'sc-live-close');
  tools.append(closeBtn, expandBtn); frame.append(tools);   // inside the frame, so it hugs the page corner
  const close = () => {
    if (!fig.classList.contains('live')) return;
    fig.classList.remove('live');
    if (img) { ro?.disconnect(); ro = null; iframe?.remove(); iframe = null; img.hidden = false; }
    fig.focus();
  };
  const open = () => {
    if (fig.classList.contains('live')) return;
    load(); if (img) img.hidden = true;
    fig.classList.add('live');
  };
  // Thumbnail: the page itself, inert until clicked. Loaded after the scene
  // transition so parsing the page never lands in the middle of a scroll.
  if (!img) afterSettle(fig, load);
  expandBtn.addEventListener('click', e => { e.stopPropagation(); expandLive(fig); });
  closeBtn.addEventListener('click', e => { e.stopPropagation(); close(); });
  fig.addEventListener('click', e => { if (!e.target.closest('.sc-live-tools')) open(); });
  fig.addEventListener('keydown', e => {
    if (e.target !== fig) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });
  fig.tabIndex = 0; fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', `Use ${title} here`);
}

/* Missing photos become labelled slots. */
function wireSlot(fig) {
  const img = fig.querySelector('img');
  const empty = () => fig.classList.add('empty');
  if (img.complete && !img.naturalWidth) empty();
  img.addEventListener('error', empty);
}

/* Click a box or picture to lift it a little; click again or elsewhere to drop it. */
const ZOOMABLE = '.sc-beat,.sc-shot:not(.sc-live),.sc-stat,.sc-phone,.sc-card3d,.sc-slot:not(.empty),.sc-video,.sc-actcard,.sc-flow>div,.sc-answer';
function wireZoom(root) {
  root.querySelectorAll(ZOOMABLE).forEach(el => el.classList.add('sc-zoomable'));
  if (root.dataset.zoomWired) return;   // the sheet is reused for every scene
  root.dataset.zoomWired = '1';
  root.addEventListener('click', e => {
    if (e.target.closest('a,button,.sc-cipher,.sc-board,.sc-live')) return;
    const el = e.target.closest('.sc-zoomable');
    root.querySelectorAll('.is-zoomed').forEach(z => { if (z !== el) z.classList.remove('is-zoomed'); });
    if (el && !el.classList.contains('empty')) el.classList.toggle('is-zoomed');
  });
}

/* Builds every scene video once, off screen, while the page is idle, so the
   first visit to a video scene does not start a decoder mid-scroll. */
let warmed = false;
function warmVideos() {
  if (warmed) return; warmed = true;
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none';
  document.body.append(holder);
  const srcs = new Set();
  Object.values(window.STORY_SCENES).flat().forEach(s => s.html.replace(/<video[^>]*\ssrc="([^"]+)"/g, (_, src) => srcs.add(assetFn(src))));
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 300));
  srcs.forEach(src => idle(() => {
    if (videoCache.has(src)) return;
    const v = document.createElement('video');
    v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    holder.append(v); v.load();
    videoCache.set(src, v);
  }));
}

/* Every photo, phone screenshot and video gets an expand button (icon only). */
const MEDIA_HOSTS = '.sc-shot:not(.sc-live) .sc-frame,.sc-slot .sc-frame,.sc-phone,.sc-video';
function wireExpand(root) {
  root.querySelectorAll(MEDIA_HOSTS).forEach(host => {
    if (host.querySelector(':scope > .sc-photo-expand')) return;
    const media = host.querySelector('img, video');
    const btn = iconButton('expand', `Expand ${media?.getAttribute('alt') || media?.getAttribute('aria-label') || 'photo'}`, 'sc-photo-expand');
    btn.addEventListener('click', e => { e.stopPropagation(); expandMedia(host); });
    host.append(btn);
  });
}

function mount(root, reduced = false) {
  root.scrollBeats = null;
  root.scrollBeat = undefined;
  warmVideos();
  root.querySelectorAll('[data-count]').forEach(el => countUp(el, reduced));
  root.querySelectorAll('.sc-cipher').forEach(el => wireCipher(el, reduced));
  root.querySelectorAll('.sc-board').forEach(wireBoard);
  root.querySelectorAll('.sc-live').forEach(wireLive);
  root.querySelectorAll('.sc-slot').forEach(wireSlot);
  // Each video element is created once and reused, so revisiting a scene does
  // not spin up a new decoder in the middle of a scroll. Playback starts after
  // the scene settles.
  root.querySelectorAll('.sc-video video').forEach(fresh => {
    const v = keepVideo(fresh);
    if (v !== fresh) fresh.replaceWith(v);
    if (!reduced) afterSettle(v, () => v.play().catch(() => {}));
  });
  wireZoom(root);
  wireExpand(root);
}

// Share the exact same targets between timeline sizing and scroll highlighting.
function targets(root) {
  return [...root.querySelectorAll(ZOOMABLE)].filter(el => !el.parentElement?.closest(ZOOMABLE));
}
function beatCount(scene) {
  const template = document.createElement('template');
  template.innerHTML = scene.html;
  return targets(template.content).length;
}
function progress(root, phase, reduced = false) {
  const items = root.scrollBeats || (root.scrollBeats = targets(root));
  const index = phase >= .25 && phase < .78
    ? Math.min(items.length - 1, Math.floor((phase - .25) / .53 * items.length)) : -1;
  if (root.scrollBeat === index) return;
  root.scrollBeat = index;
  root.querySelectorAll('.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  items.forEach((el, i) => {
    el.classList.toggle('is-scroll-highlighted', i === index);
    el.classList.toggle('scroll-still', reduced);
  });
}
window.StoryScenes = { markup, mount, beatCount, progress, warm: warmVideos };
})();
