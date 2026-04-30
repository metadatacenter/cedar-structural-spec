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
| `"literal"`                       | A string-literal type — the JSON value MUST equal the literal. Used for `kind` and `fieldKind` discriminators. |
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
  (currently `Literal`, `TextLiteral`, and `AnnotationValue`).
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
such as `Cardinality`, `Property`, `LabelOverride`, `DescriptiveMetadata`,
`SchemaArtifactMetadata`, `ArtifactMetadata`, `TemporalProvenance`,
`SchemaVersioning`, `Annotation`, `Unit`, `OntologyReference`,
`OntologyDisplayHint`, `ControlledTermClass`, `LiteralChoiceOption`,
`ControlledTermChoiceOption`, and the temporal `RenderingHint`
variants.

### 1.6 The shared `kind` + `fieldKind` rule

Each of the eighteen `Field` family productions (`TextField`,
`NumericField`, …) shares a single outer discriminator `kind: "Field"`,
and is distinguished within that family by an inner discriminator
`fieldKind: "Text"`, `fieldKind: "Numeric"`, etc. The same applies to
the eighteen `EmbeddedField` family productions, which share
`kind: "EmbeddedField"` and use `fieldKind` to distinguish family.

### 1.7 Collapsed wrappers

The grammar's branded singleton wrappers — `NonNegativeInteger`,
`KeyIdentifier`, `LexicalForm`, `Iri`, `DatatypeIri`, `TermIri`,
`LanguageTag`, `IsoDateTimeStamp`, every `XxxFieldId` /
`XxxFieldReference` / `TemplateId` / `TemplateInstanceId` /
`PresentationComponentId` / `PropertyIri` / `OrcidIri` / `RorIri` /
`DoiIri` / `PubMedIri` / `RridIri` / `NihGrantIri` / `OntologyIri` /
`RootTermIri` / `ValueSetIri` / `OntologyAcronym` / `ValueSetIdentifier`
/ `Notation` / `LinkLabel` / `Identifier` / `MinCardinality` /
`MaxCardinality` / `MinLength` / `MaxLength` / `ValidationRegex` /
`NumericPrecision` / `MaxTraversalDepth` / `Version` / `ModelVersion` /
`PreviousVersion` / `DerivedFrom` / `CreatedOn` / `CreatedBy` /
`ModifiedOn` / `ModifiedBy` / `EmbeddedArtifactKey` / `Header` /
`Footer` / `Name` / `Description` / `PreferredLabel` /
`AlternativeLabel` / `Label` / `PropertyLabel` / `OntologyName` /
`ValueSetName` / `RootTermLabel` / `AttributeName` / `HtmlContent` /
`ImageSource` / `YoutubeVideoSource` — collapse on the wire to their
inner primitive. The wire grammar names them where the abstract grammar
does, but their type is whatever JSON primitive (or already-collapsed
production) they carry.

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
  // a syntactically valid IRI per RFC 3987; at polymorphic positions
  // (e.g. AnnotationValue) the IRI is wrapped as `object { iri: string }`
  // — see §6 for that wrapper

DatatypeIri ::: Iri
  // a documented role; encodes as Iri

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

### 2.3 Numeric datatype IRIs

```
NumericDatatype ::: NumericDatatypeIri
  // collapses to the inner enum string (the wrapper carries no extra info)

NumericDatatypeIri ::: "integer" | "decimal" | "float" | "double"
                     | "long" | "int" | "short" | "byte"
                     | "nonNegativeInteger" | "positiveInteger"
                     | "nonPositiveInteger" | "negativeInteger"
                     | "unsignedLong" | "unsignedInt"
                     | "unsignedShort" | "unsignedByte"
  // each value names an XSD numeric datatype IRI per grammar.md §Numeric
  // Datatype IRIs; the corresponding XSD IRIs are reconstructed at decode
  // the per-arm productions XsdIntegerDatatypeIri, …, XsdUnsignedByteDatatypeIri
  // collapse to their string-literal alternative above
```

### 2.4 Temporal datatype IRIs

