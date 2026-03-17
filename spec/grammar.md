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
::=   defined as
|     alternative production
X*    zero or more occurrences of X
X+    one or more occurrences of X
[X]   optional occurrence of X
```

Whitespace separates symbols within a production.

Parentheses group the components of an abstract construct.

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

## Kernel Grammar

The kernel grammar defines the primary abstract categories of the model and the core schema-level structure that connects them. It introduces reusable schema artifacts, templates, and the embedding constructs through which templates assemble fields, nested templates, and presentation components. Subsequent sections refine the metadata, field-type families, instance structures, and supporting constructs referenced here.

```ebnf
Artifact ::= SchemaArtifact
           | PresentationComponent
           | TemplateInstance

SchemaArtifact ::= Field
                 | Template

Field ::= field(
            FieldId
            SchemaArtifactMetadata
            FieldType
          )

Template ::= template(
               TemplateId
               SchemaArtifactMetadata
               [Header]
               [Footer]
               EmbeddedArtifact*
             )
```

`EmbeddedArtifact` defines the forms used to include reusable artifacts in a `Template`. These productions identify the reusable artifact being included and the template-specific properties that control its use in that template.

```ebnf
EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent

EmbeddedField ::= embedded_field(
                    EmbeddedArtifactKey
                    FieldReference
                    [ValueRequirement]
                    [Cardinality]
                    [Visibility]
                    [DefaultValue]
                    [LabelOverride]
                  )

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

## Artifact Identity

Artifact identity defines the typed identifiers by which artifacts and artifact references are denoted in the model. These identity constructs are distinct from descriptive metadata, provenance, versioning, and annotations.

```ebnf
FieldId ::= field_id(
              Iri
            )

TemplateId ::= template_id(
                 Iri
               )

PresentationComponentId ::= presentation_component_id(
                              Iri
                            )

TemplateInstanceId ::= template_instance_id(
                        Iri
                      )
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

`EmbeddedArtifactKey` MUST be an ASCII identifier without whitespace.

`EmbeddedArtifactKey` values are local to a `Template` and MUST be unique within that `Template`.

## Embedded Artifact Properties

Embedded artifact properties define the contextual information carried by an `EmbeddedArtifact` within a `Template`. These properties govern how a referenced reusable artifact is used in that template context, including reference, requirement, cardinality, visibility, defaults, and label override, and they are distinct from the intrinsic properties of the referenced reusable artifact itself.

### References

These productions identify the reusable artifact that is being included in the template.

```ebnf
FieldReference ::= FieldId

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

### Cardinality

`Cardinality` identifies the permitted number of occurrences for the embedded artifact in the embedding context.

```ebnf
Cardinality ::= cardinality(
                  MinCardinality
                  [MaxCardinality]
                )
```

### Visibility

`Visibility` determines whether the embedded artifact is shown in rendered interfaces. It is modeled as an embedding property rather than as a rendering hint because it applies to any kind of embedded artifact, not only to fields.

```ebnf
Visibility ::= Visible
             | Hidden
```

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
               | ContactDefaultValue
               | ExternalAuthorityDefaultValue

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

ContactDefaultValue ::= contact_default_value(
                         ContactValue
                       )

ExternalAuthorityDefaultValue ::= external_authority_default_value(
                                   ExternalAuthorityValue
                                 )
```

### Label Override

`LabelOverride` provides template-specific labeling for an embedded artifact. This allows a template to override the default label of the referenced reusable artifact in that embedding context.

```ebnf
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

ContactFieldType ::= EmailFieldType
                   | PhoneNumberFieldType

ExternalAuthorityFieldType ::= OrcidFieldType
                             | RorFieldType
                             | DoiFieldType
                             | PubMedIdFieldType
                             | RridFieldType
                             | NihGrantIdFieldType

AttributeValueFieldType ::= attribute_value_field_type()
```

## Temporal Fields

`TemporalFieldType` denotes temporal-valued fields and is refined into strongly typed date, time, and date-time forms. This section groups the temporal field-type productions together with their compatible rendering hints, values, and literals.

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
                   [TimezoneEnabled]
                   [TimeRenderingHint]
                 )

TimePrecision ::= HourMinutePrecision
                | HourMinuteSecondPrecision
                | HourMinuteSecondFractionPrecision

HourMinutePrecision ::= hour_minute_precision()

HourMinuteSecondPrecision ::= hour_minute_second_precision()

HourMinuteSecondFractionPrecision ::= hour_minute_second_fraction_precision()
```

