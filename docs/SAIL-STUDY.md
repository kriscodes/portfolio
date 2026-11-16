# Editorial sail study

The homepage follows the approved white editorial composition: large serif typography, the established Signal blue, a refined ivory sail, and two selected-work rows. The case-study pages retain their existing content and styles. Toolbox, Lab, GitHub, and LinkedIn remain reachable from the homepage.

## Rendering and motion

The 1350 × 1165 transparent WebP is approximately 130 KiB. It renders in the initial HTML with fixed dimensions, before any animation code loads. The image also supplies the fallback when JavaScript or WebGL is unavailable.

`sail-study.tsx` owns accessible controls and browser lifecycle. An explicit click imports `sail-renderer.ts`, which uses the existing Three.js dependency and a subdivided textured plane. The shader bends the belly, slightly twists the upper section, and moves the free edge and telltale. This is an illustrative deformation of artwork, not a cloth or aerodynamic simulation.

`sail-motion.ts` defines a frame-rate-independent 8.4-second gust. It ramps up, holds briefly, and returns exactly to rest. “Let it settle” releases the current pose over 1.4 seconds. No perpetual animation runs. Completion, leaving the viewport, a hidden tab, reduced motion, and unmounting all release renderer resources. A fresh canvas is used for the next interaction after context disposal.

The status is announced through a polite live region. The control uses a native button with keyboard focus styling. Reduced-motion visitors see the still artwork and a disabled “A moment of stillness” control. There is no automatic motion on page load.

## Checks

- `pnpm lint`: standard Next.js Core Web Vitals and TypeScript rules, with zero warnings.
- `pnpm --filter @kristian/web test`: gust endpoints, bounds, continuity, and behavior at several frame rates, alongside existing frontend tests.
- `pnpm validate`: workspace checks, production build, and static-export audit.

The release should also be reviewed in a browser for image-to-canvas continuity, repeated gusts, early settling, keyboard interaction, mobile layouts, reduced motion, and leaving the page during asset loading. Automated timing tests do not replace those visual checks.

### Implementation verification

Linting passed on all 18 files in scope with no errors, warnings, or suppressed rules. Workspace type checks, the production frontend build, 30 frontend tests, 13 geometry/export-audit tests, and the static-release audit passed using the installed Node 24 runtime.

Browser verification remains pending: the execution environment denied local server sockets, and its browser policy denied local-file previews. Eleven existing API tests could not start their HTTP servers for the same socket restriction; the password-hashing test passed, and the optional database test was skipped. No API source changed.

The added lint dependency graph was checked against all workspace manifests and for missing dependency references. A fresh frozen-lockfile installation could not complete offline because registry policy metadata was unavailable. The exact lint package versions were already installed locally and were used for the lint check. Run the normal install and full validation in the development or CI environment before release.
