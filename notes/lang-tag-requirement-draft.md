# `LangTagRequirement` — draft addition to `TextFieldSpec`

Draft of the changes that would add a `LangTagRequirement` slot to
`TextFieldSpec`, analogous to the existing `TimezoneRequirement` slot on
`TimeFieldSpec` / `DateTimeFieldSpec`. Captured here so it can be reviewed
before propagating into `grammar.md`, `wire-grammar.md`, `validation.md`,
the conformance fixtures, the bindings, and cedar-ts.

## Motivation

`EmbeddedTextField` currently admits `TextValue` with optional `lang`,
collapsing two distinct authoring intents:

1. Text where a language tag is meaningful and authors want or expect one
   (titles, abstracts, comments).
2. Text where a language tag is meaningless (identifiers, slugs, query
   fragments, ASCII-only programmer-y strings).

The unified optional-lang shape is convenient for authors but lossy for
validators (no enforcement) and lossy for downstream projections
(LinkML, RDF) which have to guess intent.

A new `LangTagRequirement` slot on `TextFieldSpec` lets template authors
declare the intent at the field-spec level. The wire-form shape of
`TextValue` is unchanged.

## Design choice: two arms or three?

`TimezoneRequirement` is two-arm: `"timezoneRequired" | "timezoneNotRequired"`.
The two-arm shape is just "do I require it / do I not?" — "not required"
includes both "may be present" and "must not be present" without
distinguishing.

A two-arm `LangTagRequirement` would read `"langTagRequired" |
"langTagNotRequired"` and match `TimezoneRequirement`'s shape exactly.

A three-arm form would read `"langTagRequired" | "langTagOptional" |
"langTagForbidden"` and add the genuinely useful "must not be present"
case — directly useful for projecting to LinkML `range: string` without
the projector having to guess. The cost is asymmetry with
`TimezoneRequirement`.

**Recommendation: three arms.** The `forbidden` arm is the one that
maps cleanly to LinkML `range: string`, which is the most common
projection target. `TimezoneRequirement` got away with two arms because
date-time fields almost always project to a `datetime`-typed slot
(retaining tz handling), not a tz-stripped scalar. Text is different —
the most natural LinkML projection for text identifiers is a bare
`string`, not a `LangString`, and `forbidden` enforces that.

If you prefer symmetry with `TimezoneRequirement`, downgrade to two arms
and lose the `forbidden` case; the projection rule becomes "if the
field-spec carries `langTagNotRequired`, the projection MAY shed the tag,
but the wire form MAY still carry one."

The rest of this draft assumes **three arms**.

## Changes to `grammar.md`

### Add to the `TextFieldSpec` production

```ebnf
TextFieldSpec ::= text_field_spec(
                    [TextValue]
                    [MinLength]
                    [MaxLength]
                    [ValidationRegex]
                    [LangTagRequirement]                  ← NEW
                    [TextRenderingHint]
                  )

LangTagRequirement ::= "langTagRequired"
                     | "langTagOptional"
                     | "langTagForbidden"
```

### Prose to add immediately after the production

> `LangTagRequirement` identifies whether the `lang` slot of a `TextValue`
> is required, optional, or forbidden by the field spec.
>
> - `"langTagRequired"` — every `TextValue` admitted by this field
>   MUST carry a `lang` slot with a well-formed BCP 47 tag.
> - `"langTagOptional"` — every `TextValue` admitted MAY carry a `lang`
>   slot. This matches the default behaviour when `LangTagRequirement` is
>   absent and is provided for explicitness.
> - `"langTagForbidden"` — every `TextValue` admitted MUST NOT carry a
>   `lang` slot. Use this for text fields whose values are technical
>   identifiers, slugs, query fragments, or other strings for which a
>   natural-language tag has no meaning.
>
> When `LangTagRequirement` is absent from a `TextFieldSpec`, the
> constraint behaves as `"langTagOptional"` (the historical default).
>
> The `LangTagRequirement` constraint applies to each `TextValue`
> individually: in a multi-valued field, every value MUST satisfy the
> constraint independently. The constraint also applies to the
> field-spec-level `defaultValue` (when present) and to any
> embedding-level `defaultValue` carried by an `EmbeddedTextField`.

### Cross-references

- Add to the "Constraints derived from field specs" enumeration (if
  one exists in `grammar.md`).
- Add `LangTagRequirement` to `index-of-productions.md` (auto-generated).

## Changes to `wire-grammar.md`

