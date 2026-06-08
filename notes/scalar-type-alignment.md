# Scalar type alignment with LinkML

Captured 2026-05-05. Defer execution until inlining, versioning,
literal-wrapping, and quantity-fields decisions are settled.

> **Update 2026-05-05 (later same day):** the boolean addition has
> landed (cedar-structural-spec `880ab2c`, cedar-ts `6391823`). The
> boolean section below is preserved as-is for context but is no
> longer pending work.
>
> Remaining work captured here:
>
> - Numeric type-set reduction (16 → 4: `integer`, `decimal`,
>   `float`, `double`).
> - Split `NumericField` into `IntegerField` and `RealNumberField`
>   (decision made; see §"Numeric field split"). **Superseded
>   2026-06-05 — see the reversal below: the split is now the flat
>   four-way `IntegerField`/`DecimalField`/`FloatField`/`DoubleField`
>   with no `NumericField` umbrella and no `RealNumberDatatypeKind`.**
> - Move `numericPrecision` (rename to `decimalPlaces`) from the spec
>   into the rendering hint (decision made; see §"Decimal places vs
>   significant digits vs precision").

## The framing

CEDAR 2.0 currently supports **16 numeric types** (a subset of XSD's
numeric hierarchy: `integer`, `decimal`, `float`, `double`, `long`,
`int`, `short`, `byte`, plus signed/unsigned and non-negative/positive
variants). LinkML supports **6** scalar core types: `integer`,
`decimal`, `float`, `double`, plus `string`, `boolean`. CEDAR 2.0 is
significantly *more* permissive than LinkML on numeric typing.

The goal is to narrow CEDAR's scalar set to a subset (or aligned set)
of LinkML's, for compatibility with LinkML-based tooling and
generation.

## Scope of comparison

LinkML's scalar core (from `linkml_model/types.py`):

| LinkML | XSD |
|---|---|
| `String` | `xsd:string` |
| `Integer` | `xsd:integer` |
| `Boolean` | `xsd:boolean` |
| `Float` | `xsd:float` |
| `Double` | `xsd:double` |
| `Decimal` | `xsd:decimal` |
| `Time` | `xsd:time` |
| `Date` | `xsd:date` |
| `Datetime` | `xsd:dateTime` |

LinkML also defines URI/CURIE variants (`Uri`, `Uriorcurie`, `Curie`,
`Ncname`, `Objectidentifier`, `Nodeidentifier`) and JSON-path string
subtypes (`Jsonpointer`, `Jsonpath`, `Sparqlpath`) — these aren't part
of CEDAR's scalar set and aren't proposed for inclusion.

CEDAR 2.0 currently supports (per grammar.md):

- **Numeric (16):** `integer`, `decimal`, `float`, `double`, `long`,
  `int`, `short`, `byte`, `nonNegativeInteger`, `positiveInteger`,
  `nonPositiveInteger`, `negativeInteger`, `unsignedLong`,
  `unsignedInt`, `unsignedShort`, `unsignedByte`
- **Text:** `xsd:string` (implicit on TextField; `SimpleLiteral`
  carries `xsd:string` semantics)
- **Temporal (3):** `date`, `time`, `dateTime` (via DateField,
  TimeField, DateTimeField families; `DateField` further refines into
  year, year-month, full-date precision)
- **Boolean:** added 2026-05-05 — see boolean section below.

CEDAR 1.6.0 (legacy):

- Numeric: doc shows `"xsd:integer" | ...` with no fixed enumeration;
  examples use `xsd:decimal`. Effectively whatever the implementation
  accepted. Common practice: `xsd:integer`, `xsd:decimal`,
  `xsd:float`, `xsd:double`.
- Temporal: `xsd:date`, `xsd:dateTime`, `xsd:time`.
- Text: implicit string.
- No boolean as a distinct field type (boolean-like fields modelled as
  two-option literal choice fields).

## Target CEDAR 2.0 scalar set

| CEDAR 2.0 (proposed) | LinkML | XSD | Notes |
|---|---|---|---|
| `string` | `string` | `xsd:string` | text content; current TextField |
| `integer` | `integer` | `xsd:integer` | arbitrary-precision integer |
| `decimal` | `decimal` | `xsd:decimal` | arbitrary-precision decimal |
| `float` | `float` | `xsd:float` | 32-bit IEEE 754 |
| `double` | `double` | `xsd:double` | 64-bit IEEE 754 |
| `boolean` | `boolean` | `xsd:boolean` | landed 2026-05-05 |
| `date` | `date` | `xsd:date` | full date; year and year-month sub-precisions remain |
| `time` | `time` | `xsd:time` | time-of-day |
| `datetime` | `datetime` | `xsd:dateTime` | combined date-time |

**Net delta from current CEDAR:** −12 numeric types, +1 boolean
(landed). Six numeric types collapse to four.

## Numeric reduction: what's dropped

Twelve numeric types currently supported by CEDAR 2.0 are not part of
the target set:

- `xsd:long`, `xsd:int`, `xsd:short`, `xsd:byte` — bounded-precision
  signed integer subtypes
- `xsd:nonNegativeInteger`, `xsd:positiveInteger`,
  `xsd:nonPositiveInteger`, `xsd:negativeInteger` — sign-constrained
  integer subtypes
- `xsd:unsignedLong`, `xsd:unsignedInt`, `xsd:unsignedShort`,
  `xsd:unsignedByte` — bounded-precision unsigned integer subtypes

LinkML deliberately reduces XSD's numeric hierarchy to the four cases
that map cleanly to common programming-language number types. Reasoning:

- Most metadata-form integer fields are conceptually
  arbitrary-precision; `xsd:integer` covers them.
- Bit-precision distinctions (8 / 16 / 32 / 64-bit) are rare in
  metadata-form contexts and complicate cross-language code generation.
- Sign and range constraints (`nonNegativeInteger`, `positiveInteger`,
  etc.) are better expressed as numeric value bounds (`minValue`,
  `maxValue`) than as types.

### Migration: how the dropped types map to the kept ones

| Dropped CEDAR type | Migration target | Constraint added |
|---|---|---|
| `xsd:long`, `xsd:int`, `xsd:short`, `xsd:byte` | `integer` | none (CEDAR `integer` is unbounded; if the precision matters, the implementation enforces it) |
| `xsd:nonNegativeInteger` | `integer` | `minValue: 0` |
| `xsd:positiveInteger` | `integer` | `minValue: 1` |
| `xsd:nonPositiveInteger` | `integer` | `maxValue: 0` |
| `xsd:negativeInteger` | `integer` | `maxValue: -1` |
| `xsd:unsignedLong`, `xsd:unsignedInt`, `xsd:unsignedShort`, `xsd:unsignedByte` | `integer` | `minValue: 0` (and a precision-bound, if needed) |

Some information loss: signed/unsigned distinctions and bit-precision
bounds become numeric range constraints rather than type constraints.
The grammar no longer enforces that an `unsignedShort` value fits in
16 bits; that becomes a numeric `maxValue` if the modeller wants it.

This is the pragmatic compromise. Real CEDAR templates have not used
these subtypes meaningfully, and the loss is recoverable through
existing `minValue` / `maxValue` constraints.

## Numeric field split

**Decision (2026-05-05):** split `NumericField` into `IntegerField`
and `RealNumberField`.

`NumericField` becomes an abstract category (parallel to
`TemporalField` today). The split moves CEDAR from "one numeric
family with a `datatype` enum" to "two numeric families, one with a
fixed datatype and one with a real-valued datatype enum."

### Why split

- **Genuine semantic boundary.** Integer arithmetic (exact, closed
  under +/−/×) and real arithmetic (approximation, IEEE 754 or
  arbitrary-precision decimal) are structurally different.
- **Resolves the `decimalPlaces` mismatch.** Decimal-places is a
  meaningful slot for real-valued numbers, meaningless for integers.
  With the split, the slot lives only on `RealNumberFieldSpec`; no
  validation rule needed.
- **Cross-language alignment.** Most programming languages
  distinguish integer from real-valued types at the type level
  (Java's `int` vs `double`, Rust's `i64` vs `f64`, etc.). LinkML
  itself splits `Integer` from `Decimal`/`Float`/`Double`.
- **Range constraints type more cleanly.** `IntegerMinValue` /
  `IntegerMaxValue` carry integers; `RealNumberMinValue` /
  `RealNumberMaxValue` carry real-valued literals. The bounds' types
  are fixed by the family.
- **Parallels the temporal split.** `TemporalField` is already split
  into Date / Time / DateTime by semantic flavour, not by
  configuration variant. Integer vs Real is the same kind of split.

### Why not split further (decimal / float / double) — SUPERSEDED 2026-06-05

> **Reversal (2026-06-05):** this section's decision was superseded.
> CEDAR now uses a **flat four-way split**: `IntegerField`,
> `DecimalField`, `FloatField`, `DoubleField` as four standalone
> scalar families, with **no `NumericField` / `NumericValue` umbrella**
> and **no `RealNumberDatatypeKind`**. The original argument below is
> preserved for the record. See "Reversal rationale" immediately after.

Within `RealNumberFieldSpec`, the choice of `decimal` vs `float` vs
`double` is a precision class — a configuration variant, not a
semantic kind. All three share the same configuration template
(unit, decimal places, min/max bounds, rendering hint). They differ
only in arithmetic exactness and storage precision. The right model
is to keep them as a `RealNumberDatatype` enum on
`RealNumberFieldSpec` rather than as their own families.

This mirrors how today's `NumericFieldSpec.datatype` enum already
discriminates within "numeric"; the split just constrains the enum
to real-valued types and lifts integer to its own family where the
datatype is fixed.

### Reversal rationale (2026-06-05)

The "precision class, not semantic kind" argument above weighs only
the *spec* side — the shared configuration template. It did not weigh
the cost the tagged design pushes onto every *value* the spec and its
instances carry:

- **Datatype redundancy.** A `RealNumberFieldSpec` declares its
  datatype once (`decimal` / `float` / `double`), but its default,
  `RealNumberMinValue`, `RealNumberMaxValue`, and every example are
  each a full `RealNumberValue` that *re-declares* a datatype, which
  MUST match the field's. The datatype is stated up to five-plus
  times per spec and can disagree.
- **Unenforced consistency rule.** That match is a MUST in
  `grammar.md` prose but was **not** enforced in
  `validate_real_number_field_spec` — a real gap, not a hypothetical.
- **Make illegal states unrepresentable.** Under the flat split the
  datatype is structural (a `DoubleValue` is double by construction),
  so the match rule disappears entirely rather than needing
  enforcement. This is the decisive consideration the original
  framing missed.

Secondary supports: shorter, less redundant `kind` strings in
instances (`DoubleValue` vs `RealNumberValue{datatype:double}`); a
flat 1:1 RDF projection (four fixed `xsd:` rows, no placeholder
expansion); 1:1 alignment with LinkML's `Integer`/`Decimal`/`Float`/
`Double` scalars and with most host-language numeric type systems.

Accepted cost: the numeric surface area roughly doubles (two families
→ four, each a full vertical column of field / embedded / id / spec /
value / min / max productions). The `NumericRenderingHint` umbrella is
dropped; its applicability is now defined by enumerating the four
numeric specs. `float` and `double` get separate (near-identical)
lexical forms rather than a shared one.

### Sketch of the split

```ebnf
Field ::= ... | NumericField | ...

NumericField ::= IntegerField
               | RealNumberField

IntegerField ::= integer_field(
                   IntegerFieldId
                   ModelVersion
                   SchemaArtifactMetadata
                   IntegerFieldSpec
                 )

RealNumberField ::= real_number_field(
                      RealNumberFieldId
                      ModelVersion
                      SchemaArtifactMetadata
                      RealNumberFieldSpec
                    )

IntegerFieldId ::= integer_field_id( Iri )
RealNumberFieldId ::= real_number_field_id( Iri )

IntegerFieldSpec ::= integer_field_spec(
                       [Unit]
                       [IntegerMinValue]
                       [IntegerMaxValue]
                       [NumericRenderingHint]
                     )

RealNumberFieldSpec ::= real_number_field_spec(
                          RealNumberDatatype     -- decimal | float | double
                          [Unit]
                          [RealNumberMinValue]
                          [RealNumberMaxValue]
                          [NumericRenderingHint]
                        )

RealNumberDatatype ::= "decimal" | "float" | "double"

IntegerValue ::= integer_value(IntegerLiteral)
RealNumberValue ::= real_number_value(RealNumberLiteral)
```

The `NumericValue` union stays as the abstract category; `Value`
admits both `IntegerValue` and `RealNumberValue`.

`NumericRenderingHint` is shared (both Integer and Real use the
same numeric rendering hints).

`Unit` stays optional on both pending the `QuantityField` decision
(see `notes/quantity-fields.md`).

### Note: `decimalPlaces` slot

`decimalPlaces` is intentionally **not** in the
`RealNumberFieldSpec` sketch above. Per the next section, it moves
to `NumericRenderingHint`.

## Decimal places vs significant digits vs precision

Three concepts that the current `numericPrecision` slot conflates.

**Decimal places** — digits to the right of the decimal point.
`3.14159` has 5 decimal places; `0.001` has 3. Only meaningful for
non-integer numbers; integers always have 0. Use cases: currency
display (2 decimal places), measurement-resolution ("scale reads to
nearest 0.01 g"), display rounding.

**Significant digits** (significant figures) — digits that carry
meaningful precision, regardless of where the decimal point sits.
`3.14159` has 6 significant digits; so does `0.0314159`; so does
`31415.9`. Used in scientific measurement and engineering tolerances.
Independent of decimal-place count.

**Precision** — overloaded umbrella term that variously means decimal
places, significant digits, internal storage precision (bit width),
or total digits (SQL `DECIMAL(p,s)` style). Needs disambiguation
every time it's used.

CEDAR's existing `numericPrecision` slot is documented as "display
decimal places," so it functionally means decimal places, not the
overloaded thing. The name is misleading.

### Decision (2026-05-05): rename and relocate

Three calls:

1. **Rename `numericPrecision` to `decimalPlaces`.** The new name
   matches what the slot actually means and matches CTM 1.6.0's
   `_valueConstraints.decimalPlaces` field — minimising migration
   churn.
2. **Relocate the slot from `NumericFieldSpec` (or
   `RealNumberFieldSpec`) to `NumericRenderingHint`.** Decimal
   places is fundamentally a presentation concern: how many digits
   to render. It's not a value-semantics constraint.
3. **Don't add an input-validation slot for decimal places at the
   structural level.** UIs enforce input precision via the rendering
   hint as a UX nicety. If a future use case demands strict
   structural enforcement, add `decimalPlacesConstraint` then. For
   now, defer.

The rendering hint's slot ergonomics:

```ebnf
NumericRenderingHint ::= numeric_rendering_hint(
                           [DecimalPlaces]
                         )

DecimalPlaces ::= NonNegativeInteger
```

`decimalPlaces: 0` on an integer field is harmless and meaningful
(display as `42`, not `42.0`).

A future `significantDigits` slot can join `NumericRenderingHint`
when a use case warrants it. Not adding now.

## Boolean as a new field family — LANDED 2026-05-05

`BooleanField` is the right shape: parallel to TextField,
NumericField, the date/time families, and the rest. Not a special
case of choice or text.

**Why a new family rather than a literal-choice with two options:**

- Rendering. A boolean is rendered as a checkbox or toggle; a
  two-option choice is a radio-button or dropdown. Different default
  rendering, different semantic affordance.
- Cardinality. A boolean field is naturally `min: 0, max: 1` (or
  `min: 1, max: 1` for required). Multi-valued booleans don't exist;
  the grammar should not pretend they do. **Implemented:**
  `EmbeddedBooleanField` omits the cardinality slot entirely.
- Validation. A boolean has a fixed two-element domain (`true`,
  `false`). No `minValue` / `maxValue` / `precision` slots. No literal
  options to enumerate.
- LinkML alignment. LinkML has `Boolean` as a first-class scalar.
- RDF projection. A `BooleanValue` lifts directly to an
  `xsd:boolean` literal. A literal-choice with `["true", "false"]`
  options does not — it lifts to a string.

### Implemented shape

```ebnf
BooleanField ::= boolean_field(
                   BooleanFieldId
                   ModelVersion
                   SchemaArtifactMetadata
                   BooleanFieldSpec
                 )

BooleanFieldSpec ::= boolean_field_spec(
                       [BooleanRenderingHint]
                     )

BooleanLiteral ::= boolean_literal(boolean)
BooleanValue ::= boolean_value(BooleanLiteral)

EmbeddedBooleanField ::= embedded_boolean_field(
                           EmbeddedArtifactKey
                           BooleanFieldReference
                           [ValueRequirement]
                           -- no [Cardinality]
                           [Visibility]
                           [BooleanLiteral]
                           [LabelOverride]
                           [Property]
                         )

BooleanRenderingHint ::= "checkbox" | "toggle"
```

## Wire shape (under literal-wrapping flat target)

| Variant | Wire shape (today, with literal wrapping) | Wire shape (after literal-wrapping refactor) |
|---|---|---|
| `BooleanValue` | `{ kind: "BooleanValue", literal: { value: true } }` | `{ kind: "BooleanValue", value: true }` |
| `IntegerValue` | `{ kind: "IntegerValue", literal: { value: "42" } }` | `{ kind: "IntegerValue", value: "42" }` |
| `RealNumberValue` | `{ kind: "RealNumberValue", literal: { value: "3.14", datatype: "decimal" } }` | `{ kind: "RealNumberValue", value: "3.14", datatype: "decimal" }` |

Note: `BooleanValue` carries a JSON `boolean` directly — it's the only
scalar type where a native JSON primitive matches the value exactly.
Numeric values keep `value: string` because numeric lexical forms can
exceed JSON's number precision.

## Open practical questions

- **Q-Migration.** Existing CEDAR templates may use the dropped
  numeric types. Migration story for v1.6.0 / pre-2.0 templates that
  declare `xsd:long` or `xsd:nonNegativeInteger`. Probably mechanical:
  `xsd:long` → `xsd:integer`; `xsd:nonNegativeInteger` →
  `xsd:integer` plus `minValue: 0`. Need to audit how often these
  appear in real templates.
- **Q-Migration-NumericField.** Existing `NumericField` artifacts
  with `datatype: integer` migrate to `IntegerField`; with `decimal`
  / `float` / `double` migrate to `RealNumberField`. Mechanical and
  should be a one-pass rewrite at the spec level once decided.
- **Q-LinkML-strict.** LinkML's `Decimal` is "arbitrary precision per
  xsd:decimal." CEDAR's `decimal` should match. Confirm: CEDAR
  `decimal` is *not* limited to JSON `number` precision; it's a
  string-encoded lexical form like `xsd:decimal`. (Same precision
  question for `integer`.)
- **Q-DateOrDatetime.** LinkML has a `DateOrDatetime` union type.
  CEDAR has separate `DateField` and `DateTimeField` families. Don't
  merge — CEDAR's separation is principled.
- **Q-String-subtypes.** LinkML offers `Curie`, `Ncname`, `Uri`,
  `Uriorcurie`, etc., as string subtypes. CEDAR doesn't model these
  at the scalar level — IRIs appear as fully-typed `LinkValue`,
  authority IRIs as `OrcidValue` etc. No alignment work needed here.
- **Q-Boolean-existing-templates.** Two-option literal-choice fields
  in existing templates (`["yes", "no"]`, `["true", "false"]`) might
  reasonably migrate to `BooleanField`. Worth a separate audit, not a
  scalar-alignment concern.

## Recommendation to self

Order of operations (after the prior items in flight settle):

1. Settle inlining, versioning, literal-wrapping, quantity-fields
   first.
2. ~~Add `BooleanField`.~~ **Done 2026-05-05.**
3. **Reduce numeric type set + split into Integer/RealNumber.** A
   single coherent refactor:
   - Drop the 12 unused numeric types.
   - Rename `NumericDatatypeIri` enum to four values.
   - Split `NumericField` into `IntegerField` + `RealNumberField`.
   - Rename `numericPrecision` to `decimalPlaces` and move into
     `NumericRenderingHint`.
4. cedar-ts updates: split numeric family + rename slot. Significant
   scope but mechanical (similar shape to recent renames).

Steps 3 and 4 are big enough to need their own pre-implementation
review. Worth slides for the team if they touch UX of existing
templates.

## Things to verify before changing anything

- How prevalent are the dropped numeric types in real CEDAR
  templates? Audit cedar-server / NCBO submissions if possible.
- LinkML's `Decimal` and `Integer` precision semantics — confirm
  CEDAR's `decimal` and `integer` should match exactly (string lexical
  forms, no JSON `number` precision limit).
- Whether any cedar-ts examples or tests exercise the dropped numeric
  types. Grep for `xsd:long`, `xsd:nonNegative`, etc.
- Whether the LinkML-CEDAR mapping notes (in
  `notes/linkml-template-to-schema-mapping.md`) need updating to
  reflect the narrowed type set.
- Whether any CEDAR templates use `numericPrecision` on integer
  fields (would catch authors using the slot in confusing ways
  pre-rename).
