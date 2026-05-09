# Presentation Components

## Overview

`PresentationComponent` defines reusable presentation or instructional content that may appear within a `Template` through `EmbeddedPresentationComponent`.

`PresentationComponent` is distinct from `Field` and MUST NOT be treated as a data-bearing schema construct. It is also distinct from `SchemaArtifact`: presentation components carry plain `ArtifactMetadata` rather than `SchemaArtifactMetadata`, since they do not participate in schema versioning.

## Artifact shape

Every concrete `PresentationComponent` carries the following common slots:

- `PresentationComponentId` — the artifact's identity IRI.
- `ModelVersion` — the version of the CEDAR structural model the artifact conforms to (hoisted to top-level on every concrete artifact).
- `ArtifactMetadata` — the artifact's name, description, lifecycle, optional annotations, etc.
- a per-variant **body**: the substantive content of the component (HTML, image IRI, video IRI, or — for the structural break components — empty).

## Defined Components

This specification defines the following `PresentationComponent` variants:

| Variant | Body |
|---|---|
| `RichTextComponent` | `HtmlContent` (an HTML string for rendered presentation) |
| `ImageComponent` | `Iri` for the image source, with optional `Label` and `Description` |
| `YoutubeVideoComponent` | `Iri` for the video source, with optional `Label` and `Description` |
| `SectionBreakComponent` | (no body) — contributes sectional separation in a rendered form |
| `PageBreakComponent` | (no body) — contributes pagination structure |

These constructs replace the older practice of treating static presentation constructs as field variants.

## Embedding

Presentation constructs appear in a `Template` only through `EmbeddedPresentationComponent`.

An `EmbeddedPresentationComponent` carries:

- `EmbeddedArtifactKey` — the local key identifying this embedding within the containing `Template`.
- `PresentationComponentId` — the `artifactRef` to the reusable `PresentationComponent` being embedded.
- optional `Visibility` — the rendering visibility of the embedded component.

It does **not** carry a value requirement, cardinality, default value, label override, or semantic property IRI: the component contributes no instance data and exists purely to contribute presentational structure.

## Instance Semantics

`PresentationComponent` does not produce `InstanceValue`.

Conforming implementations MUST NOT create `FieldValue`, `NestedTemplateInstance`, or any other `InstanceValue` for a `PresentationComponent`. The `EmbeddedArtifactKey` of an `EmbeddedPresentationComponent` MUST NOT appear as the key of any `InstanceValue` in a conforming `TemplateInstance`.

## Open Questions

- **Model revision candidate:** The current model requires all `PresentationComponent` variants to carry full reusable artifact identity. This is uniform but may be unnecessarily heavy for simple structural elements such as `PageBreakComponent`, which carry no meaningful content and are unlikely to be shared across templates. A future revision should consider whether lightweight inline-only variants could be introduced for such cases, and define the criteria for determining which components warrant reusable identity.
- Which presentation-specific properties belong on the reusable `PresentationComponent` versus on `EmbeddedPresentationComponent`?
