# JSON Serialization

This document defines a normative JSON wire format for the CEDAR Template Model. Conforming implementations in any host language MUST produce and consume documents that follow the encoding defined here, so that artifacts can be exchanged between implementations with no information loss.

This document is companion to but not part of the abstract grammar. The abstract grammar in [`grammar.md`](grammar.md) defines what a CEDAR template *is*; this document defines how a CEDAR template *travels*.

## 1. Purpose and Scope

### 1.1 Purpose

The CEDAR Structural Model is intentionally serialization-agnostic at the grammar level. Implementations in different host languages may realize abstract constructs as language-idiomatic data structures (TypeScript interfaces, Java records, Python dataclasses, etc.). For two implementations to exchange artifacts, a common wire format is required.

This document defines that common wire format using JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) as the target encoding. The format is:

- **Native** — encodes the Structural Model directly, without conflating schema, schema-of-schemas, and presentation concerns.
- **Lossless** — every abstract construct encodes to exactly one JSON value, and every conforming JSON value decodes to exactly one abstract construct.
- **Round-trippable** — encoding then decoding yields the same abstract construct.

### 1.2 Relationship to other specifications

[`grammar.md`](grammar.md) is the authoritative definition of the abstract Structural Model. This document defines an encoding *of* that model and does not extend or modify it. Where the grammar permits multiple equivalent abstract forms, this document selects exactly one wire form.

[`validation.md`](validation.md) defines the conformance rules a Structural Model artifact must satisfy. This document does not define validation; a JSON document MAY be wire-format-conformant yet fail Structural Model validation, and vice versa.

[`ctm-1.6.0-serialization.md`](ctm-1.6.0-serialization.md) defines a one-directional, lossy mapping from the Structural Model to legacy CEDAR Template Model 1.6.0 JSON-LD format. This is a separate concern; the encoding defined in the present document is independent of CTM 1.6.0 and not interconvertible with it.

### 1.3 Scope

In scope:

- The JSON encoding of every production defined in [`grammar.md`](grammar.md), [`presentation.md`](presentation.md), and [`instances.md`](instances.md).
- Discriminator conventions and property naming.
- Encoding rules for sequences, optional components, and unions.
- The wrapping principle that determines which productions are encoded as tagged JSON objects vs flat JSON values.

Out of scope:

- JSON-LD, RDF, or other RDF-graph representations.
- YAML, msgpack, CBOR, or other non-JSON encodings.
- Validation conformance ([`validation.md`](validation.md)).
- Storage and transport concerns (file naming, MIME types, HTTP headers, etc.).
- Per-language implementation concerns: decoder/encoder code structure, error-reporting conventions, partial-decoding strategies, in-memory data shapes, and similar realization decisions. These are addressed in language-specific binding documents (forthcoming).

## 2. Conformance Language

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used in the sense of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

A *conforming JSON document* is a JSON value that satisfies every encoding rule in this document and corresponds to some abstract Structural Model construct as defined in [`grammar.md`](grammar.md).

A *conforming implementation* is software that, when given an abstract Structural Model construct, produces a conforming JSON document; and when given a conforming JSON document, decodes it to the corresponding abstract construct.

## 3. Conventions

### 3.1 Production references

Production names from [`grammar.md`](grammar.md) appear in `UpperCamelCase`. Constructor forms appear in `lower_snake_case`. Concrete JSON property names appear in `lowerCamelCase`.

### 3.2 JSON terminology

The terms *object*, *array*, *string*, *number*, *boolean*, *null*, and *value* refer to JSON values per [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). The terms *property*, *member*, and *element* refer to the structural components of those values.

### 3.3 Examples

JSON examples appear in fenced code blocks marked `json`. Examples are illustrative only; the normative content is the prose preceding each example.

## 4. General Encoding Rules

### 4.1 Tagged and untagged objects

JSON objects in the wire format are either *tagged* — carrying a `"kind"` property — or *untagged* — without `"kind"`. Whether an object is tagged is determined by the position it occupies in the document; see §4.5 for the rule.

When an object is tagged, the value of `"kind"` MUST be the production name from [`grammar.md`](grammar.md), transcribed in `UpperCamelCase` exactly as the grammar names it. For example, `"TextValue"` for the `TextValue` production. The grammar's `lower_snake_case` constructor forms (e.g. `text_value(...)`) describe abstract composition and do not appear on the wire.

