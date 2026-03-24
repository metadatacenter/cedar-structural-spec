# LinkML Two-Level Schema Approach for CEDAR

This document describes a two-level use of LinkML for CEDAR: a metamodel schema
that describes what templates and fields *are*, and a per-template schema
generated from each concrete template that describes what *instances* of that
template look like. Together these two levels provide a clean, format-independent
alternative to the CTM 1.6.0 serialisation.

---

## The core idea

CEDAR has an inherent two-level structure:

- **Schema level** — Templates and Fields define the structure and semantics of
  metadata forms. This is the authoring and publishing layer.
- **Instance level** — TemplateInstances record data conforming to a specific
  Template. This is the data-entry and storage layer.

CTM 1.6.0 handles both levels in one flat JSON-LD document by embedding a JSON
Schema fragment inside each template. This conflation is the source of most of
the complexity described in `spec/ctm-1.6.0-serialization.md`.

LinkML can handle both levels cleanly, but it does so with *two separate schemas*:

| Level | Schema | Describes |
|---|---|---|
| 1 — Metamodel | `spec/grammar.linkml.yaml` | What a Template and Field are; the shape of template *definitions* |
| 2 — Template schema | Generated per template | What instances of a *specific* template look like; typed slots, value ranges, cardinality |

The metamodel schema is fixed and maintained by the CEDAR team. The per-template
schema is generated automatically by CEDAR tooling each time a template is
published, from the template definition stored as an instance of the metamodel
schema.

---

## Level 1 — The metamodel schema

`spec/grammar.linkml.yaml` is a LinkML schema that describes the CEDAR abstract
model. It defines classes such as `Template`, `Field`, `EmbeddedArtifact`, and
`TemplateInstance`, along with all the field specs, value types, and metadata
structures from `spec/grammar.md`.

A specific CEDAR template — "Study Metadata Form", say — is an *instance* of the
`Template` class in this schema. Authoring tools write and read template
definitions as data conforming to this schema.

The metamodel schema can generate:

- A **JSON Schema** for validating template definition documents
- A **JSON-LD context** for annotating template definitions with semantic IRIs
- **Python/TypeScript classes** for tools that create or manipulate template
  definitions programmatically

---

## Level 2 — The per-template schema

For each published template, CEDAR tooling generates a dedicated LinkML schema.
This schema is derived from the template definition and describes what conforming
instance data looks like for that specific template.

The derivation rules are straightforward:

| Template construct | Generated schema construct |
|---|---|
| `EmbeddedTextField` with key `k` | Slot `k` with `range: string` (or `TextValue`) |
| `EmbeddedNumericField` with key `k` | Slot `k` with `range: NumericValue` |
| `EmbeddedDateField` with key `k` | Slot `k` with `range: DateValue` |
| `EmbeddedControlledTermField` with key `k` | Slot `k` with `range: ControlledTermValue` |
| `EmbeddedSingleChoiceField` with key `k` | Slot `k` with `range: <GeneratedEnum>` |
| `EmbeddedMultipleChoiceField` with key `k` | Slot `k` with `range: <GeneratedEnum>`, `multivalued: true` |
| `EmbeddedTemplate` with key `k` | Slot `k` with `range: <NestedTemplateClass>` |
| `EmbeddedPresentationComponent` | Omitted — produces no instance data |
| `ValueRequirement: Required` | `required: true` on the slot |
| `ValueRequirement: Recommended` or `Optional` | No `required` annotation |
| `min_cardinality(n)` | `minimum_cardinality: n` on the slot |
| `max_cardinality(n)` | `maximum_cardinality: n` on the slot |
| `UnboundedCardinality` | No `maximum_cardinality` |
| `LiteralSingleChoiceFieldSpec` / `LiteralMultipleChoiceFieldSpec` options | A named `enum:` block in the schema |
| `Property` (semantic property IRI) | `slot_uri:` on the slot |
| `LabelOverride` | `title:` on the slot |

The `EmbeddedArtifactKey` of each embedded field becomes the slot name directly.
This is the key simplification: there are no type discriminator tags, no
`embedded_artifact_key` fields in instance data, and no hoisting of information
across multiple top-level keys.

---

## Worked example

### The template definition (Level 1 data)

The following is a CEDAR template definition serialised as an instance of the
metamodel schema.

