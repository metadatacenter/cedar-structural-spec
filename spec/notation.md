# Notation

This specification uses the terminology and naming conventions that are shared across the rest of the specification.

The production notation for the abstract grammar is defined in `spec/grammar.md`.

## Conformance Language

The words MUST, MUST NOT, SHOULD, and MAY are used to express normative requirements when appropriate.

## Naming Conventions

Defined terms use the terminology in this specification exactly. In particular, the following terms are normative and stable:

- `Artifact`
- `SchemaArtifact`
- `Template`
- `Field`
- `PresentationComponent`
- `EmbeddedArtifact`
- `EmbeddedField`
- `EmbeddedTemplate`
- `EmbeddedPresentationComponent`
- `TemplateInstance`
- `InstanceValue`
- `FieldValue`
- `NestedTemplateInstance`
- `EmbeddedArtifactKey`
- `FieldType`

## Literal Notation

`Literal` denotes an RDF literal in the grammar.

The grammar distinguishes `DatatypeIriLiteral` and `LangStringLiteral` explicitly.

`DatatypeIriLiteral` consists of lexical content together with a datatype IRI.

`NumericLiteral`, `YearLiteral`, `YearMonthLiteral`, `FullDateLiteral`, `TimeLiteral`, and `DateTimeLiteral` use more specific datatype-Iri categories.

`LangStringLiteral` consists of lexical content together with a language tag.

The normative structure and semantics of literals are defined in the `Literals` section of [grammar.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/grammar.md).