Both tagged and untagged objects carry properties corresponding to the components of the abstract production. Those properties MUST appear with `lowerCamelCase` names that correspond directly to the components named in the production.

A conforming implementation MUST reject any object whose tagged-or-untagged status does not match the position it occupies (per §4.5), whose `"kind"` value (when tagged) does not match any production known to the implementation, or whose other properties do not match the encoding rules for the named production.

### 4.2 Property names

Property names within tagged objects MUST be `lowerCamelCase` translations of the corresponding component names in the production. Where a component name in the grammar is itself an `UpperCamelCase` production name (e.g. `EmbeddedArtifactKey`), the JSON property uses the role-name from the production (e.g. `key`) rather than the production name itself.

When in doubt, the canonical property name for a given production component is the one used in the per-production encoding tables in §6.

### 4.3 Optional components

A grammar component marked `[X]` (optional) MUST be omitted from its enclosing JSON object when not present. A conforming implementation MUST NOT emit `null` or an empty string in place of an absent optional component.

A conforming implementation MUST treat the absence of an optional property as equivalent to that component not being present in the abstract construct.

### 4.4 Sequence components

A grammar component marked `X*` (zero or more) is encoded as a JSON array. The array MAY be empty.

A grammar component marked `X+` (one or more) is encoded as a JSON array. The array MUST contain at least one element.

The order of elements in the JSON array MUST match the order of components in the abstract construct. A conforming implementation MUST preserve this order through encode and decode.

### 4.5 Discriminator placement

A JSON object carries the `"kind"` property if and only if the grammar admits multiple alternative productions at the position the object occupies.

**Polymorphic positions** — those at which the grammar admits a union of productions, e.g. `EmbeddedArtifact ::= EmbeddedField | EmbeddedTemplate | EmbeddedPresentationComponent` — MUST encode each alternative as a tagged JSON object carrying `"kind"` per §4.1. The document root is itself a polymorphic position (any artifact may appear there); a JSON document at the root therefore carries `"kind"`.

**Singleton positions** — those at which the grammar admits exactly one production — MUST encode that production as an untagged JSON object whose properties correspond to the production's components. The enclosing object's property name, together with the grammar, fully determines the production at this position; a `"kind"` property MUST NOT appear.

This rule applies recursively: an untagged object at a singleton position whose own components include further composite objects follows the same rule for each of those components.

Implementations MUST NOT rely on JSON property ordering to discriminate alternatives.

### 4.6 String values

Strings are JSON strings encoded in UTF-8. Lexical-form strings (e.g. the `lexicalForm` of a `StringLiteral`) MUST be transmitted in Unicode Normalization Form C (NFC). A conforming implementation SHOULD normalize on encode.

### 4.7 Number values

Integer-valued grammar productions (e.g. `NonNegativeInteger`) are encoded as JSON numbers without a fractional part or exponent. Implementations MUST encode integer values that fit within JSON Number's safe integer range without loss; values outside that range MUST be encoded as strings (see §5.2 below for the cases this applies to).

Decimal-valued grammar productions are encoded as JSON numbers in standard decimal notation per RFC 8259.

### 4.8 Implementation freedom

A conforming implementation MAY add JSON properties beyond those defined here for non-normative purposes (annotations, hashes, signatures, etc.), provided those properties begin with `_` or `$` to avoid collision with future normative additions. Decoders MUST ignore such properties.

A conforming implementation MAY emit JSON object properties in any order; the wire format is order-independent at the object level.

## 5. The Wrapping Principle

The grammar uses constructor forms uniformly to define every production, including productions that consist of a single component of a primitive type. For example:

```ebnf
Header ::= header( string )
NonNegativeInteger ::= non_negative_integer( ... )
KeyIdentifier ::= key_identifier( AsciiIdentifier )
```

A literal translation would encode each such production as a tagged JSON object with a single payload property. This document does not require that. Instead, the wrapping principle applies:

> A production is encoded as a tagged JSON object only when wrapping carries information beyond the production's payload. Otherwise, the production is encoded as the JSON value of its single component, and the production's identity is communicated by the property name in the enclosing object.

A production carries information beyond its payload, and so MUST be encoded as a tagged object, when at least one of the following holds:

- **(a) Composite structure.** The production has more than one named component (e.g. `Cardinality`, `Property`, `LabelOverride`, `Iri` paired with semantics, every artifact identifier).

- **(b) Discriminated union membership.** The production participates in a union where alternatives must be distinguished at decode time (e.g. `Literal`, `Value`, every artifact's `kind`, the eighteen `Field` family variants).

- **(c) Lexical-form preservation.** The production carries lexical content whose preservation requires more than a JSON primitive can express (e.g. `LangStringLiteral` carries a lexical form *and* a language tag; both must be present in the wire form).

A production that satisfies none of these is encoded *flat*: the JSON value at the corresponding property position in the enclosing object is the JSON encoding of the production's single component, with no `"kind"` wrapper.

### 5.1 Flat productions

The following productions are encoded as flat JSON values:

| Production | JSON encoding | Notes |
|---|---|---|
| `Header` | string | Plain Unicode text |
| `Footer` | string | Plain Unicode text |
| `Name` | string | Plain Unicode text |
| `Description` | string | Plain Unicode text |
| `Identifier` | string | Plain Unicode text |
| `PreferredLabel` | string | Plain Unicode text |
| `AlternativeLabel` | string | Plain Unicode text |
| `Label` (in `LabelOverride`) | string | Plain Unicode text |
| `PropertyIri` | string | IRI string |
| `PropertyLabel` | string | Plain Unicode text |
| `MinCardinality` | number | Encoded as the `min` property of `Cardinality`; non-negative integer |
| `MaxCardinality` | number | Encoded as the `max` property of `Cardinality`. Unboundedness is expressed by omitting `max` rather than by a distinct value (per [`grammar.md`](grammar.md) §Cardinality) |
| `NonNegativeInteger` | number | Non-negative integer |
| `EmbeddedArtifactKey` | string | ASCII identifier matching `[A-Za-z][A-Za-z0-9_-]*` (per grammar §Embedded Artifact Key); the inner `KeyIdentifier` wrapper does not appear in the wire form |
| `Status` | string `"draft"` or `"published"` | The grammar's `Draft` and `Published` are encoded as their lowercase names |
| `AnnotationName` | string | IRI string |
| `FieldId`, `FieldReference` | string | IRI string. The field family is conveyed by the `fieldKind` discriminant on the surrounding `Field` or `EmbeddedField`; it does not appear on the identifier itself |
| `TemplateId`, `TemplateReference` | string | IRI string |
| `PresentationComponentId`, `PresentationComponentReference` | string | IRI string |
| `TemplateInstanceId` | string | IRI string |
| `Iri` (in property positions where the surrounding context disambiguates) | string | The wrapping `{"kind":"Iri",...}` form is used only where the value position permits ambiguity with non-IRI content; in artifact identifiers, property IRIs, datatype IRIs, etc., the IRI appears as a plain string |

The choice to flatten these productions reflects two facts: each carries a single payload of a JSON-primitive type, and at every site where they appear the surrounding production's property name (or the surrounding production's `kind` and `fieldKind` discriminants) disambiguates them from other strings or numbers.

### 5.2 Lexical-form preservation

Two narrow cases require encoded values that exceed JSON-primitive expressiveness:

- **Big integers.** `NonNegativeInteger` values that exceed JSON Number's safe integer range (`2^53 − 1`) MUST be encoded as JSON strings rather than numbers. A decoder MUST accept both forms. In practice this case does not arise for the model's current use sites (length bounds, cardinality bounds, traversal depths, numeric precision); implementations MAY refuse to encode an out-of-range value.

- **Leading-zero lexical forms.** Where the abstract grammar admits lexical forms whose leading zeros carry semantic information (none currently do), implementations MUST encode such values as strings. This does not apply to integer-valued productions, which carry mathematical values rather than lexical forms.

### 5.3 Tagged productions

Every production not listed in §5.1 is encoded as a tagged JSON object per §4.1.

## 6. Per-Production Encoding

This section defines the JSON encoding of each production category defined in [`grammar.md`](grammar.md). For brevity, families of structurally identical productions (e.g. the eighteen field families) are presented as templates with the family discriminant called out.

### 6.1 Identifiers

Every artifact identifier is encoded as a plain JSON string carrying the IRI. The kind of identifier is communicated by the surrounding context (the property name on the enclosing object, plus the `kind` and where applicable `fieldKind` discriminants of the enclosing artifact).

