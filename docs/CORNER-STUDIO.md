# Corner Studio

Corner Studio is the interactive homepage for kristiansalmeron.com. It brings the reviewed studio prototype into the existing Next.js workspace while keeping the portfolio's readable routes and case studies available at ordinary URLs.

## Stack and boundaries

- Next.js App Router, React, and TypeScript provide the site and browser interfaces.
- Three.js, React Three Fiber, and Drei provide the studio scene and camera layer.
- Tailwind remains installed; the studio uses scoped CSS for its particular typography, screen interfaces, and two themes.
- Fonts are served locally from the IBM Plex Sans, IBM Plex Mono, and Rajdhani Fontsource packages. No Google Fonts request is required from the browser.
- Next.js static export remains the deployment target. The Render static site serves the generated `apps/web/out` directory; the independent Express API is not needed to render or explore the studio.

The studio source lives in `apps/web/src/components/studio/`. Scene geometry, materials, lights, texture painters, project adapters, and the React host are separate modules. The site does not load the original all-in-one visualization HTML at runtime. The embedded Care IQ preview is a local demonstration asset, distinct from production healthcare systems and data.

## Experience to preserve

- **After Hours / Open Desk:** animated dark and light theme transitions, including scene lighting and screen colors. Theme preference survives a return visit.
- **Street-sign navigation:** Work Avenue, Life Lane, and About Way move the camera to their corresponding part of the scene. Overview restores the opening composition. Native controls offer the same destinations without requiring precise 3D pointer targets.
- **Work monitor:** browse project and experiment entries, explore available project demonstrations in the monitor, move back through the monitor's navigation, and follow ordinary case-study or repository links. Neon Drift belongs to Experiments.
- **Life display:** an enlarged indoor sailboat over moving water, proper boat navigation/deck lights, the Marina del Rey–Catalina journey, and the outdoors display.
- **About screen:** one tabbed digital wall display for background, career evidence, and working approach.
- **Atmosphere:** the parking lot and idling white truck stay off to the side. Distant storefronts, warm windows, neon reflections, and passing traffic support the studio rather than becoming navigation targets.
- **Decorations:** the potted palm, bonsai, and conifer remain inside the studio. Camera equipment sits on the shelf under the Studio sign. These are decoration only.

Reduced-motion preferences must be respected. Camera movement and theme changes should resolve predictably, and essential controls and text remain HTML rather than being available solely through canvas drawing.

## Accessible and shareable routes

The homepage has a server-rendered title and descriptive summary for assistive technology, a skip link, and compact links to ordinary portfolio pages. It deliberately avoids adding a second visible name/intro above the studio. Shared reading-page navigation and footer are hidden only on the homepage, where the studio supplies its own chrome.

| URL              | Content                                         |
| ---------------- | ----------------------------------------------- |
| `/`              | Interactive corner studio                       |
| `/work/`         | Project index and link back into the studio     |
| `/work/gen-ui/`  | Resume-grounded NLP Gen UI case study           |
| `/work/care-iq/` | Care IQ architecture case study                 |
| `/about/`        | Background, leadership, and interests           |
| `/field-notes/`  | Existing notes and their generated article URLs |
| `/contact/`      | Existing contact destinations                   |

These routes remain useful with JavaScript disabled or if a visitor cannot use WebGL. No API login is required to read them. The pre-studio visual design is recorded in `DESIGN-AND-CONTENT.md` and `UX-REVIEW.md` as historical design documentation.

### The 2D studio and missing routes

Visitors whose browser cannot open the 3D scene automatically receive a complete 2D portfolio. A scene error boundary and a 15-second startup timeout replace failed or stalled startup with this view. The 3D footer also offers **2D view**, and `/?view=2d` opens it directly. **Try the 3D view** remounts the scene and preserves the selected theme.

The 2D experience uses a local SVG studio illustration, React interfaces, and a Canvas 2D sailing map. It keeps After Hours and Open Desk, the full CareIQ and Neon Drift demonstrations in native modal dialogs, case-study links, the animated Catalina crossing with pause/reverse, outdoors photography, and the paged About tabs. Shared project and About hashes work in both views. Modal Escape, focus return, browser history, reduced-motion behavior, and hidden-tab suspension are part of the implementation.

Unknown addresses use a matching, WebGL-independent 404 street-corner design with a neon route-status billboard, theme control, a studio return link, and Work, About, and Contact street signs. Static hosting must serve the exported `404.html` with HTTP status 404 rather than redirecting missing paths to the homepage.

### Sharing a studio view

The homepage hash identifies the current camera destination and screen selection. Browser Back and Forward can move through those views. Theme and screen preferences are remembered locally; a shared URL chooses the destination independently of the visitor's saved camera position.

| Hash                      | Studio view                     |
| ------------------------- | ------------------------------- |
| No hash                   | Overview                        |
| `#work`                   | Work collection on the monitor  |
| `#work/careiq`            | Care IQ project                 |
| `#experiments`            | Experiments collection          |
| `#experiments/neon-drift` | Neon Drift                      |
| `#life/boat`              | Sailboat display                |
| `#life/catalina`          | Marina del Rey–Catalina journey |
| `#life/outdoors`          | Outdoors display                |
| `#about/story/1`          | About story, first page         |
| `#about/experience/1`     | Career experience, first page   |
| `#about/approach/1`       | Working approach, first page    |

About page numbers are one-based in the URL and clamped to the available pages. Unknown hashes return to the overview; invalid project or About selections resolve to a safe collection or tab.

## Local validation and deployment

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
```

The root `pnpm test` command builds shared contracts first, then runs the package tests, including studio state and API integration coverage. The web-only production command used by the existing Render service is `pnpm --filter @kristian/web build`. Full-workspace builds also package the export at root `out/` for other static hosting.

Before release, check both themes and a reload; Overview, Work, Life, and About navigation; monitor project and experiment browsing; Life's three views; About tabs; keyboard focus and Escape/back behavior; a narrow viewport; the no-WebGL fallback; and ordinary case-study links. Confirm the Render deployment commit matches the reviewed source and verify the custom domain over HTTPS after deployment.

Actual checks and deployment evidence belong in `VALIDATION.md` or the release record. This document describes the implementation and validation scope; it does not claim a performance score, an accessibility certification, or a deployment that has not completed.
