# `HelpText` and template-level help-display mode — draft

Draft of the changes that would add per-field `HelpText` and a
template-level `HelpDisplayMode` to the structural spec. Captured here
so it can be reviewed before propagating into `grammar.md`,
`wire-grammar.md`, `validation.md`, `presentation.md`, the conformance
fixtures, bindings, CTM 1.6.0 mapping, and cedar-ts.

## Motivation

CEDAR fields commonly carry explanatory guidance — what is this field
asking for, why does it matter, what form should the answer take.
Today the spec has no first-class slot for this content. Authors who
need it overload `Description` (whose role is the artifact-catalog
description) or `AltLabels` (whose role is synonym search), or embed
the guidance in field-renamed `LabelOverride` text, none of which
matches the authoring intent.

Three distinct phenomena are in scope:

- **Help text** — persistent explanatory prose attached to a field,
  displayed *with* the field. Could render inline beneath the input,
  as a hover tooltip, or as both. Always available to assistive
  technologies regardless of presentation choice.
- **Tooltip** — same content category as inline help, but presented
  on hover/focus rather than always-on. Not a separate model concern;
  the spec models it as a *presentation mode* for help text.
- **Placeholder** — sample input shown inside an empty text-entry
  widget (e.g., `"YYYY-MM-DD"` in a date-as-text field). A different
  *kind* of content — format demonstration rather than explanation —
  and bound to text-entry widgets specifically. **Out of scope for
  this draft.** Placeholder is a rendering-hint concern (it would
  live on `TextRenderingHint`, etc.) and should be tackled
  separately if needed.

## Design summary

Three additions:

1. **`HelpText` on `Field`** — a `MultilingualString`-typed slot on the
   reusable `Field` artifact. Carries the canonical help text for the
   field, regardless of embedding context.
2. **`HelpTextOverride` on `EmbeddedField`** — an optional
   `MultilingualString` slot that overrides the field's help text for
   a specific embedding. Mirrors the existing `LabelOverride`
   precedent.
3. **`TemplateRenderingHint` on `Template`** — a new production
   carrying form-level UX configuration, of which the first slot is
   `HelpDisplayMode`. Defined as a general home for future form-level
   UX switches (density, validation timing, etc.).

Plus a documented **renderer cascade rule**: when a `Template` is
embedded inside another `Template`, the outer's `HelpDisplayMode`
overrides the inner's for help-text rendering. The inner's own
`HelpDisplayMode` applies only when the inner is rendered standalone.

## Changes to `grammar.md`

### 1. `HelpText` production

```ebnf
HelpText ::= help_text( MultilingualString )
```

`HelpText` is a `MultilingualString`-valued display production carrying
authored guidance about a field's intended content. Renderers display
it inline beneath the field, as a hover tooltip, both, or not at all,
according to the enclosing `Template`'s `HelpDisplayMode` setting.

### 2. Add `HelpText` to every `Field` artifact production

The 20 concrete `Field` productions (`TextField`, `IntegerNumberField`,
`BooleanField`, …, `AttributeValueField`) each gain an optional
`HelpText` slot. For example:

```ebnf
TextField ::= text_field(
                TextFieldId
                SchemaArtifactMetadata
                TextFieldSpec
                [HelpText]
              )
```

Repeated identically for all 20 field families. Slot is optional;
absent help text renders nothing regardless of mode.

### 3. Add `HelpTextOverride` to every `EmbeddedField` production

Each `EmbeddedXxxField` gains an optional `HelpTextOverride` slot,
parallel to the existing `LabelOverride`. Single layered-override
semantics: if both the `Field`'s `HelpText` and the
`EmbeddedField`'s `HelpTextOverride` are present, the override wins
*at that embedding site only*.

```ebnf
HelpTextOverride ::= help_text_override( MultilingualString )

EmbeddedTextField ::= embedded_text_field(
                        EmbeddedArtifactKey
                        TextFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [LabelOverride]
                        [HelpTextOverride]
                        [TextValue]              // defaultValue
                        [Property]
                      )
```

Repeated for all 20 `EmbeddedXxxField` productions.

### 4. `TemplateRenderingHint` production

```ebnf
TemplateRenderingHint ::= template_rendering_hint(
                            [HelpDisplayMode]
                          )

HelpDisplayMode ::= "inline" | "tooltip" | "both" | "none"
```

Carried by `Template` as an optional slot.

```ebnf
Template ::= template(
               TemplateId
               SchemaArtifactMetadata
               [TemplateRenderingHint]
               [Header]
               [Footer]
               EmbeddedArtifact*
             )
```

`HelpDisplayMode` arms:

- `"inline"` — `HelpText` renders as visible text adjacent to the
  field (typically beneath the input).
- `"tooltip"` — `HelpText` renders as a hover/focus tooltip,
  triggered by a `?` icon or similar affordance.
