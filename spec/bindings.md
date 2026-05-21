# Host-Language Bindings

This document gives guidance on how to map the abstract grammar
([`grammar.md`](grammar.md)) and the JSON wire format
([`wire-grammar.md`](wire-grammar.md)) onto host-language types and
idioms in TypeScript, Java, and Python.

## 1. Purpose and Scope

The CEDAR Structural Model is layered:

- [`grammar.md`](grammar.md) defines *what the model is* — the abstract
  productions, their components, and the structural invariants they
  satisfy.
- [`wire-grammar.md`](wire-grammar.md) defines *what the JSON looks
  like* — exactly one JSON shape per abstract production, with
  discriminator placement and inline constraints.
- [`serialization.md`](serialization.md) defines *the encoding rules*
  that frame the wire shapes — property naming, NFC normalisation,
  big-integer fallback, the wrapping principle.
- This document defines *how those JSON shapes become host-language
  values* — the in-memory types a binding library exposes, and the
  idioms it follows.

Where the prior three documents are normative, this one is
**recommendation-grade**. A binding conforms by realising the
meta-categories in §2 with idioms compatible with the spirit of the
recommendations below; deviations are allowed but SHOULD be documented
in the binding's own README.

**In scope:** TypeScript, Java (17+), Python (3.11+).

**Out of scope (for now):** Rust, Go, C#, Swift, Kotlin, and other
languages. New languages can be added by following the meta-pattern in
§2 — for each category, name an idiomatic realisation that preserves
the wire round-trip and the construction-time invariants.

The reference TypeScript implementation is
[cedar-ts](https://github.com/metadatacenter/cedar-ts) (npm package
`@metadatacenter/cedar-model`); see §5. For idioms not covered
explicitly here, cedar-ts is the source of truth on the TS side.

---

## 2. Meta-Categories

Each subsection below covers one structural pattern that recurs across
the wire grammar. For every category we give:

- a one-paragraph definition in terms of the grammar / wire-grammar;
- a TypeScript idiom (reflecting cedar-ts);
- a Java idiom (Java 17+, Jackson 2.x with `jackson-databind` and
  `jackson-datatype-jdk8`);
- a Python idiom (Pydantic v2; `attrs` / `dataclass` mentioned where
  appropriate);
- validation guidance — when and where the binding enforces the
  associated constraints;
- a small worked example translating the same abstract production three
  ways.

> **Reading note: Jackson-annotation density.** The Java idioms in this
> section annotate every record component explicitly with
> `@JsonProperty(...)` and every mapping constructor with
> `@JsonCreator`. The intent is unambiguous wire-to-Java mapping that
> does not depend on parameter-name reflection (the `-parameters`
> compiler flag) or on positional binding. A real binding MAY rely on
> Jackson defaults — e.g. record component name introspection plus
> implicit canonical-constructor binding — and elide most of these
> annotations; the explicit form here is the lower bound on what the
> binding contract requires, not the only style permitted.
>
> **Forward references.** §2 mentions cedar-ts module names
> (`leaves/`, `embedded/`, etc.) and a few productions
> (`EmbeddedArtifact`, `Template.members`) before they are introduced
> in detail. The cedar-ts module layout is in §5; the productions
> themselves are defined in [`grammar.md`](grammar.md) and
> [`wire-grammar.md`](wire-grammar.md).

### 2.1 Plain object production

**What it is.** A wire production written as `T ::: object { ... }`
with no `"kind": "..."` literal property. These are the
*singleton-only productions* of the wire grammar — productions that
never appear as alternatives in any `discriminator: kind` union, and
therefore never carry `kind` on the wire (per the kind rule,
[`wire-grammar.md`](wire-grammar.md) §1.5). Examples: `Cardinality`,
`Property`, `LabelOverride`, `LifecycleMetadata`,
`SchemaArtifactVersioning`, `Annotation`, `Unit`, `OntologyReference`,
`OntologyDisplayHint`, `ControlledTermClass`, `PermissibleValue`,
`Meaning`.

**TypeScript idiom.** A `readonly` interface plus a constructor
function. No `kind` field on the interface.

```typescript
export interface Cardinality {
  readonly min: number;
  readonly max?: number;
}

export interface CardinalityInit {
  readonly min: number;
  readonly max?: number;
}

export function cardinality(init: CardinalityInit): Cardinality {
  const out: { min: number; max?: number } = {
    min: assertNonNegativeInteger(init.min),
  };
  if (init.max !== undefined) out.max = assertNonNegativeInteger(init.max);
  return out;
}
```

**Java idiom.** A `record` whose components mirror the wire properties.
No Jackson type info is needed because the value lives at a singleton
position and is decoded by its enclosing field's static type.

```java
public record Cardinality(
        @JsonProperty("min") int min,
        @JsonProperty("max") @JsonInclude(NON_NULL) Integer max) {
    @JsonCreator
    public Cardinality {
        if (min < 0) throw new CedarConstructionException("Cardinality.min must be >= 0");
        if (max != null && max < 0) throw new CedarConstructionException("Cardinality.max must be >= 0");
    }
}
```

**Python idiom.** A Pydantic v2 model with `frozen=True` and aliases
for any name that differs from `snake_case`.

```python
from pydantic import BaseModel, ConfigDict, Field

class Cardinality(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)
    min: int = Field(ge=0)
    max: int | None = Field(default=None, ge=0)
```