```ebnf
DateTimeFieldType ::= date_time_field_type(
                       DateTimeValueType
                       [TimezoneEnabled]
                       [DateTimeRenderingHint]
                     )

DateTimeValueType ::= DateHourMinuteValueType
                    | DateHourMinuteSecondValueType
                    | DateHourMinuteSecondFractionValueType

DateHourMinuteValueType ::= date_hour_minute_value_type()

DateHourMinuteSecondValueType ::= date_hour_minute_second_value_type()

DateHourMinuteSecondFractionValueType ::= date_hour_minute_second_fraction_value_type()
```

```ebnf
DateRenderingHint ::= date_rendering_hint(
                       DateRenderingWidget
                       [DateFormat]
                     )

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

DateTimeRenderingHint ::= date_time_rendering_hint(
                           DateTimeRenderingWidget
                           [TimeFormat]
                         )

TimeFormat ::= TwelveHourTimeFormat
             | TwentyFourHourTimeFormat

TwelveHourTimeFormat ::= twelve_hour_time_format()

TwentyFourHourTimeFormat ::= twenty_four_hour_time_format()
```

## Controlled Term Sources

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
                          OntologyAcronym
                        | OntologyName
                        | OntologyAcronym
                          OntologyName
                        )

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

## Rendering Hints

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

SingleChoiceRenderingHint ::= RadioRenderingHint
                            | SingleSelectDropdownRenderingHint

MultipleChoiceRenderingHint ::= CheckboxRenderingHint
                              | MultiSelectDropdownRenderingHint

```

The `FieldType` grammar distinguishes semantic variation from presentation variation.

Semantic distinctions MUST remain in `FieldType` when they affect the meaning, cardinality, or value structure of the field.

Presentation distinctions SHOULD be represented by typed rendering hints when they affect only UI behavior.

Accordingly, `TextFieldType` is a single semantic field type whose single-line and multi-line display forms are represented by `TextRenderingHint`.

A `TextFieldType` MAY additionally define a default text value, minimum length, maximum length, and validating regular expression.

Similarly, `ChoiceFieldType` distinguishes `SingleChoiceFieldType` from `MultipleChoiceFieldType` semantically, while the rendering hint determines whether the UI uses radio buttons, checkboxes, or dropdown presentation. Typed rendering hints make incompatible combinations structurally invalid.

Temporal semantics are also split structurally: `DateFieldType`, `TimeFieldType`, and `DateTimeFieldType` are distinct semantic field types, and each carries only the rendering hints and temporal options that are meaningful for that temporal category.

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
- `ContactFieldType` to `ContactValue`
- `ExternalAuthorityFieldType` to `ExternalAuthorityValue`
- `AttributeValueFieldType` to `AttributeValue`

## Literals

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

TextLiteral ::= StringLiteral
              | LangStringLiteral

StringLiteral ::= string_literal(
                    LexicalForm
                  )

NumericLiteral ::= numeric_literal(
                     LexicalForm
                     NumericDatatypeIri
                   )

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

A `Literal` in this specification is an RDF literal.

A `DatatypeIriLiteral` denotes an RDF literal consisting of a lexical form and a datatype IRI.

A `LangStringLiteral` denotes an RDF literal whose lexical form is paired with a non-empty language tag. `LangStringLiteral` corresponds to an RDF literal with datatype IRI `http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`.

`TextLiteral` is the class of literals permitted in `TextValue`.

`NumericLiteral` is the class of literals permitted in `NumericValue`.

`DateLiteral`, `TimeLiteral`, and `DateTimeLiteral` are the literal classes permitted in `DateValue`, `TimeValue`, and `DateTimeValue`, respectively.

Within `DateLiteral`, `YearLiteral`, `YearMonthLiteral`, and `FullDateLiteral` distinguish year-only, year-month, and full-date values.

`NumericLiteral` carries a numeric datatype IRI.

`YearLiteral` carries a year datatype IRI.

`YearMonthLiteral` carries a year-month datatype IRI.

`FullDateLiteral` carries a full-date datatype IRI.

`TimeLiteral` carries a time datatype IRI.

`DateTimeLiteral` carries a date-time datatype IRI.

The lexical form is a Unicode string and SHOULD be in Unicode Normalization Form C.

The language tag of a `LangStringLiteral` MUST be non-empty and well-formed according to BCP 47.

Concrete syntaxes MAY use simpler surface forms that omit an explicit datatype IRI for string literals or language-tagged strings. Such forms are syntactic sugar and do not change the abstract structure defined by this specification.

The literal value associated with a `Literal` is determined as follows:

- If the `Literal` is a `LangStringLiteral`, the literal value is the pair consisting of lexical form and language tag, in that order.
- If the `Literal` is a `DatatypeIriLiteral`, the datatype IRI is recognized, and the lexical form is in the lexical space of that datatype, the literal value is obtained by applying the lexical-to-value mapping of that datatype to the lexical form.
- If the `Literal` is a `DatatypeIriLiteral`, the datatype IRI is recognized, but the lexical form is outside the lexical space of that datatype, the literal is ill-typed.
- If the `Literal` is a `DatatypeIriLiteral` and the datatype IRI is not recognized, the literal value is not defined by this specification.

An ill-typed literal is not syntactically ill-formed, but it does not determine a valid literal value and produces a semantic inconsistency. Implementations MUST accept ill-typed literals and MAY produce warnings when encountering them.

Two literals are term-equal if and only if their lexical forms and their datatype IRIs or language tags compare equal character by character.

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
                        RichTextContent
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

## Supporting Nonterminals

```ebnf