```
DateDatatypeIri ::: "date"
TimeDatatypeIri ::: "time"
DateTimeDatatypeIri ::: "dateTime"
  // the per-arm productions XsdDateDatatypeIri, XsdTimeDatatypeIri, and
  // XsdDateTimeDatatypeIri collapse to their string-literal alternative above
  // the canonical XSD IRI is reconstructed at decode
```

---

## 3. Literals

```
Literal ::: StringLiteral | LangStringLiteral | DatatypeIriLiteral
  // discriminator: property-set

StringLiteral ::: object {
  value: string
}

LangStringLiteral ::: object {
  value: string
  lang: string
}
  // lang MUST be a well-formed BCP 47 tag

DatatypeIriLiteral ::: object {
  value: string
  datatype: string
}
  // datatype is an Iri identifying the literal's RDF datatype
  // value and datatype MUST NOT both carry a lang property

TextLiteral ::: StringLiteral | LangStringLiteral
  // discriminator: property-set
```

The four specialised typed-literal subtypes appear only at singleton
positions where the surrounding production fixes the datatype; the
`datatype` property MAY be omitted on the wire and is reconstructed at
decode time from the position.

```
NumericLiteral ::: object {
  value: string
  datatype?: string
}
  // value is a base-10 numeric lexical form
  // datatype MAY be present; when omitted, the surrounding NumericValue's
  // NumericDatatypeIri determines the XSD numeric datatype IRI

TemporalLiteral ::: FullDateLiteral | TimeLiteral | DateTimeLiteral
  // discriminator: position
  // resolved by the enclosing FullDateValue / TimeValue / DateTimeValue

FullDateLiteral ::: object {
  value: string
  datatype?: string
}
  // value is an xsd:date lexical form (YYYY-MM-DD with optional zone)
  // datatype, when present, MUST be the xsd:date IRI

TimeLiteral ::: object {
  value: string
  datatype?: string
}
  // value is an xsd:time lexical form
  // datatype, when present, MUST be the xsd:time IRI

DateTimeLiteral ::: object {
  value: string
  datatype?: string
}
  // value is an xsd:dateTime lexical form
  // datatype, when present, MUST be the xsd:dateTime IRI
```

---

## 4. Values

```
Value ::: TextValue | NumericValue | DateValue | TimeValue | DateTimeValue
        | ControlledTermValue | ChoiceValue | LinkValue
        | EmailValue | PhoneNumberValue | ExternalAuthorityValue
        | AttributeValue
  // discriminator: kind
  // ChoiceValue and ExternalAuthorityValue are themselves unions;
  // their members supply the kind discriminator directly
```

### 4.1 Scalar values

```
TextValue ::: object {
  "kind": "TextValue"
  literal: TextLiteral
}

NumericValue ::: object {
  "kind": "NumericValue"
  literal: NumericLiteral
}
```

### 4.2 Temporal values

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
  literal: FullDateLiteral
}

TimeValue ::: object {
  "kind": "TimeValue"
  literal: TimeLiteral
}

DateTimeValue ::: object {
  "kind": "DateTimeValue"
  literal: DateTimeLiteral
}
```

### 4.3 Controlled-term value

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

### 4.4 Choice value

```
ChoiceValue ::: LiteralChoiceValue | ControlledTermChoiceValue
  // discriminator: kind

LiteralChoiceValue ::: object {
  "kind": "LiteralChoiceValue"
  literal: Literal
}

ControlledTermChoiceValue ::: object {
  "kind": "ControlledTermChoiceValue"
  value: ControlledTermValue
}
  // the inner ControlledTermValue is at a singleton position; on the wire
  // it is encoded untagged (the kind property is omitted in this position)
```

### 4.5 Link value

```
LinkValue ::: object {
  "kind": "LinkValue"
  iri: string
  label?: string
}

LinkLabel ::: string
  // plain Unicode text; not multilingual
```

### 4.6 Contact values

```
EmailValue ::: object {
  "kind": "EmailValue"
  literal: StringLiteral
}

