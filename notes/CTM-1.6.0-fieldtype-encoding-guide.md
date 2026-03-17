# CTM 1.6.0 FieldType Encoding Guide

## Purpose

This guide defines canonical rules for encoding the CEDAR Structural Model into the CTM 1.6.0 JSON representation described in `notes/CEDAR Template Model v1.6.0.md`.

The Structural Model remains authoritative. This guide is normative for the mapping direction from the Structural Model to CTM 1.6.0 JSON.

## Scope

This guide covers reusable `Field` artifacts. For each `FieldType`, it states:

- which Structural Model constructs are relevant
- how each construct is encoded in CTM 1.6.0 JSON
- which CTM 1.6.0 JSON keys must be populated
- where the mapping is exact, approximate, or lossy

This guide does not yet define the full CTM 1.6.0 encoding of:

- `EmbeddedField`
- `EmbeddedTemplate`
- template-local requiredness
- template-local multiplicity
- template-local label override

Those require a companion guide for embedding and template composition.

## Common CTM 1.6.0 Field Envelope

Encode every reusable `Field` as a CTM 1.6.0 template-field object with these layers:

1. artifact identity and metadata
2. JSON Schema envelope
3. field value shape
4. `_valueConstraints`
5. `_ui`

A typical CTM 1.6.0 field object therefore has this shape:

```json
{
  "@id": "https://repo.metadatacenter.org/template-fields/...",
  "@type": "https://schema.metadatacenter.org/core/TemplateField",
  "schema:identifier": "...",
  "schema:name": "...",
  "schema:description": "...",
  "pav:version": "1.0.0",
  "bibo:status": "bibo:draft",
  "schema:schemaVersion": "1.6.0",
  "pav:createdOn": "...",
  "pav:createdBy": "...",
  "pav:lastUpdatedOn": "...",
  "oslc:modifiedBy": "...",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "title": "Field(...)",
  "description": "...",
  "properties": { ... },
  "required": [ ... ],
  "additionalProperties": false,
  "_valueConstraints": { ... },
  "_ui": { ... },
  "@context": { ... }
}
```

## Global Encoding Rules

### Identity And Metadata

Apply these rules for every reusable `Field`:

- if the Structural Model contains `FieldId`, encode it as `@id`
- if the Structural Model contains `Identifier`, encode it as `schema:identifier`
- if the Structural Model contains `Name`, encode it as `schema:name`
- if the Structural Model contains `Description`, encode it as `schema:description`
- if the Structural Model contains `Version`, encode it as `pav:version`
- if the Structural Model contains `Status`, encode it as `bibo:status`
- if the Structural Model contains `ModelVersion`, encode it as `schema:schemaVersion`
- if the Structural Model contains `CreatedOn`, encode it as `pav:createdOn`
- if the Structural Model contains `CreatedBy`, encode it as `pav:createdBy`
- if the Structural Model contains `ModifiedOn`, encode it as `pav:lastUpdatedOn`
- if the Structural Model contains `ModifiedBy`, encode it as `oslc:modifiedBy`

### Semantic And Presentational Information

Apply these rules unless a field-type-specific section states otherwise:

- if the Structural Model contains semantic `FieldType` information, encode it in `_valueConstraints`
- if the Structural Model contains rendering hints, encode them in `_ui`

CTM 1.6.0 does not follow this separation cleanly for all field types, especially temporal fields. When CTM 1.6.0 places semantically important information in `_ui`, this guide states that explicitly.

### Value Shape

Apply these rules to the JSON Schema layer:

- if the Structural Model field is literal-valued, encode the value shape using `properties.@value`
- if the Structural Model field is IRI-valued, encode the value shape using `properties.@id`
- if the Structural Model field permits repeated values, encode the value shape using `type: array` and `items`

### Requiredness

Use this rule carefully:

- if the Structural Model itself assigns value-requiredness to the reusable field, encode that as `_valueConstraints.requiredValue`

