# `CatalogMetadata` + rendered `Label` / `Title` — draft

Draft of the design that:

1. **Renames `ArtifactMetadata` to `CatalogMetadata`** and refocuses it on
   purely catalog/provenance concerns.
2. **Drops `SchemaArtifactMetadata`** as a wrapper — `SchemaArtifactVersioning`
   becomes a top-level slot on schema artifacts (Template, Field) directly.
3. **Removes the rendered display name from `CatalogMetadata`** entirely.
4. **Adds top-level rendered-name slots** to the artifacts that have a
   rendering moment: `Field.label` (required), `Template.title` (required),
   `TemplateInstance.label` (optional). `PresentationComponent` carries no
   top-level rendered name.
5. **Keeps `preferredLabel` as a slot on `CatalogMetadata`** — optional now,
   playing a pure catalog-display role distinct from the rendered slots above.

Captured here so the design can be reviewed before propagating into
`grammar.md`, `wire-grammar.md`, `validation.md`, `serialization.md`,
`metamodel.md`, `bindings.md`, `ctm-1.6.0-serialization.md`, the
conformance fixtures, and cedar-ts.

## Motivation

The existing model puts `preferredLabel` inside `ArtifactMetadata`. On a
`Field`, that slot is the *question text* that's rendered to the user at
data-entry time — but it sits alongside `lifecycle`, `versioning`, and
`description`, which are catalog/provenance concerns about the artifact as
a registry entry. The conflation is most acute on `Field`: a rendered
question text and lifecycle metadata are different kinds of content.

`Template` has the same slot doing genuine double duty (the form's title
*and* the catalog registry name often coincide), but the slot is
conceptually overloaded.

`PresentationComponent` and `TemplateInstance` use `preferredLabel` in a
genuinely catalog-only sense (no inherent rendering role at the artifact
level).

This design separates the two roles cleanly:

- **Catalog display name** (`CatalogMetadata.preferredLabel`) — what the
  registry shows when listing the artifact. Authored *as* a catalog name.
- **Rendered display name** — what's shown when the artifact is rendered
  for its primary purpose (a field at data-entry time, a template as a
  form, an instance in its details view). Authored *as* user-facing content.

Most artifacts will populate both with the same string. The split exists
so they *can* differ.

## What `CatalogMetadata` looks like

```ebnf
CatalogMetadata ::= catalog_metadata(
                      [PreferredLabel]
                      [Description]
                      [Identifier]
                      AlternativeLabel*
                      LifecycleMetadata
                      Annotation*
                    )
```

Notable changes from `ArtifactMetadata`:

- The production is renamed.
- `PreferredLabel` is now **optional**. It was required on `ArtifactMetadata`
  because it carried the rendered display name. With that role lifted out,
  the catalog-name slot is purely a registry affordance and may be absent
  (the registry can fall back to the artifact's IRI slug, or to the
  rendered name where present).
- All other slots unchanged.

The wrapper production `SchemaArtifactMetadata` is removed. Where
versioning information needs to live alongside `CatalogMetadata` (on
schema artifacts), it lives as a separate top-level slot on the artifact
itself.

## Top-level rendered-name slots

```ebnf
Label ::= label( MultilingualString )

Title ::= title( MultilingualString )
```

Both wrap a `MultilingualString`. They're separate productions so the
positions they occupy can be type-discriminated at the grammar level —
a Field carries `Label`, a Template carries `Title`, and the surrounding
context makes the role unambiguous.

The choice between `Label` and `Title` follows HTML/UX vocabulary:
"label" labels a control; "title" names a document. A Field is a control;
a Template is a document. A TemplateInstance is closer to a record than a
document, so we use `Label` for it as well.

## Per-artifact shape changes

### `Field` artifact

```ebnf
TextField ::= text_field(
                TextFieldId
                ModelVersion
                CatalogMetadata
                SchemaArtifactVersioning
                TextFieldSpec
                Label
                [HelpText]
              )
```

- `SchemaArtifactMetadata` slot replaced with two slots: `CatalogMetadata`
  and `SchemaArtifactVersioning` (lifted out of the wrapper).
- New required `Label` slot — the rendered question text.
- The other 19 concrete `Field` productions are updated identically.

### `Template` artifact

```ebnf
Template ::= template(
               TemplateId
               ModelVersion
               CatalogMetadata
               SchemaArtifactVersioning
               Title
               [TemplateRenderingHint]
               [Header]
               [Footer]
               EmbeddedArtifact*
             )
```

- Same wrapper-splitting as `Field`.
- New required `Title` slot — the rendered form title.

### `PresentationComponent` artifact

```ebnf
RichTextComponent ::= rich_text_component(
                        PresentationComponentId
                        ModelVersion
                        CatalogMetadata
                        HtmlContent
                      )
```