PhoneNumberValue ::: object {
  "kind": "PhoneNumberValue"
  literal: StringLiteral
}
```

### 4.7 External authority values

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

### 4.8 Attribute value

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

## 5. Identifiers (artifact)

Each artifact identifier wire-encodes as a plain string IRI; the
abstract grammar's branding is not visible on the wire.

```
FieldId ::: string
TextFieldId ::: Iri
NumericFieldId ::: Iri
DateFieldId ::: Iri
TimeFieldId ::: Iri
DateTimeFieldId ::: Iri
ControlledTermFieldId ::: Iri
SingleChoiceFieldId ::: Iri
MultipleChoiceFieldId ::: Iri
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

The eighteen field families are determined by the `fieldKind`
discriminator on the enclosing `Field` or `EmbeddedField`, not by the
identifier shape.

---

## 6. Artifact Metadata

### 6.1 Aggregate structure

```
SchemaArtifactMetadata ::: object {
  artifact: ArtifactMetadata
  versioning: SchemaVersioning
}

ArtifactMetadata ::: object {
  descriptiveMetadata: DescriptiveMetadata
  provenance: TemporalProvenance
  annotations: array<Annotation>
}
```

### 6.2 Descriptive metadata

```
Name ::: MultilingualString
Description ::: MultilingualString
Identifier ::: string
AlternativeLabel ::: MultilingualString

DescriptiveMetadata ::: object {
  name: MultilingualString
  description?: MultilingualString
  identifier?: string
  preferredLabel?: MultilingualString
  altLabels: array<MultilingualString>
}
  // altLabels MAY be empty
  // the grammar's PreferredLabel and AlternativeLabel productions are
  // collapsed to MultilingualString; their semantic role is conveyed by
  // the property name (preferredLabel, altLabels) on this object
```

### 6.3 Temporal provenance

```
CreatedOn ::: string
CreatedBy ::: string
ModifiedOn ::: string
ModifiedBy ::: string

TemporalProvenance ::: object {
  createdOn: string
  createdBy: string
  modifiedOn: string
  modifiedBy: string
}
  // createdOn and modifiedOn carry IsoDateTimeStamp values
  // createdBy and modifiedBy carry agent Iri values
```

### 6.4 Schema versioning

```
SchemaVersioning ::: object {
  version: string
  status: Status
  modelVersion: string
  previousVersion?: string
  derivedFrom?: string
}
  // version and modelVersion are SemanticVersion lexical forms

Version ::: string
ModelVersion ::: string
PreviousVersion ::: Iri
DerivedFrom ::: Iri

Status ::: "draft" | "published"

DraftStatus ::: "draft"
PublishedStatus ::: "published"
```

### 6.5 Annotations

```
Annotation ::: object {
  property: string
  body: AnnotationValue
}
  // property is the annotation-property Iri (the grammar's bare Iri
  // collapses to a string at this singleton position)

AnnotationValue ::: StringLiteral | LangStringLiteral | DatatypeIriLiteral
                  | object { iri: string }
  // discriminator: property-set
  // value-only          ⇒ StringLiteral
  // value + lang        ⇒ LangStringLiteral
  // value + datatype    ⇒ DatatypeIriLiteral
  // iri only            ⇒ Iri (wrapped at this polymorphic position)
```

---

## 7. Embedded Artifact Properties

### 7.1 Embedded artifact key

```
EmbeddedArtifactKey ::: string
  // matches the pattern [A-Za-z][A-Za-z0-9_-]*
  // unique within the containing Template (constraint enforced on Template)

KeyIdentifier ::: string
  // collapsed wrapper; matches the AsciiIdentifier pattern
```

### 7.2 References

Each reference encodes as a plain Iri; the family is determined by the
enclosing `EmbeddedField`'s `fieldKind` discriminator.

