# Metamodel

## Overview

This section provides a conceptual overview of the CEDAR Template Model. Its purpose is to describe the principal categories of constructs, the relationships among them, and the design rationale behind key decisions. It is intended as a companion to the formal abstract grammar defined in [`spec/grammar.md`](grammar.md), which is the normative specification. Readers seeking precise structural definitions, production rules, or normative constraints should consult `grammar.md` directly.

The CEDAR Template Model is organised around three principal concerns: reusable schema artifacts that define structure, embedding constructs that contextualise those artifacts within a specific template, and template instances that record data conforming to a template.

## Principal Categories

`Artifact` is the broadest category in the model. Every artifact carries a repository-assigned identifier, descriptive metadata, temporal provenance, and zero or more annotations. `SchemaArtifact`, `PresentationComponent`, and `TemplateInstance` are the three principal subclasses.

A `SchemaArtifact` is a reusable artifact that defines schema structure. `Template` and `Field` are the two concrete schema artifact kinds. Both carry versioning metadata in addition to the common artifact metadata. Versioning metadata includes a semantic version, a publication status (`draft` or `published`), the CEDAR model version used when the artifact was created, and optional lineage references: `PreviousVersion`, which links to the immediate predecessor in a version chain, and `DerivedFrom`, which identifies a source artifact when a schema has been copied or adapted from another.

A `Template` is the central container of the model. It specifies an ordered arrangement of `EmbeddedArtifact` constructs and defines the schema that `TemplateInstance` constructs must conform to.

A `Field` is an abstract category refined into typed concrete variants — `TextField`, `NumericField`, `DateField`, `TimeField`, `DateTimeField`, `ControlledTermField`, `SingleChoiceField`, `MultipleChoiceField`, `LinkField`, `EmailField`, `PhoneNumberField`, the external authority fields, and `AttributeValueField`. Each concrete field carries a matching `FieldSpec` that specifies its value semantics and configuration. The field artifact carries identity, metadata, and provenance; the `FieldSpec` carries value rules and rendering properties. See `grammar.md` for the rationale behind this separation.

A `PresentationComponent` is a reusable non-data-bearing artifact that contributes presentational or instructional structure within a template. Examples include rich text, images, YouTube videos, section breaks, and page breaks. Presentation components do not produce instance values.

An `EmbeddedArtifact` contextualises a reusable artifact within a specific `Template`. It carries the template-local properties — key, cardinality, visibility, default value, label override, value requirement, and an optional semantic property IRI — that govern how the referenced artifact participates in that template context. There are three forms: `EmbeddedField`, `EmbeddedTemplate`, and `EmbeddedPresentationComponent`. `EmbeddedPresentationComponent` does not carry a property, as it contributes no instance data.

An `EmbeddedArtifactKey` is the local identifier of an `EmbeddedArtifact` within its containing `Template`. It is the mechanism that connects template structure to instance structure.

A `TemplateInstance` is an artifact that records data conforming to a `Template`. It contains `FieldValue` and `NestedTemplateInstance` constructs keyed by `EmbeddedArtifactKey`, corresponding to the data-bearing embedded artifacts of the referenced template.

## Field Hierarchy

The diagram below shows the complete `Field` hierarchy and the `FieldSpec` each concrete field variant carries.

```mermaid
classDiagram
  class Field {
    <<abstract>>
  }
  class TemporalField {
    <<abstract>>
  }
  class ChoiceField {
    <<abstract>>
  }
  class ContactField {
    <<abstract>>
  }
  class ExternalAuthorityField {
    <<abstract>>
  }

  class TextField
  class NumericField
  class DateField
  class TimeField
  class DateTimeField
  class ControlledTermField
  class SingleChoiceField
  class MultipleChoiceField
  class LinkField
  class EmailField
  class PhoneNumberField
  class OrcidField
  class RorField
  class DoiField
  class PubMedIdField
  class RridField
  class NihGrantIdField
  class AttributeValueField

  class TextFieldSpec
  class NumericFieldSpec
  class DateFieldSpec
  class TimeFieldSpec
  class DateTimeFieldSpec
  class ControlledTermFieldSpec
  class SingleChoiceFieldSpec
  class MultipleChoiceFieldSpec
  class LinkFieldSpec
  class EmailFieldSpec
  class PhoneNumberFieldSpec
  class OrcidFieldSpec
  class RorFieldSpec
  class DoiFieldSpec
  class PubMedIdFieldSpec
  class RridFieldSpec
  class NihGrantIdFieldSpec
  class AttributeValueFieldSpec

  Field <|-- TextField
  Field <|-- NumericField
  Field <|-- TemporalField
  Field <|-- ControlledTermField
  Field <|-- ChoiceField
  Field <|-- LinkField
  Field <|-- ContactField
  Field <|-- ExternalAuthorityField
  Field <|-- AttributeValueField

  TemporalField <|-- DateField
  TemporalField <|-- TimeField
  TemporalField <|-- DateTimeField

  ChoiceField <|-- SingleChoiceField
  ChoiceField <|-- MultipleChoiceField

  ContactField <|-- EmailField
  ContactField <|-- PhoneNumberField

  ExternalAuthorityField <|-- OrcidField
  ExternalAuthorityField <|-- RorField
  ExternalAuthorityField <|-- DoiField
  ExternalAuthorityField <|-- PubMedIdField
  ExternalAuthorityField <|-- RridField
  ExternalAuthorityField <|-- NihGrantIdField

  TextField --> TextFieldSpec : carries
  NumericField --> NumericFieldSpec : carries
  DateField --> DateFieldSpec : carries
  TimeField --> TimeFieldSpec : carries
  DateTimeField --> DateTimeFieldSpec : carries
  ControlledTermField --> ControlledTermFieldSpec : carries
  SingleChoiceField --> SingleChoiceFieldSpec : carries
  MultipleChoiceField --> MultipleChoiceFieldSpec : carries
  LinkField --> LinkFieldSpec : carries
  EmailField --> EmailFieldSpec : carries
  PhoneNumberField --> PhoneNumberFieldSpec : carries
  OrcidField --> OrcidFieldSpec : carries
  RorField --> RorFieldSpec : carries
  DoiField --> DoiFieldSpec : carries
  PubMedIdField --> PubMedIdFieldSpec : carries
  RridField --> RridFieldSpec : carries
  NihGrantIdField --> NihGrantIdFieldSpec : carries
  AttributeValueField --> AttributeValueFieldSpec : carries
```
