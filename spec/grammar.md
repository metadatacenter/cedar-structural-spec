# Abstract Grammar

This section defines the abstract structure of the CEDAR Template Model using a BNF-style grammar.

The grammar defines the abstract syntactic structure of the model. It specifies the kinds of constructs that exist and how they are composed, but it does not define a concrete textual or data serialization such as JSON, YAML, RDF, or a functional-style syntax.

Accordingly, a production in this grammar describes abstract structure rather than a directly parseable text form. In particular, a production such as `Template ::= template( ... )` does not mean:

- the literal token `template` must appear in a file
- parentheses must appear in a file
- whitespace must be used in a particular way in a file
- the production is itself a concrete serialization format

The following notation is used throughout this grammar:

```bnf
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

```bnf
Template ::= template(
               SchemaArtifactMetadata
               EmbeddedArtifact*
             )
```

`Template` is the production being defined, while `template(...)` denotes the abstract constructor form of that construct; in other words, it shows the components of a `Template` and how they are composed.

## Kernel Grammar

The kernel grammar defines the primary abstract categories of the model and the core schema-level structure that connects them. It introduces reusable schema artifacts, templates, and the embedding constructs through which templates assemble fields, nested templates, and presentation components. Subsequent sections refine the metadata, field-type families, instance structures, and supporting constructs referenced here.

```bnf
Artifact ::= SchemaArtifact
           | PresentationComponent
           | TemplateInstance

SchemaArtifact ::= Field
                 | Template

Field ::= field(
            SchemaArtifactMetadata
            FieldType
          )

Template ::= template(
               SchemaArtifactMetadata
               [Header]
               [Footer]
               EmbeddedArtifact*
             )

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

Artifact identity defines the typed identifiers by which reusable artifacts and artifact references are denoted in the model. These identity constructs are distinct from descriptive metadata, provenance, versioning, and annotations.

```bnf
ArtifactId ::= artifact_id(
                 IRI
               )

FieldId ::= field_id(
              IRI
            )

TemplateId ::= template_id(
                 IRI
               )

PresentationComponentId ::= presentation_component_id(
                              IRI
                            )
```

## Artifact Metadata

Artifact metadata defines descriptive information, provenance, versioning, and annotations. `ArtifactMetadata` provides the common metadata carried by all artifacts, while `SchemaArtifactMetadata` extends that common structure with schema-versioning information used by reusable schema artifacts.

```bnf
SchemaArtifactMetadata ::= ArtifactMetadata
                           SchemaVersioning

ArtifactMetadata ::= DescriptiveMetadata
                     ArtifactId
                     TemporalProvenance
                     Annotation*

DescriptiveMetadata ::= descriptive_metadata(
                          Name
                          [Description]
                          [Identifier]
                        )

TemporalProvenance ::= temporal_provenance(
                         CreatedOn
                         CreatedBy
                         ModifiedOn
                         ModifiedBy
                       )

SchemaVersioning ::= schema_versioning(
                       Version
                       Status
                       ModelVersion
                       [PreviousVersion]
                       [DerivedFrom]
                     )

Annotation ::= annotation(
                 AnnotationName
                 AnnotationValue
               )

CreatedOn ::= ISODateTimeStamp

CreatedBy ::= IRI

ModifiedOn ::= ISODateTimeStamp

ModifiedBy ::= IRI
```

`CreatedOn` and `ModifiedOn` MUST be ISO 8601 date-time timestamps.

`CreatedBy` and `ModifiedBy` denote IRIs identifying the responsible agents.

## Embedded Artifact Keys

An `EmbeddedArtifactKey` is the local identifier of an `EmbeddedArtifact` within a `Template`.

```bnf
EmbeddedArtifactKey ::= embedded_artifact_key(
                          KeyIdentifier
                        )
```

`EmbeddedArtifactKey` MUST be an ASCII identifier without whitespace.

`EmbeddedArtifactKey` values are local to a `Template` and MUST be unique within that `Template`.

## Embedded Artifact Properties

Embedded artifact properties define the contextual information carried by an `EmbeddedArtifact` within a `Template`. These properties govern how a referenced reusable artifact is used in that template context, including reference, requirement, cardinality, visibility, defaults, and label override, and they are distinct from the intrinsic properties of the referenced reusable artifact itself.

```bnf

FieldReference ::= FieldId

TemplateReference ::= TemplateId

PresentationComponentReference ::= PresentationComponentId

ValueRequirement ::= Required
                   | Recommended
                   | Optional

Cardinality ::= cardinality(
                  MinCardinality
                  [MaxCardinality]
                )

Visibility ::= Visible
             | Hidden

DefaultValue ::= default_value(
                   Value*
                 )

TextDefaultValue ::= text_default_value(
                      TextValue
                    )

LabelOverride ::= label_override(
                    Label
                    AlternativeLabel*
                  )
```

## Field Types

`FieldType` denotes the semantic category of values that a `Field` may carry. The `FieldType` productions define the value structure associated with a field and, where appropriate, the typed rendering hints and field-type-specific properties that are valid for that semantic category.

```bnf

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

ExternalAuthorityFieldType ::= ORCIDFieldType
                             | RORFieldType
                             | DOIFieldType
                             | PubMedIDFieldType
                             | RRIDFieldType
                             | NIHGrantIDFieldType

AttributeValueFieldType ::= attribute_value_field_type()
```

