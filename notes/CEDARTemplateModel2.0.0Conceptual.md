**CEDAR Template Model**

Conceptual Overview

Version 2.0.0

# **1\. Introduction**

CEDAR (Center for Expanded Data Annotation and Retrieval) provides an infrastructure for creating and managing machine-readable metadata templates. This document describes the conceptual model underlying CEDAR templates, focusing on the abstract features and capabilities of templates and fields.

The CEDAR template model enables researchers and data managers to define structured metadata schemas that capture the semantics and constraints of scientific data. These schemas can then be instantiated to create metadata records describing actual data resources.

## **1.1 Core Artifact Types**

The CEDAR model defines three fundamental artifact types:

| Artifact | Description |
| :---- | :---- |
| **Template** | Container defining metadata collection structure. Templates can serve as top-level schemas for metadata instances or be nested within other templates, providing modular composition at any level. |
| **Field** | Atomic unit representing a single data entry point. Multiple field types support different data domains and validation requirements. |
| **Instance** | Filled template containing actual metadata values conforming to a template specification. |

# **2\. Artifact Provenance and Metadata**

All CEDAR artifacts maintain comprehensive provenance information tracking their lifecycle, versioning, and relationships to other artifacts.

## **2.1 Descriptive Metadata**

Each artifact includes descriptive metadata that provides human-readable context:

| Property | Description |
| :---- | :---- |
| **Name** | User-supplied name identifying the artifact (required) |
| **Description** | Extended textual description explaining purpose and content |
| **Identifier** | User-specified external identifier for integration with institutional systems |

## **2.2 System Identifiers**

CEDAR assigns each artifact a unique IRI (Internationalized Resource Identifier) that permanently identifies it within the repository. This identifier enables unambiguous references, semantic linking, and distributed artifact management.

## **2.3 Temporal Provenance**

Temporal provenance tracks creation and modification events:

| Property | Description |
| :---- | :---- |
| **Created On** | ISO 8601 timestamp recording artifact creation |
| **Created By** | IRI identifying the creating user |
| **Modified On** | ISO 8601 timestamp of most recent modification |
| **Modified By** | IRI identifying the last modifying user |

## **2.4 Versioning**

Schema artifacts (templates and fields) support semantic versioning and lineage tracking:

| Property | Description |
| :---- | :---- |
| **Version** | Semantic version string (major.minor.patch) following semver.org conventions |
| **Status** | Publication status: draft (under development) or published (finalized) |
| **Model Version** | Version of the CEDAR model specification used when creating the artifact |
| **Previous Version** | IRI linking to the immediate predecessor version, enabling version chain traversal |
| **Derived From** | IRI identifying source artifact when copied or adapted from another template |

## **2.5 Annotations**

All artifacts can have custom annotations. Annotations are attribute-value pairs, which may have literal values or can be IRIs:

| Feature | Description |
| :---- | :---- |
| **Annotations** | Custom metadata annotations enabling linking to external resources (DOIs, grant IDs) or storing institutional metadata |

## 

# **3\. Templates**

Templates are containers in the CEDAR model that define structured metadata schemas. A template can serve as a top-level schema for creating metadata instances, or be nested within other templates to provide modular, reusable metadata patterns.

Templates contain an ordered collection of child artifacts. Each child can be either a field (atomic data entry point) or a template (reusable structured group). The ordering of children defines the presentation sequence in rendered forms.

Templates support arbitrary nesting depth. Templates contained within templates can themselves contain other templates and fields, enabling complex hierarchical metadata structures that mirror domain-specific conceptual models.

Templates exist as independent artifacts with their own identifiers and provenance. A single template definition can be referenced and nested within multiple other templates, promoting consistency and reducing redundancy across metadata schemas.

Templates support cardinality constraints allowing multiple instances. When configured for multiplicity, users can create repeated occurrences of a nested template within a parent template instance, each containing its own set of field values. Minimum and maximum instance counts can be specified to enforce data requirements.

## **3.1 Template-Specific Features**

Template can have header and footer information:

| Feature | Description |
| :---- | :---- |
| **Header** | Optional introductory text displayed at the top of rendered forms, providing context or instructions |
| **Footer** | Optional concluding text displayed at the bottom, typically containing contact information or citations |

# **4\. Fields**

Fields are the atomic units of metadata capture in the CEDAR model. Each field represents a single data entry point with specific type, constraints, and validation rules.

## **4.1 Common Field Features**

All field types share a core set of features:

| Feature | Description |
| :---- | :---- |
| **Identification and Labeling** | Each field has a unique key within its parent container, a display name shown to users, and an optional extended description. Fields can specify a preferred label (the actual question text) and alternative labels for display flexibility. |
| **Value Requirements** | Fields can be marked as required (must have a value), recommended (value encouraged but optional), or optional. Required fields prevent instance submission until populated. |
| **Default Values** | Fields support default values that are pre-populated when instances are created. Default values reduce data entry burden for common cases while remaining editable by users. |
| **Multiplicity** | Fields can be configured to accept multiple values, with optional minimum and maximum cardinality constraints. Multi-valued fields enable capture of repeating information without structural redundancy. |
| **Visibility Control** | Fields can be hidden from user interfaces while remaining part of the schema. Hidden fields support system-populated values, computed fields, or institutional metadata not requiring manual entry. |

## **4.2 Field Types**

CEDAR supports a comprehensive set of field types for capturing diverse metadata:

| Field Type | Description |
| :---- | :---- |
| **Single-Line Text** | Brief text entries suitable for titles, names, or short identifiers with length constraints and regex validation |
| **Multi-Line Text Area** | Longer content such as abstracts, descriptions, or narrative text with expanded vertical space |
| **Numeric** | Quantitative data with type-specific validation, range constraints, precision control, and unit association |
| **Temporal** | Date, time, or combined datetime values with configurable granularity and timezone support |
| **Controlled Term** | Values from standardized vocabularies, ontologies, or value sets ensuring semantic precision |
| **Radio Button** | Single selection from a small set of mutually exclusive options |
| **Checkbox** | Multiple selection from a set of independent options |
| **Single-Select Dropdown** | Single selection from a larger set via dropdown menu |
| **Multi-Select Dropdown** | Multiple selection from a larger set via dropdown |
| **Email** | Contact email addresses with format validation |
| **Phone Number** | Phone numbers with format validation |
| **Link** | URIs and URLs with syntax validation |
| **ORCID** | Persistent researcher identifiers with validation and resolution |
| **ROR** | Research Organization Registry identifiers |
| **DOI** | Digital Object Identifiers for publications and datasets |
| **PubMed ID** | PubMed article identifiers |
| **RRID** | Research Resource Identifiers |
| **NIH Grant ID** | NIH grant identifiers |
| **Attribute-Value** | Custom key-value pairs defined at instance creation time |

The model also defined static fields that are designed for presentation purposes and do not acquire metadata:

| Rich Text | HTML-formatted instructional or explanatory text (static content) |
| :---- | :---- |
| **Image** | Embedded images such as logos, diagrams, or examples (static content) |
| **YouTube Video** | Embedded instructional or training videos (static content) |
| **Section Break** | Visual divider for logical sections with optional descriptions (static content) |
| **Page Break** | Pagination control in rendered forms (static content) |

## **4.3 Field Type Details**

The following subsections provide detailed information about each field type:

### **4.3.1 Single-Line Text Field**

These fields accept brief text entries suitable for titles, names, or short identifiers. They support length constraints (minimum and maximum character counts) and regular expression validation for format enforcement.

### **4.3.2 Multi-Line Text Area Field**

Text area fields accommodate longer content such as abstracts, descriptions, or narrative text. They support the same validation constraints as single-line fields but render with expanded vertical space.

### **4.3.3 Numeric Field**

Numeric fields capture quantitative data with type-specific validation and formatting. Features include:

| Feature | Description |
| :---- | :---- |
| **Data Types** | Support for integers, long integers, floats, doubles, and arbitrary-precision decimals |
| **Range Constraints** | Minimum and maximum value bounds ensure values fall within acceptable ranges |
| **Precision Control** | Specification of decimal places for display and rounding behavior |
| **Unit Association** | Attachment of measurement units (e.g., meters, kilograms) for contextual clarity |

### **4.3.4 Temporal Field**

Temporal fields capture date, time, or combined datetime values. Key features include:

| Feature | Description |
| :---- | :---- |
| **Data Types** | Support for date-only, time-only, or combined datetime values |
| **Granularity** | Configurable precision from year-level down to decimal seconds |
| **Time Format** | Selection of 12-hour or 24-hour clock display |
| **Timezone Support** | Optional timezone capture for unambiguous global temporal references |

### **4.3.5 Controlled Term Field**

Controlled term fields restrict values to entries from standardized vocabularies, ontologies, or value sets. This ensures semantic precision and enables automated reasoning. These fields provide the semantic backbone of CEDAR metadata.

