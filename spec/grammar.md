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
                    EmbeddedArtifactContext
                    EmbeddedArtifactKey
                    FieldReference
                    [ValueRequirement]
                    [Cardinality]
                    [Visibility]
                    [DefaultValue]
                    [LabelOverride]
                  )

EmbeddedTemplate ::= embedded_template(
                       EmbeddedArtifactContext
                       EmbeddedArtifactKey
                       TemplateReference
                       [ValueRequirement]
                       [Cardinality]
                       [Visibility]
                       [LabelOverride]
                     )

EmbeddedPresentationComponent ::= embedded_presentation_component(
                                    EmbeddedArtifactContext
                                    EmbeddedArtifactKey
                                    PresentationComponentReference
                                    [Visibility]
                                    [LabelOverride]
                                  )

Field ::= field(
            SchemaArtifactMetadata
            FieldType
            FieldIntrinsicConstraint*
          )

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

## Artifact Metadata

```bnf
SchemaArtifactMetadata ::= ArtifactMetadata
                           SchemaVersioning

ArtifactMetadata ::= DescriptiveMetadata
                     SystemIdentifier
                     TemporalProvenance
                     Annotation*

DescriptiveMetadata ::= descriptive_metadata(
                          Name
                          [Description]
                          [Identifier]
                        )

SystemIdentifier ::= system_identifier(
                       IRI
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
```

## Supporting Nonterminals

```bnf
EmbeddedArtifactContext ::= embedded_artifact_context(
                              [Order]
                            )

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

LabelOverride ::= label_override(
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

TextFieldType ::= text_field_type(
                    [TextRenderingHint]
                  )

NumericFieldType ::= numeric_field_type(
                       NumericDatatype
                       [NumericRenderingHint]
                       [Unit]
                       [NumericPrecision]
                     )

TemporalFieldType ::= temporal_field_type(
                        TemporalDatatype
                        [TemporalRenderingHint]
                        [TemporalGranularity]
                        [TimeFormat]
                        [TimezoneEnabled]
                      )

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

FieldIntrinsicConstraint ::= TextConstraint
                           | NumericConstraint
                           | TemporalConstraint
                           | ControlledTermConstraint
                           | ChoiceConstraint
                           | ExternalAuthorityConstraint
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
                | TemporalRenderingHint

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

Similarly, `ChoiceFieldType` distinguishes `SingleChoiceFieldType` from `MultipleChoiceFieldType` semantically, while the rendering hint determines whether the UI uses radio buttons, checkboxes, or dropdown presentation. Typed rendering hints make incompatible combinations structurally invalid.

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

TextValue ::= text_value(
                Literal
                [LanguageTag]
              )

NumericValue ::= numeric_value(
                   Literal
                   [DatatypeIRI]
                 )

TemporalValue ::= temporal_value(
                    Literal
                    [DatatypeIRI]
                  )

ControlledTermValue ::= controlled_term_value(
                          TermIRI
                          Label
                          [Notation]
                          [PreferredLabel]
                        )

ChoiceValue ::= choice_value(
                  Literal
                )

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

Literal ::= literal(
              LexicalForm
            )
```

`Literal` denotes an abstract lexical value. It carries lexical content only. Datatype interpretation and language tagging are supplied by the enclosing value construct when applicable.

The nonterminals `FieldReference`, `TemplateReference`, `PresentationComponentReference`, `RichTextContent`, `ImageSource`, `YouTubeVideoSource`, `ChoiceOption`, `NumericDatatype`, `Unit`, `NumericPrecision`, `TemporalDatatype`, `TemporalGranularity`, `TimeFormat`, `TimezoneEnabled`, `TextConstraint`, `NumericConstraint`, `TemporalConstraint`, `ControlledTermConstraint`, `ChoiceConstraint`, `ExternalAuthorityConstraint`, `SingleLineTextRenderingHint`, `MultiLineTextRenderingHint`, `RadioRenderingHint`, `SingleSelectDropdownRenderingHint`, `CheckboxRenderingHint`, `MultiSelectDropdownRenderingHint`, `NumericRenderingHint`, `TemporalRenderingHint`, `LexicalForm`, `IRI`, `LanguageTag`, `DatatypeIRI`, `TermIRI`, `Notation`, `PreferredLabel`, `Name`, `Description`, `Identifier`, `CreatedOn`, `CreatedBy`, `ModifiedOn`, `ModifiedBy`, `Version`, `Status`, `ModelVersion`, `PreviousVersion`, `DerivedFrom`, `Order`, `MinCardinality`, `MaxCardinality`, `Label`, `AlternativeLabel`, `AnnotationName`, `AnnotationValue`, `AttributeName`, `Header`, `Footer`, `OntologyAcronym`, `OntologyName`, `OntologyIRI`, `RootTermIRI`, `RootTermLabel`, `MaxTraversalDepth`, `ValueSetIdentifier`, `ValueSetName`, and `ValueSetIRI` are intentionally left abstract in this version.

## Open Questions

- Should `LinkValue`, `ContactValue`, and `ExternalAuthorityValue` remain separate abstract value categories, or should they be normalized into a common literal-with-datatype form?
