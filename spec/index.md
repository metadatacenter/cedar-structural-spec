# CEDAR Template Model Specification

This specification defines the structural model for the CEDAR Template Model and its concrete JSON wire form.

It separates schema definition, presentation structure, reusable artifacts, contextual embedding, and instance data, and is layered as an abstract grammar paired with a JSON wire grammar, encoding rules, host-language bindings, and a normative validation algorithm.

The core concepts are `Artifact`, `SchemaArtifact`, `Template`, `Field`, `PresentationComponent`, `EmbeddedArtifact`, `TemplateInstance`, and `InstanceEntry`. Every concrete artifact carries a top-level `ModelVersion` identifying the version of the CEDAR structural model it conforms to.

## Scope

This specification defines:

- the core metamodel and abstract grammar
- artifact metadata, identity, lifecycle, and versioning
- the field-spec system (twenty concrete field families)
- the presentation-component model
- the instance model
- the JSON wire form (encoding rules, kind discriminator, wrapper collapse, property-name map)
- encoding and decoding semantics, including a normative error model
- a canonical validation algorithm with explicit error reports
- host-language binding idioms for TypeScript, Java, and Python
- a derived RDF projection of `Value` instances
- a cross-language conformance test suite

## Document Structure

- [notation.md](notation.md) — notation conventions used throughout the specification.
- [metamodel.md](metamodel.md) — conceptual overview: principal categories, the field hierarchy, the layered specification, and cross-cutting conventions.
- [grammar.md](grammar.md) — the abstract EBNF-style grammar, including the `FieldSpec` system, defaults, primitive lexical-form productions, and related constraints.
- [wire-grammar.md](wire-grammar.md) — the JSON wire grammar: kind rule, wrapper collapse, encoding rules, and the property-name map for every production.
- [serialization.md](serialization.md) — encoding and decoding semantics: round-tripping, the wrapping principle, the error model, and worked examples.
- [bindings.md](bindings.md) — host-language idioms (TypeScript, Java, Python) and codebase-organisation guidance.
- [validation.md](validation.md) — the canonical validation algorithm, with per-step error reports.
- [presentation.md](presentation.md) — the `PresentationComponent` family.
- [instances.md](instances.md) — `TemplateInstance` and `InstanceEntry` semantics, including the explicit "defaults are not part of instances" rule.
- [rdf-projection.md](rdf-projection.md) — the derived projection from CEDAR `Value` instances to RDF.
- [index-of-productions.md](index-of-productions.md) — auto-generated A–Z index of every production in the specification.

A cross-language [conformance test suite](normative-tests/README.md) accompanies the specification: 114 fixtures (91 valid round-trip cases, 23 invalid cases with expected-error reports) embedded into `serialization.md` §8 and intended as a binding-acceptance contract.

## Core Design Principles

- Schema definition MUST be separated from instance data.
- Semantic structure MUST be separated from presentation.
- Templates MUST contain embedded artifacts rather than directly containing `Field`, `Template`, or `PresentationComponent`.
- `PresentationComponent` MUST NOT contribute instance values.
- Defaults are UI/UX initialisation only and never appear in `TemplateInstance` artifacts or in the RDF projection.
- Terminology MUST remain stable across this specification.

## Open Questions

- Are the `Name`, `Description`, `PreferredLabel`, and `AlternativeLabel` properties on `ArtifactMetadata` all pulling their weight, or is there redundancy worth simplifying? See [issue #2](https://github.com/metadatacenter/cedar-structural-spec/issues/2).
- Should instance structures eventually allow path-based keys in addition to `EmbeddedArtifactKey`?
- Should option sets for some `FieldSpec` variants become reusable artifacts?
