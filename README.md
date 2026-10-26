# Kristian Salmeron — Corner Studio

A portfolio for kristiansalmeron.com, with an interactive corner studio as its homepage. Explore software projects, experiments, background, and a life outdoors in After Hours or Open Desk. Readable Work, About, Contact, and case-study pages remain available alongside the scene.

## Deploy to Render

The complete source is in this repository. Deploy the frontend and API using the included [Render Blueprint](render.yaml) and [step-by-step deployment guide](docs/DEPLOYMENT-RENDER.md). The chatgpt.site review deployment is separate; there is no runtime dependency on it.

## Start here

- [Corner Studio implementation and interaction guide](docs/CORNER-STUDIO.md)
- [Design and exact content strategy](docs/DESIGN-AND-CONTENT.md)
- [Second-pass UX review](docs/UX-REVIEW.md)
- [Architecture and API](docs/ARCHITECTURE.md)
- [Content provenance and launch inputs](docs/CONTENT-PROVENANCE.md)
- [Decision record: a static reading experience with a separate API](docs/decisions/001-static-ui-separate-api.md)

## Run locally

Use Node 22.13+ (tested with 22.23.2) and pnpm 11.22.0.

```sh
pnpm install
pnpm --filter @kristian/contracts build
pnpm dev
```

Web: `http://127.0.0.1:3210`. API: `http://localhost:3211`.

On systems with a low watcher limit, use `WATCHPACK_POLLING=true pnpm dev`.

```sh
pnpm build
pnpm typecheck
pnpm test
```

The root build creates `out/`, the deployable static frontend. The API builds to `apps/api/dist/` and runs independently with `pnpm --filter @kristian/api start`.

## Code formatting

Run `pnpm format` to format the source, or `pnpm format:check` to check it without changing files. Prettier handles TypeScript, TSX, CSS, JSON, YAML, and Markdown. In VS Code or Cursor, install the recommended Prettier extension; this repository enables format on save.

Edit source files in `apps/` and `packages/`. Generated `.next/`, `out/`, and `dist/` files are excluded; production JavaScript remains minified for delivery.

## Workspace

```text
apps/web/             Next.js App Router, React, Tailwind CSS
apps/api/             Express REST API foundation
packages/contracts/   Shared API types and public project summaries
docs/                 Design, content, architecture, provenance, decisions
scripts/              Static export packaging
```

The stack follows the inspected CareIQ workspace: pnpm, Next 16.3.3, React 19.2.8, Tailwind 4.3.3, TypeScript, Express 5.2.1, Drizzle 0.45.2, PostgreSQL client 8.23.0. Drizzle and pg are included for the future persistence slice but are not connected in this UI release. Clerk is intentionally deferred until there is an actual authenticated workflow. There is no invented login requirement for reading a portfolio.

## Included

An interactive Three.js studio with React Three Fiber and Drei; After Hours and Open Desk themes; sign-driven camera navigation; an explorable project monitor; Life and About displays; nine content routes plus a custom 404; request-path explorer; tradeoff ledger; land/sea/lens selector; keyboard-accessible photo dialog; working LinkedIn and Instagram destinations; copyable website address; per-page metadata; custom favicon; two starter essays; read-only API contracts; a meaningful API integration test; a resume-grounded Gen UI case study and leadership examples; three personal Instagram photographs.

Personal photos and leadership evidence are sourced from Kristian’s Instagram and resume. No invented employment history, impact metrics, awards, email addresses, compliance claims, or customer data are included. Historical design-review documents describe the earlier visual direction; see the Corner Studio guide for the current homepage.
