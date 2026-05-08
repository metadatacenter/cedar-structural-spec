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

JSON objects in the wire format are either *tagged* — carrying a `"kind"` property — or *untagged* — without `"kind"`. Whether an object is tagged is determined by its production: every member of a `discriminator: kind` union is tagged at every position; every other production is untagged at every position. See §4.4 for the rule.

When an object is tagged, the value of `"kind"` MUST be the production name from [`grammar.md`](grammar.md), transcribed in `UpperCamelCase` exactly as the grammar names it. For example, `"TextValue"` for the `TextValue` production. The grammar's `lower_snake_case` constructor forms (e.g. `text_value(...)`) describe abstract composition and do not appear on the wire.

A conforming implementation MUST reject any object whose tagged-or-untagged status does not match its production (per §4.4), whose `"kind"` value (when tagged) does not match any production known to the implementation, or whose other properties do not match the wire-grammar entry for the named production.

### 4.2 Optional components

A grammar component marked `[X]` (optional) MUST be omitted from its enclosing JSON object when not present. A conforming implementation MUST NOT emit `null` or an empty string in place of an absent optional component.

A conforming implementation MUST treat the absence of an optional property as equivalent to that component not being present in the abstract construct.

On decode, a conforming implementation MUST reject any document in which an optional property is present with the JSON value `null`. The two conforming wire forms for an absent optional are: the property is omitted entirely, or the enclosing object is itself absent. Treating `null` as equivalent to absent is non-conforming because it admits two distinct wire forms for the same abstract state, breaking round-trip equality.

### 4.3 Sequence components

A grammar component marked `X*` (zero or more) is encoded as a JSON array. The array MAY be empty.

A grammar component marked `X+` (one or more) is encoded as a JSON array. The array MUST contain at least one element. In `wire-grammar.md` these are written `nonEmptyArray<X>`.

The order of elements in the JSON array MUST match the order of components in the abstract construct. A conforming implementation MUST preserve this order through encode and decode.

### 4.4 Discriminator placement

A JSON object's discriminator presence depends on its **production**, not on the position it occupies in the document. Per [`wire-grammar.md`](wire-grammar.md) §1.5, every production is either a member of some `discriminator: kind` union or it is not, and the encoding follows uniformly:

