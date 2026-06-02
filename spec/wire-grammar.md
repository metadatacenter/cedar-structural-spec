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

### 1.5 The kind rule

**Rule.** A wire object carries a `"kind": "X"` property if and only
if its abstract grammar production is a member of some
`discriminator: kind` union — regardless of the position the object
occupies in the wire form. Productions that are not members of any
`discriminator: kind` union (`Cardinality`, `Annotation`,
`Property`, `CatalogMetadata`,
`LifecycleMetadata`, `SchemaArtifactVersioning`,
`Unit`, `OntologyReference`, `OntologyDisplayHint`,
`ControlledTermClass`, `PermissibleValue`, `Meaning`, and the
temporal `RenderingHint` object variants) never carry `kind`.

This rule is purely a property of the production: it does not depend
on where in the document the object appears. A given production
either always carries `kind` on the wire or never does. In particular,
*singleton positions* — slots where the enclosing context already
fixes the family — make no difference to whether `kind` is carried;
a polymorphic-union member retains its `kind` even when the slot's
type pins the family unambiguously. The `kind` is then redundant for
decoding (the family is recoverable from the slot type) but is
retained because uniformity of the rule is more valuable than the
small wire-size saving.

**Terms.**

- **Singleton position** — a property slot in a wire object where the
  abstract grammar admits exactly one production (e.g.
  `EmbeddedField.cardinality` admits only `Cardinality`,
  `EmbeddedTextField.defaultValue` admits only `TextValue`).
- **Singleton-only production** — an abstract production that appears
  *only* at singleton positions and is never a member of a
  `discriminator: kind` union (e.g. `Cardinality`, `Annotation`,
  `Property`). Equivalently: the productions enumerated in the
  Rule above.

**Worked examples.** Two cases illustrate the rule.

*Case 1 — polymorphic-union member always carries `kind`.* `TextValue`
is a member of the `Value` union (which uses `discriminator: kind`).
At the polymorphic `FieldValue.values[*]` position the wire form is:

```json
{ "kind": "TextValue", "value": "Hello", "lang": "en" }
```

At the singleton `EmbeddedTextField.defaultValue` position, where the
enclosing `EmbeddedTextField.kind` already fixes the family, the
wire form is *the same*:

```json
{
  "kind": "EmbeddedTextField",
  "key": "comment",
  "artifactRef": "https://example.org/fields/comment",
  "defaultValue": { "kind": "TextValue", "value": "Initial", "lang": "en" }
}
```

The inner `"kind": "TextValue"` is structurally redundant at this
slot but is retained because `TextValue` is a polymorphic-union
member and the rule is uniform across positions.

*Case 2 — singleton-only production never carries `kind`.*
`Cardinality` is not a member of any `discriminator: kind` union — it
appears only at singleton positions (e.g.
`EmbeddedField.cardinality`, `EmbeddedTemplate.cardinality`). Its
wire form never carries `kind`:

```json
{
  "kind": "EmbeddedTextField",
  "key": "alias",
  "artifactRef": "https://example.org/fields/alias",
  "cardinality": { "min": 0, "max": 3 }
}
```

**Wire vs. in-memory.** The kind rule constrains the **wire form**,
not the **in-memory form** of any host-language binding. Bindings
MAY carry synthetic `kind` (or any other) discriminator fields on
their in-memory representations of singleton-only productions —
e.g. `Cardinality`, `Annotation` — for runtime introspection,
type-guard ergonomics, or debugging. Any such synthetic
discriminator MUST be stripped before encoding and MUST NOT appear
on the wire; the converse is also possible (a binding's in-memory
type may omit a `kind` it chooses to recover from context, provided
the encoder restores it). (See [`bindings.md`](bindings.md) §2.1
for examples.)

### 1.6 Collapsed wrappers

A *typed singleton wrapper* is an abstract grammar production whose
constructor form has exactly one component. The inner component may
be a primitive lexical category (string, number, boolean), another
typed singleton wrapper, or a composite production such as
`MultilingualString`. For example:

```ebnf
Iri        ::= iri(IriString)
TemplateId ::= template_id(IriString)
Label      ::= label(MultilingualString)
```

In the abstract grammar these productions exist to give a value a
*role* — `Iri` is a syntactically valid IRI, `TemplateId` is
specifically the identifier of a template, `Label` is a label rather
than an arbitrary multilingual string. The abstract grammar treats
these roles as distinct types so that, e.g., a `TemplateId` cannot
be substituted for a `FieldId` even though both reduce to a string at
the wire level.

On the wire, however, this typed-role information is recovered from
the surrounding context (the property name and the abstract grammar
production at that slot). The wrapper therefore collapses to its inner
type at encode time and disappears from the JSON, leaving only the
inner value (a primitive, an array, or whichever shape the inner type
encodes to). The wire grammar still names the wrapper production where
the abstract grammar does, so that slot types in composite productions
remain isomorphic to the abstract grammar's component types — but the
wrapper's wire form `:::` is the wire form of whatever it carries.

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
- **MultilingualString-typed** (the inner type is itself a composite,
  encoded as a `nonEmptyArray<LangString>` per the `MultilingualString`
  wire production; the wrapper carries no additional wire shape):
  `Name`, `Description`, `PreferredLabel`, `AlternativeLabel`, `Label`,
  `Prompt`, `PromptOverride`, `PropertyLabel`, `OntologyName`,
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
   `CatalogMetadata` are SHOULD-omitted when empty, and the spec-level
   `MultiValuedEnumFieldSpec.defaultValues`
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

7. **The kind rule.** A `kind: "X"` literal property appears on a
   wire object if and only if its production is a member of some
   `discriminator: kind` union, regardless of position. Productions
   not so used (`Cardinality`, `Annotation`, `Property`, etc.)
   never carry `kind`. See §1.5 for the full statement.

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
        | LanguageValue | AttributeValue
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

### 3.8 Language value

```
LanguageValue ::: object {
  "kind": "LanguageValue"
  value: LanguageTag
}
  // value is a canonical BCP 47 language tag (§2.x). No denormalized
  // display label is carried; consumers render display names against
  // the IANA Language Subtag Registry.
```

### 3.9 Attribute value

```
AttributeName ::: string

AttributeValue ::: object {
  "kind": "AttributeValue"
  name: AttributeName
  value: Value
}
  // value is a tagged Value carrying its kind discriminator per §1.5.
```

---

## 4. Identifiers (artifact)

Each artifact identifier wire-encodes as an `Iri` (which itself
collapses to a plain string IRI per §1.6); the abstract grammar's
typed-role distinction is not visible on the wire.

`FieldId` is the umbrella union of the twenty typed
`XxxFieldId` families per `grammar.md`; on the wire its encoding is
just the encoding of whichever family member is at the slot position,
which in every case is `Iri`. The wire grammar therefore lists `FieldId
::: Iri` alongside each typed family for consistency.

