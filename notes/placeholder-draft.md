# `Placeholder` on rendering hints — draft

Draft of the changes that would add a multilingual `Placeholder` slot
to every rendering hint attached to a text-entry-capable field family.
Captured here so the design can be reviewed before propagating into
`grammar.md`, `wire-grammar.md`, `validation.md`, `presentation.md`, the
conformance fixtures, bindings, CTM 1.6.0 mapping, and cedar-ts.

## Motivation

Most text-entry widgets in user-facing forms display **sample input**
inside the empty field — `"YYYY-MM-DD"` in a date input,
`"john.doe@example.com"` in an email input — as format demonstration
that disappears once the user starts typing. HTML calls this the
`placeholder` attribute; CEDAR has no equivalent slot today, so
template authors who care about placeholder text either omit it
(losing UX guidance) or smuggle it into `HelpText` (overloading help
content for a different purpose).

`Placeholder` is distinct from `HelpText` (per the help-text design):

- **`HelpText`** answers "what is this field for?" — semantic content,
  always available, can render inline or as a tooltip.
- **`Placeholder`** answers "what does typed input look like?" — UX
  hint, only visible when the input is empty, format-demonstration.

Per the spec's existing separation principle ("semantic distinctions
MUST be modeled in `FieldSpec`; purely presentational distinctions
MUST be expressed only through compatible typed rendering hints"),
placeholder is a *presentational* concern and lives on
`XxxRenderingHint` productions.

## Scope: 15 field families

Every field family whose authoring widget is a text-entry input gains
placeholder support. The remaining families (`Boolean`,
`SingleValuedEnum`, `MultiValuedEnum`, `AttributeValue`) do not, since
their widgets are not text-entry surfaces.

**Already have rendering hints (5 families) — placeholder added to the
existing production:**

- `Text` (after restructuring — see below)
- `IntegerNumber` and `RealNumber` (both via `NumericRenderingHint`)
- `Date`
- `Time`
- `DateTime`

**No rendering hint today (10 families) — a new `XxxRenderingHint`
production is introduced, carrying just `[Placeholder]` at present:**

- `ControlledTerm` — autocomplete text input.
- `Email` — text input with email-format validation.
- `PhoneNumber` — text input with phone-format validation.
- `Link` — IRI in a text input.
- `Orcid`, `Ror`, `Doi`, `PubMedId`, `Rrid`, `NihGrantId` — the six
  identifier families, all rendered as text inputs.

**Out of scope:**

- `Boolean`, `SingleValuedEnum`, `MultiValuedEnum`, `AttributeValue`.

## `Placeholder` production

```ebnf
Placeholder ::= placeholder( MultilingualString )
```

`Placeholder` is a `MultilingualString`-valued wrapper. Authors who
don't care about multilingual placeholders pass a single localization
and it works as a plain single-language string; authors who localize
their forms can supply per-language placeholders.

Note that placeholder content is *not* part of the field's value, and
is not validated against the field spec's lexical-form constraints
(e.g., `validationRegex`, `langTagRequirement`, `timezoneRequirement`).
A placeholder of `"YYYY-MM-DD"` may quite reasonably appear on a date
field whose values must conform to ISO 8601 — the placeholder is a
demonstration of the expected lexical shape, not an instance of one.

## `TextRenderingHint` restructuring (breaking change)

`TextRenderingHint` is currently a bare string enum:

```ebnf
TextRenderingHint ::= "singleLine" | "multiLine"      -- before
```

To carry an optional `Placeholder`, it is restructured into a
structured object aligned with the other rendering hints:

```ebnf
TextRenderingHint ::= text_rendering_hint(            -- after
                        [TextLineMode]
                        [Placeholder]
                      )

TextLineMode ::= "singleLine" | "multiLine"
```

`TextLineMode` carries the single-line-versus-multi-line distinction
that used to be the value of `TextRenderingHint` itself; it is now an
optional inner slot. The line-mode token's absence is treated as
"renderer's choice," matching the previous behaviour of `null` or
absence.

This is a wire-form-breaking change for templates that carry
`"renderingHint": "singleLine"` or `"renderingHint": "multiLine"` on
their `TextFieldSpec`. Two migration options:

- **Strict:** the new wire form requires the object shape; existing
  templates with the bare-string form fail to parse. Migrators promote
  the bare string into `{ "lineMode": "singleLine" }` etc.
- **Permissive on decode:** the decoder accepts both the bare-string
  form (treated as `{ "lineMode": "<token>" }`) and the new object
  form; the encoder always emits the object form. Existing templates
  load unchanged; new content uses the object form. The bare-string
  form is documented as deprecated and removed in a later revision.

This draft proposes **strict**: the breaking change is small and
contained to one production, the spec's principal `LangTagRequirement`
and `HelpText` work has already broken older wire forms, and
permissive-on-decode adds carry-along complexity for every binding.
If you want permissive-on-decode instead, the draft is easily
adjusted.

