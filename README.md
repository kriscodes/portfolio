# Kristian Salmeron — Making things work

The approved portfolio redesign for kristiansalmeron.com: silver and graphite, Instrument Sans, one subtle blue-gray word accent, quiet margin labels, and an interactive sail form study. Work, project stories, About, Contact, Field notes, and both complete articles use real, statically generated routes.

This source carries the new design. The historical documents in `docs/` describe the earlier Field Guide edition and its content provenance.

## Deploy to Render

The complete source is in this repository. Deploy the frontend and API using the included [Render Blueprint](render.yaml) and [step-by-step deployment guide](docs/DEPLOYMENT-RENDER.md). The chatgpt.site review deployment is separate; there is no runtime dependency on it.

## Start here

- [Private analytics, owner setup, social links, and Render deployment](docs/ANALYTICS.md)
- [Design and exact content strategy](docs/DESIGN-AND-CONTENT.md)
- [Second-pass UX review](docs/UX-REVIEW.md)
- [Architecture and API](docs/ARCHITECTURE.md)
- [Content provenance and launch inputs](docs/CONTENT-PROVENANCE.md)
- [Decision record: a static reading experience with a separate API](docs/decisions/001-static-ui-separate-api.md)

## Run locally

Use Node 22.13+ (tested with 22.23.2) and pnpm 11.22.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Web: `http://127.0.0.1:3210`. API: `http://localhost:3211`.

On systems with a low watcher limit, use `WATCHPACK_POLLING=true pnpm dev`.

```sh
pnpm validate
```

`pnpm validate` checks types, runs API contract/authentication/collection tests, social attribution tests, retained studio regressions, and geometry/audit regressions, builds the production export, and audits every content route, internal link, local asset, accessible control, and canonical metadata. Set `ANALYTICS_TEST_DATABASE_URL` to a disposable PostgreSQL database to include persistent-store integration checks. The root build creates `out/`, the deployable static frontend. The API builds to `apps/api/dist/` and runs independently with `pnpm --filter @kristian/api start`.

After deployment, run `node scripts/test-live-web.mjs https://kristiansalmeron.com` to verify delivered pages, assets, crawler files, and the custom HTTP 404. This HTTP check also accepts a local or staging origin.

## Code formatting

Run `pnpm format` to format the source, or `pnpm format:check` to check it without changing files. Prettier handles TypeScript, TSX, CSS, JSON, YAML, and Markdown. In VS Code or Cursor, install the recommended Prettier extension; this repository enables format on save.

Edit source files in `apps/` and `packages/`. Generated `.next/`, `out/`, and `dist/` files are excluded; production JavaScript remains minified for delivery.

## Workspace

```text
apps/web/             Next.js App Router, React, scoped CSS, local fonts
apps/api/             Express API, private analytics, in-house owner login
packages/contracts/   Shared API types and public project summaries
docs/                 Design, content, architecture, provenance, decisions
scripts/              Static export packaging and release validation
```

The stack uses pnpm, Next 16.3.3, React 19.2.8, Tailwind 4.3.3, TypeScript, Express 5.2.1, Drizzle 0.45.2, and PostgreSQL client 8.23.0. Private analytics uses PostgreSQL and a single-owner password login implemented with Node's scrypt and opaque server sessions. No third-party analytics or authentication account is required. The public portfolio remains readable without login; see [analytics setup](docs/ANALYTICS.md) for the separate private dashboard.

## Included

Nine content routes plus a custom 404; responsive navigation; a sail study with height, width, draft, and wind controls; interactive architecture explanations; land/sea/lens selector; working LinkedIn and Instagram destinations; locally served open-source fonts and licenses; per-page canonical/social metadata; sitemap and robots; two complete essays; preserved API contracts; geometry, contract, and release audit tests.

Wind starts only on request, stops when the sail leaves view or the tab is hidden, and respects reduced motion. A static sail and readable architecture summaries remain available without JavaScript. The sail response is an illustrative form study, not engineering validation. Existing public content and project claims are preserved; no patient data is used.