```
FieldId ::: Iri
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
LanguageFieldId ::: Iri
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

## 5. Catalog Metadata

### 5.1 Aggregate structure

`CatalogMetadata` is flat on the wire: its descriptive properties
(`preferredLabel`, `description`, `identifier`, `altLabels`), its
`lifecycle` slot, and its `annotations` slot are all direct
members of the same object — there is no `descriptiveMetadata`
wrapper.

```
Description ::: MultilingualString
Identifier ::: string
AlternativeLabel ::: MultilingualString

CatalogMetadata ::: object {
  preferredLabel?: PreferredLabel
  description?: Description
  identifier?: Identifier
  altLabels?: array<AlternativeLabel>
  lifecycle: LifecycleMetadata
  annotations?: array<Annotation>
}
  // preferredLabel is the artifact's catalog-display name. It is
  // distinct from a schema artifact's *rendered* display name, which
  // lives on a top-level slot on the artifact itself (Field.label,
  // Template.title, TemplateInstance.label).
  // altLabels SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // annotations SHOULD be omitted from the wire when empty; it round-trips
  // as an empty array in memory
  // the grammar's Description, PreferredLabel, and AlternativeLabel
  // productions are MultilingualString-typed wrappers that collapse on
  // the wire (§1.6); the type names appear here for parity with the
  // abstract grammar's component naming
```

`CatalogMetadata` is uniform across every artifact kind: `Field`,
`Template`, `PresentationComponent`, and `TemplateInstance` all carry
the same `CatalogMetadata` shape under the wire-form `metadata` key.

Schema artifacts (`Field`, `Template`) additionally carry
`SchemaArtifactVersioning` as a separate top-level `versioning` slot
on the artifact itself; non-schema artifacts (`PresentationComponent`,
`TemplateInstance`) do not carry versioning. The
`SchemaArtifactMetadata` wrapper production used in prior revisions
of this specification is removed: in the new shape, schema artifacts
carry `metadata` and `versioning` as parallel top-level slots rather
than as a single `metadata`-wrapped blob.

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
  // when both previousVersion and derivedFrom are present, they MUST
  // NOT carry the same IRI (per grammar.md §Schema Artifact
  // Versioning); succession and derivation are mutually exclusive at
  // any single point

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
  // collapses to a string per §1.6)

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

Defaults are specified at two layers, with parallel typing per
family. See `grammar.md` §Defaults for the abstract grammar's full
treatment, including precedence and the UI/UX-only semantics; this
section gives the wire form.

**Embedding-level defaults.** The optional `defaultValue` slot on
each `EmbeddedXxxField` is typed family-by-family with the family's
`Value` type. There is no `DefaultValue` union and no per-family
`XxxDefaultValue` wrapper on the wire: the `defaultValue` JSON
encodes directly as the corresponding family's `Value`. Per the
kind rule (§1.5), every `Value` family is a member of the `Value`
discriminator-`kind` union, so every embedding-level `defaultValue`
carries a `kind` discriminator on the wire.

| Embedded field | `defaultValue` wire form |
|---|---|
| `EmbeddedTextField` | `TextValue`: `{ "kind": "TextValue", "value": …, "lang"?: … }` |
| `EmbeddedIntegerNumberField` | `IntegerNumberValue`: `{ "kind": "IntegerNumberValue", "value": … }` |
| `EmbeddedRealNumberField` | `RealNumberValue`: `{ "kind": "RealNumberValue", "value": …, "datatype": … }` |
| `EmbeddedBooleanField` | `BooleanValue`: `{ "kind": "BooleanValue", "value": … }` (`value` is a JSON boolean) |
| `EmbeddedDateField` | one of the `DateValue` arms: `{ "kind": "YearValue" \| "YearMonthValue" \| "FullDateValue", "value": … }` |
| `EmbeddedTimeField` | `TimeValue`: `{ "kind": "TimeValue", "value": … }` |
| `EmbeddedDateTimeField` | `DateTimeValue`: `{ "kind": "DateTimeValue", "value": … }` |
| `EmbeddedControlledTermField` | `ControlledTermValue`: `{ "kind": "ControlledTermValue", … }` |
| `EmbeddedSingleValuedEnumField` | `EnumValue`: `{ "kind": "EnumValue", "value": … }` |
| `EmbeddedMultiValuedEnumField` | `array<EnumValue>`: each element `{ "kind": "EnumValue", "value": … }` |
| `EmbeddedLinkField` | `LinkValue`: `{ "kind": "LinkValue", … }` |
| `EmbeddedEmailField` | `EmailValue`: `{ "kind": "EmailValue", "value": … }` |
| `EmbeddedPhoneNumberField` | `PhoneNumberValue`: `{ "kind": "PhoneNumberValue", "value": … }` |
| `EmbeddedOrcidField` | `OrcidValue`: `{ "kind": "OrcidValue", … }` |
| `EmbeddedRorField` | `RorValue`: `{ "kind": "RorValue", … }` |
| `EmbeddedDoiField` | `DoiValue`: `{ "kind": "DoiValue", … }` |
| `EmbeddedPubMedIdField` | `PubMedIdValue`: `{ "kind": "PubMedIdValue", … }` |
| `EmbeddedRridField` | `RridValue`: `{ "kind": "RridValue", … }` |
| `EmbeddedNihGrantIdField` | `NihGrantIdValue`: `{ "kind": "NihGrantIdValue", … }` |
| `EmbeddedLanguageField` | `LanguageValue`: `{ "kind": "LanguageValue", "value": … }` |

`EmbeddedAttributeValueField` has no `defaultValue` slot (per §9).

**Field-level defaults.** Every `XxxFieldSpec` (with one exception)
carries an optional `defaultValue` slot whose type matches its
embedding-level counterpart. The two layers are independent: a
field MAY ship with a field-level default and a Template embedding
that field MAY override that default with an embedding-level
`defaultValue` (see `grammar.md` §Defaults for the full precedence
rule). The wire shapes are identical to the embedding-level table
above, with the following per-family details:

- `TextFieldSpec.defaultValue?: TextValue`
- `IntegerNumberFieldSpec.defaultValue?: IntegerNumberValue`
- `RealNumberFieldSpec.defaultValue?: RealNumberValue`
- `BooleanFieldSpec.defaultValue?: BooleanValue`
- `DateFieldSpec.defaultValue?: DateValue` (the arm MUST be consistent with `dateValueType`)
- `TimeFieldSpec.defaultValue?: TimeValue`
- `DateTimeFieldSpec.defaultValue?: DateTimeValue`
- `ControlledTermFieldSpec.defaultValue?: ControlledTermValue`
- `LinkFieldSpec.defaultValue?: LinkValue`
- `EmailFieldSpec.defaultValue?: EmailValue`
- `PhoneNumberFieldSpec.defaultValue?: PhoneNumberValue`
- `OrcidFieldSpec.defaultValue?: OrcidValue`
- `RorFieldSpec.defaultValue?: RorValue`
- `DoiFieldSpec.defaultValue?: DoiValue`
- `PubMedIdFieldSpec.defaultValue?: PubMedIdValue`
- `RridFieldSpec.defaultValue?: RridValue`
- `NihGrantIdFieldSpec.defaultValue?: NihGrantIdValue`
- `LanguageFieldSpec.defaultValue?: LanguageValue`

- `SingleValuedEnumFieldSpec.defaultValue?: EnumValue` — a tagged
  `EnumValue` whose `value` MUST equal the `Token` of one of the
  spec's permissible-value entries.
- `MultiValuedEnumFieldSpec.defaultValues?: array<EnumValue>` — a
  (possibly empty) JSON array of tagged `EnumValue` entries; each
  `value` MUST equal the `Token` of one of the spec's
  permissible-value entries, and the array MUST NOT contain
  duplicate `value` entries.

`AttributeValueFieldSpec` carries no field-level default.

### 6.6 Prompt override

```
PromptOverride ::: MultilingualString
```

`PromptOverride` is a single-component wrapper of `Prompt` and collapses on the wire (§1.6 / §14.12) to the same form as `Prompt` itself — a `nonEmptyArray<LangString>` per the `MultilingualString` wire production. An embedding's `promptOverride?` slot therefore carries a bare `MultilingualString` array, identical in shape to `Field.prompt`. This matches `HelpTextOverride`'s wire form.

### 6.7 Help text

```
HelpText ::: MultilingualString
HelpTextOverride ::: MultilingualString
```

Both productions collapse on the wire per the wrapper-collapse rule (§1.6): a `MultilingualString` is encoded as a non-empty array of `LangString` entries. `HelpText` is carried by the reusable `Field` artifact (slot `helpText?`); `HelpTextOverride` is carried by each `EmbeddedXxxField` (slot `helpTextOverride?`).

### 6.8 Properties

```
Property ::: object {
  iri: PropertyIri
  label?: PropertyLabel
}
  // iri carries the PropertyIri; label is the optional PropertyLabel

