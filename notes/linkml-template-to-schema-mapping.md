# Mapping a CEDAR Template to a LinkML Schema

This document specifies the rules for deriving a LinkML schema document from a
CEDAR template definition. The derived schema describes what conforming instance
data looks like for that specific template — it is the Level 2 schema described
in `notes/linkml-two-level-schema.md`.

The mapping is deterministic: given a template definition (a value of type
`Template` conforming to `spec/grammar.linkml.yaml`), exactly one canonical
LinkML schema is produced. The schema is intended to be consumed by LinkML
generators to produce JSON Schema, JSON-LD context, Python/TypeScript classes,
SHACL shapes, and Markdown documentation.

---

## Inputs and outputs

| Item | Description |
|---|---|
| **Input** | A `Template` value conforming to `spec/grammar.linkml.yaml`, together with the `Field` definitions for every `EmbeddedField` it references |
| **Output** | A LinkML YAML schema that validates and annotates conforming `TemplateInstance` documents for that template |

The output schema imports `spec/grammar.linkml.yaml` to reuse shared value
classes (`ControlledTermValue`, `TextValue`, `OrcidValue`, etc.) rather than
redefining them.

---

## Schema-level properties

The top-level properties of the generated schema are derived from the template's
own metadata.

| Source | Generated property |
|---|---|
| `artifact_iri` of the `Template` | `id:` (append `/schema` to the template IRI) |
| `schema_name` in `DescriptiveMetadata` | `name:` (converted to a valid identifier) and `title:` |
| `schema_description` in `DescriptiveMetadata` | `description:` |
| `pav_version` | `version:` |
| Semantic property prefixes needed | Added to `prefixes:` |

The schema always declares:
```yaml
imports:
  - linkml:types
  - https://metadatacenter.org/cedar-model   # shared value classes
```

---

## Root class

Each template maps to exactly one LinkML class marked `tree_root: true`. This
class is the entry point for instances.

```
Template with schema_name "Study Metadata Form"
  → class StudyMetadataForm: tree_root: true
```

The class name is derived from `schema_name` by converting to `UpperCamelCase`
and removing non-alphanumeric characters.

Each `EmbeddedArtifact` in the template's `embedded_artifacts` list that is **not**
an `EmbeddedPresentationComponent` generates a slot reference on this class.
Presentation components are omitted entirely — they contribute no instance data.

---

## Slot name

For every `EmbeddedField` or `EmbeddedTemplate`, the slot name is the
`EmbeddedArtifactKey` value directly.

```
embedded_artifact_key: study_title  →  slot name: study_title
```

`EmbeddedArtifactKey` values are already valid LinkML identifiers (ASCII,
starting with a letter, no spaces), so no transformation is needed.

---

## Slot range

The slot range is determined by the `FieldSpec` carried by the referenced
`Field`. The field must be resolved via its IRI to read its `FieldSpec`.

