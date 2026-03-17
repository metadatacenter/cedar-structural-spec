# CEDAR Template Model V1.6.0 {#cedar-template-model-v1.6.0}

# Martin J O'Connor, Marcos Martínez-Romero,  and the CEDAR Team

August 10th, 2020

# 

# Table of Contents

[Introduction](#introduction)

[Template Model](#template-model)

[Template Model Concrete Representation](#template-model-concrete-representation)

[Representing Artifact Provenance](#representing-artifact-provenance)

[Representing Artifact Structure Using JSON Schema](#representing-artifact-structure-using-json-schema)

[Representing Template Fields](#representing-template-fields)

[Representing Template Fields with Multiple Values](#representing-template-fields-with-multiple-values)

[Representing Template Elements](#representing-template-elements)

[Representing Templates](#representing-templates)

[Representing Multiple Instances of Template Elements and Template Fields](#representing-multiple-instances-of-template-elements-and-template-fields)

[Representing Artifact Semantics using JSON-LD](#representing-artifact-semantics-using-json-ld)

[Representing Instances as RDF](#representing-additional-artifact-metadata-using-json-ld)

[Expressing Field Value Constraints](#expressing-field-value-constraints)

[The \_valueConstraints field](#the-_valueconstraints-field)

[General Value Constraint Fields](#general-value-constraint-fields)

[Numeric Value Constraint Fields](#numeric-value-constraint-fields)

[Temporal Value Constraint Fields](#temporal-value-constraint-fields)

[The ontologies Value Constraint Field](#the-ontologies-value-constraint-field)

[The classes Value Constraint Field](#the-classes-value-constraint-field)

[The branches Value Constraint Field](#the-branches-value-constraint-field)

[The valueSets Value Constraint Field](#the-valuesets-value-constraint-field)

[The literals Value Constraint Field](#the-literals-value-constraint-field)

[The defaultValue Value Constraint Field](#the-defaultvalue-value-constraint-field)

[Representing User Interface Rendering Specifications](#representing-user-interface-rendering-specifications)

[Template Rendering Information](#template-rendering-information)

[Template Element Rendering Information](#template-element-rendering-information)

[Template Field Rendering Information](#template-field-rendering-information)

[Attribute-Value Field Rendering Information](#attribute-value-field-rendering-information)

[Appendix A: JSON Schema](#appendix-a:-json-schema)

[Restricting Property Values](#restricting-property-values)

[Nesting JSON Schema specifications](#nesting-json-schema-specifications)

[Reusing JSON Schema specifications with $ref](#reusing-json-schema-specifications-with-$ref)

[Representing Arrays in JSON Schema](#representing-arrays-in-json-schema)

[Appendix B: JSON-LD](#appendix-b:-json-ld)

[JSON-LD @type Field](#json-ld-@type-field)

[JSON-LD @id Field](#json-ld-@id-field)

[JSON-LD @context Field](#json-ld-@context-field)

[Appendix C: Model Change Log](#appendix-c:-model-change-log)

[1.6.0](#1.6.0)

[1.5.0](#1.5.0)

[1.4.0](#1.4.0)

[1.3.0](#1.3.0)

[1.1.0](#1.1.0)

[Glossary](#glossary)

[References](#references)

# 

# Introduction {#introduction}

One of the main goals of the CEDAR project is to build an infrastructure for the creation and storage of machine-readable *metadata templates*. Metadata templates provide detailed definitions of the metadata that describes a particular data resource. 

In CEDAR, the metadata template describes both the structure and the semantics of that metadata. The CEDAR system uses metadata templates to create *metadata instances*, which describe specific instances of data resources. Users typically generate these metadata instances to annotate their data.

This document describes the metadata template model developed for the CEDAR project. This model provides a detailed specification for the representation of metadata template and metadata template instances. 

We first developed a template model to specify the key aspects of template construction \[EKAW2016\]. This model represents the core structural characteristics of templates—the common entities and compositional patterns that define a template. We then produced a concrete representation of the template model, emphasizing the addition of semantic markup and constraints. The concrete template model provides a consistent, interoperable information framework for defining templates and for creating and filling out metadata instances that correspond to those templates. Finally, we developed a set of tools for creating metadata templates and for acquiring metadata to generate metadata instances.

## Template Model {#template-model}

Our system aims to recursively compose templates from existing, more granular templates. In our model, we term these sub-templates *template elements*. Template elements constitute the building blocks of metadata templates. Template elements may contain one or more atomic pieces of information, such a text or date field, or may be recursively composed from other template elements. *Template fields* are used to represent these atomic pieces of metadata. For example, a template field could be used to indicate the date at which a measurement was made for a particular scientific experiment. Template elements are used to recursively combine template fields or template elements to create more complex descriptions. For example, template fields “Phone” and “Email” could be contained in a template element called “Contact Information”, which could itself be contained in a template element called “Person”.

![CEDAR-TemplateModel-UML-v5-schema.png][image1]  
**Figure 1\.** Schema Level of CEDAR’s Template Model

Figure 1 presents a basic overview of the schema level of the CEDAR template model. The Template, Template Element, and Template Field entities represent their namesake concepts. All entities have an @type field and are uniquely identifiable via an @id field. They also contain title and description fields. A variety of built-in template field types are provided. These include a Text Field, which represents a free text field, and a List Field, which represent a multiple-choice element. This set can be extended to incorporate additional field types. Both templates and template elements can optionally have fields or elements nested inside them. Template elements and fields can be grouped together in a Template to provide an overall description of a collection of metadata.

The template model also defines instances derived from templates, which we refer to as *template instances*. Template instances are created from template specifications. A template effectively serves as a schema specification for metadata instances conforming to that template. Figure 2 presents the instance level of the CEDAR template model. As with schema-level templates and elements, all template and element instances have an @id field, which uniquely identifies the instance. Template and element instances can also contain an optional @type field, which can contain one or more URIs that provide type information for the associated instance. Template field instances can have three subtypes: (1) literal fields, which contain literal values; (2) IRI fields, which contain IRI values, and (3) multiple value fields, which contain arrays of either literals or IRIs. Literal fields contain a literal value object that contains an @value field and an optional @type field. The @value field contains the raw literal value and the @type field contains one more datatypes for that literal (e,g., http://www.w3.org/2001/XMLSchema\#integer).  IRI value fields contain an IRI value object. In this case, an @id field is used to store the IRI value; the @type field can be used to optionally provide one or more types for that IRI.

![][image2]  
**Figure 2\.** Instance Level of CEDAR’s Template Model

The overall model provides an abstract structural specification of templates and instances. In the next section we will outline the development of a concrete representation of this model.

## Template Model Concrete Representation {#template-model-concrete-representation}

The template model requires a machine-interpretable representation for software systems to work with the model programmatically[^1]. This representation must meet a variety of goals. Primarily, it must describe the structure of templates and the instances generated from these templates. It must also describe and constrain the various relationships between the entities in the model. Template representations must be conveniently serializable so that they can be provided via REST APIs and persisted to storage media. Ideally, the representation should be based on standard formats so that existing tools can be used to manage model entities. The representation should also permit easy validation, and easy indexing to support search. To enable interoperation with controlled terms, a standardized means to annotate templates with controlled terms is key. Finally, the template format must interoperate with Linked Open Data technologies such as RDF and OWL, and allow metadata to be represented as RDF graphs.  
       
We identified two key JSON-based technologies can be combined to meet many of the goals outlined above—while retaining full interoperation with semantic resources: JSON Schema[^2] \[JSON SCHEMA\], and JSON-LD \[JSON-LD\][^3]. Both are supported by a large variety of Web-centric tools.

JSON Schema is a technology for describing and validating the structure of JSON data. Its directives—themselves represented as standard JSON elements—can be used to provide a structural description of any JSON document. JSON documents that are specified with JSON Schema can be structurally validated against their associated schemas via off-the-shelf tools.  
JSON Schema provides a structural specification only—it does not describe the semantics of JSON documents. A recent technology called JSON-LD (“Linked Data”) was developed to meet this goal. JSON-LD provides a lightweight syntax to add semantic annotations to JSON documents. The key goals of JSON-LD are to support the use of Linked Data in Web-based programming environments, to build interoperable Web services, and to store Linked Data in JSON-based storage engines. JSON-LD effectively allows JSON documents and their contents to be made available as Linked Data, offering the potential for machine-interpretable RDF semantics.

We first outline how we use JSON Schema to describe the structure of templates, template elements, and template fields and to constrain and validate the instances generated from those templates. We then show how we use JSON-LD to mark up these specifications, adding semantic content to the generated instances. We show how this combination of JSON Schema and JSON-LD provides the capabilities to fully represent the template model and to build a strong bridge to semantic technologies.

Throughout this document we will use the term *artifact* to refer generically to model entities—templates,  elements, fields, and template instances. We will use the term *schema artifact* to refer to artifacts that contain structural specifications—templates,  elements, and fields—and instance artifact to refer to entities generated from these specifications—currently, just template instances, though standalone element and field instances are not precluded by the model.

###  {#heading}

### Representing Artifact Provenance {#representing-artifact-provenance}

The CEDAR model defines provenance fields for artifacts. At present, seven core provenance fields are specified for artifacts. These are: 

| schema:name | This is a Schema.org field that is used to hold the user-supplied name of the artifact |
| :---- | :---- |
| schema:description | This is a Schema.org field that is used to hold the user-supplied description of the artifact |
| schema:schemaVersion | This is a Schema.org field that is used to hold the model version used when creating the artifact |
| pav:createdOn | This is a Provenance and Versioning Ontology (PAV) field that specifies a datetime-encoded value indicating when the artifact was created. |
| pav:createdBy | This is a PAV field that specifies a IRI-encoded value indicating who created the artifact. |
| pav:lastUpdatedOn | This is a PAV field that specifies a datetime-encoded value indicating when the artifact was last updated. |
| oslc:modifiedBy | This is an IRI-encoded field using an Open Services for Lifecycle Collaboration (OSLC) ontology term that specifies who updated the artifact last. |

The schema prefix identifies the Schema.org namespace [https://schema.org/](https://schema.org/), the pav prefix identifies the Provenance and Versioning Ontology namespace [http://purl.org/pav/](http://purl.org/pav/), and the oslc prefix identifies the Open Services ontology namespace [http://open-services.net/ns/core\#](http://open-services.net/ns/core#)[^4]. 

Two provenance fields that may optionally be present in artifacts are:

| schema:identifier | A user-specified identifier for an artifact |
| :---- | :---- |
| pav:derivedFrom | If an artifact was copied from another artifact this field identifies the URI of that artifact  |

Note that the JSON Schema title and description fields are also included in an artifact specification in addition to the Schema.org-based schema:name and schema:description fields. The JSON Schema field generally holds tool-generated information whereas the Schema.org-based fields hold user-supplied information.

Representing Schema Artifact Version Information  
CEDAR schema artifacts (i.e., templates, elements, and fields) can also be versioned. At present, instance artifacts are not versioned. The following fields are used to store version information:

| pav:version | This is a Provenance and Versioning Ontology (PAV) field that holds the version of the artifact. Follows Semantic Versioning best practices (https://semver.org/) |
| :---- | :---- |
| bibo:status | This is a Bibliographic Ontology publication status of the artifact. Currently, valid values are bibo:draft and bibo:published. |
| pav:previousVersion | This field identifies the artifact that this artifact was originally copied from, if any |

The bibo prefix identifies the Bibliographic Ontology namespace [http://purl.org/ontology/bibo/](http://purl.org/ontology/bibo/).

CEDAR artifacts are versioned following standard software artifact versioning practices. The bibo:status status field is used to indicate whether an artifact is in draft state (bibo:draft) or is published (bibo:published). Artifacts begin in a draft state and when finialized become published. A single new version can be derived from a published artifact, using the pav:previousVersion field to point to the previous version. Only a single new version can be derived from a published artifact so no version branching is allowed. A new artifact's version number must be later than the artifacts it is derived from and will begin in a draft state.

### Representing Artifact Structure Using JSON Schema {#representing-artifact-structure-using-json-schema}

With JSON Schema we define the structure of the primary artifacts in the CEDAR template model. We first outline its use to define the three core artifacts in the model: template fields, template elements, and templates. We then describe the structure of template instances that conform to the schema specification provided by templates.

#### Representing Template Fields {#representing-template-fields}

Template fields are used to describe an atomic piece of metadata. Informally, they correspond to a single field in a form, which when filled out contains a single value. In principle, a template field could be stored as a simple JSON property value, such as string or number. However, in many cases we would like the option to add additional metadata to describe template fields. At a minimum, we want users to record a name and description of each field. Hence, we use a JSON object to describe template fields.

The template field representation includes a value field, in addition to the other descriptive information. 

We use the JSON-LD @value field of type string to hold raw literal values. We also use the standard JSON Schema title and description fields to hold a name and description for the field.

For example, here is the definition of a Full Name template field, which contains the full name of a person as a single string[^5]:  
   
{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Full Name", "description": "Full name template field",  
  "properties": { "@value": { "type": "string" } },  
  "required": \[ "@value" \], "additionalProperties": false,  
  "schema:name": "Full Name",  
  "schema:description": "A person's full name",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn": "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}  
   
A conforming instance of this template field could look as follows:  
   
{ "@value": "John Smith" }

In some cases, we may add further type restrictions to literals. For example, if we know that the literal is an email address we can use the JSON Schema format keyword with type email to restrict the value.

For example, the specification for an email field could look as follows:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Email", "description": "Email template field",  
  "properties": { "@value": { "type": "string", "format": "email" } },  
  "required": \[ "@value" \], "additionalProperties": false,  
  "schema:name": "Email",  
  "schema:description": "An email address",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}

Similar format restrictions can be used for the number, date-time, ipv4, and ipv6 JSON Schema formats.

The CEDAR model also distinguishes literals values from IRI values. We use the JSON-LD @id field in place of the @value field to make this distinction.

For example, here is the definition of a Home Page template field, which contains the URL of a page:  
   
{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Home Page", "description": "Home page template field",  
  "properties": { "@id": { "type": "string", "format": "uri" } },  
  "required": \[ "@id" \], "additionalProperties": false,  
  "schema:name": "Home Page",  
  "schema:description": "Enter a home page URL",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn": "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}  
   
A conforming instance of this template field could look as follows:  
   
{ "@id": "https://example.com/home/JohnSmith.html" }

By default the schema:name field can effectively be treated as the question but in some cases customized questions are desirable. Template fields also support two additional optional fields that can be used to store question text that can be presented to users. To support this we allow template fields to contain the skos:prefLabel and skos:altLabel fields. The skos:prefLabel field can be used to store the default question text for a field that is presented to users; the skos:altLabel field can contain alternate question text that may optionally be presented.

For fields with an IRI value (i.e., those using an @id instead of a @value field to hold values) we support the presence of a field to hold a user-friend label for the IRI. We use the rdfs:label field to store this label. This field is optional and we also allow its value to be null. We also allow a field called skos:notation. This field can store values that may be intended for database storage. The JSON Schema field specification must indicate the requirement for these additional fields.

Here is the previous Home Page template field specification extended to allow field instances to contain the rdfs:label and skos:notation fields:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "title": "Home Page", "description": "Home page template field",  
  "type": "object",  
  "properties": {   
   "@id": { "type": "string", "format": "uri" },  
   "rdfs:label": { "type": \[ "string", null \] },  
   "skos:notation": { "type": \[ "string", null \] }  
  },  
  "required": \[ "@id" \], "additionalProperties": false,  
  "schema:name": "Home Page",  
  "schema:description": "Enter a home page URL",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}

#### Representing Template Fields with Multiple Values {#representing-template-fields-with-multiple-values}

Some fields can also contain multiple values. In the CEDAR model these multiple values are stored as an array of objects containing @value or @id fields.

For example, the content of a multi-value literal field that contains the strings "O1" and "O2" could be represented as follows:

\[ { "@value": "O1" }, { "@value": "O2" } \]

Similarly, the content of a multi-value IRI field that contains, say, the IRIs [http://example.com/A1](http://example.com/A1) and [http://example.com/A2](http://example.com/A1) could be represented as follows:

\[ { "@id": "http://example.com/A1", "rdfs:label": "A1" },   
  { "@id": "http://example.com/A2", "rdfs:label": "A2" } \]

JSON Schema has inbuilt support for indicating that the value of a JSON field can be an array (see Appendix A and Section 4.1.4 of \[JSON SCHEMA\]).

The template field schema to capture this representation could look as follows:

{  
 "$schema": "http://json-schema.org/draft-04/schema\#"  
 "title": "Home Pages", "description": "Home pages template field",  
 "type": "array", "minItems": 1,  
 "items": {  
  "type": "object",  
  "properties": {   
   "@id": { "type": "string", "format": "uri" },  
   "rdfs:label": { "type": \[ "string", null \] },  
   "skos:notation": { "type": \[ "string", null \] }  
  },  
  "required": \[ "@id" \], "additionalProperties": false,  
  "schema:name": "Home Page",  
  "schema:description": "Enter a home page URL",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
 }  
}

As can be seen, we use the JSON Schema array directive to indicate that the field values are stored in an array. We also indicate that the array must contain at least one item. Note that this approach allows each value object to contain provenance information.

#### Representing Template Elements {#representing-template-elements}

Template elements offer composition—they can include multiple template fields and/or template elements. Template elements are represented using an approach equivalent to the one used to represent template fields. Again, we specify that a template element must be represented as a JSON object. We can then restrict each nested template field or template element using nested JSON Schema specifications.

For example, the definition of an Investigator template element is shown below. It contains one nested template field called fullName.  
   
{  
 "$schema": "http://json-schema.org/draft-04/schema\#",  
 "title": "Investigator", "description": "Investigator element",  
 "type": "object",  
 "properties": {  
  "fullName": {  
   "type": "object",  
   "title": "Full Name", "description": "Full name template field",  
   "properties": { "@value": { "type": "string" } },  
   "required": \[ "@value" \], "additionalProperties": false,  
   "schema:name": "Full Name",  
   "schema:description": "A person's full name",  
   "schema:schemaVersion": "1.6.0",  
   "pav:version": "1.1.0",  
   "bibo:status": "bibo:released",  
   "pav:createdOn”: "2017-05-03T09:00:52-0700",  
   "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
   "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
   "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
  }  
 },  
 "required": \[ "fullName" \],   
 "additionalProperties": false,  
 "schema:name": "Investigator",  
 "schema:description": "The lead investigator of a project",  
 "schema:schemaVersion": "1.6.0",  
 "pav:version": "1.1.0",  
 "bibo:status": "bibo:released",  
 "pav:createdOn”: "2017-05-03T09:00:52-0700",  
 "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
 "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
 "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}  
   
As can be seen above, the template element specification requires that the nested fullName field is present in instances.

A conforming *template element* *instance* could look like the following:  
   
{   
  "fullName": { "@value": "Dr. P.I." },  
}

As with template fields, we do not require that element instances contain provenance fields.

#### Representing Templates {#representing-templates}

The representation of templates follows the same principles as template elements. Like template elements, templates can have nested element values and template elements. 

We require that conforming template instances contain a schema:isBasedOn field to identify the template to which they conform (where the schema prefix identifies the Schema.org namespace [https://schema.org/](https://schema.org/)). Instances of template must also include provenance fields. The schema specification for templates must include this requirement. A template's JSON Schema properties fields can be used to express these requirements as follows:

"properties": {   
  "schema:isBasedOn": { "type": "string", "format": "uri" },  
  "schema:name": { "type": "string", "minLength": 1 },  
  "schema:description": { "type": "string", },  
  "pav:createdOn": { "type": \["string", "null"\], "format": "date-time" },  
  "pav:createdBy": { "type": \["string", "null"\], "format": "uri" },  
  "pav:lastUpdatedOn": { "type": \["string", "null"\], "format": "date-time" },  
  "oslc:modifiedBy": { "type": \["string", "null"\], "format": "date-time" }  
},  
"required": \[ "schema:isBasedOn", "schema:name", "schema:description",  
              "pav:createdOn",  "pav:createdBy" "pav:lastUpdatedOn",  
              "oslc:modifiedBy" \],   
"additionalProperties": false

Note that with the exception of the schema:schemaVersion field we make all provenance fields required for template instances. With the exception of schema:isBasedOn, schema:name and schema:description fields, we also allow these provenance fields to be present with null values. Typically, these provenance fields are generated by server components so allowing nulls lets clients generate instances without values for these fields and still pass validation.

A complete template specification that contains a nested study title field and a nested principal investigator element could then look as follows:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "title": "Investigation", "description": "Investigation template",  
  "type": "object",  
  "properties": {  
    "schema:isBasedOn": { "type": "string", "format": "uri" },  
    "schema:name": { "type": "string", "minLength": 1 },  
    "schema:description": { "type": "string" }  
    "pav:createdOn": { "type":\["string", "null"\], "format": "date-time" },  
    "pav:createdBy": { "type":\["string", "null"\], "format": "uri" },  
    "pav:lastUpdatedOn": { "type":\["string", "null"\], "format": "date-time" },  
    "oslc:modifiedBy": { "type":\["string", "null"\], "format": "date-time" },  
    "studyTitle": { ... },  
    "pi": {... }  
  },  
  "required":   
    \[ "schema:isBasedOn", "schema:name", "schema:description",  
      "pav:createdOn", "pav:createdBy", "pav:lastUpdatedOn",  
      "oslc:modifiedBy", "studyTitle", "pi" \],  
  "additionalProperties": false,  
  "schema:name": "Investigation",  
  "schema:description": "An investigation",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:published",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}

Here is an example of a template instance conforming to the above template:  
   
{  
  "schema:isBasedOn": "[https://repo.metadatacenter.org/templates/43453](https://repo.metadatacenter.org/templates/43453)",  
  "schema:name": "Study",  
  "schema:description": "Study template instance",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98",  
  "studyTitle": { "@value": "Immune Biomarkers"  },  
  "pi": { "fullName": { "@value": "Dr. P.I." } }  
}

#### Representing Multiple Instances of Template Elements and Template Fields {#representing-multiple-instances-of-template-elements-and-template-fields}

The above specifications support the definition of nested template elements or element fields that contain exactly one instance of each. For example, only one principal investigator template element instance is allowed inside an investigation template instance. In many cases   
we would like items or elements to be capable of acquiring multiple instances at runtime.  
As mentioned earlier, JSON Schema has inbuilt support for indicating that the value of a JSON field can be an array (see Appendix A and Section 4.1.4 of \[JSON SCHEMA\]).

In the CEDAR template model, this approach can be used to indicate that that a template instance may contain, or must contain, multiple instances of nested template elements or template fields.

For example, we can extend the earlier investigation template to indicate that an investigation can have between 1 and 4 principal investigators as follows:

{  
  "title": "Investigation", "description": "Investigation template",  
  "type": "object",  
  "properties": {  
    "schema:isBasedOn": { "type": "string", "format": "uri" },  
    "schema:name": { "type": "string", "minLength": 1 },  
    "schema:description": { "type": "string" },  
    "pav:createdOn": { "type":\["string", "null"\], "format": "date-time" },  
    "pav:createdBy": { "type":\["string", "null"\], "format": "uri" },  
    "pav:lastUpdatedOn": { "type":\["string", "null"\], "format": "date-time" },  
    "oslc:modifiedBy": { "type":\["string", "null"\], "format": "date-time" },  
    "studyTitle": { ... },  
    "pi": {  
      **"type": array, "minItems" : 1, "maxItems" : 4,**  
      **"items" : {**  
        "type": "object",  
        "title": "Principal Investigator",  
        "description": "Principal investigator element",  
        ...  
      **}**  
    }  
  },  
  "required": \[ "schema:isBasedOn", "schema:name", "schema:description",  
      "pav:createdOn", "pav:createdBy", "pav:lastUpdatedOn",  
      "oslc:modifiedBy", "studyName", "pis" \],  
  "additionalProperties": false,  
  "schema:name": "Investigation",  
  "schema:description": "An investigation",  
  "schema:schemaVersion": "1.6.0",  
  "pav:version": "1.1.0",  
  "bibo:status": "bibo:released",  
  "pav:createdOn”: "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98",  
  "$schema": "http://json-schema.org/draft-04/schema\#"  
}

### Representing Artifact Semantics using JSON-LD {#representing-artifact-semantics-using-json-ld}

JSON Schema is useful for defining structural restrictions on JSON documents. It can also be used to specify basic type restrictions on field values. However, it provides a very basic set of built‑in type restrictions. It also does not provide a way to add additional types or to interoperate with types defined in external sources, such as RDF- or OWL-based ontologies.

As mentioned, JSON-LD \[JSON-LD\][^6] was developed to meet this goal. JSON-LD provides a lightweight syntax to add semantic annotations to JSON documents that can restrict the types and values of fields using terms from external vocabularies. Like JSON Schema, it adds some custom fields with well-known names to a JSON document to provide additional markup information.

JSON-LD provides three core fields to add semantic markup to JSON documents: @context, @type, and @id. The @context field is used to define prefixes for controlled vocabularies and to map JSON properties to controlled vocabularies; the @type field indicates the semantic type of a JSON object; the @id field gives a unique identifier to a JSON object instance. JSON-LD is used to mark up the structural specification to add semantic content to the CEDAR templates and instances. Essentially, JSON-LD is used to add type information to JSON-described content.

Here, for example, is a JSON-LD–enhanced template instance representing a study (with JSON-LD clauses in bold):  
   
{  
  **"@type": "http://semantic-dicom.org/dcm\#Study",**  
  **"@id": "https://repo.metadatacenter.org/template\_instances/55417",**  
  **"@context": {**  
    **"rdfs": "http://www.w3.org/2000/01/rdf-schema\#",**  
    **"xsd": "http://www.w3.org/2001/XMLSchema\#",**  
    **"pav": "http://purl.org/pav/",**  
    **"schema": "http://schema.org/",**  
    **"oslc": "http://open-services.net/ns/core\#",**  
    **"schema:isBasedOn": { "@type": "@id" },**  
    **"schema:name": { "@type": "xsd:string", "minLength": 1 },**  
    **"schema:description": { "@type": "xsd:string" },**  
    **"pav:createdOn": { "@type": "xsd:dateTime" },**  
    **"pav:createdBy": { "@type": "@id" },**  
    **"pav:lastUpdatedOn": { "@type": "xsd:dateTime" },**  
    **"oslc:modifiedBy": { "@type": "@id" },**  
    **"studyTitle": "https://schema.org/title",**  
    **"pi": "https://mycompany.org/property/hasPI"**  
  **},**  
  "studyTitle": { "**@value**": "Immune biomarkers study" },  
  "pi": {  
    **"@type": "https://schema.org/Person",**  
    **"@id": "https://repo.metadatacenter.org/element\_instances/88417",**  
    **"@context": { "fullName": "https://schema.org/name" },**  
    "fullName": { "**@value**": "Dr. P.I" }  
  },  
  "schema:isBasedOn": "https://repo.metadatacenter.org/templates/4353",  
  "schema:name": "Study",  
  "schema:description": "Study template instance",  
  "pav:createdOn": "2017-05-03T09:00:52-0700",  
  "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
  "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
  "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}  
   
Note that we have added JSON-LD @context, @type, and @id fields to provide semantic markup. The @context field ensures that properties are mapped to properties in controlled vocabularies. The @context specification does a full mapping of prefixes to namespaces for all CEDAR model prefixes and also specifies their datatypes. The @type field indicates the semantic type of the instance, which in the case above is the Study class in the Radiation Oncology Ontology. Finally, the @id field gives a unique identifier to the instance.

The JSON Schema specification can ensure that conforming instances are marked up with JSON-LD, both by demanding that specific fields are present and by restricting the content of those fields. 

If we want to enforce that the @type field is contained in the instance and uses a specific IRI we can do so as follows:

"properties": { "@type": { "enum": \["http://semantic-dicom.org/dcm\#Study"\] }}

If we want to enforce that the @id field is contained in the instance and contains an IRI we can do so as follows:

"properties": { "@id": { "type": "string", "format": "uri" }}

The @context field is far more complex but can be declaratively specified as follows:

"properties": {  
 "@context": {  
  "type": "object",  
  "properties": {  
   "rdfs": { "type": "string", "format": "uri",  
            "enum": \[ "http://www.w3.org/2000/01/rdf-schema\#" \] },  
   "xsd": { "type": "string", "format": "uri",  
            "enum": \[ "http://www.w3.org/2001/XMLSchema\#" \] },  
   "pav": { "type": "string", "format": "uri",  
            "enum": \[ "http://purl.org/pav/" \] },  
   "schema": { "type": "string", "format": "uri",  
               "enum": \[ "http://schema.org/" \] },  
   "oslc": { "type": "string", "format": "uri",  
             "enum": \[ "http://open-services.net/ns/core\#" \] },  
   "skos": { "type": "string", "format": "uri",  
             "enum": \[ "http://www.w3.org/2004/02/skos/core\#" \] },  
   "schema:isBasedOn": { "type": "object",  
     "properties": { "@type": { "type": "string", "enum": \["@id"\] }}},  
   "schema:name": { "type": "object",  
     "properties": { "@type": { "type": "string", "enum": \["xsd:string"\] }}},  
   "schema:description": { "type": "object",  
     "properties": {"@type": { "type": "string", "enum": \["xsd:string"\] }}},  
   "pav:createdOn": { "type": "object",  
     "properties": {"@type": { "type": "string", "enum": \["xsd:dateTime"\] }}},  
   "pav:createdBy": { "type": "object",  
     "properties": {"@type": { "type": "string", "enum": \[ "@id" \] }}},  
   "pav:lastUpdatedOn": { "type": "object",  
    "properties": {"@type": { "type": "string", "enum": \["xsd:dateTime"\] }}},  
   "oslc:modifiedBy": { "type": "object",  
     "properties": { "@type": { "type": "string", "enum": \["@id"\] }}},  
   // Nested element and field IRI mappings here  
  },  
  "required": \[ "rdf", "xsd", "pav", "schema", "oslc", "schema:isBasedOn",  
    "schema:name", "schema:description", "pav:createdOn", "pav:createdBy",  
    "pav:lastUpdatedOn", "oslc:modifiedBy"  
  \], "additionalProperties": false  
 }  
}

The above schema specification is basically requiring that a template instance contains the following context definition:

"@context": {  
    "rdfs": "http://www.w3.org/2000/01/rdf-schema\#",  
    "xsd": "http://www.w3.org/2001/XMLSchema\#",  
    "pav": "http://purl.org/pav/",  
    "schema": "http://schema.org/",  
    "oslc": "http://open-services.net/ns/core\#",  
    "schema:isBasedOn": { "@type": "@id" },  
    "schema:name": { "@type": "xsd:string" },  
    "schema:description": { "@type": "xsd:string" },  
    "pav:createdOn": { "@type": "xsd:dateTime" },  
    "pav:createdBy": { "@type": "@id" },  
    "pav:lastUpdatedOn": { "@type": "xsd:dateTime" },  
    "oslc:modifiedBy": { "@type": "@id" }  
}

Note that nested elements and fields will imply additional context specifications to ensure property assignments are made. For example, if a template contains a studyTitle field and we would like to map that name to the IRI https://schema.org/title we can add it to the template context definition as follows:

"@context": {  
  "properties": {  
     ...  
     "studyTitle": { "enum": \[ "https://schema.org/title" \]  
  }  
}

This restriction forces instances conforming to the template to contain the following property assignment in their context definition:

    "studyTitle": "https://schema.org/title"

Coupled with the type assignment to templates, elements and fields, this property assignment allows relationships between nested elements and fields to be mapped to controlled terms. 

The overall template specification also makes the @context, @type, and @id fields required to ensure that instances are self descriptive.

For example, here is a JSON Schema template specification for the above study instance with clauses (marked in bold) ensuring that conforming instances carry appropriate JSON-LD markup (we elide the full context definition for brevity):  
   
{  
 "$schema": "http://json-schema.org/draft-04/schema\#",  
 "title": "Study", "description": "Study template",  
 "@type": "https://repo.metadatacenter.org/core/Template",  
 "@id": "https://repo.metadatacenter.org/templates/4353",  
 "properties": {  
   "schema:isBasedOn": { "type": "string", "format": "uri" },  
   "schema:name": { "type": "string", "minLength": 1 },  
   "schema:description": { "type": "string", "minLength": 1 }  
   "pav:createdOn": { "type":\["string", "null"\], "format": "date-time" },  
   "pav:createdBy": { "type":\["string", "null"\], "format": "uri" },  
   "pav:lastUpdatedOn": { "type":\["string", "null"\], "format": "date-time" },  
   "oslc:modifiedBy": { "type":\["string", "null"\], "format": "date-time" },  
   **"@type": { "enum": \[ "http://semantic-dicom.org/dcm\#Study" \] },**  
   **"@id": { "type": "string", "format": "uri" },**  
   **"@context": {**  
     **"properties": {**  
       **...**  
       **"studyTitle": { "enum": \[ "https://schema.org/title" \] },**  
       **"pi": { "enum": \[ "https://mycompany.org/property/hasPI" \] }**  
     **},**  
     **"required":  \[ ..., "studyTitle", "pi" \], "additionalProperties": false**  
   **},**  
   "studyTitle": { ... },  
   "pi": { ... }  
 },  
 "required":  
   \[ "schema:isBasedOn", "schema:isBasedOn", "schema:name",  
     "schema:description", "pav:createdOn", "pav:createdBy",   
     "pav:lastUpdatedOn", "oslc:modifiedBy",  
     **"@context", "@type", "@id"**, "studyTitle", "pi" \],  
 "additionalProperties": false,  
 "schema:name": "Study",  
 "schema:description": "A clinical study",  
 "schema:schemaVersion": "1.6.0"  
 "pav:version": "1.1.0"  
 "bibo:status": "bibo:published"  
 "pav:createdOn": "2017-05-03T09:00:52-0700",  
 "pav:createdBy": "https://metadatacenter.org/users/8d787b98",  
 "pav:lastUpdatedOn": "2017-05-03T09:00:52-0700",  
 "oslc:modifiedBy": "https://metadatacenter.org/users/8d787b98"  
}  
   
As can be seen in this example, the JSON Schema template specification can ensure that template instances contain a significant amount of JSON-LD–encoded type information. Here, we are forcing the @context, @type, and @id fields in an instance to carry specific controlled terms. These instances can be automatically checked for conformance against the template specification. This use of JSON Schema is completely standard and instance validation can be performed with off-the-shelf tools. We also developed a JSON Schema-based validation schema that can be used to validate template, elements, and fields \[CEDAR-SCHEMA\].

### Representing Additional Artifact Metadata using JSON-LD {#representing-additional-artifact-metadata-using-json-ld}

The CEDAR model requires some basic metadata for CEDAR artifacts, such as the name of the artifact (schema:name), its version (schema:schemaVersion), and its creator (pav:createdOn)[^7]. However, sometimes these basic metadata fields are not enough. In some cases, users need to attach additional metadata to their artifacts. Some examples of these additional metadata can be the identifier used to refer to the artifact in an external system, the identifier of the organization that developed the artifact, and the name of the project where the artifact is being used. 

To allow users to add custom metadata to CEDAR artifacts, the CEDAR model provides support for additional metadata fields in Templates, Elements, and Fields. These additional metadata are represented as part of an optional, nested object at the root level of the artifact’s JSON Schema specification, defined using the JSON-LD keyword @nest. By using @nest, JSON-LD processors will ignore the nesting and will process the contents as if they were created directly within the containing object, that is, at the root level of the artifact’s JSON Schema, where all the other artifact metadata are declared. In our model, values for the metadata fields in the @nest object are optional and are specified using any of the six accepted JSON data types (i.e., string, number, boolean, null/empty, object, and array).

For example, here is a JSON Schema Template specification for a *Study*, with a custom metadata field *protocol ID*, which captures an array of protocol identifiers associated with the template. Note that the *required* field does not contain a @nest value, because these additional metadata fields are optional.

{  
  "schema:name": "Study",   
  "@id": "https://repo.metadatacenter.org/templates/ee2f28",  
  "@context": {  
    ...  
    **"protocol ID": "https://schema.metadatacenter.org/properties/c80ace7"**  
  },  
  ...  
  **"@nest": {**  
    **"protocol ID": \["0904", "0374", "1232"\]**  
  **},**  
  "required": \[  
    "@context",  
    "@id",  
    "schema:isBasedOn",  
    "schema:name",  
    "schema:description",  
    "pav:createdOn",  
    "pav:createdBy",  
    "pav:lastUpdatedOn",  
    "oslc:modifiedBy",  
    "studyTitle"  
  \],  
  ...  
}

Here is the representation of the additional metadata (protocol identifiers) from the previous example expressed in RDF syntax. The example shows how there is no intermediate node between the template and the protocol ids associated to it. Because we used @nest, the JSON processor understands that the fields defined inside the @nest object refer to properties of the containing object (the template).

...  
\<https://repo.metadatacenter.org/templates/ee2f28\>  
\<https://schema.metadatacenter.org/properties/c80ace7\> "0374" .  
\<https://repo.metadatacenter.org/templates/ee2f28\>  
	\<https://schema.metadatacenter.org/properties/c80ace7\> "0904" .  
\<https://repo.metadatacenter.org/templates/ee2f28\>  
\<https://schema.metadatacenter.org/properties/c80ace7\> "1232" .  
...

### Representing Instances as RDF

Note that CEDAR's JSON-LD instance representation can be automatically converted to an RDF representation. Here, for example, is a Turtle representation of the above study template instance:

\<https://repo.metadatacenter.org/template\_instances/55417\>  
  a \<http://semantic-dicom.org/dcm\#Study\> ;  
  schema:name "Immune biomarkers" ;  
  schema:description "Metadata about an immune biomarkers study" ;  
  schema:isBasedOn \<https://repo.metadatacenter.org/template/4343\> ;  
  oslc:modifiedBy \<https://repo.metadatacenter.net/users/6d21a887\> ;  
  pav:createdBy \<https://repo.metadatacenter.net/users/6d21a887\> ;  
  pav:createdOn "2016-06-29T10:58:26-0700"^^xsd:dateTime ;  
  pav:lastUpdatedOn "2016-06-29T10:58:26-0700"^^xsd:dateTime ;  
  myschema:hasStudyTitle "Immune biomarkers study" ;  
  myschema:hasPI \[  
    a \<https://schema.org/Person\> ;  
    schema:name "Dr. P.I";  
    schema:address "Stanford, CA 94305, USA"  
  \] .

## Expressing Field Value Constraints {#expressing-field-value-constraints}

JSON Schema allows us to express a very limited set of value constraints. We can, for example, state that the value of a field should be a particular value, or selected from a set of values. We can also restrict a field value to be of a particular type or format. 

In CEDAR, we require more advanced constraints on field values that we want to come from controlled terminologies. For example, we may specify that the value of a field should be the IRI of a class in a particular ontology. 

There are four main constraint types provided by CEDAR. We want to encode the constraints on the possible values for a particular field to (1) specific ontology classes, (2) ontology branches, (3) classes from specific ontologies, and (4) value sets, which are simple collections of values. Where a constraint is a collections of values, individual values may be excluded from consideration. 

The possible values of a field could also be composed of some combination of the above four constraint types; the union of all the constraints is used as the set of values that may be entered by the user. 

Additional constraints may be placed on numeric or string field values. The field called \_valueContraints is used to express all constraints that cannot be represented directly in JSON Schema.

### The \_valueConstraints field {#the-_valueconstraints-field}

A \_valueConstraints field that is contained inside a template field. The \_valueConstraints field will have four possible array subfields for the four types of value sources (ontologies, classes, branches, and value sets) and and additional array field containing specifications for literal values. This field can also indicate whether the field is a multi-choice field, whether a value is required or not, and may also contain a default value. Other options include restrictions for numeric and string fields.  

The overall JSON format adopted is as follows:  
   
{  
  "\_valueConstraints": {  
    "requiredValue": true | false,  
    "multipleChoice": true | false,  
    "numberType": "xsd:integer" | ...,  
    "unitOfMeasure": "...",  
    "minValue":   
    "maxValue":   
    "decimalPlaces":   
    "minLength":   
    "maxLength":   
    "temporalType": "xsd:date" | "xsd:dateTime" | "xsd:time",  
    "ontologies": \[ ... \],  
    "valueSets": \[ ... \],  
    "classes": \[ ... \],  
    "branches": \[ ... \],  
    "literals": \[ ... \],  
    "defaultValue": "..."  
  }  
}  
   
These fields are now explained in turn.

#### General Value Constraint Fields {#general-value-constraint-fields}

Boolean field requiredValue indicates whether a value is required for a field. A boolean multipleChoice field indicates if more than one answer is acceptable for a field.

String-based fields may have properties minLength and maxLength that indicate minimum and maximum lengths for strings.

#### Numeric Value Constraint Fields {#numeric-value-constraint-fields}

Numeric fields can contain a field called numberType in the  \_valueConstraints object indicating the field datatype and a unitOfMeasure field indicating the associated units. Numeric fields can also contain fields called minValue and maxValue to indicate minimum and maximum values for numeric fields. Floating point fields can also contain a decimalPlace field specifying the number of decimal places displayed.

#### Temporal Value Constraint Fields {#temporal-value-constraint-fields}

Temporal fields can contain a field called temporalType in the  \_valueConstraints object. Three temporal types are currently supported: xsd:date, xsd:dateTime, and xsd:time.

#### The ontologies Value Constraint Field {#the-ontologies-value-constraint-field}

This field contains a set of ontologies from which controlled terms can be selected. In stores an array of IRIs of ontologies, together with an acronym and short name for each specified ontology.

The following example shows an ontologies value constraint that specifies that field values should come only from the MEDDRA and RXNORM ontologies:  
                  
"ontologies": \[  
  {  
   "uri": "http://bioportal.bioontology.org/ontologies/MEDDRA",  
   "acronym": "MEDDRA",  
   "name": "Medical Dictionary for Regulatory Activities Terminology"  
  },  
  {  
   "uri": "http://bioportal.bioontology.org/ontologies/RXNORM",  
   "acronym": "RXNORM",  
   "name": "RxNorm Vocabulary"  
  }  
\]

#### The classes Value Constraint Field {#the-classes-value-constraint-field}

A common use case is to constrain the values of a field to a predefined set of classes, not necessarily from the same ontology. For example, to constrain the possible values for a field called studyType to one of the classes “Observational Study” (http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#C16084) from the NCIT ontology and “Longitudinal Study” (http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#Longitudinal\_Study) from the SYN ontology one can do the following:  
   
{  
 "studyType": {  
  ...  
  "\_valueConstraints": {  
   "classes": \[  
    {  
     "uri": "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#C16084",  
     "label": "Observational",  
     "default": true  
    },  
    {  
     "uri": "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#Longitudinal\_Study",  
     "label": "Longitudinal",  
     "default": false  
    }  
   \],  
   "multipleChoice": false  
  }  
 }  
}

#### The branches Value Constraint Field {#the-branches-value-constraint-field}

The branches field is analogous to the ontologies field, but restricts values to branches within ontologies.

Hers is an example that restricts the possible values to classes in branches rooted in assay classes in the Ontology of Biomedical Investigation and in the GALEN ontology.

{  
  "\_valueConstraints": {  
    "branches": \[  
     {  
    	  "uri": "http://purl.obolibrary.org/obo/OBI\_0000070",  
        "maxDepth": 3,  
   	  "includesRoot": false  
     },  
     {  
    	  "uri": "http://www.co-ode.org/ontologies/galen\#Assay",  
   	  "includesRoot": false  
     }      
    \],  
    "multipleChoice": true  
  }  
}

#### The valueSets Value Constraint Field {#the-valuesets-value-constraint-field}

This field constrains the accepted values to one of several classes from particular value sets. 

The following example shows a value set constraint that specifies that field values should come only from the ACE Inhibitor or ARB  and ADHD Medications NLM value sets:

{  
  "\_valueConstraints": {  
    "valueSets": \[  
     {  
      "name": "ACE Inhibitor or ARB",  
      "vsCollection": "http://data.bioontology.org/ontologies/NLMVS",  
      "uri": "http://purl.bioontology.org/ontology/NLMVS/2.16.32",  
      "numTerms": 3  
     },  
     {  
      "name": "ADHD Medications",  
      "vsCollection": "http://data.bioontology.org/ontologies/NLMVS",  
      "uri": "http://purl.bioontology.org/ontology/NLMVS/2.16.840",  
      "numTerms": 33  
     }  
    \]  
  }  
}

#### The literals Value Constraint Field {#the-literals-value-constraint-field}

This field constrains the accepted values to one or several string literals. 

The following example shows a literals constraint that specifies that field values should come only from the values “Germany”, “France”, and “UK”:

{  
  "\_valueConstraints": {  
    "literals": \[  
     {  
      "label": "Germany"  
     },  
     {  
      "label": "France"  
     },  
     {  
      "label": "U.K."  
     }  
    \]  
  }  
}

Each option within a literal choice can also have an optional boolean field called selectedByDefault. When present and set to true this field indicates that this option is selected when presented.

#### The defaultValue Value Constraint Field {#the-defaultvalue-value-constraint-field}

This field can be used to store the default value for string- and URI-based fields. 

For string-based fields the value is simply stored as a string. For example, of the default value for a field is "Yes" it would be stored as follows:

"defaultValue": "Yes"

For URI-based fields the type of the value is stored in a field called type. Possible values are "Value" or "OntologyClass". The default URI is stored in a field called termURI; the source ontology for the term is contained in a field called sourceURI.

"defaultValue": {  
    "type": "Value" | "OntologyClass",  
    "sourceUri": \<URI\>,  
    "termUri": \<URI\>  
}

## Representing User Interface Rendering Specifications {#representing-user-interface-rendering-specifications}

CEDAR’s templates can also contain markup that can drive knowledge acquisition tools. This markup has no effect on the semantics of templates, elements, or fields. It is used at design time to indicate rendering preferences when displaying templates, and at instance population time to specify types of user interface elements that should be used when generating instances from templates.

In a CEDAR template all user interface markup is contained in a field called \_ui. This field is present in templates, template elements, and field elements. Instances do not contain this user interface field. The associated template is used to indicate how populated instances are displayed. The user interface field contains no modeling information \- it specifies rendering choices only.

### Template Rendering Information {#template-rendering-information}

CEDAR templates contain an ordered collection of template elements and fields. Since JSON Schema does not have directives to specify field ordering we store this order in the \_ui field. We use a field called order to store this information. This field contains an array containing the names of the enclosed fields and elements, with the order following the array order.

Since a template can have multiple pages and each page can contain a mixture of template elements and fields, a pages specification is also needed. A field call pages contains the information. This field contains a two-dimensional array. The first dimension stores the page ordering. Each element in this array stores the order of template elements and fields on a page.

A field called propertyLabels is used to map JSON field names to customized display names for the enclosing template or element. It contains a map of JSON field names to display names. Similarly, an optional field called propertyDescriptions is used to customize field descriptions. 

The optional fields header and footer are used to specify header and footer information for the template. The header and the footer will be displayed by the metadata acquisition tool when rendering the template.

For example, a template containing two pages, each of which has two template elements or fields could look as follows:

"\_ui": {  
  "order": \[  
    "principalInvestigator", "study", "contactInformation", "institution"  
  \],  
  "pages": \[  
    \[ "principalInvestigator", "study" \],  
    \[ "contactInformation", "institution" \]  
  \],  
  "propertyLabels": {  
    "name": "PI Name"  
  },  
  "propertyDescriptions": {  
    "name": "Enter the name of the PI"  
  },  
  "header": "This template should be filled out by the Principal Investigator",  
  "footer": "This template must be used without any changes to the questions or to the order of questions. To suggest any changes, please contact john.doe@acme.com"  
}

### Template Element Rendering Information {#template-element-rendering-information}

As with a template, a template element can have nested fields and elements so we also need an order field to indicate their order. Template elements are not paged so a pages field is not needed. Like templates, elements can optionally contain propertyLabels and propertyDescriptions fields, as well as header and footer fields.

Here is an example of a \_ui field for a template element:

"\_ui": {  
  "order": \[ "name", "description" \],  
  "propertyLabels": {  
    "address": "Address"  
  },  
  "propertyDescriptions": {  
    "address": "An address"  
  }  
}

### Template Field Rendering Information {#template-field-rendering-information}

Every field has an inputType field that indicates the type of user interface element that can be used to display the field. 

The current possible core field types are textfield, textarea, radio, checkbox, temporal, email, list, numeric, phone-number, section-break, richtext, image, link, and youtube.

Finally, a field called valueRecommendationEnabled indicates whether the field's value should be used for CEDAR's intelligent authoring facilities.

Here is an example \_ui field for a text field: 

"\_ui": {  
  "inputType": "textfield",  
  "valueRecommendationEnabled": true  
}

A template field can also be indicated as hidden, in which case the field will not be rendered in an acquisition tool. An optional boolean-valued field called hidden can be used inside the \_ui object to indicate this state. In general, hidden fields must have a default value specified via an appropriate value constraint on the field.   
If the field input type is indicated as temporal then a specific temporal type must be specified in the associated \_valueConstraints section. A field called temporalType must be present in this section if the input type is temporal. Current possible values are xsd:time, xsd:date, and xsd:dateTime. 

For these three temporal types, a matching temporalGranularity field must also be present in the field's \_ui section. This field indicates the finest granularity at which temporal information should be acquired and displayed. Possible values are year, month, day, hour, minute, second, and decimalSecond. Irrespective of the values of these granularity fields, the actual stored time, date, or datetime value in the field instance must follow the  [XML Schema Datatype specification](https://www.w3.org/TR/xmlschema-2/), meaning that padding of values  may be required. For example, if a finest granularity of month is specified for a date field and a user enters 1999-12 that value must be padded to, say 1999-12-01 to ensure that the stored value satisfies the specification of xsd:date values.

Two additional fields can be added to a temporal field's \_ui section to control display and acquisition: timeZoneEnabled and inputTimeFormat. The timeZoneEnabled field is boolean and indicates if time zone information should be acquired and displayed for the field. The inputTimeFormat field is currently used to indicate whether a 24-hour or 12-hour clock is to be used to display and acquire time. Possible values are 12h and 24h, respectively.

Here is an example \_ui and \_valueConstraints specification for a datetime field that uses a 24-hour clock, has a finest granularity of days, and displays and acquires time zone information:

"\_ui": {  
   "inputType": "temporal",  
   "temporalGranularity": "day",  
   "inputTimeFormat: "24h",  
   "timeZoneEnabled": true  
},  
"\_valueConstraints": {  
   "temporalType": "xsd:dateTime"  
}

### Attribute-Value Field Rendering Information {#attribute-value-field-rendering-information}

CEDAR also supports a type of field attribute-value fields, which allow users to dynamically add fields to a template instance in a controlled way.

For example, if we'd like users to be able to add new fields in a particular place in the form we can position an attribute-value field in the desired location in the enclosing template or element. 

Since we cannot directly specify a JSON Schema specification for an instance field whose name is not known we need a level of indirection for these types of fields. Basically, the field specification for an attribute-value field specifies an array that will contain the user-defined attribute names in an instance. This array will contain an (implicitly) ordered list of attribute field names. We then use a JSON Schema additionalProperties specification to indicate how the values of such fields must appear in the instance.

For example, a field specification for an attribute-value field called "My User-Defined Fields" would look as follows:

"My User-Defined Fields": {  
   "type": "array",  
   "minItems": 0,  
   "items": {  
      "@type": "https://schema.metadatacenter.org/core/TemplateField",  
      "@id": "https://repo.metadatacenter.org/template-fields/7ee0",  
      ...  
      "\_ui": { "inputType": "attribute-value" },  
      "\_valueConstraints": { "requiredValue": false },  
      "type": "string"  
      ...  
  }  
}

Here we have a field type of attribute-value. The schema specifies that the instance contains a field called "My User-Defined Field" which is an array of strings. These string store the names and (implicitly) the order of the attribute fields added to instances. We do NOT add the attribute-value field name to the enclosing template or element required field because a field of this name will not actually appear in the instances \- the user will be specifying the names of attribute fields in the instance itself.

For example, a template instance with two attribute fields defined using the "My User-Defined Fields" attribute-value field with the names "Name" and "Alias" would have an entry as follows:

"My User-Defined Fields": \[ "Name", "Alias" \]

We can use an additionalProperties specification on enclosing templates and elements as follows to allow new attribute fields to appear in the instances:

"additionalProperties": {  
  "type": "object",  
  "properties": {  
    "@value": { "type": \[ "string", "null" \] },  
    "@type": { "type": "string", "format": "uri" }  
   },  
   "required": \[ "@value" \],  
   "additionalProperties": false  
}

Any attribute fields in an instance must follow this specification. They will look like a normal fields.

Note that here the source field specification in the schema is not actually used to specify the format of the field instance \- instead, the additionalProperties specification is. The source field specification is however could be used for value constraints, for example.

A template instance with values for the above attribute fields "Name"  and "Alias" could look as follows:

"My User-Defined Fields": \[ "Name", "Alias" \],  
"Name": { "@value": "Fredrick" },  
"Alias": { "@value": "Fred" }

Templates and elements can contain an unlimited number of attribute-value fields. Similarly, instances can contain an unlimited number of fields derived from a particular attribute-value field specification.  In an instance, the name of an attribute-value field must be present in the associated attribute-value field array. This name can be used to resolve the source attribute-value field specification in the template and thus allow disambiguation.

At present only string values are allowed in attribute-value fields. This value can optionally be typed using a JSON-LD @type specification.

Note that when a user adds a new attribute-value field an @context entry must be made in the instance for that field (and removed when an attribute-value field is removed). This entry will allow users to label these fields with RDF properties, thus allowing the fields and their values to appear as first class entities when generating RDF.

# Appendix A: JSON Schema {#appendix-a:-json-schema}

JSON Schema is a technology for describing and validating the structure of JSON data \[JSON SCHEMA\]. Its directives—themselves represented as standard JSON elements—can be used to provide a structural description of any JSON document. JSON documents that are specified with JSON Schema can be structurally validated against their associated schemas via off-the-shelf tools.

JSON Schema provides a set of directives to describes the structure of a JSON document. A JSON Schema specification contains a set of JSON Schema directives and is represented as a standard JSON document. A JSON Schema description is specified as a JSON object. The presence of a top-level field named $schema in a JSON object signals that it is a JSON Schema specification. The value of this field identifies the particular version of the JSON Schema specification that is being used. 

A type field indicates the required type of the conforming JSON object. The possible value for this field are the core JSON types: object, array, string, boolean, numeric, and null. JSON Schema description objects can also optionally contain title and a description fields, which are descriptive only.

Here is a minimal JSON Schema description:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Minimal JSON Schema",  
  "description": "Minimal JSON Schema specification"  
}

The core JSON Schema directive is represented using a field called properties. This directive describes the fields that a conformant JSON object might or must have, together with associated sub-schema that constrain the values of these fields. The various fields in a schema and restrictions on them are listed in the properties field. The field names and their type information can be specified at this level. 

As associated field called required is used to signal if those fields are required in a conforming JSON document. An additionalProperties Boolean field can also be included to indicate whether properties beyond those listed in the properties field can be included in a conforming instance data.

Here is a JSON Schema description for an empty JSON document:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Empty JSON Schema",  
  "description": "An empty JSON Schema specification",  
  "properties": {},  
  "required": \[\],  
  "additionalProperties": false  
}

This schema description specifies a JSON object that must not contain any fields. The only conforming JSON instance will be an empty object, i.e., it will be: {}.

The field values are in turn specified using JSON Schema.

For example, a schema description for a simple JSON object representing a basic study design, which has two required fields called  briefTitle and principalInvestigatorName, can be specified in JSON Schema as follows:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Basic study design",  
  "description": "Basic study design JSON Schema specification",  
  "properties": {  
    "briefTitle": { "type": "string" },  
    "principalInvestigatorName": { "type": "string" }  
  },  
  "required": \[ "briefTitle", "principalInvestigatorName" \],  
  "additionalProperties" : false  
}

The above definition indicates that in any JSON document that follows this schema, briefTitle and principalInvestigator must be present and contain JSON strings, even if their values are empty. The field additionalProperties is false, which means that properties other than those listed in properties are not allowed. A conforming instance could look as follows:

{  
  "briefTitle": "A Big Study",  
    "principalInvestigatorName": "Dr. P.I."  
}

## Restricting Property Values  {#restricting-property-values}

In addition to restricting the type of a property, JSON Schema can also be used to restrict the values that a property can take. A JSON Schema field called enum can be used in a property definition directive to specify this value restriction. This field must have a value that is an array with at least one element, where each element is unique. The values in this array effectively specify the allowed values for the field.

For example, let’s suppose that we would like a JSON object with a single required field called language and would like to restrict the possible values of that field to one of the strings “English” and “Spanish”. This can be achieved using the following schema:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
    "type": "object",  
  "title": "Language type",  
  "description": "Language type JSON Schema specification",  
  "properties": {  
    "language": {  
      "type": "string",  
      "enum": \[ "English", "Spanish" \]   
    }  
  },  
  "required": \[ "language" \],  
  "additionalProperties": false  
}

A conforming JSON document fragment would be:

{  
  "language": "English",  
}

An array with a single element can be used to restrict a field to a single value. For example, if we would like to specify that the above language field should only contain the language “English” we can simply specify that language as the single value in the array  (i.e., "enum" : \["English"\]).

## Nesting JSON Schema specifications {#nesting-json-schema-specifications}

As mentioned, field definitions inside a JSON Schema specification can themselves contain JSON Schema specifications, which effectively allows JSON Schema specification to be nested to arbitrary depths. For example, if we wish to indicate that the principal investigator named in the previous study design Schema is actually a compound object containing forename and surname fields we can express this as follows:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Basic study design",  
  "description": "Basic study design JSON Schema specification",  
  "properties": {  
    "briefTitle": { "type": "string" },  
    "principalInvestigatorName":   
    {   
      "type": "object",  
      "properties": {  
        "forename": { "type": "string" },  
        "surname": { "type": "string" }  
      },  
      "required": \[ "forename", "surname" \],  
      "additionalProperties" : false  
    }  
  },  
  "required": \[ "briefTitle", "principalInvestigatorName" \],  
  "additionalProperties" : false  
}

As can be seen above, it is not necessary to repeat the $schema field inside nested elements. An instance conforming to the above specification would look as follows:

{  
  "briefTitle": "A Big Study",  
    "principalInvestigatorName": {  
    "forename": "Patrick",  
    "surname": "O’Bannion"   
  }  
}

## Reusing JSON Schema specifications with $ref {#reusing-json-schema-specifications-with-$ref}

To support the reuse of schema specifications, JSON Schema also includes a $ref directive. This directive can be used to refer to external JSON Schema descriptions. For example, instead of inlining the principal investigator name specification inside the study design specification, we can separately define the the principal investigator name and use the $ref directive to refer to it inside the study design specification:

{  
  "principalInvestigatorName": {   
    "$schema": "http://json-schema.org/draft-04/schema\#",  
    "type": "object",  
    "title": "Principal Investigator Name",  
    "description": "Principal investigator name JSON Schema specification",  
    "properties": {  
      "forename": { "type": "string" },  
      "surname": { "type": "string" }  
    },  
    "required": \[ "forename", "surname" \],  
    "additionalProperties" : false  
  },  
  "basicStudyDesign": {  
    "$schema": "http://json-schema.org/draft-04/schema\#",  
    "type": "object",  
    "title": "Basic study design",  
    "description": "Basic study design JSON Schema specification",  
    "properties": {  
      "briefTitle": { "type": "string" },  
      "principalInvestigatorName": { "$ref": "\#/principalInvestigatorName" }  
    },  
    "required": \[ "briefTitle", "principalInvestigatorName" \],  
    "additionalProperties" : false  
  }  
}

The reference uses JSON Pointer \[JSON-POINTER\] to specify the location of the referenced JSON Schema object. Here, the reference is to a field inside a JSON object in the same file. The reference can also be prefixed with a relative or absolute URL to reference a web-accessible resource.

## Representing Arrays in JSON Schema {#representing-arrays-in-json-schema}

JSON Schema has inbuilt support for indicating that the value of a JSON field can be an array (see Section 4.1.4 of \[JSON SCHEMA\]).

For example, if we have a JSON field called f1 that can contain an array of 2 to 4 objects we can express this in JSON Schema as:

"f1": {   
  "type": "array", "minItems" : 2, "maxItems" : 4,  
  "items" : {  
    "type" : "object"  
  }  
}

A JSON document fragment for the property f1 conforming to this schema could then look something like:

"f1": \[ { \<some JSON object\> }, { \<some JSON object\> } \]

Here, the array elements could contain any JSON object.

If we want to restrict the schema of the objects in the array we can simply embed standard JSON Schema description inside the items field value.

For example, if we have the following JSON Schema description of a person object:

{  
  "$schema": "http://json-schema.org/schema\#"  
  "type": "object",  
  "properties": {  
    "name": { "type": "string" },  
    "age { "type": "number" }  
  },  
  "required": \[ "name", "age" \],  
}

we can extend the earlier definition of the f1 field to indicate that the array must consist of person objects as follows:

"f1": {   
  "$schema": "http://json-schema.org/schema\#"  
  "type": array, "minItems" : 2, "maxItems" : 4,  
  "items" : {  
    "type": "object",  
    "properties": {  
      "name": { "type": "string" },  
      "age { "type": "number" }  
    },  
    "required": \[ "name", "age" \],  
  }   
}

An example of a JSON document fragment for property "f1" conforming to this JSON Schema could then be:

"f1": \[ { "name" : "Fred", "age": 55 },    
        { "name" : "Bob", "age": 26 }   
      \]

# Appendix B: JSON-LD {#appendix-b:-json-ld}

JSON-LD provides a lightweight syntax to add semantic annotations to JSON documents \[JSON-LD\]. The key goals of JSON-LD are to support the use of Linked Data in Web-based programming environments, to build interoperable Web services, and to store Linked Data in JSON-based storage engines. JSON-LD effectively allows JSON documents and their contents to be made available as Linked Data, offering the potential for machine-interpretable RDF semantics

Core JSON-LD functionality is provided with just three fields: @type, @id, and @context. We will first describe these fields and outline how they can be used to add semantic markup to JSON documents. 

## JSON-LD @type Field {#json-ld-@type-field}

The @type field is used by JSON-LD to provide a principled way of adding additional type information to JSON objects. The value of this field is one or more URIs indicating the type or types of the associated object or field. (This constraint must be specified with JSON Schema on each @type declaration.)

For example, here is a simple template element for a study design where we indicate that each metadata instance must have a @type field, and that the value of the field must be a URI: 

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Basic Study Design",  
  "description": "Basic example of a template element to describe a study",  
  "properties": {  
    **"@type": {**  
  	**"type": "string", "format": "uri"**  
    **},**  
    "briefTitle": { ... },  
    "principalInvestigator": { ... }  
  },  
  "required": \[ **"@type",** "briefTitle", "principalInvestigator" \],  
  "additionalProperties": false  
}

The following is an example of a conforming instance:

{  
  "@type":  "https://example.com/SomeType",  
  "briefTitle": { ... },  
  "principalInvestigator": { ... },  
}

It contains a @type field with a URI identifying a type.

If we wish to constrain the value of the @type field we can use JSON Schema’s enum clause to constrain the field value. 

For example, to force the @type field in the instance data to contain the URI http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#C19067 we can extend the above specification as follows:  
   
{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "title": "Basic Study Design",  
  "description": "Basic example of a schema to describe a study",  
  "properties": {  
    "@type": {  
  	"type": "string", "format": "uri",  
      **"enum": \[ "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#C19067" \]**  
    },  
    "briefTitle": { ... },  
    "principalInvestigator": { ... }  
  },  
  "required": \[ "@type", "briefTitle", "principalInvestigator" \],  
  "additionalProperties": false  
}

A conforming instance would then need to include a @type field with the specified URI as its value:

{  
  "@type":  "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl\#C19067",  
  "briefTitle": { ... },  
  "principalInvestigator": { ... },  
}

This is basically a standard JSON Schema approach to forcing the values in JSON instance data to come from controlled term lists. The data will not validate if each field does not contain an exact value from the enumerated list.

If we wish to indicate that @type field may contain one or more URIs, we can use the JSON Schema oneOf directive to add that option. Here is the resulting specification:

"@type": {  
  "oneOf": \[  
    {  
      "type": "string", "format": "uri"  
    },  
    {  
      "type": "array",  
      "items": {  
        "type": "string", "format": "uri"  
      },  
      "minItems": 1,  
      "uniqueItems": true   
    }  
  \]  
}

The above specification states that the @type field must contain **either** a single quotation-enclosed URI value, **or** one or more quotation-enclosed URIs in a JSON array. 

Examples of conforming field instances include:

"@type": "https://schema.org/Person"  
"@type": \[ "https://schema.org/Person" \]  
"@type": \[ "https://schema.org/Person", "https://schema.org/Place" \]

## JSON-LD @id Field {#json-ld-@id-field}

JSON-LD also provides a universal identifier mechanism for JSON objects.  It includes an identifier field called  @id which contains an URI-encoded identifier. This field allows JSON objects to be identified via a web-accessible URI and allows the values of JSON fields to refer to a JSON object on a different site on the Web.

For example, here is a JSON Schema definition for a study design, which has been enhanced with JSON-LD @id markup:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  **"@id": "https://example.com/StudyDesign",**  
  "title": "Basic Study Design",  
  "description": "Basic example of a schema to describe a study",  
  "properties": {  
	"briefTitle": { ... },  
	"principalInvestigator": { ... }  
    }  
  }  
  "required": \[ "briefTitle", "principalInvestigator" \],  
  "additionalProperties": false  
}

Here the @id field is used to define the identifier used for this metadata template (i.e., https://example.com/StudyDesign). This field will make it possible to uniquely identify the schema specification object and to externally reference it. 

We can also indicate that an instance conforming to this JSON Schema definition must include an @id field. 

For example, here is the above study design template extended to force instances to contain an @id field:

{  
  "$schema": "http://json-schema.org/draft-04/schema\#",  
  "type": "object",  
  "@id": "https://examle.com/StudyDesign",  
  "title": "Basic Study Design",  
  "description": "Basic example of a schema to describe a study",  
  "properties": {  
    **"@id": { "type": "string", "format": "uri" },**  
    "briefTitle": { ... },  
    "principalInvestigator": { ... }  
   }  
  },  
  "required": \[ **"@id",** "briefTitle", "principalInvestigator" \],  
  "additionalProperties": false  
}

The second @id field is located inside the properties object and it has also been set as a required property, so it indicates that any JSON document that follows this schema must have a property @id to identify it, whose value will be a URI. It restricts the identifier value in the field to be a URI, though users can use their own identifier mechanism to provide the actual identifier.

## JSON-LD @context Field {#json-ld-@context-field}

Another key field defined by JSON-LD is named @context, and it is used to establish the namespaces for the elements in the document by mapping JSON field names to URIs. Primarily it is used to map field names to URIs identifying properties. 

For example, a context definition mapping a \_value field to the Schema.org https://schema.org/value property be: 

"@context": {  
  "\_value": "https://schema.org/value"  
}

The @context field is slightly more complex to specify than @type or @id fields, but adopts their same JSON-Schema-based specification approach.

For example, to force a JSON instance to contain the following @context field:

"@context": {  
    "title": "https://schema.metadatacenter.org/title",  
    "year": "https://schema.metadatacenter.org/year",  
    "\_value":"https://schema.org/value"  
}

we can write the following in the JSON Schema-encoded specification:

"properties": {  
  **"@context": {**  
    **"properties": {**  
      **"title": { "enum": \[ "https://schema.metadatacenter.org/title" \] },**  
      **"year": { "enum": \[ "https://schema.metadatacenter.org/year" \] },**  
      **"\_value": { "enum": \[ "https://schema.org/value" \] }**  
     **},**  
    **"required": \[ "title", "year", "\_value" \],**  
    **"additionalProperties": false**  
  **},**  
  "required": \[ **"@context"** \]  
}  
     
What we are basically trying to do here is to force the data to contain specific URIs that encode type information for the properties in the JSON object.

# 

# 

# Appendix C: Model Change Log {#appendix-c:-model-change-log}

## 1.6.0  {#1.6.0}

Released June 27th, 2020\.

The following model updates were made in the 1.6.0 version of the model:

(1) The datetime field was superseded by a new temporal field, which supports three types of temporal data: dates, times, and datetimes. The new temporal field is described in the [Template Field Rendering Information](#heading=h.x7zaeuigyxhe%20) section.

(2) Template instances can now optionally contain a field called schema:identifier. This field can be used to store user-friendly identifiers for instances or can be used to store external identifiers for instances imported from external systems. This field is described in the [Representing Artifact Provenance](#heading) section.

## 1.5.0  {#1.5.0}

Released December 4th, 2018\.

The following model updates were made in the 1.5.0 version of the model:

(1) Schema artifacts (i.e., templates, elements, and fields) can now optionally contain a field called schema:identifier. This field can be used to store user-friendly identifiers for artifacts or can be used to store external identifiers for artifacts imported from external systems. This field is described in the [Representing Artifact Provenance](#heading) section.

(2) Template field specifications can now optionally contain skos:prefLabel and skos:alt Label fields. The skos:prefLabel field stores question text for a field; the skos:altLabel field can be used to store one or more alternate question text for a field. These fields are described in the [Representing Template Fields](#representing-template-fields) section.

(3) Template field instances containing controlled term value can now optionally include a skos:notation field. This field can be used to store values targeted for computer interpretation (as opposed to the rdfs:label field, which is used to store user-friendly values). This field is described in the [Representing Template Fields](#representing-template-fields) section.

(4) Several additions were made to the \_valueConstraints field. Numeric fields can now contain a field called numberType in the  \_valueConstraints object indicating the field datatype and a unitOfMeasure field indicating the associated units. Numeric fields can also contain fields called minValue and maxValue to indicate minimum and maximum values. Floating point fields can also contain a decimalPlace field specifying the number of decimal places displayed. New properties minLength and maxLength can be used to indicate minimum and maximum lengths for strings. Finally, the existing defaultValue field can now hold defaults for URI-based field values.

(5) A field called propertyDescriptions was added to the  \_ui field in templates and elements. It functions much like the existing propertyLabels field and is used to map JSON field names to customized field names for enclosing templates and elements.This field is described in the [Representing User Interface Rendering Specifications](%20https://docs.google.com/document/d/1lzi-6VtBPxhe6pDC3fVVc4JUKwpI509vUhYEuv3D8CU/edit#heading=h.1kaxshr6pq17) section.

## 1.4.0 {#1.4.0}

Released May 1st, 2018\. Source document [here](https://docs.google.com/document/d/1mfrnIOvmzeA6nWIQbE6zuMmac2D52hnS4Pu6IrQs-Hg).

The following model updates were made in the 1.4.0 version of the model:

(1) Schema artifacts (i.e., templates, elements, and fields) can now be versioned. The additional version fields are pav:version, pav:previousVersion, and bibo:status. These fields are described in the [Representing Artifact Version](#cedar-template-model-v1.6.0) section.

(2)  Artifacts can now contain an optional pav:derivedFrom field to indicate that the artifact was copied from another resource. This field is described in the [Describing Artifact Provenance](https://docs.google.com/document/d/1mfrnIOvmzeA6nWIQbE6zuMmac2D52hnS4Pu6IrQs-Hg/edit#heading=h.nstn3d7jszpg) section.

(2) The model now allows users to add additional fields to instances in a controlled way via the addition of a new attribute-value field type. This field is described in the [Attribute-Value Field Rendering Information](https://docs.google.com/document/d/1mfrnIOvmzeA6nWIQbE6zuMmac2D52hnS4Pu6IrQs-Hg/edit#heading=h.tkfe0s6vyd8s) section.

## 1.3.0 {#1.3.0}

Released November 1st, 2017\. Source document [here](https://docs.google.com/document/d/1ugcE0eoNhZuEuaeQES4hNRri4VokcXBt0cfH91Sc5wc/edit).

The following model updates were made in the 1.3.0 version of the model:

(1) Template field instances with IRI values previously used a custom \_valueLabel field to store labels for their associated IRI. This field has now been replaced with the standard rdfs:label field, with the RDFS prefix mapped appropriately in the context for a template instance. 

For example, an IRI field value like the following:

{ "@id": "https://example.com/A", "\_valueLabel": "A"}

would now look like:

{ "@id": "https://example.com/A", "rdfs:label": "A"}

This approach will now generate a meaningful RDF graph from the JSON-LD.

(2) Previously, template instance names and descriptions were stored inside the \_ui field. We now store these at the top level of an instance using the standard schema:name and schema:description fields. 

For example, an instance like the following:

{   
  "\_ui": {  
    "title": "Study", "description": "A clinical study"  
  },  
  ...  
}

would now look like:

{   
  "schema:name": "Study",  
  "schema:description": "A clinical study"  
  "\_ui": { ... },  
  ...  
}

Again, this approach will result in more meaningful RDF being generated from the instance JSON-LD.

## 1.1.0 {#1.1.0}

Released May 4th, 2017\. Source document [here](https://docs.google.com/document/d/14MdrTjs9PutCWyKI9MGN6VHNAImKmUMCPDhNYChh87w).

Version 1.1.0 should be considered at the first stable release of the model. Numerous minor updates and fixes were made from earlier model releases.

# 

# 

# Glossary  {#glossary}

**Metadata** – descriptors that describe the properties of data  
**Metadata Template** – a composite set of metadata template elements and value elements  
**Metadata Template Element** – reusable representation of one or more metadata descriptors relating to a particular aspect of some data; metadata template elements may contain more or more value elements and may be combined recursively to create more complex elements  
**Metadata Template Field** \- an atomic piece of metadata   
**Metadata Template Instance** – instantiated metadata template  
**URI** – Universal Resource Identifier

# 

# 

# References {#references}

\[BIOCADDIE\] Ohno-machado, Lucila; Alter, George; Fore, Ian; Martone, Maryann; Sansone, Susanna-Assunta; Xu, Hua (2015): bioCADDIE white paper \- Data Discovery Index.  
[https://dx.doi.org/10.6084/m9.figshare.1362572.v1](https://dx.doi.org/10.6084/m9.figshare.1362572.v1)  
\[CEDAR SCHEMA\] CEDAR Template Model Schema [https://github.com/metadatacenter/cedar-templates/blob/master/validation/template\_validator.json](https://github.com/metadatacenter/cedar-templates/blob/master/validation/template_validator.json)  
\[EKAW2016\] O’Connor MJ, Martinez-Romero M, Egyedi AL, Willrett D, Graybeal J, Musen MA. An open repository model for acquiring knowledge about scientific experiments. In: LNCS. Vol 10024; 2016:762-777.  
\[JSON\] The JSON Data Interchange Format, 1st Edition. October 2013\. ECMA International, Standard ECMA-404. [http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf)   
\[JSON-LD\] JSON-LD 1.0, A JSON-based Serialization for Linked Data, W3C Recommendation 16 January 2013\. [https://www.w3.org/TR/json-ld/](https://www.w3.org/TR/json-ld/). *See also* web site: [http://json-ld.org](http://json-ld.org)   
\[JSON-LD-PLAYGROUND\] [http://json-ld.org/playground](http://json-ld.org/playground)  
\[JSON-POINTER\] [http://spacetelescope.github.io/understanding-json-schema/structuring.html](http://spacetelescope.github.io/understanding-json-schema/structuring.html)   
\[JSON-SCHEMA\] [http://json-schema.org](http://json-schema.org)   
\[JSON-SCHEMA-STSI\] [http://spacetelescope.github.io/understanding-json-schema/UnderstandingJSONSchema.pdf](http://spacetelescope.github.io/understanding-json-schema/UnderstandingJSONSchema.pdf)  
\[JSON-VALIDATE\] JSON Schema Validator: [http://www.jsonschemavalidator.net](http://www.jsonschemavalidator.net)   
\[LINKED-DATA\] [http://en.wikipedia.org/wiki/Linked\_data](http://en.wikipedia.org/wiki/Linked_data)  
\[OWL-CONSTRAINTS\] Motik B, Horrocks I, and Sattler U. Adding Integrity Constraints to OWL. OWLED, 2007; Vol. 258  
\[SHACL\] Shapes Constraint Language (SHACL) [https://www.w3.org/TR/shacl/](https://www.w3.org/TR/shacl/)  
\[SNOMEDCT-INSTITUTION\]  SNOMEDCT Institution class:   
    [http://purl.bioontology.org/ontology/SNOMEDCT/385437003](http://purl.bioontology.org/ontology/SNOMEDCT/385437003)   
\[PAV\] Provenance and Versioning Ontology [https://pav-ontology.github.io/pav/pav.rdf](https://pav-ontology.github.io/pav/pav.rdf)

[^1]:  The primary CEDAR REST APIs can be used to work with resources described using this model. An introduction to these APIs can be found [here.](https://github.com/metadatacenter/cedar-docs/wiki/CEDAR-REST-APIs)

[^2]:  See Appendix A for an overview of JSON Schema.

[^3]:  See Appendix B for an overview of JSON-LD.

[^4]:  Later we will formally map these prefixes to their associated namespace IRIs.

[^5]:  A useful online JSON Schema validator can be found at www.jsonschemavalidator.net.

[^6]:  See Appendix B for an introduction to JSON-LD; a good introduction can also be found at json-ld.org.

[^7]:  For a full list of CEDAR artifacts’ provenance metadata, see [Representing Artifact Provenance](#representing-artifact-provenance).

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>