This is only a partial rule because the Structural Model primarily places requiredness on `EmbeddedField`, not on reusable `Field`. Therefore:

- do not infer `_valueConstraints.requiredValue` from the Structural Model unless the source information actually assigns requiredness to the field itself
- when requiredness comes from embedding, it must be handled by the CTM 1.6.0 encoding of the containing template or template element

### Multiplicity

Use this rule carefully:

- if the Structural Model field type itself requires repeated values, encode the value shape using `type: array`, `items`, and relevant item-count constraints
- if CTM 1.6.0 expects a `multipleChoice` flag for that field family, encode the semantic distinction using `_valueConstraints.multipleChoice`

As with requiredness, template-local multiplicity belongs to embedding and must not be invented at the reusable field level.

## Canonical FieldType Sections

Each field type section uses the same structure:

1. `Structural Model`
2. `CTM 1.6.0 Encoding Rules`
3. `Mapping Summary`
4. `CTM 1.6.0 Keys`
5. `Canonical CTM 1.6.0 Shape`
6. `Examples`
7. `Mapping Notes`
8. `Known Gaps / Lossiness`

## `TextFieldType`

### Structural Model

| Structural aspect | Form |
| --- | --- |
| Field type | `TextFieldType` |
| Default value | optional `TextDefaultValue` |
| Minimum length | optional `MinLength` |
| Maximum length | optional `MaxLength` |
| Validation regex | optional `ValidationRegex` |
| Rendering hint | optional `TextRenderingHint` |

### CTM 1.6.0 Encoding Rules

Apply these rules:

- if the Structural Model contains `TextFieldType`, encode the field as a literal-valued CTM 1.6.0 field using `properties.@value`
- if the Structural Model contains a single-line text rendering hint, encode `_ui.inputType = "textfield"`
- if the Structural Model contains a multi-line text rendering hint, encode `_ui.inputType = "textarea"`
- if the Structural Model contains `TextDefaultValue`, encode it as `_valueConstraints.defaultValue`
- if the Structural Model contains `MinLength`, encode it as `_valueConstraints.minLength`
- if the Structural Model contains `MaxLength`, encode it as `_valueConstraints.maxLength`
- if the Structural Model contains `ValidationRegex`, encode it as `_valueConstraints.regex`

### Mapping Summary

| Aspect | Structural Model | CTM 1.6.0 Encoding |
| --- | --- | --- |
| Semantic type | `TextFieldType` | text field encoded with `_ui.inputType = textfield | textarea` |
| Value form | `TextValue` | object with `@value` |
| Default value | `TextDefaultValue` | `_valueConstraints.defaultValue` |
| Minimum length | `MinLength` | `_valueConstraints.minLength` |
| Maximum length | `MaxLength` | `_valueConstraints.maxLength` |
| Regex constraint | `ValidationRegex` | `_valueConstraints.regex` |
| Rendering | `TextRenderingHint` | `_ui.inputType` |

### CTM 1.6.0 Keys

- `properties.@value`
- `_ui.inputType`
- `_valueConstraints.defaultValue`
- `_valueConstraints.minLength`
- `_valueConstraints.maxLength`
- `_valueConstraints.regex`

### Canonical CTM 1.6.0 Shape

```json
{
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "minLength": 3,
    "maxLength": 120,
    "defaultValue": "Unknown"
  },
  "_ui": {
    "inputType": "textfield"
  }
}
```

### Examples

#### Minimal Single-Line Text Field

Structural Model input:

- `TextFieldType`
- single-line text rendering hint

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "study_title",
  "schema:name": "Study Title",
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_ui": {
    "inputType": "textfield"
  }
}
```

#### Constrained Single-Line Text Field

Structural Model input:

- `TextFieldType`
- `MinLength = 3`
- `MaxLength = 120`
- single-line text rendering hint

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "study_title",
  "schema:name": "Study Title",
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "minLength": 3,
    "maxLength": 120
  },
  "_ui": {
    "inputType": "textfield"
  }
}
```

