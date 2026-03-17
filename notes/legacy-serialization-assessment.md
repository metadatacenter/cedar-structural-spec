# Legacy CEDAR Serialization Assessment

## Overview

The legacy CEDAR JSON serialization is operationally useful, but it is not a good fit for the strongly typed conceptual model defined by this specification effort.

It appears to have evolved around implementation needs rather than from a clear abstract model first. As a result, it is practical for existing systems, but conceptually muddy.

## Overall Assessment

The legacy serialization is:

- practical
- backward-compatible
- implementation-centric
- weakly typed
- structurally ambiguous

It is best understood as a product-oriented interchange format rather than a normative serialization of the conceptual model.

## What It Does Well

- It packs metadata, validation, UI settings, and linked-data information into a single object.
- It is convenient for a single implementation stack to consume.
- It can support repository workflows, validation workflows, and rendering workflows without additional transformation steps.
- It likely reflects real product needs and accumulated operational experience.

## Main Weaknesses

### Mixed Concerns

The serialization mixes several distinct concerns in one object:

- conceptual artifact structure
- UI and acquisition hints
- JSON Schema machinery
- JSON-LD context
- repository and provenance metadata

This makes it difficult to determine which information is conceptually essential and which information is format- or implementation-specific.

### Weak Typing

The legacy `_valueConstraints` and `_ui` split is not strongly typed.

For example:

- temporal semantics are expressed through `_valueConstraints.temporalType`
- temporal acquisition/display behavior is expressed through `_ui.temporalGranularity`

This creates cross-object dependencies rather than a single coherent typed structure.

### Semantic and Presentational Blur

The serialization does not sharply distinguish:

- semantic distinctions that should belong to field type structure
- presentational distinctions that should belong to rendering hints

This is especially visible for temporal fields, where semantic type, precision, and UI behavior are spread across separate buckets.

### Implementation Leakage

Some members are clearly specific to JSON Schema or implementation support rather than the conceptual model itself, for example:

- `type`
- `title`
- `properties`
- `additionalProperties`
- `$schema`

These are useful in practice, but they make the object read more like a generated implementation artifact than a conceptual serialization.

## Conceptual Fit With the Current Specification

From the perspective of the current CEDAR structural specification, the legacy serialization only partially fits.

### Fits Reasonably Well

The following parts map reasonably well to the current conceptual model:

- `@id` as artifact identity
- descriptive metadata such as name, description, and identifier
- provenance fields such as created-on and modified-by
- versioning fields such as version and status

### Legacy But Mappable

The following parts are legacy structures that could be mapped into the current conceptual model:

- `_valueConstraints`
- `_ui`
- `temporalType`
- `temporalGranularity`

These are not good direct representations of the current model, but they can be interpreted and transformed into it.

### Outside the Current Conceptual Scope

The following parts are best treated as serialization- or tool-specific rather than conceptual:

- JSON Schema validation members
- JSON-LD context declarations
- implementation-specific UI flags whose conceptual role is unclear

## Example: Temporal Modeling

In the legacy serialization, temporal modeling looks roughly like this:

- `_valueConstraints.temporalType = xsd:date`
- `_ui.temporalGranularity = day`

In the current conceptual model, the same information would instead be represented structurally through typed field-type information, for example:

- `FieldType = DateFieldType`
- `DateValueType = FullDateValueType`
- optional `DateRenderingHint`

This is stronger because the semantic structure is made explicit in the model itself rather than being inferred from loosely related JSON sections.

## Architectural Conclusion

The legacy serialization is a reasonable operational format for an existing product ecosystem, but it is not a good normative target for the conceptual model.

It is useful as:

- a source of implementation experience
- a migration source
- a compatibility target

It is not ideal as:

- the primary conceptual representation
- the normative expression of the model
- the basis for strong typing and unambiguous specification

## Recommendation

The legacy serialization should be treated as:

- an implementation-oriented legacy format
- something that can be mapped into the current conceptual model
- not the model itself

Future serializations should be designed from the conceptual model outward, with a cleaner separation between:

- conceptual structure
- validation machinery
- presentation hints
- linked-data or schema-framework packaging