## New rendering-hint productions

Ten new productions are introduced, one per family in the "no-hint
today" group. Each is a single-slot object carrying just
`[Placeholder]`:

```ebnf
ControlledTermRenderingHint ::= controlled_term_rendering_hint(
                                  [Placeholder]
                                )

EmailRenderingHint ::= email_rendering_hint( [Placeholder] )

PhoneNumberRenderingHint ::= phone_number_rendering_hint( [Placeholder] )

LinkRenderingHint ::= link_rendering_hint( [Placeholder] )

OrcidRenderingHint    ::= orcid_rendering_hint(    [Placeholder] )
RorRenderingHint      ::= ror_rendering_hint(      [Placeholder] )
DoiRenderingHint      ::= doi_rendering_hint(      [Placeholder] )
PubMedIdRenderingHint ::= pub_med_id_rendering_hint([Placeholder] )
RridRenderingHint     ::= rrid_rendering_hint(     [Placeholder] )
NihGrantIdRenderingHint ::= nih_grant_id_rendering_hint( [Placeholder] )
```

The naming follows the existing per-family convention
(`DateRenderingHint`, `NumericRenderingHint`, etc.). A shared
`IriValueRenderingHint` for the seven IRI-bearing families
(Link + six identifiers) was considered and rejected: the spec's
existing principle that "typed rendering hints make incompatible
combinations structurally invalid" applies to each family-specific
spec/hint pairing, and the per-family productions preserve that
typing while leaving room for family-specific future slots without
breaking out of a shared production.

## Updates to existing rendering-hint productions

Five productions gain an optional `Placeholder`:

```ebnf
TextRenderingHint ::= text_rendering_hint(
                        [TextLineMode]
                        [Placeholder]
                      )

NumericRenderingHint ::= numeric_rendering_hint(
                           [DecimalPlaces]
                           [Placeholder]
                         )

DateRenderingHint ::= date_rendering_hint(
                        [DateComponentOrder]
                        [Placeholder]
                      )

TimeRenderingHint ::= time_rendering_hint(
                        [TimeFormat]
                        [Placeholder]
                      )

DateTimeRenderingHint ::= date_time_rendering_hint(
                            [TimeFormat]
                            [Placeholder]
                          )
```

## Updates to field-spec productions

Each of the 10 families that didn't previously carry a rendering-hint
slot gains one. Pattern:

```ebnf
ControlledTermFieldSpec ::= controlled_term_field_spec(
                              ControlledTermSource+
                              ...
                              [ControlledTermRenderingHint]
                            )

EmailFieldSpec ::= email_field_spec( [EmailRenderingHint] )

PhoneNumberFieldSpec ::= phone_number_field_spec( [PhoneNumberRenderingHint] )

LinkFieldSpec ::= link_field_spec(
                    [LinkValue]
                    [LinkRenderingHint]
                  )

OrcidFieldSpec      ::= orcid_field_spec(      [OrcidRenderingHint] )
RorFieldSpec        ::= ror_field_spec(        [RorRenderingHint] )
DoiFieldSpec        ::= doi_field_spec(        [DoiRenderingHint] )
PubMedIdFieldSpec   ::= pub_med_id_field_spec( [PubMedIdRenderingHint] )
RridFieldSpec       ::= rrid_field_spec(       [RridRenderingHint] )
NihGrantIdFieldSpec ::= nih_grant_id_field_spec([NihGrantIdRenderingHint])
```

These were previously slot-empty (`EmailFieldSpec ::= email_field_spec()`,
etc.); each now has exactly one slot for its rendering hint. The
identifier families' `XxxFieldSpec`s remain near-uniform (just the
rendering-hint slot, no value-shape variation between them).

## Wire-grammar changes

For each updated/new rendering hint, a wire-grammar object:

```
TextLineMode ::: "singleLine" | "multiLine"

TextRenderingHint ::: object {
  lineMode?: TextLineMode
  placeholder?: Placeholder
}

NumericRenderingHint ::: object {
  decimalPlaces?: integer
  placeholder?: Placeholder
}

DateRenderingHint ::: object {
  componentOrder?: DateComponentOrder
  placeholder?: Placeholder
}

TimeRenderingHint ::: object {
  timeFormat?: TimeFormat
  placeholder?: Placeholder
}

DateTimeRenderingHint ::: object {
  timeFormat?: TimeFormat
  placeholder?: Placeholder
}

ControlledTermRenderingHint ::: object { placeholder?: Placeholder }
EmailRenderingHint ::: object          { placeholder?: Placeholder }
PhoneNumberRenderingHint ::: object    { placeholder?: Placeholder }
LinkRenderingHint ::: object           { placeholder?: Placeholder }
OrcidRenderingHint ::: object          { placeholder?: Placeholder }
RorRenderingHint ::: object            { placeholder?: Placeholder }
DoiRenderingHint ::: object            { placeholder?: Placeholder }
PubMedIdRenderingHint ::: object       { placeholder?: Placeholder }
RridRenderingHint ::: object           { placeholder?: Placeholder }
NihGrantIdRenderingHint ::: object     { placeholder?: Placeholder }

Placeholder ::: MultilingualString
```

