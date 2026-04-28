# Feature Spec: Configuration Workspace

## Goal

Users can create, edit, list, and delete supporting configuration objects used by generated workflows and services.

## Users

Integration developers and platform engineers.

## Scope

In scope:

- Beans.
- Datasources.
- Security auth and authorization files.
- LLM provider configuration.
- RAG configuration.
- Endpoint configuration.
- Duplicate prevention for stable identifiers and paths.
- JSON preview/editing where configuration is file-like.

Out of scope:

- Writing config files to disk from the browser.
- Validating secrets against external providers.
- Server-side schema validation.

## Acceptance Criteria

- Users can open each configuration section from the top navigation config menu.
- Creating an item validates required identifiers before saving.
- Editing an item preserves its identity while updating user-provided fields.
- Deleting an item removes only that selected configuration item.
- Security configs are grouped by `auth` and `authorize`.
- Endpoint configs normalize folder paths and JSON file names.
- Auth config previews valid JSON generated from tenant and client form fields.

## Data And State

Configuration collections are stored in `useFlowStore`:

- `beans`
- `dataSources`
- `securityConfigs`
- `llmConfigs`
- `ragConfigs`
- `endpointConfigs`

These collections are persisted in the browser store.

## Validation

- Bean names must be present and unique by name.
- Datasource keys must be present and unique by key.
- Security files must have a file name and valid content expectations for their subsection.
- LLM provider ids and RAG ids must be unique.
- Endpoint configs must be unique by protocol, folder path, and file name.

## Open Questions

- Should configuration objects be exportable as a separate bundle?
- Should schemas live beside each catalog JSON file?
