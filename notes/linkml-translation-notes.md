# LinkML Translation Notes

This document records the mapping decisions, fit assessment, and generation
opportunities for `spec/grammar.linkml.yaml`, a LinkML prototype of the CEDAR
abstract structural model defined in `spec/grammar.md`.

---

## Purpose

The prototype was written to answer two questions:

1. How naturally does the EBNF abstract grammar in `grammar.md` map to LinkML
   concepts?
2. What could be generated from a LinkML schema that would be useful for a
   future CEDAR serialization?

The prototype covers the full grammar — templates, fields, field specs, embedded
artifact properties, values, presentation components, and instances.

---

## Mapping strategy

### EBNF unions → abstract classes with `is_a`

Every union production in the grammar becomes an abstract LinkML class. Concrete
alternatives become subclasses via `is_a`.

```
# grammar.md
Field ::= TextField | NumericField | DateField | …

# grammar.linkml.yaml
Field:          abstract: true
TextField:      is_a: Field
NumericField:   is_a: Field
```

This is a clean, idiomatic fit. The inheritance hierarchy in LinkML closely
mirrors the field family groupings in the grammar (`TemporalField`,
`ChoiceField`, `ContactField`, `ExternalAuthorityField`).

### Constructor productions → concrete classes with slots

An EBNF constructor production maps directly to a concrete class whose
children become slots or inlined attributes.

```
# grammar.md
TextField ::= text_field(
                TextFieldId
                SchemaArtifactMetadata
                DescriptiveMetadata
                TextFieldSpec
              )

# grammar.linkml.yaml
TextField:
  is_a: Field
  attributes:
    field_spec:
      range: TextFieldSpec
      required: true
      inlined: true
```

### Optional elements `[X]` → slot without `required: true`

Optional grammar elements map to slots that have no `required: true`
annotation. LinkML treats slots as optional by default, so this requires no
extra annotation.

### Repeated elements `X+` / `X*` → `multivalued: true`

`X+` (one or more) becomes `multivalued: true` with `required: true`.
`X*` (zero or more) becomes `multivalued: true` without `required`.

### Enumerations → `enums:`

Grammar enumerations such as `ValueRequirement`, `DateComponentOrder`, and
`TimePrecision` map directly to LinkML `enums:` with `permissible_values`.

```
ValueRequirementEnum:
  permissible_values:
    Required: {}
    Recommended: {}
    Optional: {}
```

### Primitive wrapper types → `types:`

Simple string or IRI wrappers (`UnicodeString`, `Iri`, `AsciiIdentifier`) map
to LinkML `types:` with `uri`, `base`, and, where appropriate, `pattern`. The
`AsciiIdentifier` type used for `EmbeddedArtifactKey` carries the regex
constraint directly on the type definition.

---

## Where the fit is non-trivial

### 1. Union-typed slot values

#### What the problem is

In several places the grammar allows a single slot to hold a value that could
be one of several structurally unrelated types. The three places where this
occurs are:

| Production | The union |
|---|---|
| `ChoiceOptionValue` | A declared option in a choice field can be a `Literal`, a `ControlledTermValue`, or an `Iri` |
| `ChoiceSelection` | The value chosen in an instance has the same three alternatives |
| `AttributeValue.value` | The value component of a name–value pair can be *any* `Value` subtype |

The grammar handles this naturally because EBNF just lists the alternatives with
`|`. The question is how LinkML — a schema language that expects each slot to
have a single declared range type — represents the same thing.

#### How LinkML currently expresses it

LinkML has an `any_of:` constraint that allows a slot to declare multiple
acceptable ranges:

```yaml
choice_option_value:
  any_of:
    - range: Literal
    - range: ControlledTermValue
    - range: Iri
  required: true
```

This is valid and LinkML validators will accept it. The problem surfaces when
you run a **code generator**. A generator asked to produce Python classes, for
example, sees a slot with no single concrete type and emits something like:

```python
choice_option_value: Optional[Union[Literal, ControlledTermValue, str]]
```

This is a bare `Union` — the generator knows the slot could hold any of the
three types but it has no way to tell which one is present in a given object
without inspecting the value at runtime. There is no tag or discriminator key to
look at. A developer using the generated class must write their own `isinstance`
checks everywhere the slot is used, which is error-prone and defeats much of the
point of having generated typed classes.

The same problem appears in generated JSON Schema: the validator emits an
`oneOf` or `anyOf` block but has no discriminator property to tell a deserializer
which branch applies to a given JSON object.

#### Why this matters in the CEDAR context

The impact differs by slot:

- **`ChoiceOptionValue` and `ChoiceSelection`** — in practice, most choice
  fields in CEDAR use either plain string literals or controlled terms. Mixed
  choice fields (some options as literals, others as ontology terms, others as
  raw IRIs) are unusual. The union exists to allow it, but it complicates the
  generated code for all choice fields, not just the mixed ones.

- **`AttributeValue.value`** — this is the most open-ended case. An attribute
  value can carry any value type, including another `AttributeValue`, making the
  nesting unbounded. This makes strong static typing impossible in any
  single-pass generator; the generated type will always be `Union[Value, ...]`
  at some level.

#### What would need to change for an optimal outcome

Two changes would address this, one in the grammar and one in the LinkML schema:

**Change 1 — Introduce a named abstract base class for choice values
(change in `grammar.md` and `grammar.linkml.yaml`)**

Instead of declaring `ChoiceOptionValue` as a bare union, introduce an explicit
abstract class `ChoiceOptionValue` with three concrete subclasses:

```yaml
# grammar.linkml.yaml addition
classes:
  ChoiceOptionValue:
    abstract: true
    description: >-
      The value form of a single option in a ChoiceFieldSpec.
      Concrete forms are LiteralChoiceOptionValue, ControlledTermChoiceOptionValue,
      and IriChoiceOptionValue.

  LiteralChoiceOptionValue:
    is_a: ChoiceOptionValue
    attributes:
      literal:
        range: Literal
        required: true
        inlined: true

  ControlledTermChoiceOptionValue:
    is_a: ChoiceOptionValue
    attributes:
      term:
        range: ControlledTermValue
        required: true
        inlined: true

  IriChoiceOptionValue:
    is_a: ChoiceOptionValue
    attributes:
      iri:
        range: Iri
        required: true
```

With this in place, the `choice_option_value` slot has a single concrete range
(`ChoiceOptionValue`), and generators can emit a proper discriminated class
hierarchy. The same pattern applies identically to `ChoiceSelection`. This
change also makes `grammar.md` more explicit about these three forms, which is
arguably an improvement to the abstract model regardless of LinkML.

**Change 2 — Accept that `AttributeValue` is dynamically typed (no change
needed, but document the limitation)**

`AttributeValue` is intentionally open-ended: it is the escape hatch for fields
whose structure is not known at schema-definition time. Strong static typing for
this slot is not achievable, and forcing it would contradict the purpose of the
construct. The right approach is to document that generated code for
`AttributeValue.value` will always be typed as `Value` (the abstract base), and
that callers must inspect the runtime type. This is not a deficiency unique to
LinkML — any schema language that tries to express an open-ended recursive value
type will face the same limitation.

#### Summary of changes

| What | Where | Impact |
|---|---|---|
| Add `ChoiceOptionValue` abstract class + three concrete subclasses | `grammar.md` and `grammar.linkml.yaml` | Generators produce a discriminated class hierarchy for choice option values |
| Add `ChoiceSelection` abstract class + three concrete subclasses (same pattern) | `grammar.md` and `grammar.linkml.yaml` | Generators produce clean typed classes for instance-level choice values |
| Document `AttributeValue.value` as intentionally dynamically typed | `grammar.md` annotation and `grammar.linkml.yaml` comment | Sets correct expectations; no code change needed |

### 2. Typed artifact identifier wrappers

#### What the problem is

The grammar defines a distinct identifier class for every field kind:
`TextFieldId`, `NumericFieldId`, `DateFieldId`, and so on. These are not just
labels — they are typed wrappers that make it structurally impossible to embed
the wrong kind of field. For example, `EmbeddedTextField` can only hold a
`TextFieldId`, so the grammar prevents you from accidentally putting a
`NumericFieldId` inside an `EmbeddedTextField`. The type system enforces correct
pairing at the point of definition.

In the current prototype, this guarantee is lost. Every `field_reference` slot
is typed as plain `Iri`:

```yaml
# grammar.linkml.yaml — current (simplified) form
EmbeddedTextField:
  is_a: EmbeddedField
  attributes:
    field_reference:
      range: Iri        # accepts any IRI — no enforcement that it points to a TextField
      required: true
```

There is nothing in this definition that prevents someone from putting the IRI
of a `DateField` into an `EmbeddedTextField`. The reference would be accepted by
any LinkML validator or generated class, and the error would only surface at
runtime when the field is actually resolved and used.

#### A concrete example of the problem

Imagine two field definitions exist in a repository:

```
https://repo.metadatacenter.org/fields/title-field   — a TextField
https://repo.metadatacenter.org/fields/start-date    — a DateField
```

With the current simplified prototype, this template definition would pass
schema validation without complaint:

