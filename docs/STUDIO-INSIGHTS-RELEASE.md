# Studio Insights release handoff

Prepared November 16, 2026, Pacific time. Implementation is committed and pushed for review. No production service, database, secret, or deployment setting has been changed by this work.

## Review

| Repository                  | Pull request                                  | Branch                    |
| --------------------------- | --------------------------------------------- | ------------------------- |
| Portfolio / Studio Insights | https://github.com/kriscodes/portfolio/pull/2 | `feature/studio-insights` |
| Lab                         | https://github.com/kriscodes/lab/pull/3       | `feature/studio-insights` |
| Toolbox                     | https://github.com/kriscodes/toolbox/pull/2   | `feature/studio-insights` |

All branches began from freshly fetched current source in clean existing checkouts. Existing unrelated work was preserved. Feature commits separate dashboard design, collection, backend reporting/migration, privacy documentation, and browser edge-case fixes. No commit messages mention an assistant or generation tool.

Portfolio application/test changes through `204d374` passed the checks below; this handoff adds documentation only. Lab is `f06053b`; Toolbox is `fe438a3`. Pull requests retain the full commit history and current head.

## What is live now

The existing Portfolio collector remains live. Live script inspection found no Studio Insights collector on Lab or Toolbox. This update has not been merged or deployed, so new measurements are not yet collecting in production.

Verified existing Render workspace: `kristiansalmeron.com` (`tea-dajm3dgae00c73agm78g`).

| Service                   | ID                         | Last inspected live source                 | Deployment behavior |
| ------------------------- | -------------------------- | ------------------------------------------ | ------------------- |
| Portfolio API / dashboard | `srv-dajm54fqj5pc73e64nm0` | `b45ecb406944e6b44e6d8dbccc0330a56ee9455a` | Automatic from main |
| Portfolio static site     | `srv-dajm54fqj5pc73e64nlg` | `b45ecb406944e6b44e6d8dbccc0330a56ee9455a` | Automatic from main |
| Lab static site           | `srv-dboht9gu01pc73fapa90` | `ecc17f9383f5750e9ce0e851ec15d4239469c8ff` | Manual from main    |
| Toolbox static site       | `srv-dbklj4u7bikc73doopvg` | `ca07877d4a604ea5b3fc692627d4ad6c1c3f1ada` | Automatic from main |

Read-only production smoke checks: API health returned `ok`; unauthenticated reports returned HTTP 401; the new tracker URL returned HTTP 404, as expected before release. No fake visitor events were inserted. The current owner dashboard's real report contents were not accessed.

## Verification completed

- Portfolio: **93 tests passed, zero skipped** (37 frontend, 42 API/collector/report/database, 14 geometry/export validation tests).
- PostgreSQL 18: additive migration from a populated legacy schema, repeat initialization, existing event/campaign preservation, owner credentials and active sessions, duplicate IDs, and persistent reports passed against an isolated disposable database.
- Portfolio lint, TypeScript checks, production builds, formatting of changed files, and ten-route static release audit passed.
- Lab: 13 tests, formatting, lint, TypeScript, build, and five-route export audit passed.
- Toolbox: 65 tests, lint, workspace TypeScript, production build, and output audit passed.
- Dashboard Chrome checks: 1440px desktop, 768px tablet, 390px mobile, and 320px narrow layout; no page overflow; keyboard chart controls; 7/30/90-day controls; themes; approved shared campaign links; privacy view; empty/error states; sign-out clears report content.
- Actual built Portfolio, Lab, and Toolbox in desktop and mobile Chrome: shared Secure SameSite identifiers; origin-only referrals; client-side navigation links; experiment and tool opens; validated tool action; private-input/credential canaries absent from analytics; public privacy-page exclusion; opt-out across already-open sibling sites. All network requests were intercepted locally; no production traffic or provider requests.
- Desktop/mobile visual review of Lab/Toolbox home and privacy pages. Dashboard sample data is visibly marked local preview. Measured primary text contrast is at least 5.75:1 across tested light/mint/dark combinations.

The executable browser checks are `scripts/test-insights-browser.mjs` and `scripts/test-insights-tracking-browser.mjs`. They require Playwright and Chrome. The latter accepts `--lab=/absolute/path/to/lab/out` and `--toolbox=/absolute/path/to/toolbox/dist`; Portfolio defaults to this repository's `apps/web/out`. Set `TRACKER_MOBILE=1` for the mobile case. `PLAYWRIGHT_MODULE` can point to an existing installation. These are local test harnesses, not production preview endpoints.

## Release sequence after review

1. Review and merge Portfolio PR #2 into main. Existing automatic deployment starts the API and static site. Wait for the **API** deploy to be live and verify `/api/v1/health`, `/analytics-assets/tracker.js`, the login shell, and unauthenticated report rejection. Because the two Portfolio services deploy independently, the static site can briefly request an unavailable tracker if it finishes first; primary site functionality remains available. Do not enable the other sites until the API is live.
2. Confirm the Portfolio static deployment is live. The public privacy page and links must work; normal non-opted-out visits can then produce v2 observations. Existing history and owner login require no reset.
3. Review and merge Toolbox PR #2. Its existing automatic static deployment will use the new script. The same repository's Prompt API may also redeploy because its auto-deploy watches main, although its source and configuration were not changed.
4. Review and merge Lab PR #3. In its existing Render service, choose **Manual Deploy → Deploy latest commit**. Leave automatic deployment off. Wait for the deployed commit to match the merged source and reach live.
5. Check all public privacy pages and the owner's site cards. New active-time, scroll, paths, movement, and action metrics begin after installation, with partial coverage during rollout. Do not create synthetic production visits to make charts nonempty.

No additional push is required: all feature branches are already on GitHub. To push later local amendments, use the appropriate existing checkout:

```sh
git -C /Users/kristian/Documents/Codex/2026-10-29/ana/work/portfolio push origin feature/studio-insights
git -C /Users/kristian/Documents/Codex/2026-11-08/files-pasted-by-the-user-project/work/lab push origin feature/studio-insights
git -C /Users/kristian/Documents/Server/Toolbox push origin feature/studio-insights
```

Do not reset the owner, rotate the hash secret, recreate the database, or alter plans/networking for this update. Migrations add fields and indexes only. Old application versions remain compatible with the added columns; a rollback does not remove already received data.

## Interpretation limits

Daily identifiers cannot support returning-person reporting, so it is omitted. Initial active time, passive reading, browser lifecycle behavior, missed delivery, and multiple tabs make duration and exits estimates. Exits are the last observed pageview after inactivity, not a browser-close signal. Cross-site matching depends on shared storage and available origin referrers; unmatched arrivals remain visible. Clicks and tool attempts do not prove contact, successful generation, or conversion.

Only approved page and campaign catalogs are sent. New routes must be added to both client and server catalogs. Existing custom campaign URLs continue to attribute recognized sources, while unapproved new labels are discarded. Historical custom labels remain in old records. Detailed reports flag their 100,000-event limit and suppress exits when truncated. The first retained v2 timestamp moves with the 180-day retention window; it is not a permanent installation date. The upgrade can count one browser in both legacy and v2 namespaces on rollout day.

See [ANALYTICS.md](ANALYTICS.md) for complete collection, timing, identity, opt-out, retention, authentication, and migration details.
