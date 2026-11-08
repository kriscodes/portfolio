# Private Studio Insights

Studio Insights is the portfolio's own analytics collector, PostgreSQL store, reporting API, and single-owner password login. It uses the existing Render account and repository. It does not require an analytics provider, an external authentication provider, or a new account with another application.

## Services and deployment

The public portfolio remains a static site. The existing `kristian-salmeron-api` service is configured to host the collector and dashboard at `https://analytics.kristiansalmeron.com`. Every reporting endpoint checks the owner session on the server, including requests through the service's default `onrender.com` address. Public assets contain no visitor reports or credentials.

The `render.yaml` changes reuse both existing services, move the API to the always-on `0.5c-512mb` compute plan, and add a private-network-only `0.1c-256mb` PostgreSQL 18 database with 1 GB of storage in Oregon. The public static site's URL and appearance are preserved. Render's custom-domain association does not create DNS records at the domain registrar.

On November 8, 2026, the owner updated the deployment decision and explicitly approved the always-on API and the custom analytics subdomain. The selected additional cost is **$13.55/month before usage overages**: $7/month API compute, $6.30/month persistent database ($6 compute plus $0.30 for 1 GB storage), and $0.25/month for the custom domain beyond the workspace's included allowance. This supersedes the earlier free-API proposal. Usage overages follow the existing Render workspace plan.

The portfolio keeps at most 100 pending events for up to 24 hours in first-party browser storage and uses idempotent event IDs to retry transient network failures or service interruptions. Original event timestamps survive retries so delayed delivery does not turn an old visit into recent activity. Retries improve delivery but cannot guarantee every visit is recorded. Privacy settings, unavailable browser storage, ad blockers, and offline devices can also prevent delivery. Opting out clears pending events before further sends.

Required runtime configuration:

| Variable                       | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `DATABASE_URL`                 | Render internal connection string; resolve through `fromDatabase`    |
| `ANALYTICS_OWNER_EMAIL`        | Only account the application may create                              |
| `ANALYTICS_ORIGIN`             | Canonical dashboard origin, `https://analytics.kristiansalmeron.com` |
| `ANALYTICS_SETUP_TOKEN`        | Independent random one-time setup secret of at least 32 characters   |
| `ANALYTICS_HASH_SECRET`        | Independent random secret for stored pseudonymous identifiers        |
| `NEXT_PUBLIC_ANALYTICS_ORIGIN` | Public portfolio build-time collector origin; no secret              |

Generate and store secrets through Render's environment configuration. Preserve existing values through later Blueprint syncs. Never store a password, session cookie, setup token, connection string, or hash secret in source, deployment notes, screenshots, or logs.

Set `ANALYTICS_OWNER_EMAIL` directly on the existing API service before deploying. The Blueprint deliberately omits its value from source; `sync: false` prompts for new services but is ignored for updates to existing ones. Keep this private value and the generated setup/hash secrets in Render, and let the Blueprint supply the database connection reference.

DNS for the new subdomain: add a CNAME named `analytics` targeting the exact `onrender.com` hostname shown for `kristian-salmeron-api` in Render. Verify it in Render and wait for its managed HTTPS certificate. Do not change the root domain, email/MX records, or unrelated subdomains.

## First owner login

The deployment starts closed to visitor-data reads. There is no public registration flow. Open the dashboard's one-time setup view using the setup code from Render's secret configuration; the supported fragment form is `/#setup=SETUP_CODE`. Fragments are not sent to the server as part of the page URL. Choose a unique password of at least 14 characters directly in the dashboard. The server fixes the account to `ANALYTICS_OWNER_EMAIL` and atomically disables setup after the owner is created.

Password verification uses Node's scrypt. Sessions use random opaque tokens with only their digests stored in PostgreSQL, an eight-hour expiry, and host-only HttpOnly cookies. Production cookies use Secure and SameSite Strict. Sign-out revokes the session. Login attempts are limited, and browser-origin checks protect authentication mutations. Database failures do not expose reports or silently switch production to temporary storage.

If the owner password is lost, a trusted operator can run `node apps/api/dist/analytics/reset-owner.js` in the private Render service shell, which is available on the approved paid API plan. It reads a new password from standard input, requires the configured database and owner email, and revokes existing sessions. Keep the database private; the service shell can use its internal connection. Do not put the password in a command argument, source file, screenshot, or chat. There is no public reset endpoint or external email service.

## Shareable portfolio links

Use the dashboard's Shared links view to copy the clean bio links for the default `portfolio` campaign. Render redirects these paths to the existing homepage URL with the matching attribution tags; no external shortener or additional service is involved. Both trailing-slash and slashless forms work.

