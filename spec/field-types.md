# Field Types

## Overview

`FieldType` defines the semantic category of values that a `Field` may carry.

`FieldType` describes value meaning and structure. It does not, by itself, define presentation behavior.

## FieldType Variants

This specification defines the following `FieldType` variants:

- `TextFieldType`
- `NumericFieldType`
- `TemporalFieldType`
- `ControlledTermFieldType`
- `ChoiceFieldType`
- `LinkFieldType`
- `ContactFieldType`
- `ExternalAuthorityFieldType`
- `AttributeValueFieldType`

This specification refines several of these variants into more specific forms.

`TextFieldType` has two forms:

- `SingleLineTextFieldType`
- `MultiLineTextFieldType`

`ChoiceFieldType` has four forms:

- `RadioChoiceFieldType`
- `CheckboxChoiceFieldType`
- `SingleSelectChoiceFieldType`
- `MultiSelectChoiceFieldType`

`ContactFieldType` has two forms:

- `EmailFieldType`
- `PhoneNumberFieldType`

`ExternalAuthorityFieldType` has six forms:

- `ORCIDFieldType`
- `RORFieldType`
- `DOIFieldType`
- `PubMedIDFieldType`
- `RRIDFieldType`
- `NIHGrantIDFieldType`

## Intrinsic Constraints

A `Field` MAY define `FieldIntrinsicConstraint` constructs in addition to its `FieldType`.

`FieldIntrinsicConstraint` expresses restrictions that are intrinsic to the meaning of the field value. Examples include value ranges, string length constraints, temporal bounds, and controlled value restrictions.

Examples of intrinsic constraints include:

- minimum and maximum text length
- regular expression constraints for textual values
- numeric minimum and maximum bounds
- decimal precision constraints
- temporal bounds
- restrictions on controlled term selection

## Rendering Hints

Rendering hints influence presentation behavior but do not change the semantic meaning of a `FieldType`.

Rendering hints MUST be compatible with the associated `FieldType`. Invalid combinations, such as a choice-oriented hint applied to `TextFieldType`, MUST be rejected by conforming implementations.

## Variant Notes

`TextFieldType` is used for textual values. `SingleLineTextFieldType` is intended for short text, while `MultiLineTextFieldType` is intended for longer textual content.

`NumericFieldType` is used for numeric values. It may specify a numeric datatype, unit association, and numeric precision.

`TemporalFieldType` is used for date-like or time-like values. It may specify temporal datatype, temporal granularity, time format, and whether timezone capture is enabled.

`ControlledTermFieldType` is used for values drawn from a controlled terminology or ontology-backed source.

Controlled term sources may be defined as:

- ontology-wide selection
- branch-restricted selection
- explicitly enumerated classes
- curated value sets

`ChoiceFieldType` is used for values chosen from an explicit set of options. The specific choice form determines whether selection is single or multiple and how the choice set is presented.

`LinkFieldType` is used for link-like values.

`ContactFieldType` is used for contact-oriented values such as email addresses and phone numbers.

`ExternalAuthorityFieldType` is used for externally meaningful identifiers from external authority systems such as ORCID, ROR, DOI, PubMed ID, RRID, and NIH Grant ID.

`AttributeValueFieldType` is used for attribute-value style structures where the value itself has internal pairing semantics.

## Embedding-Specific Field Behavior

The following properties are not intrinsic parts of a reusable `Field` and therefore belong to `EmbeddedField` rather than `Field`:

- `EmbeddedArtifactKey`
- value requirement
- cardinality
- visibility
- default value
- label override

## Open Questions

- Should reusable option sets for `ChoiceFieldType` be represented as first-class artifacts?
- Should the specification define a normative taxonomy of rendering hints in this document or defer that to a later extension?
