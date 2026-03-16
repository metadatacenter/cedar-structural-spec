# Validation

## Overview

Validation in the CEDAR Template Model consists of structural conformance to the abstract grammar and satisfaction of well-formedness conditions that are not expressed directly in grammar productions.

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

If an embedding is marked `Required`, its minimum cardinality MUST be at least one.

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
- `ContactFieldType` values MUST be `ContactValue`
- `ExternalAuthorityFieldType` values MUST be `ExternalAuthorityValue`
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

- `ChoiceValue` MUST contain `ChoiceSelection`
- `ChoiceSelection` MUST be either a `Literal` or a `ControlledTermValue`

For controlled-term values:

- `ControlledTermValue` MUST include a term identifier and SHOULD include a human-readable label

For literals generally:

- `DatatypeIriLiteral` lexical forms SHOULD be in Unicode Normalization Form C
- `LangStringLiteral` lexical forms SHOULD be in Unicode Normalization Form C
- `LangStringLiteral` language tags MUST be non-empty and well-formed according to BCP 47

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

## Validation Scope

This specification distinguishes:

- grammar conformance
- metamodel conformance
- instance conformance
- compatibility checks such as rendering hint validation

## Open Questions

- Should this specification define separate conformance classes for schema validation and instance validation?
- Which validation rules should be mandatory in the core specification versus deferred to profile-specific extensions?