```json
"https://example.org/fields/title"
```

```json
"https://example.org/templates/demo"
```

```json
"https://example.org/components/intro"
```

```json
"https://example.org/instances/i1"
```

A `FieldId` (or `FieldReference`) appears only in two grammar positions: as `Field.id` and as `EmbeddedField.reference`. Both surrounding constructs carry their own `fieldKind` discriminant, which conveys the field family. The eighteen permitted `fieldKind` values are: `"Text"`, `"Numeric"`, `"Date"`, `"Time"`, `"DateTime"`, `"ControlledTerm"`, `"SingleChoice"`, `"MultipleChoice"`, `"Link"`, `"Email"`, `"PhoneNumber"`, `"Orcid"`, `"Ror"`, `"Doi"`, `"PubMedId"`, `"Rrid"`, `"NihGrantId"`, or `"AttributeValue"`. A conforming encoder MUST ensure that the IRI it places at a `FieldId` position belongs to a field of the family declared by the surrounding `fieldKind`.

### 6.2 Literals

```json
{ "kind": "StringLiteral", "lexicalForm": "Hello" }
```

```json
{ "kind": "LangStringLiteral", "lexicalForm": "Bonjour", "lang": "fr" }
```

```json
{ "kind": "DatatypeIriLiteral", "lexicalForm": "42", "datatype": "http://www.w3.org/2001/XMLSchema#integer" }
```

```json
{ "lexicalForm": "3.14", "datatype": "http://www.w3.org/2001/XMLSchema#double" }
```

```json
{ "lexicalForm": "2024-06-15" }
```

```json
{ "lexicalForm": "10:30:00" }
```

```json
{ "lexicalForm": "2024-06-15T10:30:00" }
```

The `datatype` and `lang` properties carry plain strings (the IRI or BCP 47 tag respectively).

### 6.3 Values

Each `Value` family is encoded as a tagged object. Values that wrap a literal include the literal as a nested tagged object per §6.2.

```json
{ "kind": "TextValue", "literal": { "kind": "StringLiteral", "lexicalForm": "Jane Smith" } }
```

```json
{ "kind": "NumericValue", "literal": { "lexicalForm": "42", "datatype": "http://www.w3.org/2001/XMLSchema#integer" } }
```

```json
{ "kind": "YearValue", "value": "2024" }
```

```json
{ "kind": "YearMonthValue", "value": "2024-06" }
```

```json
{ "kind": "FullDateValue", "literal": { "lexicalForm": "2024-06-15" } }
```

`YearValue` and `YearMonthValue` carry plain string values rather than literals; this matches their grammar definitions.

```json
{ "kind": "ControlledTermValue", "term": "http://example.org/term/1", "label": "Term 1" }
```

The optional `label` property is omitted when absent.

```json
{ "kind": "LiteralChoiceValue", "literal": { "kind": "LangStringLiteral", "lexicalForm": "Professor", "lang": "en" } }
```

```json
{ "kind": "ControlledTermChoiceValue", "value": { "term": "http://example.org/term/1" } }
```

```json
{ "kind": "LinkValue", "iri": "https://example.org/page" }
```

The optional `label` property is omitted when absent.

```json
{ "kind": "EmailValue", "literal": { "lexicalForm": "jane@example.org" } }
```

```json
{ "kind": "PhoneNumberValue", "literal": { "lexicalForm": "+1-415-555-0100" } }
```

External-authority values (`OrcidValue`, `RorValue`, `DoiValue`, `PubMedIdValue`, `RridValue`, `NihGrantIdValue`) follow a uniform shape:

```json
{ "kind": "OrcidValue", "iri": "https://orcid.org/0000-0002-1825-0097", "label": "Jane Smith" }
```

The optional `label` property is omitted when absent.

```json
{ "kind": "AttributeValue", "value": "raw attribute string" }
```

### 6.4 Metadata

```json
{
  "name": "Full Name",
  "description": "Full legal name of the principal investigator.",
  "identifier": "https://example.org/identifiers/full-name",
  "preferredLabel": "Name",
  "altLabels": ["Full Name", "Legal Name"]
}
```

