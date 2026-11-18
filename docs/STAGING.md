# Staging environments — prepared November 17, 2026

[`render.staging.yaml`](../render.staging.yaml) is a separate, unconnected Blueprint. The production `render.yaml` remains separate. The initial provider inventory found no Portfolio, Toolbox, Lab, or Well Formed Studio staging services. CareIQ already has staging web, API, and PostgreSQL; its marketing site has none.

| Application         | Proposed staging site                    | API / data                                                                           |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Portfolio           | `staging.kristiansalmeron.com`           | `analytics.staging.kristiansalmeron.com`; dedicated PostgreSQL 18                    |
| Analytics dashboard | `analytics.staging.kristiansalmeron.com` | Served by Portfolio's staging API; independent owner account and secrets             |
| Toolbox             | `toolbox.staging.kristiansalmeron.com`   | `toolbox-prompt-api-staging.onrender.com`; browser-local prompt library, no database |
| Lab                 | `lab.staging.kristiansalmeron.com`       | Static site; shared staging analytics only, no dedicated API/database                |
| Well Formed Studio  | `staging.wellformedstudio.com`           | Static prelaunch site; no API/database; contact and payment remain disabled          |
| CareIQ staff app    | `staging.careiqlabs.com` (existing)      | `api-staging.careiqlabs.com` and `careiq-staging-db` (existing)                      |
| CareIQ marketing    | `marketing-staging.careiqlabs.com`       | Existing staging API; no extra database; initial research submissions disabled       |

New domains above are proposed, not live. Resource names are declared in each repository's staging Blueprint.

## Portfolio dependency isolation

The staging API and PostgreSQL use Virginia, separate from production in Oregon. The database has no public IP allowlist. Its private connection is wired with `fromDatabase`; there is no production database reference. The API uses `NODE_ENV=production` for production runtime protections and `APP_ENV=staging` to select only staging collection origins.

Independent hash/setup secrets are generated for the new API, and the stage owner email is supplied at creation. Initialize the staging dashboard's owner normally; do not copy production accounts, sessions, events, or credentials. The frontend's public collector URL points only to staging. Production rejects staging origins and staging rejects production origins. The shared collector uses staging-prefixed storage keys and a `staging.kristiansalmeron.com` cookie boundary, so review visits do not reuse production analytics identifiers.

Portfolio API compute is `0.5c-512mb`; PostgreSQL is `0.1c-256mb` with 1 GB storage. These are additional paid resources upon activation. Static sites have no compute plan. Confirm pricing and plan availability when approving provisioning.

Activate the analytics API/database before Lab and Toolbox staging so their shared staging collector exists. Preserve historical analytics IDs for existing projects while using the new public display names.

## Promotion workflow

1. Work on a feature/review branch. Open a pull request to `staging` and require the repository's existing CI checks. CI runs on pull requests and pushes to both `staging` and `main`.
2. After initial activation, staging services follow `staging` with `autoDeployTrigger: checksPass`. Wait for the actual deployed revision, then verify the UI, API health, error/denial behavior, and relevant persistence using synthetic data.
3. Promote the reviewed changes through a `staging` → `main` pull request. Require CI again and verify its source tree matches the version reviewed in staging, apart from documented environment settings. If it differs, test that candidate in staging first.
4. Production remains a deliberate promotion to its configured production branch. Do not merge or change a Blueprint while review-only work is pending: Blueprint sync can itself change infrastructure or trigger a build.
5. Retain the previous successful deployment. Roll back application code only after checking database compatibility; application rollback does not roll back database contents. Rehearse restore/migration work on an isolated copy with synthetic fixtures.

## Initial activation — still pending

These commits prepare configuration; no resource, DNS record, remote branch, provider setting, or deployment was changed. Creating a Render service triggers its first deployment even when automatic deployments are off. Activate only after the user reviews the result and asks to deploy.

At activation, create `staging` from the approved source, review the provider's Blueprint plan, confirm workspace/resource names and costs, configure stage-only secrets, and install the exact DNS records Render provides. Set up branch protection separately; workflow files do not create branch protection. Keep Blueprint Auto Sync off during initial wiring and review future configuration syncs explicitly.

Use the custom staging domains for end-to-end checks. `onrender.com` aliases are not automatically included in browser origin allowlists. Staging is public unless separately access-controlled; `X-Robots-Tag: noindex, nofollow, noarchive` discourages indexing but is not authentication. Use synthetic data only.

## Initial Render URL checks

The staging collector uses `https://kristian-salmeron-api-staging.onrender.com` so smoke checks do not depend on custom DNS. Only the three explicitly named staging frontend aliases are accepted. On Render aliases, analytics cookies remain host-only; cross-site visitor continuity is checked after custom staging domains are connected.
