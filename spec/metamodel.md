# Metamodel

## Overview

This section provides a conceptual overview of the CEDAR Template Model. Its purpose is to describe the principal categories of constructs, the relationships among them, and the design rationale behind key decisions. It is intended as a companion to the formal abstract grammar defined in [`spec/grammar.md`](grammar.md), which is the normative specification. Readers seeking precise structural definitions, production rules, or normative constraints should consult `grammar.md` directly.

The CEDAR Template Model is organised around three principal concerns: reusable schema artifacts that define structure, embedding constructs that contextualise those artifacts within a specific template, and template instances that record data conforming to a template.

## Principal Categories

`Artifact` is the broadest category in the model. Every artifact carries a repository-assigned identifier, descriptive metadata, lifecycle metadata, and zero or more annotations. `SchemaArtifact`, `PresentationComponent`, and `TemplateInstance` are the three principal subclasses.

A `SchemaArtifact` is a reusable artifact that defines schema structure. `Template` and `Field` are the two concrete schema artifact kinds. Both carry versioning metadata in addition to the common artifact metadata. Versioning metadata includes a semantic version, a publication status (`draft` or `published`), and optional lineage references: `PreviousVersion`, which links to the immediate predecessor in a version chain, and `DerivedFrom`, which identifies a source artifact when a schema has been copied or adapted from another. Independently of `SchemaArtifactVersioning`, every concrete `Artifact` (every `Template`, `TemplateInstance`, every `Field`, and every `PresentationComponent`) carries a top-level `ModelVersion` identifying the version of the CEDAR structural model the artifact conforms to.

A `Template` is the central container of the model. It specifies an ordered arrangement of `EmbeddedArtifact` constructs and defines the schema that `TemplateInstance` constructs must conform to.

A `Field` is an abstract category refined into typed concrete variants — `TextField`, `IntegerNumberField`, `RealNumberField`, `BooleanField`, `DateField`, `TimeField`, `DateTimeField`, `ControlledTermField`, `SingleValuedEnumField`, `MultiValuedEnumField`, `LinkField`, `EmailField`, `PhoneNumberField`, the external authority fields, and `AttributeValueField`. Each concrete field carries a matching `FieldSpec` that specifies its value semantics and configuration. The field artifact carries identity, metadata, and lifecycle information; the `FieldSpec` carries value rules and rendering properties. `IntegerNumberField` and `RealNumberField` together form the `NumericField` abstract category; `DateField`, `TimeField`, and `DateTimeField` form the `TemporalField` abstract category; `SingleValuedEnumField` and `MultiValuedEnumField` together form the `EnumField` abstract category. See `grammar.md` for the rationale behind these splits.

A `PresentationComponent` is a reusable non-data-bearing artifact that contributes presentational or instructional structure within a template. Examples include rich text, images, YouTube videos, section breaks, and page breaks. Presentation components do not produce instance values.

An `EmbeddedArtifact` contextualises a reusable artifact within a specific `Template`. It carries the template-local properties — key, cardinality, visibility, default value, label override, value requirement, and an optional semantic property IRI — that govern how the referenced artifact participates in that template context. There are three forms: `EmbeddedField`, `EmbeddedTemplate`, and `EmbeddedPresentationComponent`. `EmbeddedPresentationComponent` carries only the embedding key and an optional visibility, since it contributes no instance data and exists purely to contribute presentational structure.

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
  class EnumField {
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
  class SingleValuedEnumField
  class MultiValuedEnumField
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
  class IntegerNumberField
  class RealNumberField
  class BooleanField

  class TextFieldSpec
  class IntegerNumberFieldSpec
  class RealNumberFieldSpec
  class BooleanFieldSpec
  class DateFieldSpec
  class TimeFieldSpec
  class DateTimeFieldSpec
  class ControlledTermFieldSpec
  class SingleValuedEnumFieldSpec
  class MultiValuedEnumFieldSpec
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
  Field <|-- BooleanField
  Field <|-- TemporalField
  Field <|-- ControlledTermField
  Field <|-- EnumField
  Field <|-- LinkField
  Field <|-- ContactField
  Field <|-- ExternalAuthorityField
  Field <|-- AttributeValueField

  NumericField <|-- IntegerNumberField
  NumericField <|-- RealNumberField

  TemporalField <|-- DateField
  TemporalField <|-- TimeField
  TemporalField <|-- DateTimeField

  EnumField <|-- SingleValuedEnumField
  EnumField <|-- MultiValuedEnumField

  ContactField <|-- EmailField
  ContactField <|-- PhoneNumberField

  ExternalAuthorityField <|-- OrcidField
  ExternalAuthorityField <|-- RorField
  ExternalAuthorityField <|-- DoiField
  ExternalAuthorityField <|-- PubMedIdField
  ExternalAuthorityField <|-- RridField
  ExternalAuthorityField <|-- NihGrantIdField

  TextField --> TextFieldSpec : carries
  IntegerNumberField --> IntegerNumberFieldSpec : carries
  RealNumberField --> RealNumberFieldSpec : carries
  BooleanField --> BooleanFieldSpec : carries
  DateField --> DateFieldSpec : carries
  TimeField --> TimeFieldSpec : carries
  DateTimeField --> DateTimeFieldSpec : carries
  ControlledTermField --> ControlledTermFieldSpec : carries
  SingleValuedEnumField --> SingleValuedEnumFieldSpec : carries
  MultiValuedEnumField --> MultiValuedEnumFieldSpec : carries
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
