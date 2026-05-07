# Cedar Wire Grammar

This file is a formal, JSON-shaped grammar that mirrors `grammar.md`
production-for-production. It is the source of truth for the wire shape
of every abstract grammar production. `serialization.md` is its
companion: it carries the encoding philosophy, JSON-specific rules
(property naming, NFC normalisation, etc.), worked examples, and
cross-references, but does not duplicate per-production shape
information.

For every `XxxYyy ::=` in `grammar.md` there is exactly one
`XxxYyy :::` in this file, and vice versa.

## 1. Notation

Each line takes one of two forms:

```
production_name ::: type-expression
production_name ::: type-expression
  // inline constraints on this production
```

(The placeholder `production_name` is shown in `lower_snake_case` here
purely to keep it out of the formal-production count; real wire
productions use `UpperCamelCase`.) The `:::` separator (three colons)
distinguishes a wire-format production from an abstract grammar
production (`::=` in `grammar.md`). A wire production names the JSON
shape that encodes the corresponding abstract production.

### 1.1 Type expressions

| Form                              | Meaning                                                |
|---|---|
| `string`, `number`, `boolean`, `null` | The corresponding JSON primitive.                |
| `"literal"`                       | A string-literal type — the JSON value MUST equal the literal. Used for `kind` discriminators. |
| `ProductionName`                  | Reference to another wire production.                  |
| `array<T>`                        | A JSON array; each element is `T`.                     |
| `nonEmptyArray<T>`                | An array of `T` with at least one element.             |
| `object { … }`                    | A JSON object. Property syntax in §1.2.                |
| `T \| U`                          | A union. Discrimination strategy is documented inline (see §1.3). |

### 1.2 Object property syntax

Within `object { … }`:

```
property: Type        // required
property?: Type       // optional; encoded only when present
"property": "literal" // a fixed string-literal value (used for kind)
```

Property order in the notation is informational. JSON does not preserve
key order, and conforming encoders MAY emit properties in any order
unless an inline constraint says otherwise (no current production
requires a specific order).

### 1.3 Unions

```
some_union ::: A | B | C
  // discriminator: kind
```

(Placeholder shown in `lower_snake_case` for the same reason as §1.1.)

Three discrimination strategies are recognised, declared inline:

- `discriminator: kind` — every member is an object production whose
  shape includes a `kind: "MemberName"` literal property. Decoders pick
  the variant by reading `kind`.
- `discriminator: property-set` — members are distinguished by which
  properties are present on the encoded object. Used where members are
  structurally disjoint and a `kind` discriminator would be redundant
  (currently `AnnotationValue`).
- `discriminator: position` — members are distinguished by the
  enclosing property name and the surrounding context, not by anything
  on the encoded object itself. Used at singleton positions where the
  abstract grammar admits exactly one production at the property.

If no discriminator is declared, `kind` is the default.

### 1.4 Inline constraints

Constraints that cannot be expressed in the type expression appear as
single-line `//`-prefixed comments immediately below the production:

```
MultilingualString ::: nonEmptyArray<LangString>
  // lang tags MUST be unique within the array (case-folded)
```

Constraints are normative.

### 1.5 The polymorphic-only kind rule

`kind: "X"` appears on a wire object only when that object is a member
of a discriminated union encoded with `discriminator: kind`. At
singleton positions (where the enclosing property name fixes the
production unambiguously), the production is encoded as a plain
`object { … }` with no `kind` property. This applies to productions
such as `Cardinality`, `Property`, `LabelOverride`,
`SchemaArtifactMetadata`, `ArtifactMetadata`, `LifecycleMetadata`,
`SchemaArtifactVersioning`, `Annotation`, `Unit`, `OntologyReference`,
`OntologyDisplayHint`, `ControlledTermClass`, `PermissibleValue`,
`Meaning`, and the temporal `RenderingHint` variants.

The rule also applies at the `EmbeddedXxxField.defaultValue` slot: when
that slot is typed as a kind-tagged `Value` production
(`ControlledTermValue`, `EnumValue`, `LinkValue`, or one of the six
external-authority value types: `OrcidValue`, `RorValue`, `DoiValue`,
`PubMedIdValue`, `RridValue`, `NihGrantIdValue`), the family is fixed
by the enclosing `EmbeddedXxxField.kind`, so the inner `kind` property
is dropped on the wire and reconstructed at decode time. Where the
`defaultValue` slot is itself a polymorphic union (`DateValue`), the
inner `kind` is retained as it is required to discriminate the union
arms.

**Worked examples.** Three cases illustrate the rule.

*Case 1 — kind dropped (singleton position, family fixed).*
`ControlledTermValue` is a kind-tagged production. As a member of the
`Value` union (which uses `discriminator: kind`), it carries its
`kind`:

```json
{
  "kind": "ControlledTermValue",
  "term": "http://example.org/term/1",
  "label": [{ "value": "Example", "lang": "en" }]
}
```

At the `defaultValue` slot of an `EmbeddedControlledTermField`, the
surrounding embedding's `"kind": "EmbeddedControlledTermField"` already
fixes the value family. The inner `kind` is dropped:

```json
{
  "kind": "EmbeddedControlledTermField",
  "key": "topic",
  "artifactRef": "https://example.org/fields/topic",
  "defaultValue": {
    "term": "http://example.org/term/1",
    "label": [{ "value": "Example", "lang": "en" }]
  }
}
```

*Case 2 — kind retained (singleton position, slot still polymorphic).*
`DateValue` is *itself* a discriminated union of `YearValue`,
`YearMonthValue`, and `FullDateValue`. When it appears at the
`defaultValue` slot of an `EmbeddedDateField`, the enclosing embedding
fixes that the value is a `DateValue` — but does not fix which arm.
The inner `kind` is therefore retained:

