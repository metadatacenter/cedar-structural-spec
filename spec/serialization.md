# JSON Serialization

This document defines a normative JSON wire format for the CEDAR Template Model. Conforming implementations in any host language MUST produce and consume documents that follow the encoding defined here, so that artifacts can be exchanged between implementations with no information loss.

This document is companion to but not part of the abstract grammar. The abstract grammar in [`grammar.md`](grammar.md) defines what a CEDAR template *is*; [`wire-grammar.md`](wire-grammar.md) defines the JSON shape of every grammar production; this document defines the encoding rules and conventions that frame those shapes, plus illustrative examples.

## 1. Purpose and Scope

### 1.1 Purpose

The CEDAR Structural Model is intentionally serialization-agnostic at the grammar level. Implementations in different host languages may realize abstract constructs as language-idiomatic data structures (TypeScript interfaces, Java records, Python dataclasses, etc.). For two implementations to exchange artifacts, a common wire format is required.

This document defines that common wire format using JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) as the target encoding. The format is:

- **Native** — encodes the Structural Model directly, without conflating schema, schema-of-schemas, and presentation concerns.
- **Lossless** — every abstract construct encodes to exactly one JSON value, and every conforming JSON value decodes to exactly one abstract construct.
- **Round-trippable** — encoding then decoding yields the same abstract construct.

### 1.2 Relationship to other specifications

[`grammar.md`](grammar.md) is the authoritative definition of the abstract Structural Model. This document defines an encoding *of* that model and does not extend or modify it. Where the grammar permits multiple equivalent abstract forms, this document selects exactly one wire form.

[`wire-grammar.md`](wire-grammar.md) is the formal source of truth for the JSON shape of every grammar production. It mirrors `grammar.md` one-to-one and uses a compact JSON-shaped notation. Per-production property tables formerly in §6 of this document have moved there. The present document carries the encoding philosophy, JSON-specific rules, and worked examples.

[`validation.md`](validation.md) defines the conformance rules a Structural Model artifact must satisfy. This document does not define validation; a JSON document MAY be wire-format-conformant yet fail Structural Model validation, and vice versa.

[`ctm-1.6.0-serialization.md`](ctm-1.6.0-serialization.md) defines a one-directional, lossy mapping from the Structural Model to legacy CEDAR Template Model 1.6.0 JSON-LD format. This is a separate concern; the encoding defined in the present document is independent of CTM 1.6.0 and not interconvertible with it.

#### Note on JSON-LD shape parallel

The string-bearing and IRI-bearing `Value` shapes defined below are structurally similar to JSON-LD's term forms — `value`/`lang`/`datatype` parallel JSON-LD's `@value`/`@language`/`@type`, and `iri` parallels `@id`. This similarity is incidental: the wire form is CEDAR-native and stands on its own. RDF interoperability is provided by a separate derived projection (see [`rdf-projection.md`](rdf-projection.md)).

Conforming documents are **not** JSON-LD. They carry no `@context`, are not interpretable as RDF graphs without external schema knowledge, and do not follow JSON-LD's compaction, expansion, or framing algorithms. A future JSON-LD encoding parallel to (and convertible to/from) the native form defined here MAY be defined; that work is out of scope for this document.

### 1.3 Scope

In scope:

- The JSON encoding rules (property naming, NFC normalisation, integer handling) that frame the shapes formally defined in [`wire-grammar.md`](wire-grammar.md).
- Discriminator placement (the `kind` / position rules).
- The wrapping principle that determines which productions are tagged JSON objects vs flat JSON values.
- Worked end-to-end examples.

Out of scope:

- Per-production property tables. Those live normatively in [`wire-grammar.md`](wire-grammar.md).
- JSON-LD, RDF, or other RDF-graph representations.
- YAML, msgpack, CBOR, or other non-JSON encodings.
- Validation conformance ([`validation.md`](validation.md)).
- Storage and transport concerns (file naming, MIME types, HTTP headers, etc.).
- Per-language implementation concerns: decoder/encoder code structure, error-reporting conventions, partial-decoding strategies, in-memory data shapes, and similar realization decisions. These are addressed in language-specific binding documents (forthcoming).

## 2. Conformance Language

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used in the sense of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

A *conforming JSON document* is a JSON value that satisfies every encoding rule in this document, matches the wire shape defined for some production in [`wire-grammar.md`](wire-grammar.md), and corresponds to some abstract Structural Model construct as defined in [`grammar.md`](grammar.md).

A *conforming implementation* is software that, when given an abstract Structural Model construct, produces a conforming JSON document; and when given a conforming JSON document, decodes it to the corresponding abstract construct.

## 3. Conventions

### 3.1 Production references

Production names from [`grammar.md`](grammar.md) and [`wire-grammar.md`](wire-grammar.md) appear in `UpperCamelCase`. Constructor forms from `grammar.md` appear in `lower_snake_case`. Concrete JSON property names appear in `lowerCamelCase`.

### 3.2 JSON terminology

The terms *object*, *array*, *string*, *number*, *boolean*, *null*, and *value* refer to JSON values per [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). The terms *property*, *member*, and *element* refer to the structural components of those values.

### 3.3 Property naming