**Validation guidance.** Range checks (e.g., `min >= 0`) and any
inline constraints from `wire-grammar.md` apply at construction time.
The constructed value is always valid; downstream code never has to
revalidate.

**Worked example: `Cardinality { min: number; max?: number }`.** The
wire shape is `{ "min": 0, "max": 5 }`; the three idioms above produce
that JSON via their language's natural serializer (TS via plain
`JSON.stringify`; Java via Jackson default mapper; Python via
`model_dump_json()`).

### 2.2 Discriminated union with `kind` tag

**What it is.** A wire production written as `T ::: A | B | …` with
either an explicit `// discriminator: kind` comment or no discriminator
comment at all (in which case `kind` is the default per
[`wire-grammar.md`](wire-grammar.md) §1.3). Each member is an object
production whose shape includes a `"kind": "MemberName"` literal
property. Examples: `Value`, `FieldSpec`, `EmbeddedArtifact`,
`ControlledTermSource`, `PresentationComponent`, `InstanceValue`,
`SchemaArtifact`, `Artifact`,
`ExternalAuthorityValue`, `DateValue`.

**TypeScript idiom.** A discriminated (tagged) union of interfaces, all
sharing a `kind: "..."` field as their literal-typed discriminant.
Construction goes through per-variant factory functions; type-narrowing
is by `switch` on `value.kind`.

```typescript
export interface TextValue {
  readonly kind: 'TextValue';
  readonly value: string;
  readonly lang?: LanguageTag;
}
export interface IntegerNumberValue {
  readonly kind: 'IntegerNumberValue';
  readonly value: string;
}
export type Value = TextValue | IntegerNumberValue /* | … */;

export function textValue(value: string, lang?: LanguageTag): TextValue {
  return lang === undefined
    ? { kind: 'TextValue', value }
    : { kind: 'TextValue', value, lang };
}
```

**Java idiom.** A sealed interface with one record per variant and
Jackson's polymorphic-type annotations using the property name `kind`.

```java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = TextValue.class, name = "TextValue"),
    @JsonSubTypes.Type(value = IntegerNumberValue.class, name = "IntegerNumberValue")
})
public sealed interface Value permits TextValue, IntegerNumberValue { }

@JsonTypeName("TextValue")
public record TextValue(
        @JsonProperty("value") String value,
        @JsonProperty("lang") @JsonInclude(NON_ABSENT) Optional<String> lang)
        implements Value {
    @JsonCreator
    public TextValue { }
}

@JsonTypeName("IntegerNumberValue")
public record IntegerNumberValue(@JsonProperty("value") String value)
        implements Value {
    @JsonCreator
    public IntegerNumberValue { }
}
```

**Python idiom.** A discriminated `Union` annotated with
`pydantic.Discriminator("kind")`. Each variant carries a `kind:
Literal["..."]` field.

```python
from typing import Literal, Annotated, Union
from pydantic import BaseModel, ConfigDict, Discriminator

class TextValue(BaseModel):
    model_config = ConfigDict(frozen=True)
    kind: Literal["TextValue"] = "TextValue"
    value: str
    lang: str | None = None

class IntegerNumberValue(BaseModel):
    model_config = ConfigDict(frozen=True)
    kind: Literal["IntegerNumberValue"] = "IntegerNumberValue"
    value: str

Value = Annotated[Union[TextValue, IntegerNumberValue], Discriminator("kind")]
```

For complex roots, wrap in a `pydantic.RootModel[Value]` to permit
top-level decoding via `Value.model_validate_json(...)`.

**Validation guidance.** The decoder rejects any input whose `kind`
value is not a known member. Encoders MUST emit `kind` with the exact
production name (no aliasing). The construction-time invariants of
each variant apply normally.

**Worked example: `Value` (subset: `TextValue | IntegerNumberValue`).** Wire
shape: `{"kind": "TextValue", "value": "hi"}`. All three idioms decode
that JSON to a value whose static type is `Value` and whose runtime
narrowing predicate (`value.kind === 'TextValue'` / `instanceof TextValue`
/ `isinstance(v, TextValue)`) returns true.

**Java note: nested sealed interfaces and Jackson dispatch tables.**
Where a sealed union permits another sealed union as a member, the
outer union's `@JsonSubTypes` SHOULD enumerate all *leaf* concrete
records directly — a **flat dispatch table** — rather than delegating
to the intermediate sealed interface.

*Rationale.* Nested-`@JsonTypeInfo` delegation through an intermediate
sealed interface is fragile in Jackson 2.x: the resolver re-enters
the deserializer chain at the inner interface, which can fight with
`@JsonTypeName` on the leaves and produce spurious failures. The
wire form already requires `kind` to be one of the leaf names (never
an intermediate-group name), so a flat dispatch table is correct by
construction.

*Example.* `EmbeddedArtifact` is a sealed union over `EmbeddedField`
and `EmbeddedPresentationComponent`, with `EmbeddedField` itself
sealed over the 20 family records (`EmbeddedTextField`,
`EmbeddedIntegerNumberField`, etc.). The Jackson registration on
`EmbeddedArtifact` should list every leaf record (all 20
`EmbeddedXxxField` records plus every `EmbeddedXxxComponent`
record) in `@JsonSubTypes`, not the intermediate `EmbeddedField`
interface.

