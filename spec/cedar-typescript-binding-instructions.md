# CEDAR TypeScript Binding Instructions

Create a TypeScript binding for the CEDAR structural specification, written
in idiomatic, modern TypeScript.

These instructions are self-contained: the conventions below are the
authoritative description of the idiomatic TypeScript shape this binding
must take. Follow them together with the specification documents listed
under Source Of Truth.

## Source Of Truth

- Read `spec/grammar.md`, `spec/wire-grammar.md`, `spec/serialization.md`, `spec/validation.md`, and `spec/bindings.md`.
- Treat `bindings.md` as binding design guidance that must be followed unless explicitly impossible.
- In particular, follow the `bindings.md` "Codebase Organisation" section (file-per-family layout) and the "Documentation Conventions" section. (Cite `bindings.md` sections by title rather than number; the numbering may shift.)

## TypeScript Idioms

The binding must read as native, modern TypeScript. The model is data, with
no behaviour to attach to it, so favour structural types and plain functions:

- Model data as **`readonly` interfaces and discriminated unions**. Reserve `class` for the one error type (`CedarConstructionError`).
- Express absence as `undefined` via an optional property (`prop?: T`). Do not use `null`, and do not introduce an `Optional`-style wrapper object.
- Express closed value sets as **string-literal union types** (`'draft' | 'published'`), each paired with a frozen array of the values and an `isXxx` guard. Do not use the TypeScript `enum` construct (it emits a runtime object and is not a plain union).
- Construct values with **plain factory functions** that return frozen plain objects. Do not use getters/setters, builder classes, or constructor classes.
- Tag discriminated unions with a `kind: '...'` string-literal field and narrow with `switch (x.kind)`.
- Prefer `interface` / `type` aliases and standalone functions over classes and methods.

## Model Design

- Public model types are `readonly` interfaces, string-literal union types, and discriminated unions tagged by a `kind` field.
- Every value-bearing object that participates in a polymorphic position carries a `kind: '<ProductionName>'` literal field as its discriminant.
- Constructed values are immutable: every interface property is `readonly`, and constructors `Object.freeze` the returned object (and any invariant-bearing nested array, e.g. `MultilingualString`, `Template.members`).
- Do not expose raw parsed JSON (`unknown` / index-signature objects) as part of the public model. Untyped JSON exists only inside the serialize/parse layer.
- Equality is structural; do not rely on reference identity. Provide a shallow-equality helper only if call sites need it.

## Code Organization

- There are 21 field families; cover all of them. They are enumerated in `grammar.md` (Concrete Field Artifacts) and listed in `bindings.md`: Text, IntegerNumber, RealNumber, Boolean, Date, Time, DateTime, ControlledTerm, SingleValuedEnum, MultiValuedEnum, Link, Email, PhoneNumber, Orcid, Ror, Doi, PubMedId, Rrid, NihGrantId, Language, and AttributeValue.
- Honour the per-family structural exceptions: `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` omit the cardinality slot; `EmbeddedMultiValuedEnumField`'s embedding default is a sequence of `EnumValue`; `AttributeValueField` carries no default value at either layer.
- Use **one source file per field family** (kebab-case): `text-field.ts`, `integer-number-field.ts`, `controlled-term-field.ts`, etc. Each family file exports that family's:
    - typed field id interface + its constructor (`TextFieldId` / `textFieldId`)
    - value interface + constructor + guard (`TextValue` / `textValue` / `isTextValue`)
    - field spec interface + `Init` interface + constructor + guard
    - field artifact interface + `Init` interface + constructor
    - embedded field interface + `Init` interface + constructor
    - rendering hint type, where applicable
    - family-specific helpers or validators, where applicable
- Cross-family unions (`Field`, `EmbeddedField`, `Value`, `FieldSpec`) and their `isXxx` guards, plus shared constructs (`Cardinality`, `CatalogMetadata`, `SchemaArtifactVersioning`, the per-embedding config), live in their own files and re-export from per-family files where appropriate.
- A single `index.ts` is the public API surface (barrel re-exports).
- Do not put all model types in one file or one giant namespace.

## Typing Rules

- Prefer family-specific component types over broad umbrella types:
    - `TextField.fieldSpec` is `TextFieldSpec`, not `FieldSpec`.
    - `TextFieldSpec.defaultValue` is `TextValue`, not `Value`.
    - `DateFieldSpec.defaultValue` uses the appropriate date value union.
- Use discriminated unions (tagged by `kind`) for `kind`-discriminated wire unions; narrow by `switch (x.kind)`.
- Use string-literal union types for wire string enums, each with a frozen `readonly` array of values and an `isXxx` guard (e.g. `Status = 'draft' | 'published'`, `STATUSES`, `isStatus`).
- For typed primitive wrappers (IRI, language tag, model version, token, embedded-artifact key, prompt key, and similar), use a small structural wrapper object carrying `kind` and `value` (e.g. `{ kind: 'Iri'; value: string }`) constructed by a validating factory; a branded-string alias (`type Iri = string & { readonly __brand: 'Iri' }`) is an acceptable lighter alternative. Pick one and apply it consistently.
- `modelVersion` is a top-level property on every concrete artifact (`Template`, `TemplateInstance`, every `XxxField`, every `PresentationComponent` variant), not nested inside the versioning object.
- Cover the constructs added by recent issues:
    - `Editability` (`'editable' | 'readOnly'`) on every `EmbeddedField`, parallel to `Visibility`.
    - `Section` / `TemplateMember` / `Collapsibility`: `Template.members` (and `Section.members`) is `readonly TemplateMember[]`, where `TemplateMember = EmbeddedArtifact | Section`. `Section` is a recursive interface (`kind: 'Section'`, `label`, optional `description`, optional `collapsibility`, and its own `readonly TemplateMember[]`); it carries no key and yields no instance values, so the routine that flattens a template to a key→embedded-artifact map recurses into a section's members but contributes no entry for the section itself.
    - `AlternativePrompt` (a `PromptKey` + `MultilingualString`) repeated on every `Field`, and an optional `PromptKey` on every `EmbeddedField`. `PromptKey` is an ASCII-identifier primitive. An embedding must not carry both `promptKey` and `promptOverride`; reject that at construction.

