# Presentation Components

## Overview

`PresentationComponent` defines reusable presentation or instructional content that may appear within a `Template` through `EmbeddedPresentationComponent`.

`PresentationComponent` is distinct from `Field` and MUST NOT be treated as a data-bearing schema construct.

## Defined Components

This specification defines the following `PresentationComponent` variants:

- `RichTextComponent`
- `ImageComponent`
- `YoutubeVideoComponent`
- `SectionBreakComponent`
- `PageBreakComponent`

These constructs replace the older practice of treating static presentation constructs as field variants.

## Embedding

Presentation constructs appear in a `Template` only through `EmbeddedPresentationComponent`.

An `EmbeddedPresentationComponent` carries embedding-specific properties such as `EmbeddedArtifactKey`, visibility, and label override where applicable.

`RichTextComponent` carries reusable HTML content.

`ImageComponent` carries an image source.

`YoutubeVideoComponent` carries a YouTube video source.

`SectionBreakComponent` contributes sectional separation within a rendered template.

`PageBreakComponent` contributes pagination structure for rendered forms.

## Instance Semantics

`PresentationComponent` does not produce `InstanceValue`.

Conforming implementations MUST NOT create `FieldValue`, `NestedTemplateInstance`, or any other `InstanceValue` for a `PresentationComponent`.

## Open Questions

- **Model revision candidate:** The current model requires all `PresentationComponent` variants to carry full reusable artifact identity. This is uniform but may be unnecessarily heavy for simple structural elements such as `PageBreakComponent`, which carry no meaningful content and are unlikely to be shared across templates. A future revision should consider whether lightweight inline-only variants could be introduced for such cases, and define the criteria for determining which components warrant reusable identity.
- Which presentation-specific properties belong on the reusable `PresentationComponent` versus on `EmbeddedPresentationComponent`?
