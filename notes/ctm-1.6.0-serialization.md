# CTM 1.6.0 Serialization Mapping

## 1. Purpose

This document specifies a one-directional, function-based mapping from the CEDAR Structural Model (defined in `spec/grammar.md`) to CTM 1.6.0 JSON-LD format. The Structural Model remains the authoritative definition of the model; this document defines how constructs in that model are encoded as CTM 1.6.0 JSON-LD values. Each encoding function takes one or more abstract grammar constructs as arguments and produces a JSON value. The functions are defined precisely enough to be directly implementable.

---

## 2. Conventions

**Function Signature Form**

```
encode_X(x: X) → JSON-kind
```

`X` is a grammar production name, `x` is the parameter, and `JSON-kind` is one of: Object, String, Array, Number, Boolean, or null.

**JSON Notation in Function Bodies**

- `{ k₁: v₁, k₂: v₂ }` — JSON object literal
- `[ v₁, v₂ ]` — JSON array
- `"..."` — literal string
- `null` — JSON null
- `omit` — the key is absent from the output (not even present as null)

**Accessor Notation**

Dot notation is used on grammar constructs, e.g. `T.schema_artifact_metadata` or `E.embedded_artifact_key`. Where a grammar construct wraps a primitive string (e.g. `Name ::= name(UnicodeString)`), write `T.name.unicode_string` to reach the string value.

**Helper Functions**

- `key(E)` — the ASCII identifier string of `E`'s `EmbeddedArtifactKey`; defined as `E.embedded_artifact_key.key_identifier.ascii_identifier`
- `iri(I)` — the IRI string of an `Iri` construct; defined as `I.iri_string`
- `merge(a, b, ...)` — merge JSON objects left-to-right; later objects take precedence on key conflicts
- `if P then k: v` — include key `k` with value `v` only when predicate `P` holds; otherwise omit
- `[ x(E) for each E in xs ]` — JSON array built by evaluating `x(E)` for each element `E` of sequence `xs`
- `{ k(E): v(E) for each E in xs }` — JSON object built from key-value pairs, one per element (inline form); `xs` must be a plain sequence with no inline filter. In multi-line blocks, the iteration clause comes first: `{ for each E in xs: k(E): v(E) }`
- `let x = expr` — within a function body, binds the name `x` to the value of `expr`; `x` may then be used in subsequent expressions in the same body
- `[ E in xs | P(E) ]` — the subsequence of `xs` retaining only those elements for which predicate `P(E)` holds; used in `let` bindings to pre-filter before passing to a comprehension
- `xs ++ ys` — concatenation of arrays `xs` and `ys`

**Cardinality Helper**

- `is_multi(E)` — true if `E.cardinality` is present and `max_cardinality` is either `UnboundedCardinality` or a `NonNegativeInteger` greater than 1

**Default Conventions**

- When `Cardinality` is absent, effective min = 1, effective max = 1 (single-valued).
- When `ValueRequirement` is absent, effective requirement is `Optional`.

---

## 3. Standard Namespace Context Object

`STANDARD_NS` is the following JSON object. It is included in every `@context` produced by this mapping.

```json
{
  "schema":   "http://schema.org/",
  "pav":      "http://purl.org/pav/",
  "oslc":     "http://open-services.net/ns/core#",
  "bibo":     "http://purl.org/ontology/bibo/",
  "rdfs":     "http://www.w3.org/2000/01/rdf-schema#",
  "skos":     "http://www.w3.org/2004/02/skos/core#",
  "xsd":      "http://www.w3.org/2001/XMLSchema#"
}
```

---

## 4. Metadata Encoding Functions

### `encode_schema_artifact_metadata(M: SchemaArtifactMetadata) → Object`

Returns a flat JSON object of key-value pairs to be merged into an artifact object.

```
merge(
  encode_artifact_metadata(M.artifact_metadata),
  encode_schema_versioning(M.schema_versioning)
)
```

---

### `encode_artifact_metadata(M: ArtifactMetadata) → Object`

```
merge(
  encode_descriptive_metadata(M.descriptive_metadata),
  encode_temporal_provenance(M.temporal_provenance)
)
```

---

### `encode_descriptive_metadata(D: DescriptiveMetadata) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|-----------------|---|---|
| `"schema:name"` | `D.name.unicode_string` | Always present |
| `"schema:description"` | `D.description.unicode_string` | `null` if `D.description` absent |
| `"schema:identifier"` | `D.identifier.unicode_string` | Omit if `D.identifier` absent |
| `"rdfs:label"`  | `D.preferred_label.unicode_string` | Omit if `D.preferred_label` absent |

`AlternativeLabel` values on `DescriptiveMetadata` have no direct CTM 1.6.0 equivalent and are omitted.

---

### `encode_temporal_provenance(P: TemporalProvenance) → Object`

Returns a JSON object with the following keys:

| Key | Value |
|---|---|
| `"pav:createdOn"` | `P.created_on.iso_8601_date_time_lexical_form` |
| `"pav:createdBy"` | `iri(P.created_by)` |
| `"pav:lastUpdatedOn"` | `P.modified_on.iso_8601_date_time_lexical_form` |
| `"oslc:modifiedBy"` | `iri(P.modified_by)` |

---

