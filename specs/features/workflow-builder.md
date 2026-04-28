# Feature Spec: Workflow Builder

## Goal

Users can visually create and edit a route-like workflow by arranging supported components on a canvas.

## Users

Integration developers and platform engineers.

## Scope

In scope:

- Start node canvas initialization.
- Adding supported built-in components.
- Inserting components between existing connectors.
- Selecting nodes and connectors.
- Updating component configuration.
- Deleting nodes and connectors.
- Navigating nested canvases when a node owns a child canvas.

Out of scope:

- Executing workflows.
- Full Camel DSL generation.
- Collaborative editing.

## Acceptance Criteria

- A new workflow starts with a start node and no extra connectors.
- Supported built-in components are created with sensible default configuration.
- A component inserted on a connector replaces that connector with two connected edges.
- Selecting a configurable node opens its configuration panel.
- Deleting a node removes attached connectors.
- Deleting a node with a child canvas removes that child canvas subtree.
- The active workflow remains synchronized with the visible canvas state.

## Data And State

Workflow state is stored in `useFlowStore` as workflow records containing canvases, nodes, edges, current canvas id, and canvas stack.

## Validation

- Prevent unsupported component types from being created as built-in nodes.
- Preserve a usable canvas after deleting nodes or child canvases.

## Open Questions

- Which additional Camel components should become first-class catalog entries?
- Should node layout be normalized during export?