PropertyIri ::: Iri
PropertyLabel ::: MultilingualString
```

### 6.9 Alternative prompts

```
AlternativePrompt ::: object {
  key: PromptKey
  prompt: Prompt
}
  // key carries the PromptKey; prompt is the alternative's MultilingualString

PromptKey ::: string
  // pattern: [A-Za-z][A-Za-z0-9_-]*  (an AsciiIdentifier)
```

`AlternativePrompt` is a two-component object and therefore does **not** collapse on the wire (contrast `PromptOverride`, which is a single-component wrapper and collapses to a bare `MultilingualString` array). Its `prompt` component carries the same shape as `Field.prompt` — a `nonEmptyArray<LangString>` per `MultilingualString` — because an alternative wording is the same kind of thing as the preferred prompt, just keyed and curated; that is why the wire key is `prompt` rather than `label`. Its `key` component projects the `PromptKey` to the wire key `key`, mirroring how `EmbeddedArtifactKey` projects to `key` on every embedded artifact (both are stable local ASCII identifiers scoped to a parent construct).

The `Field`-side slot `altPrompts?: array<AlternativePrompt>` carries the curated set. Like `altLabels?`, it SHOULD be omitted from the wire when empty (§1.7). The `EmbeddedField`-side slot `promptKey?: PromptKey` carries a bare string referencing one of the referenced field's `AlternativePrompt` keys; the closed-set membership and the mutual exclusion with `promptOverride?` are enforced at validation (see [Validation](validation.md)), not by the wire grammar.

---

## 7. Field Specs

```
FieldSpec ::: TextFieldSpec | NumericFieldSpec | BooleanFieldSpec
            | TemporalFieldSpec
            | ControlledTermFieldSpec | EnumFieldSpec | LinkFieldSpec
            | ContactFieldSpec | ExternalAuthorityFieldSpec
            | LanguageFieldSpec
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
  langTagRequirement?: LangTagRequirement
  renderingHint?: TextRenderingHint
  examples?: array<TextValue>
}

LangTagRequirement ::: "langTagRequired" | "langTagOptional" | "langTagForbidden"
  // defaultValue, when present, encodes as a tagged TextValue per
  // the kind rule (§1.5): `{ "kind": "TextValue", "value": ..., "lang"?: ... }`.
  // See §6.5 for default-value semantics across all field families.

IntegerNumberFieldSpec ::: object {
  "kind": "IntegerNumberFieldSpec"
  defaultValue?: IntegerNumberValue
  unit?: Unit
  minValue?: IntegerNumberMinValue
  maxValue?: IntegerNumberMaxValue
  renderingHint?: NumericRenderingHint
  examples?: array<IntegerNumberValue>
}

RealNumberFieldSpec ::: object {
  "kind": "RealNumberFieldSpec"
  datatype: RealNumberDatatypeKind
  defaultValue?: RealNumberValue
  unit?: Unit
  minValue?: RealNumberMinValue
  maxValue?: RealNumberMaxValue
  renderingHint?: NumericRenderingHint
  examples?: array<RealNumberValue>
}

BooleanFieldSpec ::: object {
  "kind": "BooleanFieldSpec"
  defaultValue?: BooleanValue
  renderingHint?: BooleanRenderingHint
  examples?: array<BooleanValue>
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
  defaultValue?: DateValue
  renderingHint?: DateRenderingHint
  examples?: array<DateValue>
}
  // defaultValue, when present, MUST be a DateValue arm consistent
  // with dateValueType (e.g. dateValueType "year" admits only YearValue).

DateValueType ::: "year" | "yearMonth" | "fullDate"

TimeFieldSpec ::: object {
  "kind": "TimeFieldSpec"
  defaultValue?: TimeValue
  timePrecision?: TimePrecision
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: TimeRenderingHint
  examples?: array<TimeValue>
}

TimePrecision ::: "hourMinute" | "hourMinuteSecond" | "hourMinuteSecondFraction"

TimezoneRequirement ::: "timezoneRequired" | "timezoneNotRequired"

DateTimeFieldSpec ::: object {
  "kind": "DateTimeFieldSpec"
  dateTimeValueType: DateTimeValueType
  defaultValue?: DateTimeValue
  timezoneRequirement?: TimezoneRequirement
  renderingHint?: DateTimeRenderingHint
  examples?: array<DateTimeValue>
}

DateTimeValueType ::: "dateHourMinute" | "dateHourMinuteSecond"
                    | "dateHourMinuteSecondFraction"

DateRenderingHint ::: object {
  componentOrder?: DateComponentOrder
  placeholder?: Placeholder
}

DateComponentOrder ::: "dayMonthYear" | "monthDayYear" | "yearMonthDay"

TimeRenderingHint ::: object {
  timeFormat?: TimeFormat
  placeholder?: Placeholder
}

