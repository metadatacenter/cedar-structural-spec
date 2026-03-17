# Mapping From the CEDAR Structural Model to the CTM 1.6.0 Serialization

## Purpose

This note maps the CEDAR Structural Model to the CTM 1.6.0 serialization described in `notes/CEDAR Template Model v1.6.0.md`.

The CEDAR Structural Model remains authoritative. The purpose of this note is to describe how that cleaner conceptual model can be encoded in the CTM 1.6.0 product-oriented format for compatibility and migration work.

## Basis

This mapping is based on the Markdown transcription of the CTM 1.6.0 specification in `notes/CEDAR Template Model v1.6.0.md`.

In particular, the CTM 1.6.0 format is explicitly described there as combining:

- JSON Schema for structural shape
- JSON-LD for semantic markup
- `_valueConstraints` for value semantics and restrictions
- `_ui` for rendering and acquisition behavior

That combination is the main architectural difference between the Structural Model and the CTM 1.6.0 serialization.

## CTM 1.6.0 Serialization Architecture

A single CTM 1.6.0 artifact object may simultaneously contain:

- artifact identity and metadata
- JSON Schema structure
- JSON-LD context and typing
- `_valueConstraints`
- `_ui`

This means the CTM 1.6.0 format does not separate conceptual structure from serialization machinery. The Structural Model does separate those concerns.

## CTM 1.6.0 Artifact Kinds

The CTM 1.6.0 specification uses the following main schema-level categories:

- `Template`
- `Template Element`
- `Template Field`

The CTM 1.6.0 instance-level category is:

- `Template Instance`

The Structural Model differs here in two important ways:

- it uses `TemplateInstance` rather than `Template Instance`
- it separates `Field` from `PresentationComponent`, whereas the CTM 1.6.0 model does not have an equivalent clean presentation-component family

## CTM 1.6.0 Structural Layers

### Artifact Identity And Metadata

CTM 1.6.0 artifacts commonly use:

- `@id`
- `@type`
- `schema:identifier`
- `schema:name`
- `schema:description`
- `pav:version`
- `bibo:status`
- `schema:schemaVersion`
- `pav:previousVersion`
- `pav:derivedFrom`
- `pav:createdOn`
- `pav:createdBy`
- `pav:lastUpdatedOn`
- `oslc:modifiedBy`
- `@context`

These correspond reasonably well to the Structural Model's identity, descriptive metadata, provenance, and versioning constructs.

### JSON Schema Structural Layer

CTM 1.6.0 artifacts use JSON Schema members such as:

- `$schema`
- `type`
- `title`
- `description`
- `properties`
- `required`
- `items`
- `minItems`
- `maxItems`
- `additionalProperties`
- `$ref`

This layer carries structural containment, repetition, and instance-shape requirements.

### JSON-LD Semantic Layer

CTM 1.6.0 artifacts use JSON-LD members such as:

- `@context`
- `@type`
- `@id`
- `@value`
- `rdfs:label`
- `skos:notation`
- `@nest`

This layer carries linked-data typing and value representation.

### CTM 1.6.0 Semantic Constraint Layer

CTM 1.6.0 field semantics are grouped under `_valueConstraints`.

The CTM 1.6.0 specification explicitly uses this bucket for things such as:

- `requiredValue`
- `multipleChoice`
- `defaultValue`
- `minLength`
- `maxLength`
- `numberType`
- `unitOfMeasure`
- `minValue`
- `maxValue`
- `decimalPlace`
- `temporalType`

Controlled-term restrictions are also described there through ontology, branch, class, and value-set style constraints.

### CTM 1.6.0 Rendering And Acquisition Layer

CTM 1.6.0 rendering and acquisition behavior are grouped under `_ui`.

The CTM 1.6.0 specification explicitly uses this bucket for things such as:

- `inputType`
- `hidden`
- `valueRecommendationEnabled`
- `temporalGranularity`
- `inputTimeFormat`
- `timeZoneEnabled`
- `propertyLabels`
- `propertyDescriptions`

## Mapping Principles

When mapping from the Structural Model to the CTM 1.6.0 format:

- current semantic distinctions should be mapped into `_valueConstraints` where the CTM 1.6.0 format expects semantics
- current rendering hints should be mapped into `_ui`
- structural embedding and multiplicity should be mapped using JSON Schema members such as `properties`, `required`, `items`, `minItems`, and `maxItems`
- JSON Schema and JSON-LD machinery should be treated as serialization support, not as part of the Structural Model

