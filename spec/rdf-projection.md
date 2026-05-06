# RDF Projection

This section defines a projection from CEDAR `Value` instances to RDF. The projection is a **derived view**: CEDAR's abstract grammar and wire form are CEDAR-native, and RDF is one consumer of the data, not the substrate of it. RDF tooling that consumes CEDAR instance data uses this projection; tooling that does not need RDF ignores it.

The projection is

- **total** — every `Value` admitted by the abstract grammar projects to a unique RDF term (literal or IRI) plus zero or more accompanying triples,
- **deterministic** — given the same input `Value`, every conforming projection produces the same RDF, and
- **mechanical** — the rules below are the entire definition; no interpretive judgement is required.

The projection is **informative with respect to the abstract grammar and wire grammar** — it does not constrain how `Value` instances are encoded on the wire or represented in memory. It is **normative for any RDF emitter** that claims to project CEDAR instance data: a conforming emitter MUST produce the RDF specified here.

## Vocabularies

The projection uses the following IRI prefixes:

| Prefix | IRI |
|---|---|
| `xsd:` | `http://www.w3.org/2001/XMLSchema#` |
| `rdf:` | `http://www.w3.org/1999/02/22-rdf-syntax-ns#` |
| `rdfs:` | `http://www.w3.org/2000/01/rdf-schema#` |
| `skos:` | `http://www.w3.org/2004/02/skos-core#` |

No CEDAR-specific RDF vocabulary is introduced; the projection uses only RDF, RDFS, SKOS, and XSD terms.

## Per-variant projection

Each `Value` variant projects to a single RDF term. The "RDF term" column gives the produced node. The "Accompanying triples" column lists triples that travel with the term when the term is the object of an enclosing statement (for example, the value of an `EmbeddedField` instance). The exact subject/predicate of the enclosing statement is determined by the surrounding structure and is out of scope for this section.

### Scalar values

| `Value` variant | RDF term | Accompanying triples |
|---|---|---|
| `TextValue { value, lang }` (lang present) | `"value"@lang` (`rdf:langString`) | none |
| `TextValue { value }` (lang absent) | `"value"^^xsd:string` | none |
| `IntegerNumberValue { value }` | `"value"^^xsd:integer` | none |
| `RealNumberValue { value, datatype }` | `"value"^^xsd:<datatype>` | none |
| `BooleanValue { value }` | `"value"^^xsd:boolean` (`"true"` or `"false"`) | none |

For `RealNumberValue`, the `<datatype>` placeholder is the lexical name of the carried `RealNumberDatatypeKind` (`decimal`, `float`, or `double`), expanded against `xsd:`.

### Temporal values

| `Value` variant | RDF term |
|---|---|
| `YearValue { value }` | `"value"^^xsd:string` |
| `YearMonthValue { value }` | `"value"^^xsd:string` |
| `FullDateValue { value }` | `"value"^^xsd:date` |
| `TimeValue { value }` | `"value"^^xsd:time` |
| `DateTimeValue { value }` | `"value"^^xsd:dateTime` |

`YearValue` and `YearMonthValue` project to `xsd:string` literals. The temporal nature of the value is recoverable from the surrounding `FieldSpec` if needed; the projection does not introduce `xsd:gYear` or `xsd:gYearMonth` typed literals.

### Contact values

| `Value` variant | RDF term |
|---|---|
| `EmailValue { value }` | `"value"^^xsd:string` |
| `PhoneNumberValue { value }` | `"value"^^xsd:string` |

### IRI-bearing values

`LinkValue`, `OrcidValue`, `RorValue`, `DoiValue`, `PubMedIdValue`, `RridValue`, and `NihGrantIdValue` each project to a plain RDF IRI node.

| `Value` variant | RDF term | Accompanying triples |
|---|---|---|
| `LinkValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `OrcidValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `RorValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `DoiValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `PubMedIdValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `RridValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |
| `NihGrantIdValue { iri, label }` | `<iri>` | if `label` present: `<iri> rdfs:label "label"` |

The `label` is projected as an `rdfs:label` literal. If `label` is a `MultilingualString` carrying multiple localizations, each localization produces a separate `rdfs:label` triple. If `label` is a plain string (as on `LinkValue`), it produces a single `rdfs:label "label"^^xsd:string` triple.

### Controlled-term values

`ControlledTermValue` projects to the term IRI together with optional metadata triples drawn from the optional `Label`, `Notation`, and `PreferredLabel` slots:

| Slot | Triple emitted (when present) |
|---|---|
| `label` | `<term> rdfs:label "label"@lang` for each localization in the `MultilingualString` |
| `notation` | `<term> skos:notation "notation"^^xsd:string` |
| `preferredLabel` | `<term> skos:prefLabel "preferredLabel"@lang` for each localization in the `MultilingualString` |

The accompanying-triple count is therefore variable: zero (no optional slots), one, two, or more (when label or preferred label carry several localizations).

### Choice values

A choice value projects exactly as the option it carries:

- `LiteralChoiceValue { value, lang?, datatype? }` projects under the `TextValue` / `IntegerNumberValue` / `RealNumberValue` rules above, selected by which optional slots are present:
  - if `datatype` present ⇒ project as the corresponding numeric variant (`xsd:integer` if datatype is `integer`; `xsd:decimal`/`xsd:float`/`xsd:double` otherwise),
  - if `lang` present ⇒ project as `TextValue` with lang,
  - otherwise ⇒ project as `TextValue` without lang.
- `ControlledTermChoiceValue { term, label?, notation?, preferredLabel? }` projects as `ControlledTermValue` with the same slots.

### Attribute value

`AttributeValue { name, value }` carries an attribute key and a nested value. The `name` is treated as the IRI of the predicate connecting the enclosing subject to the projected `value`; the projected RDF term is the projection of the nested `value`. The wrapper introduces one triple of the form `<subject> <name> <projected-value>`, where `<subject>` is supplied by the enclosing structure. The accompanying triples of the nested `value` (if any) travel with the projected value as for any other position.

The `name` slot MUST therefore be a syntactically valid IRI when the projection is applied; CEDAR data that carries non-IRI `name` strings is not projectable to RDF without prior resolution against an enclosing namespace.

## Round-trip and faithfulness

The projection is forward-only by design: it converts CEDAR `Value` instances into RDF. The reverse direction (lifting an arbitrary RDF graph back into CEDAR `Value` instances) is not defined by this specification. RDF data produced by this projection MAY be re-ingested into CEDAR by tooling that knows the source `FieldSpec` for each value position; in the absence of `FieldSpec` context the reverse direction is ambiguous.

Within the projection itself, CEDAR-side identity is preserved: two CEDAR `Value` instances with identical content project to RDF terms that are RDF-term-equal. Two CEDAR `Value` instances differing in any structural component project to RDF terms that differ in either the term itself or in the accompanying triples.

## Non-projected information

The following CEDAR information is **not** carried by the projection:

- the `kind` discriminator of each `Value` variant — it is not preserved as an RDF triple. Variants whose RDF terms coincide (for example, `EmailValue` and `PhoneNumberValue` both projecting to `xsd:string` literals) cannot be distinguished from RDF alone,
- presentation hints, label overrides, visibility, and other embedding-level configuration carried by `EmbeddedField` properties — the projection covers `Value` content only,
- field-spec metadata such as units, validation regexes, or rendering hints — these are properties of the schema, not of the value.

Tooling that requires faithful round-tripping of these CEDAR-native concerns SHOULD work directly with the wire form rather than relying on the RDF projection.