DateTimeRenderingHint ::: object {
  timeFormat?: TimeFormat
  placeholder?: Placeholder
}

TimeFormat ::: "twelveHour" | "twentyFourHour"
```

### 7.2 Controlled term field spec

```
ControlledTermFieldSpec ::: object {
  "kind": "ControlledTermFieldSpec"
  defaultValue?: ControlledTermValue
  sources: nonEmptyArray<ControlledTermSource>
  renderingHint?: ControlledTermRenderingHint
  examples?: array<ControlledTermValue>
}
  // defaultValue.term, when present, SHOULD belong to one of the
  // declared sources, but the structural model does not enforce this
```

### 7.3 Enum field specs

```
EnumFieldSpec ::: SingleValuedEnumFieldSpec | MultiValuedEnumFieldSpec
  // discriminator: kind

SingleValuedEnumFieldSpec ::: object {
  "kind": "SingleValuedEnumFieldSpec"
  permissibleValues: nonEmptyArray<PermissibleValue>
  defaultValue?: EnumValue
  renderingHint?: SingleValuedEnumRenderingHint
  examples?: array<EnumValue>
}
  // defaultValue.value, when present, MUST equal the `value` of one
  // of the permissibleValues entries

MultiValuedEnumFieldSpec ::: object {
  "kind": "MultiValuedEnumFieldSpec"
  permissibleValues: nonEmptyArray<PermissibleValue>
  defaultValues?: array<EnumValue>
  renderingHint?: MultiValuedEnumRenderingHint
  examples?: array<EnumValue>
}
  // defaultValues, when present, is a (possibly empty) array of
  // EnumValue entries; each defaultValues[i].value MUST equal the
  // `value` of one of the permissibleValues entries; the array MUST
  // NOT contain duplicate `value` entries

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
  defaultValue?: LinkValue
  renderingHint?: LinkRenderingHint
  examples?: array<LinkValue>
}

ContactFieldSpec ::: EmailFieldSpec | PhoneNumberFieldSpec
  // discriminator: kind

EmailFieldSpec ::: object {
  "kind": "EmailFieldSpec"
  defaultValue?: EmailValue
  renderingHint?: EmailRenderingHint
  examples?: array<EmailValue>
}

PhoneNumberFieldSpec ::: object {
  "kind": "PhoneNumberFieldSpec"
  defaultValue?: PhoneNumberValue
  renderingHint?: PhoneNumberRenderingHint
  examples?: array<PhoneNumberValue>
}

ExternalAuthorityFieldSpec ::: OrcidFieldSpec | RorFieldSpec | DoiFieldSpec
                             | PubMedIdFieldSpec | RridFieldSpec
                             | NihGrantIdFieldSpec
  // discriminator: kind

OrcidFieldSpec ::: object {
  "kind": "OrcidFieldSpec"
  defaultValue?: OrcidValue
  renderingHint?: OrcidRenderingHint
  examples?: array<OrcidValue>
}

RorFieldSpec ::: object {
  "kind": "RorFieldSpec"
  defaultValue?: RorValue
  renderingHint?: RorRenderingHint
  examples?: array<RorValue>
}

DoiFieldSpec ::: object {
  "kind": "DoiFieldSpec"
  defaultValue?: DoiValue
  renderingHint?: DoiRenderingHint
  examples?: array<DoiValue>
}

PubMedIdFieldSpec ::: object {
  "kind": "PubMedIdFieldSpec"
  defaultValue?: PubMedIdValue
  renderingHint?: PubMedIdRenderingHint
  examples?: array<PubMedIdValue>
}

RridFieldSpec ::: object {
  "kind": "RridFieldSpec"
  defaultValue?: RridValue
  renderingHint?: RridRenderingHint
  examples?: array<RridValue>
}

NihGrantIdFieldSpec ::: object {
  "kind": "NihGrantIdFieldSpec"
  defaultValue?: NihGrantIdValue
  renderingHint?: NihGrantIdRenderingHint
  examples?: array<NihGrantIdValue>
}

LanguageFieldSpec ::: object {
  "kind": "LanguageFieldSpec"
  defaultValue?: LanguageValue
  permittedLanguages?: LanguageTag[]
  renderingHint?: LanguageRenderingHint
  examples?: array<LanguageValue>
}
  // permittedLanguages, when present, MUST be a non-empty array.
  // Tag matching is exact: an instance's LanguageValue.value MUST
  // appear verbatim in permittedLanguages.

AttributeValueFieldSpec ::: object {
  "kind": "AttributeValueFieldSpec"
}
  // AttributeValueFieldSpec carries no defaultValue; an AttributeValue
  // is a per-instance pairing of a name and a value, and a default is
  // not meaningful here (see grammar.md §Defaults).
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

The `RenderingHint` union is heterogeneous: text/enum/boolean hints
encode as flat strings, while `DateRenderingHint`, `TimeRenderingHint`,
`DateTimeRenderingHint`, and `NumericRenderingHint` encode as objects
that can carry configuration. Because some members are strings (which
cannot carry a `"kind"` property), the union uses
`discriminator: position` (§1.3): the decoder identifies the variant
from the enclosing `FieldSpec`'s family — e.g. the value at
`TextFieldSpec.renderingHint` is decoded as a `TextRenderingHint`, the
value at `SingleValuedEnumFieldSpec.renderingHint` as a
`SingleValuedEnumRenderingHint`, and so on.

```
RenderingHint ::: TextRenderingHint | SingleValuedEnumRenderingHint
                | MultiValuedEnumRenderingHint | NumericRenderingHint
                | BooleanRenderingHint
                | DateRenderingHint | TimeRenderingHint | DateTimeRenderingHint
                | ControlledTermRenderingHint
                | EmailRenderingHint | PhoneNumberRenderingHint
                | LinkRenderingHint
                | OrcidRenderingHint | RorRenderingHint | DoiRenderingHint
                | PubMedIdRenderingHint | RridRenderingHint
                | NihGrantIdRenderingHint
                | LanguageRenderingHint
  // discriminator: position
  // resolved by the renderingHint property of the enclosing FieldSpec

TextRenderingHint ::: object {
  lineMode?: TextLineMode
  placeholder?: Placeholder
}

TextLineMode ::: "singleLine" | "multiLine"

SingleValuedEnumRenderingHint ::: "radio" | "dropdown"

MultiValuedEnumRenderingHint ::: "checkbox" | "multiSelect"

NumericRenderingHint ::: object {
  decimalPlaces?: DecimalPlaces
  placeholder?: Placeholder
}
  // decimalPlaces, when present, MUST be a non-negative integer
  // it is a presentation concern (display rounding); it does NOT
  // constrain the lexical form of submitted values

BooleanRenderingHint ::: "checkbox" | "toggle" | "radio" | "dropdown"

ControlledTermRenderingHint ::: object { placeholder?: Placeholder }
EmailRenderingHint          ::: object { placeholder?: Placeholder }
PhoneNumberRenderingHint    ::: object { placeholder?: Placeholder }
LinkRenderingHint           ::: object { placeholder?: Placeholder }
OrcidRenderingHint          ::: object { placeholder?: Placeholder }
RorRenderingHint            ::: object { placeholder?: Placeholder }
DoiRenderingHint            ::: object { placeholder?: Placeholder }
PubMedIdRenderingHint       ::: object { placeholder?: Placeholder }
RridRenderingHint           ::: object { placeholder?: Placeholder }
NihGrantIdRenderingHint     ::: object { placeholder?: Placeholder }

LanguageRenderingHint       ::: "autocomplete" | "dropdown" | "radio"

Placeholder ::: MultilingualString
```

