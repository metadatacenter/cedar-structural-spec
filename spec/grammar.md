# Abstract Grammar

This section defines the abstract structure of the CEDAR Template Model using an EBNF-style grammar.

The grammar defines the abstract syntactic structure of the model. It specifies the kinds of constructs that exist and how they are composed, but it does not define a concrete textual or data serialization such as JSON, YAML, RDF, or a functional-style syntax.

Accordingly, a production in this grammar describes abstract structure rather than a directly parseable text form. In particular, a production such as `Template ::= template( ... )` does not mean:

- the literal token `template` must appear in a file
- parentheses must appear in a file
- whitespace must be used in a particular way in a file
- the production is itself a concrete serialization format

The following notation is used throughout this grammar:

```ebnf
::=    defined as
|      alternative production
X*     zero or more occurrences of X
X+     one or more occurrences of X
[X]    optional occurrence of X
(...)  groups the named components of an abstract constructor form
```

Whitespace separates symbols within a production.

Production names use `UpperCamelCase`. A production name denotes the abstract category being defined, such as `Template`, `Field`, or `DateFieldType`.

Abstract constructor forms use `lower_snake_case`. In this document, a constructor form is the schematic form used to show how an abstract construct is composed, such as `template(...)`, `field(...)`, or `date_field_type(...)`. The difference between `UpperCamelCase` production names and `lower_snake_case` constructor forms is purely a visual distinction used to make it clear when the grammar is naming a category and when it is showing the abstract form of a construct belonging to that category.

For example, in the production

```ebnf
Template ::= template(
               TemplateId
               SchemaArtifactMetadata
               EmbeddedArtifact*
             )
```

`Template` is the production being defined, while `template(...)` denotes the abstract constructor form of that construct; in other words, it shows the components of a `Template` and how they are composed.

## Contents

