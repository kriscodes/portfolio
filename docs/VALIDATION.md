# Validation — design v1

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

## Second pass — Wind Study and homepage flow

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

## Personal photography and professional evidence

- Added three Instagram JPEG renditions, visually inspected before integration. Home uses the forest road and sailing photo; About uses those plus the aerial view. Assets are stored locally, with source-post links and accurate credit text.
- Read the current resume linked in “Find Open Jobs” directly from Google Drive. Checked the Gen UI metric, user/application reach, One ClaimHub scope, Highmark delivery scope, and CrossComm mentoring wording against it and the direct-report clarification.
- Production build and TypeScript checks passed across the monorepo, including the new `/work/gen-ui/` route. The existing API integration test passed after adding its project summary.
- All static local route, asset, and anchor references resolved. Home image references, removal of stock-photo credits, rendered leadership copy, Gen UI results, and the city image in the client bundle were verified.
- This pass did not add another browser-layout audit. The existing responsive rules are extended for the new content; the Instagram versions are modest-resolution renditions, not camera originals. No project-performance benchmark was performed by this portfolio; figures come from the resume.
