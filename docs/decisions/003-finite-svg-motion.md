# ADR 003 — Finite SVG motion for the homepage sail

Status: accepted.

## Context

The sail should provide a small interactive detail without a continuously running graphics engine or delaying the readable page.

## Decision

Render the still artwork in SVG and animate only after an explicit button press. Use a bounded gust and a separate telltale path. Preserve the sail's leading edge and return exactly to the resting pose. Stop pending frames on completion, early settling, hidden tabs, viewport exit, reduced motion, and unmounting.

## Consequences

The illustration remains visible without JavaScript. SVG avoids a WebGL dependency, and finite motion limits idle work. The effect is an illustration rather than a cloth simulation. Unit tests cover timing and lifecycle; browser review remains necessary for visual motion, keyboard interaction, and reduced-motion behavior.
