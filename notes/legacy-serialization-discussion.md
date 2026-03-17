# Legacy CEDAR Serialization Discussion

## Position

The legacy CEDAR JSON serialization is a practical implementation artifact, but it is not a good normative representation of the conceptual model.

It is useful operationally, but it mixes too many concerns to serve as a clear, strongly typed serialization target for the current specification.

## Strengths

- It is practical for existing systems.
- It combines metadata, validation, UI information, and linked-data context in one place.
- It likely reflects real product and repository needs.
- It is a useful compatibility and migration source.

## Problems

### Mixed Concerns

The serialization combines:

- conceptual artifact structure
- UI and acquisition settings
- JSON Schema machinery
- JSON-LD context
- provenance and repository metadata

This makes the boundary between model content and implementation content unclear.

### Weak Typing

Important distinctions are spread across loose sections such as `_valueConstraints` and `_ui` rather than being represented through a single coherent typed structure.

### Semantic Versus Presentation Blur

Semantic distinctions and presentational distinctions are not consistently separated.

Temporal modeling is the clearest example:

- semantic type may appear in one place
- acquisition/display behavior may appear in another

This encourages ambiguity and cross-field dependency.

### Implementation Leakage

JSON Schema-specific members and framework-specific packaging details are mixed directly into the same object as the conceptual artifact.

## Implications for a Future Serialization

A future serialization should be derived from the conceptual model rather than from accumulated implementation structure.

In particular, it should separate:

- conceptual structure
- rendering hints
- validation framework machinery
- linked-data framework packaging

The current structural specification is useful precisely because it makes these separations explicit.

## Working View

The legacy serialization should be treated as:

- a legacy implementation format
- a compatibility source
- a migration input

It should not be treated as:

- the conceptual model
- the normative serialization of that model

## Open Questions

- Which parts of the legacy serialization should be preserved in a future concrete syntax?
- Which parts should move to serialization-specific layers rather than remain in the conceptual artifact representation?
- Should a future concrete syntax support a clean mapping from the legacy form for migration purposes?