```json
{
  "kind": "EmbeddedDateField",
  "key": "born",
  "artifactRef": "https://example.org/fields/born",
  "defaultValue": {
    "kind": "FullDateValue",
    "value": "1990-06-15"
  }
}
```

*Case 3 — never tagged (singleton-only production).* `Cardinality` is
not a member of any `discriminator: kind` union — it appears only at
singleton positions (e.g. `EmbeddedField.cardinality`,
`EmbeddedTemplate.cardinality`). Its wire form never carries `kind`:

```json
{
  "kind": "EmbeddedTextField",
  "key": "alias",
  "artifactRef": "https://example.org/fields/alias",
  "cardinality": { "min": 0, "max": 3 }
}
```

The polymorphic-only rule constrains the **wire form**, not the
**in-memory form** of any host-language binding. Bindings MAY carry
synthetic `kind` (or any other) discriminator fields on their
in-memory representations of singleton-position productions for
runtime introspection, type-guard ergonomics, or debugging. Such
synthetic discriminators MUST be stripped at encode and reconstructed
at decode if the binding chooses to expose them; they MUST NOT appear
on the wire. (See [`bindings.md`](bindings.md) §2.1 for examples.)

### 1.6 Collapsed wrappers

The grammar's branded singleton wrappers collapse on the wire to their
inner primitive. The wire grammar names them where the abstract grammar
does, but their type is whatever JSON primitive (or already-collapsed
production) they carry.

The wrappers fall into five groups by inner type:

- **IRI-typed** (`string`, syntactically valid IRI per RFC 3987):
  `Iri`, `TermIri`, every `XxxFieldId`, `TemplateId`,
  `TemplateInstanceId`, `PresentationComponentId`, `PropertyIri`,
  `OrcidIri`, `RorIri`, `DoiIri`, `PubMedIri`, `RridIri`,
  `NihGrantIri`, `OntologyIri`, `RootTermIri`, `ValueSetIri`.
- **Other strings** (`string`): `LanguageTag`, `LexicalForm`,
  `IsoDateTimeStamp`, `OntologyAcronym`, `ValueSetIdentifier`,
  `Notation`, `Identifier`, `AttributeName`, `HtmlContent`,
  `EmbeddedArtifactKey`, `ValidationRegex`.
- **Numbers**: `NonNegativeInteger`, `MinCardinality`, `MaxCardinality`,
  `MinLength`, `MaxLength`, `DecimalPlaces`, `MaxTraversalDepth`.
- **MultilingualString-typed**: `Name`, `Description`, `PreferredLabel`,
  `AlternativeLabel`, `Label`, `PropertyLabel`, `OntologyName`,
  `ValueSetName`, `RootTermLabel`, `Header`, `Footer`.
- **Versioning / lifecycle leaves**: `Version` and `ModelVersion` carry
  SemanticVersion lexical strings; `PreviousVersion` and `DerivedFrom`
  collapse to `Iri`; `CreatedOn` / `CreatedBy` / `ModifiedOn` /
  `ModifiedBy` collapse to their lifecycle-metadata primitives
  (`IsoDateTimeStamp` and `Iri` respectively).

---

## 2. Scalar and Datatype Leaves

The grammar's primitive string types (`SemanticVersion`, `IriString`,
`Bcp47Tag`, `Iso8601DateTimeLexicalForm`, `AsciiIdentifier`,
`IntegerLexicalForm`) are abstract leaves with no `::=` production;
on the wire they all encode as `string`, with constraints noted at
each site that uses them.

### 2.1 Core IRI and string types

```
Iri ::: string
  // a syntactically valid IRI per RFC 3987. At every position in the
  // model where the grammar uses Iri the wire form is a JSON string,
  // EXCEPT in `AnnotationValue` (the only polymorphic position
  // admitting a bare Iri). At that one position the IRI is wrapped
  // as `object { iri: string }` so the property-set discriminator
  // distinguishes it from the string-bearing arm — see §5 for that wrapper.

TermIri ::: Iri
  // a documented role; encodes as Iri

LanguageTag ::: string
  // a well-formed BCP 47 language tag

LexicalForm ::: string
  // a Unicode string; SHOULD be in Unicode Normalization Form C

IsoDateTimeStamp ::: string
  // an ISO 8601 date-time lexical form

NonNegativeInteger ::: number
  // a JSON number that is a non-negative integer
  // values exceeding 2^53 - 1 MUST be encoded as a string
```

### 2.2 Multilingual strings

```
LangString ::: object {
  value: string
  lang: string
}
  // lang MUST be a well-formed BCP 47 tag

MultilingualString ::: nonEmptyArray<LangString>
  // lang tags MUST be unique within the array (case-folded comparison)
```

### 2.3 Numeric datatype kind

```
RealNumberDatatypeKind ::: "decimal" | "float" | "double"
  // CEDAR-native enum naming the three real-number kinds.
  // The mapping to XSD datatype IRIs is defined separately in
  // rdf-projection.md and is out of scope for the wire form.
```

`IntegerNumberValue` is fixed to a single integer category and carries
no datatype slot on the wire. Temporal `Value` variants
(`FullDateValue`, `TimeValue`, `DateTimeValue`) likewise carry no
datatype slot — the temporal category is fixed by the variant's
`kind`.

---

## 3. Values

```
Value ::: TextValue | NumericValue | BooleanValue
        | DateValue | TimeValue | DateTimeValue
        | ControlledTermValue | EnumValue | LinkValue
        | EmailValue | PhoneNumberValue | ExternalAuthorityValue
        | AttributeValue
  // discriminator: kind
  // NumericValue and ExternalAuthorityValue are themselves unions;
  // their members supply the kind discriminator directly

NumericValue ::: IntegerNumberValue | RealNumberValue
  // discriminator: kind
```