```
FieldReference ::: string

TextFieldReference ::: Iri
NumericFieldReference ::: Iri
DateFieldReference ::: Iri
TimeFieldReference ::: Iri
DateTimeFieldReference ::: Iri
ControlledTermFieldReference ::: Iri
SingleChoiceFieldReference ::: Iri
MultipleChoiceFieldReference ::: Iri
LinkFieldReference ::: Iri
EmailFieldReference ::: Iri
PhoneNumberFieldReference ::: Iri
OrcidFieldReference ::: Iri
RorFieldReference ::: Iri
DoiFieldReference ::: Iri
PubMedIdFieldReference ::: Iri
RridFieldReference ::: Iri
NihGrantIdFieldReference ::: Iri
AttributeValueFieldReference ::: Iri

TemplateReference ::: Iri
PresentationComponentReference ::: Iri
```

### 7.3 Requirements

```
ValueRequirement ::: "required" | "recommended" | "optional"
  // the per-arm productions Required, Recommended, and Optional collapse
  // to their string-literal alternative above
```

### 7.4 Cardinality

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

### 7.5 Visibility

```
Visibility ::: "visible" | "hidden"
  // the per-arm productions Visible and Hidden collapse to their
  // string-literal alternative above
```

### 7.6 Defaults

```
DefaultValue ::: TextDefaultValue | NumericDefaultValue
              | DateDefaultValue | TimeDefaultValue | DateTimeDefaultValue
              | ControlledTermDefaultValue | ChoiceDefaultValue
              | LinkDefaultValue | EmailDefaultValue | PhoneNumberDefaultValue
              | OrcidDefaultValue | RorDefaultValue | DoiDefaultValue
              | PubMedIdDefaultValue | RridDefaultValue | NihGrantIdDefaultValue
  // discriminator: kind

TextDefaultValue ::: object {
  "kind": "TextDefaultValue"
  value: TextValue
}

NumericDefaultValue ::: object {
  "kind": "NumericDefaultValue"
  value: NumericValue
}

DateDefaultValue ::: object {
  "kind": "DateDefaultValue"
  value: DateValue
}

TimeDefaultValue ::: object {
  "kind": "TimeDefaultValue"
  value: TimeValue
}

DateTimeDefaultValue ::: object {
  "kind": "DateTimeDefaultValue"
  value: DateTimeValue
}

ControlledTermDefaultValue ::: object {
  "kind": "ControlledTermDefaultValue"
  value: ControlledTermValue
}

ChoiceDefaultValue ::: object {
  "kind": "ChoiceDefaultValue"
  values: nonEmptyArray<ChoiceValue>
}
  // values is non-empty per grammar's ChoiceValue+

LinkDefaultValue ::: object {
  "kind": "LinkDefaultValue"
  value: LinkValue
}

EmailDefaultValue ::: object {
  "kind": "EmailDefaultValue"
  value: EmailValue
}

PhoneNumberDefaultValue ::: object {
  "kind": "PhoneNumberDefaultValue"
  value: PhoneNumberValue
}

OrcidDefaultValue ::: object {
  "kind": "OrcidDefaultValue"
  value: OrcidValue
}

RorDefaultValue ::: object {
  "kind": "RorDefaultValue"
  value: RorValue
}

DoiDefaultValue ::: object {
  "kind": "DoiDefaultValue"
  value: DoiValue
}

PubMedIdDefaultValue ::: object {
  "kind": "PubMedIdDefaultValue"
  value: PubMedIdValue
}

RridDefaultValue ::: object {
  "kind": "RridDefaultValue"
  value: RridValue
}

NihGrantIdDefaultValue ::: object {
  "kind": "NihGrantIdDefaultValue"
  value: NihGrantIdValue
}
```

### 7.7 Label override

```
LabelOverride ::: object {
  label: MultilingualString
  altLabels: array<MultilingualString>
}
  // altLabels MAY be empty
```

### 7.8 Properties

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

## 8. Field Specs