#### Text Field With Validation Regex

Structural Model input:

- `TextFieldType`
- `TextDefaultValue = ""`
- `ValidationRegex = "[A-Za-z]+"`
- single-line text rendering hint

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "funder_name",
  "schema:name": "Funder Name",
  "type": "object",
  "properties": {
    "@value": { "type": ["string", "null"] },
    "rdfs:label": { "type": ["string", "null"] }
  },
  "additionalProperties": false,
  "_valueConstraints": {
    "defaultValue": "",
    "regex": "[A-Za-z]+"
  },
  "_ui": {
    "inputType": "textfield"
  }
}
```

### Mapping Notes

- `ValidationRegex` is not described in the published CTM 1.6.0 model text, but deployed CTM 1.6.0 artifacts may still use `_valueConstraints.regex`.
- this guide therefore treats `_valueConstraints.regex` as a CTM 1.6.0-compatible implementation extension

### Known Gaps / Lossiness

- language-tagged text is not modeled cleanly in the CTM 1.6.0 field specification pattern
- regex support is implementation-defined rather than normatively documented in the published CTM 1.6.0 model text

## `NumericFieldType`

### Structural Model

| Structural aspect | Form |
| --- | --- |
| Field type | `NumericFieldType` |
| Numeric datatype | numeric datatype information |
| Minimum numeric value | optional minimum numeric value |
| Maximum numeric value | optional maximum numeric value |
| Unit | optional unit information |
| Rendering hint | optional numeric rendering hints |

### CTM 1.6.0 Encoding Rules

Apply these rules:

- if the Structural Model contains `NumericFieldType`, encode the field as a literal-valued CTM 1.6.0 field using `properties.@value`
- encode `_ui.inputType = "numeric"`
- if the Structural Model contains a numeric datatype, encode it as `_valueConstraints.numberType`
- if the Structural Model contains a numeric unit, encode it as `_valueConstraints.unitOfMeasure`
- if the Structural Model contains a minimum numeric value, encode it as `_valueConstraints.minValue`
- if the Structural Model contains a maximum numeric value, encode it as `_valueConstraints.maxValue`
- if the Structural Model contains CTM 1.6.0-compatible displayed decimal precision, encode it as `_valueConstraints.decimalPlaces`

### Mapping Summary

| Aspect | Structural Model | CTM 1.6.0 Encoding |
| --- | --- | --- |
| Semantic type | `NumericFieldType` | numeric field encoded with `_ui.inputType = numeric` |
| Value form | `NumericValue` | object with `@value` |
| Numeric datatype | numeric datatype property | `_valueConstraints.numberType` |
| Unit | unit property | `_valueConstraints.unitOfMeasure` |
| Minimum numeric value | minimum numeric value | `_valueConstraints.minValue` |
| Maximum numeric value | maximum numeric value | `_valueConstraints.maxValue` |
| Decimal display precision | numeric display precision | `_valueConstraints.decimalPlaces` |
| Rendering | numeric rendering hint | `_ui.inputType` |

### CTM 1.6.0 Keys

- `properties.@value`
- `_ui.inputType`
- `_valueConstraints.numberType`
- `_valueConstraints.unitOfMeasure`
- `_valueConstraints.minValue`
- `_valueConstraints.maxValue`
- `_valueConstraints.decimalPlaces`

### Canonical CTM 1.6.0 Shape

```json
{
  "type": "object",
  "properties": {
    "@value": { "type": ["number", "null"] }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "numberType": "xsd:decimal",
    "unitOfMeasure": "kg",
    "minValue": 0,
    "maxValue": 100,
    "decimalPlaces": 2
  },
  "_ui": {
    "inputType": "numeric"
  }
}
```

### Examples

#### Decimal Quantity Field

Structural Model input:

- `NumericFieldType`
- numeric datatype `xsd:decimal`
- minimum numeric value `0`
- maximum numeric value `100`
- unit `kg`

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "specimen_weight",
  "schema:name": "Specimen Weight",
  "type": "object",
  "properties": {
    "@value": { "type": ["number", "null"] }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "numberType": "xsd:decimal",
    "unitOfMeasure": "kg",
    "minValue": 0,
    "maxValue": 100,
    "decimalPlaces": 2
  },
  "_ui": {
    "inputType": "numeric"
  }
}
```