### 3.1 Scalar values

Scalar `Value` variants carry their content directly. There is no inner
literal wrapper. `TextValue` carries an optional `lang` for
language-tagged text; `IntegerNumberValue` carries a base-10 integer
lexical form (datatype is fixed at `xsd:integer` and not carried);
`RealNumberValue` carries a real-valued lexical form paired with the
required `datatype` enum (`decimal | float | double`); `BooleanValue`
carries a JSON boolean.

```
TextValue ::: object {
  "kind": "TextValue"
  value: string
  lang?: string
}
  // lang, when present, MUST be a well-formed BCP 47 tag
  // value MUST be in Unicode Normalization Form C

IntegerNumberValue ::: object {
  "kind": "IntegerNumberValue"
  value: string
}
  // value is a base-10 integer lexical form
  // datatype is implicit (xsd:integer) and not carried on the wire

RealNumberValue ::: object {
  "kind": "RealNumberValue"
  value: string
  datatype: "decimal" | "float" | "double"
}
  // value is a base-10 real-valued lexical form
  // datatype names the XSD datatype (xsd:decimal, xsd:float, or xsd:double)

BooleanValue ::: object {
  "kind": "BooleanValue"
  value: boolean
}
  // value is a JSON boolean (true or false)
  // datatype is implicit (xsd:boolean) and not carried on the wire
```

### 3.2 Temporal values

Each temporal `Value` variant carries its lexical form directly. The
datatype is fixed by the variant's `kind` and is not carried on the
wire.

```
DateValue ::: YearValue | YearMonthValue | FullDateValue
  // discriminator: kind

YearValue ::: object {
  "kind": "YearValue"
  value: string
}
  // value matches YYYY

YearMonthValue ::: object {
  "kind": "YearMonthValue"
  value: string
}
  // value matches YYYY-MM

FullDateValue ::: object {
  "kind": "FullDateValue"
  value: string
}
  // value is an xsd:date lexical form (YYYY-MM-DD with optional zone)

TimeValue ::: object {
  "kind": "TimeValue"
  value: string
}
  // value is an xsd:time lexical form

DateTimeValue ::: object {
  "kind": "DateTimeValue"
  value: string
}
  // value is an xsd:dateTime lexical form
```

### 3.3 Controlled-term value

```
Label ::: MultilingualString
Notation ::: string
PreferredLabel ::: MultilingualString

ControlledTermValue ::: object {
  "kind": "ControlledTermValue"
  term: string
  label?: MultilingualString
  notation?: string
  preferredLabel?: MultilingualString
}
  // term is a TermIri (an Iri identifying the term)
```

### 3.4 Enum value

```
EnumValue ::: object {
  "kind": "EnumValue"
  value: string
}
  // value is the canonical Token of one of the referenced
  // EnumFieldSpec's PermissibleValue entries
  // value MUST be a non-empty Unicode string
```

`EnumValue.value` carries the wire-form of the abstract grammar's
`Token` slot — the wire property name is `value` for consistency with
other `Value` variants, while the abstract production names the slot
`Token`.

### 3.5 Link value

```
LinkValue ::: object {
  "kind": "LinkValue"
  iri: string
  label?: MultilingualString
}
```

### 3.6 Contact values

```
EmailValue ::: object {
  "kind": "EmailValue"
  value: string
}

PhoneNumberValue ::: object {
  "kind": "PhoneNumberValue"
  value: string
}
```

### 3.7 External authority values

```
ExternalAuthorityValue ::: OrcidValue | RorValue | DoiValue
                         | PubMedIdValue | RridValue | NihGrantIdValue
  // discriminator: kind

OrcidValue ::: object {
  "kind": "OrcidValue"
  iri: string
  label?: MultilingualString
}

RorValue ::: object {
  "kind": "RorValue"
  iri: string
  label?: MultilingualString
}

DoiValue ::: object {
  "kind": "DoiValue"
  iri: string
  label?: MultilingualString
}

PubMedIdValue ::: object {
  "kind": "PubMedIdValue"
  iri: string
  label?: MultilingualString
}

RridValue ::: object {
  "kind": "RridValue"
  iri: string
  label?: MultilingualString
}

NihGrantIdValue ::: object {
  "kind": "NihGrantIdValue"
  iri: string
  label?: MultilingualString
}

OrcidIri ::: Iri
RorIri ::: Iri
DoiIri ::: Iri
PubMedIri ::: Iri
RridIri ::: Iri
NihGrantIri ::: Iri
```

### 3.8 Attribute value

```
AttributeName ::: string

AttributeValue ::: object {
  "kind": "AttributeValue"
  name: string
  value: Value
}
  // value is a fully tagged Value (the polymorphic-only kind rule applies:
  // value lives at a polymorphic position, so it carries kind)
```

---

## 4. Identifiers (artifact)

Each artifact identifier wire-encodes as a plain string IRI; the
abstract grammar's branding is not visible on the wire.

```
FieldId ::: string
TextFieldId ::: Iri
IntegerNumberFieldId ::: Iri
RealNumberFieldId ::: Iri
BooleanFieldId ::: Iri
DateFieldId ::: Iri
TimeFieldId ::: Iri
DateTimeFieldId ::: Iri
ControlledTermFieldId ::: Iri
SingleValuedEnumFieldId ::: Iri
MultiValuedEnumFieldId ::: Iri
LinkFieldId ::: Iri
EmailFieldId ::: Iri
PhoneNumberFieldId ::: Iri
OrcidFieldId ::: Iri
RorFieldId ::: Iri
DoiFieldId ::: Iri
PubMedIdFieldId ::: Iri
RridFieldId ::: Iri
NihGrantIdFieldId ::: Iri
AttributeValueFieldId ::: Iri

TemplateId ::: Iri
PresentationComponentId ::: Iri
TemplateInstanceId ::: Iri
```

