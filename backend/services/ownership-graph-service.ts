import { prisma } from '../lib/prisma';

export type GraphNode = {
	id: string;
	label: string;
	kind: 'entity' | 'person';
	details?: Record<string, string | null>;
};
export type GraphEdge = {
	id: string;
	source: string;
	target: string;
	label?: string | undefined;
};

export type OwnershipGraphResult = {
	nodes: GraphNode[];
	edges: GraphEdge[];
	centerEntityId: string;
	message?: string;
};

function buildInterestLabel(
	interest: { type?: string | null; interestlevel?: string | null; share_exact?: unknown } | undefined | null,
): string | undefined {
	if (!interest) return undefined;
	const parts: string[] = [];
	if (interest.type) parts.push(String(interest.type));
	if (interest.share_exact != null) {
		const dec = interest.share_exact as { toFixed?: (n: number) => string };
		const pct = typeof dec.toFixed === 'function' ? dec.toFixed(1) : String(interest.share_exact);
		parts.push(`${pct}%`);
	} else if (interest.interestlevel) {
		parts.push(String(interest.interestlevel));
	}
	return parts.length ? parts.join(' ') : undefined;
}

function uniqNodes(nodes: GraphNode[]): GraphNode[] {
	const seen = new Set<string>();
	return nodes.filter((n) => {
		if (seen.has(n.id)) return false;
		seen.add(n.id);
		return true;
	});
}

function stringifyVal(v: unknown): string | null {
	if (v == null) return null;
	if (typeof v === 'bigint') return v.toString();
	if (v instanceof Date) return v.toISOString();
	if (typeof v === 'boolean' || typeof v === 'number') return String(v);
	if (typeof v === 'string') return v;
	if (typeof v === 'object') {
		const dec = v as { toFixed?: (n: number) => string };
		if (typeof dec.toFixed === 'function') return dec.toFixed(2);
		return JSON.stringify(v);
	}
	return String(v);
}

function flattenLatviaEntityRow(e: Record<string, unknown>): Record<string, string | null> {
	const out: Record<string, string | null> = {};
	const skip = new Set([
		'entity_addresses',
		'entity_identifiers',
		'entity_source_assertedby',
		'ooc_statement',
	]);
	for (const [k, v] of Object.entries(e)) {
		if (skip.has(k)) continue;
		out[k] = stringifyVal(v);
	}
	const addrs = e.entity_addresses as Record<string, unknown>[] | undefined;
	const addr0 = addrs?.[0];
	if (addr0) {
		out['address_type'] = stringifyVal(addr0.type);
		out['address_country'] = stringifyVal(addr0.country);
	}
	const ids = e.entity_identifiers as Record<string, unknown>[] | undefined;
	const id0 = ids?.[0];
	if (id0) {
		out['identifier_scheme'] = stringifyVal(id0.scheme);
		out['identifier_number'] = stringifyVal(id0.identifier_number);
	}
	return out;
}

function flattenLatviaPersonRow(p: Record<string, unknown>): Record<string, string | null> {
	const out: Record<string, string | null> = {};
	const skip = new Set([
		'person_addresses',
		'person_identifiers',
		'person_names',
		'person_nationalities',
		'person_source_assertedby',
		'ooc_statement',
	]);
	for (const [k, v] of Object.entries(p)) {
		if (skip.has(k)) continue;
		out[k] = stringifyVal(v);
	}
	const names = p.person_names as { fullname?: string | null }[] | undefined;
	if (names?.length) {
		out['names'] = stringifyVal(names.map((n) => n.fullname).filter(Boolean).join(' · '));
	}
	const nat0 = (p.person_nationalities as Record<string, unknown>[] | undefined)?.[0];
	if (nat0) {
		out['nationality_name'] = stringifyVal(nat0.name);
		out['nationality_code'] = stringifyVal(nat0.code);
	}
	const addr0 = (p.person_addresses as Record<string, unknown>[] | undefined)?.[0];
	if (addr0) {
		out['person_address_country'] = stringifyVal(addr0.country);
		out['person_address_type'] = stringifyVal(addr0.type);
	}
	const id0 = (p.person_identifiers as Record<string, unknown>[] | undefined)?.[0];
	if (id0) {
		out['person_identifier_scheme'] = stringifyVal(id0.scheme);
		out['person_identifier_number'] = stringifyVal(id0.identifier_number);
	}
	return out;
}