### `encode_schema_versioning(V: SchemaVersioning) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"pav:version"` | `V.version.semantic_version` | Always present |
| `"bibo:status"` | `encode_status(V.status)` | Always present |
| `"schema:schemaVersion"` | `V.model_version.semantic_version` | Always present |
| `"pav:previousVersion"` | `iri(V.previous_version.iri)` | Omit if `V.previous_version` absent |
| `"pav:derivedFrom"` | `iri(V.derived_from.iri)` | Omit if `V.derived_from` absent |

---

### `encode_status(S: Status) → String`

Returns the string corresponding to the `Status` kind:

| `Status` kind | Returns |
|---|---|
| `DraftStatus` | `"bibo:draft"` |
| `PublishedStatus` | `"bibo:published"` |

---

## 5. Template Encoding

### `encode_template(T: Template) → Object`

Produces the top-level CTM 1.6.0 template object.

```
merge(
  {
    "@id":    iri(T.template_id),
    "@type":  "https://schema.metadatacenter.org/core/Template",
    "@context": encode_template_context(T),
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type":   "object",
    "title":  T.schema_artifact_metadata.artifact_metadata.descriptive_metadata.name.unicode_string,
    "description": T.schema_artifact_metadata.artifact_metadata.descriptive_metadata.description.unicode_string
                   if description is present, else "",
    "properties":  encode_template_properties(T),
    "required":    encode_template_required(T),
    "additionalProperties": false,
    "_ui":    encode_template_ui(T)
  },
  encode_schema_artifact_metadata(T.schema_artifact_metadata)
)
```

---

### `encode_template_context(T: Template) → Object`

Produces the `@context` of the template, combining standard namespaces with property IRI mappings for data-bearing embedded artifacts that carry a `Property`.

```
let prop_embs = [ E in T.embedded_artifacts
                | (E is EmbeddedField or E is EmbeddedTemplate) and E.property is present ]

merge(
  STANDARD_NS,
  { key(E): encode_property_context_entry(E.property) for each E in prop_embs }
)
```

---

### `encode_property_context_entry(P: Property) → String or Object`

| Condition | Returns |
|---|---|
| `P.property_label` absent | `iri(P.property_iri.iri)` |
| `P.property_label` present | `{ "@id": iri(P.property_iri.iri), "rdfs:label": P.property_label.unicode_string }` |

---

### `encode_template_properties(T: Template) → Object`

Produces the `properties` object for the template's JSON Schema layer. Includes fixed instance-metadata shape entries followed by one entry per embedded artifact.

```
merge(
  {
    "@context": { "type": ["object", "null"] },
    "@id":      { "type": "string", "format": "uri" },
    "schema:isBasedOn":   { "type": "string", "format": "uri" },
    "schema:name":        { "type": "string" },
    "schema:description": { "type": ["string", "null"] },
    "pav:createdOn":      { "type": ["string", "null"], "format": "date-time" },
    "pav:createdBy":      { "type": ["string", "null"], "format": "uri" },
    "pav:lastUpdatedOn":  { "type": ["string", "null"], "format": "date-time" },
    "oslc:modifiedBy":    { "type": ["string", "null"], "format": "uri" }
  },
  {
    for each E in T.embedded_artifacts:
      key(E): encode_embedded_artifact_schema(E)
  }
)
```

---

### `encode_template_required(T: Template) → Array`

```
let required_embs = [ E in T.embedded_artifacts
                    | (E is EmbeddedField or E is EmbeddedTemplate)
                      and effective value_requirement of E is Required ]

[ "@context", "@id", "schema:isBasedOn", "schema:name",
  "schema:description", "pav:createdOn", "pav:createdBy",
  "pav:lastUpdatedOn", "oslc:modifiedBy" ]
++ [ key(E) for each E in required_embs ]
```

---

### `encode_template_ui(T: Template) → Object`

```
let label_embs = [ E in T.embedded_artifacts | E.label_override is present ]

merge(
  { "order": [ key(E) for each E in T.embedded_artifacts ] },
  if label_embs is non-empty:
  {
    "propertyLabels": { key(E): E.label_override.label.unicode_string for each E in label_embs }
  }
)
```

`Header` and `Footer` on `Template` have no direct CTM 1.6.0 equivalent and are omitted.

---

## 6. Embedded Artifact Schema Encoding

These functions produce the value placed at `properties[key(E)]` within the containing template or template element.

### `encode_embedded_artifact_schema(E: EmbeddedArtifact) → Object`

Dispatches to the encoding function for the `EmbeddedArtifact` kind:

| `EmbeddedArtifact` kind | Encoding function |
|---|---|
| `EmbeddedField` | `encode_embedded_field_schema(E)` |
| `EmbeddedTemplate` | `encode_embedded_template_schema(E)` |
| `EmbeddedPresentationComponent` | `encode_embedded_presentation_component_schema(E)` |

---

### `encode_embedded_field_schema(E: EmbeddedField) → Object`

Produces the field schema object, wrapping in array form if `is_multi(E)`. Let `field_obj` = `encode_field(referenced_field(E), E)`, where `referenced_field(E)` is the `Field` identified by the reference in `E`.

```
if is_multi(E):
  {
    "type": "array",
    "items": field_obj,
    if E.cardinality.min_cardinality is present:
      "minItems": E.cardinality.min_cardinality.non_negative_integer.integer_lexical_form (as integer),
    if E.cardinality.max_cardinality is present and not UnboundedCardinality:
      "maxItems": E.cardinality.max_cardinality.non_negative_integer.integer_lexical_form (as integer)
  }

else (single-valued):
  field_obj
```

