# Instances

## Overview

A `TemplateInstance` is an `Artifact` that conforms to a `Template`.

The structure of a `TemplateInstance` is determined by the embedded data-bearing artifacts of the referenced `Template`.

## TemplateInstance

A `TemplateInstance` references a `Template` and contains zero or more `InstanceValue` constructs.

Each `InstanceValue` corresponds to an embedded artifact in the referenced `Template` that contributes data.

The template reference is persistent and provides the basis for validation and interpretation of instance content.

## InstanceValue

`InstanceValue` has two forms:

- `FieldValue`
- `NestedTemplateInstance`

`PresentationComponent` does not correspond to any `InstanceValue`.

## FieldValue

A `FieldValue` associates an `EmbeddedArtifactKey` with one or more values for an `EmbeddedField`.

The key identifies the embedding site within the containing `Template`, which allows the same referenced `Field` to appear in multiple contexts without ambiguity.

`FieldValue` may contain multiple values when the corresponding `EmbeddedField` permits multiplicity.

The permitted form of each contained value is determined by the `FieldSpec` of the referenced `Field`.

For `EnumFieldSpec`, every contained value is an `EnumValue` carrying a `Token` that MUST equal the canonical `Token` of one of the referenced spec's `PermissibleValue` entries. A `SingleValuedEnumFieldSpec` permits exactly one such `EnumValue` per `FieldValue`; a `MultiValuedEnumFieldSpec` permits one or more, subject to the embedding's `Cardinality`.

## NestedTemplateInstance

A `NestedTemplateInstance` associates an `EmbeddedArtifactKey` with nested `InstanceValue` constructs corresponding to an `EmbeddedTemplate`.

This provides recursive instance structure aligned with recursive template structure.

## Conformance

A `TemplateInstance` MUST conform to the structure implied by its referenced `Template`.

A conforming instance MUST use `EmbeddedArtifactKey` values that identify embedded data-bearing artifacts in that template context.

Textual instance values MAY include language tags.

`TextValue` carries a lexical form and an optional language tag.

Numeric instance values carry a lexical form together with the corresponding XSD datatype: `IntegerNumberValue` is fixed at `xsd:integer`; `RealNumberValue` carries an explicit datatype (`xsd:decimal`, `xsd:float`, or `xsd:double`).

Date, time, and date-time instance values are represented separately by `DateValue`, `TimeValue`, and `DateTimeValue`, each carrying its own lexical form. Within `DateValue`, `YearValue` and `YearMonthValue` carry plain strings matching `YYYY` and `YYYY-MM` respectively; `FullDateValue` carries an `xsd:date` lexical form.

Controlled term instance values SHOULD preserve both a term Iri and a human-readable label. They MAY additionally preserve notation and preferred label information from the source terminology.

External authority instance values SHOULD preserve both the typed authority IRI (`OrcidIri`, `RorIri`, `DoiIri`, `PubMedIri`, `RridIri`, or `NihGrantIri` as appropriate) and, where available, a human-readable label.

## Open Questions

- Should `TemplateInstance` permit partial conformance during authoring workflows, or should the model define only fully conforming instances?
