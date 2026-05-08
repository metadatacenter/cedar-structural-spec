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

> **Status: hand-maintained, eventually generated.** This file is
> currently authored in lock-step with `grammar.md`. The longer-term
> direction is to derive it mechanically from `grammar.md` plus the
> property-name map (§14) plus the encoding rules (§1.7). Until that
> generator exists, the file is hand-maintained; the §14 property-name
> map and the §1.7 encoding rules together define what such a
> generator would need to know.

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

Two discrimination strategies are recognised, declared inline:

- `discriminator: kind` — every member is an object production whose
  shape includes a `kind: "MemberName"` literal property. Decoders pick
  the variant by reading `kind`.
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

A *typed singleton wrapper* is an abstract grammar production whose
constructor form has exactly one component, where that component is
itself either a primitive lexical category (string, number, boolean)
or another typed singleton wrapper. For example:

```ebnf
Iri        ::= iri(IriString)
TemplateId ::= template_id(IriString)
Label      ::= label(MultilingualString)
```

In the abstract grammar these productions exist to give a primitive
value a *role* — `Iri` is a syntactically valid IRI, `TemplateId` is
specifically the identifier of a template, `Label` is a label rather
than an arbitrary multilingual string. The abstract grammar treats
these roles as distinct types so that, e.g., a `TemplateId` cannot
be substituted for a `FieldId` even though both reduce to a string at
the wire level.

On the wire, however, this typed-role information is recovered from
the surrounding context (the property name and the abstract grammar
production at that slot). The wrapper therefore collapses to its inner
type at encode time and disappears from the JSON, leaving only the
underlying primitive value. The wire grammar still names the wrapper
production where the abstract grammar does, so that slot types in
composite productions remain isomorphic to the abstract grammar's
component types — but the wrapper's wire form `:::` is whatever JSON
primitive (or already-collapsed production) it carries.

The wrappers fall into four groups by inner type:

- **IRI-typed** (`string`, syntactically valid IRI per RFC 3987):
  `Iri`, `TermIri`, every `XxxFieldId`, `TemplateId`,
  `TemplateInstanceId`, `PresentationComponentId`, `PropertyIri`,
  `OrcidIri`, `RorIri`, `DoiIri`, `PubMedIri`, `RridIri`,
  `NihGrantIri`, `OntologyIri`, `RootTermIri`, `ValueSetIri`,
  `PreviousVersion`, `DerivedFrom`, `CreatedBy`, `ModifiedBy`.
- **Other strings** (`string`): `LanguageTag`, `LexicalForm`,
  `IsoDateTimeStamp`, `OntologyAcronym`, `ValueSetIdentifier`,
  `Notation`, `Identifier`, `AttributeName`, `HtmlContent`,
  `EmbeddedArtifactKey`, `ValidationRegex`, `Token`,
  `Version`, `ModelVersion`, `CreatedOn`, `ModifiedOn`.
- **Numbers**: `NonNegativeInteger`, `MinCardinality`, `MaxCardinality`,
  `MinLength`, `MaxLength`, `DecimalPlaces`, `MaxTraversalDepth`.
- **MultilingualString-typed**: `Name`, `Description`, `PreferredLabel`,
  `AlternativeLabel`, `Label`, `PropertyLabel`, `OntologyName`,
  `ValueSetName`, `RootTermLabel`, `Header`, `Footer`.

`Version` and `ModelVersion` carry SemanticVersion 2.0.0 lexical
strings. `CreatedOn` and `ModifiedOn` carry ISO 8601 date-time
lexical strings. `CreatedBy`, `ModifiedBy`, `PreviousVersion`, and
`DerivedFrom` carry IRIs.

### 1.7 Encoding rules

This section summarises the rules a generator would apply to derive
wire-grammar.md from `grammar.md` plus the property-name map (§14).
The rules are also the framing under which the file should be read:
each `:::` production in the rest of the file is what these rules
produce when applied to the corresponding `::=` production in
`grammar.md`.

1. **Production naming.** Every abstract production `XxxYyy ::= ...`
   in `grammar.md` becomes a wire production `XxxYyy ::: ...` with the
   same name.

2. **Object-form productions.** A production that composes one or more
   named components encodes as `object { ... }` with property names
   drawn from the property-name map (§14). When such a production is a
   member of a kind-discriminated union, its object additionally carries
   `"kind": "XxxYyy"` (see rule 7).

3. **Optional components.** A grammar.md `[X]` component becomes an
   optional wire property `prop?: X` and is omitted from the JSON when
   absent.

4. **Repeated components.** A grammar.md `X*` becomes a wire
   `array<X>`; a grammar.md `X+` becomes a wire `nonEmptyArray<X>`.
   Some sequence positions are encoded as omittable optional arrays per
   the wrapping principle of `serialization.md` §5 — `altLabels?:
   array<AlternativeLabel>` and `annotations?: array<Annotation>` on
   `ArtifactMetadata` and `SchemaArtifactMetadata` are SHOULD-omitted
   when empty, and the spec-level `MultiValuedEnumFieldSpec.defaultValues`
   is similarly optional. These exceptions are flagged at the
   production sites with inline constraints.

