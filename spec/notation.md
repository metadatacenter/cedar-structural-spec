# Notation

This specification uses an abstract BNF-style notation to describe structure.

The grammar defines abstract structure only. It does not define a concrete syntax such as JSON or YAML.

## Production Notation

The following notation is used:

```bnf
::=   defined as
|     alternative production
X*    zero or more occurrences of X
X+    one or more occurrences of X
[X]   optional occurrence of X
```

Whitespace separates symbols within a production.

Parentheses group the components of an abstract construct.

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

`Literal` denotes an abstract lexical value in the grammar.

`Literal` is not a concrete serialization token. It represents lexical content only.

Language and datatype information are represented by the enclosing value construct when needed. For example, `TextValue` may carry `LanguageTag`, while `NumericValue` and `TemporalValue` may carry `DatatypeIRI`.

## Open Questions

- Should the specification later introduce a distinct notation for semantic constraints that are not structural productions?