```
FieldSpec ::: TextFieldSpec | NumericFieldSpec | TemporalFieldSpec
            | ControlledTermFieldSpec | ChoiceFieldSpec | LinkFieldSpec
            | ContactFieldSpec | ExternalAuthorityFieldSpec
            | AttributeValueFieldSpec
  // discriminator: kind
  // TemporalFieldSpec, ChoiceFieldSpec, ContactFieldSpec, and
  // ExternalAuthorityFieldSpec are unions; their members supply
  // the kind discriminator directly

TextFieldSpec ::: object {
  "kind": "TextFieldSpec"
  defaultValue?: TextDefaultValue
  minLength?: number
  maxLength?: number
  validationRegex?: string
  renderingHint?: TextRenderingHint
}

NumericFieldSpec ::: object {
  "kind": "NumericFieldSpec"
  datatype: NumericDatatypeIri
  unit?: Unit
  numericPrecision?: number
  minValue?: NumericValue
  maxValue?: NumericValue
  renderingHint?: NumericRenderingHint
}

Unit ::: object {
  iri: string
  label?: MultilingualString
}

MinLength ::: number
MaxLength ::: number
ValidationRegex ::: string
NumericPrecision ::: number
NumericMinValue ::: NumericValue
NumericMaxValue ::: NumericValue
```

### 8.1 Temporal field specs

```
TemporalFieldSpec ::: DateFieldSpec | TimeFieldSpec | DateTimeFieldSpec
  // discriminator: kind

DateFieldSpec ::: object {
  "kind": "DateFieldSpec"
  dateValueType: DateValueType
  renderingHint?: DateRenderingHint
}

DateValueType ::: "year" | "yearMonth" | "fullDate"

YearValueType ::: "year"
YearMonthValueType ::: "yearMonth"
FullDateValueType ::: "fullDate"

TimeFieldSpec ::: object {
  "kind": "TimeFieldSpec"
  timePrecision?: TimePrecision
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: TimeRenderingHint
}

TimePrecision ::: "hourMinute" | "hourMinuteSecond" | "hourMinuteSecondFraction"

HourMinutePrecision ::: "hourMinute"
HourMinuteSecondPrecision ::: "hourMinuteSecond"
HourMinuteSecondFractionPrecision ::: "hourMinuteSecondFraction"

TimezoneRequirement ::: "required" | "notRequired"

TimezoneRequired ::: "required"
TimezoneNotRequired ::: "notRequired"

DateTimeFieldSpec ::: object {
  "kind": "DateTimeFieldSpec"
  dateTimeValueType: DateTimeValueType
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: DateTimeRenderingHint
}

DateTimeValueType ::: "dateHourMinute" | "dateHourMinuteSecond"
                    | "dateHourMinuteSecondFraction"

DateHourMinuteValueType ::: "dateHourMinute"
DateHourMinuteSecondValueType ::: "dateHourMinuteSecond"
DateHourMinuteSecondFractionValueType ::: "dateHourMinuteSecondFraction"

DateRenderingHint ::: object {
  componentOrder?: DateComponentOrder
}
  // grammar admits an optional DateFormat wrapping a DateComponentOrder;
  // on the wire the wrapper collapses to the bare componentOrder property

DateRenderingWidget ::: "datePicker"

DatePickerRenderingWidget ::: "datePicker"
  // grammar's DateRenderingHint carries a required DateRenderingWidget;
  // since there is exactly one widget value, the widget is omitted on the
  // wire and reconstructed at decode

DateFormat ::: DateComponentOrder
  // collapsed wrapper

DateComponentOrder ::: "dayMonthYear" | "monthDayYear" | "yearMonthDay"

DayMonthYearOrder ::: "dayMonthYear"
MonthDayYearOrder ::: "monthDayYear"
YearMonthDayOrder ::: "yearMonthDay"

TimeRenderingHint ::: object {
  timeFormat?: TimeFormat
}

TimeRenderingWidget ::: "timePicker"

TimePickerRenderingWidget ::: "timePicker"
  // widget omitted on the wire (single value); reconstructed at decode

DateTimeRenderingHint ::: object {
  timeFormat?: TimeFormat
}

DateTimeRenderingWidget ::: "dateTimePicker"

DateTimePickerRenderingWidget ::: "dateTimePicker"
  // widget omitted on the wire (single value); reconstructed at decode

TimeFormat ::: "twelveHour" | "twentyFourHour"

TwelveHourTimeFormat ::: "twelveHour"
TwentyFourHourTimeFormat ::: "twentyFourHour"
```

