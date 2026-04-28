# Architecture Spec

## Application Shape

The app is a Next.js client application. The main screen switches between the workflow builder and configuration workspaces from `app/page.tsx`.

## Key Modules

- `store/useFlowStore.ts`: central Zustand store for workflows, canvases, selected nodes, config collections, persistence, imports, and exports.
- `components/FlowCanvas.tsx`: visual workflow canvas.
- `components/ConfigPanel.tsx`: selected node and edge configuration.
- `components/ConfigurationWorkspace.tsx`: configuration sections for beans, datasources, security, LLM, and endpoints.
- `config/*Catalog.ts` and `config/*-catalog.json`: catalog-backed component and datasource definitions.

## State Model

The store owns:

- Workflow records, order, active workflow, canvas stack, nodes, and edges.
- UI sidebar state and selected configuration subsection.
- Created config collections for beans, datasources, security, LLM, RAG, and endpoints.

State is persisted to `localStorage` under `nextui-flow-store`. Store migrations must preserve existing user-created workflows and configuration wherever possible.

## Import And Export Contracts

Workflow export produces versioned JSON with workflow metadata, canvas stack, and canvas records. Workflow import accepts current workflow exports and supported route definitions with `marshal`, `unmarshal`, and `process` steps.

`pom.xml` export derives Maven dependencies from built-in component catalog entries and node-level dependency configuration.

## Implementation Rules

- Add or update a feature spec before changing user-visible behavior.
- Update `specs/architecture.md` when state shape, persistence, import, export, or catalog boundaries change.
- Record durable tradeoffs in `specs/decisions/`.
- Keep feature specs focused on behavior and acceptance criteria, not implementation minutiae.
