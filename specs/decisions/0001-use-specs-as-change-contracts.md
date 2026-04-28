# ADR-0001: Use Specs As Change Contracts

## Status

Accepted

## Context

The app already has several user-facing surfaces: workflow building, configuration management, import/export, catalog data, and persisted local state. Changes in one area can affect saved data and generated artifacts.

## Decision

Use Markdown specs under `specs/` as the lightweight contract for meaningful product and engineering changes. Feature work should update a spec before implementation, and state or artifact contract changes should update the architecture spec or add a decision record.

## Consequences

- User intent is easier to review before code changes.
- Import/export and persistence changes have a written trail.
- Specs must be kept current when implementation changes behavior.

## Alternatives Considered

- Keep behavior only in code and PR descriptions.
- Add a heavier external requirements tool.
