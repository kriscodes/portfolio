## Tension sail redesign — 2026-10-29

- Applied the approved silver/graphite design, Instrument Sans typography, subtle accent, margin labels, and sail study across all nine content routes.
- Reconciled the frontend with production commit `1bf92a840343a41ca8457f1a29bc1abb392cfdc9`, preserving its dependency lockfile, public API contracts, article correction, and existing studio regression tests.
- Full production build and TypeScript checks passed. All 22 automated tests passed: 8 retained studio/map tests, 1 API contract test, 5 sail geometry/wind tests, and 8 release-audit regression tests.
- Static release audit passed for 9 content routes, 12 exported HTML documents, 110 links, and 21 local assets. Canonical/social metadata, sitemap, robots, semantic structure, labeled controls, and prototype cleanup were checked.
- Local HTTP release checks passed for all 9 direct routes, 18 delivered assets, crawler files, and a custom HTTP 404 response.
- Browser checks covered all 9 pages at 320px without horizontal page overflow or broken visible images, plus desktop and 600px/820px tablet layouts. Light and dark appearances, native keyboard range limits, zero-wind state, project stage selectors, personal interests, article links, and navigation were exercised. No browser console errors were observed.
- Static sail and no-JavaScript summaries are provided. Canvas lifecycle, reduced motion, observer/listener cleanup, and tab/offscreen suspension were reviewed; geometry and bounded wind dynamics are tested.
- Formatting and whitespace checks passed. Public release verification is performed against the actual Render deployment after publishing.

This is scoped browser and implementation testing, not physical-device coverage, formal accessibility certification, or a measured Core Web Vitals score. The records below are historical.

# Validation

## 2D studio and 404 — 2026-10-25

- **Production export:** the frontend build and TypeScript checks passed. No new runtime packages were added.
- **Automated checks:** all eight frontend tests and the API integration test passed. New coverage verifies that changing the 2D theme preserves saved screen selections and the current URL without adding history entries, including when storage is blocked. Formatting passed.
- **Actual Chrome fallback:** a Chrome session with graphics disabled automatically opened the complete 2D portfolio from the ordinary homepage. Both themes, CareIQ patient browsing/search, a nested appointment dialog, Neon Drift controls, modal Back/Escape, focus return, browser history, and direct project-link reloads were exercised.
- **Responsive layout:** inspected at 390px and 320px, with no page-level horizontal overflow. Checked About tabs, voyage controls, map-label legibility, and the header. Small primary controls provide at least 44px height.
- **3D regression:** the production export still rendered the original studio in a WebGL-capable browser. The footer switched to 2D; changing the theme there and returning to 3D preserved the selection.
- **404:** inspected in both themes at desktop, 390px, and 320px. Work, About, Contact, studio return, browser Back, and remembered theme behavior were exercised. The design uses SVG and HTML and requires no WebGL.
- **Review:** loading failure/retry, async preview cancellation/disposal, observers, animation cleanup, and shared-link restoration received an additional source review with no material issues found.

This is browser and viewport coverage, not a physical-device or formal accessibility/performance audit. Public deployment evidence is recorded after the release is live.

## Corner Studio — 2026-10-25

The checks below cover the production export, browser behavior, and the first Corner Studio deployment.

- **Production build:** the full workspace build passed for Next.js, the Express API, and shared contracts. The frontend exported successfully for static hosting.
- **Type checks:** passed across all workspace packages.
- **Automated tests:** all six studio state tests, the Catalina map-rendering regression, and the existing API integration test passed. The map test checks real coastline paths, finite harbor coordinates, boat movement between both harbors, and both themes. The root test command builds shared contracts before running package tests.
- **Formatting:** the root Prettier check passed.
- **Desktop browser:** exercised Work navigation, the Care IQ preview, Neon Drift under Experiments, monitor back navigation, Escape, and the theme switch. Checked About tabs and page controls, and Life's sailboat, Catalina map, pause, reverse, and outdoors controls.
- **Narrow browser viewports:** checked the production export at 390px and 320px. Exercised Work, Life, and About navigation, tabs and paging, and theme switching.
- **No-WebGL fallback:** passed in Chrome against the production export. Loading resolved to the fallback, unavailable camera and sign controls were hidden, and Selected work led through to the full Care IQ case study. Ordinary Work, About, Notes, Contact, and case-study URLs remain part of the static export.
- **Static references:** all 230 local route and asset references resolved across 12 generated HTML files.
- **First live release:** implementation commit `087cebbe03291e23e5109ee944c031d07f51321e` reached Render `live` through commit auto-deploy. Web deployment `dep-dbfachijnfac73eim590` completed at 2026-10-26 01:02:24 UTC; API deployment `dep-dbfachijnfac73eim5c0` completed at 01:02:30 UTC (October 25 in Pacific time).
- **Public workload:** HTTPS homepage and Care IQ case study returned 200; www redirected to the apex; the bundled demo asset returned 200; an unknown route returned the custom 404; API health returned `status: ok`. The live domain rendered the 3D scene, switched themes, opened Care IQ inside the monitor, and navigated to Life and About.
- **Shared-link regression:** direct project, Catalina, and career-page links were checked against the production export after correcting initialization against the final Drei camera. A new scene always restores its destination even when the controller already has that destination selected. The Catalina coastline and boat rendered correctly, and playback worked in both themes. The Care IQ audit control also remains inside the preview without linking to an unavailable route.