### 2.3 Position-discriminated union

**What it is.** A wire production written as `T ::: A | B | …` *and
explicitly declared* `// discriminator: position` in the wire
grammar. The variant is determined entirely by the enclosing property
and surrounding context; the encoded object itself carries no
discriminator. The principal example is `RenderingHint` inside the
various `FieldSpec` families: each `FieldSpec` family fixes which
`RenderingHint` variant is permitted at its `renderingHint` slot, so
the rendering hint encodes without a `kind` tag.

> **Note: position-discriminated vs. positionally-determinate.** A
> position-discriminated union (this section) is one the wire grammar
> *declares* with `// discriminator: position`, and whose members
> therefore carry no `kind` on the wire. This is distinct from the
> larger class of unions whose *use sites* happen to be positionally
> determinate but which the wire grammar declares with the default
> `discriminator: kind`. The umbrella `FieldSpec` union is a good
> example of the latter: every actual use site (`XxxField.fieldSpec`)
> is typed with the per-family concrete production (`TextFieldSpec`,
> `IntegerNumberFieldSpec`, …) so the variant could in principle be
> recovered positionally, but `FieldSpec` is `discriminator: kind` so
> every member still carries `"kind"` on the wire per the kind rule
> (§1.5). Use this section only for productions explicitly flagged
> `// discriminator: position`.

Bindings can usually realise each use site as a single concrete
class, since the position fixes the variant. There is no need for a
runtime union at the use site.

**TypeScript idiom.** A single concrete interface per use site; the
abstract union (`RenderingHint`) exists only as a documentation alias
and is not used as a runtime narrowing target.

**Java idiom.** A concrete record per use site. The intermediate
union interface MAY exist purely for documentation but does not need
Jackson polymorphism.

**Python idiom.** A concrete `BaseModel` per use site; the abstract
union may be exposed as a `TypeAlias` for documentation.

**Validation guidance.** None special — the variant is fixed by the
enclosing property's type. Decoders SHOULD NOT attempt cross-variant
disambiguation at this position.

**Worked example: `DateRenderingHint` inside `DateFieldSpec.renderingHint`.**
Wire: `{"kind":"DateFieldSpec","dateValueType":"fullDate","renderingHint":{"componentOrder":"dayMonthYear"}}`. The
`renderingHint` property is statically typed as `DateRenderingHint`;
no `kind` tag appears on the inner object since the position fixes
the variant.

### 2.4 Typed primitive wrapper

**What it is.** A wire production written as `T ::: string` (or
`number`) where `T` names a specialised role for the primitive — `Iri`,
`FieldId`, `TemplateId`, `OrcidIri`, `LanguageTag`, `Bcp47Tag`, etc.
On the wire these collapse to the underlying primitive; in the
abstract grammar they are typed roles whose constraints (IRI
well-formedness, BCP 47, ASCII identifier shape) MUST be enforced at
decode time.

The trade-off: typed wrappers catch role mismatches (passing a
`TemplateId` where a `FieldId` is expected) at compile time, at the
cost of some construction friction. Plain strings are ergonomic but
cede that protection to runtime checks. Bindings MAY choose either
end of this spectrum; cedar-ts wraps strongly.

**TypeScript idiom.** Two patterns are in common use: a structural
object wrapper carrying `kind`, and a TypeScript *branded type*
(a compile-time-only role tag added to a primitive via a phantom
`__brand` property of a string-literal type — the value is still a
plain string at runtime, but the type system treats `Iri` and a
generic `string` as distinct types). The structural wrapper costs one
allocation per identifier but gives full structural typing in IDEs;
the branded type costs nothing at runtime but enforces the role only
at compile time. cedar-ts uses Option A.

*Option A — structural wrapper.* The cedar-ts choice for `Iri`,
`FieldId`, and the typed-id families:

```typescript
export interface Iri { readonly kind: 'Iri'; readonly value: string; }
export function iri(value: string): Iri {
  return { kind: 'Iri', value: parseIriString(value) };
}
```

cedar-ts's `FieldId` family uses this form with a per-family `kind`
discriminant so the twenty families remain distinguishable in the type
system.

*Option B — branded type.* A lighter alternative; the value is a bare
string at runtime, the type system enforces the role at compile time:

```typescript
export type Iri = string & { readonly __brand: 'Iri' };
export function iri(value: string): Iri { /* validate */ return value as Iri; }
```

**Java idiom.** A dedicated value record:

```java
public record Iri(@JsonValue String value) {
    public Iri {
        if (!IriSyntax.isValid(value)) throw new CedarConstructionException("Invalid IRI: " + value);
    }
    @JsonCreator public static Iri of(String value) { return new Iri(value); }
}
```

`@JsonValue` / `@JsonCreator` collapses to and from a bare JSON string
so the wire form remains primitive while the in-memory type is
nominal.

**Python idiom.** `typing.NewType('Iri', str)` for nominal typing in
static analysis; the runtime value is a plain `str` and serialises as
such.

```python
from typing import NewType
Iri = NewType("Iri", str)

def iri(value: str) -> Iri:
    if not is_iri(value):
        raise CedarConstructionError(f"Invalid IRI: {value!r}")
    return Iri(value)
```

For richer runtime validation, a Pydantic `BaseModel` wrapper or an
`Annotated[str, AfterValidator(...)]` form is also fine; the
`NewType` form is the lightest.