### 8.2 Controlled term field spec

```
ControlledTermFieldSpec ::: object {
  "kind": "ControlledTermFieldSpec"
  sources: nonEmptyArray<ControlledTermSource>
}
```

### 8.3 Choice field specs

```
ChoiceFieldSpec ::: SingleChoiceFieldSpec | MultipleChoiceFieldSpec
  // discriminator: kind

SingleChoiceFieldSpec ::: LiteralSingleChoiceFieldSpec
                        | ControlledTermSingleChoiceFieldSpec
  // discriminator: kind

MultipleChoiceFieldSpec ::: LiteralMultipleChoiceFieldSpec
                          | ControlledTermMultipleChoiceFieldSpec
  // discriminator: kind

LiteralSingleChoiceFieldSpec ::: object {
  "kind": "LiteralSingleChoiceFieldSpec"
  options: nonEmptyArray<LiteralChoiceOption>
  renderingHint?: SingleChoiceRenderingHint
}

ControlledTermSingleChoiceFieldSpec ::: object {
  "kind": "ControlledTermSingleChoiceFieldSpec"
  options: nonEmptyArray<ControlledTermChoiceOption>
  renderingHint?: SingleChoiceRenderingHint
}

LiteralMultipleChoiceFieldSpec ::: object {
  "kind": "LiteralMultipleChoiceFieldSpec"
  options: nonEmptyArray<LiteralChoiceOption>
  renderingHint?: MultipleChoiceRenderingHint
}

ControlledTermMultipleChoiceFieldSpec ::: object {
  "kind": "ControlledTermMultipleChoiceFieldSpec"
  options: nonEmptyArray<ControlledTermChoiceOption>
  renderingHint?: MultipleChoiceRenderingHint
}

LiteralChoiceOption ::: object {
  literal: Literal
  default?: true
}
  // default, when present, MUST be JSON true; omitted when not the default

ControlledTermChoiceOption ::: object {
  value: ControlledTermValue
  default?: true
}
  // value is encoded untagged at this singleton position
  // (the kind property of ControlledTermValue is omitted here)

DefaultOption ::: true
  // collapses on the wire to a JSON boolean true on the parent option
```

### 8.4 Other field specs

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

### 8.5 Controlled term sources

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

OntologyDisplayHintContent ::: OntologyDisplayHint
  // collapsed wrapper; the grammar's union of (acronym, name, both) is
  // expressed here by the optional-property combination on OntologyDisplayHint

BranchSource ::: object {
  "kind": "BranchSource"
  ontology: OntologyReference
  rootTermIri: string
  rootTermLabel: MultilingualString
  maxTraversalDepth?: number
}

ClassSource ::: object {
  "kind": "ClassSource"
  classes: nonEmptyArray<ControlledTermClass>
}

ControlledTermClass ::: object {
  term: string
  label: MultilingualString
  ontology: OntologyReference
}
  // term is a TermIri

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

### 8.6 Rendering hints

```
RenderingHint ::: TextRenderingHint | SingleChoiceRenderingHint
                | MultipleChoiceRenderingHint | NumericRenderingHint
                | DateRenderingHint | TimeRenderingHint | DateTimeRenderingHint
  // discriminator: position
  // resolved by the renderingHint property of the enclosing FieldSpec

TextRenderingHint ::: "singleLine" | "multiLine"

SingleLineTextRenderingHint ::: "singleLine"
MultiLineTextRenderingHint ::: "multiLine"

SingleChoiceRenderingHint ::: "radio" | "singleSelectDropdown"

RadioRenderingHint ::: "radio"
SingleSelectDropdownRenderingHint ::: "singleSelectDropdown"

MultipleChoiceRenderingHint ::: "checkbox" | "multiSelectDropdown"

CheckboxRenderingHint ::: "checkbox"
MultiSelectDropdownRenderingHint ::: "multiSelectDropdown"

NumericRenderingHint ::: "numericInput"

NumericInputRenderingHint ::: "numericInput"
```