---

### `encode_embedded_template_schema(E: EmbeddedTemplate) → Object`

Let `elem_obj` = `encode_template_element(referenced_template(E), E)`.

```
if is_multi(E):
  {
    "type": "array",
    "items": elem_obj,
    if E.cardinality.min_cardinality is present:
      "minItems": E.cardinality.min_cardinality.non_negative_integer.integer_lexical_form (as integer),
    if E.cardinality.max_cardinality is present and not UnboundedCardinality:
      "maxItems": E.cardinality.max_cardinality.non_negative_integer.integer_lexical_form (as integer)
  }

else:
  elem_obj
```

---

### `encode_embedded_presentation_component_schema(E: EmbeddedPresentationComponent) → Object`

Presentation components have no standardised CTM 1.6.0 schema representation. Produces an empty object `{}` as a placeholder. See Section 13, Known Gaps.

---

## 7. Field Encoding

### `encode_field(F: Field, E: EmbeddedField) → Object`

Produces the CTM 1.6.0 field object. `E` provides the embedding context for properties such as `_valueConstraints.requiredValue` and `_ui.hidden`.

```
merge(
  {
    "@id":   iri(F.field_id),
    "@type": "https://schema.metadatacenter.org/core/TemplateField",
    "@context": STANDARD_NS,
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type":  "object",
    "title": F.schema_artifact_metadata.artifact_metadata.descriptive_metadata.name.unicode_string,
    "description": F.schema_artifact_metadata.artifact_metadata.descriptive_metadata.description.unicode_string
                   if description is present, else ""
  },
  encode_schema_artifact_metadata(F.schema_artifact_metadata),
  encode_field_type(F.field_type, E)
)
```

`encode_field_type(FT: FieldType, E: EmbeddedField) → Object` is defined per field type in Section 8 using a common skeleton with per-type value shape and constraint entries.

---

## 8. Field Type Encoding

**Skeleton**

Each field type encoding function returns an object of the following form:

```
{
  "properties":           <value-shape>,
  "required":             <required>,
  "additionalProperties": false,
  "_valueConstraints":    merge(encode_embedding_constraints(E), <vc-extras>),
  "_ui":                  merge(encode_embedding_ui(E), <ui-extras>)
}
```

When `<vc-extras>` is empty, `_valueConstraints` is `encode_embedding_constraints(E)` directly with no merge. Field types that do not follow this skeleton are noted explicitly.

**Value Shapes**

Three value shapes recur across field types:

**`STRING_VALUE_SHAPE`** — used by text, date, time, datetime, email, and phone number fields:
```json
{
  "@type":  { "oneOf": [{ "type": "string", "format": "uri" }, { "type": "null" }] },
  "@value": { "type": ["string", "null"] }
}
```

**`NUMBER_VALUE_SHAPE`** — used by numeric fields:
```json
{
  "@type":  { "oneOf": [{ "type": "string", "format": "uri" }, { "type": "null" }] },
  "@value": { "type": ["number", "null"] }
}
```

**`IRI_VALUE_SHAPE`** — used by controlled term, link, and external authority fields:
```json
{
  "@type":      { "oneOf": [{ "type": "string", "format": "uri" }, { "type": "null" }] },
  "@id":        { "type": "string", "format": "uri" },
  "rdfs:label": { "type": ["string", "null"] }
}
```

**Embedding Helper Functions**

### `encode_embedding_constraints(E: EmbeddedField) → Object`

Returns `{ "requiredValue": V }` where `V` depends on the effective value requirement:

| Effective `ValueRequirement` | `"requiredValue"` |
|---|---|
| `Required` | `true` |
| `Recommended` or `Optional` | `false` |

### `encode_embedding_ui(E: EmbeddedField) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"hidden"` | `true` | Only when `E.visibility = Hidden`; omit otherwise |

---

**Field Type Definitions**

### `encode_text_field_type(FT: TextFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `["@value"]`

**`_valueConstraints` extras:**

| Key | Value | Condition |
|---|---|---|
| `"defaultValue"` | `FT.text_default_value.text_value.text_literal.lexical_form.unicode_string` | Omit if absent |
| `"minLength"` | `FT.min_length.non_negative_integer (as integer)` | Omit if absent |
| `"maxLength"` | `FT.max_length.non_negative_integer (as integer)` | Omit if absent |
| `"regex"` | `FT.validation_regex.regex_pattern.unicode_string` | Omit if absent |

**`_ui` extras:** `{ "inputType": encode_text_rendering_hint(FT.text_rendering_hint) }`

### `encode_text_rendering_hint(hint: TextRenderingHint or absent) → String`

Returns the string corresponding to the hint kind:

| `TextRenderingHint` kind | Returns |
|---|---|
| `SingleLineTextRenderingHint` or absent | `"textfield"` |
| `MultiLineTextRenderingHint` | `"textarea"` |

---

### `encode_numeric_field_type(FT: NumericFieldType, E: EmbeddedField) → Object`

**Value shape:** `NUMBER_VALUE_SHAPE` | **Required:** `["@value"]`

**`_valueConstraints` extras:**