| `EmbeddedField` variant | `FieldSpec` carried by the referenced `Field` | Slot `range:` |
|---|---|---|
| `EmbeddedTextField` | `TextFieldSpec` | `string` (plain) or `TextValue` (if language tags required) |
| `EmbeddedNumericField` | `NumericFieldSpec` | Derived from `numeric_datatype` (see below) |
| `EmbeddedDateField` | `DateFieldSpec` | Derived from `date_value_type` (see below) |
| `EmbeddedTimeField` | `TimeFieldSpec` | `time` |
| `EmbeddedDateTimeField` | `DateTimeFieldSpec` | `datetime` |
| `EmbeddedControlledTermField` | `ControlledTermFieldSpec` | `ControlledTermValue` |
| `EmbeddedSingleChoiceField` | `LiteralSingleChoiceFieldSpec` | `<EnumName>` (generated enum, see below) |
| `EmbeddedSingleChoiceField` | `ControlledTermSingleChoiceFieldSpec` | `ControlledTermValue` |
| `EmbeddedMultipleChoiceField` | `LiteralMultipleChoiceFieldSpec` | `<EnumName>` (generated enum, see below) |
| `EmbeddedMultipleChoiceField` | `ControlledTermMultipleChoiceFieldSpec` | `ControlledTermValue` |
| `EmbeddedLinkField` | `LinkFieldSpec` | `LinkValue` |
| `EmbeddedEmailField` | `EmailFieldSpec` | `string` |
| `EmbeddedPhoneNumberField` | `PhoneNumberFieldSpec` | `string` |
| `EmbeddedOrcidField` | `OrcidFieldSpec` | `OrcidValue` |
| `EmbeddedRorField` | `RorFieldSpec` | `RorValue` |
| `EmbeddedDoiField` | `DoiFieldSpec` | `DoiValue` |
| `EmbeddedPubMedIdField` | `PubMedIdFieldSpec` | `PubMedIdValue` |
| `EmbeddedRridField` | `RridFieldSpec` | `RridValue` |
| `EmbeddedNihGrantIdField` | `NihGrantIdFieldSpec` | `NihGrantIdValue` |
| `EmbeddedAttributeValueField` | `AttributeValueFieldSpec` | `AttributeValue` |
| `EmbeddedTemplate` | — | `<NestedClassName>` (generated class, see below) |

### Numeric range refinement

The `NumericFieldSpec` carries a `numeric_datatype` IRI (an XML Schema
datatype). The slot range is set to the closest LinkML built-in type:

| `numeric_datatype` IRI | Slot `range:` |
|---|---|
| `xsd:integer` | `integer` |
| `xsd:long` | `integer` |
| `xsd:decimal` | `decimal` |
| `xsd:float` | `float` |
| `xsd:double` | `double` |
| Any other XSD numeric type | `decimal` (conservative fallback) |

### Date range refinement

The `DateFieldSpec` carries a `date_value_type` that expresses intended
precision:

| `date_value_type` | Slot `range:` | Notes |
|---|---|---|
| `FullDateValueType` | `date` | ISO 8601 full date; LinkML built-in |
| `YearMonthValueType` | `string` | ISO 8601 year-month (YYYY-MM); no built-in type |
| `YearValueType` | `string` | ISO 8601 year (YYYY); no built-in type |

For `YearMonthValueType` and `YearValueType`, add a `pattern:` annotation to
constrain the lexical form:

| `date_value_type` | `pattern:` |
|---|---|
| `YearMonthValueType` | `^\d{4}-(0[1-9]\|1[0-2])$` |
| `YearValueType` | `^\d{4}$` |

---

## Cardinality

`Cardinality` and `multivalued` are derived as follows.

When `Cardinality` is **absent** from the `EmbeddedArtifact`, the grammar
specifies a default of exactly one value: min=1, max=1. In LinkML this is
`multivalued: false` (or omit `multivalued`, since false is the default) with
no explicit cardinality annotations needed.

When `Cardinality` is **present**:

| CEDAR `Cardinality` | LinkML annotations |
|---|---|
| `cardinality(min_cardinality(n), max_cardinality(1))` | `multivalued: false`; `minimum_cardinality: n` (if n ≠ 1) |
| `cardinality(min_cardinality(n), max_cardinality(m))` where m > 1 | `multivalued: true`; `minimum_cardinality: n`; `maximum_cardinality: m` |
| `cardinality(min_cardinality(n), max_cardinality(unbounded_cardinality()))` | `multivalued: true`; `minimum_cardinality: n`; (no `maximum_cardinality`) |
| `cardinality(min_cardinality(0), ...)` | As above; `minimum_cardinality: 0` makes the slot truly optional at the count level |

Omit `minimum_cardinality: 1` when it equals the LinkML default (1 for
required slots, 0 for non-required slots) to keep generated schemas concise.