`DateRenderingHint`, `TimeRenderingHint`, and `DateTimeRenderingHint`
are defined in §8.1; on the wire they are objects, while the simpler
text/choice/numeric hints are flat strings.

---

## 9. Field artifacts

```
Field ::: TextField | NumericField | DateField | TimeField | DateTimeField
        | ControlledTermField | SingleChoiceField | MultipleChoiceField
        | LinkField | EmailField | PhoneNumberField
        | OrcidField | RorField | DoiField | PubMedIdField
        | RridField | NihGrantIdField | AttributeValueField
  // discriminator: kind, then fieldKind
  // every member shares "kind": "Field" and is distinguished by fieldKind

TemporalField ::: DateField | TimeField | DateTimeField
  // discriminator: fieldKind (within "kind": "Field")
  // a documented intermediate category; the wire form is just the variant

ChoiceField ::: SingleChoiceField | MultipleChoiceField
  // discriminator: fieldKind (within "kind": "Field")

ContactField ::: EmailField | PhoneNumberField
  // discriminator: fieldKind (within "kind": "Field")

ExternalAuthorityField ::: OrcidField | RorField | DoiField
                         | PubMedIdField | RridField | NihGrantIdField
  // discriminator: fieldKind (within "kind": "Field")

TextField ::: object {
  "kind": "Field"
  "fieldKind": "Text"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: TextFieldSpec
}

NumericField ::: object {
  "kind": "Field"
  "fieldKind": "Numeric"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: NumericFieldSpec
}

DateField ::: object {
  "kind": "Field"
  "fieldKind": "Date"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DateFieldSpec
}

TimeField ::: object {
  "kind": "Field"
  "fieldKind": "Time"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: TimeFieldSpec
}

DateTimeField ::: object {
  "kind": "Field"
  "fieldKind": "DateTime"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DateTimeFieldSpec
}

ControlledTermField ::: object {
  "kind": "Field"
  "fieldKind": "ControlledTerm"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: ControlledTermFieldSpec
}

SingleChoiceField ::: object {
  "kind": "Field"
  "fieldKind": "SingleChoice"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: SingleChoiceFieldSpec
}

MultipleChoiceField ::: object {
  "kind": "Field"
  "fieldKind": "MultipleChoice"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: MultipleChoiceFieldSpec
}

LinkField ::: object {
  "kind": "Field"
  "fieldKind": "Link"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: LinkFieldSpec
}

EmailField ::: object {
  "kind": "Field"
  "fieldKind": "Email"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: EmailFieldSpec
}

PhoneNumberField ::: object {
  "kind": "Field"
  "fieldKind": "PhoneNumber"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: PhoneNumberFieldSpec
}

OrcidField ::: object {
  "kind": "Field"
  "fieldKind": "Orcid"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: OrcidFieldSpec
}

RorField ::: object {
  "kind": "Field"
  "fieldKind": "Ror"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: RorFieldSpec
}

DoiField ::: object {
  "kind": "Field"
  "fieldKind": "Doi"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: DoiFieldSpec
}

PubMedIdField ::: object {
  "kind": "Field"
  "fieldKind": "PubMedId"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: PubMedIdFieldSpec
}

RridField ::: object {
  "kind": "Field"
  "fieldKind": "Rrid"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: RridFieldSpec
}

NihGrantIdField ::: object {
  "kind": "Field"
  "fieldKind": "NihGrantId"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: NihGrantIdFieldSpec
}

AttributeValueField ::: object {
  "kind": "Field"
  "fieldKind": "AttributeValue"
  id: string
  metadata: SchemaArtifactMetadata
  fieldSpec: AttributeValueFieldSpec
}
```

---

## 10. Embedded artifacts