**Validation guidance.** All typed primitive wrappers MUST enforce their
syntactic constraints (RFC 3987 for IRI; BCP 47 for language tags; the
ASCII pattern `[A-Za-z][A-Za-z0-9_-]*` for `EmbeddedArtifactKey`;
SemVer for `Version` / `ModelVersion`) at the constructor.

**Worked example: `Iri` and `FieldId`.** `Iri` wire form: `"https://example.org/x"`.
`FieldId` wire form: also `"https://example.org/x"` — the family is
recovered from the surrounding `kind`. Bindings reconstruct the
typed form by combining the JSON string with the static type at the
use site.

### 2.5 `MultilingualString`

**What it is.** A `MultilingualString` is an array of one or more
`{value, lang}` localizations of the same conceptual string — for
example, the English, French, and German labels for one field. The
wire production is `MultilingualString ::: nonEmptyArray<LangString>`,
with two invariants:

- The array MUST be non-empty.
- Lang tags MUST be unique within the array (case-folded, see
  [`wire-grammar.md`](wire-grammar.md) §2.2).

A `MultilingualString` is *distinct* from a single language-tagged
`TextValue`. A `TextValue` is one tagged object carrying `kind`,
`value`, and `lang` — a single localized string. A
`MultilingualString` is an array of localizations of the same
conceptual string. The two are not interchangeable.

The `(value, lang)` pattern recurs across all three target languages
and deserves its own section because the non-empty-and-unique-lang
invariants need explicit support.

**TypeScript idiom.** A `readonly` array alias plus a constructor that
enforces invariants and returns a frozen array. cedar-ts accepts a
range of input shapes — bare string, `{value, lang}`, `[value, lang]`,
`{ [lang]: value }` map, or an array of any of those — and normalises
them to the canonical array form.

```typescript
export type MultilingualString = readonly LangString[];
export interface LangString { readonly value: string; readonly lang: string; }

export function multilingualString(input: MultilingualStringInput): MultilingualString {
  // normalise, BCP 47-validate every lang, dedup-check, freeze, return.
}
```

**Java idiom.** Two records, with the outer carrying the invariants:

```java
public record LangString(
        @JsonProperty("value") String value,
        @JsonProperty("lang") String lang) {
    @JsonCreator
    public LangString { /* BCP 47 check on lang */ }
}

public record MultilingualString(@JsonValue List<LangString> entries) {
    public MultilingualString {
        if (entries == null || entries.isEmpty())
            throw new CedarConstructionException("MultilingualString must be non-empty");
        var seen = new java.util.HashSet<String>();
        for (var e : entries) {
            if (!seen.add(e.lang().toLowerCase(Locale.ROOT)))
                throw new CedarConstructionException("Duplicate lang tag: " + e.lang());
        }
        entries = List.copyOf(entries);
    }
    @JsonCreator public static MultilingualString of(List<LangString> entries) { return new MultilingualString(entries); }
}
```

A `NonEmptyList<T>` helper type is a reasonable cross-cutting
abstraction if the binding has several non-empty arrays to model.

**Python idiom.** A Pydantic model with a `model_validator(mode="after")`
enforcing non-empty and unique lang tags:

```python
from pydantic import BaseModel, ConfigDict, RootModel, model_validator

class LangString(BaseModel):
    model_config = ConfigDict(frozen=True)
    value: str
    lang: str  # validate BCP 47 with a field validator

class MultilingualString(RootModel[list[LangString]]):
    model_config = ConfigDict(frozen=True)

    @model_validator(mode="after")
    def _check(self):
        entries = self.root
        if not entries:
            raise CedarConstructionError("MultilingualString must be non-empty")
        seen = set()
        for e in entries:
            key = e.lang.lower()
            if key in seen:
                raise CedarConstructionError(f"Duplicate lang tag: {e.lang!r}")
            seen.add(key)
        return self
```

`attrs` with `__attrs_post_init__` is a lighter alternative; the
recommendation is Pydantic for the JSON round-trip story.

**Validation guidance.** Validate at construction. A constructed
`MultilingualString` is always non-empty and always lang-unique.

### 2.6 Optional component

**What it is.** A grammar production component marked `[X]`. On the
wire the property is encoded only when present
([`serialization.md`](serialization.md) §4.2): conforming encoders
MUST NOT emit `null` or empty strings in place of an absent optional.

**TypeScript idiom.** `prop?: T`. The interface treats omission and
`undefined` identically; encoders skip the property at JSON write time.
Use `JSON.stringify` with no `null`-injection logic; the property is
naturally absent from the serialised output.

**Java idiom.** Prefer `@Nullable T` over `Optional<T>` in record
components. Jackson handles `null`/missing properties on records
cleanly with `@JsonInclude(JsonInclude.Include.NON_NULL)` at either
the field or class level. `Optional<T>` works but interacts awkwardly
with records (Jackson must be configured to recognise empty
`Optional`s) and adds a layer of allocation per access.

```java
public record Cardinality(
        @JsonProperty("min") int min,
        @JsonProperty("max") @JsonInclude(NON_NULL) Integer max) { … }
```

**Python idiom.** `T | None` with default `None`; Pydantic respects
the optional semantics and excludes `None` fields from
`model_dump_json(exclude_none=True)`.

