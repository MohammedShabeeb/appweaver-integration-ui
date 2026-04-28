# Product Spec: Next UI

## Purpose

Next UI is a browser-based workflow and configuration builder for Camel-style integration routes. It lets users visually assemble flows, configure route steps, maintain supporting configuration files, and export artifacts for downstream projects.

## Primary Users

- Integration developers building workflow routes.
- Platform engineers preparing reusable configuration for services.
- Reviewers who need a readable representation of route structure and generated dependencies.

## Current Product Surface

- Visual workflow canvas with start, marshal, unmarshal, and process nodes.
- Insertable connectors between workflow steps.
- Workflow management with multiple canvases and nested child canvases.
- Import of workflow exports and supported route JSON definitions.
- Export of workflow JSON and generated `pom.xml`.
- Configuration workspaces for beans, datasources, security, LLM providers, RAG, and endpoints.
- Catalog-driven built-in components and datasource templates.
- Local browser persistence through the Zustand store.

## Product Principles

- Preserve user work locally and avoid destructive surprises.
- Prefer catalog-backed options when a domain has known valid values.
- Keep exported artifacts deterministic and reviewable.
- Make configuration screens dense enough for repeated operational use.
- Treat import/export formats as product contracts.

## Non-Goals For Now

- Server-side project generation.
- Multi-user collaboration.
- Authentication or hosted persistence.
- Full Camel DSL coverage beyond supported components.
- Runtime execution of generated workflows.

## Success Criteria

- A user can create a workflow, configure its steps, and export JSON without reading source code.
- A user can maintain supporting config objects without leaving the app.
- Existing saved local state continues to load across store migrations.
- Specs describe user-visible behavior before implementation starts.
