/* Pure scroll model: every pose is derived from position, so reverse scroll and
   anchor navigation follow exactly the same route as forward scrolling. */
((root) => {
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const PREVIEW = .95, CENTER = .55, HOLD = .25, FLIP = .75, PAGE = 1.15, RETURN = .7, NEXT = .6;
  function create(projects) {
    let position = 3.2;
    const chapters = projects.map(project => {
      const start = position, centerAt = start + PREVIEW + CENTER, flipAt = centerAt + HOLD, read = flipAt + FLIP;
      let cursor = read;
      const pages = project.pages.map(page => {
        const duration = PAGE + Math.max(0, (page.beatCount || 0) - 1) * .65;
        const range = { start: cursor, end: cursor + duration };
        cursor = range.end;
        return range;
      });
      const returnAt = cursor;
      const end = returnAt + RETURN + NEXT;
      position = end;
      return { id: project.id, start, centerAt, flipAt, read, returnAt, end, pages, pageCount: project.pages.length };
    });
    return { chapters, doors: position, japan: position + 2.2, window: position + 3.4, photos: position + 5.8, closing: position + 13.8, end: position + 15.4 };
  }
  function state(timeline, position) {
    const chapters = timeline.chapters;
    const index = Math.max(0, chapters.findIndex((c, i) => position < c.end || i === chapters.length - 1));
    const chapter = chapters[index];
    const local = position - chapter.start;
    const opening = smooth(chapter.flipAt, chapter.read, position);
    const returning = smooth(chapter.returnAt, chapter.returnAt + RETURN, position);
    const detail = opening * (1 - returning);
    const centered = smooth(chapter.start + PREVIEW, chapter.centerAt, position)
      * (1 - smooth(chapter.returnAt + RETURN, chapter.end, position));
    const page = Math.max(0, chapter.pages.findIndex((p, i) => position < p.end || i === chapter.pageCount - 1));
    const range = chapter.pages[page];
    const phase = clamp((position - range.start) / (range.end - range.start), 0, .99999);
    const reveal = smooth(0, .25, phase);
    const dissolve = 1 - smooth(.78, 1, phase);
    return { index, chapter, local, detail, centered, page, phase, reveal, dissolve, handoff: smooth(chapter.end - NEXT, chapter.end, position) };
  }
  const api = { create, state, clamp, smooth, PAGE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PresentationTimeline = api;
})(globalThis);
