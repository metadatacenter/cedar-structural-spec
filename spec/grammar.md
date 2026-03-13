# Abstract Grammar

This section defines the abstract structure of the CEDAR Template Model using a BNF-style grammar.

The grammar is abstract. It does not define any concrete serialization.

## Kernel Grammar

```bnf
Artifact ::= SchemaArtifact
           | PresentationComponent
           | TemplateInstance

SchemaArtifact ::= Template
                 | Field

Template ::= Template(
               SchemaArtifactMetadata
               [Header]
               [Footer]
               EmbeddedArtifact*
             )

EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent

EmbeddedField ::= EmbeddedField(
                    EmbeddedArtifactContext
                    EmbeddedArtifactKey
                    FieldReference
                    [ValueRequirement]
                    [Cardinality]
                    [Visibility]
                    [DefaultValue]
                    [LabelOverride]
                  )

EmbeddedTemplate ::= EmbeddedTemplate(
                       EmbeddedArtifactContext
                       EmbeddedArtifactKey
                       TemplateReference
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [LabelOverride]
                     )

EmbeddedPresentationComponent ::= EmbeddedPresentationComponent(
                                    EmbeddedArtifactContext
                                    EmbeddedArtifactKey
                                    PresentationComponentReference
                                    [Visibility]
                                    [LabelOverride]
                                  )

Field ::= Field(
            SchemaArtifactMetadata
            FieldType
            FieldIntrinsicConstraint*
          )

PresentationComponent ::= RichTextComponent
                        | ImageComponent
                        | YouTubeVideoComponent
                        | SectionBreakComponent
                        | PageBreakComponent

RichTextComponent ::= RichTextComponent(
                        ArtifactMetadata
                        RichTextContent
                      )

ImageComponent ::= ImageComponent(
                     ArtifactMetadata
                     ImageSource
                   )

YouTubeVideoComponent ::= YouTubeVideoComponent(
                            ArtifactMetadata
                            YouTubeVideoSource
                          )

SectionBreakComponent ::= SectionBreakComponent(
                            ArtifactMetadata
                          )

PageBreakComponent ::= PageBreakComponent(
                         ArtifactMetadata
                       )

TemplateInstance ::= TemplateInstance(
                       ArtifactMetadata
                       TemplateReference
                       InstanceValue*
                     )

InstanceValue ::= FieldValue
                | NestedTemplateInstance

FieldValue ::= FieldValue(
                 EmbeddedArtifactKey
                 Value*
               )

NestedTemplateInstance ::= NestedTemplateInstance(
                             EmbeddedArtifactKey
                             InstanceValue*
                           )
```

## Artifact Metadata

```bnf
SchemaArtifactMetadata ::= ArtifactMetadata
                           SchemaVersioning

ArtifactMetadata ::= DescriptiveMetadata
                     SystemIdentifier
                     TemporalProvenance
                     Annotation*

DescriptiveMetadata ::= DescriptiveMetadata(
                          Name
                          [Description]
                          [Identifier]
                        )

SystemIdentifier ::= SystemIdentifier(
                       IRI
                     )

TemporalProvenance ::= TemporalProvenance(
                         CreatedOn
                         CreatedBy
                         ModifiedOn
                         ModifiedBy
                       )

SchemaVersioning ::= SchemaVersioning(
                       Version
                       Status
                       ModelVersion
                       [PreviousVersion]
                       [DerivedFrom]
                     )

Annotation ::= Annotation(
                 AnnotationName
                 AnnotationValue
               )
```

## Supporting Nonterminals

```bnf
EmbeddedArtifactContext ::= EmbeddedArtifactContext(
                              [Order]
                            )

ValueRequirement ::= Required
                   | Recommended
                   | Optional

Cardinality ::= Cardinality(
                  MinCardinality
                  [MaxCardinality]
                )

Visibility ::= Visible
             | Hidden

DefaultValue ::= DefaultValue(
                   Value*
                 )

LabelOverride ::= LabelOverride(
                    Label
                    AlternativeLabel*
                  )
```

## Field Types

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

TextFieldType ::= SingleLineTextFieldType
                | MultiLineTextFieldType