- Replace `ArtifactMetadata` slot with `CatalogMetadata`.
- No rendered-name slot. Presentation components don't render themselves
  as form chrome; they contribute body content (HTML, image IRI, etc.).
- All 5 concrete PresentationComponent productions updated identically.

### `TemplateInstance` artifact

```ebnf
TemplateInstance ::= template_instance(
                       TemplateInstanceId
                       ModelVersion
                       CatalogMetadata
                       TemplateId
                       [Label]
                       FieldValue*
                     )
```

- Replace `ArtifactMetadata` slot with `CatalogMetadata`.
- New optional `Label` slot — user-supplied name for the instance, shown
  in catalog listings or detail views.

## Cardinality summary

| Artifact | Rendered slot | Cardinality |
|---|---|---|
| Field | `Label` | required |
| Template | `Title` | required |
| PresentationComponent | (none) | — |
| TemplateInstance | `Label` | optional |

`CatalogMetadata.preferredLabel` is **optional** on every artifact.

The required-vs-optional distinction reflects whether the rendered name
is a definitional concern of the artifact kind: a Field without a label
has no question text to render, and a Template without a title has no
form heading. PresentationComponents have no top-level rendered name at
all; TemplateInstances may be saved unlabelled.

## Wire-grammar implications

### `CatalogMetadata` object

```
CatalogMetadata ::: object {
  preferredLabel?: PreferredLabel
  description?: Description
  identifier?: Identifier
  altLabels?: array<AlternativeLabel>
  lifecycle: LifecycleMetadata
  annotations?: array<Annotation>
}
```

`preferredLabel` is now optional.

### Schema artifact wire shape

`schemaArtifactMetadata` is gone. The flattened wire form previously
collapsed it into the artifact's top level; now `catalogMetadata` is a
direct top-level slot and `versioning` is a separate top-level slot.
Net wire-form effect: instead of

```json
{
  "kind": "TextField",
  "id": "...",
  "modelVersion": "...",
  "metadata": {
    "preferredLabel": [...],
    "description": [...],
    "lifecycle": {...},
    "versioning": {...}
  },
  "fieldSpec": {...}
}
```

we get

```json
{
  "kind": "TextField",
  "id": "...",
  "modelVersion": "...",
  "catalogMetadata": {
    "preferredLabel": [...],
    "description": [...],
    "lifecycle": {...}
  },
  "versioning": {...},
  "fieldSpec": {...},
  "label": [...]
}
```

The `metadata` wire key is renamed to `catalogMetadata`, `versioning` is
lifted to a top-level slot, and the new `label` slot carries the rendered
display name.

Non-schema artifacts (PresentationComponent, TemplateInstance) emit
`catalogMetadata` (no `versioning` since they aren't versioned).

### Property-name map

Every artifact's section in §14 is touched: `[ArtifactMetadata]` →
`metadata` becomes `[CatalogMetadata]` → `catalogMetadata`; schema
artifacts gain a separate `[SchemaArtifactVersioning]` → `versioning` row;
Field/Template gain a `Label`/`Title` → `label`/`title` row;
TemplateInstance gains `[Label]` → `label?`.

## Validation

No new structural rules beyond what's implicit:

- `CatalogMetadata.preferredLabel`, if present, is a `MultilingualString`
  (existing multilingual-uniqueness applies).
- `Field.label`, `Template.title`, `TemplateInstance.label` are
  `MultilingualString`-valued; same uniqueness rule applies.
- Versioning rules in `validate_artifact_metadata` (semantic version
  lexical form, status enum, lineage IRI distinctness) move to a renamed
  subroutine that takes `SchemaArtifactVersioning` directly. The subroutine
  body and error reports are unchanged.

## CTM 1.6.0 mapping

The CTM 1.6.0 encoder/decoder is sensitive to this. The existing
encoding direction (v2.0.0 → CTM 1.6.0) flattens
`metadata.preferredLabel` to a single string for `schema:name` and
`rdfs:label`. Under this change the flattening source changes:

- For Field: `schema:name` and `rdfs:label` source from `Field.label`
  (the rendered question text). `catalogMetadata.preferredLabel` is
  not emitted (CTM 1.6.0 has no separate catalog-name slot).
- For Template: `schema:name` and `rdfs:label` source from
  `Template.title`. Same reasoning.
- For PresentationComponent: `schema:name` sources from
  `catalogMetadata.preferredLabel` (the only display-name slot).
- For TemplateInstance: `schema:name` sources from `instance.label`
  if present, falling back to `catalogMetadata.preferredLabel` if
  not, and finally to the instance ID slug.

Import direction (CTM 1.6.0 → v2.0.0):

- `schema:name` maps to the artifact's rendered slot (`label` /
  `title` for Field/Template; `label` for TI; for PC it maps to
  `catalogMetadata.preferredLabel`).
