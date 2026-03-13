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

If the referenced `Field` has `NumericFieldType`, each contained value MUST be `NumericValue`.

If the referenced `Field` has `TemporalFieldType`, each contained value MUST be `TemporalValue`.

If the referenced `Field` has `ControlledTermFieldType`, each contained value MUST be `ControlledTermValue`.

If the referenced `Field` has `ChoiceFieldType`, each contained value MUST be `ChoiceValue`.

If the referenced `Field` has `LinkFieldType`, each contained value MUST be `LinkValue`.

If the referenced `Field` has `ContactFieldType`, each contained value MUST be `ContactValue`.

If the referenced `Field` has `ExternalAuthorityFieldType`, each contained value MUST be `ExternalAuthorityValue`.

If the referenced `Field` has `AttributeValueFieldType`, each contained value MUST be `AttributeValue`.

If an `EmbeddedField` is single-valued, its corresponding `FieldValue` MUST NOT contain more than one value.

If an `EmbeddedField` is multi-valued, the number of values in its `FieldValue` MUST satisfy the embedding cardinality constraints.

If an `EmbeddedTemplate` has multiplicity greater than one, the number of corresponding `NestedTemplateInstance` constructs MUST satisfy the embedding cardinality constraints.

### Rendering Hint Compatibility

Any rendering hint used by the model MUST be compatible with the associated `FieldType`.

`TextRenderingHint` MUST be used only with `TextFieldType`.

`SingleChoiceRenderingHint` MUST be used only with `SingleChoiceFieldType`.

`MultipleChoiceRenderingHint` MUST be used only with `MultipleChoiceFieldType`.

`NumericRenderingHint` MUST be used only with `NumericFieldType`.

`TemporalRenderingHint` MUST be used only with `TemporalFieldType`.

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