`description`, `identifier`, and `preferredLabel` are omitted when absent. `altLabels` (encoding the grammar's `AlternativeLabel*` sequence) MUST be present as an array (possibly empty).

```json
{
  "createdOn": "2024-01-01T00:00:00Z",
  "createdBy": "https://orcid.org/0000-0002-1825-0097",
  "modifiedOn": "2024-06-15T12:30:00Z",
  "modifiedBy": "https://orcid.org/0000-0002-1825-0097"
}
```

```json
{
  "version": "1.0.0",
  "status": "draft",
  "modelVersion": "2.0.0",
  "previousVersion": "https://example.org/templates/demo/v0.9.0",
  "derivedFrom": "https://example.org/templates/source/v1.0.0"
}
```

`previousVersion` and `derivedFrom` are omitted when absent. `version` and `modelVersion` carry semver strings; `status` is a flat enumeration string per §5.1.

```json
{
  "name": "https://example.org/annotation-properties/notes",
  "value": { "kind": "LiteralAnnotationValue", "literal": { "kind": "StringLiteral", "lexicalForm": "..." } }
}
```

`AnnotationValue` is one of:

```json
{ "kind": "LiteralAnnotationValue", "literal": <Literal> }
```

```json
{ "kind": "IriAnnotationValue", "iri": "https://example.org/some/iri" }
```

Aggregate metadata constructs:

```json
{
  "descriptive": <DescriptiveMetadata>,
  "provenance": <TemporalProvenance>,
  "annotations": [ <Annotation>* ]
}
```

```json
{
  "artifact": <ArtifactMetadata>,
  "versioning": <SchemaVersioning>
}
```

### 6.5 Embedded artifact properties

`EmbeddedArtifactKey` is encoded as a plain JSON string. The string MUST match the ASCII identifier pattern `[A-Za-z][A-Za-z0-9_-]*` (per [`grammar.md`](grammar.md) §Embedded Artifact Key). The grammar's intermediate `KeyIdentifier` wrapper does not appear in the wire form.

```json
"full_name"
```

```json
{ "min": 0, "max": 5 }
```

```json
{ "min": 1 }
```

`max` is omitted when absent. Per [`grammar.md`](grammar.md) §Cardinality, an absent `max` denotes that the cardinality is unbounded above.

```json
{ "label": "Custom Label", "altLabels": ["Alt 1", "Alt 2"] }
```

```json
{ "propertyIri": "https://schema.org/name", "propertyLabel": "name" }
```

`propertyLabel` is omitted when absent.

`ValueRequirement` and `Visibility` are flat enumeration strings:

| Production | Encoded values |
|---|---|
| `ValueRequirement` | `"required"`, `"recommended"`, `"optional"` |
| `Visibility` | `"visible"`, `"hidden"` |

These appear directly as the value of `valueRequirement` and `visibility` properties on `EmbeddedField` and `EmbeddedTemplate` encodings (§6.7).

### 6.6 Field specs

Each concrete `FieldSpec` is encoded as a tagged object whose `"kind"` matches the spec's constructor form. Optional configuration properties are omitted when absent. The encoding is purely structural; no field-spec-specific encoding rules apply beyond the general rules in §4.

```json
{ "kind": "TextFieldSpec", "minLength": 1, "maxLength": 200, "validationRegex": "^[A-Z].*", "renderingHint": "singleLine" }
```

```json
{ "kind": "NumericFieldSpec", "datatype": "integer", "minimum": 0, "maximum": 100, "numericPrecision": 2, "unit": { "label": "kg", "unitIri": "http://qudt.org/vocab/unit/KILOGRAM" } }
```

```json
{ "kind": "DateFieldSpec", "dateValueType": "fullDate", "renderingHint": { "componentOrder": "dayMonthYear" } }
```

```json
{ "kind": "LiteralSingleChoiceFieldSpec", "options": [ {"literal": {"kind":"LangStringLiteral", "lexicalForm": "Yes", "lang": "en"}, "default": true} ] }
```

```json
{ "kind": "ControlledTermFieldSpec", "sources": [ <ControlledTermSource>+ ], "displayHint": { "labelLanguage": "en" }, "maxTraversalDepth": 3 }
```

The `default` property on choice options is encoded as a JSON `true` when set; the property is omitted otherwise.

### 6.7 Field artifacts and embedded artifacts

A `Field` artifact:

```json
{
  "kind": "Field",
  "fieldKind": "Text",
  "id": <FieldId>,
  "metadata": <SchemaArtifactMetadata>,
  "fieldSpec": <FieldSpec>
}
```

The `"fieldKind"` discriminant MUST match the family of the nested `fieldSpec`. Conforming encoders MUST ensure that the IRI placed at `id` belongs to a field of the same family.

An `EmbeddedField`:

```json
{
  "kind": "EmbeddedField",
  "fieldKind": "Text",
  "key": <EmbeddedArtifactKey>,
  "reference": <FieldId>,
  "valueRequirement": "required",
  "cardinality": <Cardinality>,
  "visibility": "visible",
  "defaultValue": <DefaultValue>,
  "labelOverride": <LabelOverride>,
  "property": <Property>
}
```

All properties except `kind`, `fieldKind`, `key`, and `reference` are optional and MUST be omitted when absent.

`EmbeddedField` for `fieldKind: "attribute_value"` MUST NOT carry a `defaultValue` property (per [`grammar.md`](grammar.md) §Embedded Artifacts).

```json
{
  "kind": "EmbeddedTemplate",
  "key": <EmbeddedArtifactKey>,
  "reference": <TemplateId>,
  "valueRequirement": "required",
  "cardinality": <Cardinality>,
  "visibility": "visible",
  "labelOverride": <LabelOverride>,
  "property": <Property>
}
```

```json
{
  "kind": "EmbeddedPresentationComponent",
  "key": <EmbeddedArtifactKey>,
  "reference": <PresentationComponentId>,
  "visibility": "hidden",
  "labelOverride": <LabelOverride>
}
```

### 6.8 Default values

Each concrete `DefaultValue` family is encoded as a tagged object wrapping a `Value`:

```json
{ "kind": "TextDefaultValue", "value": <TextValue> }
```

```json
{ "kind": "ChoiceDefaultValue", "values": [ <ChoiceValue>+ ] }
```

`ChoiceDefaultValue` carries an array because the grammar specifies `ChoiceValue+`. All other default-value families wrap a single `Value`.

The encoding is uniform across all sixteen non-attribute-value default-value families.

### 6.9 Templates

```json
{
  "kind": "Template",
  "id": <TemplateId>,
  "metadata": <SchemaArtifactMetadata>,
  "header": "Template Header Text",
  "footer": "Template Footer Text",
  "embedded": [ <EmbeddedArtifact>* ]
}
```

`header` and `footer` are omitted when absent.

The `embedded` array MUST preserve order (per [`grammar.md`](grammar.md) §Embedded Artifacts).

The `EmbeddedArtifactKey` values within `embedded` MUST be unique (per [`grammar.md`](grammar.md) §Embedded Artifact Key); a conforming encoder MUST verify uniqueness before producing the JSON, and a conforming decoder MUST reject input that violates this constraint.

### 6.10 Presentation components

```json
{ "kind": "RichTextComponent", "id": <PresentationComponentId>, "metadata": <ArtifactMetadata>, "html": "<p>Hello</p>" }
```

```json
{ "kind": "ImageComponent", "id": <PresentationComponentId>, "metadata": <ArtifactMetadata>, "image": "https://example.org/image.png" }
```

```json
{ "kind": "YoutubeVideoComponent", "id": <PresentationComponentId>, "metadata": <ArtifactMetadata>, "video": "https://youtu.be/dQw4w9WgXcQ" }
```

```json
{ "kind": "SectionBreakComponent", "id": <PresentationComponentId>, "metadata": <ArtifactMetadata> }
```

```json
{ "kind": "PageBreakComponent", "id": <PresentationComponentId>, "metadata": <ArtifactMetadata> }
```

### 6.11 Instances

```json
{
  "kind": "TemplateInstance",
  "id": <TemplateInstanceId>,
  "metadata": <ArtifactMetadata>,
  "templateRef": <TemplateId>,
  "values": [ <InstanceValue>* ]
}
```

`TemplateInstance.metadata` MUST be `ArtifactMetadata` (not `SchemaArtifactMetadata`); instances do not carry schema versioning.

```json
{
  "kind": "FieldValue",
  "key": <EmbeddedArtifactKey>,
  "values": [ <Value>+ ]
}
```

`FieldValue.values` MUST be a non-empty array (per [`grammar.md`](grammar.md) §Instances; absence of a value is represented by omitting the `FieldValue` entirely).

```json
{
  "kind": "NestedTemplateInstance",
  "key": <EmbeddedArtifactKey>,
  "values": [ <InstanceValue>* ]
}
```

`InstanceValue.values` for a `NestedTemplateInstance` MAY be empty.

The `values` array of a `TemplateInstance` MUST satisfy the structural invariants defined in [`grammar.md`](grammar.md) §Instances: a given `EmbeddedArtifactKey` appears as the `key` of at most one `FieldValue`; a given `EmbeddedArtifactKey` does not appear as the `key` of both a `FieldValue` and a `NestedTemplateInstance`; multiple `NestedTemplateInstance` entries sharing a `key` are permitted.

## 7. Round-Tripping

A conforming encode-decode round-trip MUST preserve:

- Every component value of every abstract construct, including lexical content of literals and IRI strings.
- The order of every sequence component (`*` and `+`).
- The presence-or-absence of every optional component.

A conforming encode-decode round-trip MAY NOT preserve:

- JSON object property order within a single tagged object.
- Whitespace between JSON tokens.
- Implementation-specific properties beginning with `_` or `$` per §4.8 (these are explicitly outside the conformance contract).

Two conforming JSON documents that differ only in JSON object property order or non-significant whitespace MUST decode to the same abstract construct.

## 8. Examples

### 8.1 A minimal `Template`

```json
{
  "kind": "Template",
  "id": "https://example.org/templates/empty",
  "metadata": {
    "artifact": {
      "descriptive": { "name": "Empty", "altLabels": [] },
      "provenance": {
        "createdOn": "2024-01-01T00:00:00Z",
        "createdBy": "https://example.org/u",
        "modifiedOn": "2024-01-01T00:00:00Z",
        "modifiedBy": "https://example.org/u"
      },
      "annotations": []
    },
    "versioning": {
      "version": "1.0.0",
      "status": "draft",
      "modelVersion": "2.0.0"
    }
  },
  "embedded": []
}
```

### 8.2 A `Template` with one embedded text field

```json
{
  "kind": "Template",
  "id": "https://example.org/templates/note",
  "metadata": { "artifact": "...", "versioning": "..." },
  "embedded": [
    {
      "kind": "EmbeddedField",
      "fieldKind": "Text",
      "key": "title",
      "reference": "https://example.org/fields/title",
      "valueRequirement": "required",
      "property": { "propertyIri": "https://schema.org/name" }
    }
  ]
}
```

### 8.3 A `TemplateInstance` for the above template

```json
{
  "kind": "TemplateInstance",
  "id": "https://example.org/instances/i1",
  "metadata": { "descriptive": "...", "provenance": "...", "annotations": [] },
  "templateRef": "https://example.org/templates/note",
  "values": [
    {
      "kind": "FieldValue",
      "key": "title",
      "values": [
        { "kind": "TextValue", "literal": { "kind": "StringLiteral", "lexicalForm": "First Note" } }
      ]
    }
  ]
}
```

## 9. Reserved Property Names

The property names `kind` and `fieldKind` are reserved by this specification at all object-level positions. Implementations MUST NOT reuse these names for non-normative purposes.

The property name prefixes `_` and `$` are reserved for implementation-specific extensions per §4.8.

All other property names are scoped to their containing tagged object's production and have no global meaning.

## 10. Versioning

This document defines version 1.0 of the JSON serialization. The version of the wire format itself is not encoded in conforming JSON documents; it is the responsibility of the surrounding storage or transport layer (file path conventions, MIME parameters, registry metadata, etc.) to communicate which version of this specification a document conforms to.

A future revision of this document MAY add new productions or new tagged-object kinds without a version bump, provided existing conforming documents remain conforming. A revision that changes the encoding of an existing production, removes a production, or changes the meaning of a property MUST bump the version.

## 11. Open Questions

- Should this document define an explicit version-discrimination property (e.g. `"$schema"`) at the root of every conforming document, parallel to the JSON Schema convention?
- Should the wrapping principle in §5 be made into a normative algorithm rather than a checklist of properties?
- Should the encoding distinguish "absent optional component" from "present optional component with the default value" in productions that carry defaults (e.g. `ValueRequirement`)? Current rule: omit if absent; encode the default when explicitly present. This may need to be made unambiguous per production.
- Should `NonNegativeInteger` use a string encoding even within the safe-integer range, to make the wire format consistent across implementations whose host language has no JSON-Number-like type?