5. **Collapsed wrappers.** Productions whose abstract form is a
   single-component wrapper around a primitive collapse to that
   primitive on the wire (§1.6). Their `:::` definitions remain in this
   file for completeness and for use as type names at slot positions in
   composite productions: every slot in an `object { ... }` is typed
   with the abstract grammar's component name (e.g. `key:
   EmbeddedArtifactKey` rather than `key: string`). This makes the wire
   form's slot types isomorphic to the abstract grammar's component
   types, even where the encoding bottoms out at a JSON primitive.

6. **Discriminator strategies.** Two strategies are recognised, declared
   inline on the union: `discriminator: kind` (default) and
   `discriminator: position`. See §1.3.

7. **The polymorphic-only kind rule.** A `kind: "X"` literal property
   appears on a wire object only when that object is a member of a
   `discriminator: kind` union. At singleton positions the production
   is encoded as a plain `object { ... }` with no `kind` property. See
   §1.5 for the full statement (including its application at
   `EmbeddedXxxField.defaultValue`).

8. **Primitive bottom-out.** Where the abstract grammar uses a bare
   primitive type (`string`, `boolean`, `number`) without a typed
   wrapper, the wire form uses that primitive directly (e.g.
   `Cardinality.min: number`, `BooleanValue.value: boolean`).

The wrapping principle that underlies rule 5 is given normatively in
[`serialization.md`](serialization.md) §5; this section restates only
the form in which it appears in the wire grammar.

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
  // model where the grammar uses Iri the wire form is a JSON string.

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
  // NumericValue, DateValue, and ExternalAuthorityValue are themselves
  // unions; their members supply the kind discriminator directly

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
  value: LexicalForm
  lang?: LanguageTag
}
  // lang, when present, MUST be a well-formed BCP 47 tag
  // value MUST be in Unicode Normalization Form C

IntegerNumberValue ::: object {
  "kind": "IntegerNumberValue"
  value: LexicalForm
}
  // value is a base-10 integer lexical form
  // datatype is implicit (xsd:integer) and not carried on the wire

RealNumberValue ::: object {
  "kind": "RealNumberValue"
  value: LexicalForm
  datatype: RealNumberDatatypeKind
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
  value: LexicalForm
}
  // value matches YYYY

YearMonthValue ::: object {
  "kind": "YearMonthValue"
  value: LexicalForm
}
  // value matches YYYY-MM

FullDateValue ::: object {
  "kind": "FullDateValue"
  value: LexicalForm
}
  // value is an xsd:date lexical form (YYYY-MM-DD with optional zone)

TimeValue ::: object {
  "kind": "TimeValue"
  value: LexicalForm
}
  // value is an xsd:time lexical form

DateTimeValue ::: object {
  "kind": "DateTimeValue"
  value: LexicalForm
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
  term: TermIri
  label?: Label
  notation?: Notation
  preferredLabel?: PreferredLabel
}
  // term is a TermIri (an Iri identifying the term)
```

### 3.4 Enum value

```
EnumValue ::: object {
  "kind": "EnumValue"
  value: Token
}
  // value is the canonical Token of one of the referenced
  // EnumFieldSpec's PermissibleValue entries
  // value MUST be a non-empty Unicode string
```

`EnumValue.value` carries the wire-form of the abstract grammar's
`Token` slot — the wire property name is `value` for consistency with
other `Value` variants, while the abstract production names the slot
`Token`. `Token` is defined in §7 alongside `PermissibleValue`.

### 3.5 Link value

```
LinkValue ::: object {
  "kind": "LinkValue"
  iri: Iri
  label?: Label
}
```

### 3.6 Contact values

```
EmailValue ::: object {
  "kind": "EmailValue"
  value: LexicalForm
}

PhoneNumberValue ::: object {
  "kind": "PhoneNumberValue"
  value: LexicalForm
}
```

### 3.7 External authority values

```
ExternalAuthorityValue ::: OrcidValue | RorValue | DoiValue
                         | PubMedIdValue | RridValue | NihGrantIdValue
  // discriminator: kind

OrcidValue ::: object {
  "kind": "OrcidValue"
  iri: OrcidIri
  label?: Label
}

RorValue ::: object {
  "kind": "RorValue"
  iri: RorIri
  label?: Label
}

DoiValue ::: object {
  "kind": "DoiValue"
  iri: DoiIri
  label?: Label
}

PubMedIdValue ::: object {
  "kind": "PubMedIdValue"
  iri: PubMedIri
  label?: Label
}

RridValue ::: object {
  "kind": "RridValue"
  iri: RridIri
  label?: Label
}

NihGrantIdValue ::: object {
  "kind": "NihGrantIdValue"
  iri: NihGrantIri
  label?: Label
}
```