`EmbeddedMultipleChoiceField` always implies `multivalued: true` regardless of
any explicit `Cardinality`, because the field spec itself permits multiple
simultaneous selections.

`EmbeddedAttributeValueField` always implies `multivalued: true` because an
`AttributeValueField` holds zero or more named attribute–value pairs.

---

## Value requirement

| CEDAR `ValueRequirement` | LinkML annotation |
|---|---|
| `Required` | `required: true` |
| `Recommended` | `recommended: true` |
| `Optional` (or absent) | (neither annotation; LinkML default is optional) |

---

## Semantic property URI

When an `EmbeddedField` or `EmbeddedTemplate` carries a `Property`
(i.e. an `EmbeddingProperty` with a `property_iri`), that IRI is emitted as
`slot_uri:` on the generated slot.

```
Property(property_iri(<http://purl.obolibrary.org/obo/OBI_0100026>))
  → slot_uri: obi:0100026
```

The prefix must be added to the schema's `prefixes:` block. If the IRI cannot
be abbreviated using a known prefix, emit the full IRI as the `slot_uri:` value.

When no `Property` is present on the embedding, no `slot_uri:` is emitted; the
slot has no semantic IRI annotation in this template context.

---

## Label override

When `LabelOverride` is present on an `EmbeddedArtifact`, its string value is
emitted as `title:` on the generated slot. When absent, the slot carries no
`title:` (consumers fall back to the slot name).

---

## Enum generation for literal choice fields

When a `SingleChoiceField` or `MultipleChoiceField` references a field whose
`FieldSpec` is `LiteralSingleChoiceFieldSpec` or `LiteralMultipleChoiceFieldSpec`,
the options are literal values that map cleanly to a LinkML `enum`.

### Enum name

The enum name is derived from the slot name by converting to `UpperCamelCase`
and appending `Options`:

```
slot name: study_type  →  enum name: StudyTypeOptions
```

### Enum values

Each `LiteralChoiceOption` in the spec's option list contributes one
`permissible_value`. The key is the lexical form of the option's `Literal`:

```yaml
enums:
  StudyTypeOptions:
    permissible_values:
      Interventional: {}
      Observational: {}
      ExpandedAccess: {}
```

If two options have identical lexical forms (which is a structural error in the
template), the generator SHOULD report a conflict and use the first occurrence.

### Controlled-term choice fields

`ControlledTermSingleChoiceFieldSpec` and `ControlledTermMultipleChoiceFieldSpec`
declare options as `ControlledTermChoiceOption` values, each holding a
`ControlledTermValue`. LinkML enums are string-keyed and cannot natively
represent OBO/SKOS term objects, so no `enum` is generated. Instead:

- The slot range is `ControlledTermValue` (imported from the metamodel schema).
- The permitted term IRIs are recorded as `todos:` or `comments:` annotations on
  the slot for informational purposes.

If SHACL output is required and the permitted term set is closed, the SHACL
generator post-processor SHOULD add a `sh:in` constraint listing the permitted
`ControlledTermValue.term_iri` values.

---

## Nested template classes

`EmbeddedTemplate` entries generate a nested LinkML class by recursively
applying this mapping to the referenced `Template`.

```
EmbeddedTemplate with key study_arm referencing Template "Study Arm"
  → class StudyArmForm (generated by recursive application of this mapping)
  → slot study_arm: range: StudyArmForm; multivalued: true (if cardinality allows)
```

The nested class is placed in the same schema document (not a separate file)
unless the nested template is shared across multiple parent templates, in which
case a separate schema document and import is preferred.

The nested class is **not** marked `tree_root: true`.

---

## Complete mapping summary