Property names within tagged objects MUST be `lowerCamelCase` translations of the corresponding component names in the production. Where a component name in the grammar is itself an `UpperCamelCase` production name (e.g. `EmbeddedArtifactKey`), the JSON property uses the role-name from the production (e.g. `key`) rather than the production name itself. The canonical property name for any production component is the one given in its `wire-grammar.md` entry.

### 3.4 Examples

JSON examples appear in fenced code blocks marked `json`. Examples are illustrative only; the normative content is the corresponding `wire-grammar.md` entry.

Examples may use *placeholders* of the form `<ProductionName>` to denote the JSON encoding of a production at the surrounding position. A placeholder is resolved by replacing it with the encoding defined for that production in [`wire-grammar.md`](wire-grammar.md). The `*` and `+` suffixes (e.g. `<Annotation>*`, `<EnumValue>+`) denote sequences per §4.4 — zero-or-more and one-or-more respectively.

## 4. General Encoding Rules

### 4.1 Tagged and untagged objects

JSON objects in the wire format are either *tagged* — carrying a `"kind"` property — or *untagged* — without `"kind"`. Whether an object is tagged is determined by the position it occupies in the document; see §4.5 for the rule.

When an object is tagged, the value of `"kind"` MUST be the production name from [`grammar.md`](grammar.md), transcribed in `UpperCamelCase` exactly as the grammar names it. For example, `"TextValue"` for the `TextValue` production. The grammar's `lower_snake_case` constructor forms (e.g. `text_value(...)`) describe abstract composition and do not appear on the wire.

A conforming implementation MUST reject any object whose tagged-or-untagged status does not match the position it occupies (per §4.5), whose `"kind"` value (when tagged) does not match any production known to the implementation, or whose other properties do not match the wire-grammar entry for the named production.

### 4.2 Optional components

A grammar component marked `[X]` (optional) MUST be omitted from its enclosing JSON object when not present. A conforming implementation MUST NOT emit `null` or an empty string in place of an absent optional component.

A conforming implementation MUST treat the absence of an optional property as equivalent to that component not being present in the abstract construct.

On decode, a conforming implementation MUST reject any document in which an optional property is present with the JSON value `null`. The two conforming wire forms for an absent optional are: the property is omitted entirely, or the enclosing object is itself absent. Treating `null` as equivalent to absent is non-conforming because it admits two distinct wire forms for the same abstract state, breaking round-trip equality.

### 4.3 Sequence components

A grammar component marked `X*` (zero or more) is encoded as a JSON array. The array MAY be empty.

A grammar component marked `X+` (one or more) is encoded as a JSON array. The array MUST contain at least one element. In `wire-grammar.md` these are written `nonEmptyArray<X>`.

The order of elements in the JSON array MUST match the order of components in the abstract construct. A conforming implementation MUST preserve this order through encode and decode.

### 4.4 Discriminator placement

A JSON object's discriminator presence depends on the position it occupies in the document.

**Polymorphic positions** — those at which the grammar admits a union of productions, e.g. `EmbeddedArtifact ::= EmbeddedField | EmbeddedTemplate | EmbeddedPresentationComponent` — MUST encode each alternative as a tagged JSON object carrying `"kind"` per §4.1. The document root is itself a polymorphic position (any artifact may appear there); a JSON document at the root therefore carries `"kind"`.

**Singleton positions** — those at which the grammar admits exactly one production — MUST encode that production as an untagged JSON object whose properties correspond to the production's components. The enclosing object's property name, together with the grammar, fully determines the production at this position; a `"kind"` property MUST NOT appear.

This rule applies recursively: an untagged object at a singleton position whose own components include further composite objects follows the same rule for each of those components.

#### Position-discriminated unions

A few unions occupy fixed singleton positions where the surrounding property name fully determines the variant. For example, `RenderingHint` is determined by which `FieldSpec` family the parent is. These wire entries are flagged `// discriminator: position` in [`wire-grammar.md`](wire-grammar.md).

Implementations MUST NOT rely on JSON property ordering to discriminate alternatives.

### 4.5 String values

Strings are JSON strings encoded in UTF-8. Lexical-form strings (e.g. the `value` property of a `TextValue`) MUST be transmitted in Unicode Normalization Form C (NFC). A conforming encoder MUST emit NFC. A conforming decoder receiving non-NFC input handles it per §9.6.

### 4.6 Number values

Integer-valued grammar productions (e.g. `NonNegativeInteger`) are encoded as JSON numbers without a fractional part or exponent. Implementations MUST encode integer values that fit within JSON Number's safe integer range (the integers in the closed interval `[−(2^53 − 1), 2^53 − 1]`) without loss. Values outside that range fall under §5.1 below — the wire grammar permits a JSON-string fallback, but implementations MAY refuse to encode out-of-range values since no current use site exercises this case.

Decimal-valued grammar productions are encoded as JSON numbers in standard decimal notation per RFC 8259.

### 4.7 Implementation freedom

A conforming implementation MAY add JSON properties beyond those defined here for non-normative purposes (annotations, hashes, signatures, etc.), provided those properties begin with `_` or `$` to avoid collision with future normative additions. Decoders MUST ignore such properties. Decoders encountering a property whose name does *not* begin with `_` or `$` and is not declared by the production at the position MUST report a wire-shape error per §9.5.