The typed external-authority IRI productions collapse to plain string
IRIs on the wire — see §1.6.

```
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
  name: AttributeName
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

The same identifier productions serve at both the **definition site**
of a reusable artifact (e.g. `Field.id`, `Template.id`) and the
**reference site** where it is embedded (e.g.
`EmbeddedField.artifactRef`, `EmbeddedTemplate.artifactRef`); the
abstract grammar does not distinguish reference-typed productions from
identity-typed ones, and on the wire both positions encode as a plain
IRI string.

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
  name: Name
  description?: Description
  identifier?: Identifier
  preferredLabel?: PreferredLabel
  altLabels?: array<AlternativeLabel>
  lifecycle: LifecycleMetadata
  annotations?: array<Annotation>
}
  // altLabels SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // annotations SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // the grammar's Name, Description, PreferredLabel, and AlternativeLabel
  // productions are MultilingualString-typed wrappers that collapse on
  // the wire (§1.6); the type names appear here for parity with the
  // abstract grammar's component naming
```

`SchemaArtifactMetadata` is the wire form used by reusable schema
artifacts. It is the flat union of `ArtifactMetadata`'s properties
plus a `versioning` slot — there is no inner `artifact` wrapper.

```
SchemaArtifactMetadata ::: object {
  name: Name
  description?: Description
  identifier?: Identifier
  preferredLabel?: PreferredLabel
  altLabels?: array<AlternativeLabel>
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
  createdOn: CreatedOn
  createdBy: CreatedBy
  modifiedOn: ModifiedOn
  modifiedBy: ModifiedBy
}
  // createdOn and modifiedOn carry IsoDateTimeStamp values
  // createdBy and modifiedBy carry agent Iri values
```

### 5.3 Schema versioning

```
SchemaArtifactVersioning ::: object {
  version: Version
  status: Status
  previousVersion?: PreviousVersion
  derivedFrom?: DerivedFrom
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
  property: Iri
  body: AnnotationValue
}
  // property is the annotation-property Iri (the grammar's bare Iri
  // collapses to a string at this singleton position)

AnnotationValue ::: AnnotationStringValue | AnnotationIriValue
  // discriminator: kind

AnnotationStringValue ::: object {
  "kind": "AnnotationStringValue"
  value: LexicalForm
  lang?: LanguageTag
}
  // lang, when present, MUST be a well-formed BCP 47 tag
  // value MUST be in Unicode Normalization Form C

AnnotationIriValue ::: object {
  "kind": "AnnotationIriValue"
  iri: Iri
}
  // iri carries an Iri value (RFC 3987)
```

---

## 6. Embedded Artifact Properties

### 6.1 Embedded artifact key

```
EmbeddedArtifactKey ::: string
  // matches the pattern [A-Za-z][A-Za-z0-9_-]*
  // unique within the containing Template (constraint enforced on Template)
```

### 6.2 Requirements

```
ValueRequirement ::: "required" | "recommended" | "optional"
```

### 6.3 Cardinality

```
Cardinality ::: object {
  min: MinCardinality
  max?: MaxCardinality
}
  // min is a non-negative integer
  // max omitted ⇒ unbounded above (per grammar.md §Cardinality)

MinCardinality ::: number
MaxCardinality ::: number
```

### 6.4 Visibility

```
Visibility ::: "visible" | "hidden"
```

### 6.5 Defaults

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

### 6.6 Label override

```
LabelOverride ::: object {
  label: Label
  altLabels: array<AlternativeLabel>
}
  // altLabels MAY be empty
```

### 6.7 Properties

