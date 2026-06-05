# Field Families

This is a navigation index for the 21 concrete field families defined by the spec. Each row links to the family's four principal productions in [`grammar.md`](grammar.md):

- **Field artifact** — the family's `XxxField`, a standalone reusable artifact.
- **Field spec** — the family's `XxxFieldSpec`, carried by the standalone `Field` artifact.
- **Value** — the family's instance-value production (`XxxValue`), carried by a `FieldEntry` in a `TemplateInstance`.
- **Embedded form** — the family's `EmbeddedXxxField`, used inside a `Template`'s `members` to reference the standalone field.

The conformance fixture column points at the per-family Template + Instance pair under [`normative-tests/valid/`](normative-tests/README.md) and the standalone Field artifact.

## Scalar text and numeric

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Text | [`TextField`](grammar.html#prod-TextField) | [`TextFieldSpec`](grammar.html#prod-TextFieldSpec) | [`TextValue`](grammar.html#prod-TextValue) | [`EmbeddedTextField`](grammar.html#prod-EmbeddedTextField) | [`03`–`04`](normative-tests/valid/03-text-template.json), [`49`](normative-tests/valid/49-text-field.json) |
| Integer number | [`IntegerNumberField`](grammar.html#prod-IntegerNumberField) | [`IntegerNumberFieldSpec`](grammar.html#prod-IntegerNumberFieldSpec) | [`IntegerNumberValue`](grammar.html#prod-IntegerNumberValue) | [`EmbeddedIntegerNumberField`](grammar.html#prod-EmbeddedIntegerNumberField) | [`05`–`06`](normative-tests/valid/05-integer-number-template.json), [`50`](normative-tests/valid/50-integer-number-field.json) |
| Real number | [`RealNumberField`](grammar.html#prod-RealNumberField) | [`RealNumberFieldSpec`](grammar.html#prod-RealNumberFieldSpec) | [`RealNumberValue`](grammar.html#prod-RealNumberValue) | [`EmbeddedRealNumberField`](grammar.html#prod-EmbeddedRealNumberField) | [`07`–`10`](normative-tests/valid/07-real-number-decimal-template.json), [`51`–`52`](normative-tests/valid/51-real-number-decimal-field.json) |
| Boolean | [`BooleanField`](grammar.html#prod-BooleanField) | [`BooleanFieldSpec`](grammar.html#prod-BooleanFieldSpec) | [`BooleanValue`](grammar.html#prod-BooleanValue) | [`EmbeddedBooleanField`](grammar.html#prod-EmbeddedBooleanField) | [`11`–`12`](normative-tests/valid/11-boolean-template.json), [`53`](normative-tests/valid/53-boolean-field.json) |

## Temporal

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Date | [`DateField`](grammar.html#prod-DateField) | [`DateFieldSpec`](grammar.html#prod-DateFieldSpec) | [`DateValue`](grammar.html#prod-DateValue) (three arms: `FullDateValue`, `YearValue`, `YearMonthValue`) | [`EmbeddedDateField`](grammar.html#prod-EmbeddedDateField) | [`13`–`18`](normative-tests/valid/13-date-template.json), [`54`](normative-tests/valid/54-date-field.json) |
| Time | [`TimeField`](grammar.html#prod-TimeField) | [`TimeFieldSpec`](grammar.html#prod-TimeFieldSpec) | [`TimeValue`](grammar.html#prod-TimeValue) | [`EmbeddedTimeField`](grammar.html#prod-EmbeddedTimeField) | [`19`–`20`](normative-tests/valid/19-time-template.json), [`55`](normative-tests/valid/55-time-field.json) |
| Date-time | [`DateTimeField`](grammar.html#prod-DateTimeField) | [`DateTimeFieldSpec`](grammar.html#prod-DateTimeFieldSpec) | [`DateTimeValue`](grammar.html#prod-DateTimeValue) | [`EmbeddedDateTimeField`](grammar.html#prod-EmbeddedDateTimeField) | [`21`–`22`](normative-tests/valid/21-date-time-template.json), [`56`](normative-tests/valid/56-date-time-field.json) |

## Controlled vocabulary

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Controlled term | [`ControlledTermField`](grammar.html#prod-ControlledTermField) | [`ControlledTermFieldSpec`](grammar.html#prod-ControlledTermFieldSpec) | [`ControlledTermValue`](grammar.html#prod-ControlledTermValue) | [`EmbeddedControlledTermField`](grammar.html#prod-EmbeddedControlledTermField) | [`23`–`24`](normative-tests/valid/23-controlled-term-template.json), [`57`–`60`](normative-tests/valid/57-controlled-term-ontology-source-field.json) |
| Single-valued enum | [`SingleValuedEnumField`](grammar.html#prod-SingleValuedEnumField) | [`SingleValuedEnumFieldSpec`](grammar.html#prod-SingleValuedEnumFieldSpec) | [`EnumValue`](grammar.html#prod-EnumValue) | [`EmbeddedSingleValuedEnumField`](grammar.html#prod-EmbeddedSingleValuedEnumField) | [`25`–`26`](normative-tests/valid/25-single-valued-enum-template.json), [`61`](normative-tests/valid/61-single-valued-enum-field.json) |
| Multi-valued enum | [`MultiValuedEnumField`](grammar.html#prod-MultiValuedEnumField) | [`MultiValuedEnumFieldSpec`](grammar.html#prod-MultiValuedEnumFieldSpec) | [`EnumValue`](grammar.html#prod-EnumValue) (multi-valued) | [`EmbeddedMultiValuedEnumField`](grammar.html#prod-EmbeddedMultiValuedEnumField) | [`27`–`28`](normative-tests/valid/27-multi-valued-enum-template.json), [`62`](normative-tests/valid/62-multi-valued-enum-field.json) |

## Reference and contact

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Link | [`LinkField`](grammar.html#prod-LinkField) | [`LinkFieldSpec`](grammar.html#prod-LinkFieldSpec) | [`LinkValue`](grammar.html#prod-LinkValue) | [`EmbeddedLinkField`](grammar.html#prod-EmbeddedLinkField) | [`29`–`30`](normative-tests/valid/29-link-template.json), [`63`](normative-tests/valid/63-link-field.json) |
| Email | [`EmailField`](grammar.html#prod-EmailField) | [`EmailFieldSpec`](grammar.html#prod-EmailFieldSpec) | [`EmailValue`](grammar.html#prod-EmailValue) | [`EmbeddedEmailField`](grammar.html#prod-EmbeddedEmailField) | [`31`–`32`](normative-tests/valid/31-email-template.json), [`64`](normative-tests/valid/64-email-field.json) |
| Phone number | [`PhoneNumberField`](grammar.html#prod-PhoneNumberField) | [`PhoneNumberFieldSpec`](grammar.html#prod-PhoneNumberFieldSpec) | [`PhoneNumberValue`](grammar.html#prod-PhoneNumberValue) | [`EmbeddedPhoneNumberField`](grammar.html#prod-EmbeddedPhoneNumberField) | [`33`–`34`](normative-tests/valid/33-phone-number-template.json), [`65`](normative-tests/valid/65-phone-number-field.json) |

## External-authority identifiers

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| ORCID | [`OrcidField`](grammar.html#prod-OrcidField) | [`OrcidFieldSpec`](grammar.html#prod-OrcidFieldSpec) | [`OrcidValue`](grammar.html#prod-OrcidValue) | [`EmbeddedOrcidField`](grammar.html#prod-EmbeddedOrcidField) | [`35`–`36`](normative-tests/valid/35-orcid-template.json), [`66`](normative-tests/valid/66-orcid-field.json) |
| ROR | [`RorField`](grammar.html#prod-RorField) | [`RorFieldSpec`](grammar.html#prod-RorFieldSpec) | [`RorValue`](grammar.html#prod-RorValue) | [`EmbeddedRorField`](grammar.html#prod-EmbeddedRorField) | [`37`–`38`](normative-tests/valid/37-ror-template.json), [`67`](normative-tests/valid/67-ror-field.json) |
| DOI | [`DoiField`](grammar.html#prod-DoiField) | [`DoiFieldSpec`](grammar.html#prod-DoiFieldSpec) | [`DoiValue`](grammar.html#prod-DoiValue) | [`EmbeddedDoiField`](grammar.html#prod-EmbeddedDoiField) | [`39`–`40`](normative-tests/valid/39-doi-template.json), [`68`](normative-tests/valid/68-doi-field.json) |
| PubMed | [`PubMedIdField`](grammar.html#prod-PubMedIdField) | [`PubMedIdFieldSpec`](grammar.html#prod-PubMedIdFieldSpec) | [`PubMedIdValue`](grammar.html#prod-PubMedIdValue) | [`EmbeddedPubMedIdField`](grammar.html#prod-EmbeddedPubMedIdField) | [`41`–`42`](normative-tests/valid/41-pubmedid-template.json), [`69`](normative-tests/valid/69-pubmedid-field.json) |
| RRID | [`RridField`](grammar.html#prod-RridField) | [`RridFieldSpec`](grammar.html#prod-RridFieldSpec) | [`RridValue`](grammar.html#prod-RridValue) | [`EmbeddedRridField`](grammar.html#prod-EmbeddedRridField) | [`43`–`44`](normative-tests/valid/43-rrid-template.json), [`70`](normative-tests/valid/70-rrid-field.json) |
| NIH grant | [`NihGrantIdField`](grammar.html#prod-NihGrantIdField) | [`NihGrantIdFieldSpec`](grammar.html#prod-NihGrantIdFieldSpec) | [`NihGrantIdValue`](grammar.html#prod-NihGrantIdValue) | [`EmbeddedNihGrantIdField`](grammar.html#prod-EmbeddedNihGrantIdField) | [`45`–`46`](normative-tests/valid/45-nih-grant-id-template.json), [`71`](normative-tests/valid/71-nih-grant-id-field.json) |

## Linguistic data

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Language | [`LanguageField`](grammar.html#prod-LanguageField) | [`LanguageFieldSpec`](grammar.html#prod-LanguageFieldSpec) | [`LanguageValue`](grammar.html#prod-LanguageValue) | [`EmbeddedLanguageField`](grammar.html#prod-EmbeddedLanguageField) | [`92`](normative-tests/valid/92-language-template.json), [`93`](normative-tests/valid/93-language-field.json) |

## Open-ended

| Family | Field artifact | Field spec | Value | Embedded form | Fixtures |
|---|---|---|---|---|---|
| Attribute value | [`AttributeValueField`](grammar.html#prod-AttributeValueField) | [`AttributeValueFieldSpec`](grammar.html#prod-AttributeValueFieldSpec) | [`AttributeValue`](grammar.html#prod-AttributeValue) | [`EmbeddedAttributeValueField`](grammar.html#prod-EmbeddedAttributeValueField) | [`47`–`48`](normative-tests/valid/47-attribute-value-template.json), [`72`](normative-tests/valid/72-attribute-value-field.json) |

## Notes on the groupings

The groupings above are presentational, not normative. The spec does not partition field families into categories at the grammar level; every family is structurally a peer of every other under [`FieldSpec`](grammar.html#prod-FieldSpec). The groupings here exist only to make this index easier to scan.

The four §9-of-`serialization.md` family-specific deviations are worth recalling at the embedding site:

- `EmbeddedBooleanField` and `EmbeddedSingleValuedEnumField` omit `cardinality` (single-valued by construction).
- `EmbeddedMultiValuedEnumField.defaultValue` is `EnumValue*` (a sequence).
- `EmbeddedAttributeValueField` omits `defaultValue`.

The six external-authority identifier families (ORCID, ROR, DOI, PubMed, RRID, NIH grant) all share an identical `XxxFieldSpec` shape — `{ "kind": "<Family>FieldSpec" }` with no per-family slots — but distinct value productions carrying typed IRIs.
