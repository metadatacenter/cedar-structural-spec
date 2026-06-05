# CEDAR Java Binding Instructions

Create a Java 17+ binding for the CEDAR structural specification.

## Source Of Truth

- Read `spec/grammar.md`, `spec/wire-grammar.md`, `spec/serialization.md`, `spec/validation.md`, and `spec/bindings.md`.
- Treat `bindings.md` as binding design guidance that must be followed unless explicitly impossible.
- In particular, follow the `bindings.md` "Codebase Organisation" section (package-per-family layout) and the "Documentation Conventions" section. (Cite `bindings.md` sections by title rather than number; the numbering may shift.)

## Model Design

- Do not expose artifacts as Jackson `JsonNode` wrappers.
- Public model types must be Java records, enums, and sealed interfaces.
- Use one top-level Java file per public record, interface, or enum, named for that type. One public type per file.
- Do not create one large nested namespace class, and do not create aggregate files that bundle several types (no `FieldRecords`, `EmbeddedRecords`, `Values`, or similar). Each record/interface/enum is its own file in its family or sub-package.
- `JsonNode` may only be used internally inside mapper and validator code.

## Code Organization

The single most common failure mode is to emit every type into one flat
package (or to collapse the families into a few aggregate classes). Both are
wrong. The source tree MUST follow the package layout below.

**Hard rules.**

- The model MUST NOT be one flat package. If more than a handful of types
  land directly in `org.metadatacenter.cedar.model`, the layout is wrong.
- Generate the per-family types for every family; do NOT collapse families
  into aggregate files such as `FieldRecords`, `EmbeddedRecords`, or
  `Values`. There is no `XxxRecords` file. One top-level Java file per
  public record, interface, or enum (already required under Model Design).
- There are 21 field families; cover all of them, each in its own package.
  They are enumerated in `grammar.md` (Concrete Field Artifacts) and listed
  in `bindings.md`: Text, IntegerNumber, RealNumber, Boolean, Date, Time,
  DateTime, ControlledTerm, SingleValuedEnum, MultiValuedEnum, Link, Email,
  PhoneNumber, Orcid, Ror, Doi, PubMedId, Rrid, NihGrantId, Language, and
  AttributeValue.
- Honour the per-family structural exceptions: `EmbeddedBooleanField` and
  `EmbeddedSingleValuedEnumField` omit `[Cardinality]`;
  `EmbeddedMultiValuedEnumField`'s embedding default is a sequence of
  `EnumValue`; `AttributeValueField` carries no default value at either
  layer.

**Each field-family package** (e.g. `…model.field.text`) contains that
family's, and only that family's:

- typed field id (`TextFieldId`)
- field artifact record (`TextField`)
- field spec record (`TextFieldSpec`)
- embedded field record (`EmbeddedTextField`)
- value record (`TextValue`)
- rendering hint record, where applicable (`TextRenderingHint`)
- family-specific helpers or validators, where applicable

**Cross-family and non-family types** are NOT placed at the top level
either; they go in purpose-named sub-packages. The full layout (rooted at
`org.metadatacenter.cedar.model`):