## Temporal Fields

`TemporalFieldType` denotes temporal-valued fields and is refined into strongly typed date, time, and date-time forms. This section groups the temporal field-type productions together with their compatible rendering hints, values, and literals.

```bnf
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

```bnf
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

```bnf
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

```bnf
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

```bnf
ControlledTermSource ::= OntologySource
                       | BranchSource
                       | ClassSource
                       | ValueSetSource

OntologySource ::= ontology_source(
                     OntologyReference
                   )

OntologyReference ::= ontology_reference(
                        OntologyIRI
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
                   RootTermIRI
                   RootTermLabel
                   [MaxTraversalDepth]
                 )

ClassSource ::= class_source(
                  ControlledTermClass+
                )

ControlledTermClass ::= controlled_term_class(
                          TermIRI
                          Label
                          OntologyReference
                        )

ValueSetSource ::= value_set_source(
                     ValueSetIdentifier
                     [ValueSetName]
                     [ValueSetIRI]
                   )
```

## Rendering Hints

```bnf
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

```bnf
Literal ::= DatatypeIriLiteral
          | LangStringLiteral

DatatypeIriLiteral ::= datatype_iri_literal(
                         LexicalForm
                         DatatypeIRI
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

```bnf
TemplateInstance ::= template_instance(
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

```bnf
PresentationComponent ::= RichTextComponent
                        | ImageComponent
                        | YouTubeVideoComponent
                        | SectionBreakComponent
                        | PageBreakComponent

RichTextComponent ::= rich_text_component(
                        ArtifactMetadata
                        RichTextContent
                      )

ImageComponent ::= image_component(
                     ArtifactMetadata
                     ImageSource
                   )

YouTubeVideoComponent ::= you_tube_video_component(
                            ArtifactMetadata
                            YouTubeVideoSource
                          )

SectionBreakComponent ::= section_break_component(
                            ArtifactMetadata
                          )

PageBreakComponent ::= page_break_component(
                         ArtifactMetadata
                       )
```

## Supporting Nonterminals

```bnf

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
                          TermIRI
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
                IRI
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

```bnf
IRI ::= iri(
          IRIString
        )

DatatypeIRI ::= datatype_iri(
                IRI
              )

LanguageTag ::= language_tag(
                  BCP47Tag
                )

LexicalForm ::= lexical_form(
                  UnicodeString
                )

ISODateTimeStamp ::= iso_date_time_stamp(
                       ISO8601DateTimeLexicalForm
                     )

KeyIdentifier ::= key_identifier(
                    ASCIIIdentifier
                  )
```

`IRI` denotes an Internationalized Resource Identifier.

`DatatypeIRI` denotes an `IRI` that identifies an RDF datatype.

`LanguageTag` denotes a well-formed BCP 47 language tag.

`LexicalForm` denotes a Unicode string and SHOULD be in Unicode Normalization Form C.

`ISODateTimeStamp` denotes an ISO 8601 date-time lexical form.

`KeyIdentifier` denotes an ASCII identifier without whitespace.

```bnf
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

```bnf
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

The nonterminals `RichTextContent`, `ImageSource`, `YouTubeVideoSource`, `ChoiceOption`, `Unit`, `NumericPrecision`, `TimezoneEnabled`, `SingleLineTextRenderingHint`, `MultiLineTextRenderingHint`, `RadioRenderingHint`, `SingleSelectDropdownRenderingHint`, `CheckboxRenderingHint`, `MultiSelectDropdownRenderingHint`, `NumericRenderingHint`, `DateRenderingWidget`, `TimeRenderingWidget`, `DateTimeRenderingWidget`, `TermIRI`, `Notation`, `PreferredLabel`, `Name`, `Description`, `Identifier`, `Version`, `Status`, `ModelVersion`, `PreviousVersion`, `DerivedFrom`, `MinCardinality`, `MaxCardinality`, `MinLength`, `MaxLength`, `ValidationRegex`, `TimePrecision`, `HourMinutePrecision`, `HourMinuteSecondPrecision`, `HourMinuteSecondFractionPrecision`, `DateTimeValueType`, `DateHourMinuteValueType`, `DateHourMinuteSecondValueType`, `DateHourMinuteSecondFractionValueType`, `DateFormat`, `DateComponentOrder`, `DayMonthYearOrder`, `MonthDayYearOrder`, `YearMonthDayOrder`, `Label`, `AlternativeLabel`, `AnnotationName`, `AnnotationValue`, `AttributeName`, `Header`, `Footer`, `OntologyAcronym`, `OntologyName`, `OntologyIRI`, `RootTermIRI`, `RootTermLabel`, `MaxTraversalDepth`, `ValueSetIdentifier`, `ValueSetName`, `ValueSetIRI`, `IRIString`, `BCP47Tag`, `UnicodeString`, `ISO8601DateTimeLexicalForm`, and `ASCIIIdentifier` are intentionally left abstract in this version.

## Open Questions

- Should `LinkValue`, `ContactValue`, and `ExternalAuthorityValue` remain separate abstract value categories, or should they be normalized into a common literal-with-datatype form?
- Should embedded artifacts always refer to reusable artifacts by explicit reference construct, or does the CEDAR model require some embeddings to support inline artifact definition?
