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

`ChoiceFieldType` has two semantic forms:

- `SingleChoiceFieldType`
- `MultipleChoiceFieldType`

`TemporalFieldType` has three semantic forms:

- `DateFieldType`
- `TimeFieldType`
- `DateTimeFieldType`

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

## Field-Type-Specific Properties

Constraints and other semantic properties that are intrinsic to the meaning of a field value are modeled directly on the compatible concrete `FieldType`. This keeps invalid combinations structurally unrepresentable rather than deferring compatibility to generic constraint validation.

Examples include:

- `TextDefaultValue` on `TextFieldType`
- `MinLength` on `TextFieldType`
- `MaxLength` on `TextFieldType`
- `ValidationRegex` on `TextFieldType`

Additional field-type-specific properties may be introduced in later revisions for numeric, temporal, controlled-term, choice, and external-authority fields.

## Rendering Hints

Rendering hints influence presentation behavior but do not change the semantic meaning of a `FieldType`.

This specification defines the following rendering hint categories:

- `TextRenderingHint`
- `SingleChoiceRenderingHint`
- `MultipleChoiceRenderingHint`
- `NumericRenderingHint`
- `DateRenderingHint`
- `TimeRenderingHint`
- `DateTimeRenderingHint`

Rendering hints are scoped to compatible `FieldType` families.

For strong typing, rendering hints are attached to the compatible concrete `FieldType` forms rather than to `Field` directly.

The compatible pairings are:

- `TextRenderingHint` with `TextFieldType`
- `SingleChoiceRenderingHint` with `SingleChoiceFieldType`
- `MultipleChoiceRenderingHint` with `MultipleChoiceFieldType`
- `NumericRenderingHint` with `NumericFieldType`
- `DateRenderingHint` with `DateFieldType`
- `TimeRenderingHint` with `TimeFieldType`
- `DateTimeRenderingHint` with `DateTimeFieldType`

Rendering hints MUST be compatible with the associated `FieldType`. Invalid combinations, such as `RadioRenderingHint` on `MultipleChoiceFieldType`, MUST be rejected by conforming implementations.

Rendering hints describe UI behavior only. They do not alter value semantics, field-type-specific properties, or instance interpretation.

Rendering hints are therefore represented within the relevant concrete `FieldType` definitions.

Examples of compatible combinations include:

- `TextFieldType` with `SingleLineTextRenderingHint`
- `TextFieldType` with `MultiLineTextRenderingHint`
- `SingleChoiceFieldType` with `RadioRenderingHint`
- `SingleChoiceFieldType` with `SingleSelectDropdownRenderingHint`
- `MultipleChoiceFieldType` with `CheckboxRenderingHint`
- `MultipleChoiceFieldType` with `MultiSelectDropdownRenderingHint`

Examples of incompatible combinations include:

- `TextFieldType` with `RadioRenderingHint`
- `SingleChoiceFieldType` with `CheckboxRenderingHint`
- `MultipleChoiceFieldType` with `RadioRenderingHint`
- `NumericFieldType` with `CheckboxRenderingHint`
- `DateFieldType` with `MultiLineTextRenderingHint`

## Value Correspondence

Each `FieldType` determines the form of `Value` that may appear in instance data for that field.

The correspondence is:

- `TextFieldType` to `TextValue`
- `NumericFieldType` to `NumericValue`
- `DateFieldType` to `DateValue`
- `TimeFieldType` to `TimeValue`
- `DateTimeFieldType` to `DateTimeValue`
- `ControlledTermFieldType` to `ControlledTermValue`
- `ChoiceFieldType` to `ChoiceValue`
- `LinkFieldType` to `LinkValue`
- `ContactFieldType` to `ContactValue`
- `ExternalAuthorityFieldType` to `ExternalAuthorityValue`
- `AttributeValueFieldType` to `AttributeValue`

## Variant Notes

`TextFieldType` is used for textual values. Single-line and multi-line presentation are expressed through `TextRenderingHint` rather than separate semantic field types.

A `TextFieldType` MAY additionally define:

- `TextDefaultValue`
- `MinLength`
- `MaxLength`
- `ValidationRegex`

These are part of the reusable text field definition rather than embedding-specific configuration.

`NumericFieldType` is used for numeric values. It may specify a numeric datatype, unit association, and numeric precision.

Temporal values are split into three semantic field types:

- `DateFieldType`
- `TimeFieldType`
- `DateTimeFieldType`

`DateFieldType` is used for date values. It specifies a `DateValueType` that distinguishes year-only, year-month, and full-date values, and it may specify a compatible `DateRenderingHint`.

`TimeFieldType` is used for time values. It may specify `TimePrecision`, timezone capture, and a compatible `TimeRenderingHint`. `TimePrecision` constrains permitted time precision at the model level, while `TimeFormat` belongs to `TimeRenderingHint` as a display and acquisition choice.

`DateTimeFieldType` is used for date-time values. It may specify date-time granularity, timezone capture, and a compatible `DateTimeRenderingHint`. Where a date-time field supports 12-hour versus 24-hour presentation, that choice belongs to `DateTimeRenderingHint` through `TimeFormat`.

`ControlledTermFieldType` is used for values drawn from a controlled terminology or ontology-backed source.

Controlled term sources may be defined as:

- ontology-wide selection
- branch-restricted selection
- explicitly enumerated classes
- curated value sets

`OntologySource` permits selection from one identified ontology.

Each ontology reference records:

- ontology IRI

The ontology IRI is the required identifier.

An optional `OntologyDisplayHint` may additionally record:

- ontology acronym
- ontology name

`BranchSource` restricts selection to descendants of a specified root term within an identified ontology. It may additionally define maximum traversal depth.

`ClassSource` enumerates explicit permitted classes or terms. Each enumerated class records a term IRI, a label, and the ontology from which the class is drawn.

`ValueSetSource` identifies a curated value set by identifier and may additionally record a name and IRI.

`ChoiceFieldType` is used for values chosen from an explicit set of options.

`SingleChoiceFieldType` is used when exactly one option may be selected in a given value occurrence.

`MultipleChoiceFieldType` is used when multiple options may be selected in a given value occurrence.

Choice presentation is expressed through typed rendering hints rather than by multiplying semantic field types for radio, checkbox, and dropdown variants.

`ChoiceValue` may represent either a literal choice token or an ontology-backed choice term.

`LinkFieldType` is used for link-like values.

`ContactFieldType` is used for contact-oriented values such as email addresses and phone numbers.

`ExternalAuthorityFieldType` is used for externally meaningful identifiers from external authority systems such as ORCID, ROR, DOI, PubMed ID, RRID, and NIH Grant ID.

`AttributeValueFieldType` is used for attribute-value style structures where the value itself has internal pairing semantics.

## Embedding-Specific Field Behavior

The following properties are not intrinsic parts of a reusable `Field` and therefore belong to `EmbeddedField` rather than `Field`. `TextFieldType` is the exception for reusable text defaults, which are modeled by `TextDefaultValue`:

- `EmbeddedArtifactKey`
- value requirement
- cardinality
- visibility
- embedding-specific `DefaultValue`
- label override

## Open Questions

- Should reusable option sets for `ChoiceFieldType` be represented as first-class artifacts?
