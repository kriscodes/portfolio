# ADR 001 — Static frontend and separate API

Status: accepted.

## Context

Reading a portfolio does not require authentication or a server round trip. Interactive examples benefit from React, while analytics and private reports need server-side validation and persistence.

## Decision

Export the Next.js frontend as static HTML and assets. Run Express separately, with shared TypeScript contracts in a pnpm workspace. Keep public content in the repository and private data behind API authorization.

## Consequences

The site remains readable when the API is unavailable and can be served from a static host. Content changes require a build. The API has its own deployment and health checks. Browser integrations must tolerate failed requests, and changes to shared contracts must be checked across both packages.

PostgreSQL now supports analytics as described in [ADR 002](002-first-party-analytics.md). It does not make public-page rendering dependent on the API. Revisit static export if a concrete feature requires request-time content or authenticated public routes.