```python
class Cardinality(BaseModel):
    model_config = ConfigDict(frozen=True)
    min: int = Field(ge=0)
    max: int | None = Field(default=None, ge=0)

# Round-trip omits `max` when None:
c = Cardinality(min=0)
c.model_dump_json(exclude_none=True)  # '{"min":0}'
```

Set `model_config = ConfigDict(json_dumps_kwargs={"exclude_none": True})`
or use a custom `model_dump_json` wrapper to make this implicit.

**Validation guidance.** Decoders MUST treat `"prop": null` as an
encoding error (per [`serialization.md`](serialization.md) §4.2),
distinct from omission of the property.

### 2.7 String enum

**What it is.** A wire production `T ::: "a" | "b" | …` whose values
are drawn from a fixed set. All values are `lowerCamelCase` per
[`serialization.md`](serialization.md) §3.3. Examples: `Status`,
`ValueRequirement`, `Visibility`, `DateValueType`, `DateComponentOrder`,
`TimeFormat`, `TimePrecision`, `DateTimeValueType`,
`TimezoneRequirement`, `RealNumberDatatypeKind` (three values), the
flat-string rendering hints (`TextRenderingHint`,
`SingleValuedEnumRenderingHint`, `MultiValuedEnumRenderingHint`,
`BooleanRenderingHint`).

**TypeScript idiom.** A string-literal union. cedar-ts also exports a
frozen array of permitted values and an `isXxx` type guard.

```typescript
export type Status = 'draft' | 'published';
export const STATUSES: readonly Status[] = Object.freeze(['draft', 'published']);
export const isStatus = (x: unknown): x is Status =>
  typeof x === 'string' && (STATUSES as readonly string[]).includes(x);
```

**Java idiom.** A Java `enum` whose constants are uppercase by
convention, with `@JsonProperty` annotations mapping each constant to
its `lowerCamelCase` wire value:

```java
public enum Status {
    @JsonProperty("draft") DRAFT,
    @JsonProperty("published") PUBLISHED
}
```

Jackson uses the annotation for both serialization and
deserialization. An unknown wire value yields Jackson's standard
`InvalidFormatException`. Bindings that prefer to surface custom
errors, or that need a wire accessor on the enum (e.g. for non-Jackson
code paths), can use the `@JsonValue` / `@JsonCreator` pair instead.

**Python idiom.** `enum.StrEnum` (Python 3.11+); Pydantic accepts and
emits the string form directly.

```python
from enum import StrEnum
class Status(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
```

**Validation guidance.** Decoders MUST reject string values not in the
declared set. The enum surface must be closed: future wire-grammar
additions trigger a binding version bump.

### 2.8 Repeated component

**What it is.** A grammar component marked `X*` (zero-or-more) or `X+`
(one-or-more). On the wire both encode as JSON arrays
([`wire-grammar.md`](wire-grammar.md) §1.1, §4.3); `X+` is written as
`nonEmptyArray<X>` and carries the non-empty invariant. Order MUST be
preserved through encode and decode.

**TypeScript idiom.** `readonly T[]` with an explicit non-empty check
in the constructor for `X+` cases. cedar-ts uses `Object.freeze` on
constructed arrays where the position carries an invariant
(`MultilingualString`, `embedded` in `Template`).

**Java idiom.** `List<T>`. Jackson handles arrays out of the box. For
non-empty cases, validate at the constructor with `if
(list.isEmpty()) throw …` and store as `List.copyOf(list)` to enforce
immutability.

**Python idiom.** `list[T]`. Pydantic handles arrays out of the box.
For non-empty, use `Field(min_length=1)` or a `model_validator`.

**Validation guidance.** Decoders MUST reject empty arrays at
`nonEmptyArray<X>` positions. Encoders MUST preserve element order.

### 2.9 Constraints

**What it is.** Inline `//`-comments on `wire-grammar.md` productions
declare constraints not expressible in the type expression. The
constraint kinds in current use are:

- **Lexical-form well-formedness.** Values matching a syntactic
  category — e.g. BCP 47 language tags, the ASCII identifier pattern
  `[A-Za-z][A-Za-z0-9_-]*` for `EmbeddedArtifactKey`, RFC 3987 IRIs,
  SemVer for `Version` / `ModelVersion`, ISO 8601 date-time stamps.
- **Uniqueness across a collection.** Distinctness of an entry's
  identifying property within an array or set — e.g.
  `EmbeddedArtifact.key` values must be unique within a `Template`,
  `LangString.lang` tags must be unique within a `MultilingualString`,
  `PermissibleValue.value` tokens must be unique within an enum spec.
- **At-least-one-of.** A production with all-optional components
  requires at least one to be present — e.g. `OntologyDisplayHint`
  requires at least one of `acronym` or `name`.
- **Value relationships across slots.** A value at one slot must agree
  with another slot — e.g. the IRI placed at a field's `id` MUST
  belong to a field of the same family as the enclosing `kind`.
- **Numeric ordering.** Where a production carries paired bounds, the
  lower bound must not exceed the upper — e.g. `Cardinality.min ≤
  Cardinality.max`.

Bindings SHOULD validate at construction time and throw a
binding-specific exception type. A constructed instance is then always
valid; downstream code may rely on the construction guarantee.

Recommend one canonical exception class per binding:

