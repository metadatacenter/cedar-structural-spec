# Normative test fixtures

This directory contains the test fixtures referenced by
[`spec/serialization.md`](../serialization.md) §8. Each fixture is the
authoritative source; the spec embeds these files via mdBook's
`{{#include}}` directive so the prose and the JSON cannot drift apart.

A conforming binding (TypeScript, Java, Python, or otherwise) SHOULD
treat this directory as a cross-language acceptance suite: every
binding MUST decode every file under `valid/`, encode the resulting
in-memory value back to JSON, and verify §7 round-trip equivalence
against the original; every binding MUST decode every file under
`invalid/<case>/input.json` and report at least the errors in
`invalid/<case>/expected-errors.json`.

## Layout

```
normative-tests/
├── README.md                              # this file
├── valid/
│   ├── 01-02   mega-fixtures (Template + Instance, 5 families)
│   ├── 03-48   per-family Template + Instance pairs (the embedding surface)
│   ├── 49-72   per-family Field artifacts (the artifact + FieldSpec surface)
│   ├── 73-77   presentation components
│   ├── 78-83   LangTagRequirement (template + instance + field per arm)
│   ├── 84-87   HelpText / HelpTextOverride / HelpDisplayMode
│   └── 88-91   Placeholder (text / email / date / orcid)
└── invalid/
    ├── 01-unknown-kind/                                # wireShape (§9.5)
    ├── 02-fieldid-family-mismatch-and-duplicate-key/   # structural (×2)
    ├── 03-required-property-missing/                   # wireShape
    ├── 04-unknown-property/                            # wireShape (§9.5)
    ├── 05-empty-non-empty-array/                       # wireShape
    ├── 06-invalid-iri/                                 # lexical (RFC 3987)
    ├── 07-invalid-bcp47-tag/                           # lexical (RFC 5646)
    ├── 08-integer-lexical-leading-zero/                # lexical (IntegerLexicalForm)
    ├── 09-ascii-identifier-with-space/                 # lexical (AsciiIdentifier)
    ├── 10-cardinality-min-greater-than-max/            # structural
    ├── 11-duplicate-lang-tag/                          # structural
    ├── 12-default-not-in-permissible-values/           # structural
    ├── 13-ontology-display-hint-empty/                 # structural (at-least-one-of)
    ├── 14-permissible-value-token-not-unique/          # structural (uniqueness)
    ├── 15-multi-valued-enum-default-duplicate/         # structural (uniqueness)
    ├── 16-date-field-default-arm-mismatch/             # structural (cross-slot consistency)
    ├── 17-previous-version-equals-derived-from/        # structural (cross-slot exclusion)
    ├── 18-invalid-semantic-version/                    # lexical (SemanticVersion)
    ├── 19-invalid-iso8601-datetime/                    # lexical (Iso8601DateTimeLexicalForm)
    ├── 20-text-lang-tag-required-missing/              # structural (LangTagRequirement)
    ├── 21-text-lang-tag-forbidden-present/             # structural (LangTagRequirement)
    ├── 22-unknown-help-display-mode/                   # wireShape (HelpDisplayMode)
    └── 23-text-rendering-hint-bare-string/             # wireShape (TextRenderingHint)
        # each subdirectory contains input.json + expected-errors.json
```

## Fixture coverage

The valid suite is layered into four groups, each addressing a
different part of the wire surface:

**`01`–`02` Mega-fixtures.** A single `Template` and a conforming
`TemplateInstance` exercising five field families (text, single-
valued enum, date, integer, controlled-term) together with full-fat
metadata, multilingual labels, two annotations on metadata
(string-bodied and IRI-bodied), header content, varied cardinalities,
and the three flavours of `defaultValue` (kind-dropped, kind-retained
on a polymorphic union, bare-token). Referenced from
`serialization.md` §8.

**`03`–`48` Per-embedded-family fixtures.** One minimal Template +
Instance pair for every concrete `EmbeddedXxxField` family (20
families). Each pair exercises:

- the per-family `EmbeddedXxxField.kind`
- the per-family typed identifier slot (`artifactRef`)
- the per-family `Value` arm at `FieldEntry.values[*]`
- the four §9 deviations from the standard embedded-field template:
  - `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` omit
    `cardinality`
  - `EmbeddedMultiValuedEnumField` carries `array<EnumValue>` for
    `defaultValue`
  - `EmbeddedAttributeValueField` omits `defaultValue`

Extra fixtures are included for each of the four numeric value types
(`IntegerValue`, `DecimalValue`, `FloatValue`, `DoubleValue`) and for
two of the three `DateValue` arms (`YearValue`, `YearMonthValue` — the
third, `FullDateValue`, is covered by `13-date`).

**`49`–`72` Per-family Field artifacts.** One `Field` artifact JSON
per family, exercising every slot of its `XxxFieldSpec` at least once
across the suite. This complements the embedding surface above; a
binding's encoder/decoder must handle both. Notable fixtures within
this group:

- `49-text-field`: minLength, maxLength, validationRegex, default-
  Value, renderingHint, all populated.
- `50-integer-field`: unit (with label), minValue, maxValue,
  numericRenderingHint with decimalPlaces.
- `51-decimal-field` / `52-double-field` / `110-float-field`:
  the decimal, double, and float families with appropriate
  `minValue` / `maxValue` lexical forms (including `INF`/`-INF` for
  the `float` and `double` families).
- `57`–`60`: the four `ControlledTermSource` discriminator variants
  (`OntologySource`, `BranchSource`, `ClassSource`, `ValueSetSource`).
- `61-single-valued-enum-field`: `permissibleValues` with all four
  optional component slots populated (`label`, `description`,
  `meanings`); `defaultValue` and `dropdown` rendering hint.
