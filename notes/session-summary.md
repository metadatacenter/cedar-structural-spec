---
# CEDAR Template Model Specification — Session Summary

## Purpose

This document summarizes the current design direction for a **formal structural specification of the CEDAR Template Model**.

The goal is to produce a **precise, implementable specification** inspired by the **OWL Functional Syntax specification**, using:

* clearly defined metamodel terminology
* UML-like conceptual diagrams
* a **BNF-style abstract structural grammar**

BNF (Backus–Naur Form) is a widely used formal notation for defining the structure of languages using production rules such as `symbol ::= expression`. ([Wikipedia][1])

The CEDAR spec will follow that general style but will define the **abstract model**, not a specific serialization format.

---

# Key Design Principles

The specification must:

1. **Clearly separate schema definition from instance data**
2. **Separate semantic structure from presentation**
3. **Separate reusable artifacts from contextual embeddings**
4. Use **precise terminology**
5. Avoid legacy terminology conflicts (e.g., the word **Element** must not appear)

---

# Core Metamodel Concepts

The following concepts form the **kernel of the CEDAR model**.

```
Artifact
SchemaArtifact
Template
Field
PresentationComponent
EmbeddedArtifact
TemplateInstance
InstanceValue
```

---

# Artifact Hierarchy

```
Artifact
 ├── SchemaArtifact
 │     ├── Template
 │     └── Field
 │
 ├── PresentationComponent
 │     ├── RichTextComponent
 │     ├── ImageComponent
 │     ├── YouTubeVideoComponent
 │     ├── SectionBreakComponent
 │     └── PageBreakComponent
 │
 └── TemplateInstance
```

---

# Embedding Layer

Templates do not contain artifacts directly.

Instead they contain **EmbeddedArtifacts**, which contextualize artifacts within a specific template.

```
EmbeddedArtifact
 ├── EmbeddedField
 ├── EmbeddedTemplate
 └── EmbeddedPresentationComponent
```

Embedding captures context-specific properties such as:

* key
* order
* cardinality
* visibility
* default value
* label override

The same Field or Template may appear in multiple templates via different embeddings.

---

# Instance Model

Instances contain values corresponding to embedded artifacts.

```
TemplateInstance
   └── InstanceValue*

InstanceValue
 ├── FieldValue
 └── NestedTemplateInstance
```

Important rule:

Presentation components **do not produce instance values**.

---

# Embedded Artifact Keys

Each embedded artifact must define a **key**.

```
EmbeddedArtifactKey
```

Keys are used to connect:

* template structure
* instance structure
* serialized data

Example:

```
title
authors
studyDesign
```

Keys must be **unique within a template**.

Paths may optionally be defined later:

```
study/title
authors/name
```

But keys themselves are local identifiers.

---

# Field Definition

A **Field** is defined as:

> A SchemaArtifact that specifies a kind of value that may appear in TemplateInstances.

Each field defines:

* a **FieldType**
* intrinsic constraints on values

Fields do not appear directly inside templates; they appear through **EmbeddedField**.

---

# Field Type System

Field types describe **semantic value categories**, not UI widgets.

```
FieldType
 ├── TextFieldType
 ├── NumericFieldType
 ├── TemporalFieldType
 ├── ControlledTermFieldType
 ├── ChoiceFieldType
 ├── LinkFieldType
 ├── ContactFieldType
 ├── IdentifierFieldType
 └── AttributeValueFieldType
```

---

# Rendering Hints

Rendering hints influence UI behavior but **do not change semantic meaning**.

Rendering hints must be **scoped to compatible field types**.

Example:

```
TextRenderingHint
ChoiceRenderingHint
NumericRenderingHint
TemporalRenderingHint
```

Example valid combinations:

```
TextFieldType(SingleLine, SingleLineInput)
ChoiceFieldType(SingleChoice, Radio)
ChoiceFieldType(MultipleChoice, Checkbox)
```

Invalid combinations must be prevented (e.g., `TextFieldType + Radio`).

---

# Presentation Components

Presentation components are **not fields**.

They influence layout or provide instructional content but do not produce instance values.