```typescript
export class CedarConstructionError extends Error {
  constructor(message: string) { super(message); this.name = 'CedarConstructionError'; }
}
```

```java
public class CedarConstructionException extends RuntimeException {
  public CedarConstructionException(String message) { super(message); }
}
```

```python
class CedarConstructionError(Exception):
    pass
```

**Validation guidance.** Validate eagerly at construction. Lazy
validation (deferring checks until access) is discouraged: the model
is value-typed; an invalid value should never exist in the runtime
heap. Where validation depends on a wider context (e.g., embedded-key
uniqueness depends on the whole `Template.members` array), perform
the check in the enclosing constructor.

### 2.10 Widening constructors

**What it is.** An ergonomic pattern in which a constructor accepts a
broader set of input shapes than its return type: `iri()` accepts
`Iri | string`; `multilingualString()` accepts `string | LangString |
{ [lang]: string } | LangString[]`; `property()` accepts `string | Iri
| PropertyInit`. The widened constructor narrows to the canonical wire
shape, validating along the way. When the input is already in
canonical form the constructor SHOULD return it unchanged (so e.g.
`iri(iri(s))` is well-defined and equivalent to `iri(s)`); this lets
callers chain widening constructors without redundancy concerns.

This is *recommended-but-not-required*. A binding's *narrow* (canonical)
constructor — taking exactly the wire-grammar shape — MUST exist;
widening factories are convenience layers on top.

**TypeScript idiom.** Function overloads or a single union-typed input
parameter; the function dispatches on `typeof` / structural shape.

**Java idiom.** Static factory overloads on the record:
`Iri.of(String)`, `Iri.of(URI)`. Avoid widening the canonical record
constructor itself, which Jackson uses; add overloads as static
methods so the wire-shape constructor remains unambiguous.

**Python idiom.** Module-level factory functions accepting `Union`
types; the canonical Pydantic model constructor remains for the
narrow shape. Avoid `__init__` overloading via sentinels; prefer
explicit factory functions (`iri.from_string`, etc.).

### 2.11 Immutability

Strongly recommend immutable-by-default for all binding types. A CEDAR
artifact is a value; mutability is a hazard.

- TypeScript: `readonly` on every interface property; `Object.freeze()`
  on constructed instances and on any nested arrays. cedar-ts freezes
  invariant-bearing arrays (`MultilingualString`,
  `Template.members`).
- Java: `record` types are immutable by language design; for non-record
  classes use `final` fields, no setters, and defensive copies on
  collections (`List.copyOf`, `Set.copyOf`, `Map.copyOf`).
- Python: Pydantic models with `model_config = ConfigDict(frozen=True)`;
  dataclasses with `@dataclass(frozen=True)`.

Equality is structural: two values with the same component values are
equal regardless of allocation identity. Records and Pydantic models
provide this automatically; TypeScript binders need a shallow-equality
helper if equality is meaningful at call sites.

### 2.12 Override-precedence accessors

**What it is.** Several grammar slots come in pairs: a canonical value
on a reusable artifact and an optional override on the embedding site.
The override wins per the spec's two-layer precedence rule
([`grammar.md`](grammar.md) §Defaults; [`presentation.md`](presentation.md)
§Help-Text Rendering). The current pairs:

| Reusable artifact slot                       | Embedding-site override slot                  |
|---|---|
| `Field.fieldSpec.defaultValue`               | `EmbeddedXxxField.defaultValue`               |
| `Field.label` / `Field.metadata.altLabels`   | `EmbeddedXxxField.labelOverride.label` / `altLabels` |
| `Field.helpText`                             | `EmbeddedXxxField.helpTextOverride`           |

**Binding guidance.** Bindings SHOULD expose a small convenience
accessor per pair so call sites do not re-implement the precedence
rule. The accessor takes the `EmbeddedField` and the resolved `Field`
and returns the effective value:

```ts
// TypeScript
function resolvedHelpText(
  embedded: EmbeddedTextField,
  field: TextField,
): MultilingualString | undefined {
  return embedded.helpTextOverride ?? field.helpText;
}
```

```java
// Java
public static Optional<MultilingualString> resolvedHelpText(
    EmbeddedTextField embedded, TextField field) {
  return Optional.ofNullable(embedded.helpTextOverride())
                 .or(() -> Optional.ofNullable(field.helpText()));
}
```

```python
# Python
def resolved_help_text(
    embedded: EmbeddedTextField, field: TextField
) -> MultilingualString | None:
    return embedded.help_text_override or field.help_text
```

The same pattern applies to `defaultValue` and `labelOverride.label`,
each with its own accessor. Replace, not merge: the override
*replaces* the canonical value at the embedding site; partial
localization fallback (e.g., one language overridden, others falling
through) is **not** part of the precedence rule. Bindings MUST NOT
synthesise such fallback.

---

## 3. Naming Conventions per Language

| Language   | Types               | Functions / methods / properties | Constants                 |
|------------|---------------------|----------------------------------|---------------------------|
| TypeScript | `UpperCamelCase`    | `lowerCamelCase`                 | `SCREAMING_SNAKE_CASE`    |
| Java       | `UpperCamelCase`    | `lowerCamelCase`                 | `SCREAMING_SNAKE_CASE`    |
| Python     | `UpperCamelCase`    | `snake_case`                     | `SCREAMING_SNAKE_CASE`    |

