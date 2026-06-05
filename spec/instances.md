# Instances

## Overview

A `TemplateInstance` is an `Artifact` that conforms to a `Template`.

The structure of a `TemplateInstance` is determined by the embedded data-bearing artifacts of the referenced `Template`.

## TemplateInstance

A `TemplateInstance` carries a `TemplateInstanceId`, a `ModelVersion` (the version of the CEDAR structural model the instance conforms to, hoisted to top-level on every concrete artifact), an `ArtifactMetadata` block, a reference to the `Template` it conforms to, and zero or more `InstanceEntry` constructs.

`TemplateInstance` carries `ArtifactMetadata` rather than `SchemaArtifactMetadata`: instances do not carry schema versioning. The `Template` they reference fixes the schema version.

Each `InstanceEntry` corresponds to an embedded artifact in the referenced `Template` that contributes data.

The template reference is persistent and provides the basis for validation and interpretation of instance content.

## InstanceEntry

`InstanceEntry` has two forms:

- `FieldEntry`
- `TemplateEntry`

`PresentationComponent` does not correspond to any `InstanceEntry`.

## FieldEntry

A `FieldEntry` associates an `EmbeddedArtifactKey` with one or more values for an `EmbeddedField`.

The key identifies the embedding site within the containing `Template`, which allows the same referenced `Field` to appear in multiple contexts without ambiguity.

`FieldEntry` may contain multiple values when the corresponding `EmbeddedField` permits multiplicity.

The permitted form of each contained value is determined by the `FieldSpec` of the referenced `Field`. Each value in `FieldEntry.values` is a member of the `Value` polymorphic union and therefore carries a `kind` discriminator on the wire (per [`wire-grammar.md` §1.5](wire-grammar.md#15-the-kind-rule)). A decoder reads `kind` to pick the union arm; the resulting arm MUST match the family expected by the referenced `FieldSpec` (e.g. a `FieldEntry` for a `TextFieldSpec` carries `TextValue` entries with `"kind": "TextValue"`).

For `EnumFieldSpec`, every contained value is a tagged `EnumValue` (`{ "kind": "EnumValue", "value": "<Token>" }`) whose `value` MUST equal the canonical `Token` of one of the referenced spec's `PermissibleValue` entries. A `SingleValuedEnumFieldSpec` permits exactly one such `EnumValue` per `FieldEntry`; a `MultiValuedEnumFieldSpec` permits one or more, subject to the embedding's `Cardinality`.

## Defaults are not part of instances

A `TemplateInstance` records the values a user supplied; it does not record default values. Defaults specified at the field-level (`XxxFieldSpec.defaultValue`) or embedding-level (`EmbeddedXxxField.defaultValue`) are UI/UX initialisation only — they pre-populate the form a user fills in, but the resulting instance carries the user's chosen value as if the user had typed it in by hand.

Two consequences:

- A user who accepts a default without modification produces a `FieldEntry` carrying that value verbatim. From the instance's perspective the default and a user-supplied identical value are indistinguishable.
- A user who supplies no value (and the field is not required) produces *no* `FieldEntry` for that key. The default does not appear by virtue of having existed; absence in the instance means absence, not "use the default."

This matters for downstream consumers: the absence of a `FieldEntry` for a given `EmbeddedField` is unambiguous evidence that no value was supplied, and never an implicit reference to a default.

See also [`grammar.md` §Defaults](grammar.md#defaults) and [`serialization.md` §6.8](serialization.md#68-default-values).

## TemplateEntry

A `TemplateEntry` associates an `EmbeddedArtifactKey` with nested `InstanceEntry` constructs corresponding to an `EmbeddedTemplate`.

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