| Source Type | Description |
| :---- | :---- |
| **Ontology** | Allow any term from specified ontologies. Users can search the full ontology to find appropriate terms. Each ontology is identified by acronym, full name, and IRI. |
| **Branch** | Restrict values to a specific subtree within an ontology. A root term is specified, and users can select any term descendant from that root. Maximum traversal depth can be configured. |
| **Class** | Limit selection to specific predefined classes or terms. Each class is explicitly enumerated with its IRI, label, and source ontology. |
| **Value Set** | Draw from curated value sets maintained by standards organizations. Value sets provide domain-specific term collections optimized for interoperability. |

### **4.3.6 Radio Button Field**

Radio button fields enable single selection from a small set of mutually exclusive options. Each option can be designated as selected by default, reducing data entry burden when a particular choice is most common.

### **4.3.7 Checkbox Field**

Checkbox fields allow multiple selection from a set of independent options. Each option can be designated as selected by default.

### **4.3.8 Single-Select Dropdown Field**

Single-select dropdown fields enable single selection from a larger set of options via dropdown menu. Default selection can be specified.

### **4.3.9 Multi-Select Dropdown Field**

Multi-select dropdown fields allow multiple selection from a larger set of options via dropdown menu. Default selections can be specified.

### **4.3.10 Email Field**

Email fields capture contact email addresses with format validation appropriate to email domains, ensuring captured contact information is well-formed.

### **4.3.11 Phone Number Field**

Phone number fields capture telephone numbers with format validation appropriate to their domain, ensuring captured contact information is well-formed.

### **4.3.12 Link Field**

Link fields capture URIs and URLs with validation for proper URI syntax.

### **4.3.13 ORCID Field**

ORCID fields capture persistent researcher identifiers with validation specific to the ORCID identifier format and integration with resolution services for identifier lookup and verification.

### **4.3.14 ROR Field**

ROR fields capture Research Organization Registry identifiers with format validation and integration with resolution services for identifier lookup and verification.

### **4.3.15 DOI Field**

DOI fields capture Digital Object Identifiers for publications and datasets with format validation and integration with resolution services for identifier lookup and verification.

### **4.3.16 PubMed ID Field**

PubMed ID fields capture PubMed article identifiers with format validation and integration with resolution services for identifier lookup and verification.

### **4.3.17 RRID Field**

RRID fields capture Research Resource Identifiers with format validation and integration with resolution services for identifier lookup and verification.

### **4.3.18 NIH Grant ID Field**

NIH Grant ID fields capture NIH grant identifiers with format validation and integration with resolution services for identifier lookup and verification.

### **4.3.19 Attribute-Value Field**

Attribute-value fields enable users to define custom key-value pairs at instance creation time. This provides flexibility for capturing unanticipated metadata without requiring template modification. Users can add multiple attribute-value pairs, each with a user-defined attribute name and corresponding value.

### **4.3.20 Rich Text Field**

Rich text fields display HTML-formatted instructional or explanatory text. These static fields do not collect data but provide contextual information within templates. They support dimensional configuration, allowing designers to control layout and visual hierarchy within forms.

### **4.3.21 Image Field**

Image fields embed images (logos, diagrams, examples) within forms. These static fields do not collect data but provide contextual information within templates. They support dimensional configuration, allowing designers to control layout and visual hierarchy within forms.

### **4.3.22 YouTube Video Field**

YouTube Video fields embed instructional or training videos within templates. These static fields do not collect data but provide contextual information within templates.

### **4.3.23 Section Break Field**

Section Break fields visually divide forms into logical sections with optional descriptions. These static fields do not collect data but provide contextual information within templates.

### **4.3.24 Page Break Field**

Page Break fields control pagination in rendered forms. These static fields do not collect data but provide structural information for form rendering.

# **5\. Template Instances**

Template instances are metadata records created by filling in a template. Each instance conforms to the structure and constraints defined by its parent template.

Every instance maintains a permanent reference to the template it is based on. This binding enables validation, interpretation, and automated processing of instance data according to template specifications.

Instances preserve the hierarchical structure of their templates. Nested templates in instances contain nested value structures, enabling representation of complex hierarchical metadata.

Instance validation ensures conformance to template specifications. All field-level constraints (required values, numeric ranges, string patterns, controlled vocabularies) are enforced. Template multiplicity constraints are verified. This validation can occur at data entry time (preventing invalid submission) or retrospectively (identifying non-conforming instances).

Instance field values are represented according to their field types. Simple text values are stored directly. Values may optionally include explicit datatype annotations for numeric or temporal data, ensuring proper type interpretation. Controlled term values store both the term IRI (for semantic processing) and human-readable label (for display). Optional additional properties include notations and preferred labels from the source ontology.

Text values can include language tags specifying their natural language, enabling multilingual metadata.

Fields configured for multiplicity store values as arrays. Multi-valued templates contain arrays of template instances, each with its own set of field values.