| Key | Value | Condition |
|---|---|---|
| `"numberType"` | `encode_numeric_datatype(FT.numeric_datatype)` | Always present |
| `"unitOfMeasure"` | `iri(FT.unit.iri)` | Omit if absent |
| `"decimalPlaces"` | `FT.numeric_precision.non_negative_integer (as integer)` | Omit if absent |
| `"minValue"` | `FT.numeric_min_value.numeric_value.numeric_literal (as number)` | Omit if absent |
| `"maxValue"` | `FT.numeric_max_value.numeric_value.numeric_literal (as number)` | Omit if absent |

**`_ui` extras:** `{ "inputType": "numeric" }`

`Unit` carries an `Iri` in the Structural Model; CTM 1.6.0 `unitOfMeasure` is a plain string. The IRI string value is used directly.

### `encode_numeric_datatype(D: NumericDatatype) → String`

Returns the string corresponding to the `NumericDatatypeIri` kind:

| `NumericDatatypeIri` kind | Returns |
|---|---|
| `XsdIntegerDatatypeIri` | `"xsd:integer"` |
| `XsdDecimalDatatypeIri` | `"xsd:decimal"` |
| `XsdFloatDatatypeIri` | `"xsd:float"` |
| `XsdDoubleDatatypeIri` | `"xsd:double"` |
| `XsdLongDatatypeIri` | `"xsd:long"` |
| `XsdIntDatatypeIri` | `"xsd:int"` |
| `XsdShortDatatypeIri` | `"xsd:short"` |
| `XsdByteDatatypeIri` | `"xsd:byte"` |
| `XsdNonNegativeIntegerDatatypeIri` | `"xsd:nonNegativeInteger"` |
| `XsdPositiveIntegerDatatypeIri` | `"xsd:positiveInteger"` |
| `XsdNonPositiveIntegerDatatypeIri` | `"xsd:nonPositiveInteger"` |
| `XsdNegativeIntegerDatatypeIri` | `"xsd:negativeInteger"` |
| `XsdUnsignedLongDatatypeIri` | `"xsd:unsignedLong"` |
| `XsdUnsignedIntDatatypeIri` | `"xsd:unsignedInt"` |
| `XsdUnsignedShortDatatypeIri` | `"xsd:unsignedShort"` |
| `XsdUnsignedByteDatatypeIri` | `"xsd:unsignedByte"` |

---

### `encode_date_field_type(FT: DateFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `["@value"]`

**`_valueConstraints` extras:** `{ "temporalType": encode_date_value_type(FT.date_value_type) }`

**`_ui` extras:**

| Key | Value | Condition |
|---|---|---|
| `"inputType"` | `"temporal"` | Always present |
| `"temporalGranularity"` | `encode_date_granularity(FT.date_value_type)` | Always present |
| `"dateFormat"` | `encode_date_format(FT.date_rendering_hint.date_format)` | Omit if `FT.date_rendering_hint` absent or `date_format` absent |

### `encode_date_value_type(DVT: DateValueType) → String`

Returns the XSD datatype string for the `DateValueType` kind:

| `DateValueType` kind | Returns |
|---|---|
| `YearValueType` | `"xsd:gYear"` |
| `YearMonthValueType` | `"xsd:gYearMonth"` |
| `FullDateValueType` | `"xsd:date"` |

### `encode_date_granularity(DVT: DateValueType) → String`

Returns the `temporalGranularity` string for the `DateValueType` kind:

| `DateValueType` kind | Returns |
|---|---|
| `YearValueType` | `"year"` |
| `YearMonthValueType` | `"month"` |
| `FullDateValueType` | `"day"` |

### `encode_date_format(DF: DateComponentOrder) → String`

Returns the `dateFormat` string for the `DateComponentOrder` kind:

| `DateComponentOrder` kind | Returns |
|---|---|
| `DayMonthYearOrder` | `"D/M/YYYY"` |
| `MonthDayYearOrder` | `"M/D/YYYY"` |
| `YearMonthDayOrder` | `"YYYY/M/D"` |

---

### `encode_time_field_type(FT: TimeFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `["@value"]`

**`_valueConstraints` extras:** `{ "temporalType": "xsd:time" }`

**`_ui` extras:**

| Key | Value | Condition |
|---|---|---|
| `"inputType"` | `"temporal"` | Always present |
| `"temporalGranularity"` | `encode_time_precision(FT.time_precision)` | Always present |
| `"timezoneEnabled"` | `true` | Only when `FT.timezone_requirement = TimezoneRequired` |
| `"timezoneEnabled"` | `false` | Only when `FT.timezone_requirement = TimezoneNotRequired` |
| `"inputTimeFormat"` | `"12h"` | Only when `FT.time_rendering_hint.time_format = TwelveHourTimeFormat` |
| `"inputTimeFormat"` | `"24h"` | Only when `FT.time_rendering_hint.time_format = TwentyFourHourTimeFormat` |

### `encode_time_precision(TP: TimePrecision or absent) → String`

Returns the `temporalGranularity` string for the `TimePrecision` kind:

| `TimePrecision` kind | Returns |
|---|---|
| `HourMinutePrecision` | `"minute"` |
| `HourMinuteSecondPrecision` | `"second"` |
| `HourMinuteSecondFractionPrecision` | `"decimalSecond"` |
| absent | `"decimalSecond"` |

---