The family of an identifier is recovered from the `kind` discriminator
on the enclosing object — `Field` and `EmbeddedField` for `FieldId`
variants, `Template` and `EmbeddedTemplate` for `TemplateId`,
`PresentationComponent` and `EmbeddedPresentationComponent` for
`PresentationComponentId`, and `TemplateInstance` for
`TemplateInstanceId`. The identifier shape itself carries no family
information.

---

## 5. Artifact Metadata

### 5.1 Aggregate structure

`ArtifactMetadata` is flat on the wire: its descriptive properties
(`name`, `description`, `identifier`, `preferredLabel`, `altLabels`),
its `lifecycle` slot, and its `annotations` slot are all direct
members of the same object — there is no `descriptiveMetadata`
wrapper.

```
Name ::: MultilingualString
Description ::: MultilingualString
Identifier ::: string
AlternativeLabel ::: MultilingualString

ArtifactMetadata ::: object {
  name: MultilingualString
  description?: MultilingualString
  identifier?: string
  preferredLabel?: MultilingualString
  altLabels?: array<MultilingualString>
  lifecycle: LifecycleMetadata
  annotations?: array<Annotation>
}
  // altLabels SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // annotations SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // the grammar's PreferredLabel and AlternativeLabel productions are
  // collapsed to MultilingualString; their semantic role is conveyed by
  // the property name (preferredLabel, altLabels) on this object
```

`SchemaArtifactMetadata` is the wire form used by reusable schema
artifacts. It is the flat union of `ArtifactMetadata`'s properties
plus a `versioning` slot — there is no inner `artifact` wrapper.

```
SchemaArtifactMetadata ::: object {
  name: MultilingualString
  description?: MultilingualString
  identifier?: string
  preferredLabel?: MultilingualString
  altLabels?: array<MultilingualString>
  lifecycle: LifecycleMetadata
  annotations?: array<Annotation>
  versioning: SchemaArtifactVersioning
}
  // altLabels and annotations SHOULD be omitted from the wire when empty
```

The abstract grammar models `SchemaArtifactMetadata` as the
composition `schema_artifact_metadata(ArtifactMetadata,
SchemaArtifactVersioning)`. The wire form unwraps the inner `ArtifactMetadata`
into the outer object: every property of `ArtifactMetadata` appears
directly alongside `versioning`. There is no `metadata.artifact`
intermediate.

### 5.2 Lifecycle metadata

```
CreatedOn ::: string
CreatedBy ::: string
ModifiedOn ::: string
ModifiedBy ::: string

LifecycleMetadata ::: object {
  createdOn: string
  createdBy: string
  modifiedOn: string
  modifiedBy: string
}
  // createdOn and modifiedOn carry IsoDateTimeStamp values
  // createdBy and modifiedBy carry agent Iri values
```

### 5.3 Schema versioning

```
SchemaArtifactVersioning ::: object {
  version: string
  status: Status
  previousVersion?: string
  derivedFrom?: string
}
  // version is a SemanticVersion lexical form

Version ::: string
ModelVersion ::: string
  // a SemanticVersion 2.0.0 lexical form; carried directly on every
  // concrete artifact wire object as the top-level `modelVersion` slot
PreviousVersion ::: Iri
DerivedFrom ::: Iri

Status ::: "draft" | "published"
```

### 5.4 Annotations

```
Annotation ::: object {
  property: string
  body: AnnotationValue
}
  // property is the annotation-property Iri (the grammar's bare Iri
  // collapses to a string at this singleton position)

AnnotationValue ::: AnnotationStringValue | object { iri: string }
  // discriminator: property-set
  //
  // The two arms are distinguished by which properties the encoded
  // object carries:
  //
  //   { "value": "..." }                ⇒ AnnotationStringValue (no lang)
  //   { "value": "...", "lang": "..." } ⇒ AnnotationStringValue (lang-tagged)
  //   { "iri": "..." }                  ⇒ Iri (wrapped at this
  //                                        polymorphic position)
  //
  // An object that carries both `iri` and `value` is non-conforming.

AnnotationStringValue ::: object {
  value: string
  lang?: string
}
  // lang, when present, MUST be a well-formed BCP 47 tag
  // value MUST be in Unicode Normalization Form C
```

---

## 6. Embedded Artifact Properties

### 6.1 Embedded artifact key

```
EmbeddedArtifactKey ::: string
  // matches the pattern [A-Za-z][A-Za-z0-9_-]*
  // unique within the containing Template (constraint enforced on Template)
```

### 6.2 References

References to reusable artifacts use the same identifier productions as the artifact's own identity (§4); the abstract grammar does not distinguish reference-typed productions from identity-typed ones. At the `artifactRef` slot of an `EmbeddedField`, `EmbeddedTemplate`, or `EmbeddedPresentationComponent`, the identifier is encoded as a plain IRI string. The family is recovered from the `kind` discriminator on the enclosing embedding.

### 6.3 Requirements

```
ValueRequirement ::: "required" | "recommended" | "optional"
```

### 6.4 Cardinality

```
Cardinality ::: object {
  min: number
  max?: number
}
  // min is a non-negative integer
  // max omitted ⇒ unbounded above (per grammar.md §Cardinality)

MinCardinality ::: number
MaxCardinality ::: number
```

### 6.5 Visibility

```
Visibility ::: "visible" | "hidden"
```

### 6.6 Defaults

The optional `defaultValue` slot on each `EmbeddedXxxField` is typed
family-by-family with the family's `Value` type (see `grammar.md`
§Defaults for the full table). There is no `DefaultValue` union and no
per-family `XxxDefaultValue` wrapper on the wire: the `defaultValue`
JSON encodes directly as the corresponding family's `Value`.