Value ::= TextValue
        | NumericValue
        | DateValue
        | TimeValue
        | DateTimeValue
        | ControlledTermValue
        | ChoiceValue
        | LinkValue
        | ContactValue
        | ExternalAuthorityValue
        | AttributeValue

TextValue ::= text_value(
                TextLiteral
              )

NumericValue ::= numeric_value(
                   NumericLiteral
                 )

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

ControlledTermValue ::= controlled_term_value(
                          TermIri
                          Label
                          [Notation]
                          [PreferredLabel]
                        )

ChoiceValue ::= choice_value(
                  ChoiceSelection
                )

ChoiceSelection ::= Literal
                  | ControlledTermValue

LinkValue ::= link_value(
                Iri
              )

ContactValue ::= contact_value(
                   Literal
                 )

ExternalAuthorityValue ::= external_authority_value(
                             Literal
                           )

AttributeValue ::= attribute_value(
                    AttributeName
                    Value
                  )
```

## Scalar And Datatype Leaves

```ebnf
Iri ::= iri(
          IriString
        )

DatatypeIri ::= datatype_iri(
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
```

`Iri` denotes an Internationalized Resource Identifier.

`DatatypeIri` denotes an `Iri` that identifies an RDF datatype.

`LanguageTag` denotes a well-formed BCP 47 language tag.

`LexicalForm` denotes a Unicode string and SHOULD be in Unicode Normalization Form C.

`IsoDateTimeStamp` denotes an ISO 8601 date-time lexical form.

`KeyIdentifier` denotes an ASCII identifier without whitespace.

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

XsdIntegerDatatypeIri ::= xsd_integer_datatype_iri()

XsdDecimalDatatypeIri ::= xsd_decimal_datatype_iri()

XsdFloatDatatypeIri ::= xsd_float_datatype_iri()

XsdDoubleDatatypeIri ::= xsd_double_datatype_iri()

XsdLongDatatypeIri ::= xsd_long_datatype_iri()

XsdIntDatatypeIri ::= xsd_int_datatype_iri()

XsdShortDatatypeIri ::= xsd_short_datatype_iri()

XsdByteDatatypeIri ::= xsd_byte_datatype_iri()

XsdNonNegativeIntegerDatatypeIri ::= xsd_non_negative_integer_datatype_iri()

XsdPositiveIntegerDatatypeIri ::= xsd_positive_integer_datatype_iri()

XsdNonPositiveIntegerDatatypeIri ::= xsd_non_positive_integer_datatype_iri()

XsdNegativeIntegerDatatypeIri ::= xsd_negative_integer_datatype_iri()

XsdUnsignedLongDatatypeIri ::= xsd_unsigned_long_datatype_iri()

XsdUnsignedIntDatatypeIri ::= xsd_unsigned_int_datatype_iri()

XsdUnsignedShortDatatypeIri ::= xsd_unsigned_short_datatype_iri()

XsdUnsignedByteDatatypeIri ::= xsd_unsigned_byte_datatype_iri()
```

`NumericDatatypeIri` denotes one of the supported XML Schema numeric datatype IRIs.

The numeric datatype constructors denote the following XML Schema datatype IRIs:

- `XsdIntegerDatatypeIri`: `http://www.w3.org/2001/XMLSchema#integer`
- `XsdDecimalDatatypeIri`: `http://www.w3.org/2001/XMLSchema#decimal`
- `XsdFloatDatatypeIri`: `http://www.w3.org/2001/XMLSchema#float`
- `XsdDoubleDatatypeIri`: `http://www.w3.org/2001/XMLSchema#double`
- `XsdLongDatatypeIri`: `http://www.w3.org/2001/XMLSchema#long`
- `XsdIntDatatypeIri`: `http://www.w3.org/2001/XMLSchema#int`
- `XsdShortDatatypeIri`: `http://www.w3.org/2001/XMLSchema#short`
- `XsdByteDatatypeIri`: `http://www.w3.org/2001/XMLSchema#byte`
- `XsdNonNegativeIntegerDatatypeIri`: `http://www.w3.org/2001/XMLSchema#nonNegativeInteger`
- `XsdPositiveIntegerDatatypeIri`: `http://www.w3.org/2001/XMLSchema#positiveInteger`
- `XsdNonPositiveIntegerDatatypeIri`: `http://www.w3.org/2001/XMLSchema#nonPositiveInteger`
- `XsdNegativeIntegerDatatypeIri`: `http://www.w3.org/2001/XMLSchema#negativeInteger`
- `XsdUnsignedLongDatatypeIri`: `http://www.w3.org/2001/XMLSchema#unsignedLong`
- `XsdUnsignedIntDatatypeIri`: `http://www.w3.org/2001/XMLSchema#unsignedInt`
- `XsdUnsignedShortDatatypeIri`: `http://www.w3.org/2001/XMLSchema#unsignedShort`
- `XsdUnsignedByteDatatypeIri`: `http://www.w3.org/2001/XMLSchema#unsignedByte`

```ebnf
YearDatatypeIri ::= XsdGYearDatatypeIri

XsdGYearDatatypeIri ::= xsd_g_year_datatype_iri()

YearMonthDatatypeIri ::= XsdGYearMonthDatatypeIri

XsdGYearMonthDatatypeIri ::= xsd_g_year_month_datatype_iri()

DateDatatypeIri ::= XsdDateDatatypeIri

XsdDateDatatypeIri ::= xsd_date_datatype_iri()

TimeDatatypeIri ::= XsdTimeDatatypeIri

XsdTimeDatatypeIri ::= xsd_time_datatype_iri()

DateTimeDatatypeIri ::= XsdDateTimeDatatypeIri

XsdDateTimeDatatypeIri ::= xsd_date_time_datatype_iri()
```

`YearDatatypeIri`, `YearMonthDatatypeIri`, `DateDatatypeIri`, `TimeDatatypeIri`, and `DateTimeDatatypeIri` denote the XML Schema datatype IRIs used by the corresponding temporal literal categories.

The temporal datatype constructors denote the following XML Schema datatype IRIs:

- `XsdGYearDatatypeIri`: `http://www.w3.org/2001/XMLSchema#gYear`
- `XsdGYearMonthDatatypeIri`: `http://www.w3.org/2001/XMLSchema#gYearMonth`
- `XsdDateDatatypeIri`: `http://www.w3.org/2001/XMLSchema#date`
- `XsdTimeDatatypeIri`: `http://www.w3.org/2001/XMLSchema#time`
- `XsdDateTimeDatatypeIri`: `http://www.w3.org/2001/XMLSchema#dateTime`

The nonterminals `RichTextContent`, `ImageSource`, `YoutubeVideoSource`, `ChoiceOption`, `Unit`, `NumericPrecision`, `TimezoneEnabled`, `SingleLineTextRenderingHint`, `MultiLineTextRenderingHint`, `RadioRenderingHint`, `SingleSelectDropdownRenderingHint`, `CheckboxRenderingHint`, `MultiSelectDropdownRenderingHint`, `NumericRenderingHint`, `DateRenderingWidget`, `TimeRenderingWidget`, `DateTimeRenderingWidget`, `TermIri`, `Notation`, `PreferredLabel`, `Name`, `Description`, `Identifier`, `Version`, `Status`, `ModelVersion`, `PreviousVersion`, `DerivedFrom`, `MinCardinality`, `MaxCardinality`, `MinLength`, `MaxLength`, `ValidationRegex`, `TimePrecision`, `HourMinutePrecision`, `HourMinuteSecondPrecision`, `HourMinuteSecondFractionPrecision`, `DateTimeValueType`, `DateHourMinuteValueType`, `DateHourMinuteSecondValueType`, `DateHourMinuteSecondFractionValueType`, `DateFormat`, `DateComponentOrder`, `DayMonthYearOrder`, `MonthDayYearOrder`, `YearMonthDayOrder`, `Label`, `AlternativeLabel`, `AttributeName`, `Header`, `Footer`, `OntologyAcronym`, `OntologyName`, `OntologyIri`, `RootTermIri`, `RootTermLabel`, `MaxTraversalDepth`, `ValueSetIdentifier`, `ValueSetName`, `ValueSetIri`, `IriString`, `Bcp47Tag`, `UnicodeString`, `Iso8601DateTimeLexicalForm`, and `AsciiIdentifier` are intentionally left abstract in this version.

## Open Questions

- Should `LinkValue`, `ContactValue`, and `ExternalAuthorityValue` remain separate abstract value categories, or should they be normalized into a common literal-with-datatype form?
- Should embedded artifacts always refer to reusable artifacts by explicit reference construct, or does the CEDAR model require some embeddings to support inline artifact definition?
