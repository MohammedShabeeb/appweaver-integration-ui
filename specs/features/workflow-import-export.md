# Feature Spec: Workflow Import And Export

## Goal

Users can move workflow definitions out of and into the app through stable, reviewable files.

## Users

Integration developers, reviewers, and platform engineers.

## Scope

In scope:

- Export active workflow as versioned JSON.
- Import current workflow export JSON.
- Import supported route definition JSON.
- Export generated `pom.xml` dependencies for the active workflow.

Out of scope:

- Exporting complete runnable projects.
- Importing arbitrary Camel DSL.
- Merging imported workflows into existing canvases.

## Acceptance Criteria

- Workflow export includes version, workflow id, name, timestamp, root canvas, current canvas, stack, and canvases.
- Importing a valid workflow creates a new workflow and makes it active.
- Importing a supported route definition creates start, marshal, unmarshal, and process nodes in order.
- Unsupported route steps are rejected instead of partially imported.
- Exported `pom.xml` includes dependencies from component catalog definitions and node config dependencies.
- Duplicate workflow names are deduplicated on import.

## Data And State

Import and export are implemented in `useFlowStore`. Exported workflow format is a product contract and should be versioned when incompatible changes are introduced.

## Validation

- Reject JSON that has no valid canvases and no supported route steps.
- Reject route definitions containing unsupported step types.
- Normalize dependency arrays to valid Maven dependency objects.

## Open Questions

- Should workflow JSON export include supporting configuration collections?
- Should imported route definitions support endpoint metadata beyond `from`, `routeId`, and `contentType`?