async function enrichLatviaNodes(nodes: GraphNode[]): Promise<GraphNode[]> {
	const entityIds = new Set<string>();
	const personIds = new Set<string>();
	for (const n of nodes) {
		if (n.id.startsWith('e:')) entityIds.add(n.id.slice(2));
		else if (n.id.startsWith('p:')) personIds.add(n.id.slice(2));
	}
	const [entities, persons] = await Promise.all([
		entityIds.size
			? prisma.latvia_entity_statement.findMany({
					where: { statementid: { in: [...entityIds] } },
					include: {
						entity_addresses: { take: 1 },
						entity_identifiers: { take: 1 },
					},
				})
			: [],
		personIds.size
			? prisma.latvia_person_statement.findMany({
					where: { statementid: { in: [...personIds] } },
					include: {
						person_names: { take: 5 },
						person_addresses: { take: 1 },
						person_nationalities: { take: 1 },
						person_identifiers: { take: 1 },
					},
				})
			: [],
	]);
	const em = new Map<string, Record<string, string | null>>(
		entities.map((e: (typeof entities)[number]) => [
			e.statementid,
			flattenLatviaEntityRow(e as unknown as Record<string, unknown>),
		]),
	);
	const pm = new Map<string, Record<string, string | null>>(
		persons.map((p: (typeof persons)[number]) => [
			p.statementid,
			flattenLatviaPersonRow(p as unknown as Record<string, unknown>),
		]),
	);
	return nodes.map((n) => {
		const raw = n.id.startsWith('e:') ? em.get(n.id.slice(2)) : pm.get(n.id.slice(2));
		return { ...n, details: (raw ?? {}) as Record<string, string | null> };
	});
}

function flattenSlovakiaEntityRow(e: Record<string, unknown>): Record<string, string | null> {
	const out: Record<string, string | null> = {};
	const skip = new Set(['entity_addresses', 'entity_identifiers', 'ooc_statement']);
	for (const [k, v] of Object.entries(e)) {
		if (skip.has(k)) continue;
		out[k] = stringifyVal(v);
	}
	const addr0 = (e.entity_addresses as Record<string, unknown>[] | undefined)?.[0];
	if (addr0) {
		out['address_country'] = stringifyVal(addr0.country);
		out['address'] = stringifyVal(addr0.address);
	}
	const id0 = (e.entity_identifiers as Record<string, unknown>[] | undefined)?.[0];
	if (id0) {
		out['identifier_id'] = stringifyVal(id0.identifier_number ?? id0.id);
		out['identifier_scheme'] = stringifyVal(id0.scheme ?? id0.schemename);
	}
	return out;
}

function flattenSlovakiaPersonRow(p: Record<string, unknown>): Record<string, string | null> {
	const out: Record<string, string | null> = {};
	const skip = new Set([
		'person_addresses',
		'person_identifiers',
		'person_names',
		'ooc_statement',
	]);
	for (const [k, v] of Object.entries(p)) {
		if (skip.has(k)) continue;
		out[k] = stringifyVal(v);
	}
	const names = p.person_names as { fullname?: string | null }[] | undefined;
	if (names?.length) {
		out['names'] = stringifyVal(names.map((n) => n.fullname).filter(Boolean).join(' · '));
	}
	const addr0 = (p.person_addresses as Record<string, unknown>[] | undefined)?.[0];
	if (addr0) {
		out['person_address_country'] = stringifyVal(addr0.country);
		out['person_address'] = stringifyVal(addr0.address);
	}
	const id0 = (p.person_identifiers as Record<string, unknown>[] | undefined)?.[0];
	if (id0) {
		out['person_identifier_number'] = stringifyVal(id0.identifier_number);
		out['person_identifier_scheme'] = stringifyVal(id0.schemename);
	}
	return out;
}

async function enrichSlovakiaNodes(nodes: GraphNode[]): Promise<GraphNode[]> {
	const entityIds = new Set<string>();
	const personIds = new Set<string>();
	for (const n of nodes) {
		if (n.id.startsWith('e:')) entityIds.add(n.id.slice(2));
		else if (n.id.startsWith('p:')) personIds.add(n.id.slice(2));
	}
	const [entities, persons] = await Promise.all([
		entityIds.size
			? prisma.slovakia_entity_statement.findMany({
					where: { statementid: { in: [...entityIds] } },
					include: {
						entity_addresses: { take: 1 },
						entity_identifiers: { take: 1 },
					},
				})
			: [],
		personIds.size
			? prisma.slovakia_person_statement.findMany({
					where: { statementid: { in: [...personIds] } },
					include: {
						person_names: { take: 5 },
						person_addresses: { take: 1 },
						person_identifiers: { take: 1 },
					},
				})
			: [],
	]);
	const em = new Map<string, Record<string, string | null>>(
		entities.map((e: (typeof entities)[number]) => [
			e.statementid,
			flattenSlovakiaEntityRow(e as unknown as Record<string, unknown>),
		]),
	);
	const pm = new Map<string, Record<string, string | null>>(
		persons.map((p: (typeof persons)[number]) => [
			p.statementid,
			flattenSlovakiaPersonRow(p as unknown as Record<string, unknown>),
		]),
	);
	return nodes.map((n) => {
		const raw = n.id.startsWith('e:') ? em.get(n.id.slice(2)) : pm.get(n.id.slice(2));
		return { ...n, details: (raw ?? {}) as Record<string, string | null> };
	});
}

