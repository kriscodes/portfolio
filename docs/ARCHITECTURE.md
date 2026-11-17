# Architecture

## Runtime boundaries

The pnpm workspace has three packages: a Next.js App Router frontend, an Express API, and shared TypeScript contracts. The frontend uses React, plain CSS, and local fonts. Pages render at build time, so reading and navigation do not depend on the API. Client components add the sail animation, case-study controls, and analytics integration.

The API serves `GET /api/v1/health`, `GET /api/v1/projects`, and Studio Insights at `analytics.kristiansalmeron.com`. It accesses PostgreSQL through `pg`; there is no ORM. A production startup waits for the analytics store, and the health endpoint returns 503 when that store is unavailable.

## Frontend

Routes and metadata live in `apps/web/src/app`. Case-study and personal-interest controls live in `components/inner-interactions.tsx`; essays live in `components/notes.ts`. The homepage sail uses `sail-study.tsx`, `sail-motion.ts`, and `sail-renderer.ts`. Its still SVG is present in the initial HTML; an explicit interaction starts a bounded animation. Reduced motion, hidden tabs, leaving the viewport, and unmounting stop it.

`components/portfolio-analytics.tsx` observes route changes and selected-work visibility. `lib/analytics.ts` loads the API's shared `/analytics-assets/tracker.js` collector. A blocked collector does not prevent page navigation or interactions. All files in `public` are exported, including files with no source imports; keep that directory limited to shipped assets and font licenses.

Case-study outcomes describe professional work, not measurements performed by this website. CareIQ remains in development, and its examples use synthetic data. Keep implementation descriptions separate from adoption, performance, and compliance claims when editing content.

## Analytics data flow

Portfolio, Lab, and Toolbox use one dependency-free collector. The API accepts an explicit origin allowlist, validates event/site agreement, and reduces routes, sources, campaigns, and actions to fixed catalogs in `apps/api/src/analytics/catalog.ts`. Query strings, fragments, arbitrary URLs, prompt inputs, generated output, and form values are not stored in events. Temporary hashed IP keys support rate limiting; raw IP addresses and user-agent strings are not event fields.

Daily random browser identifiers and short visit identifiers can be shared across participating subdomains using Secure, SameSite=Lax cookies. Visits expire after 30 minutes of inactivity or the Pacific date boundary. If shared cookies are unavailable, site-local storage provides a narrower fallback. The server hashes identifiers with `ANALYTICS_HASH_SECRET` and day-scopes v2 identities. Counts estimate observed browsers; they cannot establish distinct people or returning visitors.

Global Privacy Control, Do Not Track, the shared opt-out preference, and authenticated owner sessions exclude traffic. `/privacy/` is not measured. `?analytics_opt_out=1` disables collection; `?analytics_opt_out=0` allows it subject to browser privacy signals. An opt-out clears pending events and local identifiers; it does not erase events already received. With shared cookies blocked, set the preference separately on each site.

The browser outbox holds at most 100 sanitized events for 24 hours. Stable event IDs deduplicate retries. Blocking, offline devices, storage restrictions, and missed lifecycle events reduce coverage. Active time is a bounded estimate of visible activity; scroll milestones and explicit page references describe observed progress and navigation, not completed tasks. Reports distinguish timed pageviews and shared-visit coverage. Detailed reports cap processing at 100,000 events per selected range and disclose that limit.

## Persistence and owner access

`apps/api/src/analytics/store.ts` creates and updates the PostgreSQL schema before serving analytics. Additive migrations preserve legacy records, which cannot supply newer engagement fields. Events have 180-day application retention; cleanup runs in batches. Hosting backups have a separate lifecycle.

Every reporting endpoint requires the owner session. Passwords use scrypt; PostgreSQL stores only session-token digests. Production sessions expire after eight hours and use a host-only Secure, HttpOnly, SameSite=Strict cookie. Sign-out revokes the session. Private responses are marked no-store, and reports fail closed if durable storage is unavailable.

## Validation

`pnpm validate` checks frontend lint, workspace types, API/collector/report behavior, sail motion, production builds, and exported pages. The export audit checks document structure, links, assets, canonical metadata, and homepage heading word boundaries. PostgreSQL migration tests require `ANALYTICS_TEST_DATABASE_URL`; browser checks exercise the dashboard and privacy controls with local sample data. Test coverage does not establish production traffic completeness or accessibility certification.

See [deployment](DEPLOYMENT-RENDER.md) for service configuration and recovery, and [ADR 002](decisions/002-first-party-analytics.md) for analytics tradeoffs.