**Reserved-word collisions (Java).** As of the current model no
grammar property name collides with a Java reserved word. (Verified
by cross-referencing every property name in
[`wire-grammar.md`](wire-grammar.md) against the full Java
reserved-word list.) A future grammar property whose name collides
with a Java reserved word SHOULD be escaped by either renaming the
Java field to a non-reserved synonym (e.g. `isFoo` for a wire `foo`)
or using a leading underscore (`_foo`), in either case mapping back
to the wire name via `@JsonProperty("foo")`. The wire name remains
canonical.

**Property naming (Python).** Pydantic models can use `Field(alias=
'lowerCamelName')` together with `model_config = ConfigDict(
populate_by_name=True)` to expose Python `snake_case` attribute names
while preserving the wire's `lowerCamelCase`. This is the recommended
pattern:

```python
class SchemaArtifactVersioning(BaseModel):
    model_config = ConfigDict(populate_by_name=True, frozen=True)
    version: str
    status: Status
    previous_version: str | None = Field(default=None, alias="previousVersion")
    derived_from: str | None = Field(default=None, alias="derivedFrom")


class TextField(BaseModel):
    model_config = ConfigDict(populate_by_name=True, frozen=True)
    kind: Literal["TextField"] = "TextField"
    id: str
    model_version: str = Field(alias="modelVersion")
    metadata: CatalogMetadata
    versioning: SchemaArtifactVersioning
    field_spec: TextFieldSpec = Field(alias="fieldSpec")
    label: MultilingualString
```

`model_version` is a top-level field on every concrete artifact class
(`Template`, `TemplateInstance`, every `XxxField`, and every
`PresentationComponent` variant); it is no longer nested inside
`SchemaArtifactVersioning`.

A binding MAY instead expose `lowerCamelCase` Python attribute names
to avoid the alias layer; the alias approach is recommended for
PEP 8 conformance on the Python surface.

---

## 4. Codebase Organisation

Bindings SHOULD organise the source tree so that **everything specific
to a single field family lives together**. A field family is the
twenty-one-way grouping introduced in `grammar.md` §3.2: `TextField`,
`IntegerNumberField`, `RealNumberField`, `BooleanField`, `DateField`,
`TimeField`, `DateTimeField`, `ControlledTermField`,
`SingleValuedEnumField`, `MultiValuedEnumField`, `LinkField`,
`EmailField`, `PhoneNumberField`, `OrcidField`, `RorField`, `DoiField`,
`PubMedIdField`, `RridField`, `NihGrantIdField`, `LanguageField`, and
`AttributeValueField`.

The "everything specific to a family" set comprises, at minimum, the
family's:

- typed identifier (`TextFieldId`, etc.)
- field artifact type (`TextField`, etc.)
- field spec type (`TextFieldSpec`, etc.)
- embedded field artifact type (`EmbeddedTextField`, etc.)
- per-family value type (`TextValue`, etc.)
- any per-family rendering hint (`TextRenderingHint`, etc.)
- per-family construction helpers (widening constructors, type
  guards, JSON adapters, validators)

Per-language convention:

- **TypeScript.** A single file per family — `text-field.ts`,
  `integer-number-field.ts`, `controlled-term-field.ts`, etc. — that
  exports every type and helper in the list above. Cross-family
  abstractions (the `Field` union, the `EmbeddedField` union,
  cross-cutting helpers) live in their own files and re-export from
  the per-family files where appropriate.
- **Java.** A single package per family — `package
  org.example.cedar.field.text`, `org.example.cedar.field.integer`,
  `org.example.cedar.field.controlledterm`, etc. — containing the
  family's records, sealed interface members, type-info annotations,
  and per-family helpers. The umbrella `Field` sealed interface and
  cross-family abstractions live in a parent package
  (`org.example.cedar.field`).
- **Python.** A single module per family —
  `cedar/field/text_field.py`, etc. — paralleling the TypeScript
  layout.

The motivation is locality: any change to a field family — adding a
constraint, renaming a property, introducing a new rendering hint —
should touch one file (TS, Python) or one package (Java), not many.
This also makes it straightforward for a reader to trace a wire
property like `defaultValue` from its appearance in a
`SingleValuedEnumFieldSpec` block to the family's `EnumValue` type
without navigating across the codebase.

Bindings MAY group cross-family abstractions (the `Field` union, the
`EmbeddedField` union, the `Value` union, `Cardinality`,
`CatalogMetadata`, `SchemaArtifactVersioning`, etc.) however they
like; only family-specific code is constrained by this guideline.

---

## 5. The Reference TypeScript Binding