A conforming implementation MAY emit JSON object properties in any order; the wire format is order-independent at the object level.

## 5. The Wrapping Principle

The grammar uses constructor forms uniformly to define every production, including productions that consist of a single component of a primitive type. For example:

```ebnf
Header ::= header( MultilingualString )
NonNegativeInteger ::= non_negative_integer( IntegerLexicalForm )
EmbeddedArtifactKey ::= embedded_artifact_key( AsciiIdentifier )
```

A literal translation would encode each such production as a tagged JSON object with a single payload property. This document does not require that. Instead, the wrapping principle applies:

> A production is encoded as a tagged JSON object only when wrapping carries information beyond the production's payload. Otherwise, the production is encoded as the JSON value of its single component, and the production's identity is communicated by the property name in the enclosing object.

A production carries information beyond its payload, and so MUST be encoded as a tagged object, when at least one of the following holds:

- **(a) Composite structure.** The production has more than one named component (e.g. `Cardinality`, `Property`, `LabelOverride`, every `Value` family).

- **(b) Discriminated union membership.** The production participates in a union where alternatives must be distinguished at decode time (e.g. `Value`, every artifact's `kind`, the twenty `Field` family variants). The discriminator is `"kind"`.

- **(c) Lexical-form preservation.** The production carries lexical content whose preservation requires more than a JSON primitive can express (e.g. `LangString` carries a lexical form *and* a language tag; both must be present in the wire form).

A production that satisfies none of these is encoded *flat*: the JSON value at the corresponding property position in the enclosing object is the JSON encoding of the production's single component, with no `"kind"` wrapper.

The full list of productions that collapse this way is given in §1.6 of [`wire-grammar.md`](wire-grammar.md). At a glance:

- All `MultilingualString`-typed wrappers (`Header`, `Footer`, `Name`, `Description`, `PreferredLabel`, `AlternativeLabel`, `Label`, `PropertyLabel`, `OntologyName`, `RootTermLabel`, `ValueSetName`) flatten to a JSON array of `LangString` entries.
- All single-`Iri` wrappers (artifact identifiers and references, `PropertyIri`, the typed external-authority IRIs, `OntologyIri`, etc.) flatten to a plain JSON string.
- All single-`NonNegativeInteger` wrappers (`MinLength`, `MaxLength`, `MinCardinality`, `MaxCardinality`, `DecimalPlaces`, `MaxTraversalDepth`) flatten to a plain JSON number.
- Plain-`string` wrappers (`Identifier`, `Notation`, `OntologyAcronym`, `ValueSetIdentifier`, `HtmlContent`) flatten to a plain JSON string.
- Enum-style productions (`Status`, `ValueRequirement`, `Visibility`, `DateValueType`, `TimePrecision`, `DateTimeValueType`, `TimezoneRequirement`, `DateComponentOrder`, `TimeFormat`, `TextRenderingHint`, `SingleValuedEnumRenderingHint`, `MultiValuedEnumRenderingHint`, `BooleanRenderingHint`, `RealNumberDatatypeKind`) flatten to a JSON string drawn from a fixed set.

### 5.1 Lexical-form preservation

**Big integers.** `NonNegativeInteger` values that exceed JSON Number's
safe integer range (the magnitude bound `2^53 − 1`) MAY be encoded as
JSON strings rather than numbers. A decoder MUST accept both forms.
In practice this case does not arise for the model's current use
sites (length bounds, cardinality bounds, traversal depths, numeric
precision are all small); implementations MAY refuse to encode an
out-of-range value rather than fall back to the string form. If a
future use site introduces values that routinely exceed the safe
range, this section will be revisited to make the string fallback a
MUST.

## 6. Per-Production Encoding (Examples)

Detailed wire shapes for every production are normatively specified in [`wire-grammar.md`](wire-grammar.md). This section gives illustrative JSON examples — one per family of related productions — and documents only those JSON-encoding-specific rules that aren't expressible in the wire-grammar notation.

### 6.1 Identifiers

Every artifact identifier is encoded as a plain JSON string carrying the IRI. The kind of identifier is communicated by the surrounding context (the property name on the enclosing object, plus the `kind` discriminator of the enclosing artifact).

```json
"https://example.org/fields/title"
```

A `FieldId` appears only in two grammar positions: as `Field.id` (the artifact's own identity) and as `EmbeddedField.artifactRef` (a reference to the embedded artifact). Both surrounding constructs carry a `kind` discriminator that conveys the field family. The twenty permitted family-bearing `kind` values for `Field` variants are: `"TextField"`, `"IntegerNumberField"`, `"RealNumberField"`, `"BooleanField"`, `"DateField"`, `"TimeField"`, `"DateTimeField"`, `"ControlledTermField"`, `"SingleValuedEnumField"`, `"MultiValuedEnumField"`, `"LinkField"`, `"EmailField"`, `"PhoneNumberField"`, `"OrcidField"`, `"RorField"`, `"DoiField"`, `"PubMedIdField"`, `"RridField"`, `"NihGrantIdField"`, or `"AttributeValueField"`. The corresponding `EmbeddedField` variants prefix `Embedded` (e.g. `"EmbeddedTextField"`).

The IRI placed at a `FieldId` position MUST belong to a field of the family declared by the surrounding `kind`. This is a structural-invariant constraint (per §9.1 category 3); a conforming encoder enforces it before emitting the wire form, and a conforming decoder reports a structural error against `path` if it is violated.

### 6.2 Multilingual strings

A `MultilingualString` is encoded as a non-empty JSON array of untagged `LangString` objects. There is no `kind` discriminator: `MultilingualString` appears only at singleton positions, and `LangString` appears only as an entry of a `MultilingualString` array.

```json
[{ "value": "Hello", "lang": "en" }, { "value": "Bonjour", "lang": "fr" }]
```

The BCP 47 `'und'` (undetermined) subtag MAY be used when the natural language is unspecified.

`MultilingualString` and a single language-tagged `TextValue` share the `{value, lang}` shape but are structurally distinct: a `TextValue` is a *single* tagged value object (carrying `kind: "TextValue"`), whereas a `MultilingualString` is an *array* of one or more untagged `{value, lang}` entries. Encoders MUST NOT collapse a single-entry `MultilingualString` into a bare `LangString` object, and decoders MUST NOT promote a single `LangString` into a `MultilingualString` array.

### 6.3 Values

Each `Value` family is encoded as a tagged object that carries its content directly. The full set of variants is given in [`wire-grammar.md`](wire-grammar.md) §3.

```json
{ "kind": "TextValue", "value": "Jane Smith" }
```
```json
{ "kind": "TextValue", "value": "Jane Smith", "lang": "en" }
```
```json
{ "kind": "IntegerNumberValue", "value": "42" }
```
```json
{ "kind": "RealNumberValue", "value": "3.14", "datatype": "decimal" }
```
```json
{ "kind": "BooleanValue", "value": true }
```
```json
{ "kind": "YearValue", "value": "2024" }
```
```json
{ "kind": "FullDateValue", "value": "2024-06-15" }
```
```json
{ "kind": "TimeValue", "value": "10:30:00" }
```
```json
{ "kind": "DateTimeValue", "value": "2024-06-15T10:30:00Z" }
```
```json
{ "kind": "ControlledTermValue", "term": "http://example.org/term/1", "label": [{ "value": "Term 1", "lang": "en" }] }
```
```json
{ "kind": "EnumValue", "value": "professor" }
```
```json
{ "kind": "LinkValue", "iri": "https://example.org/page" }
```
```json
{ "kind": "EmailValue", "value": "jane@example.org" }
```
```json
{ "kind": "OrcidValue", "iri": "https://orcid.org/0000-0002-1825-0097", "label": [{ "value": "Josiah Carberry", "lang": "en" }] }
```
```json
{ "kind": "AttributeValue", "name": "https://example.org/p/color", "value": { "kind": "TextValue", "value": "blue" } }
```

### 6.4 Metadata and annotations

`LifecycleMetadata`, `SchemaArtifactVersioning`, `ArtifactMetadata`, and `SchemaArtifactMetadata` each appear at a fixed singleton position and are encoded as untagged JSON objects. The descriptive properties of an artifact (`name`, `description`, `identifier`, `preferredLabel`, `altLabels`) sit directly on `ArtifactMetadata` rather than under a `descriptiveMetadata` wrapper.

```json
{
  "name": [{ "value": "Full Name", "lang": "en" }],
  "description": [{ "value": "Full legal name.", "lang": "en" }],
  "preferredLabel": [{ "value": "Name", "lang": "en" }],
  "lifecycle": {
    "createdOn": "2024-01-01T00:00:00Z",
    "createdBy": "https://orcid.org/0000-0002-1825-0097",
    "modifiedOn": "2024-06-15T12:30:00Z",
    "modifiedBy": "https://orcid.org/0000-0002-1825-0097"
  },
  "annotations": [
    {
      "property": "https://example.org/annotation-properties/notes",
      "body": { "kind": "AnnotationStringValue", "value": "An institutional note." }
    }
  ]
}
```

`AnnotationValue` is a kind-discriminated polymorphic union over named annotation-value variants. Two variants are currently defined: `AnnotationStringValue` (a lexical form with optional language tag) and `AnnotationIriValue` (an IRI):

```json
{ "kind": "AnnotationStringValue", "value": "An institutional note." }
```
```json
{ "kind": "AnnotationStringValue", "value": "Une note institutionnelle.", "lang": "fr" }
```
```json
{ "kind": "AnnotationIriValue", "iri": "https://example.org/related-resource" }
```

The wire-form property name on `Annotation` is `body` (for the grammar's `AnnotationValue` component) — following the W3C Web Annotations convention.

The `AnnotationValue` variant family is open to extension: future revisions of this specification MAY introduce additional `AnnotationXxxValue` variants. Conforming decoders MUST reject documents whose `body.kind` is not a known variant.

### 6.5 Embedded artifact properties

`Cardinality`, `Property`, `LabelOverride`, and `Unit` are untagged JSON objects (singleton positions). `EmbeddedArtifactKey` flattens to a plain JSON string. `ValueRequirement` and `Visibility` flatten to JSON enum strings.

```json
{ "min": 0, "max": 5 }
```
```json
{ "iri": "https://schema.org/name", "label": [{ "value": "name", "lang": "en" }] }
```
```json
{ "label": [{ "value": "Custom Label", "lang": "en" }], "altLabels": [] }
```
```json
"required"
```

### 6.6 Field specs

Each concrete `FieldSpec` is encoded as a tagged object whose `"kind"` matches the spec's grammar production name. Optional configuration properties are omitted when absent.

```json
{ "kind": "TextFieldSpec", "minLength": 1, "maxLength": 200, "renderingHint": "singleLine" }
```
```json
{ "kind": "IntegerNumberFieldSpec", "minValue": { "kind": "IntegerNumberValue", "value": "0" } }
```
```json
{ "kind": "DateFieldSpec", "dateValueType": "fullDate", "renderingHint": { "componentOrder": "dayMonthYear" } }
```
```json
{ "kind": "SingleValuedEnumFieldSpec",
  "permissibleValues": [
    { "value": "yes", "label": [{ "value": "Yes", "lang": "en" }] },
    { "value": "no",  "label": [{ "value": "No",  "lang": "en" }] }
  ],
  "defaultValue": "yes",
  "renderingHint": "radio"
}
```
```json
{ "kind": "MultiValuedEnumFieldSpec",
  "permissibleValues": [
    { "value": "active",  "label": [{ "value": "Active",  "lang": "en" }],
      "meanings": ["http://example.org/active-1"] },
    { "value": "retired", "label": [{ "value": "Retired", "lang": "en" }] }
  ],
  "defaultValues": [],
  "renderingHint": "checkbox"
}
```
```json
{ "kind": "ControlledTermFieldSpec", "sources": [
  { "kind": "OntologySource", "ontology": { "iri": "http://purl.obolibrary.org/obo/ncit.owl",
    "displayHint": { "acronym": "NCIT", "name": [{ "value": "NCI Thesaurus", "lang": "en" }] } } }
] }
```

A `SingleValuedEnumFieldSpec`'s `defaultValue` is a single string `Token` matching one of the permissible values; a `MultiValuedEnumFieldSpec`'s `defaultValues` is a (possibly empty) array of such strings, with no duplicates. An `OntologyDisplayHint` MUST carry at least one of `acronym` or `name` (a constraint enforced by `wire-grammar.md`).

The flat-string rendering hints (`TextRenderingHint`, `SingleValuedEnumRenderingHint`, `MultiValuedEnumRenderingHint`, `BooleanRenderingHint`) appear directly as JSON enum strings; the object-shaped rendering hints (`NumericRenderingHint`, `DateRenderingHint`, `TimeRenderingHint`, `DateTimeRenderingHint`) are JSON objects with optional configuration slots.

### 6.7 Field artifacts and embedded artifacts

A `Field` artifact (shown for the text family; the other nineteen families substitute `"IntegerNumberField"`, `"RealNumberField"`, `"BooleanField"`, `"DateField"`, etc. for `kind`):

```json
{
  "kind": "TextField",
  "id": "<FieldId>",
  "modelVersion": "<SemanticVersion>",
  "metadata": "<SchemaArtifactMetadata>",
  "fieldSpec": "<FieldSpec>"
}
```

The `modelVersion` property is a top-level property of every concrete artifact (`Template`, `TemplateInstance`, every `XxxField`, and every `PresentationComponent` variant). It is encoded as a JSON string carrying a Semantic Versioning 2.0.0 lexical form and identifies the version of the CEDAR structural model the artifact conforms to. The position is immediately after `id` and before `metadata`.

The `kind` value MUST match the family of the nested `fieldSpec`. Conforming encoders MUST ensure that the IRI placed at `id` belongs to a field of the same family.

An `EmbeddedField` (shown for the text family; substitute `"EmbeddedIntegerNumberField"`, `"EmbeddedRealNumberField"`, `"EmbeddedBooleanField"`, `"EmbeddedDateField"`, etc. for the other nineteen families):

```json
{
  "kind": "EmbeddedTextField",
  "key": "<EmbeddedArtifactKey>",
  "artifactRef": "<FieldId>",
  "valueRequirement": "required",
  "cardinality": { "min": 1, "max": 1 },
  "property": { "iri": "https://schema.org/name" }
}
```

An `EmbeddedAttributeValueField` MUST NOT carry a `defaultValue` property.

```json
{
  "kind": "EmbeddedTemplate",
  "key": "<EmbeddedArtifactKey>",
  "artifactRef": "<TemplateId>",
  "cardinality": { "min": 0 }
}
```

```json
{
  "kind": "EmbeddedPresentationComponent",
  "key": "<EmbeddedArtifactKey>",
  "artifactRef": "<PresentationComponentId>",
  "visibility": "visible"
}
```

### 6.8 Default values

The optional `defaultValue` slot on each `EmbeddedXxxField` is encoded directly as the family-specific `Value` (see [`wire-grammar.md`](wire-grammar.md) §6.5 for the full table). There is no `DefaultValue` wrapper on the wire: a default value is the family's `Value` shape in place. The `defaultValue` slot is a singleton position; per [`wire-grammar.md`](wire-grammar.md) §1.5, the `kind` property is omitted from the encoded `Value` because the surrounding `EmbeddedXxxField.kind` already fixes the family. The one polymorphic `Value` union — `DateValue` — retains its `kind` discriminator at this position because a kind tag is required to discriminate the union arms.

`EmbeddedMultiValuedEnumField.defaultValue` is the only embedding-level default whose wire form is a JSON array rather than a single object: it carries an array of `EnumValue` entries (each with `kind` dropped). All other embedding-level defaults are single `Value` objects.

Examples by family:

```json
// EmbeddedTextField.defaultValue — TextValue (kind dropped)
"defaultValue": { "value": "Stanford University" }
"defaultValue": { "value": "Bonjour", "lang": "fr" }

// EmbeddedIntegerNumberField.defaultValue — IntegerNumberValue (kind dropped)
"defaultValue": { "value": "42" }

// EmbeddedRealNumberField.defaultValue — RealNumberValue (kind dropped)
"defaultValue": { "value": "3.14", "datatype": "decimal" }

// EmbeddedBooleanField.defaultValue — BooleanValue (kind dropped)
"defaultValue": { "value": true }

// EmbeddedDateField.defaultValue — DateValue (polymorphic; kind retained)
"defaultValue": { "kind": "FullDateValue", "value": "2024-06-15" }
"defaultValue": { "kind": "YearValue", "value": "2024" }

// EmbeddedTimeField.defaultValue — TimeValue (kind dropped)
"defaultValue": { "value": "10:30:00" }

// EmbeddedDateTimeField.defaultValue — DateTimeValue (kind dropped)
"defaultValue": { "value": "2024-06-15T10:30:00Z" }

// EmbeddedControlledTermField.defaultValue — ControlledTermValue (kind dropped)
"defaultValue": {
  "term": "http://purl.obolibrary.org/obo/UBERON_0000955",
  "label": [{ "value": "brain", "lang": "en" }]
}

// EmbeddedSingleValuedEnumField.defaultValue — single EnumValue (kind dropped)
"defaultValue": { "value": "yes" }

// EmbeddedMultiValuedEnumField.defaultValue — array of EnumValue (each kind dropped)
"defaultValue": [{ "value": "active" }, { "value": "retired" }]

// EmbeddedLinkField.defaultValue — LinkValue (kind dropped)
"defaultValue": { "iri": "https://example.org", "label": "Example" }

// EmbeddedEmailField.defaultValue — EmailValue (kind dropped)
"defaultValue": { "value": "jane@example.org" }

// EmbeddedPhoneNumberField.defaultValue — PhoneNumberValue (kind dropped)
"defaultValue": { "value": "+1-650-555-0123" }

// EmbeddedOrcidField.defaultValue — OrcidValue (kind dropped)
"defaultValue": {
  "iri": "https://orcid.org/0000-0002-1825-0097",
  "label": [{ "value": "Josiah Carberry", "lang": "en" }]
}

// EmbeddedRorField.defaultValue / EmbeddedDoiField.defaultValue / EmbeddedPubMedIdField.defaultValue
// EmbeddedRridField.defaultValue / EmbeddedNihGrantIdField.defaultValue — analogous; kind dropped
```

`TextFieldSpec.defaultValue` is also a singleton position and encodes as a `TextValue` with `kind` dropped (i.e. `{ value, lang? }`). `SingleValuedEnumFieldSpec.defaultValue` encodes on the wire as a bare JSON string (the `Token` of the selected permissible value); `MultiValuedEnumFieldSpec.defaultValues` encodes as a JSON array of such bare strings.

Embedding-level defaults take precedence over the spec-level defaults when both are present, parallel to the `TextFieldSpec.defaultValue` precedence rule.

### 6.9 Templates

```json
{
  "kind": "Template",
  "id": "<TemplateId>",
  "modelVersion": "<SemanticVersion>",
  "metadata": "<SchemaArtifactMetadata>",
  "header": [{ "value": "Template Header Text", "lang": "en" }],
  "members": ["<EmbeddedArtifact>*"]
}
```

The `members` array MUST preserve order. The `EmbeddedArtifactKey` values within `members` MUST be unique; a conforming encoder MUST verify uniqueness before producing the JSON, and a conforming decoder MUST reject input that violates this constraint.

### 6.10 Presentation components

```json
{ "kind": "RichTextComponent", "id": "<PresentationComponentId>", "modelVersion": "<SemanticVersion>", "metadata": "<ArtifactMetadata>", "html": "<p>Hello</p>" }
```
```json
{ "kind": "ImageComponent", "id": "<PresentationComponentId>", "modelVersion": "<SemanticVersion>", "metadata": "<ArtifactMetadata>", "image": "https://example.org/image.png" }
```
```json
{ "kind": "SectionBreakComponent", "id": "<PresentationComponentId>", "modelVersion": "<SemanticVersion>", "metadata": "<ArtifactMetadata>" }
```

### 6.11 Instances

```json
{
  "kind": "TemplateInstance",
  "id": "<TemplateInstanceId>",
  "modelVersion": "<SemanticVersion>",
  "metadata": "<ArtifactMetadata>",
  "templateRef": "<TemplateId>",
  "values": ["<InstanceValue>*"]
}
```

`TemplateInstance.metadata` is `ArtifactMetadata` (not `SchemaArtifactMetadata`); instances do not carry schema versioning.

```json
{ "kind": "FieldValue", "key": "<EmbeddedArtifactKey>", "values": ["<Value>+"] }
```

`FieldValue.values` MUST be a non-empty array; absence of a value is represented by omitting the `FieldValue` entirely.

```json
{ "kind": "NestedTemplateInstance", "key": "<EmbeddedArtifactKey>", "values": ["<InstanceValue>*"] }
```

The `values` array of a `TemplateInstance` MUST satisfy the structural invariants defined in [`grammar.md`](grammar.md) §Instances: a given `EmbeddedArtifactKey` appears as the `key` of at most one `FieldValue`; a given `EmbeddedArtifactKey` does not appear as the `key` of both a `FieldValue` and a `NestedTemplateInstance`; multiple `NestedTemplateInstance` entries sharing a `key` are permitted.

## 7. Round-Tripping

A conforming encode-decode round-trip MUST preserve:

- Every component value of every abstract construct, including lexical content of literals and IRI strings.
- The order of every sequence component (`*` and `+`).
- The presence-or-absence of every optional component.

A conforming encode-decode round-trip MAY NOT preserve:

- JSON object property order within a single tagged object.
- Whitespace between JSON tokens.
- Implementation-specific properties beginning with `_` or `$` per §4.7 (these are explicitly outside the conformance contract).

Two conforming JSON documents that differ only in JSON object property order or non-significant whitespace MUST decode to the same abstract construct.

## 8. Examples

### 8.1 A minimal `Template`

The `name` property below is a `MultilingualString` (§6.2): an array of `{value, lang}` entries, one per language. A single-language artifact uses a single-element array. The same shape applies to `description`, `preferredLabel`, each entry of `altLabels`, the `Template`'s `header` and `footer`, controlled-term labels, unit labels, and any other human-display text.

```json
{
  "kind": "Template",
  "id": "https://example.org/templates/empty",
  "modelVersion": "2.0.0",
  "metadata": {
    "name": [{ "value": "Empty", "lang": "en" }],
    "lifecycle": {
      "createdOn": "2024-01-01T00:00:00Z",
      "createdBy": "https://example.org/u",
      "modifiedOn": "2024-01-01T00:00:00Z",
      "modifiedBy": "https://example.org/u"
    },
    "versioning": {
      "version": "1.0.0",
      "status": "draft"
    }
  },
  "members": []
}
```

### 8.2 A `Template` with one embedded text field

```json
{
  "kind": "Template",
  "id": "https://example.org/templates/note",
  "modelVersion": "2.0.0",
  "metadata": { "name": "...", "lifecycle": "...", "versioning": "..." },
  "members": [
    {
      "kind": "EmbeddedTextField",
      "key": "title",
      "artifactRef": "https://example.org/fields/title",
      "valueRequirement": "required",
      "property": { "iri": "https://schema.org/name" }
    }
  ]
}
```

### 8.3 A `TemplateInstance` for the above template

```json
{
  "kind": "TemplateInstance",
  "id": "https://example.org/instances/i1",
  "modelVersion": "2.0.0",
  "metadata": { "name": "...", "lifecycle": "...", "annotations": [] },
  "templateRef": "https://example.org/templates/note",
  "values": [
    {
      "kind": "FieldValue",
      "key": "title",
      "values": [
        { "kind": "TextValue", "value": "First Note" }
      ]
    }
  ]
}
```

## 9. Errors

This section specifies the **error model** for conforming
encoders and decoders: the categories of error each side reports, the
common shape of an error, and the policy on fail-fast vs collected
reporting. The intent is cross-binding parity — a TS, Java, and Python
binding given the same malformed input report the *same set of errors*
at the *same wire-form locations*, even if they surface those errors
through different host-language exception types.

The error model defined here is normative: the binding contract
covers not only what is encoded and decoded, but how failures are
reported.

### 9.1 Error categories

Three categories of error are recognised:

1. **Wire-shape error.** The JSON does not match the wire production
   that should appear at the position. Examples:
   - A property whose declared type is `string` is encoded as a JSON
     number.
   - A polymorphic union slot carries a `kind` that is not one of the
     declared variants.
   - A required property is missing, or a property is present that is
     not declared by the production at the position (excluding
     `_`/`$`-prefixed extension properties per §4.7).
   - A `nonEmptyArray<X>` slot carries `[]`.
2. **Lexical error.** A wire value is well-formed JSON of the right
   shape, but its lexical content does not match the production's
   lexical category. Examples:
   - A `LanguageTag` string that is not a valid BCP 47 tag.
   - An `Iri` string that is not a syntactically valid RFC 3987 IRI.
   - A `LexicalForm` integer string with a leading zero, leading sign,
     or non-decimal digit (per §5.1).
3. **Structural-invariant error.** The shape and lexical content are
   each individually valid, but a constraint that crosses positions is
   violated. Examples:
   - Two `EmbeddedArtifact.key` values within the same `Template` are
     equal.
   - The IRI placed at an `EmbeddedField.artifactRef` belongs to a
     field of a different family than the enclosing `kind` declares.
   - `Cardinality.min > Cardinality.max`.
   - An `OntologyDisplayHint` carries neither `acronym` nor `name`.

A single malformed input may produce errors in more than one category
at distinct positions. An encoder reports the same three categories
when given an in-memory value that does not satisfy them.

### 9.2 Error path

Every error MUST carry a **path** that locates it within the wire
form. The path is a JSON Pointer per RFC 6901 (a slash-prefixed
sequence of decoded property names and decimal array indices),
relative to the *root of the wire document being decoded or encoded*.
For example:

- `""` — the document root.
- `"/members/3/defaultValue"` — the `defaultValue` property of the
  fourth element of the root-level `members` array.
- `"/metadata/annotations/0/body/value"` — the `value` property of
  the body of the first annotation in the root metadata.

The decoder MUST report the path that names the *innermost* property
or array index where the error was detected, not a parent. An encoder
reports the path the property *would have occupied* in the wire form
the encoder is producing.

When a wire-shape error refers to an array index that has not yet
been written (e.g. a `nonEmptyArray<X>` violation reported on `[]`),
the path names the array property itself, with no trailing index.

### 9.3 Error report shape

The minimum information an error MUST carry is:

| Field | Type | Description |
|---|---|---|
| `category` | one of `"wireShape"`, `"lexical"`, `"structural"` | the §9.1 category |
| `path` | string | a JSON Pointer per §9.2 |
| `production` | string | the wire grammar production at `path` (e.g. `"Cardinality"`, `"LangString"`, `"EmbeddedTextField"`) |
| `message` | string | a human-readable explanation |

Bindings MAY carry additional fields — for example a machine-readable
error code, the offending JSON value, or a chain of nested causes —
but the four fields above are the lower bound on what every binding
MUST surface.

The host-language form is binding-specific:

- **TypeScript.** A class extending `CedarConstructionError` (or a
  sibling `CedarDecodeError` / `CedarEncodeError` if the binding
  prefers per-direction types). Properties are surfaced as instance
  fields.
- **Java.** A subclass of `RuntimeException` (e.g.
  `CedarDecodeException`, `CedarEncodeException`). The four required
  fields appear as record components or accessor methods.
- **Python.** A subclass of `Exception` carrying the four fields as
  attributes.

### 9.4 Fail-fast vs collected reporting

The default reporting mode is **collected**: a decoder or encoder
MUST attempt to validate the entire input and report every error it
finds before raising or returning. The thrown error type is therefore
a *collection* of one or more individual errors; bindings idiomatic in
single-error exceptions SHOULD wrap the collection in a single
top-level exception whose message summarises the count and whose
fields carry the list.

Bindings MAY additionally expose a *fail-fast* mode that raises on
the first error encountered. Fail-fast mode is a performance and UX
convenience for interactive use; the wire-form contract itself is
defined in terms of the collected mode.

A decoder operating in collected mode MUST NOT short-circuit on a
wire-shape error within an array element: each element is independent
and must be checked. It MAY short-circuit if continuing past a
wire-shape error would require the decoder to fabricate values
(e.g. the property type is a polymorphic union and the `kind`
discriminator is absent or unrecognised; in this case the decoder
cannot know which arm's properties to validate).

### 9.5 Decoder strictness for unknown discriminators

When a `discriminator: kind` union encounters a `kind` value that is
not one of the declared variants, the decoder MUST report a
wire-shape error and MUST NOT silently substitute a default variant or
treat the input as a generic object. An unknown `kind` is a clear
breaking-change indicator (per §11) and the decoder is in no position
to recover.

When a property whose name is not declared by the production at the
position is present, the decoder MUST report a wire-shape error,
unless the property name begins with `_` or `$` (per §4.7), in which
case the decoder MUST ignore it.

### 9.6 NFC normalisation

A decoder receiving a string that is not in Unicode NFC SHOULD
normalise it to NFC silently and continue, recording the
non-normalisation as a non-fatal warning if the binding's API supports
warnings. A decoder MAY instead raise a wire-shape error; this is
implementation freedom. Encoders MUST emit NFC strings (per §4.5).

---

## 10. Reserved Property Names

The property name `kind` is reserved by this specification at all object-level positions. Implementations MUST NOT reuse this name for non-normative purposes.

The property name prefixes `_` and `$` are reserved for implementation-specific extensions per §4.7.

All other property names are scoped to their containing tagged object's production and have no global meaning.

## 11. Versioning

This document defines version 1.0 of the JSON serialization. The version of the wire format itself is not encoded in conforming JSON documents; it is the responsibility of the surrounding storage or transport layer (file path conventions, MIME parameters, registry metadata, etc.) to communicate which version of this specification a document conforms to.

A future revision of this document MAY add new productions or new tagged-object kinds without a version bump, provided existing conforming documents remain conforming. A revision that changes the encoding of an existing production, removes a production, or changes the meaning of a property MUST bump the version.

## 12. Open Questions

- Should this document define an explicit version-discrimination property (e.g. `"$schema"`) at the root of every conforming document, parallel to the JSON Schema convention?
- Should the wrapping principle in §5 be made into a normative algorithm rather than a checklist of properties?
- Should the encoding distinguish "absent optional component" from "present optional component with the default value" in productions that carry defaults (e.g. `ValueRequirement`)? Current rule: omit if absent; encode the default when explicitly present. This may need to be made unambiguous per production.
- Should `NonNegativeInteger` use a string encoding even within the safe-integer range, to make the wire format consistent across implementations whose host language has no JSON-Number-like type?