```yaml
embedded_artifacts:
  - type: EmbeddedTextField
    embedded_artifact_key: study_title
    field_reference: https://repo.metadatacenter.org/fields/start-date  # WRONG KIND
```

An `EmbeddedTextField` is pointing at a `DateField`. The schema says
`field_reference: Iri` so any IRI is fine. The mistake goes undetected until the
field is resolved and a tool tries to treat a `DateField` as a `TextField`.

#### What the fix looks like in `grammar.linkml.yaml`

The fix is to type each `field_reference` slot to the appropriate concrete
`Field` subclass rather than to `Iri`. LinkML will then reject any reference
whose target is not of the correct class.

```yaml
# grammar.linkml.yaml — corrected form
EmbeddedTextField:
  is_a: EmbeddedField
  attributes:
    field_reference:
      range: TextField    # only a TextField IRI is accepted here
      required: true

EmbeddedNumericField:
  is_a: EmbeddedField
  attributes:
    field_reference:
      range: NumericField  # only a NumericField IRI is accepted here
      required: true

EmbeddedDateField:
  is_a: EmbeddedField
  attributes:
    field_reference:
      range: DateField
      required: true

# … and so on for every EmbeddedField variant
```

Now the same wrong-kind template definition would fail schema validation
immediately, with an error like "field_reference must be of type TextField, got
DateField". This matches exactly the guarantee that the typed identifier classes
(`TextFieldId`, `NumericFieldId`, …) provide in the grammar.

#### Why it was simplified in the prototype

Using concrete class ranges requires the validator to resolve each `field_reference`
IRI and check the type of the referenced object. This is straightforward in a
closed system where all field definitions are in the same document or a known
import, but it requires cross-document resolution in a repository setting where
fields are stored separately. The prototype used plain `Iri` to avoid that
dependency, but a production schema should restore the typed ranges.

#### Where the change needs to be made

Every `Embedded*Field` class in `grammar.linkml.yaml` has a `field_reference`
attribute. Each needs its `range:` changed from `Iri` to the corresponding
concrete `Field` subclass. The classes affected are:

`EmbeddedTextField`, `EmbeddedNumericField`, `EmbeddedDateField`,
`EmbeddedTimeField`, `EmbeddedDateTimeField`, `EmbeddedControlledTermField`,
`EmbeddedSingleChoiceField`, `EmbeddedMultipleChoiceField`, `EmbeddedLinkField`,
`EmbeddedEmailField`, `EmbeddedPhoneNumberField`, `EmbeddedOrcidField`,
`EmbeddedRorField`, `EmbeddedDoiField`, `EmbeddedPubMedIdField`,
`EmbeddedRridField`, `EmbeddedNihGrantIdField`, `EmbeddedAttributeValueField`.

No changes are needed in `grammar.md` — this is a limitation of the prototype
schema only, not of the abstract model.

### 3. Instance typing against a dynamic template reference

A `TemplateInstance` is validated against its `template_reference`. The set of
valid `EmbeddedArtifactKey` values in a given instance depends entirely on which
template is referenced — something that can only be known at runtime.

LinkML cannot express "the valid keys for this instance are whatever keys appear
in the referenced template." This is expected: it is a cross-artifact shape
constraint, not a static schema constraint. It belongs in a SHACL shapes graph
or a separate runtime validation module, not in the LinkML schema itself. The
LinkML schema correctly captures the *structural* conformance rules (FieldValue
carries Value+, NestedTemplateInstance carries InstanceValue*, etc.); the
*semantic* key alignment constraint is out of scope for a schema language.

### 4. Recursive constructs

`AttributeValue.value` is typed `range: Value` — a self-referential range.
`NestedTemplateInstance.instance_values` is typed `range: InstanceValue` which
may itself contain further `NestedTemplateInstance` entries. Both are valid in
LinkML YAML, but some code generators require explicit handling (e.g., forward
references in Python, optional depth limits in SQL generators).

### 5. `TextLiteral` as an inline union

`TextLiteral ::= StringLiteral | LangStringLiteral` is expressed via an
`any_of:` on the `text_literal` attribute of `TextValue`. An alternative is to
make `TextLiteral` an abstract class with the two concrete forms as subclasses,
which would give generators a named discriminated union. Either approach works;
the abstract-class approach is slightly more explicit.

---

## Fit assessment summary