- `"both"` — both presentations are emitted. Useful for accessibility
  contexts where redundancy is preferred.
- `"none"` — the field's `HelpText` is not displayed at form-render
  time. The content remains part of the model (visible to alternative
  renderers, RDF projection, catalog displays) but the form-rendering
  layer suppresses it.

When `HelpDisplayMode` is absent — either because the `Template`
carries no `TemplateRenderingHint`, or because the hint omits the slot
— the default behaviour is `"inline"`.

### 5. Renderer cascade rule (prose)

The cascade rule is a rendering-time concern, not a structural
constraint. The model allows every `Template` to carry its own
`HelpDisplayMode`, and the validator raises no error when an outer
and inner template disagree. The cascade applies at render time:

> When a `Template` is embedded inside another `Template` (via
> `EmbeddedTemplate`), the inner template's `HelpDisplayMode` is
> ignored for help-text rendering at that embedding site. The
> enclosing `Template`'s `HelpDisplayMode` applies to every field
> within the rendered form, including fields contributed by nested
> templates.
>
> A nested template's own `HelpDisplayMode` setting applies only
> when the template is rendered standalone (e.g., previewed in
> authoring tooling, or used as the top-level template in some
> other context).

This rule is **specific to `HelpDisplayMode`**. Future
`TemplateRenderingHint` slots may have different cascade semantics
and should declare their own rule.

## Changes to `wire-grammar.md`

### `Field` wire objects gain `helpText?`

Every `XxxField` wire object (`TextField`, `IntegerNumberField`, …)
gains:

```ts
helpText?: HelpText
```

`HelpText` is `MultilingualString`-typed and collapses on the wire
per the wrapper-collapse rule (§1.6).

### `EmbeddedField` wire objects gain `helpTextOverride?`

Every `EmbeddedXxxField` wire object gains:

```ts
helpTextOverride?: HelpTextOverride
```

Same collapse behaviour.

### `Template` gains `renderingHint?`

```ts
Template ::: object {
  kind: "Template"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  renderingHint?: TemplateRenderingHint
  header?: Header
  footer?: Footer
  members: array<EmbeddedArtifact>
}

TemplateRenderingHint ::: object {
  helpDisplayMode?: HelpDisplayMode
}

HelpDisplayMode ::: "inline" | "tooltip" | "both" | "none"
```

### Property-name map updates

Twenty new rows on `XxxField` productions for `[HelpText] →
helpText?`. Twenty new rows on `EmbeddedXxxField` for
`[HelpTextOverride] → helpTextOverride?`. One new row on `Template`
for `[TemplateRenderingHint] → renderingHint?`. One new entry for
`TemplateRenderingHint` itself.

## Changes to `validation.md`

### Validation rule for `HelpDisplayMode`

> If `template.template_rendering_hint.help_display_mode` is present:
> verify it is one of `"inline"`, `"tooltip"`, `"both"`, `"none"`.
> *On failure:* `wireShape` at
> `<template>/renderingHint/helpDisplayMode`, production
> `HelpDisplayMode`, message `"unknown HelpDisplayMode value"`.

### Multilingual-string uniqueness on `HelpText`

The existing `MultilingualString` uniqueness rule (lang tags must be
unique within a `MultilingualString` under case-folded comparison)
applies automatically to `HelpText` and `HelpTextOverride` since
both are `MultilingualString`-valued. No new rule needed.

### Override precedence

Not a validation rule — a *rendering* rule. Documented in
`presentation.md` (or as prose in `grammar.md`) alongside the
cascade rule. The validator does not enforce that a `Field`'s
`HelpText` and the embedding's `HelpTextOverride` differ.

## Changes to `presentation.md`

Add a new section on help text rendering:

- Per-field `HelpText` is canonical; per-embedding
  `HelpTextOverride` wins at that site if both are present.
- The enclosing `Template`'s `HelpDisplayMode` selects the
  presentation; default is `"inline"`.
- The nested-template cascade rule (above).
- `"none"` suppresses rendering but preserves the content in the
  model.

## Changes to conformance fixtures

Add at minimum:

- A `TextField` valid fixture carrying `helpText`.
- An `EmbeddedTextField` fixture carrying `helpTextOverride`.
- A `Template` valid fixture carrying `renderingHint:
  { helpDisplayMode: "tooltip" }`.
- A `Template` valid fixture using `helpDisplayMode: "none"` to
  verify the model preserves the content.
- An invalid fixture: unknown `helpDisplayMode` value.

The existing mega-fixture (`01-patient-observation-template.json`)
should gain a `helpText` slot on at least one of its referenced
fields and a `renderingHint` on the template, so the round-trip test
exercises the new productions end-to-end. The referenced fields are
unresolved in the existing example, so adding `helpText` only
matters if standalone `Field` fixtures (49+) are also updated.

## Changes to `ctm-1.6.0-serialization.md`