| Platform  | Clean bio link                           | Source      | Medium      |
| --------- | ---------------------------------------- | ----------- | ----------- |
| Facebook  | `https://kristiansalmeron.com/facebook`  | `facebook`  | `social`    |
| Instagram | `https://kristiansalmeron.com/instagram` | `instagram` | `social`    |
| LinkedIn  | `https://kristiansalmeron.com/linkedin`  | `linkedin`  | `social`    |
| TikTok    | `https://kristiansalmeron.com/tiktok`    | `tiktok`    | `social`    |
| WhatsApp  | `https://kristiansalmeron.com/whatsapp`  | `whatsapp`  | `messaging` |
| GitHub    | `https://kristiansalmeron.com/github`    | `github`    | `social`    |

For example, `/instagram` redirects to `/?utm_source=instagram&utm_medium=social&utm_campaign=portfolio`. The browser may show the expanded URL after opening the link; the clean URL is what belongs in a social bio. Existing long tracking links continue to work. For a custom campaign such as `bio` or `launch`, the generator keeps the full tagged URL so the campaign value is preserved.

The source tag is important for in-app browsers and private messaging, which may omit a referrer. Attribution describes the shared link: if an Instagram-tagged link is forwarded through WhatsApp, it still credits the original Instagram tag. Counted visits require someone to open the website; publishing a link does not reveal platform impressions, identities, followers, or the sender or recipient of a private message. Keep personal names, emails, phone numbers, and other sensitive values out of campaign labels.

## Measurement and privacy

The collector accepts a fixed set of portfolio events and sanitized properties. It records page paths without query strings or fragments, coarse device type, recognized referral sources, and approved campaign labels. Random browser identifiers rotate daily, and sessions expire after inactivity. The server hashes identifiers before storage. It does not use fingerprinting, precise geolocation, third-party trackers, or session recordings. Network infrastructure still processes request metadata as part of serving HTTP.

Visitors are estimates. The same person may be counted again on another day, device, or in-app browser. Blocking analytics, opting out, bot filtering, connectivity problems, or storage restrictions can affect counts. Project arrivals, preview launches, and outbound clicks are different events; do not interpret their independent totals as a conversion funnel. A LinkedIn click is a click, not evidence that a conversation or application happened.

Reports use America/Los_Angeles dates. Recent visitors means activity observed during the preceding five minutes. Reporting begins after installation; it does not reconstruct visits from before tracking was enabled. Raw events are retained for 180 days, with cleanup while the service runs. Database backup retention is separate from application event retention and follows the selected Render database plan.

The Privacy view links to `https://kristiansalmeron.com/?analytics_opt_out=1` to exclude this browser on the portfolio origin. Use `?analytics_opt_out=0` to re-enable it. Exclusion is browser-specific, so set it in each browser you use. The tracker also respects supported browser privacy signals. An authenticated owner session is excluded from collection when the browser sends that session cookie to the collector.

## Verification and operation

Production was verified on November 8, 2026 at `https://analytics.kristiansalmeron.com`, running source commit `ab5e722`. The API uses the always-on `0.5c-512mb` plan, and the 1 GB database is available with all external database IP access blocked. Both the API and public portfolio deployments reached `live`; the analytics domain has a managed HTTPS certificate. The health and authentication endpoints respond successfully, unauthenticated reports return HTTP 401 with private/no-store caching, fixed assets load, untrusted collection origins return HTTP 403, and a bot-only collector check returns HTTP 204 without creating fake traffic. The public portfolio's nine-route HTTP release audit also passed, and the delivered scripts contain the in-house collector, retry queue, and browser opt-out.

The free-to-paid hosting transition initially returned a Render gateway error even though the running app and database passed localhost checks. Redeploying the same tested version restored public routing. The verified API deployment is `dep-dbob223rjlhs73att3lg`; the public portfolio deployment is `dep-dboavblfi0pc73b48a8g`. Initial owner password setup is performed directly by the owner on the one-time setup page; no production password is entered or stored by the agent.

Run repository type checks, unit/integration tests, the production build, and the static-export validation before releasing. Use a disposable PostgreSQL database for the optional persistent-store integration test. Verify setup access, invalid passwords, blocked unauthenticated reports, session expiry/revocation, origin validation, allowed platform attribution, real collection/reporting, and empty states.

After a Render deploy is `live`, verify the health endpoint, login shell, protected reporting endpoints, HTTPS on the canonical domain, and the deployed collector. Complete the first owner setup yourself. Keep the database independent of the app filesystem so deploys and restarts preserve visitor history. Use Render's database exports/backups for recovery and review resource usage if traffic grows.