The reference TypeScript implementation is
[cedar-ts](https://github.com/metadatacenter/cedar-ts), published as
`@metadatacenter/cedar-model` on npm. It is the source of truth for
any TypeScript-specific idiom not covered explicitly in this document.

High-level structure (the `src/` tree mirrors the grammar layering):

- `leaves/` — primitive validators and typed leaves (`Iri`,
  `LanguageTag`, `IsoDateTimeStamp`, ASCII-id, BCP 47, SemVer, integer).
- `multilingual.ts` — `MultilingualString` and `LangString`.
- `values/` — the `Value` family. Each `Value` variant carries its
  family-specific content directly (lexical form, language tag,
  datatype, or boolean payload, as appropriate); there is no separate
  `Literal` layer.
- `identity.ts` — artifact identifiers (`FieldId`, `TemplateId`,
  `PresentationComponentId`, `TemplateInstanceId`).
- `metadata/` — `LifecycleMetadata`, `SchemaArtifactVersioning`, `Annotation`.
- `field-specs/` — `FieldSpec` family.
- `fields.ts` — `Field` family.
- `embedded/` — `EmbeddedField`, `EmbeddedTemplate`,
  `EmbeddedPresentationComponent`, plus `Cardinality`, `Property`,
  `LabelOverride`, `Visibility`, `ValueRequirement`.
- `presentation/` — `PresentationComponent` family.
- `instances/` — `TemplateInstance`, `FieldValue`,
  `NestedTemplateInstance`.
- `template.ts` — `Template`.
- `index.ts` — public API surface.

Conventions adopted by cedar-ts (already documented in §2 above):

- `readonly` on all interface properties; `Object.freeze` on
  invariant-bearing arrays.
- A canonical `xxxInit` interface alongside each `Xxx` interface,
  giving the construction-time input shape that may differ from the
  output (e.g., accepts `Iri | string` where the output stores `Iri`).
- A widening constructor function (e.g. `cardinality(init)`,
  `multilingualString(input)`) per production.
- A type guard (`isXxx`) per polymorphic production.
- A single `CedarConstructionError` thrown for all construction-time
  invariant failures.

---

## 6. Open Issues per Language

**Java.**

- For `NonEmptyList<T>`-style helper types used as a
  `MultilingualString` substrate (or anywhere a non-empty
  collection invariant must be enforced), prefer a plain final
  class or sealed interface over a `record`. Records lock the
  component layout into the canonical constructor signature, which
  constrains the API for static factories (`NonEmptyList.of(t)`,
  `NonEmptyList.of(t1, t2, …)`), varargs construction, and any
  desire to implement `List<T>` directly — all easier on a final
  class.
- Records cannot be `null`-rejected at the canonical constructor in a
  way Jackson respects without extra annotations; combining
  `@JsonInclude(NON_NULL)` with explicit checks in the canonical
  constructor body is the established pattern.

**Python.**

- Pydantic v1 vs v2 differs significantly in discriminated-union
  handling. Bindings SHOULD target v2; the recommendations in §2 use
  v2 exclusively.
- `Optional[T]` vs `T | None` is style-only since Python 3.10; prefer
  `T | None` for new code.
- `enum.StrEnum` requires Python 3.11+. Bindings targeting earlier
  versions SHOULD use `enum.Enum` subclassing `str`.

**All bindings.**

- JSON numbers exceeding `2^53 − 1` in `NonNegativeInteger` slots:
  the wire grammar allows the string-fallback encoding
  ([`wire-grammar.md`](wire-grammar.md) §2.1,
  [`serialization.md`](serialization.md) §5.1). Bindings SHOULD use
  `BigInt` (TS), `BigInteger` (Java), or `int` (Python ints are
  unbounded) on the binding side. The current model does not have any
  use site that actually exercises this — length bounds, cardinality
  bounds, traversal depths, numeric precision are all small — but the
  encoder MUST be capable of emitting the string form when given an
  out-of-range value.
- Round-trip ordering of optional properties within a tagged object
  is not significant; bindings MUST NOT rely on JSON property order
  for correctness (per [`serialization.md`](serialization.md) §4.7).

---

## 7. Reading `wire-grammar.md` as a Binding Implementer

A short cheat-sheet that maps `wire-grammar.md` notation to the
meta-categories above, so an implementer encountering a production can
quickly classify it:

| `wire-grammar.md` shape                                                           | Category                                |
|-----------------------------------------------------------------------------------|-----------------------------------------|
| `T ::: string` / `number` / `boolean` / `null`                                    | Primitive (or typed primitive wrapper — §2.4) |
| `T ::: array<X>`                                                                  | Repeated component (§2.8)               |
| `T ::: nonEmptyArray<X>`                                                          | Repeated component (§2.8); §2.5 for `MultilingualString` specifically |
| `T ::: object { … }` with no `"kind": "..."` literal property                     | Plain object production (§2.1)          |
| `T ::: object { … }` with a `"kind": "..."` literal property                      | Member of a kind-discriminated union (§2.2) |
| `T ::: A | B | …` with no comment, or `// discriminator: kind`                    | Kind-discriminated union (§2.2)         |
| `T ::: A | B | …` with `// discriminator: position`                               | Position-discriminated union (§2.3)     |
| `T ::: "a" | "b" | …`                                                             | String enum (§2.7)                      |
| `T ::: SomeOtherProduction` (collapsed wrapper, e.g. `PreferredLabel ::: MultilingualString`) | The wrapper carries no extra information; bind it as the inner type's idiom. |

Optional components are marked with `?` on the property
(`prop?: Type`) — see §2.6. Inline `//`-comments declare constraints to
enforce at construction (§2.9).

---

## 8. Cross-References

- Abstract grammar: [`grammar.md`](grammar.md)
- JSON wire shapes: [`wire-grammar.md`](wire-grammar.md)
- JSON encoding rules: [`serialization.md`](serialization.md)
- Conformance rules: [`validation.md`](validation.md)
- Reference TypeScript binding: cedar-ts (npm
  `@metadatacenter/cedar-model`)