### `encode_datetime_field_type(FT: DateTimeFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `["@value"]`

**`_valueConstraints` extras:** `{ "temporalType": "xsd:dateTime" }`

**`_ui` extras:**

| Key | Value | Condition |
|---|---|---|
| `"inputType"` | `"temporal"` | Always present |
| `"temporalGranularity"` | `encode_datetime_value_type(FT.datetime_value_type)` | Always present |
| `"timezoneEnabled"` | `true` | Only when `FT.timezone_requirement = TimezoneRequired` |
| `"timezoneEnabled"` | `false` | Only when `FT.timezone_requirement = TimezoneNotRequired` |
| `"inputTimeFormat"` | `"12h"` | Only when `FT.date_time_rendering_hint.time_format = TwelveHourTimeFormat` |
| `"inputTimeFormat"` | `"24h"` | Only when `FT.date_time_rendering_hint.time_format = TwentyFourHourTimeFormat` |

### `encode_datetime_value_type(DVT: DateTimeValueType) → String`

Returns the `temporalGranularity` string for the `DateTimeValueType` kind:

| `DateTimeValueType` kind | Returns |
|---|---|
| `DateHourMinuteValueType` | `"minute"` |
| `DateHourMinuteSecondValueType` | `"second"` |
| `DateHourMinuteSecondFractionValueType` | `"decimalSecond"` |

---

### `encode_controlled_term_field_type(FT: ControlledTermFieldType, E: EmbeddedField) → Object`

**Value shape:** `IRI_VALUE_SHAPE` | **Required:** `[]`

**`_valueConstraints` extras:**

| Key | Value | Condition |
|---|---|---|
| `"multipleChoice"` | `false` | Always present |
| `"ontologies"` | `[ encode_ontology_source(S) for each OntologySource S in FT.controlled_term_sources ]` | Always present |
| `"branches"` | `[ encode_branch_source(S) for each BranchSource S in FT.controlled_term_sources ]` | Always present |
| `"classes"` | `[ encode_class_source_entry(C) for each ClassSource S in FT.controlled_term_sources, for each C in S.controlled_term_classes ]` | Always present |
| `"valueSets"` | `[ encode_value_set_source(S) for each ValueSetSource S in FT.controlled_term_sources ]` | Always present |

**`_ui` extras:** `{ "inputType": "textfield" }`

### `encode_ontology_source(S: OntologySource) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"uri"` | `iri(S.ontology_reference.ontology_iri.iri)` | Always present |
| `"acronym"` | `S.ontology_reference.ontology_display_hint.ontology_acronym.unicode_string` | Omit if absent |
| `"name"` | `S.ontology_reference.ontology_display_hint.ontology_name.unicode_string` | Omit if absent |

### `encode_branch_source(S: BranchSource) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"uri"` | `iri(S.ontology_reference.ontology_iri.iri)` | Always present |
| `"acronym"` | `S.ontology_reference.ontology_display_hint.ontology_acronym.unicode_string` | Omit if absent |
| `"rootTermUri"` | `iri(S.root_term_iri.iri)` | Always present |
| `"rootTermLabel"` | `S.root_term_label.unicode_string` | Always present |
| `"maxDepth"` | `S.max_traversal_depth.non_negative_integer (as integer)` | Omit if absent |

### `encode_class_source_entry(C: ControlledTermClass) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"uri"` | `iri(C.term_iri.iri)` | Always present |
| `"label"` | `C.label.unicode_string` | Always present |
| `"prefLabel"` | `C.label.unicode_string` | Always present |
| `"type"` | `"OntologyClass"` | Always present |
| `"source"` | `iri(C.ontology_reference.ontology_iri.iri)` | Always present |

### `encode_value_set_source(S: ValueSetSource) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"identifier"` | `S.value_set_identifier.unicode_string` | Always present |
| `"name"` | `S.value_set_name.unicode_string` | Omit if absent |
| `"uri"` | `iri(S.value_set_iri.iri)` | Omit if absent |

---

### `encode_single_choice_field_type(FT: SingleChoiceFieldType, E: EmbeddedField) → Object`

Choice fields may be literal-valued or IRI-valued. Determine the value form by inspecting the options: if any option carries a `ControlledTermValue` or `Iri`, use IRI-form; otherwise use literal-form.

**Value shape:** `STRING_VALUE_SHAPE` (literal-form); for IRI-form replace `"@value"` with `"@id": { "type": "string", "format": "uri" }` | **Required:** `[]`

**`_valueConstraints` extras:**

| Key | Value | Condition |
|---|---|---|
| `"multipleChoice"` | `false` | Always present |
| `"literals"` | `[ encode_choice_option_literal(O) for each O in FT.options ]` | Literal-form |
| `"literals"` | `[ encode_choice_option_iri(O) for each O in FT.options ]` | IRI-form |

**`_ui` extras:** `{ "inputType": encode_single_choice_rendering_hint(FT.single_choice_rendering_hint) }`

### `encode_single_choice_rendering_hint(hint: SingleChoiceRenderingHint or absent) → String`

Returns the `inputType` string for the hint kind:

| `SingleChoiceRenderingHint` kind | Returns |
|---|---|
| `RadioRenderingHint` or absent | `"radio"` |
| `SingleSelectDropdownRenderingHint` | `"list"` |