| Grammar feature | LinkML fit |
|---|---|
| Abstract field hierarchy | Excellent — maps directly to `abstract: true` + `is_a` |
| Concrete field variants | Excellent — concrete classes with typed slots |
| FieldSpec as a separate construct | Excellent — clean one-to-one class mapping |
| Metadata structures (provenance, versioning) | Excellent |
| Enumerations | Excellent |
| Primitive types with pattern constraints | Excellent |
| Optional / required / multivalued cardinality | Good — `required` and `multivalued` cover all cases |
| Typed ID wrappers | Good — can use concrete class ranges instead of `Iri` |
| Union-typed slot values | Fair — `any_of` works but generators produce untagged unions |
| Cross-artifact key alignment (instance ↔ template) | Out of scope — needs SHACL or runtime validation |
| Recursive value nesting (AttributeValue) | Fair — valid YAML; generator support varies |

Overall, roughly 90% of the grammar maps to LinkML naturally. The remaining
friction is concentrated in a small number of union-typed slot values and the
runtime key-alignment constraint.

---

## What can be generated

LinkML generators that would be directly useful for CEDAR:

### JSON Schema (`gen-json-schema`)

Generates a Draft 7 JSON Schema for validating the structure of template
definitions and instances. The most immediately deployable output — any
JSON toolchain can consume it without LinkML as a runtime dependency.

This is significant because it replaces the hand-maintained structural
validation that CTM 1.6.0 currently embeds inside each template document
as a nested JSON Schema fragment.

### JSON-LD context (`gen-jsonld-context`)

Generates a `@context` document that maps class and slot names to IRIs.
This directly addresses one of the core problems with CTM 1.6.0: the
`@context` block is currently hard-coded differently for standard fields,
static fields, and templates. A generated context derived from a single
schema definition would be consistent by construction.

### Python dataclasses or Pydantic models (`gen-python`, `gen-pydantic`)

A typed Python API for constructing, parsing, and validating CEDAR
artifacts programmatically. Pydantic models are particularly useful for
API layers because they include runtime validators and serializers. This
would replace ad-hoc dictionary manipulation in any Python tooling that
produces or consumes CEDAR templates.

### TypeScript interfaces (`gen-typescript`)

TypeScript types for frontend or Node.js tooling that works with CEDAR
templates and instances.

### SHACL shapes (`gen-shacl`)

RDF shape constraints for validating CEDAR artifacts stored as RDF
triples. Together with the OWL output, this enables validation in
triple-store and Linked Data environments — relevant if CEDAR artifacts
are ever surfaced as RDF directly rather than through CTM 1.6.0 JSON-LD.

### OWL ontology (`gen-owl`)

An OWL class hierarchy and property definitions derived from the schema.
Enables reasoning over the CEDAR model and integration with ontology
tooling.

### Markdown documentation (`gen-markdown`, `gen-doc`)

Auto-generated reference documentation with one page per class, slot
tables, inheritance trees, and range/cardinality annotations. Stays in
sync with the schema automatically; significantly reduces the maintenance
burden compared to hand-authored docs.

### SQL DDL / SQLAlchemy (`gen-sqlddl`, `gen-sqltables`)

A relational schema and ORM models for storing and querying CEDAR
templates and instances in a relational database. Multivalued slots
generate join tables automatically.

---

## Relationship to CTM 1.6.0

CTM 1.6.0 conflates three concerns into a single flat JSON-LD document:

1. JSON Schema (structural validation)
2. JSON-LD context (semantic annotation)
3. CEDAR field configuration (`_ui`, `_valueConstraints`, field metadata)

A LinkML-derived serialization would separate these cleanly:

- The **JSON Schema** output from LinkML handles concern 1.
- The **JSON-LD context** output from LinkML handles concern 2.
- A thin **CEDAR profile layer** on top of the LinkML-generated structures
  handles concern 3 — field specs, cardinality, rendering hints, etc. — as
  proper typed objects rather than as ad-hoc keys scattered across a flat
  object.

The `spec/grammar.md` abstract model already defines the right separation. The
LinkML prototype shows that this separation can be mechanically maintained and
used to drive code and schema generation rather than requiring hand-authoring of
each serialization format independently.

---

## Next steps

- Tighten `field_reference` slot ranges to use concrete `Field` subclass IRIs
  rather than plain `Iri`, restoring the typed-reference safety of the grammar.
- Introduce named abstract base classes for the `ChoiceOptionValue` and
  `ChoiceSelection` unions to give generators cleaner discriminated-union output.
- Add a SHACL overlay for the cross-artifact key-alignment constraint
  (`FieldValue` keys must identify `EmbeddedField` entries in the referenced
  template).
- Run `gen-json-schema` and `gen-jsonld-context` against the prototype to
  validate generator output and identify any remaining fit issues.
- Consider whether `spec/grammar.linkml.yaml` should become the normative
  source of truth for the abstract model, with `spec/grammar.md` generated from
  it or maintained alongside it as a human-readable companion.
