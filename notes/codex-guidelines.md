# Codex Guidelines for the CEDAR Template Model Specification

## Purpose

This document provides editing and authoring rules for Codex when working on the CEDAR Template Model specification.

Codex should treat this file and `notes/session-summary.md` as the primary guidance for generating and revising the spec.

---

# Primary Goal

Produce a **formal, precise, standards-style specification** for the CEDAR Template Model.

The specification should be:

- structurally precise
- terminology-consistent
- implementation-oriented
- readable by both implementers and advanced users

The style should take inspiration from the **OWL Functional Syntax specification**, but the output should be written in Markdown suitable for later rendering to HTML.

---

# Files Codex Should Maintain

Codex should generate and maintain the following files:

```text
spec/
  index.md
  metamodel.md
  grammar.md
  field-types.md
  presentation.md
  instances.md
  validation.md
  notation.md
````

Optional later additions:

```text
spec/
  examples.md
  diagrams.md
  conformance.md
```

---

# Source of Truth

Codex must use these files as the current source of truth:

1. `notes/session-summary.md`
2. `notes/codex-guidelines.md`

If existing spec files conflict with these notes, Codex should preserve the terminology and modeling choices in these notes unless explicitly instructed otherwise.

---

# Non-Negotiable Terminology

Codex must preserve the following terms exactly:

```text
Artifact
SchemaArtifact
Template
Field
PresentationComponent
EmbeddedArtifact
EmbeddedField
EmbeddedTemplate
EmbeddedPresentationComponent
TemplateInstance
InstanceValue
FieldValue
NestedTemplateInstance
EmbeddedArtifactKey
FieldType
```

## Forbidden terminology

The following terms must not be introduced unless explicitly requested:

```text
Element
PresentationField
StaticField
Atomic metadata entry point
```

In particular:

* Do not use the word **Element**
* Do not describe a Field as an **atomic metadata entry point**
* Do not model presentation constructs as fields

---

# Core Modeling Rules

## 1. Separate schema from presentation

Codex must preserve the distinction between:

* **SchemaArtifact**
* **PresentationComponent**
* **TemplateInstance**

Presentation components are **not fields**.

They do not define metadata values and do not contribute values to instances.

## 2. Preserve the embedding layer

Templates do not directly contain fields, templates, or presentation components.

Templates contain:

* `EmbeddedField`
* `EmbeddedTemplate`
* `EmbeddedPresentationComponent`

These are all subclasses of `EmbeddedArtifact`.

Embedding carries local, context-specific properties.

## 3. Preserve the instance layer

Instances contain only data-bearing values.

Use:

* `FieldValue`
* `NestedTemplateInstance`

Do not create any instance-value construct for presentation components.

## 4. Preserve the key model

Each embedded artifact has an `EmbeddedArtifactKey`.

Keys are local to a template and must be unique within that template.

Codex may discuss paths as a future extension, but must keep key and path conceptually distinct unless explicitly instructed otherwise.

---

# Writing Style Rules

## 1. Prefer precise, concrete language

Avoid vague phrases.

### Avoid

* structured metadata schema
* atomic metadata entry point
* logical component
* user-facing unit

### Prefer

* specifies a kind of value
* specifies an ordered arrangement
* conforms to a template
* references an embedded artifact
* defines intrinsic constraints
* defines embedding-specific properties

## 2. Write normative prose clearly

Use standards-style wording where appropriate:

* MUST
* MUST NOT
* MAY
* SHOULD

But do not overuse RFC-style keywords in every sentence. Use them where they express actual normative requirements.

## 3. Keep definitions short

Core definitions should generally be 1–3 short paragraphs.

Definitions should answer:

* what the thing is
* what role it plays
* what it contains or references
* what it does not include, if that matters

## 4. Avoid unnecessary abstraction

Do not invent extra layers unless they solve a real modeling problem.

Prefer the smallest clean model that captures the intended distinctions.

---

# Grammar Rules

## 1. Grammar style

Use a **BNF-style abstract grammar**.

Use:

```text
::=   defined as
|     alternative productions
X*    zero or more occurrences
X+    one or more occurrences
[X]   optional
```

## 2. Use whitespace-separated productions

Do not use commas in productions unless explicitly required for a concrete syntax.

### Preferred

```bnf
Field ::= Field(
            ArtifactMetadata
            FieldType
            FieldIntrinsicConstraint*
          )
```

### Avoid

```bnf
Field ::= Field(
            ArtifactMetadata,
            FieldType,
            FieldIntrinsicConstraint*
          )