```yaml
# Instance of cedar:Template — stored and exchanged at the schema/authoring layer
id: https://repo.metadatacenter.org/templates/study-metadata-form
schema_artifact_metadata:
  schema_versioning:
    schema_version: "https://json-schema.org/draft/2019-09/schema"
    pav_version: "1.0.0"
    bibo_status: "bibo:published"
  descriptive_metadata:
    schema_name: "Study Metadata Form"
    schema_description: "Captures core study-level metadata."
  temporal_provenance:
    pav_created_on: "2025-03-01T00:00:00Z"
    pav_created_by: "https://orcid.org/0000-0001-2345-6789"
embedded_artifacts:
  - type: EmbeddedTextField
    embedded_artifact_key: study_title
    value_requirement: Required
    field_reference: https://repo.metadatacenter.org/fields/text-title-field

  - type: EmbeddedControlledTermField
    embedded_artifact_key: organism
    value_requirement: Required
    field_reference: https://repo.metadatacenter.org/fields/organism-field
    embedding_property:
      property_iri: http://purl.obolibrary.org/obo/OBI_0100026

  - type: EmbeddedSingleChoiceField
    embedded_artifact_key: study_type
    value_requirement: Required
    field_reference: https://repo.metadatacenter.org/fields/study-type-field

  - type: EmbeddedDateField
    embedded_artifact_key: study_start_date
    value_requirement: Optional
    field_reference: https://repo.metadatacenter.org/fields/date-start-field

  - type: EmbeddedTemplate
    embedded_artifact_key: study_arm
    value_requirement: Optional
    min_cardinality: 1
    max_cardinality: 5
    template_reference: https://repo.metadatacenter.org/templates/study-arm-template
    embedding_property:
      property_iri: http://purl.obolibrary.org/obo/OBI_0000750
```

### The generated per-template schema (Level 2 schema)

CEDAR tooling reads the template definition above and generates the following
LinkML schema.

```yaml
id: https://repo.metadatacenter.org/templates/study-metadata-form/schema
name: study-metadata-form
title: Study Metadata Form
description: Captures core study-level metadata.

prefixes:
  linkml: https://w3id.org/linkml/
  cedar:  https://metadatacenter.org/cedar-model/
  OBI:    http://purl.obolibrary.org/obo/OBI_

default_prefix: https://repo.metadatacenter.org/templates/study-metadata-form/schema/
imports:
  - linkml:types
  - https://metadatacenter.org/cedar-model  # ControlledTermValue etc.

enums:
  StudyTypeOptions:
    # Generated from LiteralSingleChoiceFieldSpec on the referenced field
    permissible_values:
      Interventional: {}
      Observational: {}
      ExpandedAccess: {}

classes:
  StudyMetadataForm:
    tree_root: true
    description: Captures core study-level metadata.
    slots:
      - study_title
      - organism
      - study_type
      - study_start_date
      - study_arm

  StudyArmForm:
    # Generated recursively from the nested template reference
    description: Data for a single study arm.
    slots:
      - arm_name
      - arm_type

slots:
  study_title:
    range: string
    required: true
    description: Title of the study.
    # ValueRequirement: Required → required: true

  organism:
    range: ControlledTermValue
    required: true
    slot_uri: OBI:0100026
    # embedding_property.property_iri → slot_uri
    # ControlledTermFieldSpec → range: ControlledTermValue

  study_type:
    range: StudyTypeOptions
    required: true
    # LiteralSingleChoiceFieldSpec → enum range

  study_start_date:
    range: date
    # DateFieldSpec → range: date (or DateValue for full precision model)
    # ValueRequirement: Optional → no required annotation

  study_arm:
    range: StudyArmForm
    multivalued: true
    minimum_cardinality: 1
    maximum_cardinality: 5
    inlined_as_list: true
    # EmbeddedTemplate → range: generated nested class
    # Cardinality(1, 5) → minimum/maximum_cardinality

  arm_name:
    range: string
    required: true

  arm_type:
    range: string
```

### A conforming instance (Level 2 data)

Instance data conforming to the generated schema is plain, readable YAML with
no CEDAR-specific keys:

```yaml
study_title: "Effect of Drug X on Biomarker Y"

organism:
  term_iri: http://purl.obolibrary.org/obo/NCBITaxon_9606
  label: Homo sapiens
  preferred_label: human

study_type: Interventional

study_start_date: "2024-06-01"

study_arm:
  - arm_name: "Treatment arm"
    arm_type: "Active comparator"
  - arm_name: "Control arm"
    arm_type: "Placebo comparator"
```

The same instance as JSON-LD, using the generated context (slot URIs become
predicates automatically):

```json
{
  "@context": "https://repo.metadatacenter.org/templates/study-metadata-form/schema/context.jsonld",
  "@type": "StudyMetadataForm",
  "study_title": "Effect of Drug X on Biomarker Y",
  "OBI:0100026": {
    "@type": "cedar:ControlledTermValue",
    "cedar:termIri": "http://purl.obolibrary.org/obo/NCBITaxon_9606",
    "rdfs:label": "Homo sapiens"
  },
  "study_type": "Interventional",
  "study_start_date": "2024-06-01",
  "OBI:0000750": [
    { "arm_name": "Treatment arm", "arm_type": "Active comparator" },
    { "arm_name": "Control arm",   "arm_type": "Placebo comparator" }
  ]
}
```

