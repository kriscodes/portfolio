# Editorial sail study

The homepage follows the approved white editorial composition: large serif typography, the established Signal blue, a refined ivory sail, and two selected-work rows. The case-study pages retain their existing content and styles. Toolbox, Lab, GitHub, and LinkedIn remain reachable from the homepage.

## Rendering and motion

The 1350 × 1165 transparent WebP is approximately 110 KiB. An SVG image embeds it in the initial HTML with fixed dimensions. A separate tapered SVG path supplies the blue telltale. Both remain visible without JavaScript.

`sail-study.tsx` owns accessible controls and browser lifecycle. An explicit click starts `sail-renderer.ts`, which updates two SVG attributes through a finite animation loop. No canvas, WebGL context, shader, texture loading, or Three.js import is involved in this interaction. Graphics acceleration is not required by the implementation.

The sail uses an affine compression that fixes its entire inclined leading edge. The trailing corner moves at most 48 artwork pixels, around 20–28 displayed pixels on desktop and 12 on mobile. The compression stays below 4%; painted seams and folds remain intact instead of being warped independently. The telltale has its own shape: a fixed attachment, a gentle resting droop, and a small wave that travels toward the tapered tip as the ribbon streams outward. This is a restrained illustration of wind, not a cloth or aerodynamic simulation.

`sail-motion.ts` defines a frame-rate-independent 8.4-second gust. It ramps up, holds briefly, and returns exactly to rest. “Let it settle” releases the current pose over 1.4 seconds while preserving the ribbon wave's phase. Completion, leaving the viewport, a hidden tab, reduced motion, and unmounting cancel pending frames and restore the exact resting SVG attributes. No perpetual animation runs.

The status is announced through a polite live region. The control uses a native button with keyboard focus styling. Reduced-motion visitors see the still artwork and a disabled “A moment of stillness” control. There is no automatic motion on page load.

## Checks

- `pnpm lint`: standard Next.js Core Web Vitals and TypeScript rules, with zero warnings.
- `pnpm --filter @kristian/web test`: gust timing, fixed sail anchors, bounded displacement, ribbon geometry, and renderer lifecycle, alongside existing frontend tests.
- `pnpm validate`: workspace checks, production build, and static-export audit.

The release should also be reviewed in a browser for repeated gusts, early settling, keyboard interaction, mobile layouts, reduced motion, and leaving the page during motion. Include Chrome with WebGL unavailable. Automated timing tests do not replace those visual checks.

### Implementation verification

The SVG revision passes frontend linting, TypeScript, the production build, and the static-export audit. Pure motion tests and deterministic frame-loop checks cover completion, early release, replay, cancellation, and exact reset. Resting and peak-gust SVG frames were rendered for visual inspection of the ribbon attachment and sail silhouette.

The initial SVG revision was verified live in Chrome for playback, keyboard activation, natural completion, manual settling, and exact reset, with no console errors. A 390-pixel mobile viewport also passed a layout review without horizontal overflow. Reduced-motion handling is covered by the implementation but was not exercised by changing the system preference.

The increased 48-pixel displacement still needs a live visual check after deployment. The local environment does not permit preview server sockets or local-file browser previews. No API source or dependency versions changed.