CTM 1.6.0 has a `_ui.helpText` slot (need to verify exact location)
and may or may not have a form-level display-mode equivalent. Two
directions:

- **Encoding (v2.0.0 → CTM 1.6.0).** Project `Field.helpText` (a
  `MultilingualString`) to CTM 1.6.0's `_ui.helpText` (a single
  string), flattening with the same "prefer `en`, else first entry"
  rule used for `schema:name`. Embedding-level
  `HelpTextOverride` is similarly projected to whichever CTM 1.6.0
  slot carries embedding-level help. The `HelpDisplayMode` may have
  no CTM 1.6.0 equivalent; if so, encode as a default (`"inline"`)
  and lose the explicit setting.
- **Import (CTM 1.6.0 → v2.0.0).** `_ui.helpText` on a field
  becomes a single-entry `und`-tagged `HelpText`
  `MultilingualString`. The form-level mode defaults to `inline` if
  unrepresented in 1.6.0.

Confirm the CTM 1.6.0 vocabulary before finalising.

## Changes to `bindings.md`

Add brief idioms for `HelpText` / `HelpTextOverride` in TypeScript,
Java, Python. Bindings consumers should expose the per-embedding
override-precedence rule as a convenience accessor:
`resolvedHelpText(embeddedField, field): MultilingualString | undefined`.

## Changes to `cedar-ts`

- Each `XxxField` interface and builder gains an optional `helpText`
  slot.
- Each `EmbeddedXxxField` interface and builder gains an optional
  `helpTextOverride` slot.
- `Template` gains an optional `renderingHint` slot whose type is the
  new `TemplateRenderingHint` interface.
- New `HelpDisplayMode` type and `HELP_DISPLAY_MODES` constant
  (analogous to `TIMEZONE_REQUIREMENTS`, `LANG_TAG_REQUIREMENTS`).
- Serialize/parse round-trip for all of the above.

## Sub-questions worth flagging

1. **Should `HelpText` also apply to `EmbeddedTemplate`?** Authors
   might want guidance attached to a nested-template embedding ("this
   section captures the patient's address"). The existing slot for
   this is `Template.header` / `Template.footer` on the inner
   template, which already carries `MultilingualString`-valued
   content. I'd say no — `header` covers it. But worth confirming.

2. **Should `EmbeddedPresentationComponent` have `HelpText`?**
   No — presentation components *are* explanatory content. Adding
   help text to a `RichTextComponent` would be a meta-explanation.

3. **`HelpDisplayMode: "both"` and accessibility.** Both is the
   accessibility-friendly mode: screen readers always get the inline
   help, sighted users also get the tooltip. Worth a paragraph in
   `presentation.md` recommending `"both"` for accessibility-sensitive
   contexts.

4. **Per-language `HelpDisplayMode`?** No. The display mode is a
   form-level UX choice, independent of which language the user is
   viewing the form in. `HelpText` is multilingual; `HelpDisplayMode`
   is not.

5. **Future `TemplateRenderingHint` slots.** Naming the production
   `TemplateRenderingHint` (rather than `HelpDisplayConfig` or
   similar) generalizes it for future form-level UX switches:
   `density: compact | regular | comfortable`, `validationTiming:
   onBlur | onSubmit`, `saveBarStickiness: sticky | inline`, etc.
   Each future slot needs to define its own cascade behaviour.

6. **Migration of existing templates.** Existing v2.0.0 fixtures and
   templates have no `helpText` / `helpTextOverride` /
   `renderingHint` slots. All slots are optional; existing data
   remains valid without change. The feature is opt-in.

## Open authoring question

Where does an author put the help text for an *inline field* (if/when
issue #1's inline-field design lands)? The natural answer is "directly
on the inline field, alongside its `Label` slot," since inline fields
are template-local and have no separate `Field` artifact to carry the
help text. This is a small detail to handle when the inline-field
design is finalised; flagged here so it isn't missed.

## Estimated scope

Comparable to `LangTagRequirement` but slightly larger because the
slot lands on 20 `Field` productions and 20 `EmbeddedField`
productions:

- `grammar.md` — `HelpText` production + 20 `Field` productions +
  20 `EmbeddedField` productions + `TemplateRenderingHint` +
  `HelpDisplayMode` + `Template` slot. ~60 lines.
- `wire-grammar.md` — 41 new optional wire properties + 1 new
  object shape. Property-name map updates.
- `validation.md` — 1 new enum-value rule. Existing multilingual
  uniqueness covers `HelpText` and `HelpTextOverride` automatically.
- `presentation.md` — new section on help-text rendering and the
  cascade rule.
- 5–6 conformance fixtures.
- `ctm-1.6.0-serialization.md` — encoding and import rules.
- `bindings.md` — short subsection.
- cedar-ts — same surface area as the spec changes.

Estimated 2–3 sessions to land cleanly.
