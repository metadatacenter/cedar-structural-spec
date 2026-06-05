# CEDAR Python Binding Instructions

Create a Python binding for the CEDAR structural specification, written in
idiomatic, modern Python (3.11+).

These instructions are self-contained: the conventions below are the
authoritative description of the pythonic shape this binding must take.
Follow them together with the specification documents listed under Source
Of Truth.

## Source Of Truth

- Read `spec/grammar.md`, `spec/wire-grammar.md`, `spec/serialization.md`, `spec/validation.md`, and `spec/bindings.md`.
- Treat `bindings.md` as binding design guidance that must be followed unless explicitly impossible.
- In particular, follow the `bindings.md` "Codebase Organisation" section (module-per-family layout) and the "Documentation Conventions" section. (Cite `bindings.md` sections by title rather than number; the numbering may shift.)

## Python Idioms

The binding must read as native, modern Python. The model is data, with no
behaviour to attach to it, so favour declarative types and the standard data
libraries:

- Model data with **Pydantic v2 models** (`BaseModel`), frozen for immutability (`model_config = ConfigDict(frozen=True)`). Do not hand-write `__init__`, getters, or setters; let Pydantic generate them.
- Target **Pydantic v2 only**. Do not use v1 APIs (`@validator`, `.dict()`, `Config` inner classes); use v2 (`@field_validator` / `@model_validator`, `model_dump()`, `model_config = ConfigDict(...)`).
- Use modern type hints: `T | None` (not `Optional[T]`), `list[T]` / `dict[K, V]` (not `List` / `Dict` from `typing`), and `Literal[...]` for fixed values.
- Express closed value sets as `enum.StrEnum` (3.11+), with members whose values are the exact wire strings.
- Follow PEP 8 (snake_case attributes and functions, UpperCamelCase classes, SCREAMING_SNAKE_CASE constants) and PEP 257 for docstrings.
- Prefer module-level factory functions over classmethods where they improve readability; do not build elaborate class hierarchies for data.

## Model Design

- Public model types are frozen Pydantic v2 models, `StrEnum` types, and discriminated unions.
- Every value-bearing object in a polymorphic position carries a `kind: Literal["<ProductionName>"]` field with the production name as its default, as the union discriminant.
- Models are immutable (`frozen=True`); construction validates, and a constructed value is always valid.
- Do not expose raw decoded JSON (`dict[str, Any]`) as part of the public model. Untyped data exists only inside the serialize/parse layer.
- Equality is structural; Pydantic models provide value equality automatically.

## Code Organization

- There are 21 field families; cover all of them. They are enumerated in `grammar.md` (Concrete Field Artifacts) and listed in `bindings.md`: Text, IntegerNumber, RealNumber, Boolean, Date, Time, DateTime, ControlledTerm, SingleValuedEnum, MultiValuedEnum, Link, Email, PhoneNumber, Orcid, Ror, Doi, PubMedId, Rrid, NihGrantId, Language, and AttributeValue.
- Honour the per-family structural exceptions: the embedded boolean and single-valued-enum fields omit the cardinality slot; the embedded multi-valued-enum field's embedding default is a sequence of `EnumValue`; the attribute-value field carries no default value at either layer.
- Use **one module per field family** (snake_case): `cedar/field/text_field.py`, `cedar/field/integer_number_field.py`, `cedar/field/controlled_term_field.py`, etc. Each family module defines that family's:
    - typed field id
    - value model + factory
    - field spec model + factory
    - field artifact model + factory
    - embedded field model + factory
    - rendering hint type, where applicable
    - family-specific helpers or validators, where applicable
- Cross-family unions (`Field`, `EmbeddedField`, `Value`, `FieldSpec`) and shared models (`Cardinality`, `CatalogMetadata`, `SchemaArtifactVersioning`, the per-embedding config) live in their own modules.
- Expose the public API through the package's top-level `__init__.py`.
- Do not put all model types in one module.

## Typing Rules

- Prefer family-specific component types over broad umbrella types:
    - `TextField.field_spec` is typed `TextFieldSpec`, not `FieldSpec`.
    - `TextFieldSpec.default_value` is typed `TextValue`, not `Value`.
    - the date field spec's default uses the appropriate date value union.
- Use `Annotated[Union[...], Discriminator("kind")]` for `kind`-discriminated wire unions; wrap a union root in `RootModel[...]` where top-level decoding of the union is needed.
- Use `enum.StrEnum` for wire string enums; the member values are the exact wire strings (e.g. `class Status(StrEnum): DRAFT = "draft"; PUBLISHED = "published"`).
- For typed primitives (IRI, language tag, model version, token, embedded-artifact key, prompt key, and similar), use `typing.NewType` for nominal static typing plus a validating factory function, or a small Pydantic wrapper / `Annotated[str, AfterValidator(...)]` where richer runtime validation is wanted. Pick one approach and apply it consistently.
- `model_version` is a top-level field on every concrete artifact model (`Template`, `TemplateInstance`, every field model, every presentation-component model), not nested inside the versioning model.
- Cover the constructs added by recent issues:
    - `editability` (`"editable" | "readOnly"`, a `StrEnum`) on every embedded field, parallel to `visibility`.
    - `Section` / `TemplateMember` / `Collapsibility`: a template's `members` (and a section's `members`) is `list[TemplateMember]`, where `TemplateMember` is the discriminated union of the embedded-artifact union and `Section`. `Section` is a recursive model (`kind`, `label`, optional `description`, optional `collapsibility`, and its own `list[TemplateMember]`); it carries no key and yields no instance values, so the routine that flattens a template to a key-to-embedded-artifact mapping recurses into a section's members but contributes no entry for the section itself.
    - `AlternativePrompt` (a prompt key plus a `MultilingualString`) repeated on every field, and an optional prompt key on every embedded field. The prompt key is an ASCII-identifier primitive. An embedding must not carry both `prompt_key` and `prompt_override`; reject that at construction with a `model_validator`.