A `defaultValue` slot is a singleton position: per the polymorphic-only
kind rule (§1.5), the family is fixed by the enclosing
`EmbeddedXxxField.kind` and the inner `kind` property is dropped on the
wire and reconstructed at decode time. The one polymorphic `Value`
union — `DateValue` — retains its `kind` discriminator at this position
because a kind tag is required to discriminate the union arms.

The wire form per family is therefore:

| Embedded field | `defaultValue` wire form |
|---|---|
| `EmbeddedTextField` | `TextValue` (kind dropped: `{ value, lang? }`) |
| `EmbeddedIntegerNumberField` | `IntegerNumberValue` (kind dropped: `{ value }`) |
| `EmbeddedRealNumberField` | `RealNumberValue` (kind dropped: `{ value, datatype }`) |
| `EmbeddedBooleanField` | `BooleanValue` (kind dropped: `{ value }` where value is a JSON boolean) |
| `EmbeddedDateField` | `DateValue` (kind retained: `YearValue \| YearMonthValue \| FullDateValue`) |
| `EmbeddedTimeField` | `TimeValue` (kind dropped: `{ value }`) |
| `EmbeddedDateTimeField` | `DateTimeValue` (kind dropped: `{ value }`) |
| `EmbeddedControlledTermField` | `ControlledTermValue` (kind dropped) |
| `EmbeddedSingleValuedEnumField` | `EnumValue` (kind dropped: `{ value }`) |
| `EmbeddedMultiValuedEnumField` | `array<EnumValue>` (each element: kind dropped — `{ value }`) |
| `EmbeddedLinkField` | `LinkValue` (kind dropped) |
| `EmbeddedEmailField` | `EmailValue` (kind dropped: `{ value }`) |
| `EmbeddedPhoneNumberField` | `PhoneNumberValue` (kind dropped: `{ value }`) |
| `EmbeddedOrcidField` | `OrcidValue` (kind dropped) |
| `EmbeddedRorField` | `RorValue` (kind dropped) |
| `EmbeddedDoiField` | `DoiValue` (kind dropped) |
| `EmbeddedPubMedIdField` | `PubMedIdValue` (kind dropped) |
| `EmbeddedRridField` | `RridValue` (kind dropped) |
| `EmbeddedNihGrantIdField` | `NihGrantIdValue` (kind dropped) |

**Spec-level defaults.** Three `FieldSpec` productions carry
spec-level default slots: `TextFieldSpec.defaultValue` (a single
`TextValue`, kind dropped: `{ value, lang? }`),
`SingleValuedEnumFieldSpec.defaultValue` (a single `Token` — encoded
on the wire as a plain string carrying one of the spec's permissible
`Token` values), and `MultiValuedEnumFieldSpec.defaultValues` (an
array of `Token` — encoded as a JSON array of plain strings, possibly
empty). The text default follows the singleton-position kind rule;
the enum defaults are bare-string `Token` references and carry no
`kind`. See §7 for the productions.

### 6.7 Label override

```
LabelOverride ::: object {
  label: MultilingualString
  altLabels: array<MultilingualString>
}
  // altLabels MAY be empty
```

### 6.8 Properties

```
Property ::: object {
  iri: string
  label?: MultilingualString
}
  // iri carries the PropertyIri; label is the optional PropertyLabel

PropertyIri ::: Iri
PropertyLabel ::: MultilingualString
```

---

## 7. Field Specs

```
FieldSpec ::: TextFieldSpec | NumericFieldSpec | BooleanFieldSpec
            | TemporalFieldSpec
            | ControlledTermFieldSpec | EnumFieldSpec | LinkFieldSpec
            | ContactFieldSpec | ExternalAuthorityFieldSpec
            | AttributeValueFieldSpec
  // discriminator: kind
  // NumericFieldSpec, TemporalFieldSpec, EnumFieldSpec, ContactFieldSpec,
  // and ExternalAuthorityFieldSpec are unions; their members supply
  // the kind discriminator directly

NumericFieldSpec ::: IntegerNumberFieldSpec | RealNumberFieldSpec
  // discriminator: kind

TextFieldSpec ::: object {
  "kind": "TextFieldSpec"
  defaultValue?: TextValue
  minLength?: number
  maxLength?: number
  validationRegex?: string
  renderingHint?: TextRenderingHint
}
  // defaultValue, when present, encodes as a TextValue with kind
  // dropped at this singleton position (i.e. `{ value, lang? }`).
  // TextFieldSpec is the only FieldSpec that carries a defaultValue
  // slot (see §6.6).

IntegerNumberFieldSpec ::: object {
  "kind": "IntegerNumberFieldSpec"
  unit?: Unit
  minValue?: IntegerNumberValue
  maxValue?: IntegerNumberValue
  renderingHint?: NumericRenderingHint
}

RealNumberFieldSpec ::: object {
  "kind": "RealNumberFieldSpec"
  datatype: RealNumberDatatypeKind
  unit?: Unit
  minValue?: RealNumberValue
  maxValue?: RealNumberValue
  renderingHint?: NumericRenderingHint
}

BooleanFieldSpec ::: object {
  "kind": "BooleanFieldSpec"
  renderingHint?: BooleanRenderingHint
}

Unit ::: object {
  iri: string
  label?: MultilingualString
}

MinLength ::: number
MaxLength ::: number
ValidationRegex ::: string
DecimalPlaces ::: number
IntegerNumberMinValue ::: IntegerNumberValue
IntegerNumberMaxValue ::: IntegerNumberValue
RealNumberMinValue ::: RealNumberValue
RealNumberMaxValue ::: RealNumberValue
```

### 7.1 Temporal field specs

