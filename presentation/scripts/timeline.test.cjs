const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { create, state, PAGE } = require('./timeline.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'stories.js'), 'utf8'), context);
const projects = context.window.PRESENTATION_PROJECTS;
const route = create(projects);

test('each project returns before the next card, with every story readable', () => {
  route.chapters.forEach((chapter, index) => {
    assert.equal(state(route, chapter.start + .2).index, index);
    assert.equal(state(route, chapter.start + .2).detail, 0);
    for (let page = 0; page < chapter.pageCount; page++) {
      const pose = state(route, chapter.read + (page + .5) * PAGE);
      assert.equal(pose.index, index);
      assert.equal(pose.page, page);
      assert.equal(pose.detail, 1);
      assert.equal(pose.reveal * pose.dissolve, 1);
    }
    assert.equal(state(route, chapter.end - .1).detail, 0);
    if (index < route.chapters.length - 1) assert.equal(state(route, chapter.end + .001).index, index + 1);
  });
  assert.equal(route.chapters.at(-1).end, route.doors);
  assert.ok(route.doors < route.japan && route.japan < route.photos && route.photos < route.closing && route.closing < route.end);
});

test('reverse scroll produces identical poses without invalid values', () => {
  const samples = Array.from({ length: 1001 }, (_, i) => i * route.end / 1000);
  const forward = samples.map(p => state(route, p));
  samples.reverse().forEach((p, i) => {
    const pose = state(route, p);
    assert.deepEqual(pose, forward[1000 - i]);
    for (const key of ['detail', 'reveal', 'dissolve', 'handoff']) assert.ok(pose[key] >= 0 && pose[key] <= 1);
    assert.ok(pose.page >= 0 && pose.page < pose.chapter.pageCount);
  });
});

test('every project image and linked deliverable exists locally', () => {
  projects.forEach(project => project.pages.forEach(page => {
    for (const field of ['image', 'video', 'link']) if (page[field]) assert.ok(fs.existsSync(path.resolve(__dirname, '..', page[field])), `${project.id}: missing ${page[field]}`);
  }));
  const photoContext = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../photos/wall/manifest.js'), 'utf8'), photoContext);
  photoContext.window.WALL_PHOTOS.forEach(photo => assert.ok(fs.existsSync(path.join(__dirname, '../photos/wall', photo)), `Missing wall photo: ${photo}`));
});


test('cards center and hold their cover before opening, then close before leaving center', () => {
  for (const chapter of route.chapters) {
    const cover = state(route, (chapter.centerAt + chapter.flipAt) / 2);
    assert.equal(cover.centered, 1);
    assert.equal(cover.detail, 0);
    const opening = state(route, (chapter.flipAt + chapter.read) / 2);
    assert.equal(opening.centered, 1);
    assert.ok(opening.detail > 0 && opening.detail < 1);
    const closed = state(route, chapter.end - .6);
    assert.equal(closed.detail, 0);
    assert.equal(closed.centered, 1);
  }
});

test('pages with more highlights get more reading distance without skipping pages', () => {
  const timed = create([{ id: 'beats', pages: [{ beatCount: 3 }, { beatCount: 5 }, {}] }]);
  const chapter = timed.chapters[0];
  assert.ok(chapter.pages[1].end - chapter.pages[1].start > chapter.pages[0].end - chapter.pages[0].start);
  for (const [index, range] of chapter.pages.entries()) {
    const position = (range.start + range.end) / 2;
    const pose = state(timed, position);
    assert.equal(pose.page, index);
    assert.equal(pose.reveal * pose.dissolve, 1);
    assert.equal(state(timed, range.start + .001).page, index);
  }
  assert.equal(chapter.pages.at(-1).end, chapter.returnAt);
});

test('scroll emphasis selects one box at a time and reverses or clears on leaving', () => {
  const sceneContext = { window: {}, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'story-scenes.js'), 'utf8'), sceneContext);
  const items = Array.from({ length: 3 }, () => {
    const classes = new Set();
    return { parentElement: { closest: () => null }, classes, classList: {
      toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
    } };
  });
  const root = { querySelectorAll: selector => selector === '.is-zoomed' ? [] : items };
  const { progress } = sceneContext.window.StoryScenes;
  for (const i of [0, 1, 2, 1, 0]) {
    progress(root, .25 + (i + .5) / 3 * .53);
    assert.deepEqual(items.map(el => el.classes.has('is-scroll-highlighted')), items.map((_, j) => i === j));
  }
  progress(root, -1);
  assert.ok(items.every(el => !el.classes.has('is-scroll-highlighted')));
  progress(root, .4, true);
  assert.ok(items.every(el => el.classes.has('scroll-still')));
});
