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
├── README.md                         # this file
├── valid/
│   ├── 01-patient-observation-template.json    # mega-fixture (5 families)
│   ├── 02-patient-observation-instance.json    # instance for 01
│   ├── 03-text-template.json   ↘
│   ├── 04-text-instance.json    ⎫
│   ├── 05-integer-number-template.json
│   ├── 06-integer-number-instance.json
│   ├── 07-real-number-decimal-template.json   # datatype: decimal
│   ├── 08-real-number-decimal-instance.json
│   ├── 09-real-number-double-template.json    # datatype: double, INF
│   ├── 10-real-number-double-instance.json
│   ├── 11-boolean-template.json                # NO cardinality (deviation)
│   ├── 12-boolean-instance.json
│   ├── 13-date-template.json                   # FullDateValue arm
│   ├── 14-date-instance.json
│   ├── 15-date-year-template.json              # YearValue arm
│   ├── 16-date-year-instance.json
│   ├── 17-date-year-month-template.json        # YearMonthValue arm
│   ├── 18-date-year-month-instance.json
│   ├── 19-time-template.json
│   ├── 20-time-instance.json
│   ├── 21-date-time-template.json
│   ├── 22-date-time-instance.json
│   ├── 23-controlled-term-template.json
│   ├── 24-controlled-term-instance.json
│   ├── 25-single-valued-enum-template.json     # NO cardinality (deviation)
│   ├── 26-single-valued-enum-instance.json
│   ├── 27-multi-valued-enum-template.json      # array<EnumValue> default (deviation)
│   ├── 28-multi-valued-enum-instance.json
│   ├── 29-link-template.json
│   ├── 30-link-instance.json
│   ├── 31-email-template.json
│   ├── 32-email-instance.json
│   ├── 33-phone-number-template.json
│   ├── 34-phone-number-instance.json
│   ├── 35-orcid-template.json                  ⎫
│   ├── 36-orcid-instance.json                  │
│   ├── 37-ror-template.json                    │
│   ├── 38-ror-instance.json                    │
│   ├── 39-doi-template.json                    │  six external-authority families
│   ├── 40-doi-instance.json                    │
│   ├── 41-pubmedid-template.json               │
│   ├── 42-pubmedid-instance.json               │
│   ├── 43-rrid-template.json                   │
│   ├── 44-rrid-instance.json                   │
│   ├── 45-nih-grant-id-template.json           │
│   ├── 46-nih-grant-id-instance.json           ⎭
│   ├── 47-attribute-value-template.json        # NO defaultValue (deviation)
│   └── 48-attribute-value-instance.json
└── invalid/
    ├── 01-unknown-kind/
    │   ├── input.json                # the malformed wire form
    │   └── expected-errors.json      # the errors a conforming decoder MUST report
    └── 02-fieldid-family-mismatch-and-duplicate-key/
        ├── input.json
        └── expected-errors.json
```

## Fixture coverage

`01` and `02` are the **mega-fixtures** referenced from
`serialization.md` §8 — a single Template (and conforming Instance)
that exercises five field families plus full-fat metadata,
annotations, and varied cardinalities.

`03` through `48` are the **per-family fixtures** — one minimal
Template + Instance pair for every concrete `XxxField` family
(twenty in total, plus extra fixtures for the `RealNumberValue`
datatype variants and the three `DateValue` arms). Each per-family
fixture is the *minimum* that exercises the family's distinctive
shape: the `EmbeddedXxxField.kind`, the `Value` arm, the per-family
typed identifier slot, and any deviations from the standard
embedded-field template (no-`cardinality` slots on Boolean and
SingleValuedEnum, array-shaped `defaultValue` on
MultiValuedEnum, no-`defaultValue` slot on AttributeValue). A
binding that round-trips every per-family fixture has demonstrated
correct mapping for every family-bearing wire shape this spec
defines.

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