### `encode_choice_option_literal(O: ChoiceOption) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"label"` | `O.choice_option_value` (lexical form as string) | Always present |
| `"selectedByDefault"` | `true` | Omit if `O.default_option` absent |

`ChoiceOptionValue` may be a `Literal`, `ControlledTermValue`, or `Iri`. For literal choice options, use the lexical form of the `Literal`. For `ControlledTermValue` or `Iri` choice options, encode as IRI-form options using `encode_choice_option_iri`.

### `encode_choice_option_iri(O: ChoiceOption) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"@id"` | `iri(O.choice_option_value.iri)`, or `iri(O.choice_option_value.term_iri.iri)` for `ControlledTermValue` | Always present |
| `"rdfs:label"` | label of `O.choice_option_value` | Omit if no label |
| `"selectedByDefault"` | `true` | Omit if `O.default_option` absent |

---

### `encode_multiple_choice_field_type(FT: MultipleChoiceFieldType, E: EmbeddedField) → Object`

This field type does not follow the standard skeleton. It wraps the value schema in an array:

```
{
  "type": "array",
  "minItems": 0,
  "items": {
    "type": "object",
    "properties": { "@value": { "type": ["string", "null"] } },
    "required": [],
    "additionalProperties": false
  },
  "_valueConstraints": merge(encode_embedding_constraints(E), <vc-extras>),
  "_ui":               merge(encode_embedding_ui(E), <ui-extras>)
}
```

For IRI-form multiple choice, replace `"@value"` in `items.properties` with `"@id": { "type": "string", "format": "uri" }`.

**`_valueConstraints` extras:**

| Key | Value | Condition |
|---|---|---|
| `"multipleChoice"` | `true` | Always present |
| `"literals"` | `[ encode_choice_option_literal(O) for each O in FT.options ]` | Literal-form |
| `"literals"` | `[ encode_choice_option_iri(O) for each O in FT.options ]` | IRI-form |

**`_ui` extras:** `{ "inputType": encode_multiple_choice_rendering_hint(FT.multiple_choice_rendering_hint) }`

### `encode_multiple_choice_rendering_hint(hint: MultipleChoiceRenderingHint or absent) → String`

Returns the `inputType` string for the hint kind:

| `MultipleChoiceRenderingHint` kind | Returns |
|---|---|
| `CheckboxRenderingHint` or absent | `"checkbox"` |
| `MultiSelectDropdownRenderingHint` | `"list"` |

---

### `encode_link_field_type(FT: LinkFieldType, E: EmbeddedField) → Object`

**Value shape:** `IRI_VALUE_SHAPE` | **Required:** `[]` | **`_valueConstraints` extras:** none | **`_ui` extras:** `{ "inputType": "link" }`

---

### `encode_email_field_type(FT: EmailFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `[]` | **`_valueConstraints` extras:** none | **`_ui` extras:** `{ "inputType": "email" }`

---

### `encode_phone_number_field_type(FT: PhoneNumberFieldType, E: EmbeddedField) → Object`

**Value shape:** `STRING_VALUE_SHAPE` | **Required:** `[]` | **`_valueConstraints` extras:** none | **`_ui` extras:** `{ "inputType": "phone-number" }`

---

**External Authority Field Types**

All six external authority field types share the same skeleton entry:

**Value shape:** `IRI_VALUE_SHAPE` | **Required:** `[]` | **`_valueConstraints` extras:** none | **`_ui` extras:** `{ "inputType": encode_external_authority_input_type(FT) }`

### `encode_external_authority_field_type(FT: ExternalAuthorityFieldType, E: EmbeddedField) → Object`

Applies the skeleton with the above parameters.

### `encode_external_authority_input_type(FT: ExternalAuthorityFieldType) → String`

Returns the `inputType` string for the field type kind:

| `ExternalAuthorityFieldType` kind | Returns |
|---|---|
| `OrcidFieldType` | `"orcid"` |
| `RorFieldType` | `"ror"` |
| `DoiFieldType` | `"doi"` |
| `PubMedIdFieldType` | `"pubmed"` |
| `RridFieldType` | `"rrid"` |
| `NihGrantIdFieldType` | `"nih-grant"` |

The `inputType` string values for external authority fields are not standardised in the published CTM 1.6.0 specification. The values above reflect common practice and SHOULD be confirmed against the deployed CTM 1.6.0 implementation.

---

### `encode_attribute_value_field_type(FT: AttributeValueFieldType, E: EmbeddedField) → Object`

This field type does not follow the standard skeleton. It uses a top-level array type:

```
{
  "type": "array",
  "items": { "type": "string" },
  "minItems": 0,
  "additionalProperties": false,
  "_valueConstraints": merge(encode_embedding_constraints(E), { "requiredValue": false }),
  "_ui":               merge(encode_embedding_ui(E), { "inputType": "attribute-value" })
}
```

The instance representation of `AttributeValue` fields in CTM 1.6.0 uses `additionalProperties` at the instance level rather than a structured value schema. See Section 13, Known Gaps.

---

## 9. Template Element Encoding

When a `Template` is referenced by an `EmbeddedTemplate`, it is encoded as a CTM 1.6.0 template element object.

### `encode_template_element(T: Template, E: EmbeddedTemplate) → Object`

