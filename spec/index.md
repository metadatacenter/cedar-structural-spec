# CEDAR Template Model Specification

This specification defines the abstract structural model for the CEDAR Template Model.

It is written as a standards-style description of the model rather than a concrete serialization format. The specification separates schema definition, presentation structure, reusable artifacts, contextual embedding, and instance data.

The core concepts are `Artifact`, `SchemaArtifact`, `Template`, `Field`, `PresentationComponent`, `EmbeddedArtifact`, `TemplateInstance`, and `InstanceValue`.

## Scope

This specification defines:

- the core metamodel
- the abstract grammar
- artifact metadata and provenance
- the field type system
- the presentation component model
- the instance model
- validation and well-formedness conditions

This specification does not define:

- a JSON syntax
- a YAML syntax
- a storage format
- a transport format

## Document Structure

- [notation.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/notation.md) defines the notation conventions used throughout the specification.
- [metamodel.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/metamodel.md) defines the core artifacts and their relationships.
- [grammar.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/grammar.md) gives the abstract BNF-style grammar.
- [field-types.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/field-types.md) defines `FieldType` and related constraints.
- [presentation.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/presentation.md) defines `PresentationComponent`.
- [instances.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/instances.md) defines `TemplateInstance` and `InstanceValue`.
- [validation.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/validation.md) defines well-formedness and validation rules.

## Core Design Principles

- Schema definition MUST be separated from instance data.
- Semantic structure MUST be separated from presentation.
- Templates MUST contain embedded artifacts rather than directly containing `Field`, `Template`, or `PresentationComponent`.
- `PresentationComponent` MUST NOT contribute instance values.
- Terminology MUST remain stable across this specification.

## Open Questions

- Should instance structures eventually allow path-based keys in addition to `EmbeddedArtifactKey`?
- Should option sets for some `FieldType` variants become reusable artifacts?