- `rdfs:label`, if distinct from `schema:name`, maps to
  `catalogMetadata.preferredLabel` (so the registry name and the
  rendered name can diverge after import).

## `LabelOverride` interaction

`LabelOverride.label` on `EmbeddedField` currently overrides
`Field.metadata.preferredLabel`. After this change it overrides
`Field.label`. The slot name on `LabelOverride` stays the same; the
*meaning* shifts from "override the catalog name" to "override the
rendered question-text label." This is actually a more honest framing.

The previously queued `LabelOverride.label → LabelOverride.preferredLabel`
rename is **superseded by this work and dropped**.

## Migration scope

This is a broad change. Affected:

- **Spec chapters**: `grammar.md`, `wire-grammar.md`, `validation.md`,
  `serialization.md`, `metamodel.md`, `bindings.md`,
  `ctm-1.6.0-serialization.md`.
- **All 91 valid conformance fixtures + 23 invalid fixtures** carry
  `metadata.preferredLabel`. Bulk migration renames it on every
  fixture: move `preferredLabel` out of `metadata` and into a
  top-level `label` (for Field/TemplateInstance) or `title` (for
  Template). For PresentationComponent, `preferredLabel` stays inside
  `catalogMetadata` (the renamed metadata block). For all artifacts,
  the `metadata` wire key is renamed to `catalogMetadata`. Schema
  artifacts also gain a top-level `versioning` slot lifted from
  inside the old `metadata`.
- **cedar-ts**: `ArtifactMetadata` interface renamed to
  `CatalogMetadata`, `SchemaArtifactMetadata` removed entirely.
  Every artifact type gains a top-level `label`/`title` slot (where
  applicable) plus a `versioning` slot (where applicable). Every
  builder updated. Every serializer/parser updated. Every test
  updated.

Comparable to or larger than the `remove-artifact-name` change.

## Migration choice: strict vs. permissive

`ArtifactMetadata` is broken on the wire — old templates with
`metadata.preferredLabel` no longer parse, because:

- The wire key `metadata` becomes `catalogMetadata`.
- The required `preferredLabel` inside it is now optional and
  semantically a *catalog* name (no longer the rendered display).
- The required rendered display slot now lives at the top level under
  `label` / `title` and is *missing* from old templates.

Two ways to handle:

- **Strict**: old wire forms fail to parse. Producers must migrate
  templates with a one-shot script before they decode under the new
  spec.
- **Permissive on decode**: the decoder accepts the old `metadata`
  shape and lifts `preferredLabel` out into the new top-level
  `label`/`title` slot, while remapping the wire key to
  `catalogMetadata` internally.

Matching the pattern from `LangTagRequirement`, `Name → PreferredLabel`,
`Placeholder` (TextRenderingHint restructuring), and `HelpText`, **this
draft proposes strict**. Producers run a migration script; the spec
documents the migration; nothing carries forward.

## Sub-questions worth flagging

1. **`SchemaArtifactVersioning` slot name on the wire**: the existing
   wire key is `versioning` (per the old flattened
   `SchemaArtifactMetadata`). Keep it as `versioning`? Or rename
   to `schemaVersioning` to clarify when reading a wire form? I'd
   keep `versioning` — short, unambiguous given the schema-artifact
   context.

2. **The CTM 1.6.0 `schema:name` for PresentationComponent**: PC has
   no rendered slot, so the source must be
   `catalogMetadata.preferredLabel`. But this is now an *optional*
   slot. What does the encoder do when it's absent? Two options:
   (a) emit a derived placeholder (the PC's `id` slug); (b) fail
   the encode. I'd suggest (a) — a derived placeholder keeps CTM
   1.6.0 documents valid even when authors haven't supplied a
   catalog name. Document the fallback rule in
   `ctm-1.6.0-serialization.md`.

3. **`Header`/`Footer` on Template**: these are
   `MultilingualString`-valued slots showing content at the top and
   bottom of a rendered form. They're rendered content like `Title`,
   but already top-level on `Template`. No change needed for them
   under this design; just noting they fit the new framing well.

4. **TI's `label` fallback in catalog displays**: when a Workbench
   lists template instances, what does it show for an unlabelled
   instance? Defer to a renderer guideline in `presentation.md`:
   prefer `TemplateInstance.label`, fall back to
   `catalogMetadata.preferredLabel`, fall back to the instance ID
   slug.

## Estimated scope

Comparable to `remove-artifact-name`. Bulk fixture migration is
mechanical (script-driven), spec chapters need careful prose updates,
cedar-ts needs structural type renames + accessor updates everywhere.
Estimated 2 sessions.
