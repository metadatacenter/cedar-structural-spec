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

For `ChoiceFieldSpec`, the kind of `ChoiceValue` is determined by the concrete field spec: a `LiteralSingleChoiceFieldSpec` or `LiteralMultipleChoiceFieldSpec` requires `LiteralChoiceValue`, while a `ControlledTermSingleChoiceFieldSpec` or `ControlledTermMultipleChoiceFieldSpec` requires `ControlledTermChoiceValue`. A conforming instance value must correspond to one of the declared options of the referenced field's choice field spec.

## NestedTemplateInstance

A `NestedTemplateInstance` associates an `EmbeddedArtifactKey` with nested `InstanceValue` constructs corresponding to an `EmbeddedTemplate`.

This provides recursive instance structure aligned with recursive template structure.

## Conformance

A `TemplateInstance` MUST conform to the structure implied by its referenced `Template`.

A conforming instance MUST use `EmbeddedArtifactKey` values that identify embedded data-bearing artifacts in that template context.

Textual instance values MAY include language tags.

`TextValue` is represented by `TextLiteral`, which may be either `StringLiteral` or `LangStringLiteral`.

Numeric instance values are represented by typed literals that carry numeric datatype IRIs.

Date, time, and date-time instance values are represented separately by `DateValue`, `TimeValue`, and `DateTimeValue`, each with its own strongly typed literal form. Within `DateValue`, `YearValue` and `FullDateValue` preserve the intended precision explicitly.

Controlled term instance values SHOULD preserve both a term Iri and a human-readable label. They MAY additionally preserve notation and preferred label information from the source terminology.

External authority instance values SHOULD preserve both the typed authority IRI (`OrcidIri`, `RorIri`, `DoiIri`, `PubMedIri`, `RridIri`, or `NihGrantIri` as appropriate) and, where available, a human-readable label.

## Open Questions

- Should `TemplateInstance` permit partial conformance during authoring workflows, or should the model define only fully conforming instances?