```
TemporalFieldSpec ::: DateFieldSpec | TimeFieldSpec | DateTimeFieldSpec
  // discriminator: kind

DateFieldSpec ::: object {
  "kind": "DateFieldSpec"
  dateValueType: DateValueType
  renderingHint?: DateRenderingHint
}

DateValueType ::: "year" | "yearMonth" | "fullDate"

TimeFieldSpec ::: object {
  "kind": "TimeFieldSpec"
  timePrecision?: TimePrecision
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: TimeRenderingHint
}

TimePrecision ::: "hourMinute" | "hourMinuteSecond" | "hourMinuteSecondFraction"

TimezoneRequirement ::: "timezoneRequired" | "timezoneNotRequired"

DateTimeFieldSpec ::: object {
  "kind": "DateTimeFieldSpec"
  dateTimeValueType: DateTimeValueType
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: DateTimeRenderingHint
}

DateTimeValueType ::: "dateHourMinute" | "dateHourMinuteSecond"
                    | "dateHourMinuteSecondFraction"

DateRenderingHint ::: object {
  componentOrder?: DateComponentOrder
}

DateComponentOrder ::: "dayMonthYear" | "monthDayYear" | "yearMonthDay"

TimeRenderingHint ::: object {
  timeFormat?: TimeFormat
}

DateTimeRenderingHint ::: object {
  timeFormat?: TimeFormat
}

TimeFormat ::: "twelveHour" | "twentyFourHour"
```

### 7.2 Controlled term field spec

```
ControlledTermFieldSpec ::: object {
  "kind": "ControlledTermFieldSpec"
  sources: nonEmptyArray<ControlledTermSource>
}
```

### 7.3 Enum field specs

```
EnumFieldSpec ::: SingleValuedEnumFieldSpec | MultiValuedEnumFieldSpec
  // discriminator: kind

SingleValuedEnumFieldSpec ::: object {
  "kind": "SingleValuedEnumFieldSpec"
  permissibleValues: nonEmptyArray<PermissibleValue>
  defaultValue?: string
  renderingHint?: SingleValuedEnumRenderingHint
}
  // defaultValue, when present, MUST equal the `value` of one of the
  // permissibleValues entries

MultiValuedEnumFieldSpec ::: object {
  "kind": "MultiValuedEnumFieldSpec"
  permissibleValues: nonEmptyArray<PermissibleValue>
  defaultValues?: array<string>
  renderingHint?: MultiValuedEnumRenderingHint
}
  // defaultValues, when present, MUST be a (possibly empty) array of
  // strings each equal to the `value` of one of the permissibleValues
  // entries; the array MUST NOT contain duplicates

PermissibleValue ::: object {
  value: string
  label?: MultilingualString
  description?: MultilingualString
  meanings?: array<Meaning>
}
  // value carries the canonical Token of the permissible value and
  // MUST be a non-empty Unicode string
  // value MUST be unique within the enclosing spec's permissibleValues
  // meanings, when present, is a (possibly empty) array of Meaning
  // objects binding the token to ontology terms; SHOULD be omitted
  // when empty

Meaning ::: object {
  iri: string
  label?: MultilingualString
}
  // iri carries the TermIri of the bound ontology term
  // label, when present, is the cached human-readable label of the
  // bound term (distinct from the enclosing PermissibleValue's label,
  // which is the label of the permissible value itself)
```

### 7.4 Other field specs

```
LinkFieldSpec ::: object {
  "kind": "LinkFieldSpec"
}

ContactFieldSpec ::: EmailFieldSpec | PhoneNumberFieldSpec
  // discriminator: kind

EmailFieldSpec ::: object {
  "kind": "EmailFieldSpec"
}

PhoneNumberFieldSpec ::: object {
  "kind": "PhoneNumberFieldSpec"
}

ExternalAuthorityFieldSpec ::: OrcidFieldSpec | RorFieldSpec | DoiFieldSpec
                             | PubMedIdFieldSpec | RridFieldSpec
                             | NihGrantIdFieldSpec
  // discriminator: kind

OrcidFieldSpec ::: object { "kind": "OrcidFieldSpec" }
RorFieldSpec ::: object { "kind": "RorFieldSpec" }
DoiFieldSpec ::: object { "kind": "DoiFieldSpec" }
PubMedIdFieldSpec ::: object { "kind": "PubMedIdFieldSpec" }
RridFieldSpec ::: object { "kind": "RridFieldSpec" }
NihGrantIdFieldSpec ::: object { "kind": "NihGrantIdFieldSpec" }

AttributeValueFieldSpec ::: object {
  "kind": "AttributeValueFieldSpec"
}
```

### 7.5 Controlled term sources

```
ControlledTermSource ::: OntologySource | BranchSource
                       | ClassSource | ValueSetSource
  // discriminator: kind

OntologySource ::: object {
  "kind": "OntologySource"
  ontology: OntologyReference
}

OntologyReference ::: object {
  iri: string
  displayHint?: OntologyDisplayHint
}

OntologyDisplayHint ::: object {
  acronym?: string
  name?: MultilingualString
}
  // at least one of acronym, name MUST be present

BranchSource ::: object {
  "kind": "BranchSource"
  ontology: OntologyReference
  rootTermIri: string
  rootTermLabel?: MultilingualString
  maxTraversalDepth?: number
}
  // rootTermLabel SHOULD be present (captured at source-declaration time)
  // but MAY be omitted when the term's display text is not available

ClassSource ::: object {
  "kind": "ClassSource"
  classes: nonEmptyArray<ControlledTermClass>
}

ControlledTermClass ::: object {
  term: string
  label?: MultilingualString
  ontology: OntologyReference
}
  // term is a TermIri
  // label SHOULD be present (captured at source-declaration time)
  // but MAY be omitted when the term's display text is not available

ValueSetSource ::: object {
  "kind": "ValueSetSource"
  identifier: string
  name?: MultilingualString
  iri?: string
}

OntologyAcronym ::: string
OntologyName ::: MultilingualString
OntologyIri ::: Iri
RootTermIri ::: Iri
RootTermLabel ::: MultilingualString
MaxTraversalDepth ::: number
ValueSetIdentifier ::: string
ValueSetName ::: MultilingualString
ValueSetIri ::: Iri
```

