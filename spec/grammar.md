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

Production names use `UpperCamelCase`. A production name denotes the abstract category being defined, such as `Template`, `Field`, or `DateFieldSpec`.

Abstract constructor forms use `lower_snake_case`. In this document, a constructor form is the schematic form used to show how an abstract construct is composed, such as `template(...)`, `field(...)`, or `date_field_spec(...)`. The difference between `UpperCamelCase` production names and `lower_snake_case` constructor forms is purely a visual distinction used to make it clear when the grammar is naming a category and when it is showing the abstract form of a construct belonging to that category.

For example, in the production

```ebnf
Template ::= template(
               TemplateId
               SchemaArtifactMetadata
               EmbeddedArtifact*
             )
```

`Template` is the production being defined, while `template(...)` denotes the abstract constructor form of that construct; in other words, it shows the components of a `Template` and how they are composed.

A conceptual overview of the model — describing the principal categories, their relationships, and the design rationale behind key decisions — is provided in [`spec/metamodel.md`](metamodel.md). The present document is the normative formal specification.

## Contents

- [Kernel Grammar](#kernel-grammar)
  - [Core Structure](#core-structure)
  - [Concrete Field Artifacts](#concrete-field-artifacts)
  - [Embedded Artifacts](#embedded-artifacts)
- [Artifact Identity](#artifact-identity)
- [Artifact Metadata](#artifact-metadata)
  - [Aggregate Structure](#aggregate-structure)
  - [Descriptive Metadata](#descriptive-metadata)
  - [Lifecycle Metadata](#lifecycle-metadata)
  - [Schema Versioning](#schema-versioning)
  - [Annotations](#annotations)
- [Scalar and Datatype Leaves](#scalar-and-datatype-leaves)
  - [Primitive String Types](#primitive-string-types)
  - [Core IRI and String Types](#core-iri-and-string-types)
  - [Numeric Datatype Kind](#numeric-datatype-kind)
- [Values](#values)
  - [Scalar Values](#scalar-values)
  - [Temporal Values](#temporal-values)
  - [Controlled Term Value](#controlled-term-value)
  - [Enum Value](#enum-value)
  - [Link Value](#link-value)
  - [Contact Values](#contact-values)
  - [External Authority Values](#external-authority-values)
  - [Attribute Value](#attribute-value)
- [Embedded Artifact Properties](#embedded-artifact-properties)
  - [Embedded Artifact Key](#embedded-artifact-key)
  - [References](#references)
  - [Requirements](#requirements)
  - [Cardinality](#cardinality)
  - [Visibility](#visibility)
  - [Defaults](#defaults)
  - [Label Override](#label-override)
  - [Properties](#properties)
- [Field Specs](#field-specs)
  - [Temporal Field Specs](#temporal-field-specs)
  - [Controlled Term Sources](#controlled-term-sources)
  - [Rendering Hints](#rendering-hints)
- [Presentation Components](#presentation-components)
- [Field Spec And Value Correspondence](#field-spec-and-value-correspondence)
- [Instances](#instances)
- [Open Questions](#open-questions)

## Kernel Grammar

The kernel grammar defines the primary abstract categories of the model and the core schema-level structure that connects them. It introduces reusable schema artifacts, templates, and the embedding constructs through which templates assemble fields, nested templates, and presentation components. Subsequent sections refine the metadata, field-spec families, instance structures, and supporting constructs referenced here.

The diagram below gives an overview of the kernel. `Template` is the central container: it holds an ordered sequence of `EmbeddedArtifact` constructs, each of which contextualises a reusable artifact — a `Field`, a nested `Template`, or a `PresentationComponent` — within that specific template. A `TemplateInstance` records data conforming to a `Template`. Concrete `Field` variants and `FieldSpec` configurations are omitted for clarity.

```mermaid
%%{init: {'themeVariables': {'fontSize': '12px'}}}%%
classDiagram
  class Artifact {
    <<abstract>>
  }
  class SchemaArtifact {
    <<abstract>>
  }
  class Field {
    <<abstract>>
  }
  class Template {
    TemplateId
    ModelVersion
    SchemaArtifactMetadata
    [Header]
    [Footer]
  }
  class PresentationComponent {
    PresentationComponentId
    ModelVersion
    ArtifactMetadata
  }
  class TemplateInstance {
    TemplateInstanceId
    ModelVersion
    ArtifactMetadata
  }

  class EmbeddedArtifact {
    <<abstract>>
  }
  class EmbeddedField {
    EmbeddedArtifactKey
    [ValueRequirement]
    [Cardinality]
    [Visibility]
    [defaultValue]
    [LabelOverride]
    [Property]
  }
  class EmbeddedTemplate {
    EmbeddedArtifactKey
    [ValueRequirement]
    [Cardinality]
    [Visibility]
    [LabelOverride]
    [Property]
  }
  class EmbeddedPresentationComponent {
    EmbeddedArtifactKey
    [Visibility]
    [LabelOverride]
  }
  class Property {
    PropertyIri
    [PropertyLabel]
  }

  Artifact <|-- SchemaArtifact
  Artifact <|-- PresentationComponent
  Artifact <|-- TemplateInstance

  SchemaArtifact <|-- Field
  SchemaArtifact <|-- Template

  Template "1" *-- "0..*" EmbeddedArtifact : contains ordered

  EmbeddedArtifact <|-- EmbeddedField
  EmbeddedArtifact <|-- EmbeddedTemplate
  EmbeddedArtifact <|-- EmbeddedPresentationComponent

  EmbeddedField --> Field : references
  EmbeddedTemplate --> Template : references
  EmbeddedPresentationComponent --> PresentationComponent : references

  EmbeddedField ..> Property : carries
  EmbeddedTemplate ..> Property : carries

  TemplateInstance --> Template : conforms to
```

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
               ModelVersion
               SchemaArtifactMetadata
               [Header]
               [Footer]
               EmbeddedArtifact*
             )

Header ::= header(
             MultilingualString
           )

Footer ::= footer(
             MultilingualString
           )
```

`Header` and `Footer` denote optional human-readable textual content displayed at the top and bottom of a rendered template respectively. Each is a [`MultilingualString`](#multilingual-strings) carrying one or more language-tagged localizations of the same conceptual text.

The following productions introduce the abstract field categories. `Field` remains an abstract category, while the intermediate categories group related concrete field artifacts for readability and shared semantics.

```ebnf
Field ::= TextField
        | NumericField
        | BooleanField
        | TemporalField
        | ControlledTermField
        | EnumField
        | LinkField
        | ContactField
        | ExternalAuthorityField
        | AttributeValueField

NumericField ::= IntegerNumberField
               | RealNumberField

TemporalField ::= DateField
                | TimeField
                | DateTimeField

EnumField ::= SingleValuedEnumField
            | MultiValuedEnumField

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

Each concrete `Field` variant carries exactly four components: a typed artifact identifier that permanently identifies the reusable field; a `ModelVersion` identifying the version of the CEDAR structural model the artifact conforms to; `SchemaArtifactMetadata` providing the descriptive, lifecycle, versioning, and annotation metadata common to all schema artifacts; and a typed `FieldSpec` that specifies the value semantics and configuration for that field category. The identifier and `FieldSpec` are specific to each concrete variant; `ModelVersion` and `SchemaArtifactMetadata` are uniform across all fields. The groupings below mirror the abstract `Field` hierarchy defined in Core Structure.

`TextField`, `BooleanField`, and the two numeric field families (`IntegerNumberField` and `RealNumberField`) are the simple scalar field specs. Each carries the most basic value semantics — free text, `true` / `false`, exact integer values, and real-valued numbers respectively.

```ebnf
TextField ::= text_field(
               TextFieldId
               ModelVersion
               SchemaArtifactMetadata
               TextFieldSpec
             )

BooleanField ::= boolean_field(
                  BooleanFieldId
                  ModelVersion
                  SchemaArtifactMetadata
                  BooleanFieldSpec
                )
```

The numeric field variants correspond to the `NumericField` abstract category. They share the broader concept of numeric content but split semantically: `IntegerNumberField` carries arbitrary-precision integer values (no fractional part); `RealNumberField` carries real-valued numbers (decimal arbitrary precision, or IEEE 754 single- or double-precision floating point). The split is principled: integer arithmetic is exact and closed under the usual operations, whereas real-valued arithmetic carries approximation concerns. See [Field Specs](#field-specs) for the per-family configuration.

```ebnf
IntegerNumberField ::= integer_number_field(
                         IntegerNumberFieldId
                         ModelVersion
                         SchemaArtifactMetadata
                         IntegerNumberFieldSpec
                       )

RealNumberField ::= real_number_field(
                      RealNumberFieldId
                      ModelVersion
                      SchemaArtifactMetadata
                      RealNumberFieldSpec
                    )
```

The temporal field variants correspond to the `TemporalField` abstract category. Each is typed to a distinct temporal semantic — date, time of day, or combined date-time — and carries its own `FieldSpec` with precision and rendering options appropriate to that category.

```ebnf
DateField ::= date_field(
               DateFieldId
               ModelVersion
               SchemaArtifactMetadata
               DateFieldSpec
             )

TimeField ::= time_field(
               TimeFieldId
               ModelVersion
               SchemaArtifactMetadata
               TimeFieldSpec
             )

DateTimeField ::= date_time_field(
                   DateTimeFieldId
                   ModelVersion
                   SchemaArtifactMetadata
                   DateTimeFieldSpec
                 )
```

`ControlledTermField` supports values drawn from declared ontology sources. `LinkField` carries a single IRI-valued hyperlink.

```ebnf
ControlledTermField ::= controlled_term_field(
                          ControlledTermFieldId
                          ModelVersion
                          SchemaArtifactMetadata
                          ControlledTermFieldSpec
                        )

LinkField ::= link_field(
               LinkFieldId
               ModelVersion
               SchemaArtifactMetadata
               LinkFieldSpec
             )
```

`SingleValuedEnumField` and `MultiValuedEnumField` correspond to the `EnumField` abstract category and are the two concrete enum field variants. They differ in whether they permit exactly one or multiple simultaneous selections from a declared set of permissible values. The permitted values are declared in the corresponding `EnumFieldSpec` and are validated against at the instance level.

```ebnf
SingleValuedEnumField ::= single_valued_enum_field(
                            SingleValuedEnumFieldId
                            ModelVersion
                            SchemaArtifactMetadata
                            SingleValuedEnumFieldSpec
                          )

MultiValuedEnumField ::= multi_valued_enum_field(
                           MultiValuedEnumFieldId
                           ModelVersion
                           SchemaArtifactMetadata
                           MultiValuedEnumFieldSpec
                         )
```

The contact field variants correspond to the `ContactField` abstract category and represent human contact identifiers.

```ebnf
EmailField ::= email_field(
                EmailFieldId
                ModelVersion
                SchemaArtifactMetadata
                EmailFieldSpec
              )

PhoneNumberField ::= phone_number_field(
                      PhoneNumberFieldId
                      ModelVersion
                      SchemaArtifactMetadata
                      PhoneNumberFieldSpec
                    )
```

The external authority field variants correspond to the `ExternalAuthorityField` abstract category. Each represents an identifier issued by a specific external authority system, as described in the [External Authority Values](#external-authority-values) section. Each external authority field is associated with format validation specific to its identifier scheme and supports integration with the corresponding resolution service for identifier lookup and verification.

```ebnf
OrcidField ::= orcid_field(
                OrcidFieldId
                ModelVersion
                SchemaArtifactMetadata
                OrcidFieldSpec
              )

RorField ::= ror_field(
              RorFieldId
              ModelVersion
              SchemaArtifactMetadata
              RorFieldSpec
            )

DoiField ::= doi_field(
              DoiFieldId
              ModelVersion
              SchemaArtifactMetadata
              DoiFieldSpec
            )

PubMedIdField ::= pub_med_id_field(
                    PubMedIdFieldId
                    ModelVersion
                    SchemaArtifactMetadata
                    PubMedIdFieldSpec
                  )

RridField ::= rrid_field(
               RridFieldId
               ModelVersion
               SchemaArtifactMetadata
               RridFieldSpec
             )

NihGrantIdField ::= nih_grant_id_field(
                     NihGrantIdFieldId
                     ModelVersion
                     SchemaArtifactMetadata
                     NihGrantIdFieldSpec
                   )
```

`AttributeValueField` supports open-ended name-value pair data whose attribute names are not fixed at schema definition time.

```ebnf
AttributeValueField ::= attribute_value_field(
                          AttributeValueFieldId
                          ModelVersion
                          SchemaArtifactMetadata
                          AttributeValueFieldSpec
                        )
```

The concrete field artifacts defined above are reusable schema-level constructs. A reusable `Field` deliberately does not carry template-local keying, cardinality, visibility, or label override — those properties belong to the embedding context, not to the reusable artifact. To appear within a `Template`, each field must be included via an [Embedded Artifacts](#embedded-artifacts) construct, which adds that template-local context and governs how the field participates in that specific template.

### Embedded Artifacts

An `EmbeddedArtifact` contextualises a reusable artifact within a specific `Template`, adding template-local properties that govern how the artifact participates in that context. There are three forms: `EmbeddedField`, which embeds a data-bearing field; `EmbeddedTemplate`, which nests a template within the containing template; and `EmbeddedPresentationComponent`, which contributes presentational structure without producing instance data.

The sequence of `EmbeddedArtifact` constructs within a `Template` is significant. The order in which they appear determines the presentation order of embedded artifacts in a rendered template. Conforming implementations MUST preserve this order.

```ebnf
EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent

EmbeddedField ::= EmbeddedTextField
                | EmbeddedIntegerNumberField
                | EmbeddedRealNumberField
                | EmbeddedBooleanField
                | EmbeddedDateField
                | EmbeddedTimeField
                | EmbeddedDateTimeField
                | EmbeddedControlledTermField
                | EmbeddedSingleValuedEnumField
                | EmbeddedMultiValuedEnumField
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

Every concrete `EmbeddedField` variant follows the same structural pattern. Each carries: an `EmbeddedArtifactKey` uniquely identifying the embedding site within the containing `Template`; a typed field reference identifying the reusable `Field` being embedded; an optional `ValueRequirement` specifying whether a value is required, recommended, or optional; an optional `Cardinality` bounding the permitted number of values; an optional `Visibility` controlling whether the field is shown in rendered interfaces; an optional `defaultValue` providing an embedding-specific default whose type is the family-specific `Value` type (e.g. `TextValue` for `EmbeddedTextField`, `DateValue` for `EmbeddedDateField`); an optional `LabelOverride` allowing the template to override the field's label in this context; and an optional `Property` associating a semantic property IRI with the embedding site. The only variation across concrete `EmbeddedField` variants is the typed field reference and the typed default value, both of which match the value family of the referenced field.

`EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` are the two exceptions to this pattern: each omits the `[Cardinality]` slot. A boolean field is inherently single-valued — its `ValueRequirement` slot already distinguishes the meaningful states (required, recommended, optional). A `SingleValuedEnumField` is similarly single-valued by construction; multi-valued enum embedding is expressed only through `EmbeddedMultiValuedEnumField`. `EmbeddedMultiValuedEnumField` further differs in that its embedding-level default is a sequence (`EnumValue*`) rather than a single optional value, parallel to how multi-valued enum instance values appear as a sequence in `FieldValue`.

```ebnf
EmbeddedTextField ::= embedded_text_field(
                        EmbeddedArtifactKey
                        TextFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [TextValue]
                        [LabelOverride]
                        [Property]
                      )

EmbeddedIntegerNumberField ::= embedded_integer_number_field(
                                 EmbeddedArtifactKey
                                 IntegerNumberFieldId
                                 [ValueRequirement]
                                 [Cardinality]
                                 [Visibility]
                                 [IntegerNumberValue]
                                 [LabelOverride]
                                 [Property]
                               )

EmbeddedRealNumberField ::= embedded_real_number_field(
                              EmbeddedArtifactKey
                              RealNumberFieldId
                              [ValueRequirement]
                              [Cardinality]
                              [Visibility]
                              [RealNumberValue]
                              [LabelOverride]
                              [Property]
                            )

EmbeddedBooleanField ::= embedded_boolean_field(
                           EmbeddedArtifactKey
                           BooleanFieldId
                           [ValueRequirement]
                           [Visibility]
                           [BooleanValue]
                           [LabelOverride]
                           [Property]
                         )

EmbeddedDateField ::= embedded_date_field(
                        EmbeddedArtifactKey
                        DateFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [DateValue]
                        [LabelOverride]
                        [Property]
                      )

EmbeddedTimeField ::= embedded_time_field(
                        EmbeddedArtifactKey
                        TimeFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [TimeValue]
                        [LabelOverride]
                        [Property]
                      )

EmbeddedDateTimeField ::= embedded_date_time_field(
                            EmbeddedArtifactKey
                            DateTimeFieldId
                            [ValueRequirement]
                            [Cardinality]
                            [Visibility]
                            [DateTimeValue]
                            [LabelOverride]
                            [Property]
                          )

EmbeddedControlledTermField ::= embedded_controlled_term_field(
                                  EmbeddedArtifactKey
                                  ControlledTermFieldId
                                  [ValueRequirement]
                                  [Cardinality]
                                  [Visibility]
                                  [ControlledTermValue]
                                  [LabelOverride]
                                  [Property]
                                )

EmbeddedSingleValuedEnumField ::= embedded_single_valued_enum_field(
                                    EmbeddedArtifactKey
                                    SingleValuedEnumFieldId
                                    [ValueRequirement]
                                    [Visibility]
                                    [EnumValue]
                                    [LabelOverride]
                                    [Property]
                                  )

EmbeddedMultiValuedEnumField ::= embedded_multi_valued_enum_field(
                                   EmbeddedArtifactKey
                                   MultiValuedEnumFieldId
                                   [ValueRequirement]
                                   [Cardinality]
                                   [Visibility]
                                   EnumValue*
                                   [LabelOverride]
                                   [Property]
                                 )

EmbeddedLinkField ::= embedded_link_field(
                        EmbeddedArtifactKey
                        LinkFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [LinkValue]
                        [LabelOverride]
                        [Property]
                      )

EmbeddedEmailField ::= embedded_email_field(
                         EmbeddedArtifactKey
                         EmailFieldId
                         [ValueRequirement]
                         [Cardinality]
                         [Visibility]
                         [EmailValue]
                         [LabelOverride]
                         [Property]
                       )

EmbeddedPhoneNumberField ::= embedded_phone_number_field(
                               EmbeddedArtifactKey
                               PhoneNumberFieldId
                               [ValueRequirement]
                               [Cardinality]
                               [Visibility]
                               [PhoneNumberValue]
                               [LabelOverride]
                               [Property]
                             )

EmbeddedOrcidField ::= embedded_orcid_field(
                         EmbeddedArtifactKey
                         OrcidFieldId
                         [ValueRequirement]
                         [Cardinality]
                         [Visibility]
                         [OrcidValue]
                         [LabelOverride]
                         [Property]
                       )

EmbeddedRorField ::= embedded_ror_field(
                       EmbeddedArtifactKey
                       RorFieldId
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [RorValue]
                       [LabelOverride]
                       [Property]
                     )

EmbeddedDoiField ::= embedded_doi_field(
                       EmbeddedArtifactKey
                       DoiFieldId
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [DoiValue]
                       [LabelOverride]
                       [Property]
                     )

EmbeddedPubMedIdField ::= embedded_pub_med_id_field(
                            EmbeddedArtifactKey
                            PubMedIdFieldId
                            [ValueRequirement]
                            [Cardinality]
                            [Visibility]
                            [PubMedIdValue]
                            [LabelOverride]
                            [Property]
                          )

EmbeddedRridField ::= embedded_rrid_field(
                        EmbeddedArtifactKey
                        RridFieldId
                        [ValueRequirement]
                        [Cardinality]
                        [Visibility]
                        [RridValue]
                        [LabelOverride]
                        [Property]
                      )

EmbeddedNihGrantIdField ::= embedded_nih_grant_id_field(
                               EmbeddedArtifactKey
                               NihGrantIdFieldId
                               [ValueRequirement]
                               [Cardinality]
                               [Visibility]
                               [NihGrantIdValue]
                               [LabelOverride]
                               [Property]
                             )

EmbeddedAttributeValueField ::= embedded_attribute_value_field(
                                  EmbeddedArtifactKey
                                  AttributeValueFieldId
                                  [ValueRequirement]
                                  [Cardinality]
                                  [Visibility]
                                  [LabelOverride]
                                  [Property]
                                )
```

`EmbeddedTemplate` and `EmbeddedPresentationComponent` follow a similar pattern to embedded fields but differ in what embedding properties they carry. `EmbeddedTemplate` supports cardinality to permit multiple nested instances of the referenced template, carries no typed default value, and carries an optional `Property` associating a semantic property IRI with the embedding site. `EmbeddedPresentationComponent` carries neither a value requirement, cardinality, default value, label override, nor property, as it contributes no instance data and exists purely to contribute presentational structure. The only embedding-level property it carries is `Visibility`.

```ebnf
EmbeddedTemplate ::= embedded_template(
                       EmbeddedArtifactKey
                       TemplateId
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [LabelOverride]
                       [Property]
                     )

EmbeddedPresentationComponent ::= embedded_presentation_component(
                                    EmbeddedArtifactKey
                                    PresentationComponentId
                                    [Visibility]
                                  )
```

## Artifact Identity

Artifact identity defines the typed identifiers by which artifacts and artifact references are denoted in the model. These identity constructs are distinct from descriptive metadata, lifecycle metadata, versioning, and annotations.

Each field kind has its own typed identifier rather than sharing a single generic `FieldId`. This provides strong typing: an `EmbeddedTextField` can only carry a `TextFieldId` at its `artifactRef` slot, an `EmbeddedDateField` can only carry a `DateFieldId`, and so on, making it structurally impossible to embed a field of the wrong type. `TemplateId`, `PresentationComponentId`, and `TemplateInstanceId` follow the same pattern for the same reason.

Identifiers serve two roles: at the **definition site** of a reusable artifact (e.g. `Field.id`, `Template.id`) they permanently name the artifact; at the **embedding site** (e.g. `EmbeddedField.artifactRef`, `EmbeddedTemplate.artifactRef`) they reference the artifact being embedded. The same typed identifier production is used at both positions; the role distinction is conveyed by the surrounding production's component name.

```ebnf
FieldId ::= TextFieldId
          | IntegerNumberFieldId
          | RealNumberFieldId
          | BooleanFieldId
          | DateFieldId
          | TimeFieldId
          | DateTimeFieldId
          | ControlledTermFieldId
          | SingleValuedEnumFieldId
          | MultiValuedEnumFieldId
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

IntegerNumberFieldId ::= integer_number_field_id( Iri )

RealNumberFieldId ::= real_number_field_id( Iri )

BooleanFieldId ::= boolean_field_id( Iri )

DateFieldId ::= date_field_id( Iri )

TimeFieldId ::= time_field_id( Iri )

DateTimeFieldId ::= date_time_field_id( Iri )

ControlledTermFieldId ::= controlled_term_field_id( Iri )

SingleValuedEnumFieldId ::= single_valued_enum_field_id( Iri )

MultiValuedEnumFieldId ::= multi_valued_enum_field_id( Iri )

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

All artifact identifier productions are IRI-valued. See [`Iri`](#core-iri-and-string-types).

Concrete serializations need not preserve the per-family identifier distinctions drawn here. In the JSON wire encoding, every artifact identifier — whether a per-family `FieldId` variant such as `TextFieldId` or `SingleValuedEnumFieldId`, or one of the non-field identifiers `TemplateId`, `PresentationComponentId`, and `TemplateInstanceId` — is encoded as a bare IRI string with no per-family discriminator. The field family of a `FieldId` reference is recovered from the `kind` of the enclosing `Field` or `EmbeddedField`. See [`wire-grammar.md`](wire-grammar.md) §5 and [`serialization.md`](serialization.md).

## Artifact Metadata

Artifact metadata defines descriptive information, lifecycle information, versioning, and annotations. `ArtifactMetadata` provides the common metadata carried by all artifacts other than identity. `SchemaArtifactMetadata` extends that common structure with schema-versioning information used by reusable schema artifacts.

### Aggregate Structure

This subsection identifies how the metadata categories are grouped at the artifact level. `ArtifactMetadata` carries the metadata common to all artifacts other than identity — descriptive properties, lifecycle metadata, and annotations — directly as members. `SchemaArtifactMetadata` adds versioning information for reusable schema artifacts.

```ebnf
SchemaArtifactMetadata ::= schema_artifact_metadata(
                             ArtifactMetadata
                             SchemaArtifactVersioning
                           )

ArtifactMetadata ::= artifact_metadata(
                       Name
                       [Description]
                       [Identifier]
                       [PreferredLabel]
                       AlternativeLabel*
                       LifecycleMetadata
                       Annotation*
                     )
```

### Descriptive Metadata

The descriptive metadata of an artifact comprises a set of human-oriented properties carried directly by `ArtifactMetadata`. These properties support naming, explanatory text, and external or local identifiers used for cataloging. `Name` is the required user-supplied name of the artifact. `Description`, when present, is extended textual description explaining the artifact's purpose and content. `Identifier`, when present, is a user-specified external identifier intended for integration with institutional or external systems. `PreferredLabel`, when present, is the primary display label shown to end users — for fields, this is the question text presented in a rendered form. `AlternativeLabel`, when present, provides additional display labels for the artifact.

```ebnf
Name ::= name(
           MultilingualString
         )

Description ::= description(
                  MultilingualString
                )

Identifier ::= identifier(
                 string
               )
```

`Name` and `Description` carry [`MultilingualString`](#multilingual-strings) values: human-readable text that may be presented in one or more natural languages. `Identifier` carries an arbitrary Unicode string value: it is a technical user-supplied key intended for integration with external systems and is not a human-display label, so it is not multilingual. `PreferredLabel` is defined in the [Controlled Term Value](#controlled-term-value) section; `AlternativeLabel` is defined in the [Label Override](#label-override) section.

> **Note:** Confirm with the CEDAR team that `PreferredLabel` and `AlternativeLabel` belong on `ArtifactMetadata` for all artifact kinds rather than on a field-specific metadata structure. The v2.0.0 conceptual document (§4.1) describes these in the context of fields specifically; it is worth verifying whether templates, presentation components, and instances should carry them too.

### Lifecycle Metadata

`LifecycleMetadata` identifies when an artifact was created and modified, and which agents were responsible for those actions.

```ebnf
LifecycleMetadata ::= lifecycle_metadata(
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

See [`IsoDateTimeStamp`](#core-iri-and-string-types) and [`Iri`](#core-iri-and-string-types).

### Schema Versioning

`SchemaArtifactVersioning` identifies version-related metadata specific to reusable schema artifacts. It captures artifact version, publication status, and optional derivation links to earlier or source artifacts.

```ebnf
SchemaArtifactVersioning ::= schema_artifact_versioning(
                       Version
                       Status
                       [PreviousVersion]
                       [DerivedFrom]
                     )
```

```ebnf
Version ::= version(
              SemanticVersion
            )

Status ::= "draft" | "published"

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

`Version` denotes a Semantic Versioning 2.0.0 version identifier.

`Status` denotes the publication status of a reusable schema artifact and is restricted to `draft` or `published`.

`PreviousVersion` and `DerivedFrom` denote IRIs identifying related source or predecessor artifacts.

The combined meaning of these fields and their interaction with artifact identity is specified in [Versioning Model](#versioning-model) below.

#### Versioning Model

The CEDAR versioning model rests on one guiding rule: **identity is per-version**. Every version of a `Field` or `Template` is itself a distinct `Artifact` with its own IRI. There is no separate "version-independent" identifier for the conceptual artifact; what holds successive versions together is the `PreviousVersion` link from each artifact to the one it replaces.

**Identity and immutability.** Every reusable schema artifact (every `Field` and every `Template`) is identified by a single `SchemaArtifactId` (a `FieldId` or `TemplateId`). That IRI denotes one specific version: distinct versions of "the same" artifact are distinct artifacts in the model, each with its own IRI. A `published` artifact MUST be treated as immutable — once `Status` is `"published"`, the content addressed by its IRI MUST NOT change. A `draft` artifact MAY be edited in place while its `Status` remains `"draft"`. The transition from `draft` to `published` is one-way: an artifact whose `Status` is `"published"` MUST NOT transition back to `"draft"`.

**Creating a new version.** To produce a revised version of a published artifact, mint a new IRI, allocate a new artifact at that IRI with `Status` set to `"draft"`, and set `PreviousVersion` to the IRI of the artifact being revised. Editing happens on the new draft; once the new artifact is itself published, it joins the version chain and becomes immutable in turn. The published predecessor is unaffected by the existence of its successor: it remains addressable at its own IRI and continues to be a valid target for `TemplateInstance` references.

**Version chains.** Successive versions of an artifact form a *version chain*: a sequence of distinct artifacts, each with its own IRI, linked by `PreviousVersion`. Artifact `B` is the immediate successor of artifact `A` when `B.previousVersion = A.id`. The first artifact in a chain MUST omit `PreviousVersion`. Every subsequent artifact in the chain MUST set `PreviousVersion` to the IRI of its immediate predecessor. A chain is therefore a singly-linked list of IRIs, traversable backwards from any version to the original.

**The role of `Version`.** `Version` carries a Semantic Versioning identifier as advisory metadata describing this artifact's place in its chain (e.g. `1.0.0` → `1.1.0` for a backwards-compatible change, `1.0.0` → `2.0.0` for a breaking change). The pairing of IRI and `PreviousVersion` is what *authoritatively* establishes the chain; `Version` is descriptive and is not load-bearing for chain identity. Successive artifacts in a chain SHOULD carry monotonically increasing `SemanticVersion` values, but this specification does not impose a structural constraint to that effect.

**Derivation versus succession.** `DerivedFrom` and `PreviousVersion` are distinct relationships and answer different questions. `PreviousVersion` records *succession within a single version chain*: the successor is intended to replace its predecessor as the same conceptual artifact evolves. `DerivedFrom` records *non-version lineage*: the new artifact is a fork or adaptation — it was authored by copying or modifying an existing artifact, but it is not the next version of that artifact. A fork begins its own independent version chain. Typical uses of `DerivedFrom` include adopting a community-published template into an institutional namespace or spawning a specialised variant of an existing field. An artifact MAY carry both `PreviousVersion` and `DerivedFrom` simultaneously: the artifact succeeds another within its own chain *and* was originally derived from a separate source artifact. The two relationships are independent. `PreviousVersion` and `DerivedFrom`, when both present, MUST NOT carry the same IRI value — succession and derivation are mutually exclusive at any single point.

**Summary of normative rules.**

1. Every version of a `Field` or `Template` MUST have a distinct IRI.
2. A `published` artifact MUST NOT change at its IRI.
3. A `published` artifact MUST NOT transition back to `draft`.
4. The first artifact in a version chain MUST omit `PreviousVersion`. Every other artifact in the chain MUST set `PreviousVersion` to the IRI of its immediate predecessor in that chain.
5. When both `PreviousVersion` and `DerivedFrom` are present on the same artifact, they MUST NOT carry the same IRI.

### Annotations

`Annotation` provides an extensible metadata mechanism for additional named metadata values that are not captured by the core descriptive, lifecycle, or versioning structures. The first `Iri` identifies the annotation property — the predicate IRI under which the annotation is asserted. The `AnnotationValue` is the associated metadata value: either a string-bearing scalar or an IRI. This supports linking to external resources such as DOIs and grant identifiers, as well as storing institutional metadata.

```ebnf
Annotation ::= annotation(
                 Iri
                 AnnotationValue
               )

AnnotationValue ::= AnnotationStringValue
                  | Iri

AnnotationStringValue ::= annotation_string_value(
                            LexicalForm
                            [LanguageTag]
                          )
```

`AnnotationValue` is a direct union of `AnnotationStringValue` and `Iri`. The two variants represent the only forms an annotation value may take in this model: a string-bearing value carrying a lexical form with an optional language tag, or an IRI denoting a resource. `AnnotationStringValue` does not carry an explicit datatype: lexically-typed annotations are not modelled at this position, since annotation metadata is by convention either text or IRI-valued.

See [`Iri`](#core-iri-and-string-types).

## Scalar and Datatype Leaves

The following productions define the primitive leaf types used throughout this grammar. They represent the atomic constructs from which all other productions are built: IRIs, typed string domains, lexical forms, multilingual textual metadata, numeric and temporal datatype IRIs, and textual metadata values.

### Primitive String Types

The following nonterminals are intentionally left abstract. They define the string-valued leaf types referenced by the productions in this section and are not themselves model-level constructs.

- `SemanticVersion` denotes a Semantic Versioning 2.0.0 lexical form and MUST conform to the Semantic Versioning 2.0.0 specification as defined at [semver.org](https://semver.org/).
- `IriString` denotes the lexical form of an IRI.
- `Bcp47Tag` denotes a well-formed BCP 47 language tag.
- `Iso8601DateTimeLexicalForm` denotes an ISO 8601 date-time lexical form.
- `AsciiIdentifier` denotes an identifier matching the pattern `[A-Za-z][A-Za-z0-9_-]*`: it begins with an ASCII letter followed by zero or more ASCII letters, digits, underscores, or hyphens.
- `IntegerLexicalForm` denotes a base-10 integer lexical form.

### Core IRI and String Types

This subsection defines the fundamental IRI, string, and numeric leaf types that appear throughout the grammar. `Iri` is the base construct for all IRI-valued positions. `TermIri` is a specialised IRI form for controlled-vocabulary references. `LanguageTag` and `LexicalForm` are leaf string types used by `Value` constructs that carry localized or lexically-typed content. `IsoDateTimeStamp` carries ISO 8601 date-time values used in lifecycle metadata. `NonNegativeInteger` supports field-spec constraints.

```ebnf
Iri ::= iri(
          IriString
        )

TermIri ::= term_iri(
              Iri
            )

LanguageTag ::= language_tag(
                  Bcp47Tag
                )

LexicalForm ::= lexical_form(
                  string
                )

IsoDateTimeStamp ::= iso_date_time_stamp(
                       Iso8601DateTimeLexicalForm
                     )

NonNegativeInteger ::= non_negative_integer(
                         IntegerLexicalForm
                       )
```

`Iri` denotes an Internationalized Resource Identifier. It corresponds to the `xsd:anyURI` datatype; implementations MAY represent it as a plain string provided it is a syntactically valid IRI.

`TermIri` denotes an `Iri` that identifies a term in a controlled vocabulary or ontology. It is used in `ControlledTermValue`, `ControlledTermClass`, and `Meaning`.

`LanguageTag` denotes a well-formed BCP 47 language tag.

`LexicalForm` denotes a Unicode string and SHOULD be in Unicode Normalization Form C.

`IsoDateTimeStamp` denotes an ISO 8601 date-time lexical form.

`NonNegativeInteger` denotes an integer greater than or equal to zero.

### Multilingual Strings

`LangString` and `MultilingualString` are the constructs used at every grammar position that carries human-display text. They distinguish localizations of one conceptual string from technical Unicode-string keys (which remain plain `string`-valued; see [`Identifier`](#descriptive-metadata) and the controlled-term-source identifiers in [Controlled Term Sources](#controlled-term-sources)).

```ebnf
LangString ::= lang_string(
                 string
                 Bcp47Tag
               )

MultilingualString ::= multilingual_string(
                         LangString+
                       )
```

`LangString` pairs a textual value with a BCP 47 language tag identifying its natural language.

`MultilingualString` denotes a non-empty set of `LangString` entries representing localizations of one conceptual string. The entries' language tags MUST be unique within a `MultilingualString` (case-folded comparison): the construct represents a set of localizations, not a list of phrasings within a single language.

The `'und'` (undetermined) BCP 47 subtag MAY be used to denote a `LangString` whose natural language is unspecified. Implementations MAY use `'und'` as the default tag when constructing a `MultilingualString` from a bare string with no language information.

`MultilingualString` differs from a single language-tagged scalar value (such as `TextValue` with a `LanguageTag`) in that it carries an unweighted localization *set* — multiple language tags coexist for the same conceptual string at metadata positions such as `Template.header` or `ArtifactMetadata.name`.

### Numeric Datatype Kind

`IntegerNumberValue` is fixed to a single integer category; its datatype is implicit and is not a configurable component of the production. `RealNumberValue` carries an explicit `RealNumberDatatypeKind` chosen from three alternatives — `decimal`, `float`, or `double`. The kind names are CEDAR-native enum values; their corresponding XSD datatype IRIs are defined externally to the abstract grammar by [`rdf-projection.md`](rdf-projection.md).

```ebnf
RealNumberDatatypeKind ::= "decimal" | "float" | "double"
```

`decimal` denotes exact arbitrary-precision decimal numbers. `float` and `double` denote IEEE 754 single- and double-precision floating-point numbers respectively.

This specification narrows the supported numeric kinds to four (one integer kind plus the three real-number kinds). Earlier drafts admitted the full XSD numeric hierarchy (16 datatypes including `long`, `short`, `byte`, the signed/unsigned bounded subtypes, and the sign-constrained subtypes such as `nonNegativeInteger`); those are not part of the conforming set. Sign and range constraints are expressed via `IntegerNumberMinValue` / `IntegerNumberMaxValue` (or the real-valued equivalents). Bit-precision distinctions are not modelled at the type level; `decimal` covers exact arbitrary precision when needed, and `float` / `double` cover IEEE 754 single- and double-precision when storage precision matters.

## Values

This section defines the `Value` types that represent instance-level data. `Value` constructs appear in `FieldValue` instances and as typed default values in `EmbeddedArtifact` properties. The value types are defined here independently of the `FieldSpec` productions that constrain them; the normative mapping between each `FieldSpec` and its permitted `Value` form is given in the [Field Spec And Value Correspondence](#field-spec-and-value-correspondence) section.

```ebnf
Value ::= TextValue
        | NumericValue
        | BooleanValue
        | DateValue
        | TimeValue
        | DateTimeValue
        | ControlledTermValue
        | EnumValue
        | LinkValue
        | EmailValue
        | PhoneNumberValue
        | ExternalAuthorityValue
        | AttributeValue

NumericValue ::= IntegerNumberValue
               | RealNumberValue
```

### Scalar Values

`TextValue`, `BooleanValue`, and the two numeric value forms (`IntegerNumberValue` and `RealNumberValue`) are the simplest value types. Each carries the family-specific content directly: a lexical form for the string-bearing variants, a boolean payload for `BooleanValue`. `TextValue` carries an optional `LanguageTag`; when present, the value is a language-tagged string, when absent, a plain string. `IntegerNumberValue` carries a base-10 integer lexical form; its category is implicit and not carried as a component. `RealNumberValue` carries a base-10 real-valued lexical form paired with an explicit `RealNumberDatatypeKind` (`decimal`, `float`, or `double`).

```ebnf
TextValue ::= text_value(
                LexicalForm
                [LanguageTag]
              )

IntegerNumberValue ::= integer_number_value(
                         LexicalForm
                       )

RealNumberValue ::= real_number_value(
                      LexicalForm
                      RealNumberDatatypeKind
                    )

BooleanValue ::= boolean_value(
                   boolean
                 )
```

`IntegerNumberValue`'s lexical form MUST be a base-10 integer literal (per the `IntegerLexicalForm` primitive in §Primitive String Types). `RealNumberValue`'s lexical form is a base-10 real-valued literal whose admissible form depends on the carried datatype: `decimal` admits an arbitrary-precision decimal lexical form; `float` and `double` admit IEEE 754-style lexical forms (including special values such as `INF`, `-INF`, and `NaN`).

`NumericValue` is the abstract category admitting `IntegerNumberValue` and `RealNumberValue`; the two are distinct concrete value types and a `FieldValue` carrying numeric content discriminates between them by `kind`.

The lexical form of any string-bearing value SHOULD be in Unicode Normalization Form C.

A `Value` whose lexical form lies outside the lexical space of its declared datatype is **ill-typed**: it is not syntactically ill-formed but does not determine a valid value. Implementations MUST accept ill-typed values and MAY produce warnings when encountering them. The corresponding RDF projection (see [rdf-projection.md](rdf-projection.md)) preserves the ill-typed lexical form.

### Temporal Values

Temporal values represent date, time, and date-time data, corresponding directly to `DateFieldSpec`, `TimeFieldSpec`, and `DateTimeFieldSpec` respectively. `DateValue` is further refined into three precision variants — `YearValue`, `YearMonthValue`, and `FullDateValue`. Each temporal `Value` variant carries a `LexicalForm` directly; the temporal category is fixed by the variant's `kind`. `FullDateValue` carries an ISO 8601 calendar-date lexical form; `TimeValue` carries an ISO 8601 time-of-day lexical form; `DateTimeValue` carries an ISO 8601 combined date-time lexical form. `YearValue` and `YearMonthValue` carry plain strings matching the patterns `YYYY` and `YYYY-MM` respectively. The RDF projection of these values is defined separately in [`rdf-projection.md`](rdf-projection.md).

```ebnf
DateValue ::= YearValue
            | YearMonthValue
            | FullDateValue

YearValue ::= year_value(
                LexicalForm    (* matches YYYY, e.g. "2024" *)
              )

YearMonthValue ::= year_month_value(
                     LexicalForm    (* matches YYYY-MM, e.g. "2024-06" *)
                   )

FullDateValue ::= full_date_value(
                    LexicalForm
                  )

TimeValue ::= time_value(
                LexicalForm
              )

DateTimeValue ::= date_time_value(
                    LexicalForm
                  )
```

### Controlled Term Value

A controlled term value identifies a term drawn from an ontology, branch, class set, or value set declared in the corresponding `ControlledTermFieldSpec`. It carries a `TermIri` identifying the term, together with an optional human-readable `Label` and optional `Notation` and `PreferredLabel` terminology metadata from the source ontology. `Label` is the display label intended for end-user presentation; `Notation` is a symbolic code (typically a SKOS notation) bound to the term; `PreferredLabel` is the ontology's own preferred label for the term, distinct from the display `Label` that may have been customized for the surrounding context.

A `ControlledTermValue` MAY omit `Label`: a consumer that has access to the source ontology can resolve the term's display label from the `TermIri`. Producers SHOULD include `Label` when it is known at the point of value construction so that downstream consumers without ontology access can render the value.

```ebnf
Label ::= label(
            MultilingualString
          )

Notation ::= notation(
               string
             )

PreferredLabel ::= preferred_label(
                     MultilingualString
                   )

ControlledTermValue ::= controlled_term_value(
                          TermIri
                          [Label]
                          [Notation]
                          [PreferredLabel]
                        )
```

`Label` and `PreferredLabel` are [`MultilingualString`](#multilingual-strings) values: each carries one or more language-tagged localizations of the term's display label. `Notation` is a plain Unicode string: it is a technical symbolic code (typically a SKOS notation) rather than human-display text, and is therefore not multilingual.

### Enum Value

An enum value carries a selection from the permissible values declared by an `EnumFieldSpec`. Every enum value is identified by a `Token` — a non-empty Unicode string that serves as the canonical key of one of the enum spec's `PermissibleValue` entries. A conforming instance value MUST equal the `Token` of one of the referenced spec's permissible values.

```ebnf
EnumValue ::= enum_value(
                Token
              )
```

`Token` is the leaf type used as the canonical key of an enum selection. It is defined in the [Field Specs](#field-specs) section alongside the related leaf productions (`PermissibleValue`, `Meaning`) used by `EnumFieldSpec`.

### Link Value

A link value represents a hyperlink or URL-valued field. It carries an `Iri` identifying the linked resource and an optional `Label` providing a human-readable display label for the link.

```ebnf
LinkValue ::= link_value(
                Iri
                [Label]
              )
```

`Label` is the same `MultilingualString`-valued production used by [`ControlledTermValue`](#controlled-term-value), [`PermissibleValue`](#field-specs), and the external-authority value types: a label is treated uniformly as a localizable display string. A hyperlink's display text MAY therefore carry one or more language-tagged localizations.

### Contact Values

Contact values represent human contact identifiers. `EmailValue` carries an email address as a plain `LexicalForm`; `PhoneNumberValue` carries a telephone number as a plain `LexicalForm`. Format validation is left to implementations.

```ebnf
EmailValue ::= email_value(
                 LexicalForm
               )

PhoneNumberValue ::= phone_number_value(
                       LexicalForm
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

An attribute value is a name-value pair used to represent arbitrary named properties whose names are not known at schema definition time. `AttributeName` carries the name of the attribute as a Unicode string. The value component is itself a `Value`, permitting attribute values to carry any value type including nested attribute values. Nesting depth is unbounded at the model level; concrete implementations MAY impose practical limits.

```ebnf
AttributeName ::= attribute_name(
                    string
                  )

AttributeValue ::= attribute_value(
                     AttributeName
                     Value
                   )
```

## Embedded Artifact Properties

Embedded artifact properties define the contextual information carried by an `EmbeddedArtifact` within a `Template`. These properties govern how a referenced reusable artifact is used in that template context, including key, reference, requirement, cardinality, visibility, defaults, and label override, and they are distinct from the intrinsic properties of the referenced reusable artifact itself.

### Embedded Artifact Key

An `EmbeddedArtifactKey` is the local identifier of an `EmbeddedArtifact` within a `Template`. It is the key by which an embedded field, embedded template, or embedded presentation component is distinguished from other embedded artifacts in the same template. This key is also the mechanism that connects template structure to instance structure: `FieldValue` and `NestedTemplateInstance` use `EmbeddedArtifactKey` to identify which embedded artifact in the template they correspond to.

```ebnf
EmbeddedArtifactKey ::= embedded_artifact_key(
                          AsciiIdentifier
                        )
```

`EmbeddedArtifactKey` MUST match the pattern `[A-Za-z][A-Za-z0-9_-]*`: it MUST begin with an ASCII letter followed by zero or more ASCII letters, digits, underscores, or hyphens.

`EmbeddedArtifactKey` values are local to a `Template` and MUST be unique within that `Template`.

`EmbeddedArtifactKey` is distinct from artifact identifiers such as `FieldId` and `TemplateId`. It identifies the embedding site within a template rather than the reusable artifact being referenced. The same reusable `Field` may be embedded more than once in a `Template` under different keys, and each key independently identifies that embedding site in both the template structure and any corresponding `TemplateInstance`.

### Requirements

`ValueRequirement` identifies whether a value is required, recommended, or optional in the embedding context. `Required` means that a value must be supplied for conformance. `Recommended` and `Optional` are identical for conformance purposes: absence of a value MUST NOT cause conformance failure in either case. The distinction is one of authoring guidance only: implementations SHOULD encourage entry for `Recommended` fields and MAY issue warnings when such fields are left empty.

```ebnf
ValueRequirement ::= "required" | "recommended" | "optional"
```

When `ValueRequirement` is absent from an `EmbeddedArtifact`, the default is `"optional"`.

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
                     NonNegativeInteger
                   )
```

When `MaxCardinality` is absent from a present `Cardinality`, the cardinality is unbounded above: any number of occurrences greater than or equal to the specified `MinCardinality` is permitted. Unboundedness is therefore expressed by omission of `MaxCardinality` rather than by a distinct construct.

When `Cardinality` is absent from an `EmbeddedArtifact`, the implied default is `min_cardinality(1)` with `max_cardinality(1)`: the embedded artifact MUST appear exactly once.

`ValueRequirement` and `Cardinality` are orthogonal. `ValueRequirement` governs whether the user is obligated to supply any values at all. `Cardinality` governs the permitted count of values if any are supplied. A field may therefore be `Optional` — meaning the user is not required to fill it in — while carrying a `min_cardinality` greater than one, meaning that if values are supplied, at least that many must be present. For example, a primer pair field might be `Optional` but carry `min_cardinality(2)`, because a primer pair is only interpretable when both the forward and reverse primers are specified together.

### Visibility

`Visibility` determines whether the embedded artifact is shown in rendered interfaces. It is modeled as an embedding property rather than as a rendering hint because it applies to any kind of embedded artifact, not only to fields.

```ebnf
Visibility ::= "visible" | "hidden"
```

When `Visibility` is absent from an `EmbeddedArtifact`, the default is `"visible"`.

### Defaults

The optional `defaultValue` component of an `EmbeddedField` specifies the value to be pre-populated for that embedding when no explicit value has been supplied by the user. The `defaultValue` slot is typed family-by-family with the family-specific `Value` type that the embedded field accepts. The per-family typing is given by the table below and appears directly in each `EmbeddedXxxField` production above.

| Embedded field | `defaultValue` type |
|---|---|
| `EmbeddedTextField` | `TextValue` |
| `EmbeddedIntegerNumberField` | `IntegerNumberValue` |
| `EmbeddedRealNumberField` | `RealNumberValue` |
| `EmbeddedBooleanField` | `BooleanValue` |
| `EmbeddedDateField` | `DateValue` (polymorphic: `YearValue \| YearMonthValue \| FullDateValue`) |
| `EmbeddedTimeField` | `TimeValue` |
| `EmbeddedDateTimeField` | `DateTimeValue` |
| `EmbeddedControlledTermField` | `ControlledTermValue` |
| `EmbeddedSingleValuedEnumField` | `EnumValue` (single) |
| `EmbeddedMultiValuedEnumField` | `EnumValue*` (sequence) |
| `EmbeddedLinkField` | `LinkValue` |
| `EmbeddedEmailField` | `EmailValue` |
| `EmbeddedPhoneNumberField` | `PhoneNumberValue` |
| `EmbeddedOrcidField` | `OrcidValue` |
| `EmbeddedRorField` | `RorValue` |
| `EmbeddedDoiField` | `DoiValue` |
| `EmbeddedPubMedIdField` | `PubMedIdValue` |
| `EmbeddedRridField` | `RridValue` |
| `EmbeddedNihGrantIdField` | `NihGrantIdValue` |
| `EmbeddedAttributeValueField` | (no default) |

`TextFieldSpec` also carries an optional reusable field-level text default (a `TextValue` — see Field Specs). When both a field-level and an embedding-specific text default are present, the embedding-specific one takes precedence as it is more specific to the template context.

`SingleValuedEnumFieldSpec` and `MultiValuedEnumFieldSpec` likewise carry optional spec-level defaults — a single `Token` for the single-valued spec, a list of `Token` for the multi-valued spec. These are not `EnumValue` constructs but bare `Token` references to entries of the spec's `PermissibleValue+` list. As with text defaults, an embedding-level `defaultValue` (an `EnumValue` or sequence of `EnumValue` on the corresponding `EmbeddedField`) takes precedence over the spec-level default when both are present. All other default-value families appear only at the embedding level.

### Label Override

`LabelOverride` provides template-specific labeling for an embedded artifact. This allows a template to override the default label of the referenced reusable artifact in that embedding context.

```ebnf
AlternativeLabel ::= alternative_label(
                       MultilingualString
                     )

LabelOverride ::= label_override(
                    Label
                    AlternativeLabel*
                  )
```

`AlternativeLabel` is a [`MultilingualString`](#multilingual-strings): each entry is itself a localization set for one alternative phrasing of the artifact's display label.

### Properties

A `Property` associates a semantic property IRI with an `EmbeddedField` or `EmbeddedTemplate` within a specific `Template`. The property IRI identifies the RDF property that the embedded artifact's value represents in that template context. The optional `PropertyLabel` provides a human-readable label for the property.

`Property` is an embedding-level construct. It is distinct from the intrinsic metadata of the referenced `Field` or `Template` artifact. The same reusable artifact may be embedded in different templates under different property IRIs.

```ebnf
Property ::= property(
               PropertyIri
               [PropertyLabel]
             )

PropertyIri   ::= property_iri( Iri )
PropertyLabel ::= property_label( MultilingualString )
```

`PropertyLabel` is a [`MultilingualString`](#multilingual-strings) carrying one or more language-tagged localizations of the property's human-readable label.

## Field Specs

A `FieldSpec` is the semantic configuration block carried by a concrete `Field` artifact. It specifies what kind of value the field accepts, any constraints on that value, and any compatible rendering hints for presentation. Each concrete `Field` variant carries exactly one `FieldSpec` that matches its kind: a `TextField` carries a `TextFieldSpec`, a `DateField` carries a `DateFieldSpec`, and so on. The correspondence between each `FieldSpec` and its permitted `Value` form is given in the [Field Spec And Value Correspondence](#field-spec-and-value-correspondence) section.

One might ask why `FieldSpec` exists as a separate construct rather than folding its content directly into the concrete `Field` artifact. The answer is separation of concerns: the concrete field artifact — `TextField`, `DateField`, and so on — answers the question "what kind of reusable field is this?" and carries the artifact's identity, descriptive metadata, lifecycle metadata, and versioning. The `FieldSpec` answers the separate question "what are the value rules and rendering-compatible properties for this kind of field?" Keeping these concerns distinct means that artifact identity and lifecycle metadata remain uniform across all field kinds, while value semantics and field-specific configuration vary per family through `FieldSpec`. It also preserves a clean, uniform pattern: every concrete field artifact carries exactly one identifier, one `SchemaArtifactMetadata`, and one `FieldSpec`.

`FieldSpec` productions are grouped here by field family, mirroring the abstract `Field` hierarchy in the Kernel Grammar. Temporal field specs, which carry additional precision and rendering configuration, are detailed in the [Temporal Field Specs](#temporal-field-specs) subsection. Controlled term source declarations, which specify the ontological authorities from which controlled-term values may be drawn, are covered in the [Controlled Term Sources](#controlled-term-sources) subsection. Rendering hints for all field families are defined in the [Rendering Hints](#rendering-hints) subsection, with the exception of temporal rendering hints which are defined alongside their field specs.

```ebnf
FieldSpec ::= TextFieldSpec
            | NumericFieldSpec
            | BooleanFieldSpec
            | TemporalFieldSpec
            | ControlledTermFieldSpec
            | EnumFieldSpec
            | LinkFieldSpec
            | ContactFieldSpec
            | ExternalAuthorityFieldSpec
            | AttributeValueFieldSpec

NumericFieldSpec ::= IntegerNumberFieldSpec
                   | RealNumberFieldSpec

TextFieldSpec ::= text_field_spec(
                    [TextValue]
                    [MinLength]
                    [MaxLength]
                    [ValidationRegex]
                    [TextRenderingHint]
                  )

IntegerNumberFieldSpec ::= integer_number_field_spec(
                             [Unit]
                             [IntegerNumberMinValue]
                             [IntegerNumberMaxValue]
                             [NumericRenderingHint]
                           )

RealNumberFieldSpec ::= real_number_field_spec(
                          RealNumberDatatypeKind
                          [Unit]
                          [RealNumberMinValue]
                          [RealNumberMaxValue]
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
                      string
                    )

IntegerNumberMinValue ::= integer_number_min_value(
                            IntegerNumberValue
                          )

IntegerNumberMaxValue ::= integer_number_max_value(
                            IntegerNumberValue
                          )

RealNumberMinValue ::= real_number_min_value(
                         RealNumberValue
                       )

RealNumberMaxValue ::= real_number_max_value(
                         RealNumberValue
                       )

BooleanFieldSpec ::= boolean_field_spec(
                       [BooleanRenderingHint]
                     )

TemporalFieldSpec ::= DateFieldSpec
                    | TimeFieldSpec
                    | DateTimeFieldSpec

ControlledTermFieldSpec ::= controlled_term_field_spec(
                              ControlledTermSource+
                            )

EnumFieldSpec ::= SingleValuedEnumFieldSpec
                | MultiValuedEnumFieldSpec

SingleValuedEnumFieldSpec ::= single_valued_enum_field_spec(
                                PermissibleValue+
                                [Token]
                                [SingleValuedEnumRenderingHint]
                              )

MultiValuedEnumFieldSpec ::= multi_valued_enum_field_spec(
                               PermissibleValue+
                               Token*
                               [MultiValuedEnumRenderingHint]
                             )

PermissibleValue ::= permissible_value(
                       Token
                       [Label]
                       [Description]
                       Meaning*
                     )

Token ::= token(
            string
          )

Meaning ::= meaning(
              TermIri
              [Label]
            )

LinkFieldSpec ::= link_field_spec()

ContactFieldSpec ::= EmailFieldSpec
                   | PhoneNumberFieldSpec

EmailFieldSpec ::= email_field_spec()

PhoneNumberFieldSpec ::= phone_number_field_spec()

ExternalAuthorityFieldSpec ::= OrcidFieldSpec
                             | RorFieldSpec
                             | DoiFieldSpec
                             | PubMedIdFieldSpec
                             | RridFieldSpec
                             | NihGrantIdFieldSpec

OrcidFieldSpec ::= orcid_field_spec()

RorFieldSpec ::= ror_field_spec()

DoiFieldSpec ::= doi_field_spec()

PubMedIdFieldSpec ::= pub_med_id_field_spec()

RridFieldSpec ::= rrid_field_spec()

NihGrantIdFieldSpec ::= nih_grant_id_field_spec()

AttributeValueFieldSpec ::= attribute_value_field_spec()
```

`Unit` denotes an identified measurement or quantity unit optionally paired with a human-readable label.

The current placement of `Unit` on `IntegerNumberFieldSpec` and `RealNumberFieldSpec` is a pragmatic compromise. A later revision may introduce a distinct `QuantityFieldSpec` to model numeric values with fixed units more explicitly.

`IntegerNumberMinValue` and `IntegerNumberMaxValue` specify inclusive lower and upper bounds on the integer values that an `IntegerNumberField` accepts. Both are expressed as `IntegerNumberValue` constructs. `RealNumberMinValue` and `RealNumberMaxValue` are the analogous bounds on `RealNumberField` and carry `RealNumberValue` constructs whose `RealNumberDatatypeKind` matches the field's declared datatype.

A `RealNumberFieldSpec` MAY use the family-shared `NumericRenderingHint`; if it carries a non-zero `decimalPlaces` rendering hint, the hint applies to display rounding only and does not constrain the lexical form of submitted values. `IntegerNumberFieldSpec` MAY also use `NumericRenderingHint`; a `decimalPlaces` value other than `0` on an integer field is harmless (display only) and SHOULD be omitted when not meaningful.

`EnumFieldSpec` is refined along a single dimension: cardinality. `SingleValuedEnumFieldSpec` permits exactly one selection; `MultiValuedEnumFieldSpec` permits zero or more simultaneous selections (subject to the embedding's `Cardinality`). The two specs share a common option model: every permissible value is a `PermissibleValue` carrying a canonical `Token` key together with optional human-readable `Label` and `Description` localizations and zero or more `Meaning` entries that bind the token to ontology terms. The `Token` strings of a spec's permissible values MUST be unique within that spec; the spec's `PermissibleValue+` is the closed set of values an instance may carry.

`SingleValuedEnumFieldSpec` carries an optional `[Token]` slot identifying the permissible value pre-selected when a new instance is created; `MultiValuedEnumFieldSpec` carries a `Token*` list with the same role. Each such default `Token` MUST equal the `Token` of one of the spec's `PermissibleValue+` entries. These are spec-level defaults baked into the field definition itself; an embedding-level `defaultValue` on the corresponding `EmbeddedField` takes precedence when both are present.

A `Meaning` carried by a `PermissibleValue` binds the token to a term IRI in an external vocabulary or ontology. A permissible value MAY carry zero, one, or several `Meaning` entries. Each `Meaning` MAY additionally carry an optional `Label` recording the bound term's human-readable label (in the same way `ControlledTermValue.Label` caches the term's label inline) so that consumers without ontology access can render the bound term's display name. The `Meaning.Label` is the label of the bound *term*, distinct from the surrounding `PermissibleValue.Label` which is the display label of the permissible value itself. When the RDF projection is applied (see [`rdf-projection.md`](rdf-projection.md)), an `EnumValue` whose token matches a `PermissibleValue` carrying one or more `Meaning` entries projects as the corresponding term IRIs; an `EnumValue` whose matching permissible value carries no `Meaning` projects as a plain string literal.

`ControlledTermSource` is defined in [Controlled Term Sources](#controlled-term-sources).

### Temporal Field Specs

`TemporalFieldSpec` denotes temporal-valued fields and is refined into strongly typed date, time, and date-time forms. This section groups the temporal field-spec productions together with their compatible rendering hints and value-type constraints.

```ebnf
DateFieldSpec ::= date_field_spec(
                    DateValueType
                    [DateRenderingHint]
                  )

DateValueType ::= "year" | "yearMonth" | "fullDate"
```

```ebnf
TimeFieldSpec ::= time_field_spec(
                    [TimePrecision]
                    [TimezoneRequirement]
                    [TimeRenderingHint]
                  )

TimePrecision ::= "hourMinute" | "hourMinuteSecond" | "hourMinuteSecondFraction"

TimezoneRequirement ::= "timezoneRequired" | "timezoneNotRequired"
```

`TimePrecision` identifies the finest time precision permitted by a `TimeFieldSpec`.

`"hourMinute"`, `"hourMinuteSecond"`, and `"hourMinuteSecondFraction"` identify time values constrained respectively to hour-and-minute precision, second precision, and fractional-second precision.

`TimezoneRequirement` identifies whether timezone information is required by the field spec.

The declared `TimePrecision` determines the required lexical form of conforming `TimeValue` constructs. Finer components than the declared precision MUST be omitted entirely; zeroing them is not equivalent to omitting them. Specifically:

- `"hourMinute"`: `TimeValue` MUST carry only hour and minute components (`HH:MM`).
- `"hourMinuteSecond"`: `TimeValue` MUST carry hour, minute, and second components (`HH:MM:SS`), with no fractional seconds.
- `"hourMinuteSecondFraction"`: `TimeValue` MAY carry a fractional seconds component.

When `TimePrecision` is absent from a `TimeFieldSpec`, no precision constraint applies and any well-formed `TimeValue` is conforming.

The same strict-truncation rule applies to `DateTimeValueType` for `DateTimeValue` constructs:

- `"dateHourMinute"`: the time component of `DateTimeValue` MUST carry only hour and minute (`YYYY-MM-DDTHH:MM`).
- `"dateHourMinuteSecond"`: the time component MUST carry hour, minute, and second (`YYYY-MM-DDTHH:MM:SS`), with no fractional seconds.
- `"dateHourMinuteSecondFraction"`: the time component MAY carry a fractional seconds component.

```ebnf
DateTimeFieldSpec ::= date_time_field_spec(
                        DateTimeValueType
                        [TimezoneRequirement]
                        [DateTimeRenderingHint]
                      )

DateTimeValueType ::= "dateHourMinute" | "dateHourMinuteSecond" | "dateHourMinuteSecondFraction"
```

`DateTimeValueType` identifies the finest permitted date-time precision.

`"dateHourMinute"`, `"dateHourMinuteSecond"`, and `"dateHourMinuteSecondFraction"` identify date-time values constrained respectively to minute precision, second precision, and fractional-second precision.

```ebnf
DateRenderingHint ::= date_rendering_hint(
                        [DateComponentOrder]
                      )

DateComponentOrder ::= "dayMonthYear" | "monthDayYear" | "yearMonthDay"

TimeRenderingHint ::= time_rendering_hint(
                        [TimeFormat]
                      )

DateTimeRenderingHint ::= date_time_rendering_hint(
                            [TimeFormat]
                          )

TimeFormat ::= "twelveHour" | "twentyFourHour"
```

`DateComponentOrder` identifies whether a date is rendered or acquired in day-month-year, month-day-year, or year-month-day order.

### Controlled Term Sources

Controlled term sources define the ontological authorities from which controlled-term values may be drawn. A `ControlledTermFieldSpec` requires one or more `ControlledTermSource` entries. Each source specifies either an entire ontology, a branch of an ontology rooted at a given term, a set of individual ontology classes, or an external value set. `TermIri` is defined in the Scalar and Datatype Leaves section.

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
                          [OntologyAcronym]
                          [OntologyName]
                        )

BranchSource ::= branch_source(
                   OntologyReference
                   RootTermIri
                   [RootTermLabel]
                   [MaxTraversalDepth]
                 )

ClassSource ::= class_source(
                  ControlledTermClass+
                )

ControlledTermClass ::= controlled_term_class(
                          TermIri
                          [Label]
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
                      string
                    )

OntologyName ::= ontology_name(
                   MultilingualString
                 )

OntologyIri ::= ontology_iri(
                  Iri
                )

RootTermIri ::= root_term_iri(
                  Iri
                )

RootTermLabel ::= root_term_label(
                    MultilingualString
                  )

MaxTraversalDepth ::= max_traversal_depth(
                        NonNegativeInteger
                      )

ValueSetIdentifier ::= value_set_identifier(
                         string
                       )

ValueSetName ::= value_set_name(
                   MultilingualString
                 )

ValueSetIri ::= value_set_iri(
                  Iri
                )
```

`OntologyIri`, `RootTermIri`, and `ValueSetIri` denote IRIs used in controlled-term source specifications.

`OntologyName`, `RootTermLabel`, and `ValueSetName` are human-readable display names and carry [`MultilingualString`](#multilingual-strings) values: each may be presented in one or more natural languages. `OntologyAcronym` and `ValueSetIdentifier` are technical short-form identifiers (e.g. an ontology acronym like `"NCIT"`, a value-set key) and remain plain Unicode strings.

`MaxTraversalDepth` denotes a non-negative traversal-depth limit for branch-based controlled-term sources. When `MaxTraversalDepth` is absent, no depth limit applies and any descendant of the root term is admissible. A value of zero restricts the source to the root term itself.

When `OntologyDisplayHint` is present on an `OntologyReference`, at least one of its `OntologyAcronym` or `OntologyName` components MUST be present. A display hint with neither component is non-conforming.

A `ControlledTermClass` SHOULD include a `Label`. The label is captured at the time the class is declared as a source, when the term's display text is typically known; consumers without ontology access rely on this label to render the class. Conforming producers MAY omit the label when it is not available, in which case downstream consumers must resolve the label from the term IRI by other means. The same recommendation applies to `BranchSource.RootTermLabel`: producers SHOULD include it when declaring a branch source.

### Rendering Hints

A `RenderingHint` is an optional presentational instruction carried by a `FieldSpec` that tells a rendering implementation how to display the field. Rendering hints are strictly presentational: they do not affect the meaning, structure, or validation of field values. Each rendering hint is typed to a specific `FieldSpec` family, so only compatible hint-and-field-spec combinations are expressible. For example, a `TextRenderingHint` may only appear on a `TextFieldSpec`, and a `SingleValuedEnumRenderingHint` may only appear on a `SingleValuedEnumFieldSpec`. Note that temporal rendering hints (`DateRenderingHint`, `TimeRenderingHint`, and `DateTimeRenderingHint`) are defined alongside their respective field specs in the [Temporal Field Specs](#temporal-field-specs) subsection.

```ebnf
RenderingHint ::= TextRenderingHint
                | SingleValuedEnumRenderingHint
                | MultiValuedEnumRenderingHint
                | NumericRenderingHint
                | BooleanRenderingHint
                | DateRenderingHint
                | TimeRenderingHint
                | DateTimeRenderingHint

TextRenderingHint ::= "singleLine" | "multiLine"

SingleValuedEnumRenderingHint ::= "radio" | "dropdown"

MultiValuedEnumRenderingHint ::= "checkbox" | "multiSelect"

NumericRenderingHint ::= numeric_rendering_hint(
                           [DecimalPlaces]
                         )

DecimalPlaces ::= decimal_places(
                    NonNegativeInteger
                  )

BooleanRenderingHint ::= "checkbox" | "toggle" | "radio" | "dropdown"
```

This specification draws a strict distinction between semantic structure and presentation. Semantic distinctions MUST be modeled in `FieldSpec` when they affect the meaning, cardinality, or value structure of a field. This includes distinctions such as single-valued versus multi-valued enum, date versus time versus date-time, and permitted temporal precision. Purely presentational distinctions MUST NOT be modeled as separate field specs. Instead, distinctions such as single-line versus multi-line text entry, date component ordering, and 12-hour versus 24-hour time display MUST be expressed only through compatible typed rendering hints.

Accordingly, `TextFieldSpec` is a single semantic field spec whose single-line and multi-line display forms are represented by `TextRenderingHint`.

A `TextFieldSpec` MAY additionally define a default text value, minimum length, maximum length, and validating regular expression.

Similarly, `EnumFieldSpec` distinguishes `SingleValuedEnumFieldSpec` from `MultiValuedEnumFieldSpec` semantically, while the rendering hint determines whether the UI uses radio buttons, dropdown, checkboxes, or multi-select presentation. Typed rendering hints make incompatible combinations structurally invalid.

Temporal semantics are also split structurally: `DateFieldSpec`, `TimeFieldSpec`, and `DateTimeFieldSpec` are distinct semantic field specs, and each carries only the rendering hints and temporal options that are meaningful for that temporal category.

The current rendering vocabulary is explicit but deliberately small: numeric fields use `NumericRenderingHint` (which carries an optional `DecimalPlaces` for display-time rounding); date fields use `DateRenderingHint` (with optional `DateComponentOrder`); time fields use `TimeRenderingHint` (with optional `TimeFormat`); and date-time fields use `DateTimeRenderingHint` (also with optional `TimeFormat`).

`DecimalPlaces` is a presentation concern, not a value-semantics constraint. Conforming consumers SHOULD use it to control display rounding and MAY use it as a UX-level input nicety (e.g., limiting the number of digits an end-user can type after the decimal point). It does not constrain the lexical form of a submitted `RealNumberValue`; conforming validators MUST NOT reject a value purely on grounds of decimal-places mismatch with the rendering hint. The slot is meaningful for `RealNumberFieldSpec`; on `IntegerNumberFieldSpec` it is harmless and conventionally omitted.

`BooleanRenderingHint` admits four widget choices — `checkbox`, `toggle`, `radio`, and `dropdown` — distinguished by how they handle the **unset** state of a boolean field. A boolean field has three observable states at the UI: a value of `true`, a value of `false`, and *no value supplied* (the user has not yet asserted either). The four widget choices differ in whether they can faithfully represent the unset state:

- `radio` (a Yes / No radio pair) and `dropdown` (a Yes / No dropdown with no initial selection) admit three observable states — Yes selected, No selected, and neither selected — and so faithfully represent the unset case.
- `checkbox` and `toggle` admit only two observable states (`checked` / `unchecked`, or `on` / `off`) and so cannot distinguish *false* from *unset*. They SHOULD be used only when the field's `ValueRequirement` is `required` (so unset is not a valid resting state) or when the surrounding application is content to interpret unset as `false`.

The unset state is structurally represented in the value model by *absence of a `FieldValue`* for the embedding's key, not by a third value within `BooleanValue`. `BooleanValue.value` carries `true | false` only.

## Presentation Components

A `PresentationComponent` is a reusable artifact that contributes presentation or instructional structure to a rendered template without introducing data-bearing content. It is distinct from `SchemaArtifact`: where `Template` and `Field` define the structure and semantics of instance data, `PresentationComponent` exists purely to guide, organise, or annotate the rendered form — for example by embedding rich text instructions, illustrative images, video content, or structural breaks between sections.

`PresentationComponent` carries its own identity, metadata, and lifecycle information as an `Artifact`, making it independently reusable across multiple templates. It appears within a template only through `EmbeddedPresentationComponent`, which contributes no `InstanceValue` and is therefore invisible to the instance model. A conforming `TemplateInstance` MUST NOT contain an `InstanceValue` for an `EmbeddedPresentationComponent`.

The following concrete variants are defined:

```ebnf
PresentationComponent ::= RichTextComponent
                        | ImageComponent
                        | YoutubeVideoComponent
                        | SectionBreakComponent
                        | PageBreakComponent

RichTextComponent ::= rich_text_component(
                        PresentationComponentId
                        ModelVersion
                        ArtifactMetadata
                        HtmlContent
                      )

ImageComponent ::= image_component(
                     PresentationComponentId
                     ModelVersion
                     ArtifactMetadata
                     Iri
                     [Label]
                     [Description]
                   )

YoutubeVideoComponent ::= you_tube_video_component(
                            PresentationComponentId
                            ModelVersion
                            ArtifactMetadata
                            Iri
                            [Label]
                            [Description]
                          )

SectionBreakComponent ::= section_break_component(
                            PresentationComponentId
                            ModelVersion
                            ArtifactMetadata
                          )

PageBreakComponent ::= page_break_component(
                         PresentationComponentId
                         ModelVersion
                         ArtifactMetadata
                       )
```

```ebnf
HtmlContent ::= html_content(
                  string
                )
```

`HtmlContent` denotes an HTML fragment represented as a Unicode string and used by a `RichTextComponent`.

The permitted HTML feature set and any sanitization requirements are outside the scope of this abstract specification and SHOULD be defined by concrete serialization specifications that build on this model.

The `Iri` slot on `ImageComponent` and `YoutubeVideoComponent` identifies the image or video resource referenced by the corresponding presentation component.

`Label` and `Description` on `ImageComponent` and `YoutubeVideoComponent` carry accessibility metadata. `Label` is a short alternative-text label (the image's `alt` text or the video's caption title); `Description` is a longer textual description for screen readers and other assistive technologies. Both are [`MultilingualString`](#multilingual-strings) values, allowing localized accessibility text. Conforming producers SHOULD provide a `Label` for every `ImageComponent` and `YoutubeVideoComponent` that conveys meaningful content; decorative images MAY omit the label to indicate that no alternative text is needed.

## Field Spec And Value Correspondence

The `FieldSpec` carried by a `Field` determines the `Value` form that MUST appear in any `FieldValue` corresponding to an embedding of that field. This is a normative constraint: a `FieldValue` that carries a `Value` of the wrong form for the referenced field's `FieldSpec` is non-conforming.

The correspondence is applied through the `EmbeddedArtifactKey` chain. A `FieldValue` in a `TemplateInstance` carries an `EmbeddedArtifactKey` that identifies an `EmbeddedField` in the referenced `Template`. That `EmbeddedField` references a reusable `Field`, which carries a `FieldSpec`. It is that `FieldSpec` that determines the permitted `Value` form for the `FieldValue`. The correspondence therefore spans the full path from instance value through embedding context to reusable field definition.

The table below gives the complete correspondence. The Field Family column identifies the abstract category in the `Field` hierarchy to which the concrete field belongs; families group field kinds that share related value semantics. Where a field is a direct subclass of `Field` with no intermediate abstract category, this column is left blank.

| Field Family | `FieldSpec` | `Value` |
|---|---|---|
| | `TextFieldSpec` | `TextValue` |
| `NumericField` | `IntegerNumberFieldSpec` | `IntegerNumberValue` |
| `NumericField` | `RealNumberFieldSpec` | `RealNumberValue` |
| | `BooleanFieldSpec` | `BooleanValue` |
| `TemporalField` | `DateFieldSpec` | `DateValue` |
| `TemporalField` | `TimeFieldSpec` | `TimeValue` |
| `TemporalField` | `DateTimeFieldSpec` | `DateTimeValue` |
| | `ControlledTermFieldSpec` | `ControlledTermValue` |
| `EnumField` | `SingleValuedEnumFieldSpec` | `EnumValue` |
| `EnumField` | `MultiValuedEnumFieldSpec` | `EnumValue` |
| | `LinkFieldSpec` | `LinkValue` |
| `ContactField` | `EmailFieldSpec` | `EmailValue` |
| `ContactField` | `PhoneNumberFieldSpec` | `PhoneNumberValue` |
| `ExternalAuthorityField` | `OrcidFieldSpec` | `OrcidValue` |
| `ExternalAuthorityField` | `RorFieldSpec` | `RorValue` |
| `ExternalAuthorityField` | `DoiFieldSpec` | `DoiValue` |
| `ExternalAuthorityField` | `PubMedIdFieldSpec` | `PubMedIdValue` |
| `ExternalAuthorityField` | `RridFieldSpec` | `RridValue` |
| `ExternalAuthorityField` | `NihGrantIdFieldSpec` | `NihGrantIdValue` |
| | `AttributeValueFieldSpec` | `AttributeValue` |

The two concrete enum field specs share a single value type, `EnumValue`. The cardinality distinction — single versus multiple — is not visible in the value type itself but in the count of values permitted per `FieldValue`: a `SingleValuedEnumFieldSpec` permits exactly one `EnumValue`, while a `MultiValuedEnumFieldSpec` permits one or more (subject to the embedding's `Cardinality`). This cardinality constraint is enforced at validation rather than through distinct value types.

## Instances

A `TemplateInstance` is an `Artifact` that records data conforming to a specific `Template`. Instance productions are defined here separately from schema and presentation productions so that the schema model and the instance model can be read independently.

Because `TemplateInstance` is a full `Artifact`, it carries `ArtifactMetadata` — a `TemplateInstanceId`, descriptive metadata, and lifecycle metadata. This means instances are independently identifiable, catalogable artifacts in their own right rather than anonymous data records. They can be referenced, versioned, and tracked just as templates and fields can.

A `TemplateInstance` contains zero or more `InstanceValue` constructs, each keyed by an `EmbeddedArtifactKey` identifying the corresponding embedded artifact in the referenced template. There are two forms: `FieldValue`, which carries one or more typed values for an `EmbeddedField`, and `NestedTemplateInstance`, which carries a nested collection of `InstanceValue` constructs for an `EmbeddedTemplate`. `EmbeddedPresentationComponent` constructs produce no `InstanceValue` and are absent from the instance model entirely.

```ebnf
TemplateInstance ::= template_instance(
                       TemplateInstanceId
                       ModelVersion
                       ArtifactMetadata
                       TemplateId
                       InstanceValue*
                     )

InstanceValue ::= FieldValue
                | NestedTemplateInstance

FieldValue ::= field_value(
                 EmbeddedArtifactKey
                 Value+
               )

NestedTemplateInstance ::= nested_template_instance(
                             EmbeddedArtifactKey
                             InstanceValue*
                           )
```

`TemplateId` is the persistent schema link that ties a `TemplateInstance` to the `Template` it was created from. It is the basis for all validation and interpretation of instance content: the `EmbeddedArtifactKey` values in `FieldValue` and `NestedTemplateInstance` constructs are only meaningful in relation to the embedded artifacts of that specific template.

Each `FieldValue`'s `EmbeddedArtifactKey` MUST identify an `EmbeddedField` in the referenced `Template`. Each `NestedTemplateInstance`'s `EmbeddedArtifactKey` MUST identify an `EmbeddedTemplate`. An `EmbeddedArtifactKey` that identifies an `EmbeddedPresentationComponent` MUST NOT appear as the key of any `InstanceValue`. The full instance alignment constraints are specified in `spec/validation.md`.

To make the abstract structure concrete, consider a `Template` containing two `EmbeddedTextField` constructs keyed `title` and `description`, and one `EmbeddedTemplate` keyed `study_arm` with a maximum cardinality of three. A conforming `TemplateInstance` for that template would contain two `FieldValue` constructs — one keyed `title` carrying a `TextValue`, one keyed `description` carrying a `TextValue` — and between one and three `NestedTemplateInstance` constructs each keyed `study_arm`, where each `NestedTemplateInstance` contains its own `InstanceValue` constructs corresponding to the embedded artifacts of the nested template.

For multi-valued `EmbeddedField`, all values for a single field occurrence are collected within a single `FieldValue` using `Value*`. For multi-valued `EmbeddedTemplate`, multiplicity is represented by multiple `NestedTemplateInstance` constructs sharing the same `EmbeddedArtifactKey` within the containing `TemplateInstance`. This asymmetry reflects the structural difference between scalar repetition (multiple values for one field) and structural repetition (multiple complete nested instances for one embedded template). In both cases the number of values or instances MUST satisfy the [Cardinality](#cardinality) constraints defined by the corresponding `EmbeddedField` or `EmbeddedTemplate`; see `spec/validation.md` for the normative multiplicity rules. `NestedTemplateInstance` is the recursive construct that supports arbitrarily deep nested template structure: because a `NestedTemplateInstance` itself contains `InstanceValue*`, and `InstanceValue` may contain further `NestedTemplateInstance` constructs, template nesting can be as deep as the schema requires.

Instance conformance may be enforced at data-entry time, preventing submission of a non-conforming instance, or retrospectively, by validating existing instances against their referenced template. Both modes apply the same conformance rules; the distinction is an implementation concern rather than a model-level distinction.

Absence of a value for an optional field is represented by omitting the `FieldValue` entirely rather than including an empty one; hence `FieldValue` requires `Value+`. Note that concrete serializations and authoring tools may have their own conventions for representing absence — for example, a JSON serialization may choose to omit a key entirely or include it with a null value — but such distinctions are a concern of the serialization layer and do not affect the abstract model defined here.

## Open Questions

- Should embedded artifacts always refer to reusable artifacts by explicit reference construct, or does the CEDAR model require some embeddings to support inline artifact definition?
- Should `PresentationComponent` remain a direct subclass of `Artifact`, or should a later revision introduce an intermediate superclass for reusable non-schema artifacts? This would make the distinction between reusable schema artifacts such as `Template` and `Field` and reusable non-schema artifacts such as rich text, images, videos, and section breaks more explicit in the hierarchy.
- Should a later revision introduce a distinct `QuantityFieldSpec` rather than attaching optional `Unit` information directly to `IntegerNumberFieldSpec` and `RealNumberFieldSpec`? The current model permits fixed units on both numeric field families as a pragmatic compromise, but a dedicated quantity field spec may provide a cleaner semantic distinction for numeric values that are intrinsically unit-bearing.