async function buildLatviaGraph(entityStatementId: string): Promise<OwnershipGraphResult> {
	const center = await prisma.latvia_entity_statement.findUnique({
		where: { statementid: entityStatementId },
		select: { statementid: true, name: true, entitytype: true },
	});
	if (!center) {
		return { nodes: [], edges: [], centerEntityId: entityStatementId, message: 'Entity not found' };
	}

	const ent = (sid: string) => `e:${sid}`;
	const person = (sid: string) => `p:${sid}`;

	const nodes: GraphNode[] = [
		{ id: ent(center.statementid), label: center.name || center.statementid, kind: 'entity' },
	];
	const edges: GraphEdge[] = [];

	const oocsAsSubject = await prisma.latvia_ooc_statement.findMany({
		where: { subject_describedbyentitystatement: entityStatementId },
		include: {
			person_statement: { include: { person_names: { take: 1 } } },
			ooc_interests: { take: 1 },
		},
	});

	for (const ooc of oocsAsSubject) {
		const interest = ooc.ooc_interests[0];
		const interestLabel = buildInterestLabel(interest);
		if (ooc.interestedparty_describedbypersonstatement) {
			const psid = ooc.interestedparty_describedbypersonstatement;
			const label = ooc.person_statement?.person_names?.[0]?.fullname ?? psid;
			nodes.push({ id: person(psid), label, kind: 'person' });
			edges.push({
				id: `ooc-${ooc.statementid}-person`,
				source: person(psid),
				target: ent(entityStatementId),
				label: interestLabel,
			});
		}
		if (ooc.interestedparty_describedbyentitystatement) {
			const ownerEntId = ooc.interestedparty_describedbyentitystatement;
			const ownerEnt = await prisma.latvia_entity_statement.findUnique({
				where: { statementid: ownerEntId },
				select: { name: true },
			});
			nodes.push({
				id: ent(ownerEntId),
				label: ownerEnt?.name || ownerEntId,
				kind: 'entity',
			});
			edges.push({
				id: `ooc-${ooc.statementid}-entity`,
				source: ent(ownerEntId),
				target: ent(entityStatementId),
				label: interestLabel,
			});
		}
	}

	const oocsAsOwner = await prisma.latvia_ooc_statement.findMany({
		where: { interestedparty_describedbyentitystatement: entityStatementId },
		include: {
			entity_statement: { select: { statementid: true, name: true } },
			ooc_interests: { take: 1 },
		},
	});

	for (const ooc of oocsAsOwner) {
		const child = ooc.entity_statement;
		if (!child?.statementid) continue;
		nodes.push({
			id: ent(child.statementid),
			label: child.name || child.statementid,
			kind: 'entity',
		});
		edges.push({
			id: `own-${ooc.statementid}`,
			source: ent(entityStatementId),
			target: ent(child.statementid),
			label: buildInterestLabel(ooc.ooc_interests[0]),
		});
	}

	const uniq = uniqNodes(nodes);
	const enriched = await enrichLatviaNodes(uniq);
	return {
		nodes: enriched,
		edges,
		centerEntityId: ent(entityStatementId),
	};
}

async function buildSlovakiaGraph(entityStatementId: string): Promise<OwnershipGraphResult> {
	const center = await prisma.slovakia_entity_statement.findUnique({
		where: { statementid: entityStatementId },
		select: { statementid: true, name: true, entitytype: true },
	});
	if (!center) {
		return { nodes: [], edges: [], centerEntityId: entityStatementId, message: 'Entity not found' };
	}

	const ent = (sid: string) => `e:${sid}`;
	const person = (sid: string) => `p:${sid}`;

	const nodes: GraphNode[] = [
		{ id: ent(center.statementid), label: center.name || center.statementid, kind: 'entity' },
	];
	const edges: GraphEdge[] = [];

	const oocsAsSubject = await prisma.slovakia_ooc_statement.findMany({
		where: { subject_describedbyentitystatement: entityStatementId },
		include: {
			person_statement: { include: { person_names: { take: 1 } } },
		},
	});

	for (const ooc of oocsAsSubject) {
		if (ooc.interestedparty_describedbypersonstatement) {
			const psid = ooc.interestedparty_describedbypersonstatement;
			const label = ooc.person_statement?.person_names?.[0]?.fullname ?? psid;
			nodes.push({ id: person(psid), label, kind: 'person' });
			edges.push({
				id: `ooc-${ooc.statementid}-person`,
				source: person(psid),
				target: ent(entityStatementId),
			});
		}
	}

	const uniq = uniqNodes(nodes);
	const enriched = await enrichSlovakiaNodes(uniq);
	return {
		nodes: enriched,
		edges,
		centerEntityId: ent(entityStatementId),
	};
}

export async function buildOwnershipGraph(
	registry: string,
	entityStatementId: string,
): Promise<OwnershipGraphResult> {
	const r = registry.toLowerCase();
	if (r === 'latvia') return buildLatviaGraph(entityStatementId);
	if (r === 'slovakia') return buildSlovakiaGraph(entityStatementId);
	return {
		nodes: [],
		edges: [],
		centerEntityId: '',
		message: `Ownership graph not implemented for registry "${registry}". Use Latvia or Slovakia.`,
	};
}
