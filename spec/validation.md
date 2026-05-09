# Validation

## Overview

Validation in the CEDAR Template Model consists of structural conformance to the abstract grammar and satisfaction of well-formedness conditions that are not expressed directly in grammar productions. The [Canonical Validation Algorithm](#canonical-validation-algorithm) section defines a two-phase procedural algorithm that operationalises all normative rules in this document.

## Contents

- [Relationship to the wire-form error model](#relationship-to-the-wire-form-error-model)
- [Well-Formedness Conditions](#well-formedness-conditions)
  - [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness)
  - [Embedding References](#embedding-references)
  - [Cardinality Consistency](#cardinality-consistency)
  - [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity)
  - [Versioning](#versioning)
  - [Instance Alignment](#instance-alignment)
  - [Field Spec Compatibility](#field-spec-compatibility)
  - [Rendering Hint Compatibility](#rendering-hint-compatibility)
  - [Controlled Term Value Structure](#controlled-term-value-structure)
- [Canonical Validation Algorithm](#canonical-validation-algorithm)
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

Within a single `Template`, each `EmbeddedArtifact` MUST have a unique `EmbeddedArtifactKey`. The uniqueness constraint is local to that template level and does not extend across nested template boundaries. Accordingly, an embedded template MAY contain `EmbeddedArtifactKey` values that are identical to keys used in its containing template, because each template defines its own local key space.

Each `EmbeddedArtifactKey` MUST conform to the `AsciiIdentifier` lexical form (per [grammar.md](grammar.md#primitive-string-types)) — the regular expression `^[A-Za-z][A-Za-z0-9_-]*$`.

### Embedding References

Each `EmbeddedField` MUST reference a `Field`.

Each `EmbeddedTemplate` MUST reference a `Template`.

Each `EmbeddedPresentationComponent` MUST reference a `PresentationComponent`.

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

---

### Phase 1: Schema Validation

#### Entry Point

##### `validate_schema(T: Template)` {#fn-validate-schema}

Entry point for schema validation.

1. Run [`validate_model_version(T.model_version)`](#fn-validate-model-version) and [`validate_artifact_metadata(T.schema_artifact_metadata)`](#fn-validate-artifact-metadata).
2. Let `fields` = the set of `Field` artifacts referenced by `EmbeddedField` constructs in `T`.
3. For each `F` in `fields`: run [`validate_model_version(F.model_version)`](#fn-validate-model-version), [`validate_artifact_metadata(F.schema_artifact_metadata)`](#fn-validate-artifact-metadata), and [`validate_field_spec(F.field_spec)`](#fn-validate-field-spec).
4. Let `pcs` = the set of `PresentationComponent` artifacts referenced by `EmbeddedPresentationComponent` constructs in `T`.
5. For each `PC` in `pcs`: run [`validate_model_version(PC.model_version)`](#fn-validate-model-version) and [`validate_artifact_metadata(PC.artifact_metadata)`](#fn-validate-artifact-metadata).
6. Run [`validate_embedded_artifact_keys(T)`](#fn-validate-embedded-artifact-keys).
7. For each `E` in `T.embedded_artifacts`:
   1. Run [`validate_embedding_reference(E)`](#fn-validate-embedding-reference).
   2. Run [`validate_cardinality_consistency(E)`](#fn-validate-cardinality-consistency).
   3. If `E` is an `EmbeddedField`: run [`validate_rendering_hints(E)`](#fn-validate-rendering-hints).
   4. If `E.default_value` is present: run [`validate_default_value(E.default_value, E)`](#fn-validate-default-value).
   5. If `E` is an `EmbeddedTemplate`: run [`validate_schema(E.referenced_template)`](#fn-validate-schema).

---

#### Metadata and Key Validation

##### `validate_artifact_metadata(M: SchemaArtifactMetadata)` {#fn-validate-artifact-metadata}

Applies the [Versioning](#versioning) rules.

1. Let `v` = `M.versioning_metadata.version`. Verify `v` conforms to the `SemanticVersion` lexical form (Semantic Versioning 2.0.0).
2. Let `s` = `M.versioning_metadata.status`. Verify `s ∈ { draft, published }`.
3. If both `M.versioning_metadata.previous_version` and `M.versioning_metadata.derived_from` are present: verify they do not carry the same IRI value.

When invoked with an `ArtifactMetadata` value (e.g. a `PresentationComponent`'s metadata), all steps are skipped: `ArtifactMetadata` does not carry `SchemaArtifactVersioning`.

---

##### `validate_model_version(mv: ModelVersion)` {#fn-validate-model-version}

Applies the [Versioning](#versioning) rules to the artifact-level `ModelVersion` carried directly by every concrete `Artifact`.

1. Verify `mv` conforms to the `SemanticVersion` lexical form (Semantic Versioning 2.0.0).

---

##### `validate_embedded_artifact_keys(T: Template)` {#fn-validate-embedded-artifact-keys}

Applies the [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness) rules.

1. Let `keys` = the sequence of `EmbeddedArtifactKey` values across all `EmbeddedArtifact` constructs in `T`.
2. For each key `k` in `keys`: verify `k` conforms to the `AsciiIdentifier` lexical form (regex `^[A-Za-z][A-Za-z0-9_-]*$`).
3. Verify all values in `keys` are distinct: for each pair `(k₁, k₂)` where `k₁ ≠ k₂` as positions but `k₁ = k₂` as values, report a duplicate-key error. Key uniqueness is scoped to `T`; the same key may appear in a nested template without conflict.

---

#### Reference and Cardinality Validation

##### `validate_embedding_reference(E: EmbeddedArtifact)` {#fn-validate-embedding-reference}

Applies the [Embedding References](#embedding-references) rules.

1. If `E` is an `EmbeddedTextField`: verify `E.artifactRef` is a `TextFieldId` identifying an existing `TextField`.
2. If `E` is an `EmbeddedIntegerNumberField`: verify `E.artifactRef` is an `IntegerNumberFieldId` identifying an existing `IntegerNumberField`.
3. If `E` is an `EmbeddedRealNumberField`: verify `E.artifactRef` is a `RealNumberFieldId` identifying an existing `RealNumberField`.
4. If `E` is an `EmbeddedBooleanField`: verify `E.artifactRef` is a `BooleanFieldId` identifying an existing `BooleanField`.
5. If `E` is an `EmbeddedDateField`: verify `E.artifactRef` is a `DateFieldId` identifying an existing `DateField`.
6. If `E` is an `EmbeddedTimeField`: verify `E.artifactRef` is a `TimeFieldId` identifying an existing `TimeField`.
7. If `E` is an `EmbeddedDateTimeField`: verify `E.artifactRef` is a `DateTimeFieldId` identifying an existing `DateTimeField`.
8. If `E` is an `EmbeddedControlledTermField`: verify `E.artifactRef` is a `ControlledTermFieldId` identifying an existing `ControlledTermField`.
9. If `E` is an `EmbeddedSingleValuedEnumField`: verify `E.artifactRef` is a `SingleValuedEnumFieldId` identifying an existing `SingleValuedEnumField`.
10. If `E` is an `EmbeddedMultiValuedEnumField`: verify `E.artifactRef` is a `MultiValuedEnumFieldId` identifying an existing `MultiValuedEnumField`.
11. If `E` is an `EmbeddedLinkField`: verify `E.artifactRef` is a `LinkFieldId` identifying an existing `LinkField`.
12. If `E` is an `EmbeddedEmailField`: verify `E.artifactRef` is an `EmailFieldId` identifying an existing `EmailField`.
13. If `E` is an `EmbeddedPhoneNumberField`: verify `E.artifactRef` is a `PhoneNumberFieldId` identifying an existing `PhoneNumberField`.
14. If `E` is an `EmbeddedOrcidField`: verify `E.artifactRef` is an `OrcidFieldId` identifying an existing `OrcidField`.
15. If `E` is an `EmbeddedRorField`: verify `E.artifactRef` is a `RorFieldId` identifying an existing `RorField`.
16. If `E` is an `EmbeddedDoiField`: verify `E.artifactRef` is a `DoiFieldId` identifying an existing `DoiField`.
17. If `E` is an `EmbeddedPubMedIdField`: verify `E.artifactRef` is a `PubMedIdFieldId` identifying an existing `PubMedIdField`.
18. If `E` is an `EmbeddedRridField`: verify `E.artifactRef` is an `RridFieldId` identifying an existing `RridField`.
19. If `E` is an `EmbeddedNihGrantIdField`: verify `E.artifactRef` is a `NihGrantIdFieldId` identifying an existing `NihGrantIdField`.
20. If `E` is an `EmbeddedAttributeValueField`: verify `E.artifactRef` is an `AttributeValueFieldId` identifying an existing `AttributeValueField`.
21. If `E` is an `EmbeddedTemplate`: verify `E.artifactRef` is a `TemplateId` identifying an existing `Template`.
22. If `E` is an `EmbeddedPresentationComponent`: verify `E.artifactRef` is a `PresentationComponentId` identifying an existing `PresentationComponent`.

---

##### `validate_cardinality_consistency(E: EmbeddedArtifact)` {#fn-validate-cardinality-consistency}

Applies the [Cardinality Consistency](#cardinality-consistency) rules.

1. Let `min` = `E.cardinality.min_cardinality` if `E.cardinality` is present, else `1`.
2. Let `max` = `E.cardinality.max_cardinality` if `E.cardinality` is present, else `1`. If `max` is `UnboundedCardinality`, let `max = ∞`.
3. Verify `min ≤ max`.
4. Let `req` = `E.value_requirement` if present, else `"optional"`.
5. If `req = "required"`: verify `min ≥ 1`.

---

#### Field Spec Validation

Applies the [Field Spec Compatibility](#field-spec-compatibility) rules. See also [Field Specs](grammar.md#field-specs) in the abstract grammar.

##### `validate_field_spec(FT: FieldSpec)` {#fn-validate-field-spec}

Dispatch on the kind of `FT`:

- If `FT` is `TextFieldSpec`: run [`validate_text_field_spec(FT)`](#fn-validate-text-field-spec).
- If `FT` is `IntegerNumberFieldSpec`: run [`validate_integer_number_field_spec(FT)`](#fn-validate-integer-number-field-spec).
- If `FT` is `RealNumberFieldSpec`: run [`validate_real_number_field_spec(FT)`](#fn-validate-real-number-field-spec).
- If `FT` is `SingleValuedEnumFieldSpec` or `MultiValuedEnumFieldSpec`: run [`validate_enum_field_spec(FT)`](#fn-validate-enum-field-spec).
- All other field specs have no additional schema-level well-formedness checks beyond structural grammar conformance.

---

##### `validate_text_field_spec(FT: TextFieldSpec)` {#fn-validate-text-field-spec}

1. If both `FT.min_length` and `FT.max_length` are present: verify `FT.min_length ≤ FT.max_length`.

---

##### `validate_integer_number_field_spec(FT: IntegerNumberFieldSpec)` {#fn-validate-integer-number-field-spec}

1. If both `FT.min_value` and `FT.max_value` are present: verify `FT.min_value ≤ FT.max_value`.

---

##### `validate_real_number_field_spec(FT: RealNumberFieldSpec)` {#fn-validate-real-number-field-spec}

1. If both `FT.min_value` and `FT.max_value` are present: verify `FT.min_value ≤ FT.max_value`.

---

##### `validate_enum_field_spec(FT: EnumFieldSpec)` {#fn-validate-enum-field-spec}

1. Let `tokens` = the sequence of `pv.value` values across all `pv` in `FT.permissible_values`.
2. Verify all values in `tokens` are distinct: report a duplicate-token error for any pair sharing the same token string.
3. For each `pv` in `FT.permissible_values`: verify `pv.value` is a non-empty Unicode string.
4. For each `pv` in `FT.permissible_values`, for each `m` in `pv.meanings`: verify `m.iri` is a syntactically valid IRI.
5. If `FT` is a `SingleValuedEnumFieldSpec` and `FT.default_value` is present: verify `FT.default_value` is an `EnumValue` and that `FT.default_value.value ∈ tokens`.
6. If `FT` is a `MultiValuedEnumFieldSpec` and `FT.default_values` is present:
   1. Verify each entry is an `EnumValue` and that its `value ∈ tokens`.
   2. Verify all entries' `value` strings are distinct.

---

#### Default Value Validation

##### `validate_default_value(D: Value, E: EmbeddedArtifact)` {#fn-validate-default-value}

Let `FT` = the `FieldSpec` of the `Field` referenced by `E`.

1. Verify `D` is of the family-specific `Value` type for `FT`: `TextValue` for `TextFieldSpec`, `IntegerNumberValue` for `IntegerNumberFieldSpec`, `RealNumberValue` for `RealNumberFieldSpec`, `BooleanValue` for `BooleanFieldSpec`, `DateValue` for `DateFieldSpec`, `TimeValue` for `TimeFieldSpec`, `DateTimeValue` for `DateTimeFieldSpec`, `ControlledTermValue` for `ControlledTermFieldSpec`, `EnumValue` for `SingleValuedEnumFieldSpec`, a sequence of `EnumValue` for `MultiValuedEnumFieldSpec`, `LinkValue` for `LinkFieldSpec`, `EmailValue` for `EmailFieldSpec`, `PhoneNumberValue` for `PhoneNumberFieldSpec`, and the corresponding external-authority `Value` types for the external-authority field specs. `AttributeValueFieldSpec` does not admit a default value.
2. Apply the family-specific [`validate_xxx_value(D, FT)`](#fn-validate-xxx-value) procedure to `D`. The default value MUST satisfy every constraint that a `FieldValue` carrying the same `Value` would satisfy.
3. If `E` is an `EmbeddedSingleValuedEnumField`: verify `D` is a single `EnumValue` (not a sequence).
4. If `E` is an `EmbeddedMultiValuedEnumField`: verify `D` is a (possibly empty) sequence of `EnumValue` constructs and that no two entries share the same `value`.

---

#### Rendering Hint Validation

##### `validate_rendering_hints(E: EmbeddedField)` {#fn-validate-rendering-hints}

Applies the [Rendering Hint Compatibility](#rendering-hint-compatibility) rules.

Let `FT` = the `FieldSpec` of the `Field` referenced by `E`.

1. If `E` carries a `TextRenderingHint`: verify `FT` is `TextFieldSpec`.
2. If `E` carries a `SingleValuedEnumRenderingHint`: verify `FT` is `SingleValuedEnumFieldSpec`.
3. If `E` carries a `MultiValuedEnumRenderingHint`: verify `FT` is `MultiValuedEnumFieldSpec`.
4. If `E` carries a `NumericRenderingHint`: verify `FT` is `IntegerNumberFieldSpec` or `RealNumberFieldSpec`.
5. If `E` carries a `DateRenderingHint`: verify `FT` is `DateFieldSpec`.
6. If `E` carries a `TimeRenderingHint`: verify `FT` is `TimeFieldSpec`.
7. If `E` carries a `DateTimeRenderingHint`: verify `FT` is `DateTimeFieldSpec`.

---

### Phase 2: Instance Validation

#### Entry Point

##### `validate_instance(I: TemplateInstance, T: Template)` {#fn-validate-instance}

Entry point for instance validation.

1. Run [`validate_model_version(I.model_version)`](#fn-validate-model-version).
2. Run [`validate_instance_alignment(I, T)`](#fn-validate-instance-alignment).
3. Run [`validate_field_presence_and_cardinality(I, T)`](#fn-validate-field-presence-and-cardinality).
4. For each `FV` in `I.instance_values` where `FV` is a `FieldValue`:
   1. Let `EF` = the `EmbeddedField` in `T` whose key = `FV.key`.
   2. Run [`validate_field_value(FV, EF)`](#fn-validate-field-value).
5. Run [`validate_nested_template_presence_and_cardinality(I, T)`](#fn-validate-nested-template-presence-and-cardinality).
6. For each `NTI` in `I.instance_values` where `NTI` is a `NestedTemplateInstance`:
   1. Let `ET` = the `EmbeddedTemplate` in `T` whose key = `NTI.key`.
   2. Let `RT` = the `Template` identified by `ET.artifactRef`.
   3. Run [`validate_instance(NTI, RT)`](#fn-validate-instance).

---

#### Structural Alignment

##### `validate_instance_alignment(I: TemplateInstance, T: Template)` {#fn-validate-instance-alignment}

Applies the [Instance Alignment](#instance-alignment) rules.

1. Let `field_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedField }`.
2. Let `template_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedTemplate }`.
3. Let `pc_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedPresentationComponent }`.
4. For each `FV` in `I.instance_values` where `FV` is a `FieldValue`: verify `FV.key ∈ field_keys`.
5. For each `NTI` in `I.instance_values` where `NTI` is a `NestedTemplateInstance`: verify `NTI.key ∈ template_keys`.
6. For each `IV` in `I.instance_values`: verify `IV.key ∉ pc_keys`.

---

#### Field Presence and Cardinality

##### `validate_field_presence_and_cardinality(I: TemplateInstance, T: Template)` {#fn-validate-field-presence-and-cardinality}

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `EF` in `T.embedded_artifacts` where `EF` is an `EmbeddedField`:

1. Let `eff_min` = `EF.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `EF.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `EF.value_requirement` if present, else `"optional"`.
4. Let `FV` = the `FieldValue` in `I` with key = `EF.key`, or `absent` if none exists.
5. If `req = "required"`:
   1. Verify `FV ≠ absent`.
   2. Verify `count(FV.values) ≥ eff_min`.
   3. If `eff_max ≠ ∞`: verify `count(FV.values) ≤ eff_max`.
6. If `req = "recommended"` or `req = "optional"`:
   1. If `FV ≠ absent`:
      1. Verify `count(FV.values) ≥ eff_min`.
      2. If `eff_max ≠ ∞`: verify `count(FV.values) ≤ eff_max`.

---

#### Field Value Validation

##### `validate_field_value(FV: FieldValue, EF: EmbeddedField)` {#fn-validate-field-value}

1. Let `FT` = the `FieldSpec` of the `Field` referenced by `EF`.
2. For each `V` in `FV.values`: run [`validate_value(V, FT)`](#fn-validate-value).

---

##### `validate_value(V: Value, FT: FieldSpec)` {#fn-validate-value}

Dispatch on the kind of `FT`:

- `TextFieldSpec` → [`validate_text_value(V, FT)`](#fn-validate-text-value)
- `IntegerNumberFieldSpec` → [`validate_integer_number_value(V, FT)`](#fn-validate-integer-number-value)
- `RealNumberFieldSpec` → [`validate_real_number_value(V, FT)`](#fn-validate-real-number-value)
- `BooleanFieldSpec` → [`validate_boolean_value(V, FT)`](#fn-validate-boolean-value)
- `DateFieldSpec` → [`validate_date_value(V, FT)`](#fn-validate-date-value)
- `TimeFieldSpec` → [`validate_time_value(V, FT)`](#fn-validate-time-value)
- `DateTimeFieldSpec` → [`validate_datetime_value(V, FT)`](#fn-validate-datetime-value)
- `ControlledTermFieldSpec` → [`validate_controlled_term_value(V, FT)`](#fn-validate-controlled-term-value)
- `SingleValuedEnumFieldSpec` or `MultiValuedEnumFieldSpec` → [`validate_enum_value(V, FT)`](#fn-validate-enum-value)
- `LinkFieldSpec` → [`validate_link_value(V)`](#fn-validate-link-value)
- `EmailFieldSpec` or `PhoneNumberFieldSpec` → [`validate_contact_value(V)`](#fn-validate-contact-value)
- `OrcidFieldSpec`, `RorFieldSpec`, `DoiFieldSpec`, `PubMedIdFieldSpec`, `RridFieldSpec`, or `NihGrantIdFieldSpec` → [`validate_external_authority_value(V, FT)`](#fn-validate-external-authority-value)
- `AttributeValueFieldSpec` → [`validate_attribute_value(V)`](#fn-validate-attribute-value)

---

##### `validate_text_value(V: TextValue, FT: TextFieldSpec)` {#fn-validate-text-value}

1. Let `s` = `V.value` (the lexical form).
2. If `FT.min_length` is present: verify `len(s) ≥ FT.min_length`.
3. If `FT.max_length` is present: verify `len(s) ≤ FT.max_length`.
4. If `FT.validation_regex` is present: verify `s` matches `FT.validation_regex`.
5. If `V.lang` is present: verify it conforms to the `Bcp47Tag` lexical form (RFC 5646).

---

##### `validate_integer_number_value(V: IntegerNumberValue, FT: IntegerNumberFieldSpec)` {#fn-validate-integer-number-value}

1. Verify `V.value` conforms to the `IntegerLexicalForm` (regex `^-?(0|[1-9][0-9]*)$`). Let `n` = its integer value.
2. If `FT.min_value` is present: verify `n ≥ FT.min_value.value` (compared as integers).
3. If `FT.max_value` is present: verify `n ≤ FT.max_value.value` (compared as integers).

---

##### `validate_real_number_value(V: RealNumberValue, FT: RealNumberFieldSpec)` {#fn-validate-real-number-value}

1. Verify `V.datatype = FT.datatype` (one of `decimal`, `float`, `double`).
2. Verify `V.value` is a well-formed lexical form for that datatype. Let `n` = its numeric value.
3. If `FT.min_value` is present: verify `n ≥ FT.min_value.value` (compared as numbers under `FT.datatype`'s ordering).
4. If `FT.max_value` is present: verify `n ≤ FT.max_value.value` (compared as numbers under `FT.datatype`'s ordering).

---

##### `validate_boolean_value(V: BooleanValue, FT: BooleanFieldSpec)` {#fn-validate-boolean-value}

1. Verify `V.value` is `true` or `false`.

---

##### `validate_date_value(V: DateValue, FT: DateFieldSpec)` {#fn-validate-date-value}

1. If `FT.date_value_type = "year"`: verify `V` is a `YearValue` whose `value` matches `[0-9]{4}`.
2. If `FT.date_value_type = "yearMonth"`: verify `V` is a `YearMonthValue` whose `value` matches `[0-9]{4}-(0[1-9]|1[0-2])`.
3. If `FT.date_value_type = "fullDate"`: verify `V` is a `FullDateValue` whose `value` is a well-formed `xsd:date` lexical form.

---

##### `validate_time_value(V: TimeValue, FT: TimeFieldSpec)` {#fn-validate-time-value}

1. Let `t` = `V.value`.
2. If `FT.time_precision = "hourMinute"`: verify `t` contains only hour and minute components (form `HH:MM`; no seconds or fractional seconds present).
3. If `FT.time_precision = "hourMinuteSecond"`: verify `t` contains hour, minute, and second components (form `HH:MM:SS`; no fractional seconds present).
4. If `FT.time_precision = "hourMinuteSecondFraction"`: verify `t` is a well-formed `xsd:time` lexical form; fractional seconds are permitted.
5. If `FT.time_precision` is absent: verify `t` is a well-formed `xsd:time` lexical form.
6. If `FT.timezone_requirement = "timezoneRequired"`: verify `t` includes a timezone designator.

---

##### `validate_datetime_value(V: DateTimeValue, FT: DateTimeFieldSpec)` {#fn-validate-datetime-value}

1. Let `dt` = `V.value`.
2. If `FT.datetime_value_type = "dateHourMinute"`: verify the time component of `dt` contains only hour and minute (form `…THH:MM`; no seconds present).
3. If `FT.datetime_value_type = "dateHourMinuteSecond"`: verify the time component contains hour, minute, and second (form `…THH:MM:SS`; no fractional seconds present).
4. If `FT.datetime_value_type = "dateHourMinuteSecondFraction"`: verify `dt` is a well-formed `xsd:dateTime` lexical form; fractional seconds are permitted.
5. If `FT.timezone_requirement = "timezoneRequired"`: verify `dt` includes a timezone designator.

---

##### `validate_controlled_term_value(V: ControlledTermValue, FT: ControlledTermFieldSpec)` {#fn-validate-controlled-term-value}

1. Verify `V.term_iri` is present.
2. Warn if `V.label` is absent.

Note: validation of `V.term_iri` against `FT.controlled_term_sources` requires an external ontology resolver and is outside the scope of this algorithm; see [Out of Scope](#out-of-scope).

---

##### `validate_enum_value(V: EnumValue, FT: EnumFieldSpec)` {#fn-validate-enum-value}

1. Verify there exists a `pv` in `FT.permissible_values` such that `V.value = pv.value` (string equality, character by character).
2. If no such `pv` exists: report error.

---

##### `validate_link_value(V: LinkValue)` {#fn-validate-link-value}

1. Verify `V.iri` is present and is a well-formed IRI.

---

##### `validate_contact_value(V: ContactValue)` {#fn-validate-contact-value}

1. If `V` is an `EmailValue`: verify `V.value` is a non-empty lexical form.
2. If `V` is a `PhoneNumberValue`: verify `V.value` is a non-empty lexical form.

---

##### `validate_external_authority_value(V: ExternalAuthorityValue, FT: ExternalAuthorityFieldSpec)` {#fn-validate-external-authority-value}

Each external-authority `Value` carries a typed IRI specialised for its authority. The lexical patterns below are recommended (suitable for syntactic conformance checking) but are not structurally normative beyond `Iri` well-formedness; binding-level validators MAY apply stricter checks.

| Field spec | Required IRI | Recommended pattern |
|---|---|---|
| `OrcidFieldSpec` | `OrcidIri` | `https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{3}[0-9X]` |
| `RorFieldSpec` | `RorIri` | `https://ror\.org/0[a-hj-km-np-tv-z0-9]{6}[0-9]{2}` |
| `DoiFieldSpec` | `DoiIri` | `https://doi\.org/10\.\d{4,9}/.+` |
| `PubMedIdFieldSpec` | `PubMedIri` | `https://pubmed\.ncbi\.nlm\.nih\.gov/\d+` |
| `RridFieldSpec` | `RridIri` | `https://identifiers\.org/RRID:[A-Z]+_\d+` |
| `NihGrantIdFieldSpec` | `NihGrantIri` | (see [Out of Scope](#out-of-scope)) |

In every case the procedure is: verify `V` is the corresponding `XxxValue` and that its `iri` slot is present and is a well-formed `Iri` per [`grammar.md` §Primitive String Types](grammar.md#primitive-string-types). Implementations MAY additionally check the recommended pattern.

---

##### `validate_attribute_value(V: AttributeValue)` {#fn-validate-attribute-value}

1. Verify `V.name` is present and contains a non-empty `string`.
2. Verify `V.value` is present and is a well-formed `Value`.
3. If `V.value` is an `AttributeValue`: run [`validate_attribute_value(V.value)`](#fn-validate-attribute-value).

---

#### Nested Template Validation

##### `validate_nested_template_presence_and_cardinality(I: TemplateInstance, T: Template)` {#fn-validate-nested-template-presence-and-cardinality}

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `ET` in `T.embedded_artifacts` where `ET` is an `EmbeddedTemplate`:

1. Let `eff_min` = `ET.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `ET.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `ET.value_requirement` if present, else `"optional"`.
4. Let `n` = `count({ NTI | NTI ∈ I.instance_values, NTI is NestedTemplateInstance, NTI.key = ET.key })`.
5. If `req = "required"`:
   1. Verify `n ≥ eff_min`.
   2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.
6. If `req = "recommended"` or `req = "optional"`:
   1. If `n > 0`:
      1. Verify `n ≥ eff_min`.
      2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.

---

### Out of Scope

The following checks are outside the scope of the canonical algorithm and are not required for conformance:

- **`ControlledTermSource` membership** — verifying that a `ControlledTermValue`'s `TermIri` is drawn from a declared ontology, branch, class set, or value set requires an external ontology resolver and is not defined here.
- **NIH Grant ID pattern** — the lexical pattern for `NihGrantIri` is currently unspecified.
- **`AttributeValueField` name validation** — attribute names are not fixed at schema definition time and cannot be structurally validated against the schema.

## Open Questions

- Which validation rules should be mandatory in the core specification versus deferred to profile-specific extensions?
