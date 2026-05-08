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
│   └── 73-77   presentation components
└── invalid/
    ├── 01-unknown-kind/
    │   ├── input.json
    │   └── expected-errors.json
    └── 02-fieldid-family-mismatch-and-duplicate-key/
        ├── input.json
        └── expected-errors.json
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
- the per-family `Value` arm at `FieldValue.values[*]`
- the four §9 deviations from the standard embedded-field template:
  - `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` omit
    `cardinality`
  - `EmbeddedMultiValuedEnumField` carries `array<EnumValue>` for
    `defaultValue`
  - `EmbeddedAttributeValueField` omits `defaultValue`

Extra fixtures are included for the two `RealNumberValue` `datatype`
variants (`decimal`, `double`) and for two of the three `DateValue`
arms (`YearValue`, `YearMonthValue` — the third, `FullDateValue`, is
covered by `13-date`).

**`49`–`72` Per-family Field artifacts.** One `Field` artifact JSON
per family, exercising every slot of its `XxxFieldSpec` at least once
across the suite. This complements the embedding surface above; a
binding's encoder/decoder must handle both. Notable fixtures within
this group:

- `49-text-field`: minLength, maxLength, validationRegex, default-
  Value, renderingHint, all populated.
- `50-integer-number-field`: unit (with label), minValue, maxValue,
  numericRenderingHint with decimalPlaces.
- `51-real-number-decimal-field` / `52-real-number-double-field`:
  the two `RealNumberDatatypeKind` variants with appropriate
  `minValue` / `maxValue` lexical forms (including `INF`/`-INF` for
  the `double` datatype).
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

A binding that round-trips every fixture in groups 1–4 has
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
