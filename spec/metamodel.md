# Metamodel

## Overview

The CEDAR Template Model is organized around reusable artifacts, embedding constructs, and instances that conform to templates.

`Artifact` is the broadest category in the model. `SchemaArtifact`, `PresentationComponent`, and `TemplateInstance` are the principal subclasses used by this specification.

## Artifact

An `Artifact` is a top-level construct in the CEDAR Template Model.

Each `Artifact` carries common artifact metadata including descriptive metadata, an artifact identifier, temporal provenance, and zero or more annotations.

Descriptive metadata includes:

- `Name`
- `Description`
- `Identifier`

The artifact identifier is a repository-assigned IRI that permanently identifies the artifact.

Temporal provenance includes:

- `CreatedOn`
- `CreatedBy`
- `ModifiedOn`
- `ModifiedBy`

`CreatedOn` and `ModifiedOn` MUST be ISO 8601 date-time timestamps.

`CreatedBy` and `ModifiedBy` MUST identify agents by IRI.

Annotations are attribute-value pairs whose values may be literals or IRIs.

## SchemaArtifact

A `SchemaArtifact` is an `Artifact` that defines reusable schema structure.

`Template` and `Field` are `SchemaArtifact` constructs.

Each reusable artifact MAY be referenced by a typed identifier such as `FieldId`, `TemplateId`, or `PresentationComponentId`, depending on the referenced artifact kind.

A `SchemaArtifact` additionally carries versioning metadata:

- `Version`
- `Status`
- `ModelVersion`
- `PreviousVersion`
- `DerivedFrom`

## Template

A `Template` is a `SchemaArtifact` that specifies an ordered arrangement of embedded artifacts.

A `Template` contains `EmbeddedArtifact` constructs rather than directly containing `Field`, `Template`, or `PresentationComponent`.

A `Template` MAY additionally define `Header` and `Footer` content for presentation at the template level.

## Field

A `Field` is a `SchemaArtifact` that specifies a kind of value that may appear in `TemplateInstance` constructs.

A `Field` defines a `FieldType` and any intrinsic constraints on the permitted values.

Where supported by a concrete `FieldType`, a compatible `RenderingHint` is defined as part of that `FieldType`.

`RenderingHint` influences presentation behavior only and MUST be compatible with the associated concrete `FieldType`.

Semantic distinctions such as single-choice versus multiple-choice belong in `FieldType`. Purely presentational distinctions such as single-line versus multi-line text entry belong in typed rendering hints.

The reusable `Field` definition does not carry template-local keying, cardinality, visibility, default value, or label override. Those properties belong to `EmbeddedField`.

## PresentationComponent

A `PresentationComponent` is an `Artifact` that contributes presentation or instructional structure.

`PresentationComponent` does not define a data-bearing value and does not contribute an `InstanceValue`.

## EmbeddedArtifact

An `EmbeddedArtifact` contextualizes an artifact within a specific `Template`.

An `EmbeddedArtifact` carries embedding-specific properties such as `EmbeddedArtifactKey`, local cardinality, visibility, default value, label override, and value requirement.

The order of embedded artifacts in a `Template` is determined by the sequence in which the `EmbeddedArtifact` constructs occur within that `Template`.

## EmbeddedField

An `EmbeddedField` is an `EmbeddedArtifact` that references a `Field`.

It determines how that `Field` participates within the containing `Template`.

## EmbeddedTemplate

An `EmbeddedTemplate` is an `EmbeddedArtifact` that references a `Template`.

It determines how the referenced `Template` is nested within the containing `Template`.

## EmbeddedPresentationComponent

An `EmbeddedPresentationComponent` is an `EmbeddedArtifact` that references a `PresentationComponent`.

It contributes presentation structure within a `Template` but does not produce `InstanceValue`.

## EmbeddedArtifactKey

An `EmbeddedArtifactKey` is the local identifier for an `EmbeddedArtifact` within a `Template`.

`EmbeddedArtifactKey` values MUST be unique within a `Template`.

`EmbeddedArtifactKey` MUST be an ASCII identifier without whitespace.

`EmbeddedArtifactKey` is the mechanism that connects template structure and instance structure.

`EmbeddedArtifactKey` is distinct from artifact identifiers such as `FieldId` and `TemplateId`. It identifies the embedding site within a template rather than the reusable artifact being referenced.

## TemplateInstance

A `TemplateInstance` is an `Artifact` that conforms to a `Template`.

A `TemplateInstance` contains `InstanceValue` constructs corresponding to the embedded data-bearing artifacts of that `Template`.

## InstanceValue

An `InstanceValue` is a value-bearing construct within a `TemplateInstance`.

This specification defines two forms of `InstanceValue`: `FieldValue` and `NestedTemplateInstance`.

## FieldValue

A `FieldValue` associates an `EmbeddedArtifactKey` with one or more values corresponding to an `EmbeddedField`.

The `EmbeddedArtifactKey` identifies the embedding context, not merely the referenced `Field`.

The representation of the value depends on the referenced `FieldType`.

## NestedTemplateInstance

A `NestedTemplateInstance` associates an `EmbeddedArtifactKey` with a nested collection of `InstanceValue` constructs corresponding to an `EmbeddedTemplate`.

`NestedTemplateInstance` is the recursive construct that supports nested template structure.

## Open Questions

- Should `PresentationComponent` remain a direct subclass of `Artifact`, or should a later revision introduce a more explicit hierarchy for reusable non-schema artifacts?
- Which embedding-specific properties are mandatory for all `EmbeddedArtifact` constructs in the normative kernel?