```
Property ::: object {
  iri: PropertyIri
  label?: PropertyLabel
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
  minLength?: MinLength
  maxLength?: MaxLength
  validationRegex?: ValidationRegex
  renderingHint?: TextRenderingHint
}
  // defaultValue, when present, encodes as a TextValue with kind
  // dropped at this singleton position (i.e. `{ value, lang? }`).
  // TextFieldSpec is the only FieldSpec that carries a defaultValue
  // slot (see §6.5).

IntegerNumberFieldSpec ::: object {
  "kind": "IntegerNumberFieldSpec"
  unit?: Unit
  minValue?: IntegerNumberMinValue
  maxValue?: IntegerNumberMaxValue
  renderingHint?: NumericRenderingHint
}

RealNumberFieldSpec ::: object {
  "kind": "RealNumberFieldSpec"
  datatype: RealNumberDatatypeKind
  unit?: Unit
  minValue?: RealNumberMinValue
  maxValue?: RealNumberMaxValue
  renderingHint?: NumericRenderingHint
}

BooleanFieldSpec ::: object {
  "kind": "BooleanFieldSpec"
  renderingHint?: BooleanRenderingHint
}

Unit ::: object {
  iri: Iri
  label?: Label
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
  defaultValue?: Token
  renderingHint?: SingleValuedEnumRenderingHint
}
  // defaultValue, when present, MUST equal the `value` of one of the
  // permissibleValues entries

MultiValuedEnumFieldSpec ::: object {
  "kind": "MultiValuedEnumFieldSpec"
  permissibleValues: nonEmptyArray<PermissibleValue>
  defaultValues?: array<Token>
  renderingHint?: MultiValuedEnumRenderingHint
}
  // defaultValues, when present, MUST be a (possibly empty) array of
  // Token values each equal to the `value` of one of the
  // permissibleValues entries; the array MUST NOT contain duplicates

PermissibleValue ::: object {
  value: Token
  label?: Label
  description?: Description
  meanings?: array<Meaning>
}
  // value carries the canonical Token of the permissible value and
  // MUST be a non-empty Unicode string
  // value MUST be unique within the enclosing spec's permissibleValues
  // meanings, when present, is a (possibly empty) array of Meaning
  // objects binding the token to ontology terms; SHOULD be omitted
  // when empty

Token ::: string
  // a non-empty Unicode string serving as the canonical key of a
  // PermissibleValue or the value carried by an EnumValue

Meaning ::: object {
  iri: TermIri
  label?: Label
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
  iri: OntologyIri
  displayHint?: OntologyDisplayHint
}

OntologyDisplayHint ::: object {
  acronym?: OntologyAcronym
  name?: OntologyName
}
  // at least one of acronym, name MUST be present

BranchSource ::: object {
  "kind": "BranchSource"
  ontology: OntologyReference
  rootTermIri: RootTermIri
  rootTermLabel?: RootTermLabel
  maxTraversalDepth?: MaxTraversalDepth
}
  // rootTermLabel SHOULD be present (captured at source-declaration time)
  // but MAY be omitted when the term's display text is not available

ClassSource ::: object {
  "kind": "ClassSource"
  classes: nonEmptyArray<ControlledTermClass>
}

ControlledTermClass ::: object {
  term: TermIri
  label?: Label
  ontology: OntologyReference
}
  // term is a TermIri
  // label SHOULD be present (captured at source-declaration time)
  // but MAY be omitted when the term's display text is not available

ValueSetSource ::: object {
  "kind": "ValueSetSource"
  identifier: ValueSetIdentifier
  name?: ValueSetName
  iri?: ValueSetIri
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

The leaf productions used by the controlled-term sources collapse on
the wire per §1.6; their `:::` definitions are listed alongside the
source productions for slot-type reference.

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
  decimalPlaces?: DecimalPlaces
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
  id: TextFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: TextFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

IntegerNumberField ::: object {
  "kind": "IntegerNumberField"
  id: IntegerNumberFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: IntegerNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RealNumberField ::: object {
  "kind": "RealNumberField"
  id: RealNumberFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: RealNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

BooleanField ::: object {
  "kind": "BooleanField"
  id: BooleanFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: BooleanFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateField ::: object {
  "kind": "DateField"
  id: DateFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: DateFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

TimeField ::: object {
  "kind": "TimeField"
  id: TimeFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: TimeFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateTimeField ::: object {
  "kind": "DateTimeField"
  id: DateTimeFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: DateTimeFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ControlledTermField ::: object {
  "kind": "ControlledTermField"
  id: ControlledTermFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: ControlledTermFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

SingleValuedEnumField ::: object {
  "kind": "SingleValuedEnumField"
  id: SingleValuedEnumFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: SingleValuedEnumFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

MultiValuedEnumField ::: object {
  "kind": "MultiValuedEnumField"
  id: MultiValuedEnumFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: MultiValuedEnumFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

LinkField ::: object {
  "kind": "LinkField"
  id: LinkFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: LinkFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

EmailField ::: object {
  "kind": "EmailField"
  id: EmailFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: EmailFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PhoneNumberField ::: object {
  "kind": "PhoneNumberField"
  id: PhoneNumberFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: PhoneNumberFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

OrcidField ::: object {
  "kind": "OrcidField"
  id: OrcidFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: OrcidFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RorField ::: object {
  "kind": "RorField"
  id: RorFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: RorFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DoiField ::: object {
  "kind": "DoiField"
  id: DoiFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: DoiFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PubMedIdField ::: object {
  "kind": "PubMedIdField"
  id: PubMedIdFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: PubMedIdFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RridField ::: object {
  "kind": "RridField"
  id: RridFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: RridFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

NihGrantIdField ::: object {
  "kind": "NihGrantIdField"
  id: NihGrantIdFieldId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  fieldSpec: NihGrantIdFieldSpec
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

AttributeValueField ::: object {
  "kind": "AttributeValueField"
  id: AttributeValueFieldId
  modelVersion: ModelVersion
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
  key: EmbeddedArtifactKey
  artifactRef: TextFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TextValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedIntegerNumberField ::: object {
  "kind": "EmbeddedIntegerNumberField"
  key: EmbeddedArtifactKey
  artifactRef: IntegerNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: IntegerNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedRealNumberField ::: object {
  "kind": "EmbeddedRealNumberField"
  key: EmbeddedArtifactKey
  artifactRef: RealNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RealNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedBooleanField ::: object {
  "kind": "EmbeddedBooleanField"
  key: EmbeddedArtifactKey
  artifactRef: BooleanFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: DateFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedTimeField ::: object {
  "kind": "EmbeddedTimeField"
  key: EmbeddedArtifactKey
  artifactRef: TimeFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TimeValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedDateTimeField ::: object {
  "kind": "EmbeddedDateTimeField"
  key: EmbeddedArtifactKey
  artifactRef: DateTimeFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateTimeValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedControlledTermField ::: object {
  "kind": "EmbeddedControlledTermField"
  key: EmbeddedArtifactKey
  artifactRef: ControlledTermFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: SingleValuedEnumFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: MultiValuedEnumFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: LinkFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: EmailFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: EmailValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPhoneNumberField ::: object {
  "kind": "EmbeddedPhoneNumberField"
  key: EmbeddedArtifactKey
  artifactRef: PhoneNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PhoneNumberValue
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedOrcidField ::: object {
  "kind": "EmbeddedOrcidField"
  key: EmbeddedArtifactKey
  artifactRef: OrcidFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: RorFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: DoiFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: PubMedIdFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: RridFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: NihGrantIdFieldId
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
  key: EmbeddedArtifactKey
  artifactRef: AttributeValueFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  labelOverride?: LabelOverride
  property?: Property
}
  // attribute-value embeddings carry no defaultValue per grammar.md

EmbeddedTemplate ::: object {
  "kind": "EmbeddedTemplate"
  key: EmbeddedArtifactKey
  artifactRef: TemplateId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  labelOverride?: LabelOverride
  property?: Property
}

EmbeddedPresentationComponent ::: object {
  "kind": "EmbeddedPresentationComponent"
  key: EmbeddedArtifactKey
  artifactRef: PresentationComponentId
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
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: ArtifactMetadata
  html: HtmlContent
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ImageComponent ::: object {
  "kind": "ImageComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: ArtifactMetadata
  image: Iri
  label?: Label
  description?: Description
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // image is an Iri identifying the image resource
  // label, when present, is short alt-text accessibility metadata
  // description, when present, is longer accessibility-focused text

YoutubeVideoComponent ::: object {
  "kind": "YoutubeVideoComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: ArtifactMetadata
  video: Iri
  label?: Label
  description?: Description
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // video is an Iri identifying the video resource
  // label, when present, is short alt-text / caption-title accessibility metadata
  // description, when present, is longer accessibility-focused text

SectionBreakComponent ::: object {
  "kind": "SectionBreakComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: ArtifactMetadata
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PageBreakComponent ::: object {
  "kind": "PageBreakComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
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
  id: TemplateId
  modelVersion: ModelVersion
  metadata: SchemaArtifactMetadata
  header?: Header
  footer?: Footer
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
  id: TemplateInstanceId
  modelVersion: ModelVersion
  metadata: ArtifactMetadata
  templateRef: TemplateId
  values: array<InstanceValue>
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // metadata is ArtifactMetadata, not SchemaArtifactMetadata
  // (instances do not carry schema versioning)

InstanceValue ::: FieldValue | NestedTemplateInstance
  // discriminator: kind

FieldValue ::: object {
  "kind": "FieldValue"
  key: EmbeddedArtifactKey
  values: nonEmptyArray<Value>
}
  // values MUST be non-empty (per grammar's Value+; absence of a value is
  // represented by omitting the FieldValue entirely)

NestedTemplateInstance ::: object {
  "kind": "NestedTemplateInstance"
  key: EmbeddedArtifactKey
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

---

## 14. Property-name map

This section makes the implicit map between abstract grammar component
slots and JSON property names explicit. Each entry lists, for one
abstract production, the abstract component types in their
grammar-defined order paired with the wire property name used to encode
that component.

The list covers every abstract production in `grammar.md` that has at
least one component. Productions whose abstract form has no components
(e.g. `EmailFieldSpec ::= email_field_spec()`) and pure-union or
enum-string productions (e.g. `Value`, `ValueRequirement`) carry no
property-name mapping and are not listed.

Conventions:

- Component order follows `grammar.md`. Component-index numbering is
  zero-based.
- Optional `[X]` and repeated `X*` / `X+` components are noted
  alongside the component type.
- Where the wire form omits the abstract grammar's own kind
  discriminator (e.g. `EmbeddedXxxField.defaultValue` at a
  singleton-position `Value` slot, per §1.5), the mapping records the
  wire property name that the discriminator-bearing or
  discriminator-stripped object lives under.

### 14.1 Top-level artifacts and templates

**`Template`** (`template`):
0. `TemplateId` → `id`
1. `ModelVersion` → `modelVersion`
2. `SchemaArtifactMetadata` → `metadata`
3. `[Header]` → `header?`
4. `[Footer]` → `footer?`
5. `EmbeddedArtifact*` → `members`

**`TemplateInstance`** (`template_instance`):
0. `TemplateInstanceId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`
3. `TemplateId` → `templateRef`
4. `InstanceValue*` → `values`

### 14.2 Field artifacts

Every concrete `Field` production has the same four-component shape:
`(<Family>FieldId, ModelVersion, SchemaArtifactMetadata, <Family>FieldSpec)`.
For all of `TextField`, `IntegerNumberField`, `RealNumberField`,
`BooleanField`, `DateField`, `TimeField`, `DateTimeField`,
`ControlledTermField`, `SingleValuedEnumField`, `MultiValuedEnumField`,
`LinkField`, `EmailField`, `PhoneNumberField`, `OrcidField`,
`RorField`, `DoiField`, `PubMedIdField`, `RridField`,
`NihGrantIdField`, and `AttributeValueField`:

0. `<Family>FieldId` → `id`
1. `ModelVersion` → `modelVersion`
2. `SchemaArtifactMetadata` → `metadata`
3. `<Family>FieldSpec` → `fieldSpec`

### 14.3 Embedded artifacts

Every concrete `EmbeddedXxxField` production follows the same pattern,
with the per-family typed-id and typed-default-value slots:

0. `EmbeddedArtifactKey` → `key`
1. `<Family>FieldId` → `artifactRef`
2. `[ValueRequirement]` → `valueRequirement?`
3. `[Cardinality]` → `cardinality?` (omitted on `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField`)
4. `[Visibility]` → `visibility?`
5. `[<Family>Value]` → `defaultValue?` (omitted on `EmbeddedAttributeValueField`; on `EmbeddedMultiValuedEnumField` the slot is `EnumValue*` → `defaultValue?: array<EnumValue>`)
6. `[LabelOverride]` → `labelOverride?`
7. `[Property]` → `property?`

(Component indices are renumbered to skip slots a particular family
omits, per the per-family abstract production. The list above gives the
canonical ordering common to the family.)

**`EmbeddedTemplate`** (`embedded_template`):
0. `EmbeddedArtifactKey` → `key`
1. `TemplateId` → `artifactRef`
2. `[ValueRequirement]` → `valueRequirement?`
3. `[Cardinality]` → `cardinality?`
4. `[Visibility]` → `visibility?`
5. `[LabelOverride]` → `labelOverride?`
6. `[Property]` → `property?`

**`EmbeddedPresentationComponent`** (`embedded_presentation_component`):
0. `EmbeddedArtifactKey` → `key`
1. `PresentationComponentId` → `artifactRef`
2. `[Visibility]` → `visibility?`

### 14.4 Artifact metadata

**`SchemaArtifactMetadata`** (`schema_artifact_metadata`): the wire
form is a flat union — `ArtifactMetadata`'s components appear directly
on the same object alongside `versioning`. The mapping below records
the abstract production's two components, but the encoded wire form is
the union of the inner `ArtifactMetadata` properties plus
`versioning`:
0. `ArtifactMetadata` → (flattened — properties appear directly)
1. `SchemaArtifactVersioning` → `versioning`

**`ArtifactMetadata`** (`artifact_metadata`):
0. `Name` → `name`
1. `[Description]` → `description?`
2. `[Identifier]` → `identifier?`
3. `[PreferredLabel]` → `preferredLabel?`
4. `AlternativeLabel*` → `altLabels?` (SHOULD-omitted when empty per §1.7 rule 4)
5. `LifecycleMetadata` → `lifecycle`
6. `Annotation*` → `annotations?` (SHOULD-omitted when empty)

**`LifecycleMetadata`** (`lifecycle_metadata`):
0. `CreatedOn` → `createdOn`
1. `CreatedBy` → `createdBy`
2. `ModifiedOn` → `modifiedOn`
3. `ModifiedBy` → `modifiedBy`

**`SchemaArtifactVersioning`** (`schema_artifact_versioning`):
0. `Version` → `version`
1. `Status` → `status`
2. `[PreviousVersion]` → `previousVersion?`
3. `[DerivedFrom]` → `derivedFrom?`

**`Annotation`** (`annotation`):
0. `Iri` → `property`
1. `AnnotationValue` → `body`

**`AnnotationStringValue`** (`annotation_string_value`):
0. `LexicalForm` → `value`
1. `[LanguageTag]` → `lang?`

**`AnnotationIriValue`** (`annotation_iri_value`):
0. `Iri` → `iri`

### 14.5 Embedded artifact properties

**`Cardinality`** (`cardinality`):
0. `MinCardinality` → `min`
1. `[MaxCardinality]` → `max?`

**`LabelOverride`** (`label_override`):
0. `Label` → `label`
1. `AlternativeLabel*` → `altLabels`

**`Property`** (`property`):
0. `PropertyIri` → `iri`
1. `[PropertyLabel]` → `label?`

### 14.6 Multilingual strings

**`LangString`** (`lang_string`):
0. `string` → `value`
1. `Bcp47Tag` → `lang`

### 14.7 Values

**`TextValue`** (`text_value`):
0. `LexicalForm` → `value`
1. `[LanguageTag]` → `lang?`

**`IntegerNumberValue`** (`integer_number_value`):
0. `LexicalForm` → `value`

**`RealNumberValue`** (`real_number_value`):
0. `LexicalForm` → `value`
1. `RealNumberDatatypeKind` → `datatype`

**`BooleanValue`** (`boolean_value`):
0. `boolean` → `value`

**`YearValue`** (`year_value`):
0. `LexicalForm` → `value`

**`YearMonthValue`** (`year_month_value`):
0. `LexicalForm` → `value`

**`FullDateValue`** (`full_date_value`):
0. `LexicalForm` → `value`

**`TimeValue`** (`time_value`):
0. `LexicalForm` → `value`

**`DateTimeValue`** (`date_time_value`):
0. `LexicalForm` → `value`

**`ControlledTermValue`** (`controlled_term_value`):
0. `TermIri` → `term`
1. `[Label]` → `label?`
2. `[Notation]` → `notation?`
3. `[PreferredLabel]` → `preferredLabel?`

**`EnumValue`** (`enum_value`):
0. `Token` → `value`

**`LinkValue`** (`link_value`):
0. `Iri` → `iri`
1. `[Label]` → `label?`

**`EmailValue`** (`email_value`):
0. `LexicalForm` → `value`

**`PhoneNumberValue`** (`phone_number_value`):
0. `LexicalForm` → `value`

**`OrcidValue`** (`orcid_value`):
0. `OrcidIri` → `iri`
1. `[Label]` → `label?`

**`RorValue`** (`ror_value`):
0. `RorIri` → `iri`
1. `[Label]` → `label?`

**`DoiValue`** (`doi_value`):
0. `DoiIri` → `iri`
1. `[Label]` → `label?`

**`PubMedIdValue`** (`pub_med_id_value`):
0. `PubMedIri` → `iri`
1. `[Label]` → `label?`

**`RridValue`** (`rrid_value`):
0. `RridIri` → `iri`
1. `[Label]` → `label?`

**`NihGrantIdValue`** (`nih_grant_id_value`):
0. `NihGrantIri` → `iri`
1. `[Label]` → `label?`

**`AttributeValue`** (`attribute_value`):
0. `AttributeName` → `name`
1. `Value` → `value`

### 14.8 Field specs

**`TextFieldSpec`** (`text_field_spec`):
0. `[TextValue]` → `defaultValue?`
1. `[MinLength]` → `minLength?`
2. `[MaxLength]` → `maxLength?`
3. `[ValidationRegex]` → `validationRegex?`
4. `[TextRenderingHint]` → `renderingHint?`

**`IntegerNumberFieldSpec`** (`integer_number_field_spec`):
0. `[Unit]` → `unit?`
1. `[IntegerNumberMinValue]` → `minValue?`
2. `[IntegerNumberMaxValue]` → `maxValue?`
3. `[NumericRenderingHint]` → `renderingHint?`

**`RealNumberFieldSpec`** (`real_number_field_spec`):
0. `RealNumberDatatypeKind` → `datatype`
1. `[Unit]` → `unit?`
2. `[RealNumberMinValue]` → `minValue?`
3. `[RealNumberMaxValue]` → `maxValue?`
4. `[NumericRenderingHint]` → `renderingHint?`

**`BooleanFieldSpec`** (`boolean_field_spec`):
0. `[BooleanRenderingHint]` → `renderingHint?`

**`Unit`** (`unit`):
0. `Iri` → `iri`
1. `[Label]` → `label?`

**`DateFieldSpec`** (`date_field_spec`):
0. `DateValueType` → `dateValueType`
1. `[DateRenderingHint]` → `renderingHint?`

**`TimeFieldSpec`** (`time_field_spec`):
0. `[TimePrecision]` → `timePrecision?`
1. `[TimezoneRequirement]` → `timezoneRequirement?`
2. `[TimeRenderingHint]` → `renderingHint?`

**`DateTimeFieldSpec`** (`date_time_field_spec`):
0. `DateTimeValueType` → `dateTimeValueType`
1. `[TimezoneRequirement]` → `timezoneRequirement?`
2. `[DateTimeRenderingHint]` → `renderingHint?`

**`ControlledTermFieldSpec`** (`controlled_term_field_spec`):
0. `ControlledTermSource+` → `sources`

**`SingleValuedEnumFieldSpec`** (`single_valued_enum_field_spec`):
0. `PermissibleValue+` → `permissibleValues`
1. `[Token]` → `defaultValue?`
2. `[SingleValuedEnumRenderingHint]` → `renderingHint?`

**`MultiValuedEnumFieldSpec`** (`multi_valued_enum_field_spec`):
0. `PermissibleValue+` → `permissibleValues`
1. `Token*` → `defaultValues?` (SHOULD-omitted when empty per §1.7 rule 4)
2. `[MultiValuedEnumRenderingHint]` → `renderingHint?`

**`PermissibleValue`** (`permissible_value`):
0. `Token` → `value`
1. `[Label]` → `label?`
2. `[Description]` → `description?`
3. `Meaning*` → `meanings?` (SHOULD-omitted when empty)

**`Meaning`** (`meaning`):
0. `TermIri` → `iri`
1. `[Label]` → `label?`

**`DateRenderingHint`** (`date_rendering_hint`):
0. `[DateComponentOrder]` → `componentOrder?`

**`TimeRenderingHint`** (`time_rendering_hint`):
0. `[TimeFormat]` → `timeFormat?`

**`DateTimeRenderingHint`** (`date_time_rendering_hint`):
0. `[TimeFormat]` → `timeFormat?`

**`NumericRenderingHint`** (`numeric_rendering_hint`):
0. `[DecimalPlaces]` → `decimalPlaces?`

### 14.9 Controlled term sources

**`OntologySource`** (`ontology_source`):
0. `OntologyReference` → `ontology`

**`OntologyReference`** (`ontology_reference`):
0. `OntologyIri` → `iri`
1. `[OntologyDisplayHint]` → `displayHint?`

**`OntologyDisplayHint`** (`ontology_display_hint`):
0. `[OntologyAcronym]` → `acronym?`
1. `[OntologyName]` → `name?`

**`BranchSource`** (`branch_source`):
0. `OntologyReference` → `ontology`
1. `RootTermIri` → `rootTermIri`
2. `[RootTermLabel]` → `rootTermLabel?`
3. `[MaxTraversalDepth]` → `maxTraversalDepth?`

**`ClassSource`** (`class_source`):
0. `ControlledTermClass+` → `classes`

**`ControlledTermClass`** (`controlled_term_class`):
0. `TermIri` → `term`
1. `[Label]` → `label?`
2. `OntologyReference` → `ontology`

**`ValueSetSource`** (`value_set_source`):
0. `ValueSetIdentifier` → `identifier`
1. `[ValueSetName]` → `name?`
2. `[ValueSetIri]` → `iri?`

### 14.10 Presentation components

**`RichTextComponent`** (`rich_text_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`
3. `HtmlContent` → `html`

**`ImageComponent`** (`image_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`
3. `Iri` → `image`
4. `[Label]` → `label?`
5. `[Description]` → `description?`

**`YoutubeVideoComponent`** (`you_tube_video_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`
3. `Iri` → `video`
4. `[Label]` → `label?`
5. `[Description]` → `description?`

**`SectionBreakComponent`** (`section_break_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`

**`PageBreakComponent`** (`page_break_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `ArtifactMetadata` → `metadata`

