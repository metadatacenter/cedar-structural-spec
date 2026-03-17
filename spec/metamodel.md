# Metamodel

## Overview

This section defines the conceptual arrangement of the CEDAR Template Model. Its goal is to state that conceptual information in a strongly typed and unambiguous manner by making the principal categories of constructs in the model and the relationships among them explicit. It does not prescribe any concrete serialization. A serialization MUST preserve and faithfully encode the conceptual information defined by this metamodel, but it MAY do so using whatever concrete representational structures are appropriate for that serialization format.

The CEDAR Template Model is organized around reusable artifacts, embedding constructs, and instances that conform to templates.

`Artifact` is the broadest category in the model. `SchemaArtifact`, `PresentationComponent`, and `TemplateInstance` are the principal subclasses used by this specification.

## Artifact

An `Artifact` is a top-level construct in the CEDAR Template Model.

Each `Artifact` carries an artifact identifier together with common artifact metadata including descriptive metadata, temporal provenance, and zero or more annotations.

Descriptive metadata includes:

- `Name`
- `Description`
- `Identifier`

The artifact identifier is a repository-assigned Iri that permanently identifies the artifact. Artifact identity is conceptually distinct from artifact metadata.

Temporal provenance includes:

- `CreatedOn`
- `CreatedBy`
- `ModifiedOn`
- `ModifiedBy`

`CreatedOn` and `ModifiedOn` MUST be ISO 8601 date-time timestamps.

`CreatedBy` and `ModifiedBy` MUST identify agents by Iri.

Annotations are property-value pairs. Each annotation has an `AnnotationName` identifying the annotated metadata property and an `AnnotationValue` that may be either a literal or an IRI. Annotations support linking to external resources such as DOIs and grant identifiers, and also support storing institutional metadata.

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

A `Template` is a `SchemaArtifact` identified by a `TemplateId` and specifies an ordered arrangement of embedded artifacts.

A `Template` contains `EmbeddedArtifact` constructs rather than directly containing `Field`, `Template`, or `PresentationComponent`.

A `Template` MAY additionally define `Header` and `Footer` content for presentation at the template level.

## Field

A `Field` is a `SchemaArtifact` identified by a `FieldId` and specifies a kind of value that may appear in `TemplateInstance` constructs.

A `Field` defines a `FieldType` together with any field-type-specific properties on the permitted values.

`TextFieldType` MAY define a reusable default text value, minimum length, maximum length, and validating regular expression.

Where supported by a concrete `FieldType`, a compatible `RenderingHint` is defined as part of that `FieldType`.

`RenderingHint` influences presentation behavior only and MUST be compatible with the associated concrete `FieldType`.

**Semantic Structure Versus Presentation.** This specification draws a strict distinction between semantic structure and presentation. Semantic distinctions MUST be modeled in `FieldType`. This includes distinctions such as single-choice versus multiple-choice, date versus time versus date-time, permitted time precision, and permitted date-time precision. Purely presentational distinctions MUST NOT be modeled as separate field types. Instead, distinctions such as single-line versus multi-line text entry, date component ordering, and 12-hour versus 24-hour time display MUST be modeled only through compatible typed rendering hints.

The reusable `Field` definition does not carry template-local keying, cardinality, visibility, or label override. Those properties belong to `EmbeddedField`.

`EmbeddedField` MAY still define an embedding-specific `DefaultValue`. Where both a reusable text default and an embedding-specific default are present, the embedding-specific default is more specific to the template context.

## PresentationComponent

A `PresentationComponent` is an `Artifact` identified by a `PresentationComponentId` that contributes presentation or instructional structure. Examples include reusable rich text instructions, images, YouTube videos, section breaks, and page breaks that guide or organize a rendered template without introducing data-bearing content.

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

A `TemplateInstance` is an `Artifact` identified by a `TemplateInstanceId` that conforms to a `Template`.

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

- Should `PresentationComponent` remain a direct subclass of `Artifact`, or should a later revision introduce a more explicit hierarchy for reusable non-schema artifacts? For example, a later revision could introduce an intermediate superclass for reusable non-schema artifacts and place `PresentationComponent` under that superclass rather than directly under `Artifact`. This would make the distinction between reusable schema artifacts such as `Template` and `Field` and reusable non-schema artifacts such as rich text, images, videos, section breaks, and page breaks more explicit.