**Polymorphic-union members** — productions that appear as alternatives in a `discriminator: kind` union (e.g. `Value`, `FieldSpec`, `Annotation.body: AnnotationValue`, `EmbeddedField`, `EmbeddedArtifact`, every `Field` family, every `Value` family) — MUST encode as a tagged JSON object carrying `"kind": "<ProductionName>"`. The discriminator is present even when the surrounding context (the enclosing object's `kind` and property name) would already determine the family — for example, `EmbeddedTextField.defaultValue` carries `"kind": "TextValue"` even though `EmbeddedTextField.kind` already pins the family. Uniformity of the rule is preferred over the small wire-size saving.

**Singleton-only productions** — productions that never appear as members of any `discriminator: kind` union (`Cardinality`, `Property`, `LabelOverride`, `SchemaArtifactMetadata`, `ArtifactMetadata`, `LifecycleMetadata`, `SchemaArtifactVersioning`, `Annotation`, `Unit`, `OntologyReference`, `OntologyDisplayHint`, `ControlledTermClass`, `PermissibleValue`, `Meaning`, and the temporal `RenderingHint` object variants) — MUST encode as untagged JSON objects whose properties correspond to the production's components. A `"kind"` property MUST NOT appear.

The rule applies recursively: a tagged object whose own components include further composite objects follows the same rule for each of those components, with the encoding determined by each inner production's own discriminator-union membership.

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

A `MultilingualString` is encoded as a non-empty JSON array of untagged `LangString` objects. Neither `MultilingualString` nor `LangString` is a member of any `discriminator: kind` union (per §4.4), so neither carries a `kind` discriminator on the wire.

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

`LifecycleMetadata`, `SchemaArtifactVersioning`, `ArtifactMetadata`, and `SchemaArtifactMetadata` are singleton-only productions (never members of any `discriminator: kind` union per §4.4), so they encode as untagged JSON objects. The descriptive properties of an artifact (`name`, `description`, `identifier`, `preferredLabel`, `altLabels`) sit directly on `ArtifactMetadata` rather than under a `descriptiveMetadata` wrapper.

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

`Cardinality`, `Property`, `LabelOverride`, and `Unit` are singleton-only productions (per §4.4) and encode as untagged JSON objects. `EmbeddedArtifactKey` flattens to a plain JSON string. `ValueRequirement` and `Visibility` flatten to JSON enum strings.

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

Each concrete `FieldSpec` is encoded as a tagged object whose `"kind"` matches the spec's grammar production name. Optional configuration properties are omitted when absent. Every `XxxFieldSpec` (except `AttributeValueFieldSpec`) carries an optional `defaultValue` slot whose type matches the family's `Value`; see §6.8 for the per-family table and the precedence rule against an embedding-level `defaultValue` on the corresponding `EmbeddedXxxField`.

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
  "defaultValue": { "kind": "EnumValue", "value": "yes" },
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

A `SingleValuedEnumFieldSpec`'s `defaultValue` is a single tagged `EnumValue` whose `value` matches one of the permissible values' tokens; a `MultiValuedEnumFieldSpec`'s `defaultValues` is a (possibly empty) array of such tagged `EnumValue` entries, with no duplicate `value` entries. An `OntologyDisplayHint` MUST carry at least one of `acronym` or `name` (a constraint enforced by `wire-grammar.md`).

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

A default value is a value used to pre-populate a field at instance-creation time when no explicit value has yet been supplied by the user. Defaults exist at two layers:

- **Field-level defaults**, on the reusable `Field`'s `FieldSpec` (`XxxFieldSpec.defaultValue`), shared by every Template that embeds the field.
- **Embedding-level defaults**, on the `EmbeddedXxxField` inside a Template (`EmbeddedXxxField.defaultValue`), specific to that one embedding.

Every concrete field family carries an optional default at both layers, with one exception: `AttributeValueField` carries no default at either layer (an `AttributeValue` is a per-instance pairing of a name and a value, and a default is not meaningful).

**Defaults are UI/UX initialisation only.** A default's sole role is to seed an instance's value at creation time. Defaults do not appear in the wire form of `TemplateInstance` artifacts and do not affect the [RDF projection](rdf-projection.md). When an instance is created and the user accepts the default without modification, the resulting `FieldValue` carries the default value as if the user had typed it in by hand; from the instance's perspective the default and a user-supplied identical value are indistinguishable. When an instance is created and the user does not supply a value (and the field is not required), the corresponding `FieldValue` is omitted entirely — the default does not appear by virtue of having existed.

**Wire form.** Both layers use the same `Value`-typed wire shape: there is no `DefaultValue` wrapper. Every `Value` is a member of the `Value` polymorphic union, so per the kind rule ([`wire-grammar.md`](wire-grammar.md) §1.5) every `defaultValue` carries a `kind` discriminator — at both layers, regardless of whether the enclosing context already pins the family. The discriminator is structurally redundant at slots whose enclosing `XxxFieldSpec.kind` or `EmbeddedXxxField.kind` already determines the family, but is retained for uniformity with `Value`'s appearance at the polymorphic positions where the kind genuinely discriminates (e.g. `FieldValue.values[*]` in instances).

`MultiValuedEnumFieldSpec.defaultValues` and `EmbeddedMultiValuedEnumField.defaultValue` are the two slots whose wire form is a JSON array rather than a single object: each carries an array of tagged `EnumValue` entries.

For the enum families specifically, the structural-invariant constraint that the default reference one of the spec's permissibleValues applies to the inner `value` (the `Token`):

- `SingleValuedEnumFieldSpec.defaultValue?: EnumValue` — a tagged `EnumValue` whose `value` MUST equal the `Token` of one of the spec's permissible-value entries.
- `MultiValuedEnumFieldSpec.defaultValues?: array<EnumValue>` — a (possibly empty) JSON array of tagged `EnumValue` entries; each entry's `value` MUST equal the `Token` of one of the spec's permissible-value entries, and the array MUST NOT contain duplicate `value` entries.

The same constraint applies at the corresponding embedding-level slots (`EmbeddedSingleValuedEnumField.defaultValue` and `EmbeddedMultiValuedEnumField.defaultValue`).

Examples by family — at every layer (field-level on `XxxFieldSpec.defaultValue`, embedding-level on `EmbeddedXxxField.defaultValue`) the wire shape is identical:

```json
// TextValue (field-level on TextFieldSpec, embedding-level on EmbeddedTextField)
"defaultValue": { "kind": "TextValue", "value": "Stanford University" }
"defaultValue": { "kind": "TextValue", "value": "Bonjour", "lang": "fr" }

// IntegerNumberValue
"defaultValue": { "kind": "IntegerNumberValue", "value": "42" }

// RealNumberValue
"defaultValue": { "kind": "RealNumberValue", "value": "3.14", "datatype": "decimal" }

// BooleanValue
"defaultValue": { "kind": "BooleanValue", "value": true }

// DateValue (kind discriminates the arm; the arm MUST be consistent with the spec's dateValueType)
"defaultValue": { "kind": "FullDateValue", "value": "2024-06-15" }
"defaultValue": { "kind": "YearValue", "value": "2024" }

// TimeValue
"defaultValue": { "kind": "TimeValue", "value": "10:30:00" }

// DateTimeValue
"defaultValue": { "kind": "DateTimeValue", "value": "2024-06-15T10:30:00Z" }

// ControlledTermValue
"defaultValue": {
  "kind": "ControlledTermValue",
  "term": "http://purl.obolibrary.org/obo/UBERON_0000955",
  "label": [{ "value": "brain", "lang": "en" }]
}

// EnumValue (single) — both layers use the same shape
"defaultValue": { "kind": "EnumValue", "value": "yes" }

// array<EnumValue> — both layers use the same shape; MultiValuedEnumFieldSpec calls the slot defaultValues
"defaultValues": [
  { "kind": "EnumValue", "value": "active" },
  { "kind": "EnumValue", "value": "retired" }
]

// LinkValue
"defaultValue": { "kind": "LinkValue", "iri": "https://example.org", "label": [{ "value": "Example", "lang": "en" }] }

// EmailValue
"defaultValue": { "kind": "EmailValue", "value": "jane@example.org" }

// PhoneNumberValue
"defaultValue": { "kind": "PhoneNumberValue", "value": "+1-650-555-0123" }

// OrcidValue
"defaultValue": {
  "kind": "OrcidValue",
  "iri": "https://orcid.org/0000-0002-1825-0097",
  "label": [{ "value": "Josiah Carberry", "lang": "en" }]
}

// RorValue / DoiValue / PubMedIdValue / RridValue / NihGrantIdValue — analogous, each tagged with its family's kind
```

**Precedence.** When both a field-level default (on the referenced `Field`'s `FieldSpec`) and an embedding-level default (on the `EmbeddedXxxField`) are present for the same field, the embedding-level default wins. When only one is present, that one applies. When neither is present, the field has no default. There is no mechanism for an embedding to *unset* a field-level default; an embedding wishing to override with a different default supplies its own `defaultValue`, but cannot say "no default here." See `grammar.md` §Defaults for the full table.

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

This section walks through one fully-elaborated example end-to-end —
a realistic `Template`, a `TemplateInstance` that conforms to it, a
round-trip equality check, and two known-bad inputs that exercise the
error model from §9. The goal is to give implementers a concrete
fixture they can decode-and-encode against, and to make every cross-
section reference (the kind rule, wrapping principle,
structural-invariant constraints) visible at one position in the
wire form.

The JSON in this section is **embedded from machine-readable test
fixtures** under
[`spec/normative-tests/`](normative-tests/README.md). A binding
SHOULD treat that directory as a cross-language acceptance suite:
every binding MUST decode every file under `valid/`, encode the
result back to JSON, and verify §7 round-trip equivalence; every
binding MUST decode every file under `invalid/<case>/input.json`
and report at least the errors listed in
`invalid/<case>/expected-errors.json`. The test fixtures are the
authoritative source — this section embeds them via mdBook
`{{#include}}` so the rendered prose and the test data cannot
drift apart.

The example is deliberately compact rather than minimal: every wire
shape this spec defines that is reachable from a `Template` appears
at least once. The companion `TemplateInstance` exercises every value
shape that is reachable from a `FieldValue`. Smaller variations
(empty `members`, no annotations, single-language `name`) are
straightforward subsets of the larger artifact and are not
separately illustrated.

### 8.1 A `Template` exercising the principal wire shapes

The `Template` below describes a single **patient observation**: an
identifier, a free-text comment, a single-valued enum severity, a
date observed, an integer-valued count of repeated occurrences (with
unit and bounds), and a controlled-term diagnosis. It carries
multi-language `name` and `description`, a versioned lifecycle, and
two annotations on the metadata.

```json
{{#include normative-tests/valid/01-patient-observation-template.json}}
```

A few things in the above artifact are worth highlighting because
they exercise specific rules:

- **`metadata` flattening.** `SchemaArtifactMetadata`'s
  `ArtifactMetadata` properties (`name`, `description`,
  `preferredLabel`, `altLabels`, `lifecycle`, `annotations`) and its
  `versioning` slot all sit at the same level on the wire, with no
  inner `artifact` or `descriptive` wrapper (per §6.4 / wire-grammar
  §5.1).
- **Multilingual content.** `name` and `description` are
  `MultilingualString` arrays. Each `altLabels` element is itself a
  `MultilingualString`, so `altLabels` is an array of arrays. Two of
  the language-tagged entries on `name` exercise the unique-lang-tag
  invariant (§9.1 category 3).
- **`AnnotationValue` polymorphism.** `Annotation.body` is a
  `discriminator: kind` union with `AnnotationStringValue` and
  `AnnotationIriValue` arms; the wire form carries the discriminator
  per §1.5 of `wire-grammar.md`.
- **`defaultValue` kind discriminators.** Every `defaultValue` on
  every `EmbeddedXxxField` carries a `kind` discriminator per the
  rule in [`wire-grammar.md`](wire-grammar.md) §1.5 — for example
  `{ "kind": "EnumValue", "value": "moderate" }` on
  `EmbeddedSingleValuedEnumField`, `{ "kind": "IntegerNumberValue",
  "value": "1" }` on `EmbeddedIntegerNumberField`, and `{ "kind":
  "FullDateValue", "value": "2026-01-01" }` on `EmbeddedDateField`.
  The discriminator is structurally redundant at slots whose
  enclosing `EmbeddedXxxField.kind` already fixes the family
  (everywhere except `EmbeddedDateField`), but is retained for
  uniformity with `Value`'s appearance at polymorphic positions
  such as `FieldValue.values[*]` in instances.
- **Identifier IRIs.** Every `artifactRef` is an IRI string that
  belongs to a field of the family declared by the surrounding
  `kind` (§6.1, §9.1 category 3). A conforming encoder verifies this
  before emit; a conforming decoder reports a structural-invariant
  error if it does not.
- **`Cardinality` ranges.** `comment` admits zero or one (`min: 0,
  max: 1`); `observed` requires exactly one; `occurrences` is
  optional with at most one; `diagnosis` requires at least one with
  no upper bound (`max` omitted, meaning unbounded). `Cardinality`
  appears at singleton positions only and never carries `kind` per
  §1.5.

### 8.2 `kind` discriminators, two examples

Per the kind rule (§1.5 of `wire-grammar.md`), every member of a
`discriminator: kind` union carries `"kind"` on the wire — at every
position. Two examples illustrate.

*Example 1 — `Value` at a polymorphic position.* In a
`TemplateInstance`, the `FieldValue.values` slot is a
`nonEmptyArray<Value>`. The decoder uses the array element's `kind`
to pick the union arm:

```json
{
  "kind": "FieldValue",
  "key": "severity",
  "values": [ { "kind": "EnumValue", "value": "severe" } ]
}
```

*Example 2 — `Value` at a singleton position.* In an
`EmbeddedSingleValuedEnumField`, the `defaultValue` slot's type is
the single concrete `EnumValue` production: the enclosing
`EmbeddedSingleValuedEnumField.kind` already determines the family.
The `kind` discriminator is therefore *structurally redundant* at
this slot — but is still emitted, because `EnumValue` is a member of
the `Value` polymorphic union and the rule is uniform across
positions:

```json
{
  "kind": "EmbeddedSingleValuedEnumField",
  "key": "severity",
  "artifactRef": "https://example.org/fields/severity",
  "defaultValue": { "kind": "EnumValue", "value": "moderate" }
}
```

The same pattern applies at every other singleton-`Value` slot:
`EmbeddedTextField.defaultValue` carries `"kind": "TextValue"`,
`EmbeddedIntegerNumberField.defaultValue` carries `"kind":
"IntegerNumberValue"`, `IntegerNumberFieldSpec.minValue` carries
`"kind": "IntegerNumberValue"`, and so on. The wire-size cost is
small (one extra short property per `Value` object) and the
simplification at the spec level is that there is exactly one
encoding rule for `Value`, applicable everywhere.

`EmbeddedMultiValuedEnumField.defaultValue` is the array case: each
element of the array is itself a tagged `EnumValue`:

```json
"defaultValue": [
  { "kind": "EnumValue", "value": "active" },
  { "kind": "EnumValue", "value": "retired" }
]
```

By contrast, `Cardinality`, `Annotation`, `LabelOverride`, `Property`,
and the other singleton-only productions enumerated in §1.5 are
**not** members of any `discriminator: kind` union, so they never
carry `"kind"` regardless of position. `Cardinality` is always
`{ "min": …, "max"?: … }`; never `{ "kind": "Cardinality", … }`.

### 8.3 A `TemplateInstance` for the above `Template`

The instance below conforms to the `Template` of §8.1: it carries one
value per required and present optional `EmbeddedField`, omits the
optional `comment`, and carries two `diagnosis` terms (since
`diagnosis` admits `min: 1` with unbounded `max`).

```json
{{#include normative-tests/valid/02-patient-observation-instance.json}}
```

Notes:

- **Instance metadata.** `TemplateInstance.metadata` is
  `ArtifactMetadata` (no `versioning`), since instances do not carry
  schema versioning — the schema's version is fixed by `templateRef`.
- **`FieldValue.values` is non-empty.** Per the abstract grammar's
  `Value+` constraint, every `FieldValue` carries at least one value;
  absence of a value for a key is represented by **omitting the
  `FieldValue` entry entirely** (the `comment` key here). This is the
  reason `valueRequirement` is enforced at instance-validation time
  rather than wire-shape time: the wire grammar does not require a
  `FieldValue` for every `EmbeddedField`.
- **`FieldValue.values[*]` carries `kind`.** The values inside
  `FieldValue.values` are members of the `Value` polymorphic union;
  every entry carries its `kind` discriminator (per §1.5 of
  `wire-grammar.md`). The same `kind`-bearing shape appears at every
  other `Value` slot — `EmbeddedXxxField.defaultValue` in the
  template above, `TextFieldSpec.defaultValue` on a standalone
  `TextField`, the `IntegerNumberFieldSpec.minValue`/`maxValue`
  bounds — because the rule is uniform across positions.

### 8.4 Round-tripping

Decoding the §8.1 `Template` JSON and re-encoding the resulting
in-memory value MUST produce a JSON document that is equal to the
input under §7's equivalence (object property order and whitespace
are not significant). A binding's round-trip test SHOULD therefore:

1. Parse the input to a JSON tree and to its in-memory model
   representation.
2. Re-encode the in-memory representation to JSON.
3. Compare the two JSON trees property-set-equally (recursive set
   equality on object members, sequence equality on arrays).

A binding MAY canonicalise property order on encode (e.g. always emit
`kind` first, then required fields in grammar order, then optionals
alphabetically); the canonical form is not normative under §7 — only
its decode-equivalence to the input is.

### 8.5 Known-bad inputs

The two inputs below exercise the §9 error model. Each is presented
with the expected reported errors per §9.3 (the four required
fields). A conforming decoder operating in collected mode (the
default per §9.4) MUST report all the listed errors before raising
or returning.

**Input 1 — wire-shape error (unknown `kind` discriminator).**

```json
{{#include normative-tests/invalid/01-unknown-kind/input.json}}
```

Expected error report:

| category | path | production | message |
|---|---|---|---|
| `wireShape` | `/values/0/values/0` | `Value` | `kind: "MysteryValue" is not a recognised Value variant` |

The decoder MUST NOT silently substitute a default variant or treat
the input as a generic object (§9.5).

**Input 2 — structural-invariant error (FieldId family mismatch and
duplicate embedded-artifact key).** This input has *two* errors at
distinct positions; both must be reported. The same IRI
`https://example.org/fields/foo` is used as `artifactRef` from
*two* embeddings whose `kind`s declare different field families —
once as a `TextField`, once as a `DateField`. A single field
identifier cannot belong to two field families, so one of the two
references must be wrong; conformance requires the binding to
detect and report this without consulting an external registry.

```json
{{#include normative-tests/invalid/02-fieldid-family-mismatch-and-duplicate-key/input.json}}
```

Expected error report (collected mode):

| category | path | production | message |
|---|---|---|---|
| `structural` | `/members/1/artifactRef` | `EmbeddedDateField` | `artifactRef "https://example.org/fields/foo" is also referenced at /members/0/artifactRef as a TextField; a FieldId cannot belong to two field families` |
| `structural` | `/members/1/key` | `Template` | `EmbeddedArtifact.key "duplicate" is not unique within the enclosing Template (also at /members/0/key)` |

The duplicate-key error is reported against the *second* occurrence,
not the first; the first occurrence's path is included in the
`message` for traceability. The family-mismatch error is reported
against the *second* occurrence by the same convention.

A binding may also surface additional implementation-specific fields
(error code, original JSON value, etc.); the four columns above are
the required minimum per §9.3. The expected errors live as a JSON
file alongside the input under
[`spec/normative-tests/invalid/02-fieldid-family-mismatch-and-duplicate-key/expected-errors.json`](normative-tests/invalid/02-fieldid-family-mismatch-and-duplicate-key/expected-errors.json),
where the `messageRegex` field gives the regex a binding's
reported `message` MUST match (literal equality is not required —
wording is informational, the regex pins the substantive content).
The same convention applies to the §8.5 first input and to all
future invalid fixtures.

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
   - A `LanguageTag` string that is not a valid BCP 47 tag (per
     RFC 5646).
   - An `Iri` string that is not a syntactically valid absolute IRI
     (per RFC 3987).
   - An `EmbeddedArtifactKey` that does not match
     `^[A-Za-z][A-Za-z0-9_-]*$`.
   - A `LexicalForm` integer string with a leading zero, leading sign,
     or non-decimal digit (per `grammar.md` §Primitive String Types).
   - A `SemanticVersion` string that does not conform to Semantic
     Versioning 2.0.0.
   - An `Iso8601DateTimeLexicalForm` string outside the XSD
     `dateTime` extended form.
3. **Structural-invariant error.** The shape and lexical content are
   each individually valid, but a constraint that crosses positions is
   violated. Examples:
   - Two `EmbeddedArtifact.key` values within the same `Template` are
     equal.
   - The IRI placed at an `EmbeddedField.artifactRef` belongs to a
     field of a different family than the enclosing `kind` declares.
   - `Cardinality.min > Cardinality.max`.
   - An `OntologyDisplayHint` carries neither `acronym` nor `name`.
   - Two `LangString.lang` tags within the same `MultilingualString`
     are equal under case-folded comparison.
   - Two `PermissibleValue.value` tokens within the same enum spec are
     equal.
   - A `MultiValuedEnumFieldSpec.defaultValues` array contains two
     `EnumValue` entries with the same `value`.
   - A field-level or embedding-level `defaultValue` `Token` does
     not equal any `PermissibleValue.value` of the spec.
   - A `DateFieldSpec.defaultValue` arm is inconsistent with the
     spec's `dateValueType` (e.g. `dateValueType: "year"` paired
     with a `FullDateValue` default).
   - A `SchemaArtifactVersioning` carrying both `previousVersion`
     and `derivedFrom` with the same IRI.

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