- [Kernel Grammar](#kernel-grammar)
  - [Core Structure](#core-structure)
  - [Concrete Field Artifacts](#concrete-field-artifacts)
  - [Embedded Artifacts](#embedded-artifacts)
- [Scalar and Datatype Leaves](#scalar-and-datatype-leaves)
  - [Primitive String Types](#primitive-string-types)
  - [Core IRI and String Types](#core-iri-and-string-types)
  - [Numeric Datatype IRIs](#numeric-datatype-iris)
  - [Temporal Datatype IRIs](#temporal-datatype-iris)
- [Literals](#literals)
  - [Base Literals](#base-literals)
  - [Numeric Literals](#numeric-literals)
  - [Temporal Literals](#temporal-literals)
  - [Literal Value Semantics](#literal-value-semantics)
- [Artifact Identity](#artifact-identity)
- [Artifact Metadata](#artifact-metadata)
  - [Aggregate Structure](#aggregate-structure)
  - [Descriptive Metadata](#descriptive-metadata)
  - [Temporal Provenance](#temporal-provenance)
  - [Schema Versioning](#schema-versioning)
  - [Annotations](#annotations)
- [Embedded Artifact Keys](#embedded-artifact-keys)
- [Values](#values)
  - [Scalar Values](#scalar-values)
  - [Temporal Values](#temporal-values)
  - [Controlled Term Value](#controlled-term-value)
  - [Choice Value](#choice-value)
  - [Link Value](#link-value)
  - [Contact Values](#contact-values)
  - [External Authority Values](#external-authority-values)
  - [Attribute Value](#attribute-value)
- [Embedded Artifact Properties](#embedded-artifact-properties)
  - [References](#references)
  - [Requirements](#requirements)
  - [Cardinality](#cardinality)
  - [Visibility](#visibility)
  - [Defaults](#defaults)
  - [Label Override](#label-override)
- [Field Types](#field-types)
  - [Temporal Field Types](#temporal-field-types)
  - [Controlled Term Sources](#controlled-term-sources)
  - [Rendering Hints](#rendering-hints)
- [Presentation Components](#presentation-components)
- [Field Type And Value Correspondence](#field-type-and-value-correspondence)
- [Instances](#instances)
- [Open Questions](#open-questions)

## Kernel Grammar

The kernel grammar defines the primary abstract categories of the model and the core schema-level structure that connects them. It introduces reusable schema artifacts, templates, and the embedding constructs through which templates assemble fields, nested templates, and presentation components. Subsequent sections refine the metadata, field-type families, instance structures, and supporting constructs referenced here.

### Core Structure

This subsection establishes the top-level taxonomy of the model and introduces its two principal concrete schema artifacts. `Artifact` is the broadest category, encompassing reusable schema artifacts, presentation components, and template instances. `Template` is defined here as the central container that organises embedded artifacts into a structured form. `Field` is introduced as an abstract category whose concrete variants are defined in the following subsection.

```ebnf
Artifact ::= SchemaArtifact
           | PresentationComponent
           | TemplateInstance

SchemaArtifact ::= Field
                 | Template
```

`Template` is a concrete schema artifact and the central container of the model. It assembles `EmbeddedArtifact` constructs into a structured form and defines the schema that `TemplateInstance` constructs conform to.

```ebnf
Template ::= template(
               TemplateId
               SchemaArtifactMetadata
               [Header]
               [Footer]
               EmbeddedArtifact*
             )

Header ::= header(
             UnicodeString
           )

Footer ::= footer(
             UnicodeString
           )
```

`Header` and `Footer` denote optional Unicode textual content displayed at the top and bottom of a rendered template respectively.

The following productions introduce the abstract field categories. `Field` remains an abstract category, while the intermediate categories group related concrete field artifacts for readability and shared semantics.

```ebnf
Field ::= TextField
        | NumericField
        | TemporalField
        | ControlledTermField
        | ChoiceField
        | LinkField
        | ContactField
        | ExternalAuthorityField
        | AttributeValueField

TemporalField ::= DateField
                | TimeField
                | DateTimeField

ChoiceField ::= SingleChoiceField
              | MultipleChoiceField

ContactField ::= EmailField
               | PhoneNumberField

ExternalAuthorityField ::= OrcidField
                         | RorField
                         | DoiField
                         | PubMedIdField
                         | RridField
                         | NihGrantIdField
```

### Concrete Field Artifacts

Each concrete `Field` variant carries exactly three components: a typed artifact identifier that permanently identifies the reusable field; `SchemaArtifactMetadata` providing the descriptive, provenance, versioning, and annotation metadata common to all schema artifacts; and a typed `FieldType` that specifies the value semantics and configuration for that field category. The identifier and `FieldType` are specific to each concrete variant; `SchemaArtifactMetadata` is uniform across all fields. The groupings below mirror the abstract `Field` hierarchy defined in Core Structure.

`TextField` and `NumericField` are the two simple scalar field types. Each carries the most basic value semantics — free text and typed numeric values respectively.

```ebnf
TextField ::= text_field(
               TextFieldId
               SchemaArtifactMetadata
               TextFieldType
             )

NumericField ::= numeric_field(
                  NumericFieldId
                  SchemaArtifactMetadata
                  NumericFieldType
                )
```

The temporal field variants correspond to the `TemporalField` abstract category. Each is typed to a distinct temporal semantic — date, time of day, or combined date-time — and carries its own `FieldType` with precision and rendering options appropriate to that category.

```ebnf
DateField ::= date_field(
               DateFieldId
               SchemaArtifactMetadata
               DateFieldType
             )

TimeField ::= time_field(
               TimeFieldId
               SchemaArtifactMetadata
               TimeFieldType
             )

DateTimeField ::= date_time_field(
                   DateTimeFieldId
                   SchemaArtifactMetadata
                   DateTimeFieldType
                 )
```

`ControlledTermField` supports values drawn from declared ontology sources. `SingleChoiceField` and `MultipleChoiceField` correspond to the `ChoiceField` abstract category and differ in whether they permit one or multiple selections from a declared option set. `LinkField` carries a single IRI-valued hyperlink.

```ebnf
ControlledTermField ::= controlled_term_field(
                          ControlledTermFieldId
                          SchemaArtifactMetadata
                          ControlledTermFieldType
                        )

SingleChoiceField ::= single_choice_field(
                         SingleChoiceFieldId
                         SchemaArtifactMetadata
                         SingleChoiceFieldType
                       )

MultipleChoiceField ::= multiple_choice_field(
                           MultipleChoiceFieldId
                           SchemaArtifactMetadata
                           MultipleChoiceFieldType
                         )

LinkField ::= link_field(
               LinkFieldId
               SchemaArtifactMetadata
               LinkFieldType
             )
```

The contact field variants correspond to the `ContactField` abstract category and represent human contact identifiers.

```ebnf
EmailField ::= email_field(
                EmailFieldId
                SchemaArtifactMetadata
                EmailFieldType
              )

PhoneNumberField ::= phone_number_field(
                      PhoneNumberFieldId
                      SchemaArtifactMetadata
                      PhoneNumberFieldType
                    )
```

The external authority field variants correspond to the `ExternalAuthorityField` abstract category. Each represents an identifier issued by a specific external authority system, as described in the External Authority Values section.

```ebnf
OrcidField ::= orcid_field(
                OrcidFieldId
                SchemaArtifactMetadata
                OrcidFieldType
              )

RorField ::= ror_field(
              RorFieldId
              SchemaArtifactMetadata
              RorFieldType
            )

DoiField ::= doi_field(
              DoiFieldId
              SchemaArtifactMetadata
              DoiFieldType
            )

PubMedIdField ::= pub_med_id_field(
                    PubMedIdFieldId
                    SchemaArtifactMetadata
                    PubMedIdFieldType
                  )

RridField ::= rrid_field(
               RridFieldId
               SchemaArtifactMetadata
               RridFieldType
             )

NihGrantIdField ::= nih_grant_id_field(
                     NihGrantIdFieldId
                     SchemaArtifactMetadata
                     NihGrantIdFieldType
                   )
```

`AttributeValueField` supports open-ended name-value pair data whose attribute names are not fixed at schema definition time.

```ebnf
AttributeValueField ::= attribute_value_field(
                          AttributeValueFieldId
                          SchemaArtifactMetadata
                          AttributeValueFieldType
                        )
```

### Embedded Artifacts

An `EmbeddedArtifact` contextualises a reusable artifact within a specific `Template`, adding template-local properties that govern how the artifact participates in that context. There are three forms: `EmbeddedField`, which embeds a data-bearing field; `EmbeddedTemplate`, which nests a template within the containing template; and `EmbeddedPresentationComponent`, which contributes presentational structure without producing instance data.

The sequence of `EmbeddedArtifact` constructs within a `Template` is significant. The order in which they appear determines the presentation order of embedded artifacts in a rendered template. Conforming implementations MUST preserve this order.

```ebnf
EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent

EmbeddedField ::= EmbeddedTextField
                | EmbeddedNumericField
                | EmbeddedDateField
                | EmbeddedTimeField
                | EmbeddedDateTimeField
                | EmbeddedControlledTermField
                | EmbeddedSingleChoiceField
                | EmbeddedMultipleChoiceField
                | EmbeddedLinkField
                | EmbeddedEmailField
                | EmbeddedPhoneNumberField
                | EmbeddedOrcidField
                | EmbeddedRorField
                | EmbeddedDoiField
                | EmbeddedPubMedIdField
                | EmbeddedRridField
                | EmbeddedNihGrantIdField
                | EmbeddedAttributeValueField
```

Every concrete `EmbeddedField` variant follows the same structural pattern. Each carries: an `EmbeddedArtifactKey` uniquely identifying the embedding site within the containing `Template`; a typed field reference identifying the reusable `Field` being embedded; an optional `ValueRequirement` specifying whether a value is required, recommended, or optional; an optional `Cardinality` bounding the permitted number of values; an optional `Visibility` controlling whether the field is shown in rendered interfaces; an optional typed `DefaultValue` providing an embedding-specific default; and an optional `LabelOverride` allowing the template to override the field's label in this context. The only variation across concrete `EmbeddedField` variants is the typed field reference and the typed default value, both of which match the value family of the referenced field.

```ebnf
EmbeddedTextField ::= embedded_text_field(
                        EmbeddedArtifactKey
                        TextFieldReference
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [TextDefaultValue]
                        [LabelOverride]
                      )

EmbeddedNumericField ::= embedded_numeric_field(
                           EmbeddedArtifactKey
                           NumericFieldReference
                           [ValueRequirement]
                           [Cardinality]
                           [Visibility]
                           [NumericDefaultValue]
                           [LabelOverride]
                         )

EmbeddedDateField ::= embedded_date_field(
                        EmbeddedArtifactKey
                        DateFieldReference
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [DateDefaultValue]
                        [LabelOverride]
                      )

EmbeddedTimeField ::= embedded_time_field(
                        EmbeddedArtifactKey
                        TimeFieldReference
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [TimeDefaultValue]
                        [LabelOverride]
                      )

EmbeddedDateTimeField ::= embedded_date_time_field(
                            EmbeddedArtifactKey
                            DateTimeFieldReference
                            [ValueRequirement]
                            [Cardinality]
                            [Visibility]
                            [DateTimeDefaultValue]
                            [LabelOverride]
                          )

EmbeddedControlledTermField ::= embedded_controlled_term_field(
                                  EmbeddedArtifactKey
                                  ControlledTermFieldReference
                                  [ValueRequirement]
                                  [Cardinality]
                                  [Visibility]
                                  [ControlledTermDefaultValue]
                                  [LabelOverride]
                                )

EmbeddedSingleChoiceField ::= embedded_single_choice_field(
                                 EmbeddedArtifactKey
                                 SingleChoiceFieldReference
                                 [ValueRequirement]
                                 [Cardinality]
                                 [Visibility]
                                 [ChoiceDefaultValue]
                                 [LabelOverride]
                               )

EmbeddedMultipleChoiceField ::= embedded_multiple_choice_field(
                                   EmbeddedArtifactKey
                                   MultipleChoiceFieldReference
                                   [ValueRequirement]
                                   [Cardinality]
                                   [Visibility]
                                   [ChoiceDefaultValue]
                                   [LabelOverride]
                                 )

EmbeddedLinkField ::= embedded_link_field(
                        EmbeddedArtifactKey
                        LinkFieldReference
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [LinkDefaultValue]
                        [LabelOverride]
                      )

EmbeddedEmailField ::= embedded_email_field(
                         EmbeddedArtifactKey
                         EmailFieldReference
                         [ValueRequirement]
                         [Cardinality]
                         [Visibility]
                         [EmailDefaultValue]
                         [LabelOverride]
                       )

EmbeddedPhoneNumberField ::= embedded_phone_number_field(
                               EmbeddedArtifactKey
                               PhoneNumberFieldReference
                               [ValueRequirement]
                               [Cardinality]
                               [Visibility]
                               [PhoneNumberDefaultValue]
                               [LabelOverride]
                             )

EmbeddedOrcidField ::= embedded_orcid_field(
                         EmbeddedArtifactKey
                         OrcidFieldReference
                         [ValueRequirement]
                         [Cardinality]
                         [Visibility]
                         [OrcidDefaultValue]
                         [LabelOverride]
                       )

EmbeddedRorField ::= embedded_ror_field(
                       EmbeddedArtifactKey
                       RorFieldReference
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [RorDefaultValue]
                       [LabelOverride]
                     )

EmbeddedDoiField ::= embedded_doi_field(
                       EmbeddedArtifactKey
                       DoiFieldReference
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [DoiDefaultValue]
                       [LabelOverride]
                     )

EmbeddedPubMedIdField ::= embedded_pub_med_id_field(
                            EmbeddedArtifactKey
                            PubMedIdFieldReference
                            [ValueRequirement]
                            [Cardinality]
                            [Visibility]
                            [PubMedIdDefaultValue]
                            [LabelOverride]
                          )

EmbeddedRridField ::= embedded_rrid_field(
                        EmbeddedArtifactKey
                        RridFieldReference
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [RridDefaultValue]
                        [LabelOverride]
                      )

EmbeddedNihGrantIdField ::= embedded_nih_grant_id_field(
                               EmbeddedArtifactKey
                               NihGrantIdFieldReference
                               [ValueRequirement]
                               [Cardinality]
                               [Visibility]
                               [NihGrantIdDefaultValue]
                               [LabelOverride]
                             )

EmbeddedAttributeValueField ::= embedded_attribute_value_field(
                                  EmbeddedArtifactKey
                                  AttributeValueFieldReference
                                  [ValueRequirement]
                                  [Cardinality]
                                  [Visibility]
                                  [LabelOverride]
                                )
```

`EmbeddedTemplate` and `EmbeddedPresentationComponent` follow a similar pattern to embedded fields but differ in what embedding properties they carry. `EmbeddedTemplate` supports cardinality to permit multiple nested instances of the referenced template but carries no typed default value. `EmbeddedPresentationComponent` carries neither a value requirement, cardinality, nor default value, as it contributes no instance data and exists purely to contribute presentational structure.

```ebnf
EmbeddedTemplate ::= embedded_template(
                       EmbeddedArtifactKey
                       TemplateReference
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [LabelOverride]
                     )

EmbeddedPresentationComponent ::= embedded_presentation_component(
                                    EmbeddedArtifactKey
                                    PresentationComponentReference
                                    [Visibility]
                                    [LabelOverride]
                                  )
```

## Scalar and Datatype Leaves

The following productions define the primitive leaf types used throughout this grammar. They are placed here so that subsequent sections can reference them without forward reference. They represent the atomic constructs from which all other productions are built: IRIs, typed string domains, lexical forms, numeric and temporal datatype IRIs, and textual metadata values.

### Primitive String Types

The following nonterminals are intentionally left abstract. They define the string-valued leaf types referenced by the productions in this section and are not themselves model-level constructs.

- `SemanticVersion` denotes a Semantic Versioning 2.0.0 lexical form.
- `IriString` denotes the lexical form of an IRI.
- `Bcp47Tag` denotes a well-formed BCP 47 language tag.
- `UnicodeString` denotes an arbitrary Unicode string.
- `Iso8601DateTimeLexicalForm` denotes an ISO 8601 date-time lexical form.
- `AsciiIdentifier` denotes an identifier matching the pattern `[A-Za-z][A-Za-z0-9_-]*`: it begins with an ASCII letter followed by zero or more ASCII letters, digits, underscores, or hyphens.
- `IntegerLexicalForm` denotes a base-10 integer lexical form.

### Core IRI and String Types

This subsection defines the fundamental IRI, string, and numeric leaf types that appear throughout the grammar. `Iri` is the base construct for all IRI-valued positions. `DatatypeIri` and `TermIri` are specialised IRI forms used in literal typing and controlled-vocabulary references respectively. `LanguageTag` and `LexicalForm` support RDF literal construction. `IsoDateTimeStamp` carries ISO 8601 date-time values used in temporal provenance. `NonNegativeInteger` and `RegexPattern` support field-type constraints.

```ebnf
Iri ::= iri(
          IriString
        )

DatatypeIri ::= datatype_iri(
                  Iri
                )

TermIri ::= term_iri(
              Iri
            )

LanguageTag ::= language_tag(
                  Bcp47Tag
                )

LexicalForm ::= lexical_form(
                  UnicodeString
                )

IsoDateTimeStamp ::= iso_date_time_stamp(
                       Iso8601DateTimeLexicalForm
                     )

NonNegativeInteger ::= non_negative_integer(
                         IntegerLexicalForm
                       )

RegexPattern ::= regex_pattern(
                   UnicodeString
                 )
```

`Iri` denotes an Internationalized Resource Identifier.

`DatatypeIri` denotes an `Iri` that identifies an RDF datatype.

`TermIri` denotes an `Iri` that identifies a term in a controlled vocabulary or ontology. It is used in `ControlledTermValue` and `ControlledTermClass`.

`LanguageTag` denotes a well-formed BCP 47 language tag.

`LexicalForm` denotes a Unicode string and SHOULD be in Unicode Normalization Form C.

`IsoDateTimeStamp` denotes an ISO 8601 date-time lexical form.

`NonNegativeInteger` denotes an integer greater than or equal to zero.

`RegexPattern` denotes a Unicode string interpreted as a regular-expression pattern.

### Numeric Datatype IRIs

`NumericDatatype` carries the XSD datatype IRI that identifies the numeric type of a `NumericLiteral`. `NumericDatatypeIri` enumerates the supported XSD numeric datatype IRIs. Each alternative is a nullary constructor; the corresponding XSD datatype IRI for each is given in the table below.

```ebnf
NumericDatatype ::= numeric_datatype(
                      NumericDatatypeIri
                    )

NumericDatatypeIri ::= XsdIntegerDatatypeIri
                     | XsdDecimalDatatypeIri
                     | XsdFloatDatatypeIri
                     | XsdDoubleDatatypeIri
                     | XsdLongDatatypeIri
                     | XsdIntDatatypeIri
                     | XsdShortDatatypeIri
                     | XsdByteDatatypeIri
                     | XsdNonNegativeIntegerDatatypeIri
                     | XsdPositiveIntegerDatatypeIri
                     | XsdNonPositiveIntegerDatatypeIri
                     | XsdNegativeIntegerDatatypeIri
                     | XsdUnsignedLongDatatypeIri
                     | XsdUnsignedIntDatatypeIri
                     | XsdUnsignedShortDatatypeIri
                     | XsdUnsignedByteDatatypeIri
```

| Production | XSD Datatype IRI |
|---|---|
| `XsdIntegerDatatypeIri` | `http://www.w3.org/2001/XMLSchema#integer` |
| `XsdDecimalDatatypeIri` | `http://www.w3.org/2001/XMLSchema#decimal` |
| `XsdFloatDatatypeIri` | `http://www.w3.org/2001/XMLSchema#float` |
| `XsdDoubleDatatypeIri` | `http://www.w3.org/2001/XMLSchema#double` |
| `XsdLongDatatypeIri` | `http://www.w3.org/2001/XMLSchema#long` |
| `XsdIntDatatypeIri` | `http://www.w3.org/2001/XMLSchema#int` |
| `XsdShortDatatypeIri` | `http://www.w3.org/2001/XMLSchema#short` |
| `XsdByteDatatypeIri` | `http://www.w3.org/2001/XMLSchema#byte` |
| `XsdNonNegativeIntegerDatatypeIri` | `http://www.w3.org/2001/XMLSchema#nonNegativeInteger` |
| `XsdPositiveIntegerDatatypeIri` | `http://www.w3.org/2001/XMLSchema#positiveInteger` |
| `XsdNonPositiveIntegerDatatypeIri` | `http://www.w3.org/2001/XMLSchema#nonPositiveInteger` |
| `XsdNegativeIntegerDatatypeIri` | `http://www.w3.org/2001/XMLSchema#negativeInteger` |
| `XsdUnsignedLongDatatypeIri` | `http://www.w3.org/2001/XMLSchema#unsignedLong` |
| `XsdUnsignedIntDatatypeIri` | `http://www.w3.org/2001/XMLSchema#unsignedInt` |
| `XsdUnsignedShortDatatypeIri` | `http://www.w3.org/2001/XMLSchema#unsignedShort` |
| `XsdUnsignedByteDatatypeIri` | `http://www.w3.org/2001/XMLSchema#unsignedByte` |

### Temporal Datatype IRIs

These productions define the XSD datatype IRIs used by temporal literal categories. Each temporal precision level has a dedicated abstract IRI type that resolves to a single XSD constructor. The corresponding XSD datatype IRI for each constructor is given in the table below.

```ebnf
YearDatatypeIri      ::= XsdGYearDatatypeIri
YearMonthDatatypeIri ::= XsdGYearMonthDatatypeIri
DateDatatypeIri      ::= XsdDateDatatypeIri
TimeDatatypeIri      ::= XsdTimeDatatypeIri
DateTimeDatatypeIri  ::= XsdDateTimeDatatypeIri
```

| Production | XSD Datatype IRI |
|---|---|
| `XsdGYearDatatypeIri` | `http://www.w3.org/2001/XMLSchema#gYear` |
| `XsdGYearMonthDatatypeIri` | `http://www.w3.org/2001/XMLSchema#gYearMonth` |
| `XsdDateDatatypeIri` | `http://www.w3.org/2001/XMLSchema#date` |
| `XsdTimeDatatypeIri` | `http://www.w3.org/2001/XMLSchema#time` |
| `XsdDateTimeDatatypeIri` | `http://www.w3.org/2001/XMLSchema#dateTime` |

`YearDatatypeIri`, `YearMonthDatatypeIri`, `DateDatatypeIri`, `TimeDatatypeIri`, and `DateTimeDatatypeIri` denote the XML Schema datatype IRIs used by the corresponding temporal literal categories.

## Literals

Literals are the atomic data values used throughout the instance model. This specification follows the RDF literal model: every literal consists of a lexical form paired with either a datatype IRI or a language tag. Typed subclasses narrow the permitted datatype IRI to support strongly typed numeric and temporal values. The lexical form of any literal SHOULD be in Unicode Normalization Form C.

### Base Literals

The base literal types define the two concrete RDF literal forms together with their string specialisations. These are used in text-valued, general-purpose, and controlled-term positions throughout the model.

```ebnf
Literal ::= DatatypeIriLiteral
          | LangStringLiteral

DatatypeIriLiteral ::= datatype_iri_literal(
                         LexicalForm
                         DatatypeIri
                       )

LangStringLiteral ::= lang_string_literal(
                        LexicalForm
                        LanguageTag
                      )

StringLiteral ::= string_literal(
                    LexicalForm
                  )

TextLiteral ::= StringLiteral
              | LangStringLiteral
```

`Literal` is the base category for all RDF literals in this specification.

`DatatypeIriLiteral` consists of a lexical form and a datatype IRI.

`LangStringLiteral` consists of a lexical form and a language tag. Its implicit datatype IRI is `http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`. Its language tag MUST be non-empty and well-formed according to BCP 47.

`StringLiteral` is a `DatatypeIriLiteral` whose datatype IRI is `http://www.w3.org/2001/XMLSchema#string`.

`TextLiteral` is the union of `StringLiteral` and `LangStringLiteral`. It is the class of literals permitted in `TextValue`, admitting both plain strings and language-tagged strings.

Concrete syntaxes MAY use simpler surface forms that omit an explicit datatype IRI for string literals or language-tagged strings. Such forms are syntactic sugar and do not change the abstract structure defined by this specification.

### Numeric Literals

`NumericLiteral` is the class of literals permitted in `NumericValue`. It pairs a lexical form with a numeric datatype IRI drawn from `NumericDatatypeIri` (see Numeric Datatype IRIs).

```ebnf
NumericLiteral ::= numeric_literal(
                     LexicalForm
                     NumericDatatypeIri
                   )
```

### Temporal Literals

A temporal literal is a typed literal that represents a date, a time of day, or a combined date-time value, carried as an RDF literal with an XML Schema temporal datatype IRI. Temporal literals are strongly typed at each precision level. `TemporalLiteral` is the abstract supertype; `DateLiteral`, `TimeLiteral`, and `DateTimeLiteral` correspond to the three temporal field types. Within `DateLiteral`, the three alternatives preserve year-only, year-month, and full-date precision explicitly rather than collapsing them into a single form.

```ebnf
TemporalLiteral ::= DateLiteral
                  | TimeLiteral
                  | DateTimeLiteral

DateLiteral ::= YearLiteral
              | YearMonthLiteral
              | FullDateLiteral

YearLiteral ::= year_literal(
                  LexicalForm
                  YearDatatypeIri
                )

YearMonthLiteral ::= year_month_literal(
                       LexicalForm
                       YearMonthDatatypeIri
                     )

FullDateLiteral ::= full_date_literal(
                      LexicalForm
                      DateDatatypeIri
                    )

TimeLiteral ::= time_literal(
                  LexicalForm
                  TimeDatatypeIri
                )

DateTimeLiteral ::= date_time_literal(
                      LexicalForm
                      DateTimeDatatypeIri
                    )
```

Each temporal literal carries a datatype IRI from the corresponding temporal datatype IRI category, and is used in the corresponding `Value` type:

| Literal | Datatype IRI category | Used in |
|---|---|---|
| `YearLiteral` | `YearDatatypeIri` | `YearValue` |
| `YearMonthLiteral` | `YearMonthDatatypeIri` | `YearMonthValue` |
| `FullDateLiteral` | `DateDatatypeIri` | `FullDateValue` |
| `TimeLiteral` | `TimeDatatypeIri` | `TimeValue` |
| `DateTimeLiteral` | `DateTimeDatatypeIri` | `DateTimeValue` |

### Literal Value Semantics

The value associated with a `DatatypeIriLiteral` depends on whether its datatype IRI is recognised and whether its lexical form is in the lexical space of that datatype:

| Condition | Result |
|---|---|
| Datatype IRI recognised; lexical form in lexical space | Literal value is obtained by applying the lexical-to-value mapping of the datatype to the lexical form |
| Datatype IRI recognised; lexical form outside lexical space | Ill-typed literal: no valid literal value is determined |
| Datatype IRI not recognised | Literal value is not defined by this specification |

For a `LangStringLiteral`, the literal value is the pair consisting of lexical form and language tag, in that order.

An ill-typed literal is not syntactically ill-formed, but it does not determine a valid literal value and produces a semantic inconsistency. Implementations MUST accept ill-typed literals and MAY produce warnings when encountering them.

Two literals are term-equal if and only if their lexical forms and their datatype IRIs or language tags compare equal character by character.

## Artifact Identity

Artifact identity defines the typed identifiers by which artifacts and artifact references are denoted in the model. These identity constructs are distinct from descriptive metadata, provenance, versioning, and annotations.

```ebnf
FieldId ::= TextFieldId
          | NumericFieldId
          | DateFieldId
          | TimeFieldId
          | DateTimeFieldId
          | ControlledTermFieldId
          | SingleChoiceFieldId
          | MultipleChoiceFieldId
          | LinkFieldId
          | EmailFieldId
          | PhoneNumberFieldId
          | OrcidFieldId
          | RorFieldId
          | DoiFieldId
          | PubMedIdFieldId
          | RridFieldId
          | NihGrantIdFieldId
          | AttributeValueFieldId

TextFieldId ::= text_field_id( Iri )

NumericFieldId ::= numeric_field_id( Iri )

DateFieldId ::= date_field_id( Iri )

TimeFieldId ::= time_field_id( Iri )

DateTimeFieldId ::= date_time_field_id( Iri )

ControlledTermFieldId ::= controlled_term_field_id( Iri )

SingleChoiceFieldId ::= single_choice_field_id( Iri )

MultipleChoiceFieldId ::= multiple_choice_field_id( Iri )

LinkFieldId ::= link_field_id( Iri )

EmailFieldId ::= email_field_id( Iri )

PhoneNumberFieldId ::= phone_number_field_id( Iri )

OrcidFieldId ::= orcid_field_id( Iri )

RorFieldId ::= ror_field_id( Iri )

DoiFieldId ::= doi_field_id( Iri )

PubMedIdFieldId ::= pub_med_id_field_id( Iri )

RridFieldId ::= rrid_field_id( Iri )

NihGrantIdFieldId ::= nih_grant_id_field_id( Iri )

AttributeValueFieldId ::= attribute_value_field_id( Iri )

TemplateId ::= template_id( Iri )

PresentationComponentId ::= presentation_component_id( Iri )

TemplateInstanceId ::= template_instance_id( Iri )
```

## Artifact Metadata

Artifact metadata defines descriptive information, provenance, versioning, and annotations. `ArtifactMetadata` provides the common metadata carried by all artifacts other than identity. `SchemaArtifactMetadata` extends that common structure with schema-versioning information used by reusable schema artifacts.

### Aggregate Structure

This subsection identifies how the metadata categories are grouped at the artifact level. `ArtifactMetadata` carries the metadata common to all artifacts other than identity, while `SchemaArtifactMetadata` adds versioning information for reusable schema artifacts.

```ebnf
SchemaArtifactMetadata ::= schema_artifact_metadata(
                             ArtifactMetadata
                             SchemaVersioning
                           )

ArtifactMetadata ::= artifact_metadata(
                       DescriptiveMetadata
                       TemporalProvenance
                       Annotation*
                     )
```

### Descriptive Metadata

`DescriptiveMetadata` identifies the human-oriented descriptive properties of an artifact. These properties support naming, explanatory text, and external or local identifiers used for cataloging. `Name` is the required user-supplied name of the artifact. `Description`, when present, is extended textual description explaining the artifact's purpose and content. `Identifier`, when present, is a user-specified external identifier intended for integration with institutional or external systems.

```ebnf
Name ::= name(
           UnicodeString
         )

Description ::= description(
                  UnicodeString
                )

Identifier ::= identifier(
                 UnicodeString
               )

DescriptiveMetadata ::= descriptive_metadata(
                          Name
                          [Description]
                          [Identifier]
                        )
```

### Temporal Provenance

`TemporalProvenance` identifies when an artifact was created and modified, and which agents were responsible for those actions.

```ebnf
TemporalProvenance ::= temporal_provenance(
                         CreatedOn
                         CreatedBy
                         ModifiedOn
                         ModifiedBy
                       )

CreatedOn ::= IsoDateTimeStamp

CreatedBy ::= Iri

ModifiedOn ::= IsoDateTimeStamp

ModifiedBy ::= Iri
```

`CreatedOn` and `ModifiedOn` MUST be ISO 8601 date-time timestamps.

`CreatedBy` and `ModifiedBy` denote IRIs identifying the responsible agents.

### Schema Versioning

`SchemaVersioning` identifies version-related metadata specific to reusable schema artifacts. It captures artifact version, publication status, the version of the schema model used, and optional derivation links to earlier or source artifacts.

```ebnf
SchemaVersioning ::= schema_versioning(
                       Version
                       Status
                       ModelVersion
                       [PreviousVersion]
                       [DerivedFrom]
                     )
```

```ebnf
Version ::= version(
              SemanticVersion
            )

Status ::= DraftStatus
         | PublishedStatus

DraftStatus ::= draft_status()

PublishedStatus ::= published_status()

ModelVersion ::= model_version(
                   SemanticVersion
                 )

PreviousVersion ::= previous_version(
                      Iri
                    )

DerivedFrom ::= derived_from(
                  Iri
                )
```

```ebnf
SemanticVersion ::= semantic_version(
                      UnicodeString
                    )
```

`Version` and `ModelVersion` denote Semantic Versioning 2.0.0 version identifiers.

`SemanticVersion` MUST conform to Semantic Versioning 2.0.0 as defined at [semver.org](https://semver.org/).

`Status` denotes the publication status of a reusable schema artifact and is restricted to `draft` or `published`.

`PreviousVersion` and `DerivedFrom` denote IRIs identifying related source or predecessor artifacts.

### Annotations

`Annotation` provides an extensible metadata mechanism for additional named metadata values that are not captured by the core descriptive, provenance, or versioning structures. `AnnotationName` identifies the annotated metadata property. `AnnotationValue` provides the associated metadata value. Annotation values may be either literals or IRIs. This supports linking to external resources such as DOIs and grant identifiers, as well as storing institutional metadata.

```ebnf
Annotation ::= annotation(
                 AnnotationName
                 AnnotationValue
               )

AnnotationName ::= annotation_name(
                     Iri
                   )

AnnotationValue ::= LiteralAnnotationValue
                  | IriAnnotationValue

LiteralAnnotationValue ::= literal_annotation_value(
                             Literal
                           )

IriAnnotationValue ::= iri_annotation_value(
                         Iri
                       )
```

## Embedded Artifact Keys

An `EmbeddedArtifactKey` is the local identifier of an `EmbeddedArtifact` within a `Template`. It is the key by which an embedded field, embedded template, or embedded presentation component is distinguished from other embedded artifacts in the same template. This key is also the mechanism that connects template structure to instance structure: `FieldValue` and `NestedTemplateInstance` use `EmbeddedArtifactKey` to identify which embedded artifact in the template they correspond to.

```ebnf
EmbeddedArtifactKey ::= embedded_artifact_key(
                          KeyIdentifier
                        )

KeyIdentifier ::= key_identifier(
                    AsciiIdentifier
                  )
```

`EmbeddedArtifactKey` MUST match the pattern `[A-Za-z][A-Za-z0-9_-]*`: it MUST begin with an ASCII letter followed by zero or more ASCII letters, digits, underscores, or hyphens.

`EmbeddedArtifactKey` values are local to a `Template` and MUST be unique within that `Template`.

## Values

This section defines the `Value` types that represent instance-level data. `Value` constructs appear in `FieldValue` instances and as typed default values in `EmbeddedArtifact` properties. The permitted form of a value in a `FieldValue` is determined by the `FieldType` of the referenced `Field`, as specified in the Field Type And Value Correspondence section.

```ebnf
Value ::= TextValue
        | NumericValue
        | DateValue
        | TimeValue
        | DateTimeValue
        | ControlledTermValue
        | ChoiceValue
        | LinkValue
        | EmailValue
        | PhoneNumberValue
        | ExternalAuthorityValue
        | AttributeValue
```

### Scalar Values

`TextValue` and `NumericValue` are the simplest value forms, each wrapping a single typed literal that corresponds directly to its field type. `TextValue` accepts either a plain string or a language-tagged string via `TextLiteral`. `NumericValue` carries a typed numeric literal with an XML Schema numeric datatype IRI.

```ebnf
TextValue ::= text_value(
                TextLiteral
              )

NumericValue ::= numeric_value(
                   NumericLiteral
                 )
```

### Temporal Values

Temporal values represent date, time, and date-time data, corresponding directly to `DateFieldType`, `TimeFieldType`, and `DateTimeFieldType` respectively. `DateValue` is further refined into three precision variants — `YearValue`, `YearMonthValue`, and `FullDateValue` — to preserve the intended granularity explicitly rather than collapsing all date forms into a single type.

```ebnf
DateValue ::= YearValue
            | YearMonthValue
            | FullDateValue

YearValue ::= year_value(
                YearLiteral
              )

YearMonthValue ::= year_month_value(
                     YearMonthLiteral
                   )

FullDateValue ::= full_date_value(
                    FullDateLiteral
                  )

TimeValue ::= time_value(
                TimeLiteral
              )

DateTimeValue ::= date_time_value(
                    DateTimeLiteral
                  )
```

### Controlled Term Value

A controlled term value identifies a term drawn from an ontology, branch, class set, or value set declared in the corresponding `ControlledTermFieldType`. It carries a `TermIri` identifying the term and a mandatory human-readable `Label`. `Notation` and `PreferredLabel` carry optional terminology metadata from the source ontology, such as a symbolic code or the ontology's own preferred label for the term.

```ebnf
Label ::= label(
            UnicodeString
          )

Notation ::= notation(
               UnicodeString
             )

PreferredLabel ::= preferred_label(
                     UnicodeString
                   )

ControlledTermValue ::= controlled_term_value(
                          TermIri
                          Label
                          [Notation]
                          [PreferredLabel]
                        )
```

### Choice Value

A choice value carries a selection from the options declared by a `ChoiceFieldType`. The selection may take the form of a literal, a controlled term, or an IRI, matching one of the structural forms used to declare the corresponding `ChoiceOption`. `ChoiceSelection` and `ChoiceOptionValue` are structurally identical but kept distinct to make the role of each explicit: `ChoiceOptionValue` identifies a permissible option as declared in a `ChoiceFieldType`, while `ChoiceSelection` identifies the value chosen in an instance context. The correspondence between them is governed by the match semantics defined in the validation rules.

```ebnf
ChoiceValue ::= choice_value(
                  ChoiceSelection
                )

ChoiceSelection ::= Literal
                  | ControlledTermValue
                  | Iri
```

### Link Value

A link value represents a hyperlink or URL-valued field. It carries a single `Iri` identifying the linked resource, with no additional metadata.

```ebnf
LinkValue ::= link_value(
                Iri
              )
```

### Contact Values

Contact values represent human contact identifiers. `EmailValue` carries an email address as a plain string literal and `PhoneNumberValue` carries a telephone number as a plain string literal. Both use `StringLiteral` rather than a more specialised literal form; format validation is left to implementations.

```ebnf
EmailValue ::= email_value(
                 StringLiteral
               )

PhoneNumberValue ::= phone_number_value(
                       StringLiteral
                     )
```

### External Authority Values

External authority values represent identifiers issued by recognised external authority systems. Each concrete value type carries a typed IRI specialised for its authority together with an optional human-readable `Label`. The typed IRI signals the expected identifier scheme; format conformance for each authority may be enforced by profile-specific or implementation-specific validation rules.

```ebnf
ExternalAuthorityValue ::= OrcidValue
                         | RorValue
                         | DoiValue
                         | PubMedIdValue
                         | RridValue
                         | NihGrantIdValue

OrcidValue ::= orcid_value(
                 OrcidIri
                 [Label]
               )

RorValue ::= ror_value(
               RorIri
               [Label]
             )

DoiValue ::= doi_value(
               DoiIri
               [Label]
             )

PubMedIdValue ::= pub_med_id_value(
                    PubMedIri
                    [Label]
                  )

RridValue ::= rrid_value(
                RridIri
                [Label]
              )

NihGrantIdValue ::= nih_grant_id_value(
                      NihGrantIri
                      [Label]
                    )

OrcidIri    ::= orcid_iri( Iri )
RorIri      ::= ror_iri( Iri )
DoiIri      ::= doi_iri( Iri )
PubMedIri   ::= pub_med_iri( Iri )
RridIri     ::= rrid_iri( Iri )
NihGrantIri ::= nih_grant_iri( Iri )
```

| Typed IRI | Authority | IRI Pattern |
|---|---|---|
| `OrcidIri` | ORCID — identifies a researcher by ORCID iD | `https://orcid.org/\d{4}-\d{4}-\d{4}-\d{3}[\dX]` |
| `RorIri` | Research Organization Registry — identifies a research organisation by ROR ID | `https://ror.org/0[a-z0-9]{8}` |
| `DoiIri` | Digital Object Identifier — identifies a digital object by DOI | `https://doi.org/10\.\d{4,}/.+` |
| `PubMedIri` | PubMed — identifies a PubMed article | `https://pubmed.ncbi.nlm.nih.gov/\d+` |
| `RridIri` | Research Resource Identifier — identifies a research resource by RRID | `https://identifiers.org/RRID:[A-Z]+_\d+` |
| `NihGrantIri` | NIH — identifies an NIH-funded grant | unspecified |

The final character of an ORCID iD MAY be `X`, serving as an ISO 7064 Mod 11-2 check character.

### Attribute Value

An attribute value is a name-value pair used to represent arbitrary named properties whose names are not known at schema definition time. `AttributeName` carries the name of the attribute as a Unicode string. The value component is itself a `Value`, permitting attribute values to carry any value type including nested attribute values.

```ebnf
AttributeName ::= attribute_name(
                    UnicodeString
                  )

AttributeValue ::= attribute_value(
                     AttributeName
                     Value
                   )
```

## Embedded Artifact Properties

Embedded artifact properties define the contextual information carried by an `EmbeddedArtifact` within a `Template`. These properties govern how a referenced reusable artifact is used in that template context, including reference, requirement, cardinality, visibility, defaults, and label override, and they are distinct from the intrinsic properties of the referenced reusable artifact itself.

### References

These productions identify the reusable artifact that is being included in the template.

```ebnf
FieldReference ::= TextFieldReference
                 | NumericFieldReference
                 | DateFieldReference
                 | TimeFieldReference
                 | DateTimeFieldReference
                 | ControlledTermFieldReference
                 | SingleChoiceFieldReference
                 | MultipleChoiceFieldReference
                 | LinkFieldReference
                 | EmailFieldReference
                 | PhoneNumberFieldReference
                 | OrcidFieldReference
                 | RorFieldReference
                 | DoiFieldReference
                 | PubMedIdFieldReference
                 | RridFieldReference
                 | NihGrantIdFieldReference
                 | AttributeValueFieldReference

TextFieldReference ::= TextFieldId

NumericFieldReference ::= NumericFieldId

DateFieldReference ::= DateFieldId

TimeFieldReference ::= TimeFieldId

DateTimeFieldReference ::= DateTimeFieldId

ControlledTermFieldReference ::= ControlledTermFieldId

SingleChoiceFieldReference ::= SingleChoiceFieldId

MultipleChoiceFieldReference ::= MultipleChoiceFieldId

LinkFieldReference ::= LinkFieldId

EmailFieldReference ::= EmailFieldId

PhoneNumberFieldReference ::= PhoneNumberFieldId

OrcidFieldReference ::= OrcidFieldId

RorFieldReference ::= RorFieldId

DoiFieldReference ::= DoiFieldId

PubMedIdFieldReference ::= PubMedIdFieldId

RridFieldReference ::= RridFieldId

NihGrantIdFieldReference ::= NihGrantIdFieldId

AttributeValueFieldReference ::= AttributeValueFieldId

TemplateReference ::= TemplateId

PresentationComponentReference ::= PresentationComponentId
```

### Requirements

`ValueRequirement` identifies whether a value is required, recommended, or optional in the embedding context. `Required` means that a value must be supplied for conformance. `Recommended` means that a value is not required for conformance, but implementations SHOULD encourage entry and MAY warn when it is absent. `Optional` means that a value may be omitted without conformance failure.

**TODO:** Confirm with the CEDAR team whether `Recommended` is intended to have normative meaning beyond authoring guidance and warnings.

```ebnf
ValueRequirement ::= Required
                   | Recommended
                   | Optional
```

When `ValueRequirement` is absent from an `EmbeddedArtifact`, the default is `Optional`.

### Cardinality

`Cardinality` identifies the permitted number of occurrences for the embedded artifact in the embedding context.

```ebnf
Cardinality ::= cardinality(
                  MinCardinality
                  [MaxCardinality]
                )

MinCardinality ::= min_cardinality(
                     NonNegativeInteger
                   )

MaxCardinality ::= max_cardinality(
                     CardinalityUpperBound
                   )

CardinalityUpperBound ::= NonNegativeInteger
                        | UnboundedCardinality

UnboundedCardinality ::= unbounded_cardinality()
```

When `Cardinality` is absent from an `EmbeddedArtifact`, the implied default is `min_cardinality(1)` with `max_cardinality(1)`: the embedded artifact MUST appear exactly once.

### Visibility

`Visibility` determines whether the embedded artifact is shown in rendered interfaces. It is modeled as an embedding property rather than as a rendering hint because it applies to any kind of embedded artifact, not only to fields.

```ebnf
Visibility ::= Visible
             | Hidden
```

When `Visibility` is absent from an `EmbeddedArtifact`, the default is `Visible`.

### Defaults

`DefaultValue` provides an embedding-specific default value where one is defined. The form of the default is determined by the value family of the embedded field. `TextDefaultValue` is also used by `TextFieldType` as the reusable text-specific default carried by that field type.

```ebnf
DefaultValue ::= TextDefaultValue
               | NumericDefaultValue
               | DateDefaultValue
               | TimeDefaultValue
               | DateTimeDefaultValue
               | ControlledTermDefaultValue
               | ChoiceDefaultValue
               | LinkDefaultValue
               | EmailDefaultValue
               | PhoneNumberDefaultValue
               | OrcidDefaultValue
               | RorDefaultValue
               | DoiDefaultValue
               | PubMedIdDefaultValue
               | RridDefaultValue
               | NihGrantIdDefaultValue

TextDefaultValue ::= text_default_value(
                       TextValue
                     )

NumericDefaultValue ::= numeric_default_value(
                          NumericValue
                        )

DateDefaultValue ::= date_default_value(
                       DateValue
                     )

TimeDefaultValue ::= time_default_value(
                       TimeValue
                     )

DateTimeDefaultValue ::= date_time_default_value(
                           DateTimeValue
                         )

ControlledTermDefaultValue ::= controlled_term_default_value(
                                 ControlledTermValue
                               )

ChoiceDefaultValue ::= choice_default_value(
                         ChoiceValue+
                       )

LinkDefaultValue ::= link_default_value(
                       LinkValue
                     )

EmailDefaultValue ::= email_default_value(
                        EmailValue
                      )

PhoneNumberDefaultValue ::= phone_number_default_value(
                              PhoneNumberValue
                            )

OrcidDefaultValue ::= orcid_default_value(
                        OrcidValue
                      )

RorDefaultValue ::= ror_default_value(
                      RorValue
                    )

DoiDefaultValue ::= doi_default_value(
                      DoiValue
                    )

PubMedIdDefaultValue ::= pub_med_id_default_value(
                           PubMedIdValue
                         )

RridDefaultValue ::= rrid_default_value(
                       RridValue
                     )

NihGrantIdDefaultValue ::= nih_grant_id_default_value(
                             NihGrantIdValue
                           )
```

`DefaultValue` provides an embedding-specific default value applied in the context of the containing `Template`. `TextDefaultValue` may appear both on `TextFieldType` (as a reusable field-level default) and on `EmbeddedTextField` (as an embedding-specific override). When both are present, the `TextDefaultValue` on `EmbeddedTextField` MUST take precedence.

### Label Override

`LabelOverride` provides template-specific labeling for an embedded artifact. This allows a template to override the default label of the referenced reusable artifact in that embedding context.

```ebnf
AlternativeLabel ::= alternative_label(
                       UnicodeString
                     )

LabelOverride ::= label_override(
                    Label
                    AlternativeLabel*
                  )
```

## Field Types

`FieldType` denotes the semantic category of values that a `Field` may carry. The `FieldType` productions define the value structure associated with a field and, where appropriate, the typed rendering hints and field-type-specific properties that are valid for that semantic category.

```ebnf
FieldType ::= TextFieldType
            | NumericFieldType
            | TemporalFieldType
            | ControlledTermFieldType
            | ChoiceFieldType
            | LinkFieldType
            | ContactFieldType
            | ExternalAuthorityFieldType
            | AttributeValueFieldType

TextFieldType ::= text_field_type(
                    [TextDefaultValue]
                    [MinLength]
                    [MaxLength]
                    [ValidationRegex]
                    [TextRenderingHint]
                  )

NumericFieldType ::= numeric_field_type(
                       NumericDatatype
                       [Unit]
                       [NumericPrecision]
                       [NumericRenderingHint]
                     )

Unit ::= unit(
           Iri
           [Label]
         )

MinLength ::= min_length(
                NonNegativeInteger
              )

MaxLength ::= max_length(
                NonNegativeInteger
              )

ValidationRegex ::= validation_regex(
                      RegexPattern
                    )

NumericPrecision ::= numeric_precision(
                       NonNegativeInteger
                     )

TemporalFieldType ::= DateFieldType
                    | TimeFieldType
                    | DateTimeFieldType

ControlledTermFieldType ::= controlled_term_field_type(
                              ControlledTermSource+
                            )

ChoiceFieldType ::= SingleChoiceFieldType
                  | MultipleChoiceFieldType

SingleChoiceFieldType ::= single_choice_field_type(
                            ChoiceOption+
                            [SingleChoiceRenderingHint]
                          )

MultipleChoiceFieldType ::= multiple_choice_field_type(
                              ChoiceOption+
                              [MultipleChoiceRenderingHint]
                            )

ChoiceOption ::= choice_option(
                   ChoiceOptionValue
                 )

ChoiceOptionValue ::= Literal
                    | ControlledTermValue
                    | Iri

LinkFieldType ::= link_field_type()

ContactFieldType ::= EmailFieldType
                   | PhoneNumberFieldType

EmailFieldType ::= email_field_type()

PhoneNumberFieldType ::= phone_number_field_type()

ExternalAuthorityFieldType ::= OrcidFieldType
                             | RorFieldType
                             | DoiFieldType
                             | PubMedIdFieldType
                             | RridFieldType
                             | NihGrantIdFieldType

OrcidFieldType ::= orcid_field_type()

RorFieldType ::= ror_field_type()

DoiFieldType ::= doi_field_type()

PubMedIdFieldType ::= pub_med_id_field_type()

RridFieldType ::= rrid_field_type()

NihGrantIdFieldType ::= nih_grant_id_field_type()

AttributeValueFieldType ::= attribute_value_field_type()
```

`Unit` denotes an identified measurement or quantity unit optionally paired with a human-readable label.

The current placement of `Unit` on `NumericFieldType` is a pragmatic compromise. A later revision may introduce a distinct `QuantityFieldType` to model numeric values with fixed units more explicitly.

`ChoiceOption` denotes one permissible option in a choice field.

`ChoiceOptionValue` allows a choice option to be specified by a literal, an ontology-backed controlled term, or an IRI.

### Temporal Field Types

`TemporalFieldType` denotes temporal-valued fields and is refined into strongly typed date, time, and date-time forms. This section groups the temporal field-type productions together with their compatible rendering hints and value-type constraints.

```ebnf
DateFieldType ::= date_field_type(
                    DateValueType
                    [DateRenderingHint]
                  )

DateValueType ::= YearValueType
                | YearMonthValueType
                | FullDateValueType

YearValueType ::= year_value_type()

YearMonthValueType ::= year_month_value_type()

FullDateValueType ::= full_date_value_type()
```

```ebnf
TimeFieldType ::= time_field_type(
                    [TimePrecision]
                    [TimezoneRequirement]
                    [TimeRenderingHint]
                  )

TimePrecision ::= HourMinutePrecision
                | HourMinuteSecondPrecision
                | HourMinuteSecondFractionPrecision

HourMinutePrecision ::= hour_minute_precision()

HourMinuteSecondPrecision ::= hour_minute_second_precision()

HourMinuteSecondFractionPrecision ::= hour_minute_second_fraction_precision()

TimezoneRequirement ::= TimezoneRequired
                      | TimezoneNotRequired

TimezoneRequired ::= timezone_required()

TimezoneNotRequired ::= timezone_not_required()
```

`TimePrecision` identifies the finest time precision permitted by a `TimeFieldType`.

`HourMinutePrecision`, `HourMinuteSecondPrecision`, and `HourMinuteSecondFractionPrecision` identify time values constrained respectively to hour-and-minute precision, second precision, and fractional-second precision.

`TimezoneRequirement` identifies whether timezone information is required by the field type.

> **TODO:** The lexical conformance semantics of `TimePrecision` and `DateTimeValueType` — specifically, whether a value at a coarser precision must omit finer components entirely or may zero them — are unresolved pending clarification from the CEDAR team. No normative lexical constraint is defined here until that is resolved.

```ebnf
DateTimeFieldType ::= date_time_field_type(
                        DateTimeValueType
                        [TimezoneRequirement]
                        [DateTimeRenderingHint]
                      )

DateTimeValueType ::= DateHourMinuteValueType
                    | DateHourMinuteSecondValueType
                    | DateHourMinuteSecondFractionValueType

DateHourMinuteValueType ::= date_hour_minute_value_type()

DateHourMinuteSecondValueType ::= date_hour_minute_second_value_type()

DateHourMinuteSecondFractionValueType ::= date_hour_minute_second_fraction_value_type()
```

`DateTimeValueType` identifies the finest permitted date-time precision.

`DateHourMinuteValueType`, `DateHourMinuteSecondValueType`, and `DateHourMinuteSecondFractionValueType` identify date-time values constrained respectively to minute precision, second precision, and fractional-second precision.

```ebnf
DateRenderingHint ::= date_rendering_hint(
                        DateRenderingWidget
                        [DateFormat]
                      )

DateRenderingWidget ::= DatePickerRenderingWidget

DatePickerRenderingWidget ::= date_picker_rendering_widget()

DateFormat ::= date_format(
                 DateComponentOrder
               )

DateComponentOrder ::= DayMonthYearOrder
                     | MonthDayYearOrder
                     | YearMonthDayOrder

DayMonthYearOrder ::= day_month_year_order()

MonthDayYearOrder ::= month_day_year_order()

YearMonthDayOrder ::= year_month_day_order()

TimeRenderingHint ::= time_rendering_hint(
                        TimeRenderingWidget
                        [TimeFormat]
                      )

TimeRenderingWidget ::= TimePickerRenderingWidget

TimePickerRenderingWidget ::= time_picker_rendering_widget()

DateTimeRenderingHint ::= date_time_rendering_hint(
                            DateTimeRenderingWidget
                            [TimeFormat]
                          )

DateTimeRenderingWidget ::= DateTimePickerRenderingWidget

DateTimePickerRenderingWidget ::= date_time_picker_rendering_widget()

TimeFormat ::= TwelveHourTimeFormat
             | TwentyFourHourTimeFormat

TwelveHourTimeFormat ::= twelve_hour_time_format()

TwentyFourHourTimeFormat ::= twenty_four_hour_time_format()
```

`DateFormat` identifies the ordering used to display or acquire date components.

`DateComponentOrder` identifies whether a date is rendered or acquired in day-month-year, month-day-year, or year-month-day order.

### Controlled Term Sources

Controlled term sources define the ontological authorities from which controlled-term values may be drawn. A `ControlledTermFieldType` requires one or more `ControlledTermSource` entries. Each source specifies either an entire ontology, a branch of an ontology rooted at a given term, a set of individual ontology classes, or an external value set. `TermIri` is defined in the Scalar and Datatype Leaves section.

```ebnf
ControlledTermSource ::= OntologySource
                       | BranchSource
                       | ClassSource
                       | ValueSetSource

OntologySource ::= ontology_source(
                     OntologyReference
                   )

OntologyReference ::= ontology_reference(
                        OntologyIri
                        [OntologyDisplayHint]
                      )

OntologyDisplayHint ::= ontology_display_hint(
                          OntologyDisplayHintContent
                        )

OntologyDisplayHintContent ::= OntologyAcronym
                             | OntologyName
                             | OntologyAcronym OntologyName

BranchSource ::= branch_source(
                   OntologyReference
                   RootTermIri
                   RootTermLabel
                   [MaxTraversalDepth]
                 )

ClassSource ::= class_source(
                  ControlledTermClass+
                )

ControlledTermClass ::= controlled_term_class(
                          TermIri
                          Label
                          OntologyReference
                        )

ValueSetSource ::= value_set_source(
                     ValueSetIdentifier
                     [ValueSetName]
                     [ValueSetIri]
                   )
```

```ebnf
OntologyAcronym ::= ontology_acronym(
                      UnicodeString
                    )

OntologyName ::= ontology_name(
                   UnicodeString
                 )

OntologyIri ::= ontology_iri(
                  Iri
                )

RootTermIri ::= root_term_iri(
                  Iri
                )

RootTermLabel ::= root_term_label(
                    UnicodeString
                  )

MaxTraversalDepth ::= max_traversal_depth(
                        NonNegativeInteger
                      )

ValueSetIdentifier ::= value_set_identifier(
                         UnicodeString
                       )

ValueSetName ::= value_set_name(
                   UnicodeString
                 )

ValueSetIri ::= value_set_iri(
                  Iri
                )
```

`OntologyIri`, `RootTermIri`, and `ValueSetIri` denote IRIs used in controlled-term source specifications.

`OntologyAcronym`, `OntologyName`, `RootTermLabel`, `ValueSetIdentifier`, and `ValueSetName` denote textual controlled-term source metadata.

`MaxTraversalDepth` denotes a non-negative traversal-depth limit for branch-based controlled-term sources.

### Rendering Hints

```ebnf
RenderingHint ::= TextRenderingHint
                | SingleChoiceRenderingHint
                | MultipleChoiceRenderingHint
                | NumericRenderingHint
                | DateRenderingHint
                | TimeRenderingHint
                | DateTimeRenderingHint

TextRenderingHint ::= SingleLineTextRenderingHint
                    | MultiLineTextRenderingHint

SingleLineTextRenderingHint ::= single_line_text_rendering_hint()

MultiLineTextRenderingHint ::= multi_line_text_rendering_hint()

SingleChoiceRenderingHint ::= RadioRenderingHint
                            | SingleSelectDropdownRenderingHint

RadioRenderingHint ::= radio_rendering_hint()

SingleSelectDropdownRenderingHint ::= single_select_dropdown_rendering_hint()

MultipleChoiceRenderingHint ::= CheckboxRenderingHint
                              | MultiSelectDropdownRenderingHint

CheckboxRenderingHint ::= checkbox_rendering_hint()

MultiSelectDropdownRenderingHint ::= multi_select_dropdown_rendering_hint()

NumericRenderingHint ::= NumericInputRenderingHint

NumericInputRenderingHint ::= numeric_input_rendering_hint()
```

The `FieldType` grammar distinguishes semantic variation from presentation variation.

Semantic distinctions MUST remain in `FieldType` when they affect the meaning, cardinality, or value structure of the field.

Presentation distinctions SHOULD be represented by typed rendering hints when they affect only UI behavior.

Accordingly, `TextFieldType` is a single semantic field type whose single-line and multi-line display forms are represented by `TextRenderingHint`.

A `TextFieldType` MAY additionally define a default text value, minimum length, maximum length, and validating regular expression.

Similarly, `ChoiceFieldType` distinguishes `SingleChoiceFieldType` from `MultipleChoiceFieldType` semantically, while the rendering hint determines whether the UI uses radio buttons, checkboxes, or dropdown presentation. Typed rendering hints make incompatible combinations structurally invalid.

Temporal semantics are also split structurally: `DateFieldType`, `TimeFieldType`, and `DateTimeFieldType` are distinct semantic field types, and each carries only the rendering hints and temporal options that are meaningful for that temporal category.

The current rendering vocabulary is explicit but deliberately small: numeric fields use `NumericInputRenderingHint`, date fields use `DatePickerRenderingWidget`, time fields use `TimePickerRenderingWidget`, and date-time fields use `DateTimePickerRenderingWidget`.

## Presentation Components

`PresentationComponent` denotes reusable non-data-bearing content that contributes presentation or instructional structure within a `Template`. Presentation components appear in templates only through `EmbeddedPresentationComponent` and do not contribute `InstanceValue` constructs.

```ebnf
PresentationComponent ::= RichTextComponent
                        | ImageComponent
                        | YoutubeVideoComponent
                        | SectionBreakComponent
                        | PageBreakComponent

RichTextComponent ::= rich_text_component(
                        PresentationComponentId
                        ArtifactMetadata
                        HtmlContent
                      )

ImageComponent ::= image_component(
                     PresentationComponentId
                     ArtifactMetadata
                     ImageSource
                   )

YoutubeVideoComponent ::= you_tube_video_component(
                            PresentationComponentId
                            ArtifactMetadata
                            YoutubeVideoSource
                          )

SectionBreakComponent ::= section_break_component(
                            PresentationComponentId
                            ArtifactMetadata
                          )

PageBreakComponent ::= page_break_component(
                         PresentationComponentId
                         ArtifactMetadata
                       )
```

```ebnf
HtmlContent ::= html_content(
                  UnicodeString
                )
```

`HtmlContent` denotes an HTML fragment represented as a Unicode string and used by a `RichTextComponent`.

This specification does not define a required HTML feature set.

Implementations MAY restrict or sanitize HTML content for security, portability, or rendering reasons.

```ebnf
ImageSource ::= image_source(
                  Iri
                )

YoutubeVideoSource ::= you_tube_video_source(
                         Iri
                       )
```

`ImageSource` and `YoutubeVideoSource` denote IRIs identifying the image or video resource used by the corresponding presentation component.

## Field Type And Value Correspondence

The `FieldType` of a `Field` determines the permitted `Value` forms in corresponding `FieldValue` constructs.

The correspondence is:

- `TextFieldType` to `TextValue`
- `NumericFieldType` to `NumericValue`
- `DateFieldType` to `DateValue`
- `TimeFieldType` to `TimeValue`
- `DateTimeFieldType` to `DateTimeValue`
- `ControlledTermFieldType` to `ControlledTermValue`
- `ChoiceFieldType` to `ChoiceValue`
- `LinkFieldType` to `LinkValue`
- `EmailFieldType` to `EmailValue`
- `PhoneNumberFieldType` to `PhoneNumberValue`
- `OrcidFieldType` to `OrcidValue`
- `RorFieldType` to `RorValue`
- `DoiFieldType` to `DoiValue`
- `PubMedIdFieldType` to `PubMedIdValue`
- `RridFieldType` to `RridValue`
- `NihGrantIdFieldType` to `NihGrantIdValue`
- `AttributeValueFieldType` to `AttributeValue`

## Instances

`TemplateInstance` denotes instance data that conforms to a `Template`. Instance productions are separated here from schema and presentation productions so that the schema model and instance model can be read independently.

```ebnf
TemplateInstance ::= template_instance(
                       TemplateInstanceId
                       ArtifactMetadata
                       TemplateReference
                       InstanceValue*
                     )

InstanceValue ::= FieldValue
                | NestedTemplateInstance

FieldValue ::= field_value(
                 EmbeddedArtifactKey
                 Value*
               )

NestedTemplateInstance ::= nested_template_instance(
                             EmbeddedArtifactKey
                             InstanceValue*
                           )
```

For multi-valued `EmbeddedField`, all values for a single field occurrence are collected within a single `FieldValue` using `Value*`. For multi-valued `EmbeddedTemplate`, multiplicity is represented by multiple `NestedTemplateInstance` constructs sharing the same `EmbeddedArtifactKey` within the containing `TemplateInstance`. This asymmetry reflects the structural difference between scalar repetition (multiple values for one field) and structural repetition (multiple complete nested instances for one embedded template).

> **TODO:** `FieldValue` uses `Value*`, which permits a `FieldValue` with zero values. Whether an empty `FieldValue` is a valid representation of absence for an optional field, or whether absence must be represented by omitting the `FieldValue` entirely (which would make `Value+` correct), is unresolved pending clarification from the CEDAR team.

## Open Questions

- Should embedded artifacts always refer to reusable artifacts by explicit reference construct, or does the CEDAR model require some embeddings to support inline artifact definition?
