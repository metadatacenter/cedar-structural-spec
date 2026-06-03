# Validation

## Overview

Validation in the CEDAR Template Model consists of structural conformance to the abstract grammar and satisfaction of well-formedness conditions that are not expressed directly in grammar productions. The [Canonical Validation Algorithm](#canonical-validation-algorithm) section defines a two-phase procedural algorithm that operationalises all normative rules in this document.

## Contents

- [Relationship to the wire-form error model](#relationship-to-the-wire-form-error-model)
- [Well-Formedness Conditions](#well-formedness-conditions)
  - [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness)
  - [Embedding References](#embedding-references)
  - [Alternative Prompts](#alternative-prompts)
  - [Sections](#sections)
  - [Editability](#editability)
  - [Cardinality Consistency](#cardinality-consistency)
  - [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity)
  - [Versioning](#versioning)
  - [Instance Alignment](#instance-alignment)
  - [Field Spec Compatibility](#field-spec-compatibility)
  - [Rendering Hint Compatibility](#rendering-hint-compatibility)
  - [Controlled Term Value Structure](#controlled-term-value-structure)
- [Canonical Validation Algorithm](#canonical-validation-algorithm)
  - [Reporting errors](#reporting-errors)
  - [External resolution](#external-resolution)
  - [Lexical-form precision](#lexical-form-precision)
  - [Phase 1: Schema Validation](#phase-1-schema-validation)
  - [Phase 2: Instance Validation](#phase-2-instance-validation)
  - [Out of Scope](#out-of-scope)
- [Open Questions](#open-questions)

## Relationship to the wire-form error model

This document and [`serialization.md` §9](serialization.md#9-errors) describe two complementary layers of conformance checking:

- The wire-form **error model** (`serialization.md` §9) governs decoder and encoder behaviour at the JSON boundary. It defines three error categories (`wireShape`, `lexical`, `structural`) and a JSON-pointer-based path format for locating each error.
- This **validation algorithm** governs post-decode checking on in-memory values. It assumes a successful decode has already produced syntactically well-formed structures and verifies the cross-cutting rules that bind those structures together (key uniqueness, cardinality, instance alignment, field-spec compatibility, and so on).

The two layers overlap in scope: many of the structural-invariant constraints listed in §9.1 are also Phase 1 checks here, because a conforming decoder operating in collected mode applies them at decode time. Implementations MAY perform validation entirely at decode (folding Phase 1 into the decoder) or entirely after decode (running Phase 1 as a separate pass). Either approach is conforming.

When this document refers to a constraint that is also enumerated in `serialization.md` §9.1, the wire-form error category and path semantics from §9 apply. Reported errors SHOULD use the four-field shape from §9.3 (`category`, `path`, `production`, `message`).

## Well-Formedness Conditions

The conditions below are organised by structural concern. Each subsection corresponds to one of the §9.1 categories — primarily *structural-invariant* (cross-position constraints that the grammar alone cannot express) but with a few *lexical* constraints (regex-based well-formedness of pinned primitive types) called out where they are most natural to state.

### EmbeddedArtifactKey Uniqueness

Within a single `Template`, each `EmbeddedArtifact` MUST have a unique `EmbeddedArtifactKey`. The constraint is scoped to one template's member tree: keys MUST be pairwise distinct across every `EmbeddedArtifact` reachable from the template's `members`, **recursing into [`Section`](grammar.md#sections) bodies** — not merely among immediate siblings. Sections group members but introduce no key scope of their own; two embedded artifacts in different sections of the same template still share one key space. This template-global scope is what makes instance matching unambiguous, since a `TemplateInstance` records values keyed only by `EmbeddedArtifactKey` with no record of section membership.

The constraint does not extend across nested template boundaries. An embedded template MAY contain `EmbeddedArtifactKey` values identical to keys used in its containing template, because each template defines its own local key space.

Each `EmbeddedArtifactKey` MUST conform to the `AsciiIdentifier` lexical form (per [grammar.md](grammar.md#primitive-string-types)) — the regular expression `^[A-Za-z][A-Za-z0-9_-]*$`.

### Embedding References

Each `EmbeddedField` MUST reference a `Field`.

Each `EmbeddedTemplate` MUST reference a `Template`.

Each `EmbeddedPresentationComponent` MUST reference a `PresentationComponent`.

### Alternative Prompts

These rules govern the curated alternative prompt wordings introduced by [grammar.md §Alternative Prompts](grammar.md#alternative-prompts).

Within a single `Field`'s `AlternativePrompt*` slot, the `PromptKey` components MUST be unique: no two `AlternativePrompt` entries on the same field may share the same key.

Each `PromptKey` MUST conform to the `AsciiIdentifier` lexical form (per [grammar.md](grammar.md#primitive-string-types)) — the regular expression `^[A-Za-z][A-Za-z0-9_-]*$`.

When an `EmbeddedField` carries a `PromptKey`, that key MUST equal the `PromptKey` component of one `AlternativePrompt` in the referenced `Field`'s `AlternativePrompt*` slot. A `PromptKey` that matches none of the referenced field's curated alternatives is a validation error. (This is a closed-set membership check against the *referenced field*, so it is only performed when a resolver is available, in the same manner as the embedding-reference checks.)

An `EmbeddedField` MUST NOT carry both a `PromptKey` and a `PromptOverride`. The two slots express contradictory intents — selecting a sanctioned wording from the curated set versus overriding with a free-form wording — and only one may be present at a given embedding site. This check is purely structural and does not require a resolver.

### Sections

These rules govern the [`Section`](grammar.md#sections) grouping member.

Each `Section` MUST carry a `Label`. Standard `MultilingualString` well-formedness rules apply to it (and to the optional `Description`).

A `Section`'s body MAY be empty. There is no "at least one member" rule — authoring tools commonly create empty sections as scaffolding.

The grammar imposes no nesting-depth limit on sections; the canonical algorithm enforces none. Renderers MAY impose their own limits.

The template-global scope of [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness) is the rule that makes section nesting safe for instance matching; it is stated there rather than repeated here.

### Editability

This rule governs the [`Editability`](grammar.md#editability) slot on an `EmbeddedField`.

An `EmbeddedField` whose `Editability` is `"readOnly"` and whose `ValueRequirement` is `"required"` MUST have a default value available — either an embedding-level `defaultValue` on the `EmbeddedField`, or a field-level default on the referenced `Field`'s `FieldSpec`. Otherwise the embedding is unsatisfiable: a required field must hold a value, but a read-only field cannot receive one from the user, and with no default there is no value to stand in. This is a hard structural error.

The rule is scoped to `"required"`. `"recommended"` and `"optional"` embeddings impose no presence obligation (a `"readOnly"` recommended/optional field with no default is simply a field that renders empty and stays empty), so they are unaffected.

Checking the *field-level* default requires resolving `EmbeddedField.artifactRef`; when no resolver is available the check is performed against the embedding-level `defaultValue` only, in the same manner as the other resolver-gated checks.

### Cardinality Consistency

If an embedding defines minimum and maximum cardinality, the minimum cardinality MUST NOT exceed the maximum cardinality.

`ValueRequirement` and `Cardinality` are orthogonal: `ValueRequirement` governs whether any values must be supplied at all; `Cardinality` governs the permitted count if values are supplied.

If an embedding is marked `"required"`, its minimum cardinality MUST be at least one. For `EmbeddedTemplate`, this means at least one `NestedTemplateInstance` keyed to that embedding MUST be present in the `TemplateInstance`.

If an embedding is marked `"recommended"`, absence of a value MUST NOT by itself cause conformance failure, though implementations MAY issue warnings or other authoring guidance.

If an embedding is marked `"optional"`, absence of a value MUST NOT by itself cause conformance failure.

If values are present for a `"recommended"` or `"optional"` embedding, their count MUST satisfy the `Cardinality` constraints of that embedding.

### Cardinality Defaults and Multiplicity

When `Cardinality` is absent from an `EmbeddedArtifact`, the implied default cardinality is `min_cardinality(1)` with `max_cardinality(1)`: the embedded artifact MUST appear exactly once.

An `EmbeddedField` is **single-valued** if its effective maximum cardinality is `max_cardinality(1)`.

An `EmbeddedField` is **multi-valued** if its effective maximum cardinality is greater than one or is `UnboundedCardinality`.

### Versioning

`Version` and `ModelVersion` MUST conform to the `SemanticVersion` lexical form (per [grammar.md](grammar.md#primitive-string-types)) — Semantic Versioning 2.0.0.

`ModelVersion` is a top-level component of every concrete `Artifact` (every `Template`, `TemplateInstance`, every `Field`, and every `PresentationComponent`); it is not a component of `SchemaArtifactVersioning`.

`Status` MUST be either `draft` or `published`.

`SchemaArtifactVersioning.previousVersion` and `SchemaArtifactVersioning.derivedFrom`, when both present on the same artifact, MUST NOT carry the same IRI value (per [grammar.md §Schema Artifact Versioning](grammar.md#schema-artifact-versioning)).

### Instance Alignment

Each `FieldValue` in a `TemplateInstance` MUST reference the `EmbeddedArtifactKey` of an `EmbeddedField` in the referenced `Template`.

Each `NestedTemplateInstance` in a `TemplateInstance` MUST reference the `EmbeddedArtifactKey` of an `EmbeddedTemplate` in the referenced `Template`.

`TemplateInstance` MUST NOT contain an `InstanceValue` for an `EmbeddedPresentationComponent`.

### Field Spec Compatibility

Values in a `FieldValue` MUST satisfy the `FieldSpec` and any field-spec-specific properties of the referenced `Field`.

The contained values MUST follow the `FieldSpec`-to-`Value` correspondence defined in [`grammar.md`](grammar.md):

| FieldSpec | Required Value type |
|---|---|
| `TextFieldSpec` | `TextValue` |
| `IntegerNumberFieldSpec` | `IntegerNumberValue` |
| `RealNumberFieldSpec` | `RealNumberValue` |
| `BooleanFieldSpec` | `BooleanValue` |
| `DateFieldSpec` | `DateValue` (`YearValue` / `YearMonthValue` / `FullDateValue` per `dateValueType`) |
| `TimeFieldSpec` | `TimeValue` |
| `DateTimeFieldSpec` | `DateTimeValue` |
| `ControlledTermFieldSpec` | `ControlledTermValue` |
| `SingleValuedEnumFieldSpec` / `MultiValuedEnumFieldSpec` | `EnumValue` |
| `LinkFieldSpec` | `LinkValue` |
| `EmailFieldSpec` | `EmailValue` |
| `PhoneNumberFieldSpec` | `PhoneNumberValue` |
| `OrcidFieldSpec` | `OrcidValue` |
| `RorFieldSpec` | `RorValue` |
| `DoiFieldSpec` | `DoiValue` |
| `PubMedIdFieldSpec` | `PubMedIdValue` |
| `RridFieldSpec` | `RridValue` |
| `NihGrantIdFieldSpec` | `NihGrantIdValue` |
| `LanguageFieldSpec` | `LanguageValue` |
| `AttributeValueFieldSpec` | `AttributeValue` |

Additional well-formedness conditions apply per family, as described below.

For text values:

- `TextValue` MUST carry a lexical form; it MAY carry a language tag
- `TextFieldSpec.defaultValue`, if present, MUST be a `TextValue`
- if both `MinLength` and `MaxLength` are present, `MinLength` MUST NOT exceed `MaxLength`
- if `MinLength` is present, each `TextValue` lexical form MUST have length greater than or equal to that minimum
- if `MaxLength` is present, each `TextValue` lexical form MUST have length less than or equal to that maximum
- if `ValidationRegex` is present, each `TextValue` lexical form MUST match that regular expression
- `TextFieldSpec.defaultValue`, if present, MUST satisfy any defined `MinLength`, `MaxLength`, and `ValidationRegex`
- `TextValue` lexical forms SHOULD be in Unicode Normalization Form C
- when present, `TextValue.lang` MUST be non-empty and well-formed according to BCP 47
- if `LangTagRequirement` is `"langTagRequired"`, each `TextValue` MUST carry a `lang` slot
- if `LangTagRequirement` is `"langTagForbidden"`, each `TextValue` MUST NOT carry a `lang` slot
- `TextFieldSpec.defaultValue`, if present, MUST satisfy any defined `LangTagRequirement`

For integer-number values:

- `IntegerNumberValue` MUST carry a base-10 integer lexical form; its datatype is implicitly `xsd:integer`
- if both `IntegerNumberMinValue` and `IntegerNumberMaxValue` are present on the field spec, `IntegerNumberMinValue` MUST NOT exceed `IntegerNumberMaxValue`
- if `IntegerNumberMinValue` is present, each `IntegerNumberValue` MUST be greater than or equal to that minimum
- if `IntegerNumberMaxValue` is present, each `IntegerNumberValue` MUST be less than or equal to that maximum

For real-number values:

- `RealNumberValue` MUST carry a real-valued lexical form together with a `RealNumberDatatypeKind` (one of `decimal`, `float`, or `double`)
- a `RealNumberValue`'s datatype MUST equal the `datatype` declared on the enclosing `RealNumberFieldSpec`
- if both `RealNumberMinValue` and `RealNumberMaxValue` are present on the field spec, `RealNumberMinValue` MUST NOT exceed `RealNumberMaxValue`
- if `RealNumberMinValue` is present, each `RealNumberValue` MUST be greater than or equal to that minimum
- if `RealNumberMaxValue` is present, each `RealNumberValue` MUST be less than or equal to that maximum

For boolean values:

- `BooleanValue` MUST carry a boolean payload; its datatype is implicitly `xsd:boolean`

For date values:

- `DateFieldSpec` with `dateValueType: "year"` MUST use `YearValue`, whose lexical form MUST match the pattern `YYYY` (a four-digit Gregorian year)
- `DateFieldSpec` with `dateValueType: "yearMonth"` MUST use `YearMonthValue`, whose lexical form MUST match the pattern `YYYY-MM` (with month in `01`–`12`)
- `DateFieldSpec` with `dateValueType: "fullDate"` MUST use `FullDateValue`, whose lexical form MUST be a well-formed `xsd:date` lexical form (`YYYY-MM-DD` with optional zone offset)
- `DateFieldSpec.defaultValue`, if present, MUST carry a `DateValue` arm consistent with `dateValueType` — `dateValueType: "year"` admits only `YearValue`, `dateValueType: "yearMonth"` admits only `YearMonthValue`, `dateValueType: "fullDate"` admits only `FullDateValue`. The same constraint applies to `EmbeddedDateField.defaultValue`.

For time values:

- `TimeValue` MUST carry a well-formed `xsd:time` lexical form
- `TimeFieldSpec` values MUST conform to any stated `TimePrecision`

For date-time values:

- `DateTimeValue` MUST carry a well-formed `xsd:dateTime` lexical form
- `DateTimeFieldSpec` values MUST conform to the stated `DateTimeValueType`

For enum values:

- A `FieldValue` for a `SingleValuedEnumFieldSpec` MUST contain exactly one `EnumValue`
- A `FieldValue` for a `MultiValuedEnumFieldSpec` MUST contain one or more `EnumValue` constructs (subject to the `Cardinality` of the embedding)
- Each `EnumValue.value` (a `Token`) MUST equal the canonical `Token` of one of the referenced spec's `PermissibleValue` entries
- The `Token` strings of an `EnumFieldSpec`'s `PermissibleValue+` MUST be unique within that spec
- `SingleValuedEnumFieldSpec.defaultValue`, if present, MUST be an `EnumValue` whose `value` equals the `Token` of one of its `PermissibleValue` entries
- `MultiValuedEnumFieldSpec.defaultValues`, if present, MUST be a (possibly empty) list of `EnumValue` constructs each whose `value` equals the `Token` of one of its `PermissibleValue` entries; the list MUST NOT contain duplicate `value` entries

An `EnumValue` matches a `PermissibleValue` if and only if the value's `Token` string equals the permissible value's `Token` string (compared character by character).

For controlled-term values:

- `ControlledTermValue` MUST include a term identifier and SHOULD include a human-readable label

For contact values:

- `EmailValue` MUST carry a non-empty lexical form
- `PhoneNumberValue` MUST carry a non-empty lexical form

For external authority values:

- `OrcidValue` MUST include an `OrcidIri`
- `RorValue` MUST include a `RorIri`
- `DoiValue` MUST include a `DoiIri`
- `PubMedIdValue` MUST include a `PubMedIri`
- `RridValue` MUST include an `RridIri`
- `NihGrantIdValue` MUST include a `NihGrantIri`
- these values MAY additionally include a human-readable `Label`

For language values:

- `LanguageValue` MUST carry a `LanguageTag` that is well-formed according to BCP 47 (RFC 5646)
- when a `LanguageFieldSpec` carries `PermittedLanguages`, every `LanguageValue` carried by an instance of that field — and any default value carried at either layer — MUST have a tag that appears verbatim in `PermittedLanguages` (exact match, no pattern matching or BCP 47 lookup/filtering)
- `PermittedLanguages`, when present, MUST be a non-empty list
- the entries of `PermittedLanguages` MUST themselves each be well-formed BCP 47 tags

For string-bearing values generally:

- lexical forms MUST be in Unicode Normalization Form C (per [`serialization.md` §4.5](serialization.md#45-string-values))
- when present, language tags MUST conform to the `Bcp47Tag` lexical form (per [grammar.md](grammar.md#primitive-string-types) — RFC 5646)

For default values (both layers):

The model carries default values at two layers, and validation rules apply uniformly across the two:

- A *field-level default* lives on the reusable `Field`'s `FieldSpec` (`XxxFieldSpec.defaultValue`), shared by every Template that embeds the field. Every concrete `XxxFieldSpec` except `AttributeValueFieldSpec` admits an optional default.
- An *embedding-level default* lives on the `EmbeddedXxxField` inside a Template (`EmbeddedXxxField.defaultValue`), specific to that one embedding.

The well-formedness conditions:

- A default value, at either layer, MUST be the family-specific `Value` type as given in [grammar.md](grammar.md#defaults).
- A default MUST satisfy every well-formedness condition that a corresponding `FieldValue` would satisfy for the same `FieldSpec` (length bounds, numeric bounds, datatype consistency, lexical-form constraints, and so on).
- Enum defaults at either layer MUST be `EnumValue` constructs (single for `SingleValuedEnumField`/`Spec`, a possibly-empty list for `MultiValuedEnumField`/`Spec`) whose `value` equals the `Token` of one of the spec's `PermissibleValue` entries; the multi-valued list MUST NOT contain duplicate `value` entries.
- When both a field-level and an embedding-level default are present for the same field, the embedding-level default takes precedence (see [grammar.md](grammar.md#defaults)).
- `AttributeValueFieldSpec` and `EmbeddedAttributeValueField` carry no defaults at either layer.

For multiplicity:

- if an `EmbeddedField` is single-valued, its corresponding `FieldValue` MUST NOT contain more than one value
- if an `EmbeddedField` is multi-valued, the number of values in its `FieldValue` MUST satisfy the embedding cardinality constraints
- if an `EmbeddedTemplate` has multiplicity greater than one, the number of corresponding `NestedTemplateInstance` constructs MUST satisfy the embedding cardinality constraints


### Rendering Hint Compatibility

Any rendering hint used by the model MUST be compatible with the associated `FieldSpec`:

| Rendering hint | Permitted on |
|---|---|
| `TextRenderingHint` | `TextFieldSpec` |
| `SingleValuedEnumRenderingHint` | `SingleValuedEnumFieldSpec` |
| `MultiValuedEnumRenderingHint` | `MultiValuedEnumFieldSpec` |
| `BooleanRenderingHint` | `BooleanFieldSpec` |
| `NumericRenderingHint` | `IntegerNumberFieldSpec`, `RealNumberFieldSpec` |
| `DateRenderingHint` | `DateFieldSpec` |
| `TimeRenderingHint` | `TimeFieldSpec` |
| `DateTimeRenderingHint` | `DateTimeFieldSpec` |

### Controlled Term Value Structure

If a value conforms to `ControlledTermFieldSpec`, the value MUST include a term identifier and SHOULD include a human-readable label.

A `ControlledTermFieldSpec.defaultValue` or `EmbeddedControlledTermField.defaultValue`, if present, SHOULD identify a term drawn from one of the declared `ControlledTermSource` entries of the referenced `ControlledTermFieldSpec`. Verifying source membership requires resolving the `TermIri` against an external ontology and is outside the scope of the canonical algorithm; see [Out of Scope](#out-of-scope).

## Canonical Validation Algorithm

The canonical validation algorithm consists of two phases that MUST be applied in order. **Phase 1** validates the well-formedness of a `Template` and the artifacts it references. **Phase 2** validates that a `TemplateInstance` conforms to a well-formed `Template`. Phase 2 MUST NOT be applied unless Phase 1 has passed without error.

Both phases are defined as error-collecting: all violations MUST be reported rather than stopping at the first failure. Implementations MAY additionally offer a fail-fast mode for performance, but the set of errors reported MUST be a subset of those that the collecting mode would report.

The algorithm is expressed as a set of named subroutines. Each subroutine takes typed inputs and produces a (possibly empty) set of errors. `Verify` denotes a hard constraint: failure produces an error. `Warn` denotes a SHOULD constraint: failure produces a warning. The notation `count(X)` denotes the number of elements of kind `X`, and `len(s)` denotes the length in characters of string `s`.

#### Reporting errors

Every `Verify` step in the algorithm has an associated **error report** that a conforming binding MUST surface on failure. Every `Warn` step has an associated **warning report**. Each step states its report inline as an *On failure:* line directly under the step.

Each report uses the four-field shape from [`serialization.md` §9.3](serialization.md#93-error-report-shape):

- **`category`** — one of `wireShape`, `lexical`, or `structural`. Most validation reports are `structural` (cross-position constraint); a few are `lexical` (regex / well-formedness of a primitive type).
- **`path`** — a JSON Pointer locating the offending slot in the wire form being validated.
- **`production`** — the wire-grammar production at the path.
- **`message`** — a human-readable explanation. The wording given in this document is recommended; bindings MAY use different text and SHOULD include enough detail to support diagnosis.

**Path conventions.** Subroutines describe paths *relative to their input*, using a placeholder for the input and slot accessors after slashes:

- `<input>` — the subroutine's input parameter, e.g. `<embedded>`, `<template>`, `<fieldSpec>`.
- `<input>/slotName` — a property slot.
- `<input>/arrayName/<i>` — an element of an array (with `<i>` an index variable).
- `<input>/arrayName/<i>/inner` — a nested slot inside the i-th element.

The caller of a subroutine substitutes the placeholder for the actual JSON Pointer of its input. For example, when [`validate_cardinality_consistency`](#fn-validate-cardinality-consistency) runs against `template.members[2]`, an error reported at `<embedded>/cardinality/min` becomes `/members/2/cardinality/min` in the surfaced report.

When a subroutine `S₁` calls another subroutine `S₂` and `S₂` reports an error at path `<S₂.input>/foo`, the surfaced path is `<S₁.input>/<path-to-S₂.input>/foo`. Each layer prepends its own input path. For example, [`validate_default_value`](#fn-validate-default-value) calls a family-specific value-validator with the default value as input; an error from the inner validator at `<value>/value` is surfaced at `<embedded>/defaultValue/value`.

Warning reports follow the same shape but are emitted through the binding's warning channel rather than its error channel.

#### External resolution

Several `Verify` steps require resolving an artifact-reference IRI to its definition — for example, [`validate_embedding_reference`](#fn-validate-embedding-reference) verifies that `embedded.artifactRef` "identifies an existing `<Family>Field`". Resolution is **outside the scope** of this specification. A conforming validator is given an external resolver function

> `resolve(iri: Iri) → Artifact | null`

that returns the artifact referenced by an IRI, or `null` if no such artifact is known. The validator MUST use this resolver to resolve every `EmbeddedField.artifactRef`, every `EmbeddedTemplate.artifactRef`, every `EmbeddedPresentationComponent.artifactRef`, and every `TemplateInstance.templateRef`.

How the resolver is implemented is a binding concern, not a model concern. Plausible implementations:

- A registry-backed resolver that looks up artifacts in a local catalogue.
- A document-local resolver that finds artifacts inlined in the same input document.
- A network-backed resolver that dereferences HTTP IRIs.

When `resolve(iri)` returns `null`, the surfaced error is:

> `structural` at the relevant `artifactRef` slot, production naming the embedding's family, message `"artifactRef does not resolve to an artifact"`.

When `resolve(iri)` returns an artifact of the wrong family (e.g. a `TextField` is returned for an `EmbeddedDateField.artifactRef`), the surfaced error is the family-mismatch error already documented at [`validate_embedding_reference`](#fn-validate-embedding-reference).

Implementations MAY operate without a resolver — in which case all `Verify <…>identifying an existing <Family>` steps are SKIPPED and any conformance claim must be qualified accordingly. This is a partial-validation mode appropriate for syntactic linting; full conformance requires a resolver.

#### Lexical-form precision

Several `Verify` steps appeal to lexical-form well-formedness for the primitive types pinned in [`grammar.md` §Primitive String Types](grammar.md#primitive-string-types). For interoperability across implementations, the lexical-form predicates resolve as follows:

| Lexical form | Authoritative grammar |
|---|---|
| `SemanticVersion` | The regular expression at [semver.org](https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string). |
| `IriString` | The `IRI` ABNF in [RFC 3987 §2.2](https://www.rfc-editor.org/rfc/rfc3987#section-2.2). The IRI MUST be absolute (carry a scheme). Implementations MAY use a permissive scheme-and-non-whitespace check as a fast pre-filter, but a conforming validator MUST be capable of full RFC 3987 conformance on demand. |
| `Bcp47Tag` | The `Language-Tag` production of [RFC 5646](https://www.rfc-editor.org/rfc/rfc5646). Implementations MAY validate against the IANA Language Subtag Registry; a syntactic-only check is acceptable as a baseline. |
| `IntegerLexicalForm` | Regex `^-?(0\|[1-9][0-9]*)$`. No leading `+`, no leading zeros (other than the literal `0`), no whitespace. Magnitude is unbounded. |
| `AsciiIdentifier` | Regex `^[A-Za-z][A-Za-z0-9_-]*$`. Length is unbounded. |
| `Iso8601DateTimeLexicalForm` | The `dateTime` lexical form from [XML Schema 1.1 Part 2 §3.3.7](https://www.w3.org/TR/xmlschema11-2/#dateTime), extended format. |
| `xsd:date` lexical form | [XML Schema 1.1 Part 2 §3.3.9](https://www.w3.org/TR/xmlschema11-2/#date). |
| `xsd:time` lexical form | [XML Schema 1.1 Part 2 §3.3.8](https://www.w3.org/TR/xmlschema11-2/#time). |
| `xsd:dateTime` lexical form | [XML Schema 1.1 Part 2 §3.3.7](https://www.w3.org/TR/xmlschema11-2/#dateTime). |
| `xsd:decimal` lexical form | [XML Schema 1.1 Part 2 §3.3.3](https://www.w3.org/TR/xmlschema11-2/#decimal). |
| `xsd:float` / `xsd:double` lexical form | [XML Schema 1.1 Part 2 §3.3.6](https://www.w3.org/TR/xmlschema11-2/#float) and [§3.3.5](https://www.w3.org/TR/xmlschema11-2/#double). The special values `INF`, `-INF`, and `NaN` are part of the lexical space. |

A conforming validator MUST treat the cited grammar as authoritative; a value is well-formed if and only if it matches the cited grammar. This pins the predicate so two independently-implemented validators agree on every input.

---

### Phase 1: Schema Validation

#### Entry Point

##### `validate_schema(template: Template)` {#fn-validate-schema}

Entry point for schema validation.

1. Run [`validate_model_version(template.model_version)`](#fn-validate-model-version) and [`validate_schema_artifact_versioning(template.versioning)`](#fn-validate-schema-artifact-versioning).
2. If `template.template_rendering_hint` is present: run [`validate_template_rendering_hint(template.template_rendering_hint)`](#fn-validate-template-rendering-hint).
3. Let `embeddings` = the sequence of `EmbeddedArtifact` constructs obtained by walking `template`'s member tree in document order, recursing into every `Section` body (`Section` constructs are traversed but contribute no embedding). Every step below that iterates "the embedded artifacts" iterates `embeddings`.
4. Let `fields` = the set of `Field` artifacts referenced by the `EmbeddedField` constructs in `embeddings`.
5. For each `field` in `fields`: run [`validate_model_version(field.model_version)`](#fn-validate-model-version), [`validate_schema_artifact_versioning(field.versioning)`](#fn-validate-schema-artifact-versioning), [`validate_field_spec(field.field_spec)`](#fn-validate-field-spec), and [`validate_alternative_prompt_keys(field)`](#fn-validate-alternative-prompt-keys).
6. Let `pcs` = the set of `PresentationComponent` artifacts referenced by the `EmbeddedPresentationComponent` constructs in `embeddings`.
7. For each `component` in `pcs`: run [`validate_model_version(component.model_version)`](#fn-validate-model-version). `PresentationComponent` does not carry `SchemaArtifactVersioning`, so no versioning validation step applies.
8. Run [`validate_embedded_artifact_keys(template)`](#fn-validate-embedded-artifact-keys).
9. For each `embedded` in `embeddings`:
   1. Run [`validate_embedding_reference(embedded)`](#fn-validate-embedding-reference).
   2. Run [`validate_cardinality_consistency(embedded)`](#fn-validate-cardinality-consistency).
   3. If `embedded` is an `EmbeddedField`: run [`validate_prompt_key(embedded)`](#fn-validate-prompt-key), [`validate_editability(embedded)`](#fn-validate-editability), and [`validate_rendering_hints(embedded)`](#fn-validate-rendering-hints).
   4. If `embedded.default_value` is present: run [`validate_default_value(embedded.default_value, embedded)`](#fn-validate-default-value).
   5. If `embedded` is an `EmbeddedTemplate`: run [`validate_schema(embedded.referenced_template)`](#fn-validate-schema).

---

#### Metadata and Key Validation

##### `validate_schema_artifact_versioning(versioning: SchemaArtifactVersioning)` {#fn-validate-schema-artifact-versioning}

Applies the [Versioning](#versioning) rules to the `SchemaArtifactVersioning` slot carried by each schema artifact (`Template`, `Field`). `PresentationComponent` and `TemplateInstance` do not carry `SchemaArtifactVersioning`; this subroutine is not invoked for them.

1. Let `version` = `versioning.version`. Verify `version` conforms to the `SemanticVersion` lexical form (Semantic Versioning 2.0.0).
   *On failure:* `lexical` at `<versioning>/version`, production `SchemaArtifactVersioning`, message `"version is not a valid SemanticVersion 2.0.0 string"`.
2. Let `status` = `versioning.status`. Verify `status ∈ { draft, published }`.
   *On failure:* `wireShape` at `<versioning>/status`, production `SchemaArtifactVersioning`, message `"status must be 'draft' or 'published'"`.
3. If both `versioning.previous_version` and `versioning.derived_from` are present: verify they do not carry the same IRI value.
   *On failure:* `structural` at `<versioning>/derivedFrom`, production `SchemaArtifactVersioning`, message `"previousVersion and derivedFrom MUST NOT carry the same IRI"`.

---

##### `validate_template_rendering_hint(hint: TemplateRenderingHint)` {#fn-validate-template-rendering-hint}

1. If `hint.help_display_mode` is present: verify it is one of `"inline"`, `"tooltip"`, `"both"`, `"none"`.
   *On failure:* `wireShape` at `<hint>/helpDisplayMode`, production `HelpDisplayMode`, message `"unknown HelpDisplayMode value"`.

---

##### `validate_model_version(modelVersion: ModelVersion)` {#fn-validate-model-version}

Applies the [Versioning](#versioning) rules to the artifact-level `ModelVersion` carried directly by every concrete `Artifact`.

1. Verify `modelVersion` conforms to the `SemanticVersion` lexical form (Semantic Versioning 2.0.0).
   *On failure:* `lexical` at `<modelVersion>`, production naming the enclosing artifact (e.g. `TextField`, `Template`), message `"modelVersion is not a valid SemanticVersion 2.0.0 string"`.

---

##### `validate_embedded_artifact_keys(template: Template)` {#fn-validate-embedded-artifact-keys}

Applies the [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness) rules.

1. Let `keys` = the sequence of `EmbeddedArtifactKey` values collected by walking `template`'s member tree in document order, recursing into every `Section` body and collecting the key of each `EmbeddedArtifact` encountered. `Section` constructs contribute no key (they have none) but their bodies are traversed.
2. For each key `k` in `keys`: verify `k` conforms to the `AsciiIdentifier` lexical form (regex `^[A-Za-z][A-Za-z0-9_-]*$`).
   *On failure:* `lexical` at the JSON Pointer of the embedded artifact's `key` (e.g. `<template>/members/<i>/key`, or `<template>/members/<i>/members/<j>/key` for a member nested in a section), production naming the embedded artifact, message `"EmbeddedArtifactKey does not match the AsciiIdentifier pattern"`.
3. Verify all values in `keys` are distinct across the whole tree: for any two distinct embedded artifacts carrying the same key value, report a duplicate-key error. Uniqueness is scoped to `template` as a whole (across all sections); the same key may appear in a nested template without conflict.
   *On failure:* `structural` at the JSON Pointer of the second occurrence's `key`, production `Template`, message `"EmbeddedArtifact.key is not unique within the enclosing Template (also at <first occurrence>)"`.
4. For each `Section` encountered during the walk: verify `Section.label` is present.
   *On failure:* `structural` at the section's `<section>/label`, production `Section`, message `"Section.label is required"`.

---

#### Reference and Cardinality Validation

##### `validate_embedding_reference(embedded: EmbeddedArtifact)` {#fn-validate-embedding-reference}

Applies the [Embedding References](#embedding-references) rules.

Each step below resolves `embedded.artifactRef` via the external resolver `resolve(iri)` (see [External resolution](#external-resolution)) and verifies the resolved artifact's family. If the validator was given no resolver, all steps are SKIPPED.

For each step below, two failure modes are possible:

*On failure (unresolved):* `structural` at `<embedded>/artifactRef`, production naming `embedded`'s family, message `"artifactRef does not resolve to an artifact"`.

*On failure (family mismatch):* `structural` at `<embedded>/artifactRef`, production naming `embedded`'s family, message `"artifactRef resolves to an artifact of the wrong family (expected <Family>, got <ResolvedFamily>)"`.

1. If `embedded` is an `EmbeddedTextField`: verify `embedded.artifactRef` is a `TextFieldId` identifying an existing `TextField`.
2. If `embedded` is an `EmbeddedIntegerNumberField`: verify `embedded.artifactRef` is an `IntegerNumberFieldId` identifying an existing `IntegerNumberField`.
3. If `embedded` is an `EmbeddedRealNumberField`: verify `embedded.artifactRef` is a `RealNumberFieldId` identifying an existing `RealNumberField`.
4. If `embedded` is an `EmbeddedBooleanField`: verify `embedded.artifactRef` is a `BooleanFieldId` identifying an existing `BooleanField`.
5. If `embedded` is an `EmbeddedDateField`: verify `embedded.artifactRef` is a `DateFieldId` identifying an existing `DateField`.
6. If `embedded` is an `EmbeddedTimeField`: verify `embedded.artifactRef` is a `TimeFieldId` identifying an existing `TimeField`.
7. If `embedded` is an `EmbeddedDateTimeField`: verify `embedded.artifactRef` is a `DateTimeFieldId` identifying an existing `DateTimeField`.
8. If `embedded` is an `EmbeddedControlledTermField`: verify `embedded.artifactRef` is a `ControlledTermFieldId` identifying an existing `ControlledTermField`.
9. If `embedded` is an `EmbeddedSingleValuedEnumField`: verify `embedded.artifactRef` is a `SingleValuedEnumFieldId` identifying an existing `SingleValuedEnumField`.
10. If `embedded` is an `EmbeddedMultiValuedEnumField`: verify `embedded.artifactRef` is a `MultiValuedEnumFieldId` identifying an existing `MultiValuedEnumField`.
11. If `embedded` is an `EmbeddedLinkField`: verify `embedded.artifactRef` is a `LinkFieldId` identifying an existing `LinkField`.
12. If `embedded` is an `EmbeddedEmailField`: verify `embedded.artifactRef` is an `EmailFieldId` identifying an existing `EmailField`.
13. If `embedded` is an `EmbeddedPhoneNumberField`: verify `embedded.artifactRef` is a `PhoneNumberFieldId` identifying an existing `PhoneNumberField`.
14. If `embedded` is an `EmbeddedOrcidField`: verify `embedded.artifactRef` is an `OrcidFieldId` identifying an existing `OrcidField`.
15. If `embedded` is an `EmbeddedRorField`: verify `embedded.artifactRef` is a `RorFieldId` identifying an existing `RorField`.
16. If `embedded` is an `EmbeddedDoiField`: verify `embedded.artifactRef` is a `DoiFieldId` identifying an existing `DoiField`.
17. If `embedded` is an `EmbeddedPubMedIdField`: verify `embedded.artifactRef` is a `PubMedIdFieldId` identifying an existing `PubMedIdField`.
18. If `embedded` is an `EmbeddedRridField`: verify `embedded.artifactRef` is an `RridFieldId` identifying an existing `RridField`.
19. If `embedded` is an `EmbeddedNihGrantIdField`: verify `embedded.artifactRef` is a `NihGrantIdFieldId` identifying an existing `NihGrantIdField`.
20. If `embedded` is an `EmbeddedLanguageField`: verify `embedded.artifactRef` is a `LanguageFieldId` identifying an existing `LanguageField`.
21. If `embedded` is an `EmbeddedAttributeValueField`: verify `embedded.artifactRef` is an `AttributeValueFieldId` identifying an existing `AttributeValueField`.
22. If `embedded` is an `EmbeddedTemplate`: verify `embedded.artifactRef` is a `TemplateId` identifying an existing `Template`.
23. If `embedded` is an `EmbeddedPresentationComponent`: verify `embedded.artifactRef` is a `PresentationComponentId` identifying an existing `PresentationComponent`.

---

##### `validate_cardinality_consistency(embedded: EmbeddedArtifact)` {#fn-validate-cardinality-consistency}

Applies the [Cardinality Consistency](#cardinality-consistency) rules.

1. Let `min` = `embedded.cardinality.min_cardinality` if `embedded.cardinality` is present, else `1`.
2. Let `max` = `embedded.cardinality.max_cardinality` if `embedded.cardinality` is present, else `1`. If `max` is `UnboundedCardinality`, let `max = ∞`.
3. Verify `min ≤ max`.
   *On failure:* `structural` at `<embedded>/cardinality`, production `Cardinality`, message `"min must not exceed max"`.
4. Let `req` = `embedded.value_requirement` if present, else `"optional"`.
5. If `req = "required"`: verify `min ≥ 1`.
   *On failure:* `structural` at `<embedded>/cardinality/min`, production `Cardinality`, message `"required embedding must have min cardinality of at least 1"`.

---

##### `validate_alternative_prompt_keys(field: Field)` {#fn-validate-alternative-prompt-keys}

Applies the per-field [Alternative Prompts](#alternative-prompts) rules. If `field.alternative_prompts` is absent or empty, this subroutine is a no-op.

1. For each `AlternativePrompt` `ap` in `field.alternative_prompts`: verify `ap.prompt_key` conforms to the `AsciiIdentifier` lexical form (`^[A-Za-z][A-Za-z0-9_-]*$`).
   *On failure:* `lexical` at `<field>/altPrompts/<i>/key`, production `PromptKey`, message `"PromptKey is not a valid AsciiIdentifier"`.
2. Verify the `prompt_key` values across `field.alternative_prompts` are pairwise distinct.
   *On failure:* `structural` at `<field>/altPrompts`, production `AlternativePrompt`, message `"PromptKey values within a field's altPrompts MUST be unique"`.

---

##### `validate_prompt_key(embedded: EmbeddedField)` {#fn-validate-prompt-key}

Applies the embedding-side [Alternative Prompts](#alternative-prompts) rules.

1. If `embedded.prompt_key` is present and `embedded.prompt_override` is present: report a failure.
   *On failure:* `structural` at `<embedded>/promptKey`, production naming `embedded`'s family, message `"an embedding MUST NOT carry both promptKey and promptOverride"`.
2. If `embedded.prompt_key` is present: resolve `embedded.artifactRef` via `resolve(iri)` (see [External resolution](#external-resolution)). If no resolver is available, SKIP this step. Otherwise verify that `embedded.prompt_key` equals the `prompt_key` of one `AlternativePrompt` in the resolved field's `alternative_prompts`.
   *On failure (no match):* `structural` at `<embedded>/promptKey`, production naming `embedded`'s family, message `"promptKey does not match any AlternativePrompt key on the referenced field"`.

---

##### `validate_editability(embedded: EmbeddedField)` {#fn-validate-editability}

Applies the [Editability](#editability) rule.

1. If `embedded.editability` is not `"readOnly"`, or `embedded.value_requirement` is not `"required"`: this subroutine is a no-op (the rule applies only to read-only required embeddings).
2. If `embedded.default_value` is present: the rule is satisfied (an embedding-level default supplies the value); stop.
3. Resolve `embedded.artifactRef` via `resolve(iri)` (see [External resolution](#external-resolution)). If a resolver is available and the referenced `Field`'s `FieldSpec` carries a field-level default value, the rule is satisfied; stop. If no resolver is available, the field-level default cannot be observed and this step is treated as "no default available".
4. Otherwise report a failure: a read-only required embedding has no default value to satisfy the requirement.
   *On failure:* `structural` at `<embedded>/editability`, production naming `embedded`'s family, message `"a readOnly required embedding MUST carry a defaultValue (none found on the embedding or the referenced field)"`.

---

#### Field Spec Validation

Applies the [Field Spec Compatibility](#field-spec-compatibility) rules. See also [Field Specs](grammar.md#field-specs) in the abstract grammar.

##### `validate_field_spec(fieldSpec: FieldSpec)` {#fn-validate-field-spec}

Dispatch on the kind of `fieldSpec`:

- If `fieldSpec` is `TextFieldSpec`: run [`validate_text_field_spec(fieldSpec)`](#fn-validate-text-field-spec).
- If `fieldSpec` is `IntegerNumberFieldSpec`: run [`validate_integer_number_field_spec(fieldSpec)`](#fn-validate-integer-number-field-spec).
- If `fieldSpec` is `RealNumberFieldSpec`: run [`validate_real_number_field_spec(fieldSpec)`](#fn-validate-real-number-field-spec).
- If `fieldSpec` is `SingleValuedEnumFieldSpec` or `MultiValuedEnumFieldSpec`: run [`validate_enum_field_spec(fieldSpec)`](#fn-validate-enum-field-spec).
- If `fieldSpec` is `LanguageFieldSpec`: run [`validate_language_field_spec(fieldSpec)`](#fn-validate-language-field-spec).
- All other field specs have no additional schema-level well-formedness checks beyond structural grammar conformance.

After the family-specific dispatch, if `fieldSpec.examples` is present and `fieldSpec` is not an `AttributeValueFieldSpec`: run [`validate_examples(fieldSpec)`](#fn-validate-examples).

---

##### `validate_text_field_spec(fieldSpec: TextFieldSpec)` {#fn-validate-text-field-spec}

1. If both `fieldSpec.min_length` and `fieldSpec.max_length` are present: verify `fieldSpec.min_length ≤ fieldSpec.max_length`.
   *On failure:* `structural` at `<fieldSpec>/minLength`, production `TextFieldSpec`, message `"minLength must not exceed maxLength"`.
2. If `fieldSpec.lang_tag_requirement` is present: verify it is one of `"langTagRequired"`, `"langTagOptional"`, `"langTagForbidden"`.
   *On failure:* `wireShape` at `<fieldSpec>/langTagRequirement`, production `LangTagRequirement`, message `"unknown LangTagRequirement value"`.

---

##### `validate_integer_number_field_spec(fieldSpec: IntegerNumberFieldSpec)` {#fn-validate-integer-number-field-spec}

1. If both `fieldSpec.min_value` and `fieldSpec.max_value` are present: verify `fieldSpec.min_value ≤ fieldSpec.max_value`.
   *On failure:* `structural` at `<fieldSpec>/minValue`, production `IntegerNumberFieldSpec`, message `"minValue must not exceed maxValue"`.

---

##### `validate_real_number_field_spec(fieldSpec: RealNumberFieldSpec)` {#fn-validate-real-number-field-spec}

1. If both `fieldSpec.min_value` and `fieldSpec.max_value` are present: verify `fieldSpec.min_value ≤ fieldSpec.max_value`.
   *On failure:* `structural` at `<fieldSpec>/minValue`, production `RealNumberFieldSpec`, message `"minValue must not exceed maxValue"`.

---

##### `validate_enum_field_spec(fieldSpec: EnumFieldSpec)` {#fn-validate-enum-field-spec}

1. Let `tokens` = the sequence of `pv.value` values across all `pv` in `fieldSpec.permissible_values`.
2. Verify all values in `tokens` are distinct: report a duplicate-token error for any pair sharing the same token string.
   *On failure:* `structural` at `<fieldSpec>/permissibleValues/<j>/value` (the second occurrence), production naming `fieldSpec`'s kind, message `"PermissibleValue.value is not unique within the enclosing spec (also at /permissibleValues/<i>/value)"`.
3. For each `pv` in `fieldSpec.permissible_values`: verify `pv.value` is a non-empty Unicode string.
   *On failure:* `wireShape` at `<fieldSpec>/permissibleValues/<i>/value`, production `PermissibleValue`, message `"value must be a non-empty Unicode string"`.
4. For each `pv` in `fieldSpec.permissible_values`, for each `m` in `pv.meanings`: verify `m.iri` is a syntactically valid IRI.
   *On failure:* `lexical` at `<fieldSpec>/permissibleValues/<i>/meanings/<j>/iri`, production `Meaning`, message `"iri is not a valid IRI"`.
5. If `fieldSpec` is a `SingleValuedEnumFieldSpec` and `fieldSpec.default_value` is present: verify `fieldSpec.default_value` is an `EnumValue` and that `fieldSpec.default_value.value ∈ tokens`.
   *On failure:* `structural` at `<fieldSpec>/defaultValue/value`, production `SingleValuedEnumFieldSpec`, message `"defaultValue does not match any of the spec's permissibleValues"`.
6. If `fieldSpec` is a `MultiValuedEnumFieldSpec` and `fieldSpec.default_values` is present:
   1. Verify each entry is an `EnumValue` and that its `value ∈ tokens`.
      *On failure:* `structural` at `<fieldSpec>/defaultValues/<i>/value`, production `MultiValuedEnumFieldSpec`, message `"defaultValues entry does not match any of the spec's permissibleValues"`.
   2. Verify all entries' `value` strings are distinct.
      *On failure:* `structural` at `<fieldSpec>/defaultValues/<j>/value` (the second occurrence), production `MultiValuedEnumFieldSpec`, message `"defaultValues contains duplicate entries (also at /defaultValues/<i>/value)"`.

---

##### `validate_language_field_spec(fieldSpec: LanguageFieldSpec)` {#fn-validate-language-field-spec}

1. If `fieldSpec.permitted_languages` is present: verify that it is a non-empty list.
   *On failure:* `structural` at `<fieldSpec>/permittedLanguages`, production `LanguageFieldSpec`, message `"permittedLanguages, when present, must be a non-empty list"`.
2. If `fieldSpec.permitted_languages` is present: verify that every entry is a well-formed BCP 47 language tag (RFC 5646).
   *On failure:* `lexical` at `<fieldSpec>/permittedLanguages/<i>`, production `LanguageFieldSpec`, message `"permittedLanguages entry is not a well-formed BCP 47 language tag"`.
3. If `fieldSpec.default_value` is present: verify that it is a `LanguageValue` whose `value` is a well-formed BCP 47 language tag.
   *On failure (wireShape):* `wireShape` at `<fieldSpec>/defaultValue`, production `LanguageFieldSpec`, message `"defaultValue must be a LanguageValue"`.
   *On failure (lexical):* `lexical` at `<fieldSpec>/defaultValue/value`, production `LanguageValue`, message `"defaultValue.value is not a well-formed BCP 47 language tag"`.
4. If both `fieldSpec.default_value` and `fieldSpec.permitted_languages` are present: verify `fieldSpec.default_value.value` appears verbatim in `fieldSpec.permitted_languages`.
   *On failure:* `structural` at `<fieldSpec>/defaultValue/value`, production `LanguageFieldSpec`, message `"defaultValue is not in permittedLanguages"`.
5. If `fieldSpec.rendering_hint` is present: verify it is one of `"autocomplete"`, `"dropdown"`, `"radio"`.
   *On failure:* `wireShape` at `<fieldSpec>/renderingHint`, production `LanguageRenderingHint`, message `"unknown LanguageRenderingHint value"`.

---

##### `validate_examples(fieldSpec: FieldSpec)` {#fn-validate-examples}

Applies the example-list well-formedness rules. Run when `fieldSpec.examples` is present and `fieldSpec` is not an `AttributeValueFieldSpec` (which carries no examples by construction).

Let `examples` = `fieldSpec.examples`.

1. For each `example` in `examples`: verify `example` is of the family-specific `Value` type for `fieldSpec`: `TextValue` for `TextFieldSpec`, `IntegerNumberValue` for `IntegerNumberFieldSpec`, `RealNumberValue` for `RealNumberFieldSpec`, `BooleanValue` for `BooleanFieldSpec`, `DateValue` for `DateFieldSpec`, `TimeValue` for `TimeFieldSpec`, `DateTimeValue` for `DateTimeFieldSpec`, `ControlledTermValue` for `ControlledTermFieldSpec`, `EnumValue` for both `SingleValuedEnumFieldSpec` and `MultiValuedEnumFieldSpec`, `LinkValue` for `LinkFieldSpec`, `EmailValue` for `EmailFieldSpec`, `PhoneNumberValue` for `PhoneNumberFieldSpec`, the corresponding external-authority `Value` type for the external-authority field specs, and `LanguageValue` for `LanguageFieldSpec`.
   *On failure:* `wireShape` at `<fieldSpec>/examples/<i>`, production naming `fieldSpec`'s kind, message `"examples entry must be a <FamilyValue> (got <kind>)"`.
2. For each `example` in `examples`: verify it satisfies every constraint the spec imposes on values of its family. The same constraints that govern an instance value or a `defaultValue` apply here:
   - For `TextFieldSpec`: each example's lexical form MUST match `validationRegex` (if present), and its length MUST fall within `[minLength, maxLength]` (if present). When `langTagRequirement` is present, each example's `TextValue.lang` MUST satisfy the requirement.
   - For `IntegerNumberFieldSpec` / `RealNumberFieldSpec`: each example MUST fall within `[minValue, maxValue]` (if present).
   - For `DateFieldSpec`: each example's `DateValue` arm MUST match `dateValueType`.
   - For `TimeFieldSpec`: each example's lexical form MUST match the declared `timePrecision`.
   - For `DateTimeFieldSpec`: each example's lexical form MUST match the declared `dateTimeValueType`.
   - For `SingleValuedEnumFieldSpec` and `MultiValuedEnumFieldSpec`: each example MUST be a single `EnumValue` whose `value` equals the `Token` of one `PermissibleValue` in the spec. (For `MultiValuedEnumFieldSpec` this is *one* `EnumValue`, not a sequence — see [Field Specs](grammar.md#field-specs).)
   - For `LanguageFieldSpec`: each example's tag MUST be a well-formed BCP 47 language tag, and when `permittedLanguages` is present, MUST appear verbatim in `permittedLanguages`.
   - Errors from these inner checks are reported with `<fieldSpec>/examples/<i>` rooting the path of the family-specific value-validator.

Duplicate entries within `examples` are not normatively forbidden. Authors SHOULD NOT include identical entries; conforming validators MAY emit a warning for duplicates but MUST NOT reject.

---

#### Default Value Validation

##### `validate_default_value(defaultValue: Value, embedded: EmbeddedArtifact)` {#fn-validate-default-value}

Let `fieldSpec` = the `FieldSpec` of the `Field` referenced by `embedded`.

1. Verify `defaultValue` is of the family-specific `Value` type for `fieldSpec`: `TextValue` for `TextFieldSpec`, `IntegerNumberValue` for `IntegerNumberFieldSpec`, `RealNumberValue` for `RealNumberFieldSpec`, `BooleanValue` for `BooleanFieldSpec`, `DateValue` for `DateFieldSpec`, `TimeValue` for `TimeFieldSpec`, `DateTimeValue` for `DateTimeFieldSpec`, `ControlledTermValue` for `ControlledTermFieldSpec`, `EnumValue` for `SingleValuedEnumFieldSpec`, a sequence of `EnumValue` for `MultiValuedEnumFieldSpec`, `LinkValue` for `LinkFieldSpec`, `EmailValue` for `EmailFieldSpec`, `PhoneNumberValue` for `PhoneNumberFieldSpec`, the corresponding external-authority `Value` types for the external-authority field specs, and `LanguageValue` for `LanguageFieldSpec`. `AttributeValueFieldSpec` does not admit a default value.
   *On failure:* `wireShape` at `<embedded>/defaultValue`, production naming `embedded`'s family, message `"defaultValue must be a <FamilyValue> (got <kind>)"`.
2. Apply the family-specific `validate_xxx_value(defaultValue, fieldSpec)` procedure to `defaultValue`. The default value MUST satisfy every constraint that a `FieldValue` carrying the same `Value` would satisfy. Errors reported by the inner subroutine are surfaced verbatim, with the path rooted at `<embedded>/defaultValue`.
3. If `embedded` is an `EmbeddedSingleValuedEnumField`: verify `defaultValue` is a single `EnumValue` (not a sequence).
   *On failure:* `wireShape` at `<embedded>/defaultValue`, production `EmbeddedSingleValuedEnumField`, message `"defaultValue must be a single EnumValue, not a sequence"`.
4. If `embedded` is an `EmbeddedMultiValuedEnumField`: verify `defaultValue` is a (possibly empty) sequence of `EnumValue` constructs and that no two entries share the same `value`.
   *On failure (shape):* `wireShape` at `<embedded>/defaultValue`, production `EmbeddedMultiValuedEnumField`, message `"defaultValue must be an array of EnumValue"`.
   *On failure (duplicate):* `structural` at `<embedded>/defaultValue/<j>/value` (the second occurrence), production `EmbeddedMultiValuedEnumField`, message `"defaultValue contains duplicate entries (also at /defaultValue/<i>/value)"`.

---

#### Rendering Hint Validation

##### `validate_rendering_hints(embedded: EmbeddedField)` {#fn-validate-rendering-hints}

Applies the [Rendering Hint Compatibility](#rendering-hint-compatibility) rules.

Let `fieldSpec` = the `FieldSpec` of the `Field` referenced by `embedded`.

For each step below, *on failure:* `structural` at the rendering-hint slot's path (e.g. `<embedded>/renderingHint`), production naming `embedded`'s family, message `"<HintKind> is not compatible with <FieldSpecKind>"`.

1. If `embedded` carries a `TextRenderingHint`: verify `fieldSpec` is `TextFieldSpec`.
2. If `embedded` carries a `SingleValuedEnumRenderingHint`: verify `fieldSpec` is `SingleValuedEnumFieldSpec`.
3. If `embedded` carries a `MultiValuedEnumRenderingHint`: verify `fieldSpec` is `MultiValuedEnumFieldSpec`.
4. If `embedded` carries a `NumericRenderingHint`: verify `fieldSpec` is `IntegerNumberFieldSpec` or `RealNumberFieldSpec`.
5. If `embedded` carries a `DateRenderingHint`: verify `fieldSpec` is `DateFieldSpec`.
6. If `embedded` carries a `TimeRenderingHint`: verify `fieldSpec` is `TimeFieldSpec`.
7. If `embedded` carries a `DateTimeRenderingHint`: verify `fieldSpec` is `DateTimeFieldSpec`.

---

### Phase 2: Instance Validation

#### Entry Point

##### `validate_instance(instance: TemplateInstance, template: Template)` {#fn-validate-instance}

Entry point for instance validation.

1. Run [`validate_model_version(instance.model_version)`](#fn-validate-model-version).
2. Run [`validate_instance_alignment(instance, template)`](#fn-validate-instance-alignment).
3. Run [`validate_field_presence_and_cardinality(instance, template)`](#fn-validate-field-presence-and-cardinality).
4. For each `fieldValue` in `instance.instance_values` where `fieldValue` is a `FieldValue`:
   1. Let `embeddedField` = the `EmbeddedField` in `template` whose key = `fieldValue.key`.
   2. Run [`validate_field_value(fieldValue, embeddedField)`](#fn-validate-field-value).
5. Run [`validate_nested_template_presence_and_cardinality(instance, template)`](#fn-validate-nested-template-presence-and-cardinality).
6. For each `nestedInstance` in `instance.instance_values` where `nestedInstance` is a `NestedTemplateInstance`:
   1. Let `embeddedTemplate` = the `EmbeddedTemplate` in `template` whose key = `nestedInstance.key`.
   2. Let `referencedTemplate` = the `Template` identified by `embeddedTemplate.artifactRef`.
   3. Run [`validate_instance(nestedInstance, referencedTemplate)`](#fn-validate-instance).

---

#### Structural Alignment

##### `validate_instance_alignment(instance: TemplateInstance, template: Template)` {#fn-validate-instance-alignment}

Applies the [Instance Alignment](#instance-alignment) rules.

1. Let `field_keys` = `{ embedded.key | embedded ∈ template.embedded_artifacts, embedded is EmbeddedField }`.
2. Let `template_keys` = `{ embedded.key | embedded ∈ template.embedded_artifacts, embedded is EmbeddedTemplate }`.
3. Let `pc_keys` = `{ embedded.key | embedded ∈ template.embedded_artifacts, embedded is EmbeddedPresentationComponent }`.
4. For each `fieldValue` in `instance.instance_values` where `fieldValue` is a `FieldValue`: verify `fieldValue.key ∈ field_keys`.
   *On failure:* `structural` at `<instance>/values/<i>/key`, production `FieldValue`, message `"FieldValue.key does not identify any EmbeddedField in the referenced Template"`.
5. For each `nestedInstance` in `instance.instance_values` where `nestedInstance` is a `NestedTemplateInstance`: verify `nestedInstance.key ∈ template_keys`.
   *On failure:* `structural` at `<instance>/values/<i>/key`, production `NestedTemplateInstance`, message `"NestedTemplateInstance.key does not identify any EmbeddedTemplate in the referenced Template"`.
6. For each `instanceValue` in `instance.instance_values`: verify `instanceValue.key ∉ pc_keys`.
   *On failure:* `structural` at `<instance>/values/<i>/key`, production naming `instanceValue`'s kind, message `"InstanceValue keyed to an EmbeddedPresentationComponent — presentation components do not produce instance values"`.

---

#### Field Presence and Cardinality

##### `validate_field_presence_and_cardinality(instance: TemplateInstance, template: Template)` {#fn-validate-field-presence-and-cardinality}

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `embeddedField` in `template.embedded_artifacts` where `embeddedField` is an `EmbeddedField`:

1. Let `eff_min` = `embeddedField.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `embeddedField.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `embeddedField.value_requirement` if present, else `"optional"`.
4. Let `fieldValue` = the `FieldValue` in `instance` with key = `embeddedField.key`, or `absent` if none exists.
5. If `req = "required"`:
   1. Verify `fieldValue ≠ absent`.
      *On failure:* `structural` at `<instance>/values`, production `TemplateInstance`, message `"required field <embeddedField.key> is missing from the instance"`.
   2. Verify `count(fieldValue.values) ≥ eff_min`.
      *On failure:* `structural` at `<fieldValue>/values`, production `FieldValue`, message `"value count below required minimum cardinality (got <n>, expected ≥ <eff_min>)"`.
   3. If `eff_max ≠ ∞`: verify `count(fieldValue.values) ≤ eff_max`.
      *On failure:* `structural` at `<fieldValue>/values`, production `FieldValue`, message `"value count above maximum cardinality (got <n>, expected ≤ <eff_max>)"`.
6. If `req = "recommended"` or `req = "optional"`:
   1. If `fieldValue ≠ absent`:
      1. Verify `count(fieldValue.values) ≥ eff_min`.
         *On failure:* `structural` at `<fieldValue>/values`, production `FieldValue`, message `"value count below minimum cardinality (got <n>, expected ≥ <eff_min>)"`.
      2. If `eff_max ≠ ∞`: verify `count(fieldValue.values) ≤ eff_max`.
         *On failure:* `structural` at `<fieldValue>/values`, production `FieldValue`, message `"value count above maximum cardinality (got <n>, expected ≤ <eff_max>)"`.

---

#### Field Value Validation

##### `validate_field_value(fieldValue: FieldValue, embeddedField: EmbeddedField)` {#fn-validate-field-value}

1. Let `fieldSpec` = the `FieldSpec` of the `Field` referenced by `embeddedField`.
2. For each `value` in `fieldValue.values`: run [`validate_value(value, fieldSpec)`](#fn-validate-value).

---

##### `validate_value(value: Value, fieldSpec: FieldSpec)` {#fn-validate-value}

Dispatch on the kind of `fieldSpec`:

- `TextFieldSpec` → [`validate_text_value(value, fieldSpec)`](#fn-validate-text-value)
- `IntegerNumberFieldSpec` → [`validate_integer_number_value(value, fieldSpec)`](#fn-validate-integer-number-value)
- `RealNumberFieldSpec` → [`validate_real_number_value(value, fieldSpec)`](#fn-validate-real-number-value)
- `BooleanFieldSpec` → [`validate_boolean_value(value, fieldSpec)`](#fn-validate-boolean-value)
- `DateFieldSpec` → [`validate_date_value(value, fieldSpec)`](#fn-validate-date-value)
- `TimeFieldSpec` → [`validate_time_value(value, fieldSpec)`](#fn-validate-time-value)
- `DateTimeFieldSpec` → [`validate_datetime_value(value, fieldSpec)`](#fn-validate-datetime-value)
- `ControlledTermFieldSpec` → [`validate_controlled_term_value(value, fieldSpec)`](#fn-validate-controlled-term-value)
- `SingleValuedEnumFieldSpec` or `MultiValuedEnumFieldSpec` → [`validate_enum_value(value, fieldSpec)`](#fn-validate-enum-value)
- `LinkFieldSpec` → [`validate_link_value(value)`](#fn-validate-link-value)
- `EmailFieldSpec` or `PhoneNumberFieldSpec` → [`validate_contact_value(value)`](#fn-validate-contact-value)
- `OrcidFieldSpec`, `RorFieldSpec`, `DoiFieldSpec`, `PubMedIdFieldSpec`, `RridFieldSpec`, or `NihGrantIdFieldSpec` → [`validate_external_authority_value(value, fieldSpec)`](#fn-validate-external-authority-value)
- `AttributeValueFieldSpec` → [`validate_attribute_value(value)`](#fn-validate-attribute-value)

---

##### `validate_text_value(value: TextValue, fieldSpec: TextFieldSpec)` {#fn-validate-text-value}

1. Let `lexicalForm` = `value.value`.
2. If `fieldSpec.min_length` is present: verify `len(lexicalForm) ≥ fieldSpec.min_length`.
   *On failure:* `structural` at `<value>/value`, production `TextValue`, message `"value length below TextFieldSpec.minLength"`.
3. If `fieldSpec.max_length` is present: verify `len(lexicalForm) ≤ fieldSpec.max_length`.
   *On failure:* `structural` at `<value>/value`, production `TextValue`, message `"value length above TextFieldSpec.maxLength"`.
4. If `fieldSpec.validation_regex` is present: verify `lexicalForm` matches `fieldSpec.validation_regex`.
   *On failure:* `structural` at `<value>/value`, production `TextValue`, message `"value does not match TextFieldSpec.validationRegex"`.
5. If `value.lang` is present: verify it conforms to the `Bcp47Tag` lexical form (RFC 5646).
   *On failure:* `lexical` at `<value>/lang`, production `TextValue`, message `"lang is not a well-formed BCP 47 tag"`.
6. If `fieldSpec.lang_tag_requirement = "langTagRequired"`: verify `value.lang` is present.
   *On failure:* `structural` at `<value>/lang`, production `TextValue`, message `"lang tag missing; TextFieldSpec.langTagRequirement is 'langTagRequired'"`.
7. If `fieldSpec.lang_tag_requirement = "langTagForbidden"`: verify `value.lang` is absent.
   *On failure:* `structural` at `<value>/lang`, production `TextValue`, message `"lang tag present; TextFieldSpec.langTagRequirement is 'langTagForbidden'"`.

---

##### `validate_integer_number_value(value: IntegerNumberValue, fieldSpec: IntegerNumberFieldSpec)` {#fn-validate-integer-number-value}

1. Verify `value.value` conforms to the `IntegerLexicalForm` (regex `^-?(0|[1-9][0-9]*)$`). Let `n` = its integer value.
   *On failure:* `lexical` at `<value>/value`, production `IntegerNumberValue`, message `"value is not a well-formed IntegerLexicalForm"`.
2. If `fieldSpec.min_value` is present: verify `n ≥ fieldSpec.min_value.value` (compared as integers).
   *On failure:* `structural` at `<value>/value`, production `IntegerNumberValue`, message `"value below IntegerNumberFieldSpec.minValue"`.
3. If `fieldSpec.max_value` is present: verify `n ≤ fieldSpec.max_value.value` (compared as integers).
   *On failure:* `structural` at `<value>/value`, production `IntegerNumberValue`, message `"value above IntegerNumberFieldSpec.maxValue"`.

---

##### `validate_real_number_value(value: RealNumberValue, fieldSpec: RealNumberFieldSpec)` {#fn-validate-real-number-value}

1. Verify `value.datatype = fieldSpec.datatype` (one of `decimal`, `float`, `double`).
   *On failure:* `structural` at `<value>/datatype`, production `RealNumberValue`, message `"datatype does not match the enclosing RealNumberFieldSpec.datatype"`.
2. Verify `value.value` is a well-formed lexical form for that datatype. Let `n` = its numeric value.
   *On failure:* `lexical` at `<value>/value`, production `RealNumberValue`, message `"value is not a well-formed lexical form for datatype <datatype>"`.
3. If `fieldSpec.min_value` is present: verify `n ≥ fieldSpec.min_value.value` (compared as numbers under `fieldSpec.datatype`'s ordering).
   *On failure:* `structural` at `<value>/value`, production `RealNumberValue`, message `"value below RealNumberFieldSpec.minValue"`.
4. If `fieldSpec.max_value` is present: verify `n ≤ fieldSpec.max_value.value` (compared as numbers under `fieldSpec.datatype`'s ordering).
   *On failure:* `structural` at `<value>/value`, production `RealNumberValue`, message `"value above RealNumberFieldSpec.maxValue"`.

**Comparison semantics for `float` and `double`.** The numeric value `n` MAY be `NaN`, `+INF`, or `-INF` (these are part of the `xsd:float` and `xsd:double` lexical spaces). The bound comparisons in steps 3 and 4 follow IEEE 754 ordering:

- If `n` is `NaN`, every comparison `n ≥ x` and `n ≤ x` is false. A `NaN` value therefore violates any present `minValue` or `maxValue` bound and reports the corresponding bound-failure error.
- If `n` is `+INF`, then `n ≥ x` is true for every finite `x` and `n ≤ x` is true only when `x` is `+INF`.
- If `n` is `-INF`, then `n ≤ x` is true for every finite `x` and `n ≥ x` is true only when `x` is `-INF`.

This convention matches the IEEE 754 totalOrder relation restricted to comparison; bindings SHOULD use their host language's IEEE 754-compliant comparison primitives.

---

##### `validate_boolean_value(value: BooleanValue, fieldSpec: BooleanFieldSpec)` {#fn-validate-boolean-value}

1. Verify `value.value` is `true` or `false`.
   *On failure:* `wireShape` at `<value>/value`, production `BooleanValue`, message `"value must be a JSON boolean"`.

---

##### `validate_date_value(value: DateValue, fieldSpec: DateFieldSpec)` {#fn-validate-date-value}

1. If `fieldSpec.date_value_type = "year"`: verify `value` is a `YearValue` whose `value` matches `[0-9]{4}`.
   *On failure (arm):* `structural` at `<value>`, production `DateValue`, message `"DateFieldSpec.dateValueType 'year' admits only YearValue"`.
   *On failure (lexical):* `lexical` at `<value>/value`, production `YearValue`, message `"value does not match YYYY"`.
2. If `fieldSpec.date_value_type = "yearMonth"`: verify `value` is a `YearMonthValue` whose `value` matches `[0-9]{4}-(0[1-9]|1[0-2])`.
   *On failure (arm):* `structural` at `<value>`, production `DateValue`, message `"DateFieldSpec.dateValueType 'yearMonth' admits only YearMonthValue"`.
   *On failure (lexical):* `lexical` at `<value>/value`, production `YearMonthValue`, message `"value does not match YYYY-MM"`.
3. If `fieldSpec.date_value_type = "fullDate"`: verify `value` is a `FullDateValue` whose `value` is a well-formed `xsd:date` lexical form.
   *On failure (arm):* `structural` at `<value>`, production `DateValue`, message `"DateFieldSpec.dateValueType 'fullDate' admits only FullDateValue"`.
   *On failure (lexical):* `lexical` at `<value>/value`, production `FullDateValue`, message `"value is not a well-formed xsd:date lexical form"`.

---

##### `validate_time_value(value: TimeValue, fieldSpec: TimeFieldSpec)` {#fn-validate-time-value}

For each step below that verifies a precision constraint, *on failure:* `structural` at `<value>/value`, production `TimeValue`, message `"value does not match the precision required by TimeFieldSpec.timePrecision"`. For lexical-form failures (`xsd:time` ill-formedness), the category is `lexical` instead.

1. Let `t` = `value.value`.
2. If `fieldSpec.time_precision = "hourMinute"`: verify `t` contains only hour and minute components (form `HH:MM`; no seconds or fractional seconds present).
3. If `fieldSpec.time_precision = "hourMinuteSecond"`: verify `t` contains hour, minute, and second components (form `HH:MM:SS`; no fractional seconds present).
4. If `fieldSpec.time_precision = "hourMinuteSecondFraction"`: verify `t` is a well-formed `xsd:time` lexical form; fractional seconds are permitted.
5. If `fieldSpec.time_precision` is absent: verify `t` is a well-formed `xsd:time` lexical form.
6. If `fieldSpec.timezone_requirement = "timezoneRequired"`: verify `t` includes a timezone designator.
   *On failure:* `structural` at `<value>/value`, production `TimeValue`, message `"timezone designator missing; TimeFieldSpec.timezoneRequirement is 'timezoneRequired'"`.

---

##### `validate_datetime_value(value: DateTimeValue, fieldSpec: DateTimeFieldSpec)` {#fn-validate-datetime-value}

For each step below that verifies a precision constraint, *on failure:* `structural` at `<value>/value`, production `DateTimeValue`, message `"value does not match the precision required by DateTimeFieldSpec.dateTimeValueType"`. For lexical-form failures (`xsd:dateTime` ill-formedness), the category is `lexical` instead.

1. Let `dt` = `value.value`.
2. If `fieldSpec.datetime_value_type = "dateHourMinute"`: verify the time component of `dt` contains only hour and minute (form `…THH:MM`; no seconds present).
3. If `fieldSpec.datetime_value_type = "dateHourMinuteSecond"`: verify the time component contains hour, minute, and second (form `…THH:MM:SS`; no fractional seconds present).
4. If `fieldSpec.datetime_value_type = "dateHourMinuteSecondFraction"`: verify `dt` is a well-formed `xsd:dateTime` lexical form; fractional seconds are permitted.
5. If `fieldSpec.timezone_requirement = "timezoneRequired"`: verify `dt` includes a timezone designator.
   *On failure:* `structural` at `<value>/value`, production `DateTimeValue`, message `"timezone designator missing; DateTimeFieldSpec.timezoneRequirement is 'timezoneRequired'"`.

---

##### `validate_controlled_term_value(value: ControlledTermValue, fieldSpec: ControlledTermFieldSpec)` {#fn-validate-controlled-term-value}

1. Verify `value.term_iri` is present.
   *On failure:* `wireShape` at `<value>/term`, production `ControlledTermValue`, message `"term is required"`.
2. Warn if `value.label` is absent.
   *On warning:* `structural` at `<value>/label`, production `ControlledTermValue`, message `"label SHOULD be present so consumers without ontology access can render the term"` (warning, not error).

Note: validation of `value.term_iri` against `fieldSpec.controlled_term_sources` requires an external ontology resolver and is outside the scope of this algorithm; see [Out of Scope](#out-of-scope).

---

##### `validate_enum_value(value: EnumValue, fieldSpec: EnumFieldSpec)` {#fn-validate-enum-value}

1. Verify there exists a `pv` in `fieldSpec.permissible_values` such that `value.value = pv.value` (string equality, character by character).
   *On failure:* `structural` at `<value>/value`, production `EnumValue`, message `"value does not match any of the spec's permissibleValues tokens"`.

---

##### `validate_link_value(value: LinkValue)` {#fn-validate-link-value}

1. Verify `value.iri` is present and is a well-formed IRI.
   *On failure (missing):* `wireShape` at `<value>/iri`, production `LinkValue`, message `"iri is required"`.
   *On failure (malformed):* `lexical` at `<value>/iri`, production `LinkValue`, message `"iri is not a valid IRI"`.

---

##### `validate_contact_value(value: ContactValue)` {#fn-validate-contact-value}

1. If `value` is an `EmailValue`: verify `value.value` is a non-empty lexical form.
   *On failure:* `wireShape` at `<value>/value`, production `EmailValue`, message `"value must be a non-empty string"`.
2. If `value` is a `PhoneNumberValue`: verify `value.value` is a non-empty lexical form.
   *On failure:* `wireShape` at `<value>/value`, production `PhoneNumberValue`, message `"value must be a non-empty string"`.

---

##### `validate_external_authority_value(value: ExternalAuthorityValue, fieldSpec: ExternalAuthorityFieldSpec)` {#fn-validate-external-authority-value}

Each external-authority `Value` carries a typed IRI specialised for its authority. The lexical patterns below are recommended (suitable for syntactic conformance checking) but are not structurally normative beyond `Iri` well-formedness; binding-level validators MAY apply stricter checks.

| Field spec | Required IRI | Recommended pattern |
|---|---|---|
| `OrcidFieldSpec` | `OrcidIri` | `https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{3}[0-9X]` |
| `RorFieldSpec` | `RorIri` | `https://ror\.org/0[a-hj-km-np-tv-z0-9]{6}[0-9]{2}` |
| `DoiFieldSpec` | `DoiIri` | `https://doi\.org/10\.\d{4,9}/.+` |
| `PubMedIdFieldSpec` | `PubMedIri` | `https://pubmed\.ncbi\.nlm\.nih\.gov/\d+` |
| `RridFieldSpec` | `RridIri` | `https://identifiers\.org/RRID:[A-Z]+_\d+` |
| `NihGrantIdFieldSpec` | `NihGrantIri` | (see [Out of Scope](#out-of-scope)) |

In every case the procedure is: verify `value` is the corresponding `XxxValue` and that its `iri` slot is present and is a well-formed `Iri` per [`grammar.md` §Primitive String Types](grammar.md#primitive-string-types). Implementations MAY additionally check the recommended pattern.

*On failure (missing iri):* `wireShape` at `<value>/iri`, production naming `value`'s family, message `"iri is required"`.
*On failure (not a well-formed Iri):* `lexical` at `<value>/iri`, production naming `value`'s family, message `"iri is not a valid Iri"`.
*On failure (recommended pattern, when implementations check):* `lexical` at `<value>/iri`, production naming `value`'s family, message `"iri does not match the recommended pattern for <Authority>"`.

---

##### `validate_attribute_value(value: AttributeValue)` {#fn-validate-attribute-value}

1. Verify `value.name` is present and contains a non-empty `string`.
   *On failure:* `wireShape` at `<value>/name`, production `AttributeValue`, message `"name must be a non-empty string"`.
2. Verify `value.value` is present and is a well-formed `Value`.
   *On failure:* `wireShape` at `<value>/value`, production `AttributeValue`, message `"value is required and must be a Value"`.
3. If `value.value` is an `AttributeValue`: run [`validate_attribute_value(value.value)`](#fn-validate-attribute-value).

---

#### Nested Template Validation

##### `validate_nested_template_presence_and_cardinality(instance: TemplateInstance, template: Template)` {#fn-validate-nested-template-presence-and-cardinality}

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `embeddedTemplate` in `template.embedded_artifacts` where `embeddedTemplate` is an `EmbeddedTemplate`:

1. Let `eff_min` = `embeddedTemplate.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `embeddedTemplate.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `embeddedTemplate.value_requirement` if present, else `"optional"`.
4. Let `n` = `count({ nestedInstance | nestedInstance ∈ instance.instance_values, nestedInstance is NestedTemplateInstance, nestedInstance.key = embeddedTemplate.key })`.
5. If `req = "required"`:
   1. Verify `n ≥ eff_min`.
      *On failure:* `structural` at `<instance>/values`, production `TemplateInstance`, message `"required NestedTemplateInstance count below minimum (got <n>, expected ≥ <eff_min>) for key '<embeddedTemplate.key>'"`.
   2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.
      *On failure:* `structural` at `<instance>/values`, production `TemplateInstance`, message `"NestedTemplateInstance count above maximum (got <n>, expected ≤ <eff_max>) for key '<embeddedTemplate.key>'"`.
6. If `req = "recommended"` or `req = "optional"`:
   1. If `n > 0`:
      1. Verify `n ≥ eff_min`.
         *On failure:* `structural` at `<instance>/values`, production `TemplateInstance`, message `"NestedTemplateInstance count below minimum (got <n>, expected ≥ <eff_min>) for key '<embeddedTemplate.key>'"`.
      2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.
         *On failure:* `structural` at `<instance>/values`, production `TemplateInstance`, message `"NestedTemplateInstance count above maximum (got <n>, expected ≤ <eff_max>) for key '<embeddedTemplate.key>'"`.

---

### Out of Scope

The following checks are outside the scope of the canonical algorithm and are not required for conformance:

- **`ControlledTermSource` membership** — verifying that a `ControlledTermValue`'s `TermIri` is drawn from a declared ontology, branch, class set, or value set requires an external ontology resolver and is not defined here.
- **NIH Grant ID pattern** — the lexical pattern for `NihGrantIri` is currently unspecified.
- **`AttributeValueField` name validation** — attribute names are not fixed at schema definition time and cannot be structurally validated against the schema.

## Open Questions

- Which validation rules should be mandatory in the core specification versus deferred to profile-specific extensions?
