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

The literal and IRI encodings defined below are structurally similar to JSON-LD's term forms — `value`/`lang`/`datatype` parallels JSON-LD's `@value`/`@language`/`@type`, and `iri` parallels `@id`. This similarity is deliberate: the property-set shape JSON-LD landed on is genuinely well-suited to RDF-flavored data, and adopting that shape (without the `@` prefix) yields a clean, future-proof encoding for literal and resource values.

Conforming documents are nevertheless **not** JSON-LD. They carry no `@context`, are not interpretable as RDF graphs without external schema knowledge, and do not follow JSON-LD's compaction, expansion, or framing algorithms. RDF-graph interoperability for CEDAR artifacts, when needed, is the subject of a future separate document (`json-ld-mapping.md`, planned) that will define a JSON-LD encoding parallel to (and convertible to/from) the native form defined here, in the same way `ctm-1.6.0-serialization.md` defines the legacy mapping.

### 1.3 Scope

In scope:

- The JSON encoding rules (property naming, NFC normalisation, integer handling) that frame the shapes formally defined in [`wire-grammar.md`](wire-grammar.md).
- Discriminator placement (the `kind` / `fieldKind` / property-set / position rules).
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

Examples may use *placeholders* of the form `<ProductionName>` to denote the JSON encoding of a production at the surrounding position. A placeholder is resolved by replacing it with the encoding defined for that production in [`wire-grammar.md`](wire-grammar.md). The `*` and `+` suffixes (e.g. `<Annotation>*`, `<ChoiceValue>+`) denote sequences per §4.4 — zero-or-more and one-or-more respectively.

## 4. General Encoding Rules

### 4.1 Tagged and untagged objects

JSON objects in the wire format are either *tagged* — carrying a `"kind"` property — or *untagged* — without `"kind"`. Whether an object is tagged is determined by the position it occupies in the document; see §4.5 for the rule.

When an object is tagged, the value of `"kind"` MUST be the production name from [`grammar.md`](grammar.md), transcribed in `UpperCamelCase` exactly as the grammar names it. For example, `"TextValue"` for the `TextValue` production. The grammar's `lower_snake_case` constructor forms (e.g. `text_value(...)`) describe abstract composition and do not appear on the wire.

For the eighteen `Field` and eighteen `EmbeddedField` family productions, two discriminators appear together: the outer `"kind"` (`"Field"` or `"EmbeddedField"`) and an inner `"fieldKind"` (`"Text"`, `"Numeric"`, …) that selects the family. See §4.5.

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

**Polymorphic positions** — those at which the grammar admits a union of productions, e.g. `EmbeddedArtifact ::= EmbeddedField | EmbeddedTemplate | EmbeddedPresentationComponent` — MUST encode each alternative as a tagged JSON object carrying `"kind"` per §4.1, except for the property-set-discriminated unions noted below. The document root is itself a polymorphic position (any artifact may appear there); a JSON document at the root therefore carries `"kind"`.

**Singleton positions** — those at which the grammar admits exactly one production — MUST encode that production as an untagged JSON object whose properties correspond to the production's components. The enclosing object's property name, together with the grammar, fully determines the production at this position; a `"kind"` property MUST NOT appear.

This rule applies recursively: an untagged object at a singleton position whose own components include further composite objects follows the same rule for each of those components.

#### Property-set-discriminated unions

A small set of polymorphic unions is discriminated **by the combination of property names present** rather than by an explicit `"kind"` value. This is permitted only when the union's alternatives have structurally distinct property sets that cannot collide. The unions encoded this way are:

- `Literal` (`StringLiteral | LangStringLiteral | DatatypeIriLiteral`): discriminated by `value`, `lang`, and `datatype` presence.
- `TextLiteral` (`StringLiteral | LangStringLiteral`): discriminated by `lang` presence.
- `AnnotationValue` (`Literal | Iri`): discriminated by `value` (literal arms) vs `iri` only (Iri arm).