```
EmbeddedArtifact ::: EmbeddedField | EmbeddedTemplate
                   | EmbeddedPresentationComponent
  // discriminator: kind

EmbeddedField ::: EmbeddedTextField | EmbeddedNumericField
                | EmbeddedDateField | EmbeddedTimeField | EmbeddedDateTimeField
                | EmbeddedControlledTermField
                | EmbeddedSingleChoiceField | EmbeddedMultipleChoiceField
                | EmbeddedLinkField
                | EmbeddedEmailField | EmbeddedPhoneNumberField
                | EmbeddedOrcidField | EmbeddedRorField | EmbeddedDoiField
                | EmbeddedPubMedIdField | EmbeddedRridField
                | EmbeddedNihGrantIdField
                | EmbeddedAttributeValueField
  // discriminator: kind ("EmbeddedField"), then fieldKind

EmbeddedTextField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Text"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TextDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedNumericField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Numeric"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: NumericDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedDateField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Date"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedTimeField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Time"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TimeDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedDateTimeField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "DateTime"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateTimeDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedControlledTermField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "ControlledTerm"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: ControlledTermDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedSingleChoiceField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "SingleChoice"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: ChoiceDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedMultipleChoiceField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "MultipleChoice"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: ChoiceDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedLinkField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Link"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: LinkDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedEmailField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Email"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: EmailDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPhoneNumberField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "PhoneNumber"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PhoneNumberDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedOrcidField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Orcid"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: OrcidDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedRorField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Ror"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RorDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedDoiField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Doi"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DoiDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPubMedIdField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "PubMedId"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PubMedIdDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedRridField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "Rrid"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RridDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedNihGrantIdField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "NihGrantId"
  key: string
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: NihGrantIdDefaultValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedAttributeValueField ::: object {
  "kind": "EmbeddedField"
  "fieldKind": "AttributeValue"
  key: string
  reference: string
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
  reference: string
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPresentationComponent ::: object {
  "kind": "EmbeddedPresentationComponent"
  key: string
  reference: string
  visibility?: Visibility
  labelOverride?: LabelOverride
}
```

---

## 11. Presentation Components

```
PresentationComponent ::: RichTextComponent | ImageComponent
                        | YoutubeVideoComponent
                        | SectionBreakComponent | PageBreakComponent
  // discriminator: kind

RichTextComponent ::: object {
  "kind": "RichTextComponent"
  id: string
  metadata: ArtifactMetadata
  html: string
}

ImageComponent ::: object {
  "kind": "ImageComponent"
  id: string
  metadata: ArtifactMetadata
  image: string
}

YoutubeVideoComponent ::: object {
  "kind": "YoutubeVideoComponent"
  id: string
  metadata: ArtifactMetadata
  video: string
}

SectionBreakComponent ::: object {
  "kind": "SectionBreakComponent"
  id: string
  metadata: ArtifactMetadata
}

PageBreakComponent ::: object {
  "kind": "PageBreakComponent"
  id: string
  metadata: ArtifactMetadata
}

HtmlContent ::: string
ImageSource ::: Iri
YoutubeVideoSource ::: Iri
```

---

## 12. Templates and Top-Level Artifacts

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
  metadata: SchemaArtifactMetadata
  header?: MultilingualString
  footer?: MultilingualString
  embedded: array<EmbeddedArtifact>
}
  // EmbeddedArtifact keys (each member's `key` property) MUST be unique
  // within `embedded` (per grammar.md §Embedded Artifact Key)
  // the order of `embedded` MUST be preserved

Header ::: MultilingualString
Footer ::: MultilingualString
```

---

## 13. Instances

```
TemplateInstance ::: object {
  "kind": "TemplateInstance"
  id: string
  metadata: ArtifactMetadata
  templateRef: string
  values: array<InstanceValue>
}
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

## 14. Cross-reference

For the JSON-encoding rules that frame this grammar — property naming
(lowerCamelCase), Unicode normalisation, big-integer string fallback,
implementation-extension prefixes, and worked end-to-end examples —
see [`serialization.md`](serialization.md). For the abstract grammar
this file mirrors, see [`grammar.md`](grammar.md). For conformance
rules, see [`validation.md`](validation.md).
