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

It does **not** carry a value requirement, cardinality, default value, prompt override, or semantic property IRI: the component contributes no instance data and exists purely to contribute presentational structure.

## Instance Semantics

`PresentationComponent` does not produce `InstanceEntry`.

Conforming implementations MUST NOT create `FieldEntry`, `TemplateEntry`, or any other `InstanceEntry` for a `PresentationComponent`. The `EmbeddedArtifactKey` of an `EmbeddedPresentationComponent` MUST NOT appear as the key of any `InstanceEntry` in a conforming `TemplateInstance`.

## Help-Text Rendering

This section is normative for conforming form renderers. The structural model carries help-text content on the `Field` artifact ([`HelpText`](grammar.md#field-artifacts)) and optional per-embedding overrides on `EmbeddedField` ([`HelpTextOverride`](grammar.md#help-text-override)). How that content is *presented* at form-render time is governed by the enclosing `Template`'s [`HelpDisplayMode`](grammar.md#template-rendering-hint).

### Effective help-text resolution

At each `EmbeddedField` site, the **effective help text** is determined as follows:

1. If the `EmbeddedField` carries a `HelpTextOverride`: the effective help text is the override's value.
2. Otherwise, if the referenced `Field` carries a `HelpText`: the effective help text is the field's value.
3. Otherwise, the effective help text is empty; the renderer displays no help for this field regardless of `HelpDisplayMode`.

The override is *replace*, not *merge*: localizations present in the field's `HelpText` but absent from the embedding's `HelpTextOverride` do not fall back into the resolved content.

### Display-mode selection

The presentation of effective help text at a given embedding site is governed by the `HelpDisplayMode` resolved per the cascade rule below:

- `"inline"` — render the effective help text as visible text adjacent to the field, typically beneath the input. This is the default when no mode is set.
- `"tooltip"` — render as a hover/focus tooltip, triggered by a `?` icon or other discoverable affordance. Conforming renderers MUST also make the text available to assistive technologies.
- `"both"` — emit both the inline rendering and the tooltip rendering. Recommended for accessibility-sensitive contexts where redundancy is preferred.
- `"none"` — do not render the effective help text at form-render time. The content remains part of the model and is available to alternative renderers (catalog browsers, RDF projectors, etc.).

### Cascade rule for nested templates

`HelpDisplayMode` cascades from the *outermost* `Template` in a form to every field rendered within that form, including fields contributed by nested templates referenced via `EmbeddedTemplate`. Specifically:

- When a `Template` `T_outer` embeds another `Template` `T_inner` via `EmbeddedTemplate`, the renderer MUST use `T_outer`'s `HelpDisplayMode` (or its default if unset) when rendering fields contributed by `T_inner`.
- `T_inner`'s own `HelpDisplayMode` is **ignored** for help-text rendering at that embedding site.
- `T_inner`'s `HelpDisplayMode` applies only when `T_inner` is rendered standalone (e.g., previewed in authoring tooling as a reusable artifact, or used as the top-level template in another context).

This rule is **specific to `HelpDisplayMode`**. Future `TemplateRenderingHint` slots may define different cascade behaviour and MUST state their cascade rule explicitly.

When `HelpDisplayMode` is absent from a `Template` — either because the template carries no `TemplateRenderingHint`, or because the hint omits the slot — the resolved mode is `"inline"`.

## Placeholder Rendering

This section is normative for conforming form renderers. The structural model carries placeholder content on rendering-hint productions attached to text-entry-capable field families (see [`grammar.md`](grammar.md) §Field Specs and §Rendering Hints, and the new `Placeholder` production). How that content is *presented* at form-render time is governed by the rules below.

### What `Placeholder` is

`Placeholder` is a [`MultilingualString`](grammar.md#multilingual-strings)-valued slot on every rendering hint attached to a text-entry-capable field family. It carries **sample input text** — typically a short format demonstration such as `"YYYY-MM-DD"`, `"john.doe@example.com"`, or `"https://orcid.org/0000-0000-0000-0000"` — intended to be displayed inside an empty text-entry widget and to disappear once the user begins typing.

`Placeholder` is **not** semantic content about the field's meaning; that is the role of [`HelpText`](grammar.md#field-artifacts). The two slots may coexist on the same field: `HelpText` explains *what the field is for*, `Placeholder` demonstrates *what the typed input looks like*.

### Rendering requirements

Conforming renderers:

- SHOULD display the effective `Placeholder` content inside text-entry input widgets when those inputs are empty.
- MUST NOT display `Placeholder` content in a way that could be mistaken for a user-supplied value. Placeholders MUST be visually distinguishable from real input — conventionally via reduced opacity, italics, or a contrasting style.
- MAY omit `Placeholder` rendering when accessibility concerns warrant (some screen readers handle the HTML `placeholder` attribute poorly). When `Placeholder` is omitted from the visual rendering, the renderer SHOULD ensure the same content is available through `HelpText` or another accessible affordance if it conveys information the user otherwise lacks.

### Localization selection

When `Placeholder` carries multiple language-tagged localizations, the renderer selects the entry whose `LanguageTag` best matches the user's preferred display language, falling back per the spec's existing `MultilingualString`-localization-preference rules. No new rule is introduced for `Placeholder`; it follows the same selection convention as `HelpText`, `PreferredLabel`, and other `MultilingualString`-valued display content.

### Relationship to value validation

`Placeholder` content is *purely presentational*. It is not validated against the field spec's value constraints (`validationRegex`, `langTagRequirement`, `timezoneRequirement`, `minLength`, `maxLength`, etc.). A placeholder of `"YYYY-MM-DD"` may appear on a date field whose values are constrained to ISO 8601 — the placeholder is a demonstration of the expected lexical shape, not an instance of one. Conforming validators MUST NOT apply field-spec value constraints to placeholder content.

## Open Questions

- **Model revision candidate:** The current model requires all `PresentationComponent` variants to carry full reusable artifact identity. This is uniform but may be unnecessarily heavy for simple structural elements such as `PageBreakComponent`, which carry no meaningful content and are unlikely to be shared across templates. A future revision should consider whether lightweight inline-only variants could be introduced for such cases, and define the criteria for determining which components warrant reusable identity.
- Which presentation-specific properties belong on the reusable `PresentationComponent` versus on `EmbeddedPresentationComponent`?