```
merge(
  {
    "@id":    iri(T.template_id),
    "@type":  "https://schema.metadatacenter.org/core/TemplateElement",
    "@context": encode_template_context(T),
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type":   "object",
    "title":  T.schema_artifact_metadata.artifact_metadata.descriptive_metadata.name.unicode_string,
    "description": T.schema_artifact_metadata.artifact_metadata.descriptive_metadata.description.unicode_string
                   if description is present, else "",
    "properties":  encode_template_properties(T),
    "required":    encode_template_required(T),
    "additionalProperties": false,
    "_ui":    encode_template_ui(T)
  },
  encode_schema_artifact_metadata(T.schema_artifact_metadata)
)
```

`encode_template_context`, `encode_template_properties`, `encode_template_required`, and `encode_template_ui` are as defined in Section 5 and operate identically on `Template` constructs whether they are top-level templates or nested template elements.

---

## 10. Value Encoding (Instance Level)

These functions encode `Value` constructs as they appear within a `TemplateInstance`.

### `encode_value(V: Value) → Object`

Dispatches to the encoding function for the `Value` kind:

| `Value` kind | Encoding function |
|---|---|
| `TextValue` | `encode_text_value(V)` |
| `NumericValue` | `encode_numeric_value(V)` |
| `DateValue` | `encode_date_value(V)` |
| `TimeValue` | `encode_time_value(V)` |
| `DateTimeValue` | `encode_datetime_value(V)` |
| `ControlledTermValue` | `encode_controlled_term_value(V)` |
| `ChoiceValue` | `encode_choice_value(V)` |
| `LinkValue` | `encode_link_value(V)` |
| `EmailValue` | `encode_email_value(V)` |
| `PhoneNumberValue` | `encode_phone_number_value(V)` |
| `ExternalAuthorityValue` | `encode_external_authority_value(V)` |
| `AttributeValue` | `encode_attribute_value(V)` |

---

### `encode_text_value(V: TextValue) → Object`

Returns a JSON object whose keys depend on the `TextLiteral` kind:

| `TextLiteral` kind | `"@value"` source | `"@language"` |
|---|---|---|
| `StringLiteral` | `V.text_literal.lexical_form.unicode_string` | Omit |
| `LangStringLiteral` | `V.text_literal.lexical_form.unicode_string` | `V.text_literal.language_tag.bcp_47_tag` |

---

### `encode_numeric_value(V: NumericValue) → Object`

```
{
  "@value": V.numeric_literal.lexical_form.unicode_string,
  "@type":  encode_numeric_datatype(V.numeric_literal.numeric_datatype_iri)
}
```

---

### `encode_date_value(V: DateValue) → Object`

Returns `{ "@value": <literal>, "@type": <xsd-type> }` where the sources depend on the `DateValue` kind:

| `DateValue` kind | `"@value"` source | `"@type"` |
|---|---|---|
| `YearValue` | `V.year_literal.lexical_form.unicode_string` | `"xsd:gYear"` |
| `YearMonthValue` | `V.year_month_literal.lexical_form.unicode_string` | `"xsd:gYearMonth"` |
| `FullDateValue` | `V.full_date_literal.lexical_form.unicode_string` | `"xsd:date"` |

---

### `encode_time_value(V: TimeValue) → Object`

```
{ "@value": V.time_literal.lexical_form.unicode_string, "@type": "xsd:time" }
```

---

### `encode_datetime_value(V: DateTimeValue) → Object`

```
{ "@value": V.date_time_literal.lexical_form.unicode_string, "@type": "xsd:dateTime" }
```

---

### `encode_controlled_term_value(V: ControlledTermValue) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"@id"` | `iri(V.term_iri.iri)` | Always present |
| `"rdfs:label"` | `V.label.unicode_string` | Omit if absent |
| `"skos:notation"` | `V.notation.unicode_string` | Omit if absent |
| `"skos:prefLabel"` | `V.preferred_label.unicode_string` | Omit if absent |

---

### `encode_choice_value(V: ChoiceValue) → Object`

Dispatches on the kind of `V.choice_selection`:

| `V.choice_selection` kind | Returns |
|---|---|
| `Literal` (`StringLiteral` or `LangStringLiteral`) | `encode_text_value(as TextValue wrapping the literal)` |
| `ControlledTermValue` | `encode_controlled_term_value(V.choice_selection)` |
| `Iri` | `{ "@id": iri(V.choice_selection) }` |

---

### `encode_link_value(V: LinkValue) → Object`

Returns a JSON object with the following keys:

| Key | Value | Condition |
|---|---|---|
| `"@id"` | `iri(V.iri)` | Always present |
| `"rdfs:label"` | `V.link_label.unicode_string` | Omit if `V.link_label` absent |

---

### `encode_email_value(V: EmailValue) → Object`

```
{ "@value": V.string_literal.lexical_form.unicode_string }
```

---

### `encode_phone_number_value(V: PhoneNumberValue) → Object`

```
{ "@value": V.string_literal.lexical_form.unicode_string }
```

---

### `encode_external_authority_value(V: ExternalAuthorityValue) → Object`

Each kind produces `{ "@id": <iri>, "rdfs:label": <label> }` where `"rdfs:label"` is omitted when `V.label` is absent.

