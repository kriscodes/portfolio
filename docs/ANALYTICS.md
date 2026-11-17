# Studio Insights

Studio Insights is the first-party collector, PostgreSQL store, reporting API, and private owner dashboard for Portfolio, Lab, and Toolbox. It uses the existing Express service and database at `https://analytics.kristiansalmeron.com`. The public sites remain static; analytics failures do not block their primary interactions.

## Architecture and rollout

| Site      | Repository            | Integration                                                                            |
| --------- | --------------------- | -------------------------------------------------------------------------------------- |
| Portfolio | `kriscodes/portfolio` | Client adapter loads the shared collector, preserves existing studio/project hooks     |
| Lab       | `kriscodes/lab`       | Deferred collector in root layout; PDF rendering protocol opens                        |
| Toolbox   | `kriscodes/toolbox`   | Deferred collector on public pages; Prompt Builder opens and valid generation attempts |

The shared dependency-free script is `/analytics-assets/tracker.js`. All sites use the same collection and opt-out implementation. It does no third-party tracking and requires no new service or paid plan. The API accepts only explicitly approved first-party origins; a v2 event's site must agree with its request origin. Local development origins are accepted only outside production.

The previous production collection was Portfolio-only. Lab and Toolbox start sending data only when their integrations are deployed. Check the dashboard's site cards for observed collection; a deployed script does not guarantee delivery. The public privacy pages are excluded from measurement.

Deploy the API first, then the Portfolio static site and the two participating integrations. Before the updated API is live, the new script URL will be unavailable. Until an integration is live, that site's activity is absent. Legacy clients remain supported during rollout; legacy data remains readable. The legacy and v2 identifier namespaces differ, so estimates can count the same browser again during rollout.

Render configuration is unchanged: Portfolio API and static site use repository-root builds from `main`; Toolbox's static site also deploys from `main`; Lab's automatic deployment is disabled. Do not enable Lab auto-deploy or change plans, secrets, domains, database networking, or build settings as part of this release. The unrelated Toolbox Prompt API is not changed.

## Measurement contract

All report dates and identifier day boundaries use America/Los_Angeles, including daylight-saving changes. Counts estimate observed browsers and activity; they do not identify individual people.

| Measure                | Calculation and limits                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitors               | Distinct hashed daily random identifiers. Multiple devices, storage restrictions, in-app browsers, and day boundaries can count the same person again.                                                                                                                                                                       |
| Visits                 | A random visit identifier expires after 30 minutes without observed activity and at the daily boundary. Shared cookies can connect participating subdomains. Site-local fallback cannot reliably connect them.                                                                                                               |
| Active time            | While visible, elapsed time counts only within 60 seconds of the latest observed interaction. Snapshots are sent about every 15 seconds and on lifecycle changes. Long timer gaps are discarded. The report uses the maximum cumulative value per page instance, bounded by elapsed wall time, rather than adding snapshots. |
| Average active time    | Total measured active time divided by timed pageviews. Missing snapshots and historical pageviews are excluded, not treated as zero. Passive reading beyond the idle cutoff, browser suspension, and missed final delivery can undercount.                                                                                   |
| Scroll depth           | At most four milestone events per page instance: 25%, 50%, 75%, 100%. They describe the visible bottom edge after a scroll. Non-scrollable pages are excluded. Reports count each page at most once per milestone. No continuous positions are sent.                                                                         |
| Entries and sources    | First observed page of a visit, with its acquisition source. An absent referrer is direct / unknown. Approved campaign tags retain their original label when links are forwarded.                                                                                                                                            |
| Exits                  | Last observed page in a visit with no observed activity for 30 minutes. The rate is exits divided by that page's views in inactive visits. It is not proof of closing a browser. Late events can revise results.                                                                                                             |
| Next pages             | Explicit previous-page references within the same visit, rather than timestamp adjacency across unrelated tabs. Missing links remain absent. Independent action totals are never a verified funnel.                                                                                                                          |
| Movement between sites | Recognized first-party referrer arrivals, matched when the shared visit contains recent source-site activity. Unmatched arrivals and destination clicks are separate counts. A matched arrival is still an estimate, not proof that a particular click caused it.                                                            |
| Engagement             | Project opens, PDF rendering protocol opens, Prompt Builder opens, and intentional generation attempts. Tool actions do not imply successful output.                                                                                                                                                                         |
| Outbound interest      | Click categories for GitHub, LinkedIn, Instagram, email, and participating sites. Only a fixed destination site and approved path are kept for owned-site links; email addresses and full external URLs are not sent.                                                                                                        |