---

## What the generated schema unlocks

From the per-template LinkML schema, generators produce:

| Generator output | Use |
|---|---|
| **JSON Schema** | Validate instance documents in any JSON toolchain, without CEDAR runtime |
| **JSON-LD context** | Semantic annotation of instances; `slot_uri` values become RDF predicates |
| **Python dataclasses / Pydantic** | Typed in-memory representation of instances; import directly into analysis scripts |
| **TypeScript interfaces** | Typed instance handling in web applications |
| **SHACL shapes** | Validate RDF-serialised instances in triple stores |
| **Markdown docs** | Human-readable documentation of the template's expected instance structure |

All of these are derived from the same per-template schema, so they remain
consistent with one another automatically.

---

## Comparison with CTM 1.6.0

CTM 1.6.0 achieves a structurally similar goal — embedded JSON Schema validates
instances — but with several disadvantages that the two-level LinkML approach
resolves.

### Instance document readability

**CTM 1.6.0 instance:**
```json
{
  "@context": { ... 40 lines of context ... },
  "study_title": { "@value": "Effect of Drug X" },
  "organism": {
    "@id": "http://purl.obolibrary.org/obo/NCBITaxon_9606",
    "rdfs:label": "Homo sapiens"
  }
}
```

**LinkML-generated instance (YAML):**
```yaml
study_title: "Effect of Drug X"
organism:
  term_iri: http://purl.obolibrary.org/obo/NCBITaxon_9606
  label: Homo sapiens
```

The LinkML instance is readable by a researcher who has never heard of CEDAR.
The CTM 1.6.0 instance requires knowledge of the JSON-LD value object convention
(`{"@value": …}`) and the context structure to interpret.

### Separation of concerns

| Concern | CTM 1.6.0 | Two-level LinkML |
|---|---|---|
| Structural validation | JSON Schema embedded inside the template document | Separate generated JSON Schema for instances |
| Semantic annotation | `@context` hard-coded per template | Generated JSON-LD context from `slot_uri` annotations |
| Field configuration | `_ui`, `_valueConstraints`, `inputType` mixed with schema keys | Captured in metamodel schema; not present in instance |
| Multiple output formats | JSON-LD only | JSON, YAML, JSON-LD, RDF/Turtle, Python, TypeScript |

### Information hoisting

CTM 1.6.0 spreads information about a single embedded field across four
top-level keys of the template document (`properties`, `required`, `_ui`,
`@context`). In the two-level approach, this hoisting is eliminated: the
generated per-template schema has one slot per embedded field, and all
properties of that slot (range, cardinality, requirement, semantic IRI) live
together in that slot's definition.

---

## The generation pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  Authoring layer (Level 1)                                      │
│                                                                 │
│  Template definition ──▶ validated against grammar.linkml.yaml  │
│  (YAML / JSON)            (the metamodel schema)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │ published template
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Schema generation (Level 2)                                    │
│                                                                 │
│  CEDAR tooling reads the template definition and emits:         │
│  • per-template LinkML YAML schema                              │
│  • (from that schema) JSON Schema, JSON-LD context,             │
│    Python/TS classes, SHACL shapes, Markdown docs               │
└───────────────────────────────┬─────────────────────────────────┘
                                │ per-template schema + artefacts
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Instance layer (Level 2 data)                                  │
│                                                                 │
│  Instance document (YAML / JSON / JSON-LD / RDF)               │
│  ──▶ validated against generated JSON Schema                    │
│  ──▶ annotated using generated JSON-LD context                  │
│  ──▶ loaded into Python/TS using generated classes              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Open questions

- **Reusable fields as a shared import** — If the same `TextField` is referenced
  from many templates, its slot definition would be generated redundantly in each
  per-template schema. A cleaner approach might generate a shared LinkML import
  per reusable field and have per-template schemas import it.

- **Template versioning** — When a template is revised, a new per-template schema
  is generated. Existing instances were validated against the old schema. The
  version relationship between schema revisions and instance conformance needs a
  defined policy (e.g., a migration tool, a version IRI on the schema).

- **Inline vs referenced fields** — The current CEDAR model requires all fields
  to be reusable artifacts referenced by IRI. The per-template schema generation
  could either inline the field's type information (simpler) or generate a
  separate schema document per field and import it (more reuse-friendly). The
  right choice depends on how often fields are actually shared across templates
  in practice.

- **Presentation components in the schema** — `EmbeddedPresentationComponent`
  entries are omitted from the generated schema because they produce no instance
  data. If generated documentation of the template's visual structure is needed,
  these could be captured in annotations on the class rather than as slots.

- **Dynamic schema distribution** — Instances need to reference their template's
  generated schema to be self-describing. This could be done via a `@context`
  IRI in JSON-LD or a `$schema` IRI in JSON, both resolvable to the generated
  artefacts.
