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

Production names use `UpperCamelCase`.

Abstract constructor forms use `lower_snake_case`.

For example, in the production

```bnf
Template ::= template(
               SchemaArtifactMetadata
               EmbeddedArtifact*
             )
```

`Template` is the production being defined, while `template(...)` denotes the abstract constructor form of that construct.

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

`NumericLiteral`, `DateLiteral`, `TimeLiteral`, and `DateTimeLiteral` use more specific datatype-IRI categories.

`LangStringLiteral` consists of lexical content together with a language tag.

The normative structure and semantics of literals are defined in the `Literals` section of [grammar.md](/Users/matthewhorridge/IdeaProjects/cedar-structural-spec/spec/grammar.md).

## Open Questions

- Should the specification later introduce a distinct notation for semantic constraints that are not structural productions?
