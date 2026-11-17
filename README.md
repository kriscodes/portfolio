# Kristian Salmeron — Portfolio

[Engineering work, case studies, and field notes](https://kristiansalmeron.com/) built with Next.js, React, and TypeScript. The public site is statically exported. A separate Express API provides project summaries and private first-party analytics for Portfolio, [Lab](https://lab.kristiansalmeron.com/), and [Toolbox](https://toolbox.kristiansalmeron.com/).

## Development

Use Node.js **22.23.2** and pnpm **11.22.0**, pinned in [`.node-version`](.node-version) and [`package.json`](package.json).

```sh
pnpm install --frozen-lockfile
pnpm --filter @kristian/contracts build
pnpm dev
```

The frontend runs at `http://127.0.0.1:3210`; the API runs at `http://localhost:3211`. Public pages and the health/project endpoints work locally without analytics configuration. For collector or dashboard development, configure PostgreSQL and the variables in [`.env.example`](.env.example). The API reads the process environment; its dev script does not load a root `.env` file.

## Repository

| Path                 | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `apps/web`           | Static pages, local assets, and React interactions                            |
| `apps/api`           | Express endpoints, analytics collector, PostgreSQL store, and owner dashboard |
| `packages/contracts` | Shared API types and project summaries                                        |
| `scripts`            | Export packaging, content audits, and browser/HTTP checks                     |

## Checks

```sh
pnpm validate
pnpm format:check
```

Validation runs frontend lint, workspace type checks, tests, production builds, and the static-export audit. ESLint checks all of `apps/web/src`, including the analytics adapter and component. Set `ANALYTICS_TEST_DATABASE_URL` to a disposable PostgreSQL database to include store and migration tests. Browser checks require Playwright; see the deploy guide.

[GitHub Actions](.github/workflows/ci.yml) runs `pnpm validate` on pull requests and pushes to `main`, using a disposable PostgreSQL 18 database so store and migration tests run in CI.

`pnpm build` produces `apps/web/out`, copies it to the root `out`, and compiles the API to `apps/api/dist`. Neither generated output nor retired designs belong in source control.

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment and operations](docs/DEPLOYMENT-RENDER.md)
- Decisions: [static frontend and separate API](docs/decisions/001-static-ui-separate-api.md), [first-party analytics](docs/decisions/002-first-party-analytics.md), [finite SVG motion](docs/decisions/003-finite-svg-motion.md)

Staging setup and promotion: [docs/STAGING.md](docs/STAGING.md) (prepared; activation pending review).

Review package: [November 17 portfolio and staging changes](docs/REVIEW-2026-11-17.md).