NumericFieldType ::= NumericFieldType(
                       NumericDatatype
                       [Unit]
                       [NumericPrecision]
                     )

TemporalFieldType ::= TemporalFieldType(
                        TemporalDatatype
                        [TemporalGranularity]
                        [TimeFormat]
                        [TimezoneEnabled]
                      )

ControlledTermFieldType ::= ControlledTermFieldType(
                              ControlledTermSource+
                            )

ControlledTermSource ::= OntologySource
                       | BranchSource
                       | ClassSource
                       | ValueSetSource

ChoiceFieldType ::= RadioChoiceFieldType
                  | CheckboxChoiceFieldType
                  | SingleSelectChoiceFieldType
                  | MultiSelectChoiceFieldType

ContactFieldType ::= EmailFieldType
                   | PhoneNumberFieldType

ExternalAuthorityFieldType ::= ORCIDFieldType
                             | RORFieldType
                             | DOIFieldType
                             | PubMedIDFieldType
                             | RRIDFieldType
                             | NIHGrantIDFieldType

AttributeValueFieldType ::= AttributeValueFieldType()

FieldIntrinsicConstraint ::= TextConstraint
                           | NumericConstraint
                           | TemporalConstraint
                           | ControlledTermConstraint
                           | ChoiceConstraint
                           | ExternalAuthorityConstraint
```

## Supporting Nonterminals

```bnf

Value ::= TextValue
        | NumericValue
        | TemporalValue
        | ControlledTermValue
        | ChoiceValue
        | LinkValue
        | ContactValue
        | ExternalAuthorityValue
        | AttributeValue

TextValue ::= TextValue(
                Literal
                [LanguageTag]
              )

NumericValue ::= NumericValue(
                   Literal
                   [DatatypeIRI]
                 )

TemporalValue ::= TemporalValue(
                    Literal
                    [DatatypeIRI]
                  )

ControlledTermValue ::= ControlledTermValue(
                          TermIRI
                          Label
                          [Notation]
                          [PreferredLabel]
                        )

ChoiceValue ::= ChoiceValue(
                  Literal
                )

LinkValue ::= LinkValue(
                IRI
              )

ContactValue ::= ContactValue(
                   Literal
                 )

ExternalAuthorityValue ::= ExternalAuthorityValue(
                             Literal
                           )

AttributeValue ::= AttributeValue(
                    AttributeName
                    Value
                  )

Literal ::= Literal(
              LexicalForm
            )
```

`Literal` denotes an abstract lexical value. It carries lexical content only. Datatype interpretation and language tagging are supplied by the enclosing value construct when applicable.

The nonterminals `FieldReference`, `TemplateReference`, `PresentationComponentReference`, `RichTextContent`, `ImageSource`, `YouTubeVideoSource`, `OntologySource`, `BranchSource`, `ClassSource`, `ValueSetSource`, `NumericDatatype`, `Unit`, `NumericPrecision`, `TemporalDatatype`, `TemporalGranularity`, `TimeFormat`, `TimezoneEnabled`, `TextConstraint`, `NumericConstraint`, `TemporalConstraint`, `ControlledTermConstraint`, `ChoiceConstraint`, `ExternalAuthorityConstraint`, `LexicalForm`, `IRI`, `LanguageTag`, `DatatypeIRI`, `TermIRI`, `Notation`, `PreferredLabel`, `Name`, `Description`, `Identifier`, `CreatedOn`, `CreatedBy`, `ModifiedOn`, `ModifiedBy`, `Version`, `Status`, `ModelVersion`, `PreviousVersion`, `DerivedFrom`, `Order`, `MinCardinality`, `MaxCardinality`, `Label`, `AlternativeLabel`, `AnnotationName`, `AnnotationValue`, `AttributeName`, `Header`, and `Footer` are intentionally left abstract in this version.

## Open Questions

- Should `LinkValue`, `ContactValue`, and `ExternalAuthorityValue` remain separate abstract value categories, or should they be normalized into a common literal-with-datatype form?
- Should embedding-specific presentation hints appear in embedded artifact properties, in `FieldType`, or in a separate nonterminal?