### Add to the `TextFieldSpec` wire object

```ts
TextFieldSpec ::: object {
  "kind": "TextFieldSpec"
  defaultValue?: TextValue
  minLength?: integer
  maxLength?: integer
  validationRegex?: string
  langTagRequirement?: LangTagRequirement   ← NEW
  renderingHint?: TextRenderingHint
}

LangTagRequirement ::: "langTagRequired" | "langTagOptional" | "langTagForbidden"
```

### Add to the property-name map (§14)

```
**`TextFieldSpec`** (`text_field_spec`):
  ...existing rows...
  1. `[LangTagRequirement]` → `langTagRequirement?`
  2. `[TextRenderingHint]` → `renderingHint?`
```

## Changes to `validation.md`

### Add to `validate_text_field_spec(fieldSpec: TextFieldSpec)`

Currently this subroutine has rules for `minLength` ≤ `maxLength` (and
similar). Add at the end:

> N. If `fieldSpec.langTagRequirement` is present: verify the value is
> one of `"langTagRequired"`, `"langTagOptional"`, `"langTagForbidden"`.
> *On failure:* `wireShape` at `<fieldSpec>/langTagRequirement`,
> production `LangTagRequirement`,
> message `"unknown LangTagRequirement value"`.

### Add to `validate_text_value(value: TextValue, fieldSpec: TextFieldSpec)`

Currently this subroutine verifies length, regex, and BCP 47 well-formedness
of the `lang` slot. Add two new steps after the existing lang check
(line ~644):

> 5. If `fieldSpec.langTagRequirement = "langTagRequired"`: verify
>    `value.lang` is present.
>    *On failure:* `structural` at `<value>/lang`, production `TextValue`,
>    message `"lang tag missing; TextFieldSpec.langTagRequirement is 'langTagRequired'"`.
>
> 6. If `fieldSpec.langTagRequirement = "langTagForbidden"`: verify
>    `value.lang` is absent.
>    *On failure:* `structural` at `<value>/lang`, production `TextValue`,
>    message `"lang tag present; TextFieldSpec.langTagRequirement is 'langTagForbidden'"`.

### Default-value rule

The existing `validate_default_value(defaultValue, fieldSpec)` subroutine
calls `validate_text_value(defaultValue, fieldSpec)` for `TextFieldSpec`,
so the `LangTagRequirement` constraint is automatically enforced on the
field-spec-level default. No additional subroutine change is needed.

The embedding-level default on `EmbeddedTextField` is similarly validated
by re-invoking `validate_text_value` against the same field spec.

## Changes to conformance fixtures

Add at minimum:

- `valid/NN-text-field-lang-tag-required-template.json` —
  `TextFieldSpec` with `langTagRequirement: "langTagRequired"`.
- `valid/NN+1-text-field-lang-tag-required-instance.json` — a `TextValue`
  with a `lang` slot.
- `invalid/NN-text-field-lang-tag-required-missing-tag.json` — a
  `TextValue` with no `lang` slot under a `langTagRequired` field spec.
  Expected error: `structural` at the value's `/lang` path.
- `valid/NN-text-field-lang-tag-forbidden-template.json` —
  `TextFieldSpec` with `langTagRequirement: "langTagForbidden"`.
- `valid/NN+1-text-field-lang-tag-forbidden-instance.json` — a
  `TextValue` with no `lang` slot.
- `invalid/NN-text-field-lang-tag-forbidden-tag-present.json` — a
  `TextValue` carrying a `lang` slot under a `langTagForbidden` field
  spec. Expected error: `structural` at the value's `/lang` path.

If `langTagOptional` is exercised in `01-patient-observation-*` already
(or any existing fixture admits both shapes), no further fixtures needed
for that arm.

Consider one more invalid fixture: a field-spec-level `defaultValue`
that violates the `LangTagRequirement` (e.g. `langTagRequired` with a
default-value `TextValue` missing `lang`). This exercises the
default-value path through `validate_default_value`.

## Changes to `rdf-projection.md`

Probably no change to the projection algorithm itself — `TextValue` with
no `lang` slot already projects to a plain `xsd:string` literal, and
`TextValue` with a `lang` slot projects to a language-tagged literal.
The `LangTagRequirement` constraint is enforced *before* projection, so
the projector never sees an invalid value.

Worth adding a paragraph noting that `LangTagRequirement: forbidden`
projects to `xsd:string` literals (never language-tagged), and
`LangTagRequirement: required` always projects to language-tagged
literals — i.e., projecting a CEDAR template that uses these constraints
guarantees the corresponding RDF literal type at every position.

