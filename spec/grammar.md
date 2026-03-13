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
                     ArtifactId
                     TemporalProvenance
                     Annotation*

DescriptiveMetadata ::= descriptive_metadata(
                          Name
                          [Description]
                          [Identifier]
                        )

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

TemporalProvenance ::= temporal_provenance(
                         CreatedOn
                         CreatedBy
                         ModifiedOn
                         ModifiedBy
                       )

CreatedOn ::= ISODateTimeStamp

CreatedBy ::= IRI

ModifiedOn ::= ISODateTimeStamp

ModifiedBy ::= IRI

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

## Supporting Nonterminals

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

## Field Type And Value Correspondence

The `FieldType` of a `Field` determines the permitted `Value` forms in corresponding `FieldValue` constructs.

The correspondence is:

- `TextFieldType` to `TextValue`
- `NumericFieldType` to `NumericValue`
- `TemporalFieldType` to `TemporalValue`
- `ControlledTermFieldType` to `ControlledTermValue`
- `ChoiceFieldType` to `ChoiceValue`
- `LinkFieldType` to `LinkValue`
- `ContactFieldType` to `ContactValue`
- `ExternalAuthorityFieldType` to `ExternalAuthorityValue`
- `AttributeValueFieldType` to `AttributeValue`

## Literals

```bnf
Literal ::= literal(
              LexicalForm
              DatatypeIRI
            )
```

A `Literal` in this specification is an RDF literal.

A `Literal` denotes an abstract literal value consisting of a lexical form and a datatype IRI and, in the language-tagged case, an associated language tag supplied by the enclosing `TextValue`.

The lexical form is a Unicode string and SHOULD be in Unicode Normalization Form C.

A `Literal` carries a language tag only through an enclosing `TextValue`.

If a `TextValue` carries `LanguageTag`, the contained `Literal` MUST use the datatype IRI `http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`.

If a `Literal` uses the datatype IRI `http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`, the enclosing `TextValue` MUST carry a non-empty language tag that is well-formed according to BCP 47.

Concrete syntaxes MAY use simpler surface forms that omit an explicit datatype IRI for string literals or language-tagged strings. Such forms are syntactic sugar and do not change the abstract structure defined by this specification.

The literal value associated with a `Literal` is determined as follows:

- If the `Literal` is language-tagged, the literal value is the pair consisting of lexical form and language tag, in that order.
- If the datatype IRI is recognized and the lexical form is in the lexical space of that datatype, the literal value is obtained by applying the lexical-to-value mapping of that datatype to the lexical form.
- If the datatype IRI is recognized but the lexical form is outside the lexical space of that datatype, the literal is ill-typed.
- If the datatype IRI is not recognized, the literal value is not defined by this specification.

An ill-typed literal is not syntactically ill-formed, but it does not determine a valid literal value and produces a semantic inconsistency. Implementations MUST accept ill-typed literals and MAY produce warnings when encountering them.

Two literals are term-equal if and only if their lexical forms, datatype IRIs, and language tags if present are equal character by character.

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
                 )

TemporalValue ::= temporal_value(
                    Literal
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

The nonterminals `RichTextContent`, `ImageSource`, `YouTubeVideoSource`, `ChoiceOption`, `NumericDatatype`, `Unit`, `NumericPrecision`, `TemporalDatatype`, `TemporalGranularity`, `TimeFormat`, `TimezoneEnabled`, `TextConstraint`, `NumericConstraint`, `TemporalConstraint`, `ControlledTermConstraint`, `ChoiceConstraint`, `ExternalAuthorityConstraint`, `SingleLineTextRenderingHint`, `MultiLineTextRenderingHint`, `RadioRenderingHint`, `SingleSelectDropdownRenderingHint`, `CheckboxRenderingHint`, `MultiSelectDropdownRenderingHint`, `NumericRenderingHint`, `TemporalRenderingHint`, `LexicalForm`, `IRI`, `LanguageTag`, `DatatypeIRI`, `TermIRI`, `Notation`, `PreferredLabel`, `Name`, `Description`, `Identifier`, `ISODateTimeStamp`, `Version`, `Status`, `ModelVersion`, `PreviousVersion`, `DerivedFrom`, `MinCardinality`, `MaxCardinality`, `Label`, `AlternativeLabel`, `AnnotationName`, `AnnotationValue`, `AttributeName`, `Header`, `Footer`, `OntologyAcronym`, `OntologyName`, `OntologyIRI`, `RootTermIRI`, `RootTermLabel`, `MaxTraversalDepth`, `ValueSetIdentifier`, `ValueSetName`, `ValueSetIRI`, and `KeyIdentifier` are intentionally left abstract in this version.

## Open Questions

- Should `LinkValue`, `ContactValue`, and `ExternalAuthorityValue` remain separate abstract value categories, or should they be normalized into a common literal-with-datatype form?
- Should embedded artifacts always refer to reusable artifacts by explicit reference construct, or does the CEDAR model require some embeddings to support inline artifact definition?