- `62-multi-valued-enum-field`: `defaultValues` array with two
  pre-selected tokens.
- `66`–`71`: the six external-authority `XxxFieldSpec` shapes (each
  is currently empty per the wire grammar — they all share
  `{ "kind": "<Family>FieldSpec" }` — but each is included so a
  binding's discriminator dispatch is exercised over every kind it
  must recognise).

**`73`–`77` Presentation components.** One JSON document per concrete
`XxxComponent` kind: `RichTextComponent` (with `html` content),
`ImageComponent` (with `image` IRI, `label`, `description`),
`YoutubeVideoComponent` (with `video` IRI, `label`),
`SectionBreakComponent`, `PageBreakComponent`. Presentation
components carry `ArtifactMetadata` (not `SchemaArtifactMetadata`),
and the metadata fixtures here exercise that distinction.

**`78`–`83` `LangTagRequirement`.** Two Template + Instance pairs
exercising `langTagRequired` (a tagged title) and `langTagForbidden`
(an untagged slug), plus the corresponding standalone `TextField`
artifacts. The `langTagOptional` arm is the default behaviour and is
exercised throughout the other valid fixtures, so no dedicated
fixtures for it are needed.

**`84`–`87` Help text and display mode.** Four fixtures covering the
help-text feature:

- `84` — a standalone `TextField` carrying multilingual `helpText`
  (English and German).
- `85` — a `Template` setting `renderingHint.helpDisplayMode` to
  `"tooltip"`.
- `86` — a `Template` whose `EmbeddedTextField` carries a
  `helpTextOverride` that replaces the referenced field's
  `helpText` for that embedding only.
- `87` — a `Template` setting `helpDisplayMode` to `"none"`,
  verifying that the model accepts and round-trips the
  suppression mode.

The default `"inline"` mode is exercised by absence of
`renderingHint` throughout the other valid fixtures, so no dedicated
fixture for it is needed. The `"both"` arm shares its wire-shape
acceptance with the other arms and is verified by the per-arm
round-trip of `85` plus the validator's enum-membership rule.

**`88`–`91` Placeholder.** Four fixtures covering the `Placeholder`
slot across families that take text-entry input:

- `88` — a `TextField` with multilingual `placeholder` (en + es) on
  its `renderingHint`, also carrying `lineMode`. Exercises the
  restructured `TextRenderingHint` object form.
- `89` — an `EmailField` with `placeholder` on the new
  `EmailRenderingHint`. Exercises a "new rendering hint introduced
  for an otherwise-no-hint family" surface.
- `90` — a `DateField` with `placeholder` alongside the existing
  `componentOrder`. Exercises "placeholder added alongside an
  existing rendering-hint slot."
- `91` — an `OrcidField` with `placeholder` on the new
  `OrcidRenderingHint`. Exercises one of the six identifier-family
  rendering hints.

The existing standalone `TextField` fixture (`49`) was updated to
the restructured `TextRenderingHint` object form (`{ lineMode:
"multiLine", placeholder: ... }`) — the bare-string form
(`"renderingHint": "multiLine"`) is no longer wire-form-valid.

A binding that round-trips every fixture in groups 1–7 has
demonstrated correct mapping for every reachable wire production
this specification defines.

## `valid/` semantics

Each file under `valid/` is a single conforming JSON document — a
`Template`, a `TemplateInstance`, or another root-level wire form
that is valid against this specification.

A binding SHOULD verify, for each file:

1. **Decoding.** The binding's decoder MUST accept the document
   without raising any error.
2. **Round-trip equivalence.** Encoding the resulting in-memory
   value back to JSON MUST produce a document that is equal to the
   input under §7's equivalence (object property order and
   non-significant whitespace are not significant).

Cross-file relationships (e.g. that
`02-patient-observation-instance.json` is a conforming instance of
`01-patient-observation-template.json`) are documented in
`serialization.md` §8 but are not enforced by this directory's layout
beyond a numeric prefix that hints at reading order.

## `invalid/` semantics

Each subdirectory under `invalid/` is a single test case carrying
two files:

- **`input.json`** — the malformed wire form.
- **`expected-errors.json`** — a JSON array of error reports. Each
  entry has the four required fields per §9.3 of `serialization.md`:
  `category`, `path`, `production`, and `messageRegex`. The
  `messageRegex` field is a regular expression (POSIX/PCRE-compatible)
  that the binding's reported `message` MUST match; literal `message`
  equality is not required because wording is informational.

Bindings operating in **collected mode** (the default per §9.4) MUST
report the *complete set* of errors listed — same `category`,
matching `path` strings, matching `production`, and `message` content
that matches the regex. Reporting *additional* errors not listed is
permitted (a binding may surface more granular structural checks
than the minimum); reporting *fewer* errors is non-conforming.

Bindings operating in **fail-fast mode** (optional per §9.4) report
only the first error encountered; that error MUST match the
expected entry whose `path` is *first in document order*. The
expected-errors file does not encode document order explicitly;
implementations SHOULD compute it from the `path` JSON Pointer.

## Adding fixtures

When adding a new fixture:

1. Pick the next ordinal prefix (`03-`, `04-`, …) inside the
   relevant subdirectory.
2. Use a feature-based slug for the rest of the filename
   (`03-real-number-with-unit-and-bounds.json`,
   `04-multilingual-altlabels-roundtrip.json`).
3. If the fixture is referenced from `serialization.md` (or any
   other normative chapter), add a `{{#include}}` directive at the
   reference site so the rendered spec embeds the fixture verbatim.
4. For an `invalid/` fixture, write the `expected-errors.json` with
   the smallest set of errors that, if not all reported, would cause
   the test to fail.