### 14.11 Instances

**`FieldValue`** (`field_value`):
0. `EmbeddedArtifactKey` → `key`
1. `Value+` → `values`

**`NestedTemplateInstance`** (`nested_template_instance`):
0. `EmbeddedArtifactKey` → `key`
1. `InstanceValue*` → `values`

### 14.12 Collapsed-wrapper productions

The single-component wrapper productions enumerated in §1.6 — every
`XxxFieldId`, `TemplateId`, `TemplateInstanceId`,
`PresentationComponentId`, `Iri`, `TermIri`, `LanguageTag`,
`LexicalForm`, `IsoDateTimeStamp`, `NonNegativeInteger`,
`MinCardinality`, `MaxCardinality`, `MinLength`, `MaxLength`,
`DecimalPlaces`, `MaxTraversalDepth`, the typed external-authority
IRIs, `Name`, `Description`, `PreferredLabel`, `AlternativeLabel`,
`Label`, `PropertyLabel`, `OntologyName`, `OntologyAcronym`,
`OntologyIri`, `RootTermIri`, `RootTermLabel`, `ValueSetIdentifier`,
`ValueSetName`, `ValueSetIri`, `Notation`, `Identifier`,
`AttributeName`, `EmbeddedArtifactKey`, `ValidationRegex`, `Token`,
`Header`, `Footer`, `Version`, `ModelVersion`, `CreatedOn`,
`CreatedBy`, `ModifiedOn`, `ModifiedBy`, `PreviousVersion`,
`DerivedFrom`, `PropertyIri`, and `HtmlContent` — collapse to their
inner primitive on the wire and have no per-production property name.
The single component appears directly at the slot in the enclosing
production whose property name is given by that production's mapping.