```
map_template(T) → LinkML schema S where:

  S.id           = T.artifact_iri + "/schema"
  S.name         = to_identifier(T.schema_name)
  S.title        = T.schema_name
  S.description  = T.schema_description
  S.version      = T.pav_version  (if present)
  S.imports      = [linkml:types, https://metadatacenter.org/cedar-model]
  S.prefixes     = collect_prefixes(T)

  S.classes[root] = {
    name:       to_class_name(T.schema_name),
    tree_root:  true,
    slots:      [key for each non-presentation EmbeddedArtifact in T]
  }

  for each EmbeddedArtifact A in T.embedded_artifacts:
    if A is EmbeddedPresentationComponent:
      skip
    else if A is EmbeddedTemplate:
      S.slots[A.key]   = map_embedded_template_slot(A)
      S.classes        += map_template(resolve(A.template_reference))  # recursive
    else:  # EmbeddedField
      F                = resolve(A.field_reference)
      S.slots[A.key]   = map_slot(A, F)
      if F.field_spec is LiteralSingleChoiceFieldSpec
      or F.field_spec is LiteralMultipleChoiceFieldSpec:
        S.enums[enum_name(A.key)] = map_enum(F.field_spec)

map_slot(A, F):
  slot.range      = range_for_spec(F.field_spec)
  slot.multivalued= multivalued_for(A.cardinality, F.field_spec)
  slot.required   = (A.value_requirement == Required)
  slot.recommended= (A.value_requirement == Recommended)
  slot.slot_uri   = A.property.property_iri  (if Property present)
  slot.title      = A.label_override.value   (if LabelOverride present)
  + cardinality annotations from map_cardinality(A.cardinality)
```

---

## Worked example

### Template definition (grammar notation)

```
Template(
  template_id(<https://repo.metadatacenter.org/templates/biosample-form>)
  SchemaArtifactMetadata(
    DescriptiveMetadata(
      SchemaName("BioSample Submission Form")
      SchemaDescription("Captures core BioSample metadata for NCBI submission.")
    )
    SchemaVersioning(
      SchemaVersion("https://json-schema.org/draft/2019-09/schema")
      PavVersion("1.0.0")
      BiboStatus("bibo:published")
    )
  )

  EmbeddedTextField(
    EmbeddedArtifactKey("sample_name")
    TextFieldReference(TextFieldId(<https://repo.metadatacenter.org/fields/sample-name>))
    Required
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/NCIT_C164388>)
    )
  )

  EmbeddedTextField(
    EmbeddedArtifactKey("description")
    TextFieldReference(TextFieldId(<https://repo.metadatacenter.org/fields/description>))
    Optional
    Cardinality(MinCardinality(0) MaxCardinality(1))
  )

  EmbeddedControlledTermField(
    EmbeddedArtifactKey("organism")
    ControlledTermFieldReference(ControlledTermFieldId(<https://repo.metadatacenter.org/fields/organism>))
    Required
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/OBI_0100026>)
    )
  )

  EmbeddedSingleChoiceField(
    EmbeddedArtifactKey("tissue_type")
    SingleChoiceFieldReference(SingleChoiceFieldId(<https://repo.metadatacenter.org/fields/tissue-type>))
    Required
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/UBERON_0000479>)
    )
  )

  EmbeddedNumericField(
    EmbeddedArtifactKey("age_at_collection")
    NumericFieldReference(NumericFieldId(<https://repo.metadatacenter.org/fields/age>))
    Optional
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/NCIT_C25150>)
    )
  )

  EmbeddedDateField(
    EmbeddedArtifactKey("collection_date")
    DateFieldReference(DateFieldId(<https://repo.metadatacenter.org/fields/collection-date>))
    Optional
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/OBI_0001619>)
    )
  )

  EmbeddedTemplate(
    EmbeddedArtifactKey("treatment")
    TemplateReference(TemplateId(<https://repo.metadatacenter.org/templates/treatment-form>))
    Optional
    Cardinality(MinCardinality(0) MaxCardinality(UnboundedCardinality()))
    Property(
      PropertyIri(<http://purl.obolibrary.org/obo/OBI_0000070>)
    )
  )
)
```