### 7.6 Rendering hints

```
RenderingHint ::: TextRenderingHint | SingleValuedEnumRenderingHint
                | MultiValuedEnumRenderingHint | NumericRenderingHint
                | BooleanRenderingHint
                | DateRenderingHint | TimeRenderingHint | DateTimeRenderingHint
  // discriminator: position
  // resolved by the renderingHint property of the enclosing FieldSpec

TextRenderingHint ::: "singleLine" | "multiLine"

SingleValuedEnumRenderingHint ::: "radio" | "dropdown"

MultiValuedEnumRenderingHint ::: "checkbox" | "multiSelect"

NumericRenderingHint ::: object {
  decimalPlaces?: number
}
  // decimalPlaces, when present, MUST be a non-negative integer
  // it is a presentation concern (display rounding); it does NOT
  // constrain the lexical form of submitted values

BooleanRenderingHint ::: "checkbox" | "toggle" | "radio" | "dropdown"
```

`DateRenderingHint`, `TimeRenderingHint`, `DateTimeRenderingHint`, and
`NumericRenderingHint` are objects on the wire (each can carry
configuration); the simpler text/enum/boolean hints are flat strings.

---

## 8. Field artifacts

```
Field ::: TextField | NumericField | BooleanField
        | DateField | TimeField | DateTimeField
        | ControlledTermField
        | SingleValuedEnumField | MultiValuedEnumField
        | LinkField | EmailField | PhoneNumberField
        | OrcidField | RorField | DoiField | PubMedIdField
        | RridField | NihGrantIdField | AttributeValueField
  // discriminator: kind
  // NumericField is itself a union of IntegerNumberField and RealNumberField

NumericField ::: IntegerNumberField | RealNumberField
  // discriminator: kind

TemporalField ::: DateField | TimeField | DateTimeField
  // discriminator: kind
  // a documented intermediate category; the wire form is just the variant

EnumField ::: SingleValuedEnumField | MultiValuedEnumField
  // discriminator: kind

ContactField ::: EmailField | PhoneNumberField
  // discriminator: kind

ExternalAuthorityField ::: OrcidField | RorField | DoiField
                         | PubMedIdField | RridField | NihGrantIdField
  // discriminator: kind

TextField ::: object {
  "kind": "TextField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: TextFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

IntegerNumberField ::: object {
  "kind": "IntegerNumberField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: IntegerNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RealNumberField ::: object {
  "kind": "RealNumberField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: RealNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

BooleanField ::: object {
  "kind": "BooleanField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: BooleanFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateField ::: object {
  "kind": "DateField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DateFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

TimeField ::: object {
  "kind": "TimeField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: TimeFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateTimeField ::: object {
  "kind": "DateTimeField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DateTimeFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ControlledTermField ::: object {
  "kind": "ControlledTermField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: ControlledTermFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

SingleValuedEnumField ::: object {
  "kind": "SingleValuedEnumField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: SingleValuedEnumFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

MultiValuedEnumField ::: object {
  "kind": "MultiValuedEnumField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: MultiValuedEnumFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

LinkField ::: object {
  "kind": "LinkField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: LinkFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

EmailField ::: object {
  "kind": "EmailField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: EmailFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PhoneNumberField ::: object {
  "kind": "PhoneNumberField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: PhoneNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

OrcidField ::: object {
  "kind": "OrcidField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: OrcidFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RorField ::: object {
  "kind": "RorField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: RorFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DoiField ::: object {
  "kind": "DoiField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DoiFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PubMedIdField ::: object {
  "kind": "PubMedIdField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: PubMedIdFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RridField ::: object {
  "kind": "RridField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: RridFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

NihGrantIdField ::: object {
  "kind": "NihGrantIdField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: NihGrantIdFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

AttributeValueField ::: object {
  "kind": "AttributeValueField"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  fieldSpec: AttributeValueFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
```

---

## 9. Embedded artifacts