Future unions that would admit variants with overlapping property sets MUST use `"kind"` discrimination instead.

A conforming decoder at a property-set-discriminated position MUST resolve the variant by exact match on the property set:

1. The encoded object's set of property names MUST equal the property set of exactly one variant — every required property of that variant present, no property absent that the variant requires, and no property present that the variant does not list (required or optional).
2. If the encoded object's property set matches no variant exactly, the decoder MUST reject the document.
3. If the encoded object's property set matches more than one variant — for example, a `Literal` position carrying `{"value":"x","lang":"en","datatype":"…"}` (which simultaneously fits no single variant cleanly because `lang` and `datatype` MUST NOT both be present, and the same combination cannot match `LangStringLiteral` and `DatatypeIriLiteral` together) — the decoder MUST reject the document.

Conforming encoders, by construction, never emit objects matching either the no-match or multi-match conditions, because every abstract construct corresponds to exactly one variant.

#### Position-discriminated unions

A few unions occupy fixed singleton positions where the surrounding property name fully determines the variant. For example, `RenderingHint` is determined by which `FieldSpec` family the parent is, and the four typed-literal subtypes (`NumericLiteral`, `FullDateLiteral`, `TimeLiteral`, `DateTimeLiteral`) are determined by their parent value's `kind`. These wire entries are flagged `// discriminator: position` in [`wire-grammar.md`](wire-grammar.md).

Implementations MUST NOT rely on JSON property ordering to discriminate alternatives.

### 4.5 String values

Strings are JSON strings encoded in UTF-8. Lexical-form strings (e.g. the `value` property of a `StringLiteral`) MUST be transmitted in Unicode Normalization Form C (NFC). A conforming implementation SHOULD normalize on encode.

### 4.6 Number values

Integer-valued grammar productions (e.g. `NonNegativeInteger`) are encoded as JSON numbers without a fractional part or exponent. Implementations MUST encode integer values that fit within JSON Number's safe integer range without loss; values outside that range MUST be encoded as strings (see §5.2 below for the cases this applies to).

Decimal-valued grammar productions are encoded as JSON numbers in standard decimal notation per RFC 8259.

### 4.7 Implementation freedom

A conforming implementation MAY add JSON properties beyond those defined here for non-normative purposes (annotations, hashes, signatures, etc.), provided those properties begin with `_` or `$` to avoid collision with future normative additions. Decoders MUST ignore such properties.

A conforming implementation MAY emit JSON object properties in any order; the wire format is order-independent at the object level.

## 5. The Wrapping Principle

The grammar uses constructor forms uniformly to define every production, including productions that consist of a single component of a primitive type. For example:

```ebnf
Header ::= header( MultilingualString )
NonNegativeInteger ::= non_negative_integer( IntegerLexicalForm )
KeyIdentifier ::= key_identifier( AsciiIdentifier )
```

A literal translation would encode each such production as a tagged JSON object with a single payload property. This document does not require that. Instead, the wrapping principle applies:

> A production is encoded as a tagged JSON object only when wrapping carries information beyond the production's payload. Otherwise, the production is encoded as the JSON value of its single component, and the production's identity is communicated by the property name in the enclosing object.

A production carries information beyond its payload, and so MUST be encoded as a tagged object, when at least one of the following holds:

- **(a) Composite structure.** The production has more than one named component (e.g. `Cardinality`, `Property`, `LabelOverride`, every `Value` family).

