# Notation

This specification uses the terminology and naming conventions that are shared across the rest of the specification.

The production notation for the abstract grammar is defined in `spec/grammar.md`.

## Conformance Language

The words MUST, MUST NOT, SHOULD, and MAY are used to express normative requirements when appropriate.

## Naming Conventions

Defined terms use the terminology in this specification exactly. In particular, the following terms are normative and stable.

Schema and artifact terms:

- `Artifact`
- `SchemaArtifact`
- `Template`
- `Field`
- `PresentationComponent`

Embedding terms:

- `EmbeddedArtifact`
- `EmbeddedField`
- `EmbeddedTemplate`
- `EmbeddedPresentationComponent`
- `EmbeddedArtifactKey`

Instance terms:

- `TemplateInstance`
- `InstanceValue`
- `FieldValue`
- `NestedTemplateInstance`

Typing terms:

- `FieldSpec`

## Value Notation

`Value` denotes an instance-level data value in the grammar.

Each `Value` family carries its content directly: a `LexicalForm`, an optional `LanguageTag`, an explicit datatype IRI (where one is configurable), or a boolean payload, depending on the family. There is no separate RDF-`Literal` layer in the abstract grammar; an RDF projection is defined separately in [rdf-projection.md](rdf-projection.md).

The normative structure and semantics of values are defined in the `Values` section of [grammar.md](grammar.md).