### Mapping Notes

- numeric datatype, bounds, and units map well to CTM 1.6.0

### Known Gaps / Lossiness

- the published CTM 1.6.0 specification does not clearly distinguish semantic numeric precision from display precision

## `SingleChoiceFieldType`

### Structural Model

| Structural aspect | Form |
| --- | --- |
| Field type | `SingleChoiceFieldType` |
| Rendering hint | typed single-choice rendering hint |
| Value form | literal or ontology-backed choice values |

### CTM 1.6.0 Encoding Rules

Apply these rules:

- if the Structural Model contains `SingleChoiceFieldType`, encode `_valueConstraints.multipleChoice = false`
- if the Structural Model represents literal choice values, encode the field as a literal-valued CTM 1.6.0 field using `properties.@value`
- if the Structural Model represents ontology-backed choice values, encode the field as an IRI-valued CTM 1.6.0 field using `properties.@id` together with controlled-term constraint members
- if the Structural Model contains a radio-button rendering hint, encode `_ui.inputType = "radio"`
- if the Structural Model contains a single-select dropdown rendering hint, encode `_ui.inputType = "list"`

### Mapping Summary

| Aspect | Structural Model | CTM 1.6.0 Encoding |
| --- | --- | --- |
| Semantic type | `SingleChoiceFieldType` | `_valueConstraints.multipleChoice = false` |
| Value form | `ChoiceValue` | object with `@value` or `@id` |
| Choice options | literal or ontology-backed option set | `_valueConstraints.literals` or controlled-term constraint members |
| Rendering | single-choice rendering hint | `_ui.inputType = radio | list` |

### CTM 1.6.0 Keys

- `_valueConstraints.multipleChoice`
- `_valueConstraints.literals` or controlled-term constraint members
- `_ui.inputType`
- `properties.@value` or `properties.@id`

### Canonical CTM 1.6.0 Shape

```json
{
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "multipleChoice": false,
    "literals": [
      { "label": "A" },
      { "label": "B" }
    ]
  },
  "_ui": {
    "inputType": "radio"
  }
}
```

### Examples

#### Single Choice With Radio Buttons

Structural Model input:

- `SingleChoiceFieldType`
- radio-button rendering hint
- literal options `Phase 1`, `Phase 2`, `Phase 3`

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "study_phase",
  "schema:name": "Study Phase",
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "multipleChoice": false,
    "literals": [
      { "label": "Phase 1" },
      { "label": "Phase 2" },
      { "label": "Phase 3" }
    ]
  },
  "_ui": {
    "inputType": "radio"
  }
}
```

#### Single Choice With Dropdown Rendering

Structural Model input:

- `SingleChoiceFieldType`
- single-select dropdown rendering hint
- literal options `Phase 1`, `Phase 2`, `Phase 3`

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "study_phase",
  "schema:name": "Study Phase",
  "type": "object",
  "properties": {
    "@value": { "type": "string" }
  },
  "required": ["@value"],
  "additionalProperties": false,
  "_valueConstraints": {
    "multipleChoice": false,
    "literals": [
      { "label": "Phase 1" },
      { "label": "Phase 2" },
      { "label": "Phase 3" }
    ]
  },
  "_ui": {
    "inputType": "list"
  }
}
```

### Mapping Notes

- semantic single choice maps reasonably well through `_valueConstraints.multipleChoice = false`
- rendering maps reasonably well through `radio` and `list`

### Known Gaps / Lossiness