| `ExternalAuthorityValue` kind | `"@id"` source |
|---|---|
| `OrcidValue` | `iri(V.orcid_iri.iri)` |
| `RorValue` | `iri(V.ror_iri.iri)` |
| `DoiValue` | `iri(V.doi_iri.iri)` |
| `PubMedIdValue` | `iri(V.pub_med_iri.iri)` |
| `RridValue` | `iri(V.rrid_iri.iri)` |
| `NihGrantIdValue` | `iri(V.nih_grant_iri.iri)` |

---

### `encode_attribute_value(V: AttributeValue) → Object`

```
{ V.attribute_name.unicode_string: encode_value(V.value) }
```

Nested `AttributeValue` constructs produce nested objects. Multiple `AttributeValue` entries for the same instance field are merged into a single flat or nested JSON object in the CTM 1.6.0 representation.

---

## 11. Instance Encoding

### `encode_template_instance(I: TemplateInstance, T: Template) → Object`

```
let fvs  = [ IV in I.instance_values | IV is FieldValue ]
let ntis = [ IV in I.instance_values | IV is NestedTemplateInstance ]
let emb_fields     = [ E in T.embedded_artifacts | E is EmbeddedField ]
let emb_templates  = [ E in T.embedded_artifacts | E is EmbeddedTemplate ]

merge(
  {
    "@context":         encode_template_context(T),
    "@id":              iri(I.template_instance_id),
    "schema:isBasedOn": iri(T.template_id)
  },
  encode_artifact_metadata(I.artifact_metadata),
  { for each EF in emb_fields:
      EF.key: encode_field_value(fv(EF), EF) },
  { for each ET in emb_templates:
      ET.key: encode_nested_template_instance_slot(ntis_for(ET), ET) }
)
```

where `fv(EF)` denotes the `FieldValue` in `fvs` whose key equals `EF.key`, and `ntis_for(ET)` denotes `[ NTI in ntis | NTI.key = ET.key ]`.

---

### `encode_field_value(FV: FieldValue, EF: EmbeddedField) → Object or Array`

```
if is_multi(EF):
  [ encode_value(V) for each V in FV.values ]

else:
  encode_value(first(FV.values))
```

---

### `encode_nested_template_instance_slot(NTIs: NestedTemplateInstance+, ET: EmbeddedTemplate) → Object or Array`

Let `RT` = the referenced `Template` of `ET`.

```
if is_multi(ET):
  [ encode_template_instance(NTI, RT) for each NTI in NTIs ]

else:
  encode_template_instance(first(NTIs), RT)
```

---

## 12. Annotations

`Annotation` constructs on `ArtifactMetadata` have no standardised CTM 1.6.0 equivalent. They are encoded as top-level properties on the artifact object using the annotation name IRI as the JSON key.

### `encode_annotation(A: Annotation) → { key: value }`

```
key:   iri(A.annotation_name.iri)

value: if A.annotation_value is LiteralAnnotationValue:
         encode_text_value(as TextValue) or the raw lexical form string
       if A.annotation_value is IriAnnotationValue:
         iri(A.annotation_value.iri)
```

Implementations SHOULD confirm that annotation IRI keys are valid within the CTM 1.6.0 `@context` before including them.

---

## 13. Known Gaps and Lossy Areas

1. **`PresentationComponent` variants** — `RichTextComponent`, `ImageComponent`, `YoutubeVideoComponent`, `SectionBreakComponent`, and `PageBreakComponent` have no clean CTM 1.6.0 reusable artifact equivalent. `encode_embedded_presentation_component_schema` produces `{}` as a placeholder. Concrete implementations may use ad hoc CTM 1.6.0 conventions.

2. **`Header` and `Footer` on `Template`** — No CTM 1.6.0 equivalent; omitted.

3. **`AlternativeLabel*` on `DescriptiveMetadata`** — No CTM 1.6.0 equivalent; omitted.

4. **`DefaultOption` on `ChoiceOption`** — The CTM 1.6.0 `literals` array has no standard `selectedByDefault` equivalent. Implementations MAY include a custom flag such as `"selectedByDefault": true` if the target system supports it.

5. **Default values for link, contact, and external authority field types** — CTM 1.6.0 `_valueConstraints.defaultValue` is primarily defined for text fields. Default value encoding for `LinkDefaultValue`, `EmailDefaultValue`, `PhoneNumberDefaultValue`, and external authority defaults is implementation-defined.

6. **`AttributeValue` instance representation** — CTM 1.6.0 uses `additionalProperties` on the instance object for attribute-value fields. The instance-level encoding of `AttributeValue` therefore injects key-value pairs directly into the parent instance object rather than nesting them under a field key.

7. **`Recommended` vs `Optional` in `_valueConstraints.requiredValue`** — Both map to `"requiredValue": false`. The distinction is not preserved in the CTM 1.6.0 encoding.

8. **`Unit` as IRI** — CTM 1.6.0 `unitOfMeasure` is a plain string. The IRI string value is used directly; any human-readable label associated with `Unit` is omitted.

9. **`LangStringLiteral` in text values** — CTM 1.6.0 does not model language-tagged strings explicitly. The `@language` key is included in the encoded value object as a JSON-LD extension; support in CTM 1.6.0 tooling is not guaranteed.

10. **External authority `inputType` values** — The `inputType` string values for ORCID, ROR, DOI, PubMed, RRID, and NIH Grant fields are not standardised in the published CTM 1.6.0 specification and SHOULD be confirmed against the deployed implementation.