```
org.metadatacenter.cedar.model
├── field
│   ├── text                     (TextFieldId, TextField, TextFieldSpec,
│   │                             EmbeddedTextField, TextValue, TextRenderingHint)
│   ├── integernumber
│   ├── realnumber
│   ├── booleanfield             (avoid the Java keyword `boolean`)
│   ├── date
│   ├── time
│   ├── datetime
│   ├── controlledterm
│   ├── singlevaluedenum
│   ├── multivaluedenum
│   ├── link
│   ├── email
│   ├── phonenumber
│   ├── orcid
│   ├── ror
│   ├── doi
│   ├── pubmedid
│   ├── rrid
│   ├── nihgrantid
│   ├── language
│   ├── attributevalue
│   └── (Field, EmbeddedField, FieldSpec, FieldId, Value unions + isXxx: the
│        cross-family sealed interfaces that range over the families)
├── leaves                       (Iri, LanguageTag, ModelVersion, Token,
│                                 EmbeddedArtifactKey, PromptKey, Version,
│                                 IsoDateTimeStamp, and other typed primitives)
├── metadata                     (CatalogMetadata, LifecycleMetadata,
│                                 SchemaArtifactVersioning, Annotation,
│                                 AnnotationValue + variants, Status)
├── embedded                     (EmbeddedArtifact union, EmbeddedTemplate,
│                                 EmbeddedPresentationComponent, Cardinality,
│                                 Property, ValueRequirement, Visibility,
│                                 Editability, AlternativePrompt, Section,
│                                 Collapsibility, TemplateMember)
├── presentation                 (PresentationComponent union + variants:
│                                 RichTextComponent, ImageComponent,
│                                 YoutubeVideoComponent, SectionBreakComponent,
│                                 PageBreakComponent)
├── instance                     (TemplateInstance, FieldValue,
│                                 NestedTemplateInstance, InstanceValue)
├── serialize                    (CedarMapper / decode-encode, validators;
│                                 the only place JsonNode is used)
└── Template, Artifact, SchemaArtifact, CedarConstructionException
                                 (the few genuinely root-level types)
```

Only a small number of genuinely top-level constructs (`Template`,
`Artifact`, `SchemaArtifact`, the construction exception) belong directly in
the root package; everything else lives in one of the sub-packages above.

**Self-check.** After generation, no sub-package should be empty and the
root package should hold only a handful of files. A root package containing
dozens of types means the layout was not applied; regenerate into the tree
above.

## Typing Rules

- Prefer family-specific component types over broad umbrella types.
- For example:
    - `TextField.fieldSpec` should be `TextFieldSpec`, not `FieldSpec`.
    - `TextFieldSpec.defaultValue` should be `TextValue`, not `Value`.
    - `DateFieldSpec.defaultValue` should use the appropriate date value union.
- Use sealed interfaces for `kind`-discriminated unions.
- Use flat Jackson subtype dispatch tables where `bindings.md` recommends them.
- Use Java enums for wire string enums.
- Use primitive wrapper records with `@JsonValue` and `@JsonCreator` for IRI, language tag, model version, token, and similar primitives.
- Use immutable list copying in record constructors.
- `modelVersion` is a top-level component on every concrete artifact (`Template`, `TemplateInstance`, every `XxxField`, every `PresentationComponent` variant), not a member of `SchemaArtifactVersioning`.
- Cover the constructs added by recent issues:
    - `Editability` (`editable` | `readOnly`) on every `EmbeddedField`, parallel to `Visibility`.
    - `Section` / `TemplateMember` / `Collapsibility`: `Template.members` (and `Section.members`) is a `List<TemplateMember>`, where `TemplateMember` is a sealed union of `EmbeddedArtifact` and `Section`. `Section` is a recursive record (label, optional description, optional collapsibility, and its own `List<TemplateMember>`); it carries no key and yields no instance values, so the template-to-`Map<EmbeddedArtifactKey, EmbeddedArtifact>` flattening recurses into a section's members but contributes no entry for the section itself. Register `Section` plus every leaf embedded record in a flat `@JsonSubTypes` table on `TemplateMember`.
    - `AlternativePrompt` (a `PromptKey` + `MultilingualString`) repeated on every `Field`, and an optional `PromptKey` on every `EmbeddedField`. `PromptKey` is an `AsciiIdentifier` primitive wrapper. An embedding MUST NOT carry both `promptKey` and `promptOverride`.
