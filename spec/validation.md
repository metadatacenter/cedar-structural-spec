# Validation

## Overview

Validation in the CEDAR Template Model consists of structural conformance to the abstract grammar and satisfaction of well-formedness conditions that are not expressed directly in grammar productions. The [Canonical Validation Algorithm](#canonical-validation-algorithm) section defines a two-phase procedural algorithm that operationalises all normative rules in this document.

## Well-Formedness Conditions

### EmbeddedArtifactKey Uniqueness

Within a single `Template`, each `EmbeddedArtifact` MUST have a unique `EmbeddedArtifactKey`. The uniqueness constraint is local to that template level and does not extend across nested template boundaries. Accordingly, an embedded template MAY contain `EmbeddedArtifactKey` values that are identical to keys used in its containing template, because each template defines its own local key space.

Each `EmbeddedArtifactKey` MUST be an ASCII identifier without whitespace.

### Embedding References

Each `EmbeddedField` MUST reference a `Field`.

Each `EmbeddedTemplate` MUST reference a `Template`.

Each `EmbeddedPresentationComponent` MUST reference a `PresentationComponent`.

### Cardinality Consistency

If an embedding defines minimum and maximum cardinality, the minimum cardinality MUST NOT exceed the maximum cardinality.

`ValueRequirement` and `Cardinality` are orthogonal: `ValueRequirement` governs whether any values must be supplied at all; `Cardinality` governs the permitted count if values are supplied.

If an embedding is marked `Required`, its minimum cardinality MUST be at least one. For `EmbeddedTemplate`, this means at least one `NestedTemplateInstance` keyed to that embedding MUST be present in the `TemplateInstance`.

If an embedding is marked `Recommended`, absence of a value MUST NOT by itself cause conformance failure, though implementations MAY issue warnings or other authoring guidance.

If an embedding is marked `Optional`, absence of a value MUST NOT by itself cause conformance failure.

If values are present for a `Recommended` or `Optional` embedding, their count MUST satisfy the `Cardinality` constraints of that embedding.

### Cardinality Defaults and Multiplicity

When `Cardinality` is absent from an `EmbeddedArtifact`, the implied default cardinality is `min_cardinality(1)` with `max_cardinality(1)`: the embedded artifact MUST appear exactly once.

An `EmbeddedField` is **single-valued** if its effective maximum cardinality is `max_cardinality(1)`.

An `EmbeddedField` is **multi-valued** if its effective maximum cardinality is greater than one or is `UnboundedCardinality`.

### Versioning

`Version` and `ModelVersion` MUST conform to Semantic Versioning 2.0.0.

`Status` MUST be either `draft` or `published`.

### Instance Alignment

Each `FieldValue` in a `TemplateInstance` MUST reference the `EmbeddedArtifactKey` of an `EmbeddedField` in the referenced `Template`.

Each `NestedTemplateInstance` in a `TemplateInstance` MUST reference the `EmbeddedArtifactKey` of an `EmbeddedTemplate` in the referenced `Template`.

`TemplateInstance` MUST NOT contain an `InstanceValue` for an `EmbeddedPresentationComponent`.

### Field Type Compatibility

Values in a `FieldValue` MUST satisfy the `FieldType` and any field-type-specific properties of the referenced `Field`.

The contained values MUST follow the `FieldType`-to-`Value` correspondence defined in `spec/grammar.md`. In particular:

- `TextFieldType` values MUST be `TextValue`
- `NumericFieldType` values MUST be `NumericValue`
- `DateFieldType` values MUST be `DateValue`
- `TimeFieldType` values MUST be `TimeValue`
- `DateTimeFieldType` values MUST be `DateTimeValue`
- `ControlledTermFieldType` values MUST be `ControlledTermValue`
- `ChoiceFieldType` values MUST be `ChoiceValue`
- `LinkFieldType` values MUST be `LinkValue`
- `EmailFieldType` values MUST be `EmailValue`
- `PhoneNumberFieldType` values MUST be `PhoneNumberValue`
- `OrcidFieldType` values MUST be `OrcidValue`
- `RorFieldType` values MUST be `RorValue`
- `DoiFieldType` values MUST be `DoiValue`
- `PubMedIdFieldType` values MUST be `PubMedIdValue`
- `RridFieldType` values MUST be `RridValue`
- `NihGrantIdFieldType` values MUST be `NihGrantIdValue`
- `AttributeValueFieldType` values MUST be `AttributeValue`

Additional well-formedness conditions apply as follows.

For text values:

- `TextValue` MUST contain `TextLiteral`
- `TextDefaultValue`, if present, MUST be a `TextValue`
- if both `MinLength` and `MaxLength` are present, `MinLength` MUST NOT exceed `MaxLength`
- if `MinLength` is present, each `TextLiteral` lexical form MUST have length greater than or equal to that minimum
- if `MaxLength` is present, each `TextLiteral` lexical form MUST have length less than or equal to that maximum
- if `ValidationRegex` is present, each `TextLiteral` lexical form MUST match that regular expression
- `TextDefaultValue`, if present, MUST satisfy any defined `MinLength`, `MaxLength`, and `ValidationRegex`

For numeric values:

- `NumericValue` MUST contain `NumericLiteral`
- `NumericLiteral` uses `NumericDatatypeIri`
- if both `NumericMinValue` and `NumericMaxValue` are present, `NumericMinValue` MUST NOT exceed `NumericMaxValue`
- if `NumericMinValue` is present, each `NumericLiteral` value MUST be greater than or equal to that minimum
- if `NumericMaxValue` is present, each `NumericLiteral` value MUST be less than or equal to that maximum
- `NumericDefaultValue`, if present, MUST satisfy any defined `NumericMinValue` and `NumericMaxValue`

For date values:

- `DateFieldType` with `YearValueType` MUST use `YearValue`, which MUST contain `YearLiteral`
- `YearLiteral` uses `YearDatatypeIri`
- `DateFieldType` with `YearMonthValueType` MUST use `YearMonthValue`, which MUST contain `YearMonthLiteral`
- `YearMonthLiteral` uses `YearMonthDatatypeIri`
- `DateFieldType` with `FullDateValueType` MUST use `FullDateValue`, which MUST contain `FullDateLiteral`
- `FullDateLiteral` uses `DateDatatypeIri`

For time values:

- `TimeValue` MUST contain `TimeLiteral`
- `TimeLiteral` uses `TimeDatatypeIri`
- `TimeFieldType` values MUST conform to any stated `TimePrecision`

For date-time values:

- `DateTimeValue` MUST contain `DateTimeLiteral`
- `DateTimeLiteral` uses `DateTimeDatatypeIri`
- `DateTimeFieldType` values MUST conform to the stated `DateTimeValueType`

For choice values:

- A `FieldValue` for a `LiteralSingleChoiceFieldType` or `LiteralMultipleChoiceFieldType` MUST contain `LiteralChoiceValue` constructs
- A `FieldValue` for a `ControlledTermSingleChoiceFieldType` or `ControlledTermMultipleChoiceFieldType` MUST contain `ControlledTermChoiceValue` constructs
- each contained `ChoiceValue` MUST match one of the declared options of the referenced field's choice field type

A `LiteralChoiceValue` matches a `LiteralChoiceOption` if and only if the two `Literal` values are term-equal: their lexical forms and their datatype IRIs or language tags compare equal character by character.

A `ControlledTermChoiceValue` matches a `ControlledTermChoiceOption` if and only if the `TermIri` of the `ControlledTermValue` carried by the value equals the `TermIri` of the `ControlledTermValue` carried by the option.

For controlled-term values:

- `ControlledTermValue` MUST include a term identifier and SHOULD include a human-readable label

For contact values:

- `EmailValue` MUST contain a `StringLiteral`
- `PhoneNumberValue` MUST contain a `StringLiteral`

For external authority values:

- `OrcidValue` MUST include an `OrcidIri`
- `RorValue` MUST include a `RorIri`
- `DoiValue` MUST include a `DoiIri`
- `PubMedIdValue` MUST include a `PubMedIri`
- `RridValue` MUST include an `RridIri`
- `NihGrantIdValue` MUST include a `NihGrantIri`
- these values MAY additionally include a human-readable `Label`

For literals generally:

- `DatatypeIriLiteral` lexical forms SHOULD be in Unicode Normalization Form C
- `LangStringLiteral` lexical forms SHOULD be in Unicode Normalization Form C
- `StringLiteral` MUST denote an RDF literal with datatype IRI `http://www.w3.org/2001/XMLSchema#string`
- `LangStringLiteral` language tags MUST be non-empty and well-formed according to BCP 47

For typed defaults:

- `NumericDefaultValue`, if present, MUST contain `NumericValue`
- `DateDefaultValue`, if present, MUST contain `DateValue`
- `TimeDefaultValue`, if present, MUST contain `TimeValue`
- `DateTimeDefaultValue`, if present, MUST contain `DateTimeValue`
- `ControlledTermDefaultValue`, if present, MUST contain `ControlledTermValue`
- `ChoiceDefaultValue`, if present, MUST contain one or more `ChoiceValue` constructs
- `LinkDefaultValue`, if present, MUST contain `LinkValue`
- `EmailDefaultValue`, if present, MUST contain `EmailValue`
- `PhoneNumberDefaultValue`, if present, MUST contain `PhoneNumberValue`
- `OrcidDefaultValue`, if present, MUST contain `OrcidValue`
- `RorDefaultValue`, if present, MUST contain `RorValue`
- `DoiDefaultValue`, if present, MUST contain `DoiValue`
- `PubMedIdDefaultValue`, if present, MUST contain `PubMedIdValue`
- `RridDefaultValue`, if present, MUST contain `RridValue`
- `NihGrantIdDefaultValue`, if present, MUST contain `NihGrantIdValue`
- `ChoiceDefaultValue` for an `EmbeddedSingleChoiceField` MUST contain exactly one `ChoiceValue`

For multiplicity:

- if an `EmbeddedField` is single-valued, its corresponding `FieldValue` MUST NOT contain more than one value
- if an `EmbeddedField` is multi-valued, the number of values in its `FieldValue` MUST satisfy the embedding cardinality constraints
- if an `EmbeddedTemplate` has multiplicity greater than one, the number of corresponding `NestedTemplateInstance` constructs MUST satisfy the embedding cardinality constraints


### Rendering Hint Compatibility

Any rendering hint used by the model MUST be compatible with the associated `FieldType`.

`TextRenderingHint` MUST be used only with `TextFieldType`.

`SingleChoiceRenderingHint` MUST be used only with `SingleChoiceFieldType`.

`MultipleChoiceRenderingHint` MUST be used only with `MultipleChoiceFieldType`.

`NumericRenderingHint` MUST be used only with `NumericFieldType`.

`DateRenderingHint` MUST be used only with `DateFieldType`.

`TimeRenderingHint` MUST be used only with `TimeFieldType`.

`DateTimeRenderingHint` MUST be used only with `DateTimeFieldType`.

### Controlled Term Value Structure

If a value conforms to `ControlledTermFieldType`, the value MUST include a term identifier and SHOULD include a human-readable label.

A `ControlledTermDefaultValue`, if present, MUST contain a `ControlledTermValue` whose `TermIri` identifies a term drawn from one of the declared `ControlledTermSource` entries of the referenced `ControlledTermFieldType`.

## Canonical Validation Algorithm

The canonical validation algorithm consists of two phases that MUST be applied in order. **Phase 1** validates the well-formedness of a `Template` and the artifacts it references. **Phase 2** validates that a `TemplateInstance` conforms to a well-formed `Template`. Phase 2 MUST NOT be applied unless Phase 1 has passed without error.

Both phases are defined as error-collecting: all violations MUST be reported rather than stopping at the first failure. Implementations MAY additionally offer a fail-fast mode for performance, but the set of errors reported MUST be a subset of those that the collecting mode would report.

The algorithm is expressed as a set of named subroutines. Each subroutine takes typed inputs and produces a (possibly empty) set of errors. `Verify` denotes a hard constraint: failure produces an error. `Warn` denotes a SHOULD constraint: failure produces a warning. The notation `count(X)` denotes the number of elements of kind `X`, and `len(s)` denotes the length in characters of string `s`.

---

### Phase 1: Schema Validation

#### Entry Point

##### `validate_schema(T: Template)`

Entry point for schema validation.

1. Run `validate_artifact_metadata(T.schema_artifact_metadata)`.
2. Let `fields` = the set of `Field` artifacts referenced by `EmbeddedField` constructs in `T`.
3. For each `F` in `fields`: run `validate_artifact_metadata(F.schema_artifact_metadata)` and `validate_field_type(F.field_type)`.
4. Let `pcs` = the set of `PresentationComponent` artifacts referenced by `EmbeddedPresentationComponent` constructs in `T`.
5. For each `PC` in `pcs`: run `validate_artifact_metadata(PC.artifact_metadata)`.
6. Run `validate_embedded_artifact_keys(T)`.
7. For each `E` in `T.embedded_artifacts`:
   1. Run `validate_embedding_reference(E)`.
   2. Run `validate_cardinality_consistency(E)`.
   3. If `E` is an `EmbeddedField`: run `validate_rendering_hints(E)`.
   4. If `E` has a `DefaultValue`: run `validate_default_value(E.default_value, E)`.
   5. If `E` is an `EmbeddedTemplate`: run `validate_schema(E.referenced_template)`.

---

#### Metadata and Key Validation

##### `validate_artifact_metadata(M: SchemaArtifactMetadata)`

Applies the [Versioning](#versioning) rules.

1. Let `v` = `M.versioning_metadata.version`. Verify `v` is a well-formed Semantic Versioning 2.0.0 string.
2. Let `mv` = `M.versioning_metadata.model_version`. Verify `mv` is a well-formed Semantic Versioning 2.0.0 string.
3. Let `s` = `M.versioning_metadata.status`. Verify `s ∈ { draft, published }`.

---

##### `validate_embedded_artifact_keys(T: Template)`

Applies the [EmbeddedArtifactKey Uniqueness](#embeddedartifactkey-uniqueness) rules.

1. Let `keys` = the sequence of `EmbeddedArtifactKey` values across all `EmbeddedArtifact` constructs in `T`.
2. For each key `k` in `keys`: verify `k` matches the pattern `[A-Za-z][A-Za-z0-9_-]*`.
3. Verify all values in `keys` are distinct: for each pair `(k₁, k₂)` where `k₁ ≠ k₂` as positions but `k₁ = k₂` as values, report a duplicate-key error. Key uniqueness is scoped to `T`; the same key may appear in a nested template without conflict.

---

#### Reference and Cardinality Validation

##### `validate_embedding_reference(E: EmbeddedArtifact)`

Applies the [Embedding References](#embedding-references) rules.

1. If `E` is an `EmbeddedTextField`: verify `E.reference` is a `TextFieldId` identifying an existing `TextField`.
2. If `E` is an `EmbeddedNumericField`: verify `E.reference` is a `NumericFieldId` identifying an existing `NumericField`.
3. If `E` is an `EmbeddedDateField`: verify `E.reference` is a `DateFieldId` identifying an existing `DateField`.
4. If `E` is an `EmbeddedTimeField`: verify `E.reference` is a `TimeFieldId` identifying an existing `TimeField`.
5. If `E` is an `EmbeddedDateTimeField`: verify `E.reference` is a `DateTimeFieldId` identifying an existing `DateTimeField`.
6. If `E` is an `EmbeddedControlledTermField`: verify `E.reference` is a `ControlledTermFieldId` identifying an existing `ControlledTermField`.
7. If `E` is an `EmbeddedSingleChoiceField`: verify `E.reference` is a `SingleChoiceFieldId` identifying an existing `SingleChoiceField`.
8. If `E` is an `EmbeddedMultipleChoiceField`: verify `E.reference` is a `MultipleChoiceFieldId` identifying an existing `MultipleChoiceField`.
9. If `E` is an `EmbeddedLinkField`: verify `E.reference` is a `LinkFieldId` identifying an existing `LinkField`.
10. If `E` is an `EmbeddedEmailField`: verify `E.reference` is an `EmailFieldId` identifying an existing `EmailField`.
11. If `E` is an `EmbeddedPhoneNumberField`: verify `E.reference` is a `PhoneNumberFieldId` identifying an existing `PhoneNumberField`.
12. If `E` is an `EmbeddedOrcidField`: verify `E.reference` is an `OrcidFieldId` identifying an existing `OrcidField`.
13. If `E` is an `EmbeddedRorField`: verify `E.reference` is a `RorFieldId` identifying an existing `RorField`.
14. If `E` is an `EmbeddedDoiField`: verify `E.reference` is a `DoiFieldId` identifying an existing `DoiField`.
15. If `E` is an `EmbeddedPubMedIdField`: verify `E.reference` is a `PubMedIdFieldId` identifying an existing `PubMedIdField`.
16. If `E` is an `EmbeddedRridField`: verify `E.reference` is an `RridFieldId` identifying an existing `RridField`.
17. If `E` is an `EmbeddedNihGrantIdField`: verify `E.reference` is a `NihGrantIdFieldId` identifying an existing `NihGrantIdField`.
18. If `E` is an `EmbeddedAttributeValueField`: verify `E.reference` is an `AttributeValueFieldId` identifying an existing `AttributeValueField`.
19. If `E` is an `EmbeddedTemplate`: verify `E.reference` is a `TemplateId` identifying an existing `Template`.
20. If `E` is an `EmbeddedPresentationComponent`: verify `E.reference` is a `PresentationComponentId` identifying an existing `PresentationComponent`.

---

##### `validate_cardinality_consistency(E: EmbeddedArtifact)`

Applies the [Cardinality Consistency](#cardinality-consistency) rules.

1. Let `min` = `E.cardinality.min_cardinality` if `E.cardinality` is present, else `1`.
2. Let `max` = `E.cardinality.max_cardinality` if `E.cardinality` is present, else `1`. If `max` is `UnboundedCardinality`, let `max = ∞`.
3. Verify `min ≤ max`.
4. Let `req` = `E.value_requirement` if present, else `Optional`.
5. If `req = Required`: verify `min ≥ 1`.

---

#### Field Type Validation

Applies the [Field Type Compatibility](#field-type-compatibility) rules. See also [Field Types](grammar.md#field-types) in the abstract grammar.

##### `validate_field_type(FT: FieldType)`

Dispatch on the kind of `FT`:

- If `FT` is `TextFieldType`: run `validate_text_field_type(FT)`.
- If `FT` is `NumericFieldType`: run `validate_numeric_field_type(FT)`.
- If `FT` is `SingleChoiceFieldType` or `MultipleChoiceFieldType`: run `validate_choice_field_type(FT)`.
- All other field types have no additional schema-level well-formedness checks beyond structural grammar conformance.

---

##### `validate_text_field_type(FT: TextFieldType)`

1. If both `FT.min_length` and `FT.max_length` are present: verify `FT.min_length ≤ FT.max_length`.

---

##### `validate_numeric_field_type(FT: NumericFieldType)`

1. If both `FT.min_value` and `FT.max_value` are present: verify `FT.min_value ≤ FT.max_value`.

---

##### `validate_choice_field_type(FT: ChoiceFieldType)`

1. For each option `O` in `FT.options`:
   1. Verify `O.value` is of structural form `Literal`, `ControlledTermValue`, or `Iri`.

---

#### Default Value Validation

##### `validate_default_value(D: DefaultValue, E: EmbeddedArtifact)`

Let `FT` = the `FieldType` of the `Field` referenced by `E`.

1. Verify `D` is of the correct type for `FT`: e.g. `TextDefaultValue` for `TextFieldType`, `NumericDefaultValue` for `NumericFieldType`, etc.
2. If `D` is `TextDefaultValue`:
   1. Let `s` = `D.text_value.text_literal.lexical_form`.
   2. If `FT.min_length` is present: verify `len(s) ≥ FT.min_length`.
   3. If `FT.max_length` is present: verify `len(s) ≤ FT.max_length`.
   4. If `FT.validation_regex` is present: verify `s` matches `FT.validation_regex`.
3. If `D` is `NumericDefaultValue`:
   1. Let `n` = the numeric value of `D.numeric_value.numeric_literal`.
   2. If `FT.min_value` is present: verify `n ≥ FT.min_value`.
   3. If `FT.max_value` is present: verify `n ≤ FT.max_value`.
4. If `D` is `ChoiceDefaultValue` and `E` is an `EmbeddedSingleChoiceField`:
   1. Verify `count(D.choice_values) = 1`.

---

#### Rendering Hint Validation

##### `validate_rendering_hints(E: EmbeddedField)`

Applies the [Rendering Hint Compatibility](#rendering-hint-compatibility) rules.

Let `FT` = the `FieldType` of the `Field` referenced by `E`.

1. If `E` carries a `TextRenderingHint`: verify `FT` is `TextFieldType`.
2. If `E` carries a `SingleChoiceRenderingHint`: verify `FT` is `SingleChoiceFieldType`.
3. If `E` carries a `MultipleChoiceRenderingHint`: verify `FT` is `MultipleChoiceFieldType`.
4. If `E` carries a `NumericRenderingHint`: verify `FT` is `NumericFieldType`.
5. If `E` carries a `DateRenderingHint`: verify `FT` is `DateFieldType`.
6. If `E` carries a `TimeRenderingHint`: verify `FT` is `TimeFieldType`.
7. If `E` carries a `DateTimeRenderingHint`: verify `FT` is `DateTimeFieldType`.

---

### Phase 2: Instance Validation

#### Entry Point

##### `validate_instance(I: TemplateInstance, T: Template)`

Entry point for instance validation.

1. Run `validate_instance_alignment(I, T)`.
2. Run `validate_field_presence_and_cardinality(I, T)`.
3. For each `FV` in `I.instance_values` where `FV` is a `FieldValue`:
   1. Let `EF` = the `EmbeddedField` in `T` whose key = `FV.key`.
   2. Run `validate_field_value(FV, EF)`.
4. Run `validate_nested_template_presence_and_cardinality(I, T)`.
5. For each `NTI` in `I.instance_values` where `NTI` is a `NestedTemplateInstance`:
   1. Let `ET` = the `EmbeddedTemplate` in `T` whose key = `NTI.key`.
   2. Let `RT` = the `Template` identified by `ET.reference`.
   3. Run `validate_instance(NTI, RT)`.

---

#### Structural Alignment

##### `validate_instance_alignment(I: TemplateInstance, T: Template)`

Applies the [Instance Alignment](#instance-alignment) rules.

1. Let `field_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedField }`.
2. Let `template_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedTemplate }`.
3. Let `pc_keys` = `{ E.key | E ∈ T.embedded_artifacts, E is EmbeddedPresentationComponent }`.
4. For each `FV` in `I.instance_values` where `FV` is a `FieldValue`: verify `FV.key ∈ field_keys`.
5. For each `NTI` in `I.instance_values` where `NTI` is a `NestedTemplateInstance`: verify `NTI.key ∈ template_keys`.
6. For each `IV` in `I.instance_values`: verify `IV.key ∉ pc_keys`.

---

#### Field Presence and Cardinality

##### `validate_field_presence_and_cardinality(I: TemplateInstance, T: Template)`

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `EF` in `T.embedded_artifacts` where `EF` is an `EmbeddedField`:

1. Let `eff_min` = `EF.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `EF.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `EF.value_requirement` if present, else `Optional`.
4. Let `FV` = the `FieldValue` in `I` with key = `EF.key`, or `absent` if none exists.
5. If `req = Required`:
   1. Verify `FV ≠ absent`.
   2. Verify `count(FV.values) ≥ eff_min`.
   3. If `eff_max ≠ ∞`: verify `count(FV.values) ≤ eff_max`.
6. If `req = Recommended` or `req = Optional`:
   1. If `FV ≠ absent`:
      1. Verify `count(FV.values) ≥ eff_min`.
      2. If `eff_max ≠ ∞`: verify `count(FV.values) ≤ eff_max`.

---

#### Field Value Validation

##### `validate_field_value(FV: FieldValue, EF: EmbeddedField)`

1. Let `FT` = the `FieldType` of the `Field` referenced by `EF`.
2. For each `V` in `FV.values`: run `validate_value(V, FT)`.

---

##### `validate_value(V: Value, FT: FieldType)`

Dispatch on the kind of `FT`:

- `TextFieldType` → `validate_text_value(V, FT)`
- `NumericFieldType` → `validate_numeric_value(V, FT)`
- `DateFieldType` → `validate_date_value(V, FT)`
- `TimeFieldType` → `validate_time_value(V, FT)`
- `DateTimeFieldType` → `validate_datetime_value(V, FT)`
- `ControlledTermFieldType` → `validate_controlled_term_value(V, FT)`
- `SingleChoiceFieldType` or `MultipleChoiceFieldType` → `validate_choice_value(V, FT)`
- `LinkFieldType` → `validate_link_value(V)`
- `EmailFieldType` or `PhoneNumberFieldType` → `validate_contact_value(V)`
- `OrcidFieldType`, `RorFieldType`, `DoiFieldType`, `PubMedIdFieldType`, `RridFieldType`, or `NihGrantIdFieldType` → `validate_external_authority_value(V, FT)`
- `AttributeValueFieldType` → `validate_attribute_value(V)`

---

##### `validate_text_value(V: TextValue, FT: TextFieldType)`

1. Verify `V` contains a `TextLiteral`. Let `s` = its lexical form.
2. If `FT.min_length` is present: verify `len(s) ≥ FT.min_length`.
3. If `FT.max_length` is present: verify `len(s) ≤ FT.max_length`.
4. If `FT.validation_regex` is present: verify `s` matches `FT.validation_regex`.

---

##### `validate_numeric_value(V: NumericValue, FT: NumericFieldType)`

1. Verify `V` contains a `NumericLiteral`. Let `n` = its numeric value and `d` = its datatype IRI.
2. Verify `d = FT.datatype_iri`.
3. If `FT.min_value` is present: verify `n ≥ FT.min_value`.
4. If `FT.max_value` is present: verify `n ≤ FT.max_value`.

---

##### `validate_date_value(V: DateValue, FT: DateFieldType)`

1. If `FT.date_value_type = YearValueType`: verify `V` is a `YearValue` containing a `YearLiteral`.
2. If `FT.date_value_type = YearMonthValueType`: verify `V` is a `YearMonthValue` containing a `YearMonthLiteral`.
3. If `FT.date_value_type = FullDateValueType`: verify `V` is a `FullDateValue` containing a `FullDateLiteral`.

---

##### `validate_time_value(V: TimeValue, FT: TimeFieldType)`

1. Verify `V` contains a `TimeLiteral`. Let `t` = its lexical form.
2. If `FT.time_precision = HourMinutePrecision`: verify `t` contains only hour and minute components (form `HH:MM`; no seconds or fractional seconds present).
3. If `FT.time_precision = HourMinuteSecondPrecision`: verify `t` contains hour, minute, and second components (form `HH:MM:SS`; no fractional seconds present).
4. If `FT.time_precision = HourMinuteSecondFractionPrecision`: verify `t` is a well-formed time literal; fractional seconds are permitted.
5. If `FT.time_precision` is absent: accept any well-formed `TimeLiteral`.
6. If `FT.timezone_requirement = TimezoneRequired`: verify `t` includes a timezone designator.

---

##### `validate_datetime_value(V: DateTimeValue, FT: DateTimeFieldType)`

1. Verify `V` contains a `DateTimeLiteral`. Let `dt` = its lexical form.
2. If `FT.datetime_value_type = DateHourMinuteValueType`: verify the time component of `dt` contains only hour and minute (form `…THH:MM`; no seconds present).
3. If `FT.datetime_value_type = DateHourMinuteSecondValueType`: verify the time component contains hour, minute, and second (form `…THH:MM:SS`; no fractional seconds present).
4. If `FT.datetime_value_type = DateHourMinuteSecondFractionValueType`: verify `dt` is a well-formed datetime literal; fractional seconds are permitted.
5. If `FT.timezone_requirement = TimezoneRequired`: verify `dt` includes a timezone designator.

---

##### `validate_controlled_term_value(V: ControlledTermValue, FT: ControlledTermFieldType)`

1. Verify `V.term_iri` is present.
2. Warn if `V.label` is absent.

Note: validation of `V.term_iri` against `FT.controlled_term_sources` requires an external ontology resolver and is outside the scope of this algorithm; see [Out of Scope](#out-of-scope).

---

##### `validate_choice_value(V: ChoiceValue, FT: ChoiceFieldType)`

1. Let `S` = `V.selection`.
2. Verify there exists an option `O` in `FT.options` such that `S` matches `O` according to the following rules:
   1. If `S` is a `Literal` and `O.value` is a `Literal`: match iff their lexical forms are equal character by character and their datatype IRIs or language tags are equal character by character.
   2. If `S` is a `ControlledTermValue` and `O.value` is a `ControlledTermValue`: match iff `S.term_iri = O.value.term_iri`.
   3. If `S` is an `Iri` and `O.value` is an `Iri`: match iff `S = O.value`.
   4. If `S` is a `ControlledTermValue` and `O.value` is an `Iri`: match iff `S.term_iri = O.value`.
   5. If `S` is an `Iri` and `O.value` is a `ControlledTermValue`: match iff `S = O.value.term_iri`.
   6. Otherwise: no match.
3. If no such `O` exists: report error.

---

##### `validate_link_value(V: LinkValue)`

1. Verify `V.iri` is present and is a well-formed IRI.

---

##### `validate_contact_value(V: ContactValue)`

1. If `V` is an `EmailValue`: verify `V` contains a `StringLiteral`.
2. If `V` is a `PhoneNumberValue`: verify `V` contains a `StringLiteral`.

---

##### `validate_external_authority_value(V: ExternalAuthorityValue, FT: ExternalAuthorityFieldType)`

1. If `FT` is `OrcidFieldType`: verify `V` contains an `OrcidIri` whose lexical form matches `https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{3}[0-9X]`.
2. If `FT` is `RorFieldType`: verify `V` contains a `RorIri` whose lexical form matches `https://ror\.org/0[a-hj-km-np-tv-z0-9]{6}[0-9]{2}`.
3. If `FT` is `DoiFieldType`: verify `V` contains a `DoiIri` whose lexical form matches `https://doi\.org/10\.\d{4,9}/.+`.
4. If `FT` is `PubMedIdFieldType`: verify `V` contains a `PubMedIri` whose lexical form matches `https://pubmed\.ncbi\.nlm\.nih\.gov/\d+`.
5. If `FT` is `RridFieldType`: verify `V` contains an `RridIri` whose lexical form matches `https://identifiers\.org/RRID:[A-Z]+_\d+`.
6. If `FT` is `NihGrantIdFieldType`: verify `V` contains a `NihGrantIri`. No pattern check is applied; see [Out of Scope](#out-of-scope).

---

##### `validate_attribute_value(V: AttributeValue)`

1. Verify `V.name` is present and contains a non-empty `UnicodeString`.
2. Verify `V.value` is present and is a well-formed `Value`.
3. If `V.value` is an `AttributeValue`: run `validate_attribute_value(V.value)`.

---

#### Nested Template Validation

##### `validate_nested_template_presence_and_cardinality(I: TemplateInstance, T: Template)`

Applies the [Cardinality Consistency](#cardinality-consistency) and [Cardinality Defaults and Multiplicity](#cardinality-defaults-and-multiplicity) rules.

For each `ET` in `T.embedded_artifacts` where `ET` is an `EmbeddedTemplate`:

1. Let `eff_min` = `ET.cardinality.min_cardinality` if present, else `1`.
2. Let `eff_max` = `ET.cardinality.max_cardinality` if present, else `1`. If `eff_max` is `UnboundedCardinality`, let `eff_max = ∞`.
3. Let `req` = `ET.value_requirement` if present, else `Optional`.
4. Let `n` = `count({ NTI | NTI ∈ I.instance_values, NTI is NestedTemplateInstance, NTI.key = ET.key })`.
5. If `req = Required`:
   1. Verify `n ≥ eff_min`.
   2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.
6. If `req = Recommended` or `req = Optional`:
   1. If `n > 0`:
      1. Verify `n ≥ eff_min`.
      2. If `eff_max ≠ ∞`: verify `n ≤ eff_max`.

---

### Out of Scope

The following checks are outside the scope of the canonical algorithm and are not required for conformance:

- **`ControlledTermSource` membership** — verifying that a `ControlledTermValue`'s `TermIri` is drawn from a declared ontology, branch, class set, or value set requires an external ontology resolver and is not defined here.
- **NIH Grant ID pattern** — the lexical pattern for `NihGrantIri` is currently unspecified.
- **`AttributeValueField` name validation** — attribute names are not fixed at schema definition time and cannot be structurally validated against the schema.

## Validation Scope

This specification defines two conformance phases: schema validation (Phase 1) and instance validation (Phase 2), as described in the Canonical Validation Algorithm section above.

## Open Questions

- Which validation rules should be mandatory in the core specification versus deferred to profile-specific extensions?
