# String-value unification — open question

Captured 2026-05-06. Defer.

## The framing

Post literal-flatten, the shape `{ value: string, lang?: LanguageTag }`
appears under **three** different production names in the abstract
grammar:

1. **`TextValue`** — a `Value` admitted by `TextFieldSpec`. Carries
   `value: LexicalForm` + optional `LanguageTag`.
2. **`AnnotationStringValue`** — the string-bearing arm of
   `AnnotationValue`. Carries the same shape.
3. **`LiteralChoiceValue`** (plain and lang-tagged sub-shapes) — a
   `ChoiceValue` admitted by `LiteralChoice*FieldSpec`. Carries the same
   shape, *plus* an optional `datatype` slot for the typed-literal
   sub-shape.

Plus a near-cousin: **`LangString`** (entry of `MultilingualString`)
carries `{value, lang}` with `lang` *required*, not optional.

Each name carries a different role (instance value vs. metadata
annotation vs. choice selection vs. localization-set entry), but the
underlying carried-content is identical or nearly so.

## The renaming question

The user observed that `TextValue` is not specifically tied to
`TextField`-the-family — its content (a localizable string) appears at
several positions in the grammar. Two interpretations:

**(A) Rename only.** `TextValue` becomes `StringValue` (or similar),
`TextField` becomes `StringField`, `TextFieldSpec` becomes
`StringFieldSpec`. The name reflects the carried content, not the field
family. The other string-shaped productions (`AnnotationStringValue`,
the plain/lang sub-shapes of `LiteralChoiceValue`) survive under their
role-specific names.

**(B) Unify.** Make `StringValue` (or whatever the canonical name is)
the single production for "localizable string content," and have
`AnnotationValue` and the lang/plain sub-shapes of `LiteralChoiceValue`
*reuse* it. This means:

- `AnnotationValue ::= StringValue | Iri` — drops
  `AnnotationStringValue` as a separate production.
- `LiteralChoiceValue` either becomes `StringValue` + optional
  `datatype`, or splits into a union where the plain/lang arms are
  literally `StringValue` and the typed arm is a separate
  `TypedLiteralChoiceValue` production.

Interpretation B is cleaner — one canonical "localizable string" shape
across the grammar — but bigger ripple. Interpretation A is the
minimum-change rename.

## User's leaning (2026-05-06)

> "I was thinking B, where StringValue is the canonical shape for all
> but I am not sure. I think we can come back to this."

Defer until we want to take it on. Probably revisit after the LinkML
schema update lands and the dust from the literal-flatten settles.

## Open sub-questions

- **Naming.** `StringValue` is symmetric with `BooleanValue`,
  `IntegerNumberValue`. But "string" is programmer-y; metadata authors
  read "text" more naturally. The audience matters.
- **`LangString` vs. canonical string-value.** `LangString` carries a
  *required* lang tag (it's an entry inside a `MultilingualString`,
  where each entry must specify its localization). The canonical
  string-value carries an *optional* lang tag. Are they really the same
  shape, or is the required-vs-optional distinction load-bearing? My
  current read: load-bearing — `MultilingualString` semantics depend on
  every entry being unambiguously tagged.
- **Field-spec naming knock-on.** If `TextValue` becomes `StringValue`,
  do the family names follow? `TextField` → `StringField`,
  `TextFieldSpec` → `StringFieldSpec`, `EmbeddedTextField` →
  `EmbeddedStringField`, `TextFieldId`, `TextRenderingHint`. Likely
  yes, but worth thinking through.
- **LinkML alignment.** LinkML uses `String` as the scalar core type
  name. A rename to `String*` aligns with that. `Text` doesn't.

## Things to verify before changing anything

- Whether real CEDAR templates ever use `TextValue` annotations at a
  non-text position (would inform whether B is a clean unification or a
  semantic stretch).
- Whether the reading audience (form authors vs. binding implementers)
  prefers "text" or "string" terminology.
- Whether the LinkML schema (which the user is updating separately)
  already commits to one or the other.

## Recommendation

Hold. Revisit after the literal-flatten / IRI-removal dust settles and
the LinkML schema is brought in line. At that point, either:

1. Decide on (B) and execute as a single coherent push spanning grammar,
   wire-grammar, serialization, validation, bindings, rdf-projection,
   ctm-1.6.0, plus cedar-ts. Similar scope to the literal-flatten.
2. Decide to keep `TextValue` and accept the naming inconsistency. Note
   that the inconsistency is now permanent and document the rationale
   in `notation.md`.
