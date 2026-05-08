# CEDAR structural specification

This repository contains the structural specification for CEDAR
artifacts: an abstract grammar, its JSON wire form, encoding rules, a
host-language bindings guide, and a cross-language acceptance test
suite.

## Read it

The rendered specification is published at
[metadatacenter.github.io/cedar-structural-spec](https://metadatacenter.github.io/cedar-structural-spec/).
The site has clickable production references, syntax-highlighted
EBNF, and an alphabetical index of every production.

The principal source files are:

- [`spec/grammar.md`](spec/grammar.md) — the abstract grammar (EBNF
  productions, scalar leaves, lexical-form pin-downs).
- [`spec/wire-grammar.md`](spec/wire-grammar.md) — the JSON wire form,
  with the polymorphic-only `kind` rule, wrapper-collapse rules,
  encoding rules, and the property-name map.
- [`spec/serialization.md`](spec/serialization.md) — general encoding
  rules, the wrapping principle, round-tripping, the error model, and
  worked examples.
- [`spec/bindings.md`](spec/bindings.md) — host-language idioms for
  TypeScript, Java, and Python, plus codebase-organisation guidance.

## Conformance test suite

[`spec/normative-tests/`](spec/normative-tests/) contains the
machine-readable cross-language acceptance suite that any binding
SHOULD pass before claiming conformance. The suite is organised as:

- **`valid/`** — 77 conforming JSON documents covering every field
  family (in both embedded and standalone form), every controlled-
  term source kind, every value variant, and every presentation
  component. A binding MUST decode each file and verify §7 round-
  trip equivalence on re-encoding.
- **`invalid/`** — malformed inputs paired with the errors a
  conforming decoder MUST report (per the §9 error model in
  `serialization.md`). Each case carries an `input.json` and an
  `expected-errors.json` whose entries name the error category, the
  JSON-pointer path, the production at the path, and a regex the
  binding's reported message must match.

The fixtures in `valid/` are also embedded into `serialization.md`
§8 via mdBook `{{#include}}`, so the rendered prose and the test
data cannot drift apart.

See [`spec/normative-tests/README.md`](spec/normative-tests/README.md)
for the layout, fixture inventory, and conformance contract in
detail.
