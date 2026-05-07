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
| `dc:` | `http://purl.org/dc/terms/` |

No CEDAR-specific RDF vocabulary is introduced; the projection uses only RDF, RDFS, SKOS, XSD, and Dublin Core terms.

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

The `label` is a `MultilingualString` on every IRI-bearing value. Each localization produces a separate `rdfs:label` triple. A label with no localizations (a single `und`-tagged entry) produces a single `rdfs:label "label"@und` triple.

### Controlled-term values

`ControlledTermValue` projects to the term IRI together with optional metadata triples drawn from the optional `Label`, `Notation`, and `PreferredLabel` slots:

| Slot | Triple emitted (when present) |
|---|---|
| `label` | `<term> rdfs:label "label"@lang` for each localization in the `MultilingualString` |
| `notation` | `<term> skos:notation "notation"^^xsd:string` |
| `preferredLabel` | `<term> skos:prefLabel "preferredLabel"@lang` for each localization in the `MultilingualString` |

The accompanying-triple count is therefore variable: zero (no optional slots), one, two, or more (when label or preferred label carry several localizations).

### Enum values

An enum value's RDF projection requires the surrounding `EnumFieldSpec` context: the value carries a bare `Token`, and the spec's `PermissibleValue+` list supplies the per-token `Label`, `Description`, and `Meaning` metadata that the projection draws on. This is the only `Value` whose RDF lift cannot be determined from the value alone.

- `EnumValue { value: T }` projects as follows:
  1. Look up `T` in the referenced `EnumFieldSpec`'s `PermissibleValue` entries to obtain the matching `pv`.
  2. If `pv` carries one or more `Meaning` entries, project as one RDF IRI node per `Meaning` — i.e. an enum value with `n` meanings projects to `n` IRI nodes. Each IRI node carries `rdfs:label` triples drawn from the matching `Meaning`'s own `label` (one triple per localization in the `MultilingualString`); if the `Meaning` carries no `label`, `rdfs:label` triples are drawn from the enclosing `pv.label` instead, providing a fallback display label when the bound term's own label is not cached. `dc:description` triples are drawn from `pv.description` (one per localization). When this rule yields more than one RDF term, the surrounding statement that targets the enum value is duplicated once per term.
  3. If `pv` carries no `Meaning`, project as `"T"^^xsd:string`. The accompanying `rdfs:label` and `dc:description` triples are not emitted in this case (the value is a bare lexical token).

A conforming RDF emitter MUST therefore have access to the `EnumFieldSpec` of the surrounding `EmbeddedField` when projecting an `EnumValue`. RDF emitters that lift CEDAR data without schema context cannot project enum values faithfully.

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