This is a scoped implementation and browser review. It does not claim physical-device coverage, a formal accessibility audit, a performance score, or measured Core Web Vitals. The entries below are historical checks for the earlier visual design and do not describe the new homepage.

## Earlier design v1

Checked on 2026-09-13.

- Production build: passed for the Next.js frontend, Express API, and shared contracts. All eight content routes and the custom 404 export successfully.
- Type checks: passed across the workspace; the final production build also includes Next.js and API TypeScript checks.
- API integration test: passed. Real HTTP requests verify health, project summaries, and the structured rejection of unsupported writes.
- Static export: local route and asset references resolved across all generated HTML documents.
- Desktop: homepage and Care IQ layout inspected in the browser. Primary navigation and case study links work.
- Mobile: homepage checked visually at 390px and 320px. About, Contact, the notebook index, Care IQ, and the engineering article checked at 320px with no page-level horizontal overflow. A clipped narrow-screen headline was corrected.
- Interactions: request stages, the next-stage control, stage questions, tradeoff disclosures, land/sea selector, image dialog opening, Escape closing, and mobile navigation were exercised.
- Keyboard: back-to-top now moves focus to the shared header rather than leaving focus in the footer. The header target exists on every page. The photo dialog has an accessible name and native modal behavior.
- Contrast: signal text was darkened to #b13c21. Calculated contrast is 5.20:1 against paper (#f2f0e6), 4.70:1 against the soft surface (#e4e6d9), and 4.73:1 against the request surface (#e4e7da). The orange contact panel uses a paper-colored focus outline.
- Reduced motion: the stylesheet disables animated transitions and preserves the resting photo composition when requested.

This is a scoped implementation review, not a formal accessibility certification or a measured Core Web Vitals report. Test real devices and run a full accessibility/performance audit before public launch. Original photography, verified career history, resume, and public content approval remain editorial launch inputs; see CONTENT-PROVENANCE.md.

The hosted design preview contains the static frontend. The API is provided as a runnable monorepo foundation and is not deployed by the static-site publication.

### Second pass — Wind Study and homepage flow

Checked on 2026-09-13 after the second-pass edits.

- Production build passed for the frontend, API, and shared contracts, including TypeScript checks. No API behavior changed in this pass.
- Static validation resolved all 246 local route, asset, and anchor references across 11 generated HTML files.
- Desktop chapter tracking correctly changed to Notes and Outside. Corrected observer margins to use viewport-height pixels, and rebuilt observation on resize.
- Homepage and Wind Study inspected at 390px and 320px. Neither produced page-level horizontal overflow. Small controls and chapter links were adjusted for legibility.
- Wind Study controls exercised: bearing to 359° and 0° with keyboard End/Home, strength selection, pointer placement, arrow-key movement with status feedback, pause, resume, reset, and the implementation disclosure. Reset restored 65°, Breeze, and the starting eddy position while preserving the chosen pause state.
- The still drawing was inspected through the pause control. Reduced-motion preference handling, observer cleanup, hidden-tab suspension, and frame cancellation were reviewed in source; an OS-level reduced-motion toggle was not exercised.
- The chart preserves native vertical touch scrolling through `touch-action: pan-y`; a physical touch device was not tested.
- The Care IQ diagram shortcut reached `/work/care-iq/#request` and the “From identity to integrity” section. Returning home remounted the interaction normally.
- No new runtime packages or external data services were added. No performance score or frame-rate benchmark is claimed.

### Personal photography and professional evidence

- Added three Instagram JPEG renditions, visually inspected before integration. Home uses the forest road and sailing photo; About uses those plus the aerial view. Assets are stored locally, with source-post links and accurate credit text.
- Read the current resume linked in “Find Open Jobs” directly from Google Drive. Checked the Gen UI metric, user/application reach, One ClaimHub scope, Highmark delivery scope, and CrossComm mentoring wording against it and the direct-report clarification.
- Production build and TypeScript checks passed across the monorepo, including the new `/work/gen-ui/` route. The existing API integration test passed after adding its project summary.
- All static local route, asset, and anchor references resolved. Home image references, removal of stock-photo credits, rendered leadership copy, Gen UI results, and the city image in the client bundle were verified.
- This pass did not add another browser-layout audit. The existing responsive rules are extended for the new content; the Instagram versions are modest-resolution renditions, not camera originals. No project-performance benchmark was performed by this portfolio; figures come from the resume.