`Placeholder` collapses on the wire per the wrapper-collapse rule (§1.6).

---

## 8. Field artifacts

```
Field ::: TextField | NumericField | BooleanField
        | DateField | TimeField | DateTimeField
        | ControlledTermField
        | SingleValuedEnumField | MultiValuedEnumField
        | LinkField | EmailField | PhoneNumberField
        | OrcidField | RorField | DoiField | PubMedIdField
        | RridField | NihGrantIdField
        | LanguageField | AttributeValueField
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
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: TextFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

IntegerNumberField ::: object {
  "kind": "IntegerNumberField"
  id: IntegerNumberFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: IntegerNumberFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RealNumberField ::: object {
  "kind": "RealNumberField"
  id: RealNumberFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: RealNumberFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

BooleanField ::: object {
  "kind": "BooleanField"
  id: BooleanFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: BooleanFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateField ::: object {
  "kind": "DateField"
  id: DateFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: DateFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

TimeField ::: object {
  "kind": "TimeField"
  id: TimeFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: TimeFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DateTimeField ::: object {
  "kind": "DateTimeField"
  id: DateTimeFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: DateTimeFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ControlledTermField ::: object {
  "kind": "ControlledTermField"
  id: ControlledTermFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: ControlledTermFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

SingleValuedEnumField ::: object {
  "kind": "SingleValuedEnumField"
  id: SingleValuedEnumFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: SingleValuedEnumFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

MultiValuedEnumField ::: object {
  "kind": "MultiValuedEnumField"
  id: MultiValuedEnumFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: MultiValuedEnumFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

LinkField ::: object {
  "kind": "LinkField"
  id: LinkFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: LinkFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

EmailField ::: object {
  "kind": "EmailField"
  id: EmailFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: EmailFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PhoneNumberField ::: object {
  "kind": "PhoneNumberField"
  id: PhoneNumberFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: PhoneNumberFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

OrcidField ::: object {
  "kind": "OrcidField"
  id: OrcidFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: OrcidFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RorField ::: object {
  "kind": "RorField"
  id: RorFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: RorFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

DoiField ::: object {
  "kind": "DoiField"
  id: DoiFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: DoiFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PubMedIdField ::: object {
  "kind": "PubMedIdField"
  id: PubMedIdFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: PubMedIdFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

RridField ::: object {
  "kind": "RridField"
  id: RridFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: RridFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

NihGrantIdField ::: object {
  "kind": "NihGrantIdField"
  id: NihGrantIdFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: NihGrantIdFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

LanguageField ::: object {
  "kind": "LanguageField"
  id: LanguageFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: LanguageFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

AttributeValueField ::: object {
  "kind": "AttributeValueField"
  id: AttributeValueFieldId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  fieldSpec: AttributeValueFieldSpec
  prompt: Prompt
  helpText?: HelpText
  altPrompts?: array<AlternativePrompt>
  recommendedKey?: EmbeddedArtifactKey
  recommendedProperty?: Property
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
```

---

## 9. Embedded artifacts

Most embedded-field productions follow the same eight-property template
— `kind`, `key`, `artifactRef`, `valueRequirement?`, `cardinality?`,
`visibility?`, `defaultValue?`, `promptOverride?`, `property?` — with
the per-family typing applied at `artifactRef` and `defaultValue`.
Four families deviate from this template; the deviations are listed
here so an implementer can scan them in one place rather than spotting
them inside the per-family productions below.

| Family | Deviation |
|---|---|
| `EmbeddedBooleanField` | omits `cardinality` (booleans are inherently single-valued) |
| `EmbeddedSingleValuedEnumField` | omits `cardinality` (single-valued is implicit, parallel to boolean) |
| `EmbeddedMultiValuedEnumField` | `defaultValue?: array<EnumValue>` rather than a singular `Value` (multi-valued enum admits a list of pre-selected tokens; each element is a tagged `EnumValue` per §1.5) |
| `EmbeddedAttributeValueField` | omits `defaultValue` (attribute-value fields have no spec-level default) |