The collector does not record returning visitors because daily rotation cannot support a returning-person claim. No performance metrics were added: the scope remains lightweight engagement measurement rather than partially sampled performance scores.

Visible activity includes pointer, keyboard, touch, and scroll signals without reading their values. Navigation and page visibility changes establish an activity window. Initial page visibility is a bounded estimate, not evidence of continuous attention. New page instances separate inactivity and day boundaries.

## Identity and cross-subdomain privacy

The first-party `ks_insights_visitor_v2` cookie holds a random daily identifier. `ks_insights_session_v2` holds a random visit identifier and approved acquisition categories. Both use `Secure`, `SameSite=Lax`, path `/`, and the owned parent domain `kristiansalmeron.com`. The visitor cookie expires at the next Pacific midnight; the visit cookie expires after 30 minutes or midnight, whichever comes first. The server also day-scopes v2 identifier hashes to prevent joining a client that fails to rotate. No identifier is placed in a URL.

Cookie sharing changes the previous per-origin measurement boundary: participating subdomains can connect activity within a short visit. It does not extend observation to unrelated sites, introduce a lasting identity, or change the owner authentication cookie. All subdomains under the parent are a trust boundary for domain cookies; a future untrusted hosted subdomain should trigger a review or removal of shared identity.

When shared cookies are unavailable, identifiers fall back to origin-local storage and tab session storage. The server scopes those identifiers to their site. The dashboard reports shared versus site-local coverage. Missing referrers, blocked requests, independent tabs, storage partitioning, private browsing, and concurrent initial cookie creation can leave activity unmatched. Owned-site navigation sends origin-only referrer information where links allow it; external destinations retain their existing referrer protections.

## Opt-out

The public privacy notice and dashboard link to `?analytics_opt_out=1`. Use `?analytics_opt_out=0` to allow collection again. The preference is removed from the visible URL after processing. The shared `ks_analytics_opt_out` preference cookie lasts up to one year and contains only the choice, not a visitor identifier. The old origin-local preference is respected and migrated. An explicit shared choice supersedes stale local preferences where cookies are available.

Global Privacy Control and Do Not Track override an allow choice. Every enqueue, send, retry, activity check, and lifecycle wake checks privacy. Disabling clears local identifiers and pending events; the server independently drops requests carrying the shared opt-out cookie or privacy headers. Already received data is not retroactively deleted, and an in-flight request cannot always be recalled.

Origins cannot erase one another's localStorage. Each site clears its local state when it next runs. If cookies are blocked, set the preference on each site; if all storage is blocked, the choice lasts for the current page only. Other browsers, devices, and in-app browsers require their own preference. If the collector script itself is blocked, it cannot save a choice or show confirmation, but it also cannot collect. Clearing browser data can reset preferences. Authenticated owner traffic is excluded when the host-only owner cookie reaches the collector.

## Data minimization, delivery, and retention

New requests, including old-client events, are sanitized at ingestion. Fixed route catalogs map unrecognized paths to `/unknown/`; query strings and fragments are removed. Referrers reduce to approved domains or unknown, never arbitrary subdomains. Campaigns are limited to `portfolio`, `bio`, `launch`, and `winter-update`. Existing custom tagged links still attribute recognized sources, but unknown campaign labels are discarded. Historical records are preserved unchanged.

Properties use fixed catalogs. No prompts, form values, tool inputs, generated output, names, email addresses, precise location, fingerprints, replay data, or unrelated browsing activity are collected. Infrastructure necessarily processes HTTP metadata. Temporary hashed IP keys support rate limiting; raw IP addresses and user-agent strings are not stored in analytics events. Device reporting is coarse.

The browser outbox keeps at most 100 sanitized events for up to 24 hours. Stable event IDs make retries idempotent; original timestamps survive delayed delivery. Client timestamps have a five-minute transit/clock tolerance. An old queue is sanitized before retry. Backoff, lifecycle delivery, and keepalive improve delivery without guaranteeing it. Offline devices, blockers, privacy controls, dropped lifecycle events, and queue eviction reduce coverage.