The referenced `tissue_type` field carries a `LiteralSingleChoiceFieldSpec`
with options `Blood`, `Liver`, `Lung`, `Kidney`.

The referenced `age_at_collection` field carries a `NumericFieldSpec` with
`numeric_datatype` = `xsd:decimal`.

The referenced `collection_date` field carries a `DateFieldSpec` with
`date_value_type` = `FullDateValueType`.

The nested `treatment` template has fields `treatment_name` (text, required)
and `treatment_dose` (numeric, optional).

---

### Generated LinkML schema

```yaml
id: https://repo.metadatacenter.org/templates/biosample-form/schema
name: biosample-submission-form
title: BioSample Submission Form
description: Captures core BioSample metadata for NCBI submission.
version: "1.0.0"

prefixes:
  linkml:  https://w3id.org/linkml/
  cedar:   https://metadatacenter.org/cedar-model/
  ncit:    http://purl.obolibrary.org/obo/NCIT_
  obi:     http://purl.obolibrary.org/obo/OBI_
  uberon:  http://purl.obolibrary.org/obo/UBERON_

default_prefix: https://repo.metadatacenter.org/templates/biosample-form/schema/
imports:
  - linkml:types
  - https://metadatacenter.org/cedar-model

# ── Enumerations ────────────────────────────────────────────────────────────

enums:

  TissueTypeOptions:
    # Generated from LiteralSingleChoiceFieldSpec on the referenced field
    permissible_values:
      Blood: {}
      Liver: {}
      Lung: {}
      Kidney: {}

# ── Classes ──────────────────────────────────────────────────────────────────

classes:

  BioSampleSubmissionForm:
    tree_root: true
    description: Captures core BioSample metadata for NCBI submission.
    slots:
      - sample_name
      - description
      - organism
      - tissue_type
      - age_at_collection
      - collection_date
      - treatment

  TreatmentForm:
    # Generated by recursive application of the mapping to the nested template
    description: Data for a single treatment event.
    slots:
      - treatment_name
      - treatment_dose

# ── Slots ─────────────────────────────────────────────────────────────────────

slots:

  sample_name:
    range: string
    required: true
    slot_uri: ncit:C164388
    # EmbeddedTextField, Required, Property → slot_uri

  description:
    range: string
    # EmbeddedTextField, Optional, no Property

  organism:
    range: ControlledTermValue
    required: true
    slot_uri: obi:0100026
    # EmbeddedControlledTermField, Required, Property → slot_uri

  tissue_type:
    range: TissueTypeOptions
    required: true
    slot_uri: uberon:0000479
    # EmbeddedSingleChoiceField → enum range; LiteralSingleChoiceFieldSpec → TissueTypeOptions

  age_at_collection:
    range: decimal
    slot_uri: ncit:C25150
    # EmbeddedNumericField, Optional; numeric_datatype xsd:decimal → range: decimal

  collection_date:
    range: date
    slot_uri: obi:0001619
    # EmbeddedDateField, Optional; date_value_type FullDateValueType → range: date

  treatment:
    range: TreatmentForm
    multivalued: true
    minimum_cardinality: 0
    slot_uri: obi:0000070
    inlined_as_list: true
    # EmbeddedTemplate; Cardinality(0, unbounded) → multivalued: true, minimum_cardinality: 0

  # ── Slots for the nested TreatmentForm class ──

  treatment_name:
    range: string
    required: true

  treatment_dose:
    range: decimal
```

---

### Conforming instance (YAML)

```yaml
sample_name: "HepG2-treated-batch-3"

organism:
  term_iri: http://purl.obolibrary.org/obo/NCBITaxon_9606
  label: Homo sapiens

tissue_type: Liver

age_at_collection: 42

collection_date: "2024-09-15"

treatment:
  - treatment_name: "Drug X 10 µM"
    treatment_dose: 10
  - treatment_name: "Vehicle control"
    treatment_dose: 0
```