- Nullness annotations: use [JSpecify](https://jspecify.dev) (`org.jspecify.annotations`). Every package (or module) MUST be null-marked by default with `@NullMarked`, so non-null is the contract for every type usage unless annotated otherwise. Under that default, `@NonNull` is implied everywhere and SHOULD NOT be written redundantly on each non-null component.
- Every optional record component MUST be annotated `@Nullable` (the only nullable declarations in the model), and MUST be omitted (not emitted as `null`) during serialization. Do not leave an optional component without `@Nullable` when it can be absent, and do not use `Optional<T>` as a stored component (expose `Optional<T>` only as an accessor return type, per `bindings.md`).
- Keep the public accessor surface null-free (see the `bindings.md` "Optional component" guidance): expose total accessors that resolve the defined default for defaulted-optional slots (`Visibility`, `Editability`, `ValueRequirement`, `Cardinality`, `Collapsibility`), and option-typed accessors for genuinely-optional slots. Do **not** normalise a default into stored state for an absent slot (e.g. storing `Visibility.VISIBLE` when the slot was absent); that would re-emit an omitted property and break round-trip equality (`serialization.md`). Resolve defaults at read time; preserve absence in storage.

## JavaDoc

- Provide excellent JavaDoc for all public records, sealed interfaces, enums, and public API classes.
- JavaDoc must explain the CEDAR production being represented, its role in the model, and any important invariants.
- For sealed interfaces, document the union semantics, discriminator property, and permitted variant families.
- For records, document the wire shape at a useful level and document every record component with `@param`.
- For enums, document the corresponding wire string values and when each value is used.
- For mapper and validator APIs, document decode and encode behavior, validation behavior, thrown exceptions, and round-trip expectations.
- JavaDoc should reference CEDAR terminology from `grammar.md`, `wire-grammar.md`, `serialization.md`, `validation.md`, and `bindings.md`.
- Do not write empty boilerplate JavaDoc. Avoid comments that merely restate the Java type.
- Keep implementation comments sparse; put user-facing conceptual documentation in JavaDoc.

## Factories And Convenience Constructors

- Provide static factory methods for public value objects and records where they improve readability or preserve invariants.
- Prefer named factories over exposing construction complexity in client code.
- For primitive wrapper records, provide factories such as:
    - `Iri.of(String)`
    - `Iri.of(URI)`
    - `LanguageTag.of(String)`
    - `ModelVersion.of(String)`
    - `EmbeddedArtifactKey.of(String)`
    - `Token.of(String)`
- For multilingual text, provide convenient factories such as:
    - `LangString.of(String value, String lang)`
    - `MultilingualString.of(LangString...)`
    - `MultilingualString.en(String value)`
- For common value records, provide factories such as:
    - `TextValue.of(String value)`
    - `TextValue.of(String value, LanguageTag lang)`
    - `IntegerNumberValue.of(long value)`
    - `IntegerNumberValue.of(BigInteger value)`
    - `EnumValue.of(String token)`
- For field-family records, provide family-specific factories or builders when canonical record construction would be verbose or error-prone.
- Factories must validate the same invariants as canonical constructors.
- Factories must not bypass Java record immutability or create partially valid objects.
- Keep canonical constructors available for Jackson and direct Java use, but document the recommended factories in JavaDoc.
- Avoid an untyped generic factory that erases the family-specific model. Factories should reinforce the typed binding shape.

## Jackson

- Use Jackson annotations where needed for unambiguous wire mapping.
- Do not rely on Jackson behavior if it weakens the public type model.
- Preserve exact wire `kind` names and property names.

## Validation

- Implement collected validation errors matching the spec's `category`, `path`, `production`, and `message` shape.
- Validator may inspect `JsonNode` internally, but decoded artifacts must be typed records.
- Unknown properties, lexical constraints, and structural invariants must be reported before or during decode.

## Acceptance Criteria

- All valid normative fixtures decode to typed records and re-encode to JSON-tree equivalent output (property-order-independent). An absent optional MUST round-trip as absent: it is omitted on encode, never emitted as `null` or as its resolved default (`serialization.md`).
- All invalid normative fixtures report at least the expected errors.
- Maven tests must cover valid round-trips and invalid expected-error manifests.
- The source tree must demonstrate the package-per-family layout before considering the task done.