`EmbeddedTemplate` and `EmbeddedPresentationComponent` follow their own
shapes; see the per-production definitions later in this section.

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
                | EmbeddedLanguageField
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
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedIntegerNumberField ::: object {
  "kind": "EmbeddedIntegerNumberField"
  key: EmbeddedArtifactKey
  artifactRef: IntegerNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: IntegerNumberValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedRealNumberField ::: object {
  "kind": "EmbeddedRealNumberField"
  key: EmbeddedArtifactKey
  artifactRef: RealNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RealNumberValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedBooleanField ::: object {
  "kind": "EmbeddedBooleanField"
  key: EmbeddedArtifactKey
  artifactRef: BooleanFieldId
  valueRequirement?: ValueRequirement
  visibility?: Visibility
  defaultValue?: BooleanValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
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
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedTimeField ::: object {
  "kind": "EmbeddedTimeField"
  key: EmbeddedArtifactKey
  artifactRef: TimeFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: TimeValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedDateTimeField ::: object {
  "kind": "EmbeddedDateTimeField"
  key: EmbeddedArtifactKey
  artifactRef: DateTimeFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DateTimeValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedControlledTermField ::: object {
  "kind": "EmbeddedControlledTermField"
  key: EmbeddedArtifactKey
  artifactRef: ControlledTermFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: ControlledTermValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedSingleValuedEnumField ::: object {
  "kind": "EmbeddedSingleValuedEnumField"
  key: EmbeddedArtifactKey
  artifactRef: SingleValuedEnumFieldId
  valueRequirement?: ValueRequirement
  visibility?: Visibility
  defaultValue?: EnumValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}
  // single-valued enum embeddings carry no cardinality slot per
  // grammar.md (single-valued enum is implicit, parallel to boolean)

EmbeddedMultiValuedEnumField ::: object {
  "kind": "EmbeddedMultiValuedEnumField"
  key: EmbeddedArtifactKey
  artifactRef: MultiValuedEnumFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: array<EnumValue>
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}
  // defaultValue is a (possibly empty) array of EnumValue entries;
  // each element is a tagged EnumValue per the kind rule (§1.5).
  // The array MUST NOT contain duplicate `value` entries.

EmbeddedLinkField ::: object {
  "kind": "EmbeddedLinkField"
  key: EmbeddedArtifactKey
  artifactRef: LinkFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: LinkValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedEmailField ::: object {
  "kind": "EmbeddedEmailField"
  key: EmbeddedArtifactKey
  artifactRef: EmailFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: EmailValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedPhoneNumberField ::: object {
  "kind": "EmbeddedPhoneNumberField"
  key: EmbeddedArtifactKey
  artifactRef: PhoneNumberFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PhoneNumberValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedOrcidField ::: object {
  "kind": "EmbeddedOrcidField"
  key: EmbeddedArtifactKey
  artifactRef: OrcidFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: OrcidValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedRorField ::: object {
  "kind": "EmbeddedRorField"
  key: EmbeddedArtifactKey
  artifactRef: RorFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RorValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedDoiField ::: object {
  "kind": "EmbeddedDoiField"
  key: EmbeddedArtifactKey
  artifactRef: DoiFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: DoiValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedPubMedIdField ::: object {
  "kind": "EmbeddedPubMedIdField"
  key: EmbeddedArtifactKey
  artifactRef: PubMedIdFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: PubMedIdValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedRridField ::: object {
  "kind": "EmbeddedRridField"
  key: EmbeddedArtifactKey
  artifactRef: RridFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: RridValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedNihGrantIdField ::: object {
  "kind": "EmbeddedNihGrantIdField"
  key: EmbeddedArtifactKey
  artifactRef: NihGrantIdFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: NihGrantIdValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedLanguageField ::: object {
  "kind": "EmbeddedLanguageField"
  key: EmbeddedArtifactKey
  artifactRef: LanguageFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  defaultValue?: LanguageValue
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}

EmbeddedAttributeValueField ::: object {
  "kind": "EmbeddedAttributeValueField"
  key: EmbeddedArtifactKey
  artifactRef: AttributeValueFieldId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  promptOverride?: PromptOverride
  helpTextOverride?: HelpTextOverride
  property?: Property
  promptKey?: PromptKey
}
  // attribute-value embeddings carry no defaultValue per grammar.md

EmbeddedTemplate ::: object {
  "kind": "EmbeddedTemplate"
  key: EmbeddedArtifactKey
  artifactRef: TemplateId
  valueRequirement?: ValueRequirement
  cardinality?: Cardinality
  visibility?: Visibility
  promptOverride?: PromptOverride
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
  metadata: CatalogMetadata
  html: HtmlContent
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

ImageComponent ::: object {
  "kind": "ImageComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
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
  metadata: CatalogMetadata
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
  metadata: CatalogMetadata
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form

PageBreakComponent ::: object {
  "kind": "PageBreakComponent"
  id: PresentationComponentId
  modelVersion: ModelVersion
  metadata: CatalogMetadata
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
  metadata: CatalogMetadata
  versioning: SchemaArtifactVersioning
  title: Title
  renderingHint?: TemplateRenderingHint
  header?: Header
  footer?: Footer
  members: array<TemplateMember>
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // EmbeddedArtifact keys (each embedded member's `key` property) MUST be
  // unique across the entire member tree, recursing into Section bodies
  // (per grammar.md §Sections and validation.md)
  // the order of `members` MUST be preserved

TemplateMember ::: EmbeddedArtifact | Section
  // discriminator: kind
  // a Section is a grouping member; it carries no `key` and no instance data

Section ::: object {
  "kind": "Section"
  label: Label
  description?: Description
  collapsibility?: Collapsibility
  members: array<TemplateMember>
}
  // label and description are MultilingualString (carried in full, not
  // collapsed, since they sit at named object slots)
  // members may be empty; Section bodies nest recursively
  // the order of `members` MUST be preserved

Collapsibility ::: "none" | "startsExpanded" | "startsCollapsed"
  // absent ≡ "none"

TemplateRenderingHint ::: object {
  helpDisplayMode?: HelpDisplayMode
}

HelpDisplayMode ::: "inline" | "tooltip" | "both" | "none"

Title ::: MultilingualString

Prompt ::: MultilingualString

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
  metadata: CatalogMetadata
  templateRef: TemplateId
  label?: Label
  values: array<InstanceValue>
}
  // modelVersion is a SemanticVersion 2.0.0 lexical form
  // metadata is CatalogMetadata; instances do not carry schema
  // versioning, so there is no top-level versioning slot
  // label, when present, is a user-supplied name for this instance,
  // shown in catalog listings or detail views

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

- Each entry leads with the abstract production name in **bold** and,
  in parentheses, the corresponding `lower_snake_case` constructor
  form's name from `grammar.md` — e.g. **`Template`** (`template`),
  **`YoutubeVideoComponent`** (`you_tube_video_component`). The
  parenthesised name is informational, included so a reader cross-
  referencing this section against `grammar.md` can match `::=`
  productions to entries here without manually re-deriving the
  snake_case form. It does not appear on the wire and has no
  normative effect.
- Component order follows `grammar.md`. Component-index numbering is
  zero-based.
- Optional `[X]` and repeated `X*` / `X+` components are noted
  alongside the component type.
- The mapping records the wire property name; whether the encoded
  object carries a `kind` discriminator at that slot is determined
  separately by the kind rule (§1.5) and is not duplicated here.

### 14.1 Top-level artifacts and templates

**`Template`** (`template`):
0. `TemplateId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`
3. `SchemaArtifactVersioning` → `versioning`
4. `Title` → `title`
5. `[TemplateRenderingHint]` → `renderingHint?`
6. `[Header]` → `header?`
7. `[Footer]` → `footer?`
8. `TemplateMember*` → `members` (each member is an `EmbeddedArtifact` or a `Section`)

**`Section`** (`section`):
0. `Label` → `label`
1. `[Description]` → `description?`
2. `[Collapsibility]` → `collapsibility?`
3. `TemplateMember*` → `members`

**`TemplateRenderingHint`** (`template_rendering_hint`):
0. `[HelpDisplayMode]` → `helpDisplayMode?`

**`TemplateInstance`** (`template_instance`):
0. `TemplateInstanceId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`
3. `TemplateId` → `templateRef`
4. `[Label]` → `label?`
5. `InstanceValue*` → `values`

### 14.2 Field artifacts

Every concrete `Field` production has the same six-component shape:
`(<Family>FieldId, ModelVersion, CatalogMetadata, SchemaArtifactVersioning, <Family>FieldSpec, Prompt)`,
with an optional `HelpText` slot, an optional repeated `AlternativePrompt*`
slot, and two optional advisory slots, `RecommendedKey` and
`RecommendedProperty`. For all of `TextField`,
`IntegerNumberField`, `RealNumberField`, `BooleanField`, `DateField`,
`TimeField`, `DateTimeField`, `ControlledTermField`,
`SingleValuedEnumField`, `MultiValuedEnumField`, `LinkField`,
`EmailField`, `PhoneNumberField`, `OrcidField`, `RorField`,
`DoiField`, `PubMedIdField`, `RridField`, `NihGrantIdField`,
`LanguageField`, and `AttributeValueField`:

0. `<Family>FieldId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`
3. `SchemaArtifactVersioning` → `versioning`
4. `<Family>FieldSpec` → `fieldSpec`
5. `Prompt` → `prompt`
6. `[HelpText]` → `helpText?`
7. `AlternativePrompt*` → `altPrompts?` (SHOULD-omitted when empty per §1.7)
8. `[RecommendedKey]` → `recommendedKey?`
9. `[RecommendedProperty]` → `recommendedProperty?`

### 14.3 Embedded artifacts

Every concrete `EmbeddedXxxField` production follows the same pattern,
with the per-family typed-id and typed-default-value slots:

0. `EmbeddedArtifactKey` → `key`
1. `<Family>FieldId` → `artifactRef`
2. `[ValueRequirement]` → `valueRequirement?`
3. `[Cardinality]` → `cardinality?` (omitted on `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField`)
4. `[Visibility]` → `visibility?`
5. `[<Family>Value]` → `defaultValue?` (omitted on `EmbeddedAttributeValueField`; on `EmbeddedMultiValuedEnumField` the slot is `EnumValue*` → `defaultValue?: array<EnumValue>`)
6. `[PromptOverride]` → `promptOverride?`
7. `[HelpTextOverride]` → `helpTextOverride?`
8. `[Property]` → `property?`
9. `[PromptKey]` → `promptKey?`

(Component indices are renumbered to skip slots a particular family
omits, per the per-family abstract production. The list above gives the
canonical ordering common to the family.)

**`EmbeddedTemplate`** (`embedded_template`):
0. `EmbeddedArtifactKey` → `key`
1. `TemplateId` → `artifactRef`
2. `[ValueRequirement]` → `valueRequirement?`
3. `[Cardinality]` → `cardinality?`
4. `[Visibility]` → `visibility?`
5. `[PromptOverride]` → `promptOverride?`
6. `[Property]` → `property?`

**`EmbeddedPresentationComponent`** (`embedded_presentation_component`):
0. `EmbeddedArtifactKey` → `key`
1. `PresentationComponentId` → `artifactRef`
2. `[Visibility]` → `visibility?`

### 14.4 Catalog metadata

**`CatalogMetadata`** (`catalog_metadata`):
0. `[PreferredLabel]` → `preferredLabel?`
1. `[Description]` → `description?`
2. `[Identifier]` → `identifier?`
3. `AlternativeLabel*` → `altLabels?` (SHOULD-omitted when empty per §1.7 rule 4)
4. `LifecycleMetadata` → `lifecycle`
5. `Annotation*` → `annotations?` (SHOULD-omitted when empty)

On schema artifacts, `SchemaArtifactVersioning` appears as a separate
top-level `versioning` slot on the artifact rather than being nested
inside `metadata`.

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

**`Property`** (`property`):
0. `PropertyIri` → `iri`
1. `[PropertyLabel]` → `label?`

**`AlternativePrompt`** (`alternative_prompt`):
0. `PromptKey` → `key`
1. `MultilingualString` → `prompt`

**`PromptKey`** (`prompt_key`):
0. `AsciiIdentifier` → (scalar; encoded as a bare string, no wrapping object)

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

**`LanguageValue`** (`language_value`):
0. `LanguageTag` → `value`

**`AttributeValue`** (`attribute_value`):
0. `AttributeName` → `name`
1. `Value` → `value`

### 14.8 Field specs

**`TextFieldSpec`** (`text_field_spec`):
0. `[TextValue]` → `defaultValue?`
1. `[MinLength]` → `minLength?`
2. `[MaxLength]` → `maxLength?`
3. `[ValidationRegex]` → `validationRegex?`
4. `[LangTagRequirement]` → `langTagRequirement?`
5. `[TextRenderingHint]` → `renderingHint?`
6. `TextValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`IntegerNumberFieldSpec`** (`integer_number_field_spec`):
0. `[IntegerNumberValue]` → `defaultValue?`
1. `[Unit]` → `unit?`
2. `[IntegerNumberMinValue]` → `minValue?`
3. `[IntegerNumberMaxValue]` → `maxValue?`
4. `[NumericRenderingHint]` → `renderingHint?`
5. `IntegerNumberValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`RealNumberFieldSpec`** (`real_number_field_spec`):
0. `RealNumberDatatypeKind` → `datatype`
1. `[RealNumberValue]` → `defaultValue?`
2. `[Unit]` → `unit?`
3. `[RealNumberMinValue]` → `minValue?`
4. `[RealNumberMaxValue]` → `maxValue?`
5. `[NumericRenderingHint]` → `renderingHint?`
6. `RealNumberValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`BooleanFieldSpec`** (`boolean_field_spec`):
0. `[BooleanValue]` → `defaultValue?`
1. `[BooleanRenderingHint]` → `renderingHint?`
2. `BooleanValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`Unit`** (`unit`):
0. `Iri` → `iri`
1. `[Label]` → `label?`

**`DateFieldSpec`** (`date_field_spec`):
0. `DateValueType` → `dateValueType`
1. `[DateValue]` → `defaultValue?`
2. `[DateRenderingHint]` → `renderingHint?`
3. `DateValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`TimeFieldSpec`** (`time_field_spec`):
0. `[TimeValue]` → `defaultValue?`
1. `[TimePrecision]` → `timePrecision?`
2. `[TimezoneRequirement]` → `timezoneRequirement?`
3. `[TimeRenderingHint]` → `renderingHint?`
4. `TimeValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`DateTimeFieldSpec`** (`date_time_field_spec`):
0. `DateTimeValueType` → `dateTimeValueType`
1. `[DateTimeValue]` → `defaultValue?`
2. `[TimezoneRequirement]` → `timezoneRequirement?`
3. `[DateTimeRenderingHint]` → `renderingHint?`
4. `DateTimeValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`ControlledTermFieldSpec`** (`controlled_term_field_spec`):
0. `[ControlledTermValue]` → `defaultValue?`
1. `ControlledTermSource+` → `sources`
2. `[ControlledTermRenderingHint]` → `renderingHint?`
3. `ControlledTermValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`SingleValuedEnumFieldSpec`** (`single_valued_enum_field_spec`):
0. `PermissibleValue+` → `permissibleValues`
1. `[EnumValue]` → `defaultValue?`
2. `[SingleValuedEnumRenderingHint]` → `renderingHint?`
3. `EnumValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`MultiValuedEnumFieldSpec`** (`multi_valued_enum_field_spec`):
0. `PermissibleValue+` → `permissibleValues`
1. `EnumValue*` → `defaultValues?` (SHOULD-omitted when empty per §1.7 rule 4)
2. `[MultiValuedEnumRenderingHint]` → `renderingHint?`
3. `EnumValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`PermissibleValue`** (`permissible_value`):
0. `Token` → `value`
1. `[Label]` → `label?`
2. `[Description]` → `description?`
3. `Meaning*` → `meanings?` (SHOULD-omitted when empty)

**`Meaning`** (`meaning`):
0. `TermIri` → `iri`
1. `[Label]` → `label?`

**`TextRenderingHint`** (`text_rendering_hint`):
0. `[TextLineMode]` → `lineMode?`
1. `[Placeholder]` → `placeholder?`

**`DateRenderingHint`** (`date_rendering_hint`):
0. `[DateComponentOrder]` → `componentOrder?`
1. `[Placeholder]` → `placeholder?`

**`TimeRenderingHint`** (`time_rendering_hint`):
0. `[TimeFormat]` → `timeFormat?`
1. `[Placeholder]` → `placeholder?`

**`DateTimeRenderingHint`** (`date_time_rendering_hint`):
0. `[TimeFormat]` → `timeFormat?`
1. `[Placeholder]` → `placeholder?`

**`NumericRenderingHint`** (`numeric_rendering_hint`):
0. `[DecimalPlaces]` → `decimalPlaces?`
1. `[Placeholder]` → `placeholder?`

The ten new rendering hints introduced for previously hint-less families each carry a single optional slot:

**`ControlledTermRenderingHint`** (`controlled_term_rendering_hint`): `[Placeholder]` → `placeholder?`
**`EmailRenderingHint`** (`email_rendering_hint`): `[Placeholder]` → `placeholder?`
**`PhoneNumberRenderingHint`** (`phone_number_rendering_hint`): `[Placeholder]` → `placeholder?`
**`LinkRenderingHint`** (`link_rendering_hint`): `[Placeholder]` → `placeholder?`
**`OrcidRenderingHint`** (`orcid_rendering_hint`): `[Placeholder]` → `placeholder?`
**`RorRenderingHint`** (`ror_rendering_hint`): `[Placeholder]` → `placeholder?`
**`DoiRenderingHint`** (`doi_rendering_hint`): `[Placeholder]` → `placeholder?`
**`PubMedIdRenderingHint`** (`pub_med_id_rendering_hint`): `[Placeholder]` → `placeholder?`
**`RridRenderingHint`** (`rrid_rendering_hint`): `[Placeholder]` → `placeholder?`
**`NihGrantIdRenderingHint`** (`nih_grant_id_rendering_hint`): `[Placeholder]` → `placeholder?`

`LanguageRenderingHint` encodes as one of the bare strings `"autocomplete"`, `"dropdown"`, or `"radio"` and has no property-name map.

**`LinkFieldSpec`** (`link_field_spec`):
0. `[LinkValue]` → `defaultValue?`
1. `[LinkRenderingHint]` → `renderingHint?`
2. `LinkValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`EmailFieldSpec`** (`email_field_spec`):
0. `[EmailValue]` → `defaultValue?`
1. `[EmailRenderingHint]` → `renderingHint?`
2. `EmailValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`PhoneNumberFieldSpec`** (`phone_number_field_spec`):
0. `[PhoneNumberValue]` → `defaultValue?`
1. `[PhoneNumberRenderingHint]` → `renderingHint?`
2. `PhoneNumberValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`OrcidFieldSpec`** (`orcid_field_spec`):
0. `[OrcidValue]` → `defaultValue?`
1. `[OrcidRenderingHint]` → `renderingHint?`
2. `OrcidValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`RorFieldSpec`** (`ror_field_spec`):
0. `[RorValue]` → `defaultValue?`
1. `[RorRenderingHint]` → `renderingHint?`
2. `RorValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`DoiFieldSpec`** (`doi_field_spec`):
0. `[DoiValue]` → `defaultValue?`
1. `[DoiRenderingHint]` → `renderingHint?`
2. `DoiValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`PubMedIdFieldSpec`** (`pub_med_id_field_spec`):
0. `[PubMedIdValue]` → `defaultValue?`
1. `[PubMedIdRenderingHint]` → `renderingHint?`
2. `PubMedIdValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`RridFieldSpec`** (`rrid_field_spec`):
0. `[RridValue]` → `defaultValue?`
1. `[RridRenderingHint]` → `renderingHint?`
2. `RridValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`NihGrantIdFieldSpec`** (`nih_grant_id_field_spec`):
0. `[NihGrantIdValue]` → `defaultValue?`
1. `[NihGrantIdRenderingHint]` → `renderingHint?`
2. `NihGrantIdValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

**`LanguageFieldSpec`** (`language_field_spec`):
0. `[LanguageValue]` → `defaultValue?`
1. `[PermittedLanguages]` → `permittedLanguages?`
2. `[LanguageRenderingHint]` → `renderingHint?`
3. `LanguageValue*` → `examples?` (SHOULD-omitted when empty per §1.7 rule 4)

`AttributeValueFieldSpec` carries no components and has no entry here.

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
2. `CatalogMetadata` → `metadata`
3. `HtmlContent` → `html`

**`ImageComponent`** (`image_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`
3. `Iri` → `image`
4. `[Label]` → `label?`
5. `[Description]` → `description?`

**`YoutubeVideoComponent`** (`you_tube_video_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`
3. `Iri` → `video`
4. `[Label]` → `label?`
5. `[Description]` → `description?`

**`SectionBreakComponent`** (`section_break_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`

**`PageBreakComponent`** (`page_break_component`):
0. `PresentationComponentId` → `id`
1. `ModelVersion` → `modelVersion`
2. `CatalogMetadata` → `metadata`

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
`Label`, `Prompt`, `PromptOverride`, `PropertyLabel`, `OntologyName`, `OntologyAcronym`,
`OntologyIri`, `RootTermIri`, `RootTermLabel`, `ValueSetIdentifier`,
`ValueSetName`, `ValueSetIri`, `Notation`, `Identifier`,
`AttributeName`, `EmbeddedArtifactKey`, `ValidationRegex`, `Token`,
`Header`, `Footer`, `Version`, `ModelVersion`, `CreatedOn`,
`CreatedBy`, `ModifiedOn`, `ModifiedBy`, `PreviousVersion`,
`DerivedFrom`, `PropertyIri`, `HtmlContent`, `PermittedLanguages`,
`RecommendedKey`, and `PromptKey` —
collapse to their inner primitive (or to a bare array, in the case of
single-component sequence-bearing wrappers such as `PermittedLanguages`)
on the wire and have no per-production property name.
The single component appears directly at the slot in the enclosing
production whose property name is given by that production's mapping.