`Placeholder` collapses on the wire per the wrapper-collapse rule
(§1.6).

The property-name map for §14 gains one row per new production and
one row per existing production (for the new `placeholder?` slot, plus
`lineMode?` on `TextRenderingHint`).

## Validation

No new structural rule is needed. `Placeholder`'s `MultilingualString`
inner content is covered by the existing language-tag-uniqueness rule
on `MultilingualString`. The rendering-hint slot on each field spec
is type-discriminated structurally (only the right hint shape decodes
under each field spec), so no cross-family validation rule applies.

## Presentation

A short addition to `presentation.md`:

- Conforming renderers SHOULD display `Placeholder` content in
  text-entry input fields when those inputs are empty.
- Renderers MUST NOT display `Placeholder` content in a way that
  could be mistaken for an actual user-supplied value (i.e., the
  placeholder MUST be visually distinguishable, typically by reduced
  opacity or a contrasting style).
- Renderers MAY suppress `Placeholder` rendering for accessibility
  reasons (some screen readers handle HTML `placeholder` poorly).
- The localization-selection rule for choosing which
  `Placeholder`-`MultilingualString`-entry to display is the same as
  for `HelpText` and other `MultilingualString` content: renderers
  select by the user's preferred language, falling back per the
  spec's existing localization preference rules.

## Conformance fixtures

Add at least:

- A `TextField` with `placeholder` on its `renderingHint`, exercising
  the new structured form.
- An `EmailField` with `placeholder` on a new
  `EmailRenderingHint` — exercising the "new rendering hint
  introduced for an otherwise-no-hint family" surface.
- A `DateField` with `placeholder` alongside the existing
  `componentOrder` — exercising "placeholder added alongside an
  existing rendering-hint slot."
- A standalone `Field` artifact for at least one identifier family
  (e.g., `OrcidField`) with `placeholder` on its new
  `OrcidRenderingHint`.
- An invalid fixture: `placeholder` on a `BooleanRenderingHint` or
  an enum rendering hint — wire-shape rejection, since those productions
  have no `placeholder` slot.

The mega-fixture (`01-patient-observation-template.json`) should
probably gain a `placeholder` somewhere too, so the round-trip suite
exercises the new production end-to-end.

## CTM 1.6.0 mapping

CTM 1.6.0's `_ui` block carries a `placeholder` slot on several
widget configurations. The encoding direction flattens the
`MultilingualString` to a single string with the same "prefer `en`,
else first entry" rule used elsewhere (`schema:name`, etc.). The
import direction wraps the single string in a `und`-tagged
`LangString`.

Confirm the exact CTM 1.6.0 path before finalising.

## Bindings

Each new rendering-hint production is a plain object production
(per `bindings.md` §2.1). The existing meta-category guidance covers
it; no new patterns introduced.

For the `TextRenderingHint` restructuring, bindings that currently
expose the bare-string form will see a type change:

```ts
// before
renderingHint?: 'singleLine' | 'multiLine';

// after
renderingHint?: { lineMode?: 'singleLine' | 'multiLine'; placeholder?: MultilingualString };
```

cedar-ts call sites that pass a bare string need to be updated to the
object form. The bare-string convenience constructor can be retained
as a syntactic helper in cedar-ts if migration friction is a concern.

## cedar-ts implementation scope

Comparable to the help-text branch:

- 10 new rendering-hint type definitions + constants.
- `TextRenderingHint` restructured from a string-literal type to a
  structured object; `TextLineMode` introduced.
- 5 existing rendering-hint shapes gain a `placeholder?` slot.
- 10 `XxxFieldSpec` productions gain a `renderingHint?` slot.
- Serializer / parser surface for each.
- Tests: round-trip of each new rendering hint; the restructured
  `TextRenderingHint`; the per-family field-spec accepting the new
  slot.

Estimated 2 sessions.

## Open questions

1. **`ControlledTermField`'s rendering-hint slot** — confirmed in
   scope. Could grow further slots later (e.g., autocomplete behaviour
   flags); currently single-slot.

2. **Multilingual placeholder fallback** — when no localization
   matches the user's preferred language, what does the renderer
   display? Probably the first entry; same fallback as `HelpText`.
   Documented as a renderer rule in `presentation.md`.

3. **Existing template migration** — `TextRenderingHint`'s
   restructuring breaks existing wire-form data. Mitigation: a
   migration utility in cedar-ts that promotes the bare-string form
   to the object form. Not strictly needed for the spec; useful for
   downstream consumers.