## Changes to `bindings.md`

For TypeScript / Java / Python, the natural type narrowing depends on the
field-spec constraint:

- `langTagForbidden` → a slot whose value type is the plain string type
  in the host language (e.g. `string` in TypeScript, no separate
  `lang` slot).
- `langTagRequired` → a slot whose value type carries a required `lang`
  (e.g. a `LangString`-shaped class).
- `langTagOptional` → a slot whose value type carries an optional `lang`
  (the current `TextValue` shape).

Whether the bindings actually generate three different types or always
generate the loose `TextValue` shape and rely on runtime validation is a
binding-author choice. Document the trade-off; don't mandate the strict
form.

## Changes to the LinkML projection rule

Once the LinkML projection lands as a spec section (or is captured as a
generator), the rule branches on `LangTagRequirement`:

| `LangTagRequirement` | Single-valued projection | Multivalued projection |
|---|---|---|
| `langTagForbidden` | `range: string` | `range: string`, `multivalued: true` |
| `langTagRequired` | `range: LangString` (or new `TaggedString` if `LangString` is to remain metadata-only) | `range: LangString`, `multivalued: true` |
| `langTagOptional` (or absent) | `range: string` (tag shed) | `range: string`, `multivalued: true` (tag shed) |

The "tag shed" rows are the lossy ones. If a per-Template schema needs
to preserve optional tags, the field-spec author should use
`langTagRequired` instead.

## Subsidiary question: `AnnotationStringValue`

Annotation bodies have the same `value + optional lang` shape as
`TextValue`. Should `AnnotationStringValue` also gain a
`LangTagRequirement` (or similar) constraint?

Defer. Annotations are out-of-band metadata at every position they
appear, and there's no per-annotation field-spec analogue to carry the
constraint. The closest analogue would be a per-property constraint
(e.g. "annotations carrying `https://schema.org/keywords` MUST have lang
tags"), which is a vocabulary-level concern, not a structural-spec
concern. Leave annotations alone.

## Subsidiary question: do annotations consume this on the embedded artifact too?

The constraint lives on `TextFieldSpec`. The embedded form
`EmbeddedTextField` carries an optional embedding-level `defaultValue`
plus an optional `labelOverride` whose `label` is `MultilingualString`
(metadata-only — unaffected). The embedding-level `defaultValue` is a
`TextValue` and so is subject to the constraint via the same validator
path. No additional changes needed at the embedded layer.

## Subsidiary question: should the default for the existing fixtures change?

No. The default behaviour when `LangTagRequirement` is absent is
`langTagOptional`, which is exactly the current behaviour. Existing
fixtures and templates remain valid without change. The feature is
opt-in.

## Open questions

1. **Should `LangTagRequirement` apply at `AnnotationStringValue` after
   all?** Tentative: no. See subsidiary question above.

2. **`langTagRequired` + `MultilingualString`-style uniqueness?** Should
   a multi-valued `EmbeddedTextField` with `langTagRequired` *also*
   enforce uniqueness of tags across its values, mimicking
   `MultilingualString` set semantics? Tentative: no — that conflates
   "every value is tagged" with "the tagged values form a set." If you
   want set semantics, that's a separate (and probably wrong) feature
   for instance data, since `MultilingualString` is metadata-only.
   Per the asymmetry-#1 resolution, multilingual instance text is a
   list, not a set.

3. **Should this also gain a sibling on `EnumFieldSpec` for enum-value
   tokens?** Almost certainly not — `EnumValue` carries a token, not a
   lang-tagged string.

4. **Migration of cedar-ts and existing tooling.** Cedar-ts decoders
   need to accept and pass through the new slot; validators need the new
   rules. Same scope as a typical field-spec extension. No wire-form
   compatibility break for templates that don't use the constraint.

## Estimated scope

Comparable to adding `TimezoneRequirement` historically:

- `grammar.md` — ~25 lines.
- `wire-grammar.md` — ~10 lines.
- `validation.md` — 3 new `Verify` rows (one on the spec, two on the
  value).
- 6 conformance fixtures.
- `rdf-projection.md` — one short paragraph.
- `bindings.md` — one table or short subsection.
- `cedar-ts` — schema additions, validator wiring, tests.
- LinkML projection rule — one table row per arm.

Estimated 1–2 sessions to land cleanly.
