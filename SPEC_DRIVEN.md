# Spec-Driven Development

This project uses specs as the source of intent for product and engineering changes. Code can still move quickly, but every meaningful change should start with a small written contract before implementation.

## Workflow

1. Create or update a feature spec in `specs/features/`.
2. Define acceptance criteria before editing app code.
3. Note state, data, and export/import contract changes explicitly.
4. Implement against the spec.
5. Run `npm run spec:check`, `npm run lint`, and the relevant app checks.
6. Update the spec if implementation changes the intended behavior.

## Spec Types

- `specs/product.md` captures the current product intent and boundaries.
- `specs/features/*.md` captures user-facing behavior.
- `specs/architecture.md` captures system boundaries and data flow.
- `specs/decisions/*.md` records decisions that should survive code churn.
- `specs/templates/*.md` provides copyable starting points.

## Definition Of Ready

A feature is ready to implement when the spec has:

- Goal
- Users
- Scope
- Acceptance Criteria
- Data And State
- Validation
- Open Questions

## Definition Of Done

A feature is done when:

- Acceptance criteria are satisfied.
- State persistence and import/export behavior are documented when touched.
- Empty, error, and duplicate states are handled.
- The spec is updated with any intentional deviation.
