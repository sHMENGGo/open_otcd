/**
 * Maps BODS / Prisma-style field keys to labels users understand.
 * Based on latvia_* / slovakia_* entity & person statement models.
 */

/** Keys omitted from detail panels (internal / redundant). */
export const HIDDEN_DETAIL_KEYS = new Set(['link'])

/** Human label; key is raw key from API `details`. */
export const DETAIL_KEY_LABELS: Record<string, string> = {
	// Shared / generic
	statementid: 'Statement ID (register record)',
	statementtype: 'Statement type',
	statementdate: 'Statement date',
	iscomponent: 'Is component record',
	source_type: 'Data source type',

	// Entity
	name: 'Legal name',
	entitytype: 'Entity type',
	foundingdate: 'Founding date',
	incorporatedinjurisdiction_name: 'Incorporated in (jurisdiction)',
	incorporatedinjurisdiction_code: 'Jurisdiction code',
	publicationdetails_publicationdate: 'Publication date',
	publicationdetails_bodsversion: 'BODS schema version',
	publicationdetails_license: 'Publication licence',
	publicationdetails_publisher_name: 'Publisher name',
	publicationdetails_publisher_url: 'Publisher URL',
	unspecifiedentitydetails_reason: 'Unspecified entity — reason',
	unspecifiedentitydetails_description: 'Unspecified entity — description',
	replacesstatements: 'Replaces or supersedes these statement IDs',
	names: 'Names as published (all variants)',
	dissolutiondate: 'Dissolution date',
	alternatenames: 'Alternate names',

	// Person
	persontype: 'Person type',
	birthdate: 'Birth date (as published)',
	unspecifiedpersondetails_reason: 'Unspecified person — reason',
	publicationdetails_publicationdate_person: 'Publication date', // avoid dup if same key — latvia uses same key as entity

	// Flattened address / identifier (our API keys)
	address_type: 'Address type',
	address_country: 'Address country',
	address: 'Address line',
	person_address_country: 'Residence country',
	person_address_type: 'Address type',
	person_address: 'Address line',
	identifier_scheme: 'Company ID scheme',
	identifier_number: 'Company ID number',
	person_identifier_scheme: 'Person ID scheme',
	person_identifier_number: 'Person ID number',
	nationality_name: 'Nationality',
	nationality_code: 'Nationality code',
	identifier_id: 'Identifier value',

	// Slovakia-specific naming in flatten
	schemename: 'ID scheme name',
	uri: 'Identifier URI',
}

/** Show these first when present (entity). */
const ENTITY_FIELD_PRIORITY: string[] = [
	'name',
	'entitytype',
	'incorporatedinjurisdiction_name',
	'incorporatedinjurisdiction_code',
	'foundingdate',
	'statementdate',
	'statementtype',
	'iscomponent',
	'replacesstatements',
	'dissolutiondate',
	'alternatenames',
	'publicationdetails_publicationdate',
	'publicationdetails_bodsversion',
	'publicationdetails_license',
	'publicationdetails_publisher_name',
	'publicationdetails_publisher_url',
	'unspecifiedentitydetails_reason',
	'unspecifiedentitydetails_description',
	'source_type',
	'statementid',
	'address_country',
	'address_type',
	'address',
	'identifier_scheme',
	'identifier_number',
]

const PERSON_FIELD_PRIORITY: string[] = [
	'names',
	'persontype',
	'birthdate',
	'nationality_name',
	'nationality_code',
	'person_address_country',
	'person_address_type',
	'person_address',
	'person_identifier_scheme',
	'person_identifier_number',
	'statementdate',
	'statementtype',
	'iscomponent',
	'publicationdetails_publicationdate',
	'publicationdetails_bodsversion',
	'publicationdetails_license',
	'publicationdetails_publisher_name',
	'publicationdetails_publisher_url',
	'unspecifiedpersondetails_reason',
	'source_type',
	'statementid',
]

function labelForKey(key: string): string {
	if (DETAIL_KEY_LABELS[key]) return DETAIL_KEY_LABELS[key]
	return key
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (c) => c.toUpperCase())
}

function priorityIndex(kind: 'entity' | 'person', key: string): number {
	const order = kind === 'person' ? PERSON_FIELD_PRIORITY : ENTITY_FIELD_PRIORITY
	const i = order.indexOf(key)
	return i === -1 ? 1000 + key.charCodeAt(0) : i
}

/** Build sorted, human-labeled rows for the detail panel. */
export function humanizeDetailRows(
	kind: 'entity' | 'person',
	details: Record<string, string | null | undefined> | undefined,
): [string, string][] {
	if (!details) return []
	const items: { key: string; label: string; value: string }[] = []
	for (const [key, raw] of Object.entries(details)) {
		if (HIDDEN_DETAIL_KEYS.has(key)) continue
		if (raw == null || String(raw).trim() === '') continue
		let value = String(raw)
		if (value === 'true' || value === 'false') value = value === 'true' ? 'Yes' : 'No'
		items.push({ key, label: labelForKey(key), value })
	}
	items.sort((a, b) => {
		const pa = priorityIndex(kind, a.key)
		const pb = priorityIndex(kind, b.key)
		if (pa !== pb) return pa - pb
		return a.label.localeCompare(b.label)
	})
	return items.map((x) => [x.label, x.value])
}
