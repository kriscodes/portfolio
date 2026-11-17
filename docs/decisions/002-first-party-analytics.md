# ADR 002 — First-party analytics with short-lived identity

Status: accepted.

## Context

Portfolio, Lab, and Toolbox need a consistent view of referrals and engagement without sending visitor activity to a third-party analytics provider. Public browsing must remain independent of measurement.

## Decision

Serve one collector from the Portfolio API and store validated events in PostgreSQL. Use fixed event and route catalogs, daily random identifiers, and visits that end after inactivity or a Pacific date boundary. Allow shared identity only across the owned subdomains. Honor browser privacy signals and a shared opt-out. Restrict reporting to the owner.

## Consequences

One collector keeps privacy and delivery behavior consistent across sites. Shared cookies can connect a short cross-site visit, but all subdomains under the parent domain become part of that trust boundary. Adding an untrusted hosted subdomain requires revisiting shared identity.

Daily rotation prevents reliable returning-person metrics. Blockers, local-storage fallback, missed delivery, and independent tabs limit attribution. Reports show coverage rather than implying complete traffic or verified funnels. PostgreSQL adds operating cost and recovery responsibilities, while public pages continue working without it.

See [architecture](../ARCHITECTURE.md) for measurement boundaries and [deployment](../DEPLOYMENT-RENDER.md) for configuration and recovery.
