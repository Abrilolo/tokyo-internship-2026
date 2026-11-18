/* DOM adapter of the supplied React Bits DriftWall. Keeps the original motion:
   alternating endless columns, damped pointer perspective, hover lift and pause.
   Virtual rows preserve the existing gallery's bounded image/node count. */
window.mountDriftWall = function mountDriftWall(root, options = {}) {
  const items = [...(options.items || [])];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = options.speed ?? 54;
  const variance = .45, columns = 8;
  const plane = root.querySelector('.drift-wall__plane');
  const state = { columns: [], pointer: { x: 0, y: 0 }, damp: { x: 0, y: 0 }, hovered: -1, active: null, visible: false, hydrated: false, size: '', width: 1, height: 1 };
  // Preserve the previous wall's repeatable shuffled photo order.
  let seed = 7;
  for (let i = items.length - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = Math.floor(seed / 2147483647 * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const release = () => {
    state.active?.classList.remove('is-active'); state.active = null; state.hovered = -1;
  };
  const activate = tile => {
    if (!tile || tile === state.active) return;
    release(); state.active = tile; state.hovered = Number(tile.dataset.col); tile.classList.add('is-active');
  };
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h || !items.length || state.size === `${w}x${h}`) return;
    state.size = `${w}x${h}`; state.width = w; state.height = h; release(); plane.replaceChildren(); state.columns = [];
    const tileWidth = Math.min(270, Math.max(w < 700 ? 128 : 150, w * .15));
    const tileHeight = tileWidth * 1.2, gap = w < 700 ? 12 : 18;
    const unit = tileHeight + gap, rows = Math.ceil(h * 1.7 / unit) + 2;
    root.style.setProperty('--dw-tile-w', `${tileWidth}px`);
    root.style.setProperty('--dw-tile-h', `${tileHeight}px`);
    root.style.setProperty('--dw-gap', `${gap}px`);
    const count = Math.min(columns, items.length);
    const groups = Array.from({ length: count }, () => []);
    items.forEach((item, i) => groups[i % count].push(item));
    groups.forEach((list, c) => {
      const column = document.createElement('div'), track = document.createElement('div');
      column.className = 'drift-wall__col'; track.className = 'drift-wall__track';
      const fill = (tile, index) => {
        const item = list[((index % list.length) + list.length) % list.length];
        if (tile.dataset.src === item.image && (!state.hydrated || tile.imgEl.getAttribute('src'))) return;
        tile.dataset.src = item.image; tile.setAttribute('aria-label', item.title);
        tile.imgEl.alt = item.title;
        if (state.hydrated) tile.imgEl.src = item.image;
      };
      const pseudo = ((c * .6180339887 + .35) % 1) * 2 - 1;
      const col = { track, fill, tiles: [], head: 0, offset: unit * ((c * .37) % 1), velocity: 0,
        base: speed * (1 + variance * pseudo) * (c % 2 === 0 ? 1 : -1), unit, rows };
      for (let r = 0; r < rows; r++) {
        const tile = document.createElement('button');
        tile.className = 'drift-wall__tile'; tile.dataset.col = c;
        tile.innerHTML = '<span class="drift-wall__inner"><img alt="" draggable="false" decoding="async"><span class="drift-wall__overlay" aria-hidden="true"></span></span>';
        tile.imgEl = tile.querySelector('img');
        tile.addEventListener('focus', () => activate(tile)); tile.addEventListener('blur', release);
        tile.addEventListener('click', () => options.onOpen?.(tile.dataset.src, tile.getAttribute('aria-label')));
        fill(tile, r); track.append(tile); col.tiles.push(tile);
      }
      column.append(track); plane.append(column); state.columns.push(col);
    });
  }
  function hydrate() {
    if (state.hydrated) return;
    state.hydrated = true;
    state.columns.forEach(col => col.tiles.forEach(tile => {
      if (tile.dataset.src && !tile.imgEl.getAttribute('src')) tile.imgEl.src = tile.dataset.src;
    }));
  }
  root.addEventListener('pointermove', event => {
    if (!reduced) state.pointer = { x: event.clientX / state.width - .5, y: event.clientY / state.height - .5 };
    const tile = event.target.closest('.drift-wall__tile');
    if (tile) activate(tile);
  }, { passive: true });
  root.addEventListener('pointerleave', () => { state.pointer = { x: 0, y: 0 }; release(); });
  function step(seconds) {
    if (!state.visible) return;
    const dt = Math.min(.05, Math.max(0, seconds));
    const damp = 1 - Math.exp(-dt / .12);
    state.damp.x += (state.pointer.x * 4.8 - state.damp.x) * damp;
    state.damp.y += (-state.pointer.y * 4.8 - state.damp.y) * damp;
    plane.style.transform = `translate(-50%,-50%) scale(1.18) rotateX(${16 + state.damp.y}deg) rotateY(${-14 + state.damp.x}deg) translateZ(-120px)`;
    state.columns.forEach((col, index) => {
      const target = reduced || state.hovered === index ? 0 : col.base;
      col.velocity += (target - col.velocity) * (1 - Math.exp(-dt / (target === 0 ? .16 : .28)));
      col.offset += col.velocity * dt;
      while (col.offset >= col.unit) {
        col.offset -= col.unit; col.head++;
        const tile = col.tiles.shift(); col.tiles.push(tile); col.track.append(tile); col.fill(tile, col.head + col.rows - 1);
      }
      while (col.offset < 0) {
        col.offset += col.unit; col.head--;
        const tile = col.tiles.pop(); col.tiles.unshift(tile); col.track.prepend(tile); col.fill(tile, col.head);
      }
      col.track.style.transform = `translate3d(0,${-col.offset}px,0)`;
    });
  }
  resize();
  return { resize, step, hydrate, setVisible(value) { if (value) hydrate(); state.visible = value; root.inert = !value; if (!value) release(); }, reduced };
};