- **(b) Discriminated union membership.** The production participates in a union where alternatives must be distinguished at decode time (e.g. `Value`, every artifact's `kind`, the eighteen `Field` family variants). The discriminator is `"kind"` by default, with a small set of property-set-discriminated unions per §4.4.

- **(c) Lexical-form preservation.** The production carries lexical content whose preservation requires more than a JSON primitive can express (e.g. `LangStringLiteral` carries a lexical form *and* a language tag; both must be present in the wire form).

A production that satisfies none of these is encoded *flat*: the JSON value at the corresponding property position in the enclosing object is the JSON encoding of the production's single component, with no `"kind"` wrapper.

The full list of productions that collapse this way is given in §1.7 of [`wire-grammar.md`](wire-grammar.md). At a glance:

- All `MultilingualString`-typed wrappers (`Header`, `Footer`, `Name`, `Description`, `PreferredLabel`, `AlternativeLabel`, `Label`, `PropertyLabel`, `OntologyName`, `RootTermLabel`, `ValueSetName`) flatten to a JSON array of `LangString` entries.
- All single-`Iri` wrappers (artifact identifiers and references, `PropertyIri`, the typed external-authority IRIs, `OntologyIri`, etc.) flatten to a plain JSON string.
- All single-`NonNegativeInteger` wrappers (`MinLength`, `MaxLength`, `MinCardinality`, `MaxCardinality`, `NumericPrecision`, `MaxTraversalDepth`) flatten to a plain JSON number.
- Plain-`string` wrappers (`Identifier`, `Notation`, `LinkLabel`, `OntologyAcronym`, `ValueSetIdentifier`, `HtmlContent`) flatten to a plain JSON string.
- Enum-style productions (`Status`, `ValueRequirement`, `Visibility`, `DateValueType`, `TimePrecision`, `DateTimeValueType`, `TimezoneRequirement`, `DateComponentOrder`, `TimeFormat`, `TextRenderingHint`, `SingleChoiceRenderingHint`, `MultipleChoiceRenderingHint`, `NumericRenderingHint`) flatten to a JSON string drawn from a fixed set.

### 5.1 Lexical-form preservation

Two narrow cases require encoded values that exceed JSON-primitive expressiveness:

- **Big integers.** `NonNegativeInteger` values that exceed JSON Number's safe integer range (`2^53 − 1`) MUST be encoded as JSON strings rather than numbers. A decoder MUST accept both forms. In practice this case does not arise for the model's current use sites (length bounds, cardinality bounds, traversal depths, numeric precision); implementations MAY refuse to encode an out-of-range value.

- **Leading-zero lexical forms.** Where the abstract grammar admits lexical forms whose leading zeros carry semantic information (none currently do), implementations MUST encode such values as strings. This does not apply to integer-valued productions, which carry mathematical values rather than lexical forms.

## 6. Per-Production Encoding (Examples)

Detailed wire shapes for every production are normatively specified in [`wire-grammar.md`](wire-grammar.md). This section gives illustrative JSON examples — one per family of related productions — and documents only those JSON-encoding-specific rules that aren't expressible in the wire-grammar notation.

### 6.1 Identifiers

Every artifact identifier is encoded as a plain JSON string carrying the IRI. The kind of identifier is communicated by the surrounding context (the property name on the enclosing object, plus the `kind` and where applicable `fieldKind` discriminators of the enclosing artifact).

```json
"https://example.org/fields/title"
```

A `FieldId` (or `FieldReference`) appears only in two grammar positions: as `Field.id` and as `EmbeddedField.reference`. Both surrounding constructs carry their own `fieldKind` discriminator, which conveys the field family. The eighteen permitted `fieldKind` values are: `"Text"`, `"Numeric"`, `"Date"`, `"Time"`, `"DateTime"`, `"ControlledTerm"`, `"SingleChoice"`, `"MultipleChoice"`, `"Link"`, `"Email"`, `"PhoneNumber"`, `"Orcid"`, `"Ror"`, `"Doi"`, `"PubMedId"`, `"Rrid"`, `"NihGrantId"`, or `"AttributeValue"`. A conforming encoder MUST ensure that the IRI it places at a `FieldId` position belongs to a field of the family declared by the surrounding `fieldKind`.

### 6.2 Literals

Literals are encoded as JSON objects whose **set of properties** identifies the literal variant. There is no `"kind"` discriminator for literals; the combination of properties present (`value`, `lang`, `datatype`) determines the literal type unambiguously.

```json
{ "value": "Hello" }
```
```json
{ "value": "Bonjour", "lang": "fr" }
```
```json
{ "value": "42", "datatype": "http://www.w3.org/2001/XMLSchema#integer" }
```

`lang` and `datatype` MUST NOT both be present.

The four specialized typed-literal subtypes (`NumericLiteral`, `FullDateLiteral`, `TimeLiteral`, `DateTimeLiteral`) appear only at singleton positions in the grammar; per §4.4 the position determines the type, so the `datatype` property MAY be omitted and is reconstructed at decode time from the surrounding context. A conforming encoder MAY include the canonical `datatype` IRI for clarity; a conforming decoder MUST accept either form.

### 6.3 Multilingual strings

A `MultilingualString` is encoded as a non-empty JSON array of untagged `LangString` objects. There is no `kind` discriminator: `MultilingualString` appears only at singleton positions, and `LangString` appears only as an entry of a `MultilingualString` array.

```json
[{ "value": "Hello", "lang": "en" }, { "value": "Bonjour", "lang": "fr" }]
```

The BCP 47 `'und'` (undetermined) subtag MAY be used when the natural language is unspecified.

`MultilingualString` and `LangStringLiteral` (§6.2) share the `{value, lang}` entry shape but are structurally distinct: a `LangStringLiteral` is a *single* language-tagged literal (one JSON object), whereas a `MultilingualString` is an *array* of one or more such pairs. Encoders MUST NOT collapse a single-entry `MultilingualString` into a bare `LangStringLiteral` object, and decoders MUST NOT promote a `LangStringLiteral` object into a `MultilingualString` array.

### 6.4 Values

Each `Value` family is encoded as a tagged object. The full set of variants is given in [`wire-grammar.md`](wire-grammar.md) §4.

```json
{ "kind": "TextValue", "literal": { "value": "Jane Smith" } }
```
```json
{ "kind": "NumericValue", "literal": { "value": "42", "datatype": "http://www.w3.org/2001/XMLSchema#integer" } }
```
```json
{ "kind": "YearValue", "value": "2024" }
```
```json
{ "kind": "FullDateValue", "literal": { "value": "2024-06-15" } }
```
```json
{ "kind": "ControlledTermValue", "term": "http://example.org/term/1", "label": [{ "value": "Term 1", "lang": "en" }] }
```
```json
{ "kind": "LiteralChoiceValue", "literal": { "value": "Professor", "lang": "en" } }
```
```json
{ "kind": "LinkValue", "iri": "https://example.org/page" }
```
```json
{ "kind": "OrcidValue", "iri": "https://orcid.org/0000-0002-1825-0097", "label": [{ "value": "Jane Smith", "lang": "en" }] }
```
```json
{ "kind": "AttributeValue", "name": "color", "value": { "kind": "TextValue", "literal": { "value": "blue" } } }
```

### 6.5 Metadata and annotations

`DescriptiveMetadata`, `TemporalProvenance`, `SchemaVersioning`, `ArtifactMetadata`, and `SchemaArtifactMetadata` each appear at a fixed singleton position and are encoded as untagged JSON objects.

```json
{
  "descriptiveMetadata": {
    "name": [{ "value": "Full Name", "lang": "en" }],
    "description": [{ "value": "Full legal name.", "lang": "en" }],
    "preferredLabel": [{ "value": "Name", "lang": "en" }],
    "altLabels": []
  },
  "provenance": {
    "createdOn": "2024-01-01T00:00:00Z",
    "createdBy": "https://orcid.org/0000-0002-1825-0097",
    "modifiedOn": "2024-06-15T12:30:00Z",
    "modifiedBy": "https://orcid.org/0000-0002-1825-0097"
  },
  "annotations": [
    {
      "property": "https://example.org/annotation-properties/notes",
      "body": { "value": "An institutional note." }
    }
  ]
}
```

`AnnotationValue` is a property-set-discriminated polymorphic union (`Literal | Iri`). The literal arms carry `value` (and optionally `lang` or `datatype`); the IRI arm carries `iri` only:

```json
{ "iri": "https://example.org/related-resource" }
```

The wire-form property name on `Annotation` is `body` (for the grammar's `AnnotationValue` component) — chosen to avoid the visual collision that a `value`/`value` nesting would create with the literal's `value` property. The naming follows the W3C Web Annotations convention.

### 6.6 Embedded artifact properties

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

### 6.7 Field specs

Each concrete `FieldSpec` is encoded as a tagged object whose `"kind"` matches the spec's grammar production name. Optional configuration properties are omitted when absent.

```json
{ "kind": "TextFieldSpec", "minLength": 1, "maxLength": 200, "renderingHint": "singleLine" }
```
```json
{ "kind": "NumericFieldSpec", "datatype": "integer", "minValue": { "kind": "NumericValue", "literal": { "value": "0" } } }
```
```json
{ "kind": "DateFieldSpec", "dateValueType": "fullDate", "renderingHint": { "componentOrder": "dayMonthYear" } }
```
```json
{ "kind": "LiteralSingleChoiceFieldSpec", "options": [{ "literal": { "value": "Yes", "lang": "en" }, "default": true }] }
```
```json
{ "kind": "ControlledTermFieldSpec", "sources": [
  { "kind": "OntologySource", "ontology": { "iri": "http://purl.obolibrary.org/obo/ncit.owl",
    "displayHint": { "acronym": "NCIT", "name": [{ "value": "NCI Thesaurus", "lang": "en" }] } } }
] }
```

The `default` property on choice options is encoded as JSON `true` when set; the property is omitted otherwise. An `OntologyDisplayHint` MUST carry at least one of `acronym` or `name` (a constraint enforced by `wire-grammar.md`).

The flat-string rendering hints (`TextRenderingHint`, `SingleChoiceRenderingHint`, `MultipleChoiceRenderingHint`, `NumericRenderingHint`) appear directly as JSON enum strings; the temporal rendering hints (`DateRenderingHint`, `TimeRenderingHint`, `DateTimeRenderingHint`) are JSON objects.

### 6.8 Field artifacts and embedded artifacts

A `Field` artifact:

```json
{
  "kind": "Field",
  "fieldKind": "Text",
  "id": "<FieldId>",
  "metadata": "<SchemaArtifactMetadata>",
  "fieldSpec": "<FieldSpec>"
}
```

The `"fieldKind"` discriminant MUST match the family of the nested `fieldSpec`. Conforming encoders MUST ensure that the IRI placed at `id` belongs to a field of the same family.

An `EmbeddedField`:

```json
{
  "kind": "EmbeddedField",
  "fieldKind": "Text",
  "key": "<EmbeddedArtifactKey>",
  "reference": "<FieldId>",
  "valueRequirement": "required",
  "cardinality": { "min": 1, "max": 1 },
  "property": { "iri": "https://schema.org/name" }
}
```

`EmbeddedField` for `fieldKind: "AttributeValue"` MUST NOT carry a `defaultValue` property.

```json
{
  "kind": "EmbeddedTemplate",
  "key": "<EmbeddedArtifactKey>",
  "reference": "<TemplateId>",
  "cardinality": { "min": 0 }
}
```

```json
{
  "kind": "EmbeddedPresentationComponent",
  "key": "<EmbeddedArtifactKey>",
  "reference": "<PresentationComponentId>",
  "visibility": "visible"
}
```

### 6.9 Default values

Each concrete `DefaultValue` family is encoded as a tagged object wrapping a `Value`:

```json
{ "kind": "TextDefaultValue", "value": { "kind": "TextValue", "literal": { "value": "Hello" } } }
```
```json
{ "kind": "ChoiceDefaultValue", "values": [
  { "kind": "LiteralChoiceValue", "literal": { "value": "Yes", "lang": "en" } }
] }
```

`ChoiceDefaultValue` carries an array because the grammar specifies `ChoiceValue+`; all other default-value families wrap a single `Value`.

### 6.10 Templates

```json
{
  "kind": "Template",
  "id": "<TemplateId>",
  "metadata": "<SchemaArtifactMetadata>",
  "header": [{ "value": "Template Header Text", "lang": "en" }],
  "embedded": ["<EmbeddedArtifact>*"]
}
```

The `embedded` array MUST preserve order. The `EmbeddedArtifactKey` values within `embedded` MUST be unique; a conforming encoder MUST verify uniqueness before producing the JSON, and a conforming decoder MUST reject input that violates this constraint.

### 6.11 Presentation components

```json
{ "kind": "RichTextComponent", "id": "<PresentationComponentId>", "metadata": "<ArtifactMetadata>", "html": "<p>Hello</p>" }
```
```json
{ "kind": "ImageComponent", "id": "<PresentationComponentId>", "metadata": "<ArtifactMetadata>", "image": "https://example.org/image.png" }
```
```json
{ "kind": "SectionBreakComponent", "id": "<PresentationComponentId>", "metadata": "<ArtifactMetadata>" }
```

### 6.12 Instances

```json
{
  "kind": "TemplateInstance",
  "id": "<TemplateInstanceId>",
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

The `name` property below is a `MultilingualString` (§6.3): an array of `{value, lang}` entries, one per language. A single-language artifact uses a single-element array. The same shape applies to `description`, `preferredLabel`, each entry of `altLabels`, the `Template`'s `header` and `footer`, controlled-term labels, unit labels, and any other human-display text.

```json
{
  "kind": "Template",
  "id": "https://example.org/templates/empty",
  "metadata": {
    "artifact": {
      "descriptiveMetadata": {
        "name": [{ "value": "Empty", "lang": "en" }],
        "altLabels": []
      },
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
  "metadata": { "descriptiveMetadata": "...", "provenance": "...", "annotations": [] },
  "templateRef": "https://example.org/templates/note",
  "values": [
    {
      "kind": "FieldValue",
      "key": "title",
      "values": [
        { "kind": "TextValue", "literal": { "value": "First Note" } }
      ]
    }
  ]
}
```

## 9. Reserved Property Names

The property names `kind` and `fieldKind` are reserved by this specification at all object-level positions. Implementations MUST NOT reuse these names for non-normative purposes.

The property name prefixes `_` and `$` are reserved for implementation-specific extensions per §4.7.

All other property names are scoped to their containing tagged object's production and have no global meaning.

## 10. Versioning

This document defines version 1.0 of the JSON serialization. The version of the wire format itself is not encoded in conforming JSON documents; it is the responsibility of the surrounding storage or transport layer (file path conventions, MIME parameters, registry metadata, etc.) to communicate which version of this specification a document conforms to.

A future revision of this document MAY add new productions or new tagged-object kinds without a version bump, provided existing conforming documents remain conforming. A revision that changes the encoding of an existing production, removes a production, or changes the meaning of a property MUST bump the version.

## 11. Open Questions

- Should this document define an explicit version-discrimination property (e.g. `"$schema"`) at the root of every conforming document, parallel to the JSON Schema convention?
- Should the wrapping principle in §5 be made into a normative algorithm rather than a checklist of properties?
- Should the encoding distinguish "absent optional component" from "present optional component with the default value" in productions that carry defaults (e.g. `ValueRequirement`)? Current rule: omit if absent; encode the default when explicitly present. This may need to be made unambiguous per production.
- Should `NonNegativeInteger` use a string encoding even within the safe-integer range, to make the wire format consistent across implementations whose host language has no JSON-Number-like type?
