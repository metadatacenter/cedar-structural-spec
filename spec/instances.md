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

## NestedTemplateInstance

A `NestedTemplateInstance` associates an `EmbeddedArtifactKey` with nested `InstanceValue` constructs corresponding to an `EmbeddedTemplate`.

This provides recursive instance structure aligned with recursive template structure.

## Conformance

A `TemplateInstance` MUST conform to the structure implied by its referenced `Template`.

A conforming instance MUST use `EmbeddedArtifactKey` values that identify embedded data-bearing artifacts in that template context.

Textual instance values MAY include language tags.

Numeric and temporal instance values MAY include explicit datatype annotations.

Controlled term instance values SHOULD preserve both a term IRI and a human-readable label. They MAY additionally preserve notation and preferred label information from the source terminology.

## Open Questions

- Should `TemplateInstance` permit partial conformance during authoring workflows, or should the model define only fully conforming instances?
- Should an empty repeated `FieldValue` be permitted for optional `EmbeddedField` constructs, or should omission be the only representation of absence?
