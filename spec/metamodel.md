# Metamodel

## Overview

This section provides a conceptual overview of the CEDAR Template Model. Its purpose is to describe the principal categories of constructs, the relationships among them, and the design rationale behind key decisions. It is intended as a companion to the formal abstract grammar defined in [`spec/grammar.md`](grammar.md), which is the normative specification. Readers seeking precise structural definitions, production rules, or normative constraints should consult `grammar.md` directly.

The CEDAR Template Model is organised around three principal concerns: reusable schema artifacts that define structure, embedding constructs that contextualise those artifacts within a specific template, and template instances that record data conforming to a template.

## Principal Categories

`Artifact` is the broadest category in the model. Every artifact carries a repository-assigned identifier, descriptive metadata, temporal provenance, and zero or more annotations. `SchemaArtifact`, `PresentationComponent`, and `TemplateInstance` are the three principal subclasses.

A `SchemaArtifact` is a reusable artifact that defines schema structure. `Template` and `Field` are the two concrete schema artifact kinds. Both carry versioning metadata in addition to the common artifact metadata.

A `Template` is the central container of the model. It specifies an ordered arrangement of `EmbeddedArtifact` constructs and defines the schema that `TemplateInstance` constructs must conform to.

A `Field` is an abstract category refined into typed concrete variants — `TextField`, `NumericField`, `DateField`, `TimeField`, `DateTimeField`, `ControlledTermField`, `SingleChoiceField`, `MultipleChoiceField`, `LinkField`, `EmailField`, `PhoneNumberField`, the external authority fields, and `AttributeValueField`. Each concrete field carries a matching `FieldType` that specifies its value semantics and configuration. The field artifact carries identity, metadata, and provenance; the `FieldType` carries value rules and rendering properties. See `grammar.md` for the rationale behind this separation.

A `PresentationComponent` is a reusable non-data-bearing artifact that contributes presentational or instructional structure within a template. Examples include rich text, images, YouTube videos, section breaks, and page breaks. Presentation components do not produce instance values.

An `EmbeddedArtifact` contextualises a reusable artifact within a specific `Template`. It carries the template-local properties — key, cardinality, visibility, default value, label override, and value requirement — that govern how the referenced artifact participates in that template context. There are three forms: `EmbeddedField`, `EmbeddedTemplate`, and `EmbeddedPresentationComponent`.

An `EmbeddedArtifactKey` is the local identifier of an `EmbeddedArtifact` within its containing `Template`. It is the mechanism that connects template structure to instance structure.

A `TemplateInstance` is an artifact that records data conforming to a `Template`. It contains `FieldValue` and `NestedTemplateInstance` constructs keyed by `EmbeddedArtifactKey`, corresponding to the data-bearing embedded artifacts of the referenced template.

## Field Hierarchy

The diagram below shows the complete `Field` hierarchy and the `FieldType` each concrete field variant carries.

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

  class TextFieldType
  class NumericFieldType
  class DateFieldType
  class TimeFieldType
  class DateTimeFieldType
  class ControlledTermFieldType
  class SingleChoiceFieldType
  class MultipleChoiceFieldType
  class LinkFieldType
  class EmailFieldType
  class PhoneNumberFieldType
  class OrcidFieldType
  class RorFieldType
  class DoiFieldType
  class PubMedIdFieldType
  class RridFieldType
  class NihGrantIdFieldType
  class AttributeValueFieldType

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

  TextField --> TextFieldType : carries
  NumericField --> NumericFieldType : carries
  DateField --> DateFieldType : carries
  TimeField --> TimeFieldType : carries
  DateTimeField --> DateTimeFieldType : carries
  ControlledTermField --> ControlledTermFieldType : carries
  SingleChoiceField --> SingleChoiceFieldType : carries
  MultipleChoiceField --> MultipleChoiceFieldType : carries
  LinkField --> LinkFieldType : carries
  EmailField --> EmailFieldType : carries
  PhoneNumberField --> PhoneNumberFieldType : carries
  OrcidField --> OrcidFieldType : carries
  RorField --> RorFieldType : carries
  DoiField --> DoiFieldType : carries
  PubMedIdField --> PubMedIdFieldType : carries
  RridField --> RridFieldType : carries
  NihGrantIdField --> NihGrantIdFieldType : carries
  AttributeValueField --> AttributeValueFieldType : carries
```
