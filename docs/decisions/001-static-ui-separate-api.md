# ADR 001 — Static reading experience, separate API foundation

Status: accepted for design v1.

## Context

The portfolio needs memorable UI and credible engineering storytelling now. The user likes CareIQ’s stack and wants frontend and backend API in a monorepo. Reading the portfolio does not require identity, persistence, or a server round trip.

## Decision

Use CareIQ’s Next/React/Tailwind frontend and Express/TypeScript API in a pnpm workspace. Export the frontend statically. Include a real read-only API with health and project-summary endpoints and shared types. Retain Drizzle/PostgreSQL tooling for the next meaningful data workflow; do not create a database or an authenticated editor in this release.

## Consequences

The visual preview is simple to host and remains readable if the API is unavailable. The API has a clear foundation, but requires its own Node deployment. Structured content is edited in the repository, and some UI copy and public API summaries must be reviewed together. The monorepo keeps that coordination visible.

## Revisit when

A real authoring workflow, content scheduling, or persistent user input is required. At that point decide whether static regeneration is still sufficient, define the API contract, implement validation and authorization, and add API-owned migrations. Do not migrate the reading experience to a dynamic runtime without a concrete benefit.