- CTM 1.6.0 does not structurally enforce that single-choice semantics must be paired only with single-choice widgets

## `MultipleChoiceFieldType`

### Structural Model

| Structural aspect | Form |
| --- | --- |
| Field type | `MultipleChoiceFieldType` |
| Rendering hint | typed multiple-choice rendering hint |
| Value form | literal or ontology-backed choice values |

### CTM 1.6.0 Encoding Rules

Apply these rules:

- if the Structural Model contains `MultipleChoiceFieldType`, encode `_valueConstraints.multipleChoice = true`
- encode the field as a repeated-value CTM 1.6.0 field using `type: array` and `items`
- if the Structural Model represents literal choice values, encode array items using `properties.@value`
- if the Structural Model represents ontology-backed choice values, encode array items using `properties.@id` together with controlled-term constraint members
- if the Structural Model contains a checkbox rendering hint, encode `_ui.inputType = "checkbox"`
- if the Structural Model contains a multi-select dropdown rendering hint, encode `_ui.inputType = "list"`

### Mapping Summary

| Aspect | Structural Model | CTM 1.6.0 Encoding |
| --- | --- | --- |
| Semantic type | `MultipleChoiceFieldType` | `_valueConstraints.multipleChoice = true` |
| Value form | repeated `ChoiceValue` | array of objects with `@value` or `@id` |
| Choice options | literal or ontology-backed option set | `_valueConstraints.literals` or controlled-term constraint members |
| Multiplicity | repeated values | `type: array`, `items`, `minItems`, `maxItems` |
| Rendering | multiple-choice rendering hint | `_ui.inputType = checkbox | list` |

### CTM 1.6.0 Keys

- `_valueConstraints.multipleChoice`
- `_valueConstraints.literals` or controlled-term constraint members
- `_ui.inputType`
- `type: array`
- `items`
- `minItems`
- `maxItems`

### Canonical CTM 1.6.0 Shape

```json
{
  "type": "array",
  "minItems": 0,
  "items": {
    "type": "object",
    "properties": {
      "@value": { "type": "string" }
    },
    "required": ["@value"],
    "additionalProperties": false
  },
  "_valueConstraints": {
    "multipleChoice": true,
    "literals": [
      { "label": "A" },
      { "label": "B" }
    ]
  },
  "_ui": {
    "inputType": "checkbox"
  }
}
```

### Examples

#### Multiple Choice With Checkboxes

Structural Model input:

- `MultipleChoiceFieldType`
- checkbox rendering hint
- literal options `MRI`, `CT`, `PET`

CTM 1.6.0 encoding:

```json
{
  "schema:identifier": "available_modalities",
  "schema:name": "Available Modalities",
  "type": "array",
  "minItems": 0,
  "items": {
    "type": "object",
    "properties": {
      "@value": { "type": "string" }
    },
    "required": ["@value"],
    "additionalProperties": false
  },
  "_valueConstraints": {
    "multipleChoice": true,
    "literals": [
      { "label": "MRI" },
      { "label": "CT" },
      { "label": "PET" }
    ]
  },
  "_ui": {
    "inputType": "checkbox"
  }
}
```

### Mapping Notes

- semantic multiple choice maps reasonably well through `_valueConstraints.multipleChoice = true`
- repeated selected values should be encoded as arrays of value objects

### Known Gaps / Lossiness

- the compatible pairing between multiple-choice semantics and widget choice is conventional rather than structurally enforced
- the published CTM 1.6.0 specification is less explicit about multi-select dropdown behavior than checkbox behavior

## Remaining Field Types

The next pass should cover:

- `ControlledTermFieldType`
- `DateFieldType`
- `TimeFieldType`
- `DateTimeFieldType`
- `LinkFieldType`
- `ContactFieldType`
- `ExternalAuthorityFieldType`
- `AttributeValueFieldType`

These require more care because the published CTM 1.6.0 specification is less uniform for them, especially for temporal and attribute-value fields.