```
EmbeddedArtifact ::: EmbeddedField | EmbeddedTemplate
                   | EmbeddedPresentationComponent
  // discriminator: kind

EmbeddedField ::: EmbeddedTextField
                | EmbeddedIntegerNumberField | EmbeddedRealNumberField
                | EmbeddedBooleanField
                | EmbeddedDateField | EmbeddedTimeField | EmbeddedDateTimeField
                | EmbeddedControlledTermField
                | EmbeddedSingleValuedEnumField | EmbeddedMultiValuedEnumField
                | EmbeddedLinkField
                | EmbeddedEmailField | EmbeddedPhoneNumberField
                | EmbeddedOrcidField | EmbeddedRorField | EmbeddedDoiField
                | EmbeddedPubMedIdField | EmbeddedRridField
                | EmbeddedNihGrantIdField
                | EmbeddedAttributeValueField
  // discriminator: kind

EmbeddedTextField ::: object {
  "kind": "EmbeddedTextField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TextValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedIntegerNumberField ::: object {
  "kind": "EmbeddedIntegerNumberField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: IntegerNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedRealNumberField ::: object {
  "kind": "EmbeddedRealNumberField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RealNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedBooleanField ::: object {
  "kind": "EmbeddedBooleanField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  visibility?: Visibility
  defaultValue?: BooleanValue
  labelOverride?: LabelOverride
  property?: Property
}
  // boolean embeddings carry no cardinality slot per grammar.md
  // (booleans are inherently single-valued)

EmbeddedDateField ::: object {
  "kind": "EmbeddedDateField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedTimeField ::: object {
  "kind": "EmbeddedTimeField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TimeValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedDateTimeField ::: object {
  "kind": "EmbeddedDateTimeField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateTimeValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedControlledTermField ::: object {
  "kind": "EmbeddedControlledTermField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: ControlledTermValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedSingleValuedEnumField ::: object {
  "kind": "EmbeddedSingleValuedEnumField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  visibility?: Visibility
  defaultValue?: EnumValue
  labelOverride?: LabelOverride
  property?: Property
}
  // single-valued enum embeddings carry no cardinality slot per
  // grammar.md (single-valued enum is implicit, parallel to boolean)
  // defaultValue is at a singleton position; its kind property is
  // omitted on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedMultiValuedEnumField ::: object {
  "kind": "EmbeddedMultiValuedEnumField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: array<EnumValue>
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is a (possibly empty) array of EnumValue entries;
  // each element is encoded with kind dropped at this singleton-element
  // position. The array MUST NOT contain duplicate `value` entries.

EmbeddedLinkField ::: object {
  "kind": "EmbeddedLinkField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: LinkValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedEmailField ::: object {
  "kind": "EmbeddedEmailField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: EmailValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPhoneNumberField ::: object {
  "kind": "EmbeddedPhoneNumberField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PhoneNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedOrcidField ::: object {
  "kind": "EmbeddedOrcidField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: OrcidValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedRorField ::: object {
  "kind": "EmbeddedRorField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RorValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedDoiField ::: object {
  "kind": "EmbeddedDoiField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DoiValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedPubMedIdField ::: object {
  "kind": "EmbeddedPubMedIdField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PubMedIdValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedRridField ::: object {
  "kind": "EmbeddedRridField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RridValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedNihGrantIdField ::: object {
  "kind": "EmbeddedNihGrantIdField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: NihGrantIdValue
  labelOverride?: LabelOverride
  property?: Property
}
  // defaultValue is at a singleton position; its kind property is omitted
  // on the wire (per the polymorphic-only kind rule, §1.5)

EmbeddedAttributeValueField ::: object {
  "kind": "EmbeddedAttributeValueField"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  labelOverride?: LabelOverride
  property?: Property
}
  // attribute-value embeddings carry no defaultValue per grammar.md

EmbeddedTemplate ::: object {
  "kind": "EmbeddedTemplate"
  key: string
  artifactRef: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPresentationComponent ::: object {
  "kind": "EmbeddedPresentationComponent"
  key: string
  artifactRef: string
  visibility?: Visibility
}
```

---

## 10. Presentation Components

```
PresentationComponent ::: RichTextComponent | ImageComponent
                        | YoutubeVideoComponent
                        | SectionBreakComponent | PageBreakComponent
  // discriminator: kind

RichTextComponent ::: object {
  "kind": "RichTextComponent"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
  html: string
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ImageComponent ::: object {
  "kind": "ImageComponent"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
  image: string
  label?: MultilingualString
  description?: MultilingualString
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // image is an Iri identifying the image resource
  // label, when present, is short alt-text accessibility metadata
  // description, when present, is longer accessibility-focused text

YoutubeVideoComponent ::: object {
  "kind": "YoutubeVideoComponent"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
  video: string
  label?: MultilingualString
  description?: MultilingualString
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // video is an Iri identifying the video resource
  // label, when present, is short alt-text / caption-title accessibility metadata
  // description, when present, is longer accessibility-focused text

SectionBreakComponent ::: object {
  "kind": "SectionBreakComponent"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PageBreakComponent ::: object {
  "kind": "PageBreakComponent"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

HtmlContent ::: string
```

---

## 11. Templates and Top-Level Artifacts

```
Artifact ::: SchemaArtifact | PresentationComponent | TemplateInstance
  // discriminator: kind
  // kind ∈ {"Field", "Template", "RichTextComponent", "ImageComponent",
  //         "YoutubeVideoComponent", "SectionBreakComponent",
  //         "PageBreakComponent", "TemplateInstance"}

SchemaArtifact ::: Field | Template
  // discriminator: kind

Template ::: object {
  "kind": "Template"
  id: string
  modelVersion: string
  metadata: SchemaArtifactMetadata
  header?: MultilingualString
  footer?: MultilingualString
  members: array<EmbeddedArtifact>
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // EmbeddedArtifact keys (each member's `key` property) MUST be unique
  // within `members` (per grammar.md §Embedded Artifact Key)
  // the order of `members` MUST be preserved

Header ::: MultilingualString
Footer ::: MultilingualString
```

---

## 12. Instances

```
TemplateInstance ::: object {
  "kind": "TemplateInstance"
  id: string
  modelVersion: string
  metadata: ArtifactMetadata
  templateRef: string
  values: array<InstanceValue>
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // metadata is ArtifactMetadata, not SchemaArtifactMetadata
  // (instances do not carry schema versioning)

InstanceValue ::: FieldValue | NestedTemplateInstance
  // discriminator: kind

FieldValue ::: object {
  "kind": "FieldValue"
  key: string
  values: nonEmptyArray<Value>
}
  // values MUST be non-empty (per grammar's Value+; absence of a value is
  // represented by omitting the FieldValue entirely)

NestedTemplateInstance ::: object {
  "kind": "NestedTemplateInstance"
  key: string
  values: array<InstanceValue>
}
  // values MAY be empty
```

---

## 13. Cross-reference

For the JSON-encoding rules that frame this grammar — property naming
(lowerCamelCase), Unicode normalisation, big-integer string fallback,
implementation-extension prefixes, and worked end-to-end examples —
see [`serialization.md`](serialization.md). For the abstract grammar
this file mirrors, see [`grammar.md`](grammar.md). For conformance
rules, see [`validation.md`](validation.md).
