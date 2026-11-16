# Editorial portfolio

The November 16, 2026 redesign follows the approved editorial concept: white background, CareIQ Signal blue (#0067E8), charcoal (#202B34), muted slate (#566879), and pale blue (#EDF5FF). DM Serif Display headings are paired with the existing Instrument Sans body text. Both are served locally with their licenses.

The homepage introduces Kristian as a Lead Software Engineer and presents CareIQ, Toolbox, and Lab in simple ruled rows. The footer contains a contact action, GitHub, and LinkedIn; no résumé link or palette swatches. The Work page retains the NLP Gen UI case study and a path to the existing field notes. About, Contact, articles, and the custom 404 share the editorial styling.

CareIQ's case study explains its marketing site, authenticated web app, API, and database before describing functionality. Marketing and the staff app are independent clients; only the API accesses PostgreSQL. Clerk identity is distinguished from application authorization and row-level tenant isolation. Copy identifies synthetic demonstrations, ongoing development, and unavailable automated insurance verification/integrations.

The analytics collector, privacy controls, social attribution redirects, API implementation, and Render service configuration are preserved. Only the analytics preference notice's colors are updated to match the page.

Deployment target: the existing `kriscodes/portfolio` repository and `kristian-salmeron-web` Render service in the `kristiansalmeron.com` workspace. Render deploys automatically when `main` updates. Implementation branch: `redesign/editorial-portfolio`.

## Validation

The existing validation pipeline covers workspace types, API and analytics tests, static export, local assets, internal links, document landmarks, canonical metadata, and crawl files. The content audit now checks the approved editorial headline and all four CareIQ architecture components. Production HTTP checks exercise all existing content routes, delivered assets, and the custom 404.

Completed before release:

- Workspace type checks and production builds passed.
- 50 tests passed across API, analytics, frontend state, geometry, and export auditing; the optional PostgreSQL integration test was skipped because no disposable test database was configured.
- The local tsx CLI could not create its IPC socket in this environment. The same test files passed using Node's `--import tsx --test` entry point.
- Static-export audit passed: 9 content routes, 12 exported pages, 139 links, and 21 local assets.
- Browser review covered the desktop homepage, mobile layouts at 390 and 320 pixels, CareIQ navigation and request-stage controls, and visible keyboard skip-link contrast. No horizontal overflow was found in the checked homepage and CareIQ layouts.
- CareIQ, Toolbox, Lab, and the existing analytics health endpoint responded with HTTP 200.