## Core Mapping Table

| Current model construct | CTM 1.6.0 representation | Mapping quality | Notes |
| --- | --- | --- | --- |
| `ArtifactId` | `@id` | Exact | Direct identifier mapping. |
| `FieldId` | `@id` on a template field artifact | Nearly exact | Typed identity is flattened. |
| `TemplateId` | `@id` on a template artifact | Nearly exact | Typed identity is flattened. |
| `PresentationComponentId` | No clean direct equivalent | Lossy | CTM 1.6.0 model does not separate reusable presentation artifacts cleanly. |
| `Name` | `schema:name` | Exact | Direct mapping. |
| `Description` | `schema:description` | Exact | Direct mapping. |
| `Identifier` | `schema:identifier` | Exact | Direct mapping. |
| `CreatedOn` | `pav:createdOn` | Exact | Direct mapping. |
| `CreatedBy` | `pav:createdBy` | Exact | Direct mapping. |
| `ModifiedOn` | `pav:lastUpdatedOn` | Nearly exact | Naming differs. |
| `ModifiedBy` | `oslc:modifiedBy` | Exact | Direct mapping. |
| `Version` | `pav:version` | Exact | Direct mapping. |
| `Status` | `bibo:status` | Nearly exact | CTM 1.6.0 uses BIBO status values. |
| `ModelVersion` | `schema:schemaVersion` | Exact | Direct mapping. |
| `PreviousVersion` | `pav:previousVersion` | Exact | CTM 1.6.0 spec supports this. |
| `DerivedFrom` | `pav:derivedFrom` | Exact | Direct mapping. |

## Mapping of `Field`

### Current Model

A current `Field` consists conceptually of:

- artifact identity and metadata
- a strongly typed `FieldType`
- field-type-specific semantic properties
- typed rendering hints compatible with the `FieldType`

### CTM 1.6.0 Representation

A CTM 1.6.0 template field is a single object that combines:

- top-level metadata
- JSON Schema shape
- `_valueConstraints`
- `_ui`
- optional JSON-LD context and typing

### Mapping Rule

Map a current `Field` to a CTM 1.6.0 template field by:

1. mapping identity and metadata to top-level linked-data and metadata members
2. mapping the semantic `FieldType` into a CTM 1.6.0 `inputType` and associated `_valueConstraints`
3. mapping rendering hints into `_ui`
4. generating the JSON Schema envelope required by the CTM 1.6.0 environment

## Mapping of `EmbeddedField`

### Current Model

`EmbeddedField` contains:

- `EmbeddedArtifactKey`
- `FieldReference`
- optional `ValueRequirement`
- optional `Cardinality`
- optional `Visibility`
- optional embedding-specific `DefaultValue`
- optional `LabelOverride`

### CTM 1.6.0 Representation

The CTM 1.6.0 serialization does not isolate embedding-local properties as cleanly. Instead it uses:

- the containing template or template-element `properties`
- JSON Schema `required`
- JSON Schema array structure for repetition
- `_ui.hidden`
- template- or element-level `propertyLabels` and `propertyDescriptions`
- field-local `_valueConstraints.defaultValue`

### Mapping Rule

- `EmbeddedArtifactKey` maps to the JSON property name under the containing `properties` object
- `FieldReference` maps to either a nested schema fragment or a `$ref`
- `ValueRequirement` maps approximately to JSON Schema `required` and sometimes to CTM 1.6.0 `requiredValue`
- `Cardinality` maps approximately to `type: array`, `minItems`, and `maxItems`
- `Visibility` maps approximately to `_ui.hidden`
- `LabelOverride` maps approximately through CTM 1.6.0 `propertyLabels`
- embedding-specific default values are awkward because the CTM 1.6.0 format tends to place defaults on the field specification rather than the embedding

This mapping is approximate because the CTM 1.6.0 format does not clearly distinguish reusable field semantics from embedding-local properties.

## Mapping of `Template`

### Current Model

A current `Template` contains:

- identity and metadata
- an ordered sequence of `EmbeddedArtifact`
- optional `Header`
- optional `Footer`

### CTM 1.6.0 Representation

A CTM 1.6.0 template is represented as:

- a top-level artifact object
- JSON Schema object structure
- nested `properties`
- JSON Schema `required`
- JSON Schema arrays for repeated items
- instance requirements such as `schema:isBasedOn`
- optional `_ui.propertyLabels` and `_ui.propertyDescriptions`

### Mapping Rule