Raw events have 180-day application retention, with batched cleanup while the service runs. Database backups are separate and follow the existing hosting policy. Reports operate on stored events, not individual identity profiles. Detailed v2 reporting is capped at 100,000 events per selected range to bound memory on the existing instance. A limited report warns the owner and withholds exits; legacy summary SQL totals remain complete. Choose a shorter date range if limited.

## Historical data and migration

The migration only adds columns and indexes. Existing events default to schema version 1, Portfolio, and unmeasured new fields. Owner credentials, session tables, stored history, and secrets are preserved. The migration runs idempotently before serving collection or reports. Existing unique event IDs remain the deduplication key.

Version 2 adds site, page references, visit scope, active-time snapshots, scroll milestones, approved content/actions, destination categories, and receipt time. Reports separate historical totals from new metrics and display the first observed v2 event timestamp. Timing and paths cannot be reconstructed from old pageview counts. The first observed timestamp reflects currently retained data, not a permanent installation audit.

The migration is tested against a disposable PostgreSQL database containing a legacy schema, event, owner, and active session, then run twice to verify preservation and idempotence. Never point the test environment at production. Additive columns remain after rolling back application code; old clients and old readers remain compatible. A rollback does not undo data already received.

## Owner access and configuration

Every reporting endpoint checks the owner session, including requests through the service's default Render address. Public assets contain no visitor reports or credentials. Responses are private/no-store, and the dashboard remains unavailable when the durable store is unavailable.

Existing required configuration remains:

- `DATABASE_URL`: private Render connection string.
- `ANALYTICS_OWNER_EMAIL`: the single authorized owner.
- `ANALYTICS_SETUP_TOKEN`: independent one-time setup secret.
- `ANALYTICS_HASH_SECRET`: existing hashing secret; do not rotate during this release.
- `ANALYTICS_ORIGIN`: `https://analytics.kristiansalmeron.com`.
- `NEXT_PUBLIC_ANALYTICS_ORIGIN`: optional Portfolio build-time collector origin.

Owner passwords use scrypt. Sessions use random opaque tokens with only digests in PostgreSQL, eight-hour expiry, and a host-only Secure HttpOnly `__Host-analytics` cookie with SameSite Strict. Sign-out revokes the session. Origin validation, login limits, and setup closure are preserved. No account migration or password reset is needed.

For a genuinely new installation, the one-time owner setup accepts `/#setup=SETUP_CODE`, removes it from the browser URL, and requires a password of at least 14 characters. Existing installations retain their account. Recovery remains `node apps/api/dist/analytics/reset-owner.js` in the private Render service shell, with the password on standard input, never in command arguments or source.

## Shared links

The six default clean links remain `/facebook`, `/instagram`, `/linkedin`, `/tiktok`, `/whatsapp`, and `/github`. Existing Render redirects expand them to source, medium, and `portfolio` campaign tags. The dashboard can also generate approved `bio`, `launch`, and `winter-update` links. A click is activity on the website, not a platform impression, identity, contact, or conversion.

## Verification and release

Run the repository typecheck, unit/integration tests, production build, and static-export validation. `scripts/test-insights-browser.mjs` exercises the dashboard with explicitly labeled local sample data at desktop, tablet, mobile, and 320px widths, including chart keyboard access, filters, themes, shared links, privacy, empty/error states, and sign-out. It needs Playwright; `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHANNEL` can select an installed runtime/browser. No preview data enters production.

Set `ANALYTICS_TEST_DATABASE_URL` only to a disposable test/review database for persistent-store and legacy-migration tests. Check collection validation, opt-outs, session/day rotation, idle/hidden time, duplicate and delayed events, path linkage, unmatched site arrivals, and missing-duration coverage.

After release verify the health endpoint, login shell, unauthenticated report rejection, canonical HTTPS, collector asset, and each public site's script and privacy links. Use a browser opt-out or bot user agent for non-mutating production smoke checks. Observe real collection through the owner dashboard; do not manufacture production visits merely to populate charts. See `STUDIO-INSIGHTS-RELEASE.md` for this change's commits, checks, deployment status, and exact handoff commands.
