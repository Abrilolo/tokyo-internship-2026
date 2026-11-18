# Create & Learn

Local, buildless internship presentation. Open `index.html` or use the existing `Abrir presentacion.bat` launcher, which also refreshes the photo manifest.

## Flow

Samurai → introduction → five project cards → photographic sliding doors → room overlooking Fuji → scroll through the window → Drift Wall over Fuji → thank-you message.

Each project follows preview → center → hold cover → flip/expand → one story fragment at a time → fold back → next card. Native scrolling remains available for wheel, touch, keyboard and reverse navigation. The samurai head stays centred and facing forward: full size for the title, smaller behind the introduction, then one step larger per chapter until its eyes rest on the lower viewport edge at the last card. The cards ride a helix around the head; scrolling turns it so cards pass alternately in front of and behind the head.

- `scripts/samurai.js`: original WebGL dither effect, now a cut-out (flood-filled silhouette alpha) with iridescent dots, RGB split and scroll-driven glitch slices (`set({ fx, glitch })`), with explicit attribute locations and pointer coordinates mapped through the scaled element. A still-image fallback remains available without WebGL.
- `scripts/stories.js`: titles, Japanese concepts, short story pages, local images and links.
- `scripts/timeline.js`: deterministic scroll ranges shared by the controller and focused tests.
- `scripts/presentation.js`: native-scroll choreography, accessible face/page visibility, hover previews and the photo viewer.
- `scripts/washi-cards.js`: Three.js card renderer adapted from the supplied washi showcase. Uses its ornamental frames, paper fibers, layered edge texture and wet-ink shader, with this presentation's own titles and symbols. Each card is a box with four physical sides, a 9-pixel thickness and separate front/back materials. The far half of the helix (cards and orbiting motes with z < 0) is rendered first and copied to `#card-back-layer` beneath the head; the near half stays on the WebGL canvas above it. DOM controls and story text stay accessible above the canvas; CSS provides a fallback without WebGL.
  The orbiting motes drift and climb on their own clock (scroll only adds to it) and share the head's glitch: coarse 5x5 sprites with missing pixels, an RGB split, dropped frames, sideways band slips and occasional streaks.
- `scripts/vendor/three-r128.min.js`: locally bundled Three.js version used by the reference, with its license header retained. No runtime CDN request is needed.
- `scripts/drift-wall.js`: buildless adapter of the supplied React Bits DriftWall behavior: eight endless alternating columns, pointer perspective, hover lift and eased pause of the hovered column. Virtual rows bound the DOM size while retaining all 175 photographs. Motion runs independently of scroll, at 54 pixels/second before column variance (previous wall: 46).
- `drift-wall.css`: supplied DriftWall CSS; `tactile.css` adds washi photo borders and material overrides.
- `presentation.css`: typography, transitions and responsive layout.

The card concepts are 基 (foundation), 共 (together), 旅 (journey), 知 (knowledge) and 静 (calm). The introduction reads 創る、そして学ぶ (create and learn).

Behind each kanji, `INK_SYMBOLS` in `scripts/washi-cards.js` brushes one bold wet-ink symbol: code braces (基), two overlapping rings (共), contactless tap waves (旅), a neuron (知) and a phone outline (静).

## Preview media

Hover previews are silent canvas-generated video streams showing project motifs. They are illustrative animations, not recordings of the actual applications. Add a `previewSrc: 'videos/example.mp4'` property to a project to use a real clip. Streams stop on pointer leave, during the card transition and when the document is hidden. Reduced-motion mode keeps static previews.

## Music

`audio-life-jp/` holds the instrumental for the Japan section. It starts as the sliding doors open after the last card, fades in to 18% volume (`MUSIC_VOLUME` in `scripts/presentation.js`) so the presenter stays audible, and loops to the end. Scrolling back behind the doors fades it out and rewinds it, so it starts from the beginning each time the doors open.

## Room and archive

`photos/bg/japan-room-wide-v2.png` is the new panoramic room photograph created with the built-in image-generation tool, using the supplied image as a visual reference. Its prompt is preserved in `photos/bg/japan-room-wide-v2.prompt.txt`. The original is retained unchanged at `photos/bg/japan-room.png`.

Past the window the camera keeps approaching Fuji: `photos/bg/fuji-approach-1..3.jpg` (user-supplied, progressively closer views) cross-fade while each zooms about the summit — the lakeshore behind the photo wall, open water as the wall leaves, and the closest view behind the thank-you message.

The wide image covers the entire viewport. A separate shade layer starts at 34%, reaches 55% behind the photo wall and settles at 60% for the final message. Scroll transforms the image around the measured window center, scaling until the window opening fills the viewport before photos enter. Cover-aware coordinates maintain the same camera target on narrow screens. The sliding doors are four fusuma panels (pines and cranes) cropped from a user-supplied reference photograph into `photos/bg/fusuma-*.jpg`, tone-matched and upscaled 3x. CSS adds the black lacquer frames, paper grain, room lighting, the shadow of the nearer panel on the one behind it, and a wooden kamoi beam and shikii track that settle in as the doors close. Narrow screens show one panel per door.

The photo wall keeps its perspective layout and hover behavior; only the photo frames use textured Japanese paper. Selecting a photo opens the existing viewer and pauses the wall. Reduced-motion mode keeps the wall still.

The old mountain ascent, original project panels and reflections are preserved in `archive/fuji-climb-2026-11-17.html`, with a base URL pointing at the presentation directory. They are not loaded by the active presentation. Original background assets and all 175 Japan photographs remain in place.

## Verification

```powershell
node --check presentation/scripts/presentation.js
node --check presentation/scripts/samurai.js
node --check presentation/scripts/washi-cards.js
node --check presentation/scripts/drift-wall.js
node --test presentation/scripts/timeline.test.cjs
```

For a local preview from the repository root:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/presentation/`. No dependency installation or build step is required. Web fonts have local fallbacks when offline.

## Washi reading view and media

Five chapters share the paper artwork in `scripts/washi-paper.js`. Scene content
lives in `scripts/stories.js`; `scripts/story-visuals.js` renders unboxed ink visuals
and the direct-click media viewer. Scroll advances the scenes and repaints them.
There are no scene arrows, demo-step controls or visible Expand buttons.

Click an image, video or ink visual to enlarge it; Enter/Space works when focused.
Videos expose playback controls in the viewer. Closing restores their time and
playback state. Media scenes devote their reading area to large images/video with
a short title and one-line description. The cipher, tape and linked-list states
follow scroll progress. The focused preview has its own native scroll route.

The original first presentation is preserved separately at commit `0df014a` on
branch `codex/presentation-first-visuals`; it is not merged into this version.

Scroll highlights scene boxes one at a time in document order, reusing the click-to-lift treatment. Pages with more boxes receive more reading distance. Reverse scrolling retraces the highlights; reduced-motion mode uses a static outline. The focused Washi preview uses the same sequence.