```

## 3. Grammar is abstract, not JSON-like

The grammar must describe the **abstract structure** of the model.

Do not make the grammar look like JSON, YAML, or another concrete syntax.

## 4. Separate syntax from constraints

Use grammar productions for structure.

Use prose or a separate “well-formedness conditions” subsection for rules such as:

* keys must be unique within a template
* min cardinality must not exceed max cardinality
* presentation components do not produce values
* rendering hints must be compatible with field types

Do not try to force every semantic constraint into BNF.

---

# Field Type Rules

## 1. Field types are semantic categories

Field types classify **kinds of values**.

Do not model UI widgets as top-level field types.

The field type system should remain centered on semantic categories such as:

* `TextFieldType`
* `NumericFieldType`
* `TemporalFieldType`
* `ControlledTermFieldType`
* `ChoiceFieldType`
* `LinkFieldType`
* `ContactFieldType`
* `IdentifierFieldType`
* `AttributeValueFieldType`

## 2. Rendering hints are not field types

Rendering hints influence UI behavior but do not change semantics.

Examples:

* `TextRenderingHint`
* `ChoiceRenderingHint`
* `NumericRenderingHint`
* `TemporalRenderingHint`

## 3. Rendering hints must be compatible with field types

Do not allow obviously invalid combinations.

Example invalid combination:

* `TextFieldType` with `Radio`

Example valid combinations:

* `TextFieldType(SingleLine SingleLineInput)`
* `ChoiceFieldType(SingleChoice OptionSet Radio)`
* `ChoiceFieldType(MultipleChoice OptionSet Checkbox)`

## 4. Separate semantics from presentation

Codex should preserve the distinction between:

* semantic value category
* rendering choice

This distinction is one of the key cleanups in the spec.

---

# Presentation Component Rules

Presentation components are not fields.

Use:

* `RichTextComponent`
* `ImageComponent`
* `YouTubeVideoComponent`
* `SectionBreakComponent`
* `PageBreakComponent`

Rules:

* They may be embedded in templates.
* They do not define metadata values.
* They do not contribute instance values.
* They may have presentation-specific metadata.
* They may affect rendering, layout, grouping, or guidance.

---

# Metamodel Rules

Codex should ensure the metamodel remains internally consistent.

## Required relationships

* A `Template` contains an ordered sequence of `EmbeddedArtifact`
* An `EmbeddedArtifact` references exactly one embedded artifact
* A `TemplateInstance` conforms to exactly one `Template`
* A `FieldValue` corresponds to an embedded field by key
* A `NestedTemplateInstance` corresponds to an embedded template by key

## Important distinction

Codex must preserve the distinction between:

* **intrinsic constraints** on a Field
* **embedding-specific properties** on an EmbeddedArtifact

Examples of intrinsic constraints:

* field type
* numeric range
* regex
* ontology source

Examples of embedding-specific properties:

* key
* position
* cardinality
* hidden
* label override
* default value
* requiredness

---

# Document Structure Rules

Each spec file should have a clear role.

## `spec/index.md`

Overview, scope, and document organization.

## `spec/notation.md`

Grammar notation and conventions.

## `spec/metamodel.md`

Normative definitions of the core classes and relationships.

## `spec/grammar.md`

Full BNF-style abstract grammar.

## `spec/field-types.md`

Field type system and intrinsic field constraints.

## `spec/presentation.md`

Presentation components and their role in templates.

## `spec/instances.md`

Template instance model and value structure.

## `spec/validation.md`

Well-formedness conditions and validation rules.

---

# Editing Priorities

When revising the spec, Codex should prioritize:

1. terminology consistency
2. metamodel consistency
3. grammar correctness
4. definition clarity
5. stylistic polish

If a stylistic improvement would introduce terminological inconsistency, do not make that change.

---

# Behavior When Uncertain

If Codex encounters an unresolved modeling issue, it should:

1. preserve the existing stable terminology
2. avoid inventing a new abstraction unless necessary
3. add the issue to a clearly marked **Open Questions** section
4. avoid silently changing the model

---

# Preferred Output Style

Codex should write in a standards-document style:

* numbered sections
* concise definitions
* brief explanatory text after grammar productions
* separate well-formedness rules from grammar

Use Markdown headings and code fences consistently.

---

# Suggested Open Questions Section

Where appropriate, Codex may maintain an `Open Questions` section listing unresolved issues such as:

* whether paths should be first-class alongside keys
* whether option sets should be reusable artifacts
* whether some rendering hints belong on fields or embeddings
* whether certain identifier field types should share a more explicit common structure

Codex must not resolve these automatically without instruction.

---

# Summary Rule

When in doubt, Codex should prefer:

* fewer concepts
* clearer definitions
* stronger separation of concerns
* abstract grammar over concrete syntax
* stable terminology over clever wording