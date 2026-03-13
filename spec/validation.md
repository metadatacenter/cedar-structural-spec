# Validation

## Overview

Validation in the CEDAR Template Model consists of structural conformance to the abstract grammar and satisfaction of well-formedness conditions that are not expressed directly in grammar productions.

## Well-Formedness Conditions

### EmbeddedArtifactKey Uniqueness

Within a `Template`, each `EmbeddedArtifact` MUST have a unique `EmbeddedArtifactKey`.

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

Values in a `FieldValue` MUST satisfy the `FieldType` and any `FieldIntrinsicConstraint` of the referenced `Field`.

If the referenced `Field` has `TextFieldType`, each contained value MUST be `TextValue`.

If a contained value is `TextValue`, it MUST contain `TextLiteral`.

If a `TextFieldType` defines `TextDefaultValue`, that default value MUST be a `TextValue`.

If a `TextFieldType` defines both `MinLength` and `MaxLength`, the minimum length MUST NOT exceed the maximum length.

If a `TextFieldType` defines `MinLength`, each contained `TextLiteral` lexical form MUST have length greater than or equal to that minimum length.

If a `TextFieldType` defines `MaxLength`, each contained `TextLiteral` lexical form MUST have length less than or equal to that maximum length.

If a `TextFieldType` defines `ValidationRegex`, each contained `TextLiteral` lexical form MUST match that regular expression.

If a `TextFieldType` defines `TextDefaultValue`, that default value MUST satisfy any defined `MinLength`, `MaxLength`, and `ValidationRegex`.

If the referenced `Field` has `NumericFieldType`, each contained value MUST be `NumericValue`.

If a contained value is `NumericValue`, it MUST contain `NumericLiteral`.

If a contained value is `NumericLiteral`, its datatype IRI is given by `NumericDatatypeIri`.

If the referenced `Field` has `DateFieldType`, each contained value MUST be `DateValue`.

If a contained value is `DateValue`, it MUST contain `DateLiteral`.

If a contained value is `DateLiteral`, its datatype IRI is given by `DateDatatypeIri`.

If the referenced `Field` has `TimeFieldType`, each contained value MUST be `TimeValue`.

If a contained value is `TimeValue`, it MUST contain `TimeLiteral`.

If a contained value is `TimeLiteral`, its datatype IRI is given by `TimeDatatypeIri`.

If the referenced `Field` has `DateTimeFieldType`, each contained value MUST be `DateTimeValue`.

If a contained value is `DateTimeValue`, it MUST contain `DateTimeLiteral`.

If a contained value is `DateTimeLiteral`, its datatype IRI is given by `DateTimeDatatypeIri`.

If the referenced `Field` has `ControlledTermFieldType`, each contained value MUST be `ControlledTermValue`.

If the referenced `Field` has `ChoiceFieldType`, each contained value MUST be `ChoiceValue`.

If a contained `ChoiceValue` is present, its `ChoiceSelection` MUST be either a `Literal` or a `ControlledTermValue`.

If the referenced `Field` has `LinkFieldType`, each contained value MUST be `LinkValue`.

If the referenced `Field` has `ContactFieldType`, each contained value MUST be `ContactValue`.

If the referenced `Field` has `ExternalAuthorityFieldType`, each contained value MUST be `ExternalAuthorityValue`.

If the referenced `Field` has `AttributeValueFieldType`, each contained value MUST be `AttributeValue`.

If a contained value includes `DatatypeIriLiteral`, the lexical form SHOULD be in Unicode Normalization Form C.

If a contained value includes `LangStringLiteral`, the lexical form SHOULD be in Unicode Normalization Form C.

If a contained value includes `LangStringLiteral`, its language tag MUST be non-empty and well-formed according to BCP 47.

If an `EmbeddedField` is single-valued, its corresponding `FieldValue` MUST NOT contain more than one value.

If an `EmbeddedField` is multi-valued, the number of values in its `FieldValue` MUST satisfy the embedding cardinality constraints.

If an `EmbeddedTemplate` has multiplicity greater than one, the number of corresponding `NestedTemplateInstance` constructs MUST satisfy the embedding cardinality constraints.

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