## Optionality And Null

- Absence is `undefined`, expressed as `prop?: T`. Constructors omit the property entirely (e.g. via conditional spread `...(x !== undefined && { prop: x })`) rather than assigning `undefined` or `null`.
- Never use `null` in the public model, and never emit `null` for an absent optional on the wire. Decoders reject `"prop": null` (per `serialization.md`).
- Keep the public surface null-free per the `bindings.md` "Optional component" guidance. For defaulted-optional slots (`Visibility`, `Editability`, `ValueRequirement`, `Cardinality`, `Collapsibility`), provide a total accessor/helper that resolves the defined default and returns the value type directly. For genuinely-optional slots, the property is simply `prop?: T` and callers narrow on `undefined`.
- Do **not** normalise a default into stored state for an absent slot (e.g. storing `'visible'` when `visibility` was absent); that would re-emit an omitted property and break round-trip equality (`serialization.md`). Resolve defaults at read time; preserve absence in storage.

## Constructors And Widening Inputs

- Provide a `readonly` `XxxInit` input interface alongside each `Xxx` output interface; the `Init` shape may accept broader inputs than the stored shape (e.g. `Iri | string`, a `MultilingualStringInput` union) and narrow to the canonical form during construction.
- Provide one validating **widening constructor function** per production (e.g. `cardinality(init)`, `multilingualString(input)`, `textValue(value, lang?)`, `iri(value)`). It validates all construction-time invariants, normalises inputs to canonical form, and returns a frozen value.
- Widening constructors should be idempotent on already-canonical input (`iri(iri(s))` ≡ `iri(s)`), so they chain without redundancy.
- Provide an `isXxx` type guard per polymorphic production.
- Validate the same invariants regardless of entry point (factory call or parse). Never produce a partially valid object.
- Throw a single `CedarConstructionError` (a `class extends Error`) for all construction-time invariant failures.

## TSDoc

- Provide thorough TSDoc (`/** … */`) for every exported interface, type alias, constructor function, and type guard.
- TSDoc must explain the CEDAR production being represented, its role in the model, and any important invariants.
- For discriminated unions, document the union semantics, the `kind` discriminant, and the permitted variants.
- For constructors, document accepted input shapes (`@param`), the normalisation performed, what is returned (`@returns`), and `@throws CedarConstructionError` with the conditions that trigger it.
- For string-literal union types, document each permitted value and when it applies, and any default-on-absence semantics.
- For the serialize/parse layer, document decode/encode behaviour, validation behaviour, thrown errors, and round-trip expectations.
- Reference CEDAR terminology from `grammar.md`, `wire-grammar.md`, `serialization.md`, `validation.md`, and `bindings.md`. Use `@example` for non-obvious construction.
- Do not write empty boilerplate TSDoc or comments that merely restate the type. Keep implementation comments sparse; put user-facing conceptual documentation in TSDoc.

## Serialization

- Keep a dedicated serialize/parse layer separate from the model types. Parsing produces typed model values; serialization produces plain JSON-compatible values.
- Serialize with plain object construction and `JSON.stringify`; do not inject `null` for absent optionals (omit the property).
- Preserve exact wire `kind` names and property names; do not alias.
- Decode rejects unknown properties, `null`-valued optionals, and lexically invalid leaf values, reporting before or during construction.
- Typed primitive wrappers collapse to bare JSON primitives on the wire (an `Iri` serialises to a string); reconstruct the typed form on parse from the value plus the static type at the use site.

## Validation

- Enforce construction-time invariants in the constructors (lexical form, uniqueness, numeric ordering, mutual exclusion, etc.); a constructed value is always valid.
- Where a validation algorithm is provided (`validation.md`), implement collected validation errors matching the spec's `category`, `path`, `production`, and `message` shape.
- A validator may inspect untyped JSON internally, but decoded artifacts are typed model values, never untyped JSON.

## Acceptance Criteria

- All valid normative fixtures decode to typed model values and re-encode to JSON-tree equivalent output (property-order-independent). An absent optional must round-trip as absent: it is omitted on encode, never emitted as `null` or as its resolved default (`serialization.md`).
- All invalid normative fixtures report at least the expected errors.
- The test suite (e.g. Vitest) must cover valid round-trips and invalid expected-error manifests, walking the `spec/normative-tests/` fixtures.
- `tsc --noEmit` must pass with `strict` enabled, and the public API must be exported from a single `index.ts`.
- The source tree must demonstrate the file-per-family layout before considering the task done.
