/** BODS search row: subject company id when present, else last-resort statementid (often entity). */
export function pickEntityStatementId(row: Record<string, unknown>): string | null {
	const sub = row.subject_describedbyentitystatement
	if (typeof sub === 'string' && sub.trim()) return sub.trim()
	const sid = row.statementid
	if (typeof sid === 'string' && sid.trim()) return sid.trim()
	return null
}