## Naming And Wire Aliases

- Expose pythonic snake_case attribute names while preserving the wire's lowerCamelCase, using `Field(alias="lowerCamelName")` together with `model_config = ConfigDict(populate_by_name=True)`.
- Serialize with `by_alias=True` so output uses the wire names; accept both alias and python name on input via `populate_by_name=True`.

## Optionality And None

- Express absence as `T | None` with default `None`.
- Omit absent optionals from serialized output: configure `model_dump_json(exclude_none=True)` (or a wrapper / `ConfigDict(json_dumps_kwargs={"exclude_none": True})`), and never emit `null` for an absent optional. Decoders reject a property whose value is `null` (per `serialization.md`).
- Keep the public surface free of surprising `None` per the `bindings.md` "Optional component" guidance. For defaulted-optional slots (`visibility`, `editability`, `value_requirement`, `cardinality`, `collapsibility`), provide a property or helper that resolves the defined default and returns the value directly. For genuinely-optional slots, the attribute is simply `T | None` and callers handle `None`.
- Do **not** normalise a default into stored state for an absent slot (e.g. storing `"visible"` when `visibility` was absent); that would re-emit an omitted property and break round-trip equality (`serialization.md`). Resolve defaults at read time; preserve absence (`None`) in storage.

## Constructors And Factories

- The canonical Pydantic model constructor is the narrow, wire-shaped entry point used by validation and (de)serialization; keep it available.
- Provide module-level factory functions that accept broader inputs and normalise to the canonical form, for example:
    - `iri(value)` accepting `str` already-`Iri`
    - `multilingual_string(input)` accepting a bare `str`, a `(value, lang)` pair, a `{lang: value}` mapping, or a list of these
    - `text_value(value, lang=None)`
- Factories validate the same invariants as the model and never return a partially valid object.
- Provide convenience constructors where they read well: `LangString.of(value, lang)`, `MultilingualString.en(value)`, `TextValue.of(value)`, `IntegerNumberValue.of(123)`, `EnumValue.of(token)`.
- Avoid an untyped generic factory that erases the family-specific model; factories should reinforce the typed binding shape.

## Docstrings

- Provide thorough PEP 257 docstrings on every public model, `StrEnum`, factory function, and accessor. Choose one docstring style (Google or NumPy) and apply it uniformly.
- Docstrings must explain the CEDAR production being represented, its role in the model, and any important invariants.
- For discriminated unions, document the union semantics, the `kind` discriminant, and the permitted variants.
- For models, document the wire shape at a useful level and document each field (its meaning, default-on-absence where relevant).
- For factories, document accepted inputs (`Args:`), what is returned (`Returns:`), and what is raised (`Raises:`) with the conditions.
- For `StrEnum` types, document the wire string each member maps to and when it is used.
- For the serialize/parse layer, document decode/encode behaviour, validation behaviour, raised exceptions, and round-trip expectations.
- Reference CEDAR terminology from `grammar.md`, `wire-grammar.md`, `serialization.md`, `validation.md`, and `bindings.md`. Do not write empty boilerplate docstrings that merely restate the type. Keep inline comments sparse; put user-facing conceptual documentation in docstrings.

## Serialization

- Keep a dedicated serialize/parse layer; decoding produces typed models, encoding produces JSON-compatible data.
- Decode with `Model.model_validate_json(...)` / `model_validate(...)`; encode with `model_dump_json(by_alias=True, exclude_none=True)`.
- Preserve exact wire `kind` names and property names; do not alias `kind`.
- Reject unknown properties (`model_config = ConfigDict(extra="forbid")`), `null`-valued optionals, and lexically invalid leaf values, reporting before or during construction.
- Typed primitives collapse to bare JSON primitives on the wire; reconstruct the typed form on parse from the value plus the field's declared type.
- Python `int` is unbounded, so large `NonNegativeInteger` values need no special handling on the model side; the encoder must still emit the string-fallback form when the wire grammar requires it for out-of-range integers.

## Validation

- Enforce construction-time invariants with `@field_validator` / `@model_validator(mode="after")` (lexical form, uniqueness, numeric ordering, mutual exclusion, etc.); raise a single `CedarConstructionError` for invariant failures.
- Where a validation algorithm is provided (`validation.md`), implement collected validation errors matching the spec's `category`, `path`, `production`, and `message` shape (do not rely solely on Pydantic's own `ValidationError` text for that surface).
- A validator may inspect untyped data internally, but decoded artifacts are typed models, never `dict`.

## Acceptance Criteria

- All valid normative fixtures decode to typed models and re-encode to JSON-tree equivalent output (property-order-independent). An absent optional must round-trip as absent: it is omitted on encode, never emitted as `null` or as its resolved default (`serialization.md`).
- All invalid normative fixtures report at least the expected errors.
- The test suite (e.g. pytest) must cover valid round-trips and invalid expected-error manifests, walking the `spec/normative-tests/` fixtures.
- Type checking (e.g. `mypy` or `pyright` in strict mode) must pass, and the public API must be exported from the package's `__init__.py`.
- The source tree must demonstrate the module-per-family layout before considering the task done.