- template metadata maps directly to top-level CTM 1.6.0 metadata
- each `EmbeddedArtifact` maps to an entry in the template's `properties`
- nested templates or groups map to nested object-valued schema fragments or `$ref`
- repeated embedded artifacts map to JSON Schema array forms
- template-local labels and descriptions may need to use `_ui.propertyLabels` and `_ui.propertyDescriptions`

### Important Loss

The Structural Model uses explicit sequence order for embedded artifacts. The CTM 1.6.0 serialization represents structure primarily through JSON object properties and auxiliary UI metadata. That means explicit ordering is not represented as cleanly.

## Mapping of `TemplateInstance`

### Current Model

A `TemplateInstance` contains:

- a reference to the governing `Template`
- `InstanceValue`
- nested template-instance structure
- instance-level metadata where applicable

### CTM 1.6.0 Representation

The CTM 1.6.0 template instance format requires:

- `schema:isBasedOn`
- provenance fields
- JSON objects matching the template's JSON Schema shape
- field values expressed using `@value` or `@id`
- repeated values as arrays of those objects

### Mapping Rule

- `TemplateReference` maps to `schema:isBasedOn`
- instance fields map by `EmbeddedArtifactKey` to JSON properties
- nested template instances map to nested JSON objects
- multi-valued fields map to arrays of value objects

## Mapping of Instance Values

### Literal-Valued Fields

CTM 1.6.0 representation:

- `@value` for the lexical value
- optional `@type` for the datatype

Current mapping:

- `DatatypeIriLiteral` maps naturally to `{ "@value": ..., "@type": ... }`
- `LangStringLiteral` maps only approximately because the CTM 1.6.0 spec emphasizes `@value` and optional `@type`; language-tagged behavior is not modeled as explicitly as in the current spec

### Iri-Valued Fields

CTM 1.6.0 representation:

- `@id`
- optional `rdfs:label`
- optional `skos:notation`

Current mapping:

- `ControlledTermValue` maps reasonably well to `@id` plus `rdfs:label` and `skos:notation`
- `LinkValue` and `ExternalAuthorityValue` also map to `@id`-based structures if encoded as IRI-valued CTM 1.6.0 fields

### Multi-Valued Fields

CTM 1.6.0 representation:

- arrays of objects carrying `@value` or `@id`

Current mapping:

- repeated values under one `EmbeddedArtifactKey` map to JSON arrays
- repeated nested templates map to JSON arrays of nested objects

## Mapping of Field Types

### `TextFieldType`

Current model:

- `TextFieldType`
- optional `TextDefaultValue`
- optional `MinLength`
- optional `MaxLength`
- optional `ValidationRegex`
- optional `TextRenderingHint`

CTM 1.6.0 mapping:

- `_ui.inputType` identifies a text-oriented field widget such as `textfield`
- `_valueConstraints.minLength` and `_valueConstraints.maxLength` map directly
- `_valueConstraints.defaultValue` maps directly
- a validation regex maps approximately if the CTM 1.6.0 target supports the corresponding constraint form
- single-line versus multi-line behavior maps to `_ui`

### `SingleChoiceFieldType` and `MultipleChoiceFieldType`

Current model:

- semantic single-versus-multiple choice distinction
- typed rendering hints for radio buttons, checkboxes, or dropdowns

CTM 1.6.0 mapping:

- `_valueConstraints.multipleChoice` carries the semantic distinction
- choice option content maps to the CTM 1.6.0 choice/value-constraint structures
- widget style maps to `_ui.inputType`

This is a good example of the Structural Model being cleaner: the CTM 1.6.0 format places semantic multiplicity and rendering style in different informal buckets rather than in one strongly typed structure.

### `ControlledTermFieldType`

Current model:

- `OntologySource`
- `BranchSource`
- `ClassSource`
- `ValueSetSource`

CTM 1.6.0 mapping:

- ontology, branch, class, and value-set restrictions map into CTM 1.6.0 `_valueConstraints`

This mapping is mostly direct in intent, though the CTM 1.6.0 format is less strongly typed.

### `NumericFieldType`

Current model:

- numeric datatype and numeric semantic properties
- optional rendering hint

CTM 1.6.0 mapping:

- `_valueConstraints.numberType`
- `_valueConstraints.unitOfMeasure`
- `_valueConstraints.minValue`
- `_valueConstraints.maxValue`
- `_valueConstraints.decimalPlace`
- `_ui` for widget-level rendering

This is a relatively good mapping.

