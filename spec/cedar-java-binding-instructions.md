# CEDAR Java Binding Instructions

Create a Java 17+ binding for the CEDAR structural specification.

## Source Of Truth

- Read `spec/grammar.md`, `spec/wire-grammar.md`, `spec/serialization.md`, `spec/validation.md`, and `spec/bindings.md`.
- Treat `bindings.md` as binding design guidance that must be followed unless explicitly impossible.
- In particular, follow the `bindings.md` "Codebase Organisation" section (package-per-family layout) and the "Documentation Conventions" section. (Cite `bindings.md` sections by title rather than number; the numbering may shift.)

## Model Design

- Do not expose artifacts as Jackson `JsonNode` wrappers.
- Public model types must be Java records, enums, and sealed interfaces.
- Use one top-level Java file per public record, interface, or enum.
- Do not create one large nested namespace class.
- `JsonNode` may only be used internally inside mapper and validator code.

## Code Organization

- Do not put all model types in one flat package.
- There are 21 field families; cover all of them. They are enumerated in `grammar.md` (Concrete Field Artifacts) and listed in `bindings.md`: Text, IntegerNumber, RealNumber, Boolean, Date, Time, DateTime, ControlledTerm, SingleValuedEnum, MultiValuedEnum, Link, Email, PhoneNumber, Orcid, Ror, Doi, PubMedId, Rrid, NihGrantId, Language, and AttributeValue.
- Honour the per-family structural exceptions: `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` omit `[Cardinality]`; `EmbeddedMultiValuedEnumField`'s embedding default is a sequence of `EnumValue`; `AttributeValueField` carries no default value at either layer.
- Use one Java package per field family, for example:
    - `org.metadatacenter.cedar.model.field.text`
    - `org.metadatacenter.cedar.model.field.integernumber`
    - `org.metadatacenter.cedar.model.field.controlledterm`
- Each family package must contain that family's:
    - typed field id
    - field artifact record
    - field spec record
    - embedded field record
    - value record
    - rendering hint record, where applicable
    - family-specific helpers or validators, where applicable
- Put cross-family sealed interfaces and shared records in parent or common packages.

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
- Make nullable or optional record components explicit, preferably with `@Nullable` and non-null omission during serialization.
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