```
PresentationComponent
 ├── RichTextComponent
 ├── ImageComponent
 ├── YouTubeVideoComponent
 ├── SectionBreakComponent
 └── PageBreakComponent
```

These may appear inside templates via `EmbeddedPresentationComponent`.

---

# Template Definition

A **Template** is defined as:

> A SchemaArtifact that specifies an ordered arrangement of embedded artifacts.

Templates determine:

* which artifacts appear
* their ordering
* local constraints applied through embedding.

---

# Template Instances

A **TemplateInstance** is defined as:

> An Artifact that conforms to a Template.

TemplateInstances contain values corresponding to the embedded data-bearing artifacts of that Template.

---

# Abstract Grammar Style

The specification will include a **BNF-style grammar** describing the abstract structure of the model.

Example production:

```
Template ::= Template(
               ArtifactMetadata
               EmbeddedArtifact*
             )
```

Example alternatives:

```
EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent
```

Notation:

```
::=   defined as
|     alternative productions
X*    zero or more occurrences
X+    one or more occurrences
[X]   optional
```

Whitespace separates elements of productions.

Parentheses group components.

The grammar defines **abstract syntax**, not JSON or other concrete formats.

---

# Core Grammar Kernel

The essential grammar structure is:

```
CEDARArtifact ::= Template
                | Field
                | PresentationComponent
                | TemplateInstance
```

```
Template ::= Template(
               ArtifactMetadata
               EmbeddedArtifact*
             )
```

```
EmbeddedArtifact ::= EmbeddedField
                   | EmbeddedTemplate
                   | EmbeddedPresentationComponent
```

```
Field ::= Field(
            ArtifactMetadata
            FieldType
            FieldIntrinsicConstraint*
          )
```

```
TemplateInstance ::= TemplateInstance(
                       ArtifactMetadata
                       TemplateReference
                       InstanceValue*
                     )
```

```
InstanceValue ::= FieldValue
                | NestedTemplateInstance
```

```
FieldValue ::= FieldValue(
                 EmbeddedArtifactKey
                 ValueCollection
               )
```

```
NestedTemplateInstance ::= NestedTemplateInstance(
                             EmbeddedArtifactKey
                             InstanceValue*
                           )
```

---

# Constraints and Well-Formedness Rules

The specification must include normative rules such as:

* EmbeddedArtifact keys must be unique within a template.
* Cardinality constraints must satisfy `min ≤ max`.
* Rendering hints must be compatible with the field type.
* Presentation components must not produce instance values.

---

# Specification Document Structure

Codex should generate the following files.

```
spec/
  index.md
  metamodel.md
  grammar.md
  field-types.md
  presentation.md
  instances.md
```

### index.md

Overview of the CEDAR Template Model.

### metamodel.md

Normative definitions of:

* Artifact
* Template
* Field
* EmbeddedArtifact
* TemplateInstance
* InstanceValue

### grammar.md

Complete BNF-style grammar.

### field-types.md

Field type system and intrinsic constraints.

### presentation.md

Presentation component model.

### instances.md

Instance semantics and validation rules.

---

# Terminology Rules

The following terms must remain stable:

```
Template
Field
PresentationComponent
EmbeddedArtifact
EmbeddedField
EmbeddedTemplate
EmbeddedPresentationComponent
TemplateInstance
FieldValue
NestedTemplateInstance
EmbeddedArtifactKey
```

The term **Element must not be used**.

---

# Instructions for Codex

Codex should:

1. Generate the spec documents from this summary.
2. Preserve the terminology exactly.
3. Keep grammar **BNF-style** and abstract.
4. Avoid JSON-like grammar.
5. Ensure all defined terms are used consistently.
6. List unresolved modeling questions separately.

---

# Known Open Design Questions

These should be documented but not resolved automatically:

1. Should instance structures allow **path-based keys**?
2. Should rendering hints be stored on fields or embeddings?
3. Should option sets be reusable artifacts?

---

If you'd like, I can also generate a **second file for Codex** that works extremely well in practice:

```
notes/codex-guidelines.md
```

This tells Codex **how to behave when editing the spec** (terminology rules, grammar style, consistency checks). It dramatically improves the quality of Codex edits for specification work.

[1]: https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form?utm_source=chatgpt.com "Backus–Naur form"