### Temporal Field Types

Temporal fields are the most important lossy area because the Structural Model separates semantics from presentation more rigorously than the CTM 1.6.0 format.

#### `DateFieldType`

Current model:

- `DateFieldType`
- required `DateValueType`
  - `YearValueType`
  - `YearMonthValueType`
  - `FullDateValueType`
- optional `DateRenderingHint`
- optional `DateFormat`

CTM 1.6.0 mapping:

- `_ui.inputType = temporal`
- `_valueConstraints.temporalType = xsd:date`
- `_ui.temporalGranularity = year | month | day`
- optional `_ui` date-format-like behavior where available

Mapping quality:

- approximate to lossy

Reason:

- the Structural Model expresses year, year-month, and full-date as strongly typed semantic distinctions
- the CTM 1.6.0 format represents these using the combination of `xsd:date` plus a UI-oriented granularity value

#### `TimeFieldType`

Current model:

- `TimeFieldType`
- optional `TimePrecision`
- optional `TimezoneEnabled`
- optional `TimeRenderingHint`

CTM 1.6.0 mapping:

- `_ui.inputType = temporal`
- `_valueConstraints.temporalType = xsd:time`
- `_ui.temporalGranularity = hour | minute | second | decimalSecond`
- `_ui.inputTimeFormat = 12h | 24h`
- `_ui.timeZoneEnabled = true | false`

Mapping quality:

- approximate

Reason:

- the Structural Model treats time precision as a model-level property and time format as presentation
- the CTM 1.6.0 format places both in `_ui`

#### `DateTimeFieldType`

Current model:

- `DateTimeFieldType`
- required `DateTimeValueType`
- optional `TimezoneEnabled`
- optional `DateTimeRenderingHint`

CTM 1.6.0 mapping:

- `_ui.inputType = temporal`
- `_valueConstraints.temporalType = xsd:dateTime`
- `_ui.temporalGranularity`
- `_ui.inputTimeFormat`
- `_ui.timeZoneEnabled`

Mapping quality:

- approximate

Reason:

- the Structural Model gives date-time precision a clearer semantic role than the CTM 1.6.0 format does
- the CTM 1.6.0 format again distributes that meaning across `_valueConstraints` and `_ui`

### `AttributeValueFieldType`

CTM 1.6.0 support for attribute-value fields is explicit.

CTM 1.6.0 mapping:

- `_ui.inputType = attribute-value`
- `_valueConstraints.requiredValue = false`
- the schema-level field value is an array of attribute names
- actual instance fields are introduced dynamically through `additionalProperties`

This mapping is necessarily specialized and only approximately aligned with the Structural Model because the CTM 1.6.0 serialization gives attribute-value fields unusual instance behavior.

## Presentation Components

The Structural Model has reusable `PresentationComponent` artifacts such as:

- rich text
- image
- YouTube video
- section break
- page break

The CTM 1.6.0 specification does not provide an equally clean reusable non-schema artifact family. Similar behavior is represented through template elements, UI structures, or ad hoc rendering information.

Mapping quality:

- lossy

This is one of the clearest places where the Structural Model is conceptually cleaner than the CTM 1.6.0 serialization.

## Exact, Approximate, And Lossy Areas

### Exact Or Nearly Exact

- artifact identity
- descriptive metadata
- provenance
- versioning
- JSON-LD identifier-based value representation
- numeric restrictions such as min/max/unit/type

### Approximate

- embedding-local requiredness
- embedding-local defaults
- embedding-local label override
- choice-field semantics versus widget selection
- controlled-term restriction structures
- time precision and date-time precision

### Lossy

- explicit separation of semantic structure from presentation
- explicit separation of reusable artifacts from embedding-local properties
- `PresentationComponent` as a reusable non-schema artifact family
- strongly typed date subkinds such as year versus year-month versus full date
- language-tagged literal structure

## Recommendation

This mapping should be treated as a compatibility mapping, not as a normative target.

The Structural Model should remain authoritative. The CTM 1.6.0 format should be treated as:

- a CTM 1.6.0 implementation format
- a migration target
- a compatibility layer

It should not be treated as a canonical serialization of the Structural Model.

## Next Useful Work

The next useful step is to define canonical CTM 1.6.0 encoding recipes for:

- each current `FieldType`
- `EmbeddedField` requiredness and multiplicity
- nested templates and repeated nested templates
- controlled-term fields
- temporal field refinements

That would turn this conceptual mapping into an operational compatibility guide.
