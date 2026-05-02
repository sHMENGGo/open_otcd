import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
	ReactFlow,
	ReactFlowProvider,
	Background,
	MiniMap,
	Panel,
	Handle,
	Position,
	ConnectionMode,
	useNodesState,
	useEdgesState,
	useReactFlow,
	type Node,
	type Edge,
	type NodeProps,
	type NodeDragHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
	forceSimulation,
	forceLink,
	forceManyBody,
	forceCenter,
	forceCollide,
	type SimulationNodeDatum,
	type SimulationLinkDatum,
} from 'd3-force'
import { apiPost } from '../utils/api'
import {
	GraphDetailProvider,
	detailPayloadFromNode,
	useGraphDetail,
	type DetailOpenPayload,
} from './ownershipGraphDetails'

// ─── types ───────────────────────────────────────────────────────────────────

type ApiNode = {
	id: string
	label: string
	kind: 'entity' | 'person'
	details?: Record<string, string | null>
}
type ApiEdge = { id: string; source: string; target: string; label?: string }
type GraphPayload = {
	nodes: ApiNode[]
	edges: ApiEdge[]
	centerEntityId: string
	message?: string
}

interface D3Node extends SimulationNodeDatum {
	rfId: string
	r: number
}

// ─── constants ────────────────────────────────────────────────────────────────

const EDGE_STROKE = '#6b6b6b'
const SAT_NODE_W = 128
const CENTER_NODE_W = 180
const LABEL_BLOCK_H = 44

// ─── helpers ──────────────────────────────────────────────────────────────────

function dotSizePx(degree: number, isCenter: boolean): number {
	if (isCenter) return Math.max(22, Math.min(40, 16 + Math.min(degree, 22) * 1.1))
	return Math.max(10, Math.min(18, 8 + Math.min(degree, 16) * 0.5))
}

function rfNodeH(dot: number): number {
	return dot + 6 + LABEL_BLOCK_H
}

function nodeSubtitle(kind: 'entity' | 'person', details: Record<string, string | null>): string | null {
	if (kind === 'person') return details.nationality_name ?? details.person_address_country ?? null
	return details.address_country ?? null
}

function buildRfNodes(
	apiNodes: ApiNode[],
	centerEntityId: string,
	degreeMap: Map<string, number>,
): Node[] {
	return apiNodes.map((n) => {
		const isCenter = n.id === centerEntityId
		const nodeW = isCenter ? CENTER_NODE_W : SAT_NODE_W
		const dot = dotSizePx(degreeMap.get(n.id) ?? 0, isCenter)
		const style: CSSProperties = {
			background: 'transparent',
			border: 'none',
			boxShadow: 'none',
			padding: 0,
			width: nodeW,
			height: rfNodeH(dot),
		}
		return {
			id: n.id,
			type: isCenter ? 'centerNode' : 'labelNode',
			position: { x: 0, y: 0 },
			data: { label: n.label, kind: n.kind, details: n.details ?? {}, dotSize: dot },
			style,
		}
	})
}

function buildRfEdges(apiEdges: ApiEdge[]): Edge[] {
	return apiEdges.map((e) => ({
		id: e.id,
		source: e.source,
		target: e.target,
		type: 'straight',
		style: { stroke: EDGE_STROKE, strokeWidth: 1 },
		...(e.label
			? {
					label: e.label,
					labelStyle: { fill: '#777', fontSize: 10, fontFamily: 'monospace' },
					labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.9 },
					labelBgPadding: [3, 5] as [number, number],
					labelBgBorderRadius: 3,
				}
			: {}),
	}))
}

/** Sync d3 positions → RF positions; skip the node the user is currently dragging. */
function syncD3ToRf(prev: Node[], d3Map: Map<string, D3Node>, skipId: string | null): Node[] {
	return prev.map((rfN) => {
		if (rfN.id === skipId) return rfN
		const d3n = d3Map.get(rfN.id)
		if (d3n?.x == null || d3n?.y == null) return rfN
		const w = (rfN.style?.width as number) || SAT_NODE_W
		const dot = Number(rfN.data?.dotSize ?? 12)
		const nx = d3n.x - w / 2
		const ny = d3n.y - dot / 2
		if (Math.abs(nx - rfN.position.x) < 0.5 && Math.abs(ny - rfN.position.y) < 0.5) return rfN
		return { ...rfN, position: { x: nx, y: ny } }
	})
}

function buildDuplicateNameSummary(apiNodes: { id: string; label: string }[]): string | null {
	const m = new Map<string, Set<string>>()
	for (const n of apiNodes) {
		const lab = (n.label || '').trim() || '(unnamed)'
		if (!m.has(lab)) m.set(lab, new Set())
		m.get(lab)!.add(n.id)
	}
	const parts = [...m.entries()].filter(([, ids]) => ids.size > 1)
	if (!parts.length) return null
	return parts.map(([lab, ids]) => `${lab}: ${ids.size} nodes`).join(' · ')
}

// ─── zoom panel ───────────────────────────────────────────────────────────────

function GraphZoomPanel({ zoomPct }: { zoomPct: number }) {
	const { zoomIn, zoomOut, fitView } = useReactFlow()
	const btn =
		'flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#3f3f3f] bg-[#2a2a2a] text-lg font-light leading-none text-[#d4d4d4] shadow-sm hover:border-[#a78bfa] hover:bg-[#333] hover:text-white active:scale-95'
	return (
		<Panel position="top-right" className="m-3 !mt-14">
			<div className="flex flex-col items-stretch gap-1 rounded-lg border border-[#3f3f3f] bg-[#262626]/95 p-1.5 shadow-xl backdrop-blur-sm">
				<button type="button" className={btn} aria-label="Zoom in" onClick={() => zoomIn({ duration: 220 })}>
					+
				</button>
				<div className="select-none py-0.5 text-center font-mono text-[10px] font-medium tracking-tight text-[#888]">
					{zoomPct}%
				</div>
				<button type="button" className={btn} aria-label="Zoom out" onClick={() => zoomOut({ duration: 220 })}>
					−
				</button>
				<button
					type="button"
					className="mt-0.5 rounded border border-[#3f3f3f] bg-[#2a2a2a] px-1 py-2 text-center text-[10px] font-medium leading-tight text-[#bbb] hover:border-[#a78bfa] hover:text-white"
					onClick={() => fitView({ padding: 0.2, duration: 320 })}
				>
					Fit
				</button>
			</div>
		</Panel>
	)
}

// ─── duplicate names callout ──────────────────────────────────────────────────

function DuplicateNamesCallout({ text }: { text: string | null }) {
	const [open, setOpen] = useState(true)
	if (!text) return null
	return (
		<div className="mx-3 mt-2 shrink-0 rounded-lg border border-sky-700/80 bg-sky-950/55 text-sky-50 shadow-md">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-sky-100 hover:bg-sky-900/35"
				onClick={() => setOpen(!open)}
			>
				<span className="text-base leading-none" aria-hidden>
					ⓘ
				</span>
				<span className="flex-1">Why the same name appears more than once</span>
				<span className="text-sky-400">{open ? '▾' : '▸'}</span>
			</button>
			{open && (
				<div className="space-y-2 border-t border-sky-800/55 px-3 pb-3 pt-2 text-xs leading-relaxed text-sky-100/95">
					<p>
						Each <strong>node</strong> is one <strong>statement record</strong> in the open ownership
						dataset (BODS-style): it has its own <strong>statement ID</strong> in the database. The
						register can list the same person multiple times when there are several disclosures (different
						filings, interests, revisions, or component statements) that were not merged in this export.
					</p>
					<p className="font-medium text-sky-50">This graph includes:</p>
					<p className="rounded-md bg-black/30 px-2 py-1.5 font-mono text-[11px] text-sky-200">{text}</p>
					<p className="text-sky-200/95">
						Open two nodes with the same name and compare{' '}
						<strong>Statement ID (register record)</strong> in the detail panel — different IDs mean
						separate rows in the source data (not a rendering bug).
					</p>
				</div>
			)}
		</div>
	)
}

// ─── detail helpers ───────────────────────────────────────────────────────────

function openDetailFromData(
	openDetail: (p: DetailOpenPayload) => void,
	id: string,
	data: Record<string, unknown>,
) {
	const label = String(data?.label ?? '')
	const kind = (data?.kind as 'entity' | 'person') || 'entity'
	const details = (data?.details ?? {}) as Record<string, string | null | undefined>
	openDetail(detailPayloadFromNode(id, label, kind, details))
}

// Shared invisible handle style — centered on the dot row; ConnectionMode.Loose
// lets this single handle serve as both source and target.
function dotHandle(dot: number): CSSProperties {
	return { left: '50%', top: dot / 2, transform: 'translate(-50%, -50%)', opacity: 0, pointerEvents: 'none' }
}

// ─── node components ──────────────────────────────────────────────────────────

function LabelNode({ id, data }: NodeProps) {
	const { openDetail } = useGraphDetail()
	const label = String(data?.label ?? '')
	const kind = (data?.kind as 'entity' | 'person') || 'entity'
	const dot = Math.max(10, Number(data?.dotSize ?? 12))
	const fill = kind === 'person' ? '#5b8fd4' : '#5ead6b'
	const details = (data?.details ?? {}) as Record<string, string | null>
	const sub = nodeSubtitle(kind, details)
	const open = () => openDetailFromData(openDetail, id, data as Record<string, unknown>)

	return (
		<div className="relative flex w-full flex-col items-center">
			<Handle
				id="c"
				type="source"
				position={Position.Left}
				style={dotHandle(dot)}
			/>
		<div
			className="flex w-full cursor-grab active:cursor-grabbing flex-col items-center gap-0.5"
			role="button"
			tabIndex={0}
			onClick={(e) => {
				e.stopPropagation()
				open()
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					open()
				}
			}}
		>
			<div
				className="shrink-0 rounded-full transition-[filter] hover:brightness-125"
					style={{ width: dot, height: dot, backgroundColor: fill }}
					aria-hidden
				/>
				<span className="pointer-events-none line-clamp-2 max-w-[7.5rem] text-center text-[11px] leading-snug text-[#c0c0c0]">
					{label}
				</span>
				{sub && (
					<span className="pointer-events-none max-w-[7.5rem] truncate text-center text-[9px] leading-none text-[#5a5a5a]">
						{sub}
					</span>
				)}
			</div>
		</div>
	)
}

function CenterEntityNode({ id, data }: NodeProps) {
	const { openDetail } = useGraphDetail()
	const label = String(data?.label ?? '')
	const dot = Math.max(20, Number(data?.dotSize ?? 28))
	const details = (data?.details ?? {}) as Record<string, string | null>
	const sub = nodeSubtitle('entity', details)
	const open = () => openDetailFromData(openDetail, id, data as Record<string, unknown>)

	return (
		<div className="relative flex w-full flex-col items-center">
			<Handle
				id="c"
				type="source"
				position={Position.Left}
				style={dotHandle(dot)}
			/>
		<div
			className="flex w-full cursor-grab active:cursor-grabbing flex-col items-center gap-1"
			role="button"
			tabIndex={0}
			onClick={(e) => {
				e.stopPropagation()
				open()
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					open()
				}
			}}
		>
			<div
				className="shrink-0 rounded-full ring-2 ring-[#a0b4d8]/35 transition-[filter] hover:brightness-125"
					style={{ width: dot, height: dot, backgroundColor: '#8b9dc4' }}
					aria-hidden
				/>
				<span className="pointer-events-none line-clamp-2 max-w-[10rem] text-center text-[12px] font-medium leading-snug text-[#d8d8d8]">
					{label}
				</span>
				{sub && (
					<span className="pointer-events-none max-w-[10rem] truncate text-center text-[9px] leading-none text-[#5a5a5a]">
						{sub}
					</span>
				)}
			</div>
		</div>
	)
}

// ─── canvas ───────────────────────────────────────────────────────────────────

function OwnershipGraphCanvas({ entityId, registry }: { entityId: string; registry: string }) {
	const [banner, setBanner] = useState<string | null>(null)
	const [dupSummary, setDupSummary] = useState<string | null>(null)
	const [zoomPct, setZoomPct] = useState(100)
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

	const simRef = useRef<ReturnType<typeof forceSimulation<D3Node>> | null>(null)
	const d3MapRef = useRef<Map<string, D3Node>>(new Map())
	/** ID of the node currently being dragged by the user; d3 tick skips it to avoid jitter. */
	const draggingRef = useRef<string | null>(null)

	const load = useCallback(async () => {
		const data = (await apiPost('/ownership-graph', {
			registry: registry.toLowerCase(),
			entityStatementId: entityId,
		})) as GraphPayload | undefined

		if (!data || !Array.isArray(data.nodes)) {
			setBanner('Could not load graph.')
			setDupSummary(null)
			setNodes([])
			setEdges([])
			return
		}
		if (data.message) setBanner(data.message)
		else setBanner(null)
		setDupSummary(buildDuplicateNameSummary(data.nodes))

		const degreeMap = new Map<string, number>()
		for (const e of data.edges) {
			degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1)
			degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1)
		}

		const rfNodes = buildRfNodes(data.nodes, data.centerEntityId, degreeMap)
		const rfEdges = buildRfEdges(data.edges)
		setNodes(rfNodes)
		setEdges(rfEdges)

		// ── d3-force setup ──────────────────────────────────────────────────
		const N = rfNodes.length
		const R0 = Math.max(180, N * 30)

		const d3Nodes: D3Node[] = rfNodes.map((rfN, i) => {
			const isCenter = rfN.id === data.centerEntityId
			const dot = Number(rfN.data?.dotSize ?? 12)
			const w = (rfN.style?.width as number) || SAT_NODE_W
			const h = rfNodeH(dot)
			const angle = (2 * Math.PI * i) / N
			return {
				rfId: rfN.id,
				x: isCenter ? 0 : R0 * Math.cos(angle),
				y: isCenter ? 0 : R0 * Math.sin(angle),
				r: Math.sqrt(w * w + h * h) / 2 + 8,
				// Pin hub at origin for first ~1.2 s so satellites radiate outward
				fx: isCenter ? 0 : undefined,
				fy: isCenter ? 0 : undefined,
			}
		})

		d3MapRef.current = new Map(d3Nodes.map((n) => [n.rfId, n]))

		// forceLink expects SimulationLinkDatum compatible objects
		type RawLink = SimulationLinkDatum<D3Node> & { _id: string }
		const d3Links: RawLink[] = data.edges.map((e) => ({
			_id: e.id,
			source: e.source as unknown as D3Node,
			target: e.target as unknown as D3Node,
		}))

		simRef.current?.stop()

		const sim = forceSimulation<D3Node>(d3Nodes)
			.force(
				'link',
				forceLink<D3Node, RawLink>(d3Links)
					.id((n) => n.rfId)
					.distance(200)
					.strength(0.45),
			)
			.force('charge', forceManyBody<D3Node>().strength(-280))
			.force('center', forceCenter<D3Node>(0, 0))
			.force('collide', forceCollide<D3Node>().radius((n) => n.r).strength(0.7))
			.alphaDecay(0.025)
			.on('tick', () => {
				setNodes((prev) => syncD3ToRf(prev, d3MapRef.current, draggingRef.current))
			})

		simRef.current = sim

		// Release hub pin so it can drift with physics after initial settle
		setTimeout(() => {
			const c = d3MapRef.current.get(data.centerEntityId)
			if (c) {
				c.fx = undefined
				c.fy = undefined
			}
		}, 1200)
	}, [entityId, registry, setNodes, setEdges])

	useEffect(() => {
		void load()
		return () => {
			simRef.current?.stop()
		}
	}, [load])

	/** While dragging: pin d3 node to RF drag position, reheat neighbors. */
	const onNodeDrag: NodeDragHandler = useCallback((_, node) => {
		draggingRef.current = node.id
		const d3n = d3MapRef.current.get(node.id)
		if (!d3n) return
		const w = (node.style?.width as number) || SAT_NODE_W
		const dot = Number(node.data?.dotSize ?? 12)
		d3n.fx = node.position.x + w / 2
		d3n.fy = node.position.y + dot / 2
		simRef.current?.alpha(0.3).restart()
	}, [])

	/** After drag: unpin, let physics settle. */
	const onNodeDragStop: NodeDragHandler = useCallback((_, node) => {
		draggingRef.current = null
		const d3n = d3MapRef.current.get(node.id)
		if (!d3n) return
		d3n.fx = undefined
		d3n.fy = undefined
		simRef.current?.alpha(0.12).restart()
	}, [])

	const nodeTypes = useMemo(() => ({ labelNode: LabelNode, centerNode: CenterEntityNode }), [])

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			{banner && (
				<div className="shrink-0 border-b border-amber-900/60 bg-amber-950/40 px-4 py-2 text-sm text-amber-100">
					{banner}
				</div>
			)}
			<DuplicateNamesCallout text={dupSummary} />
			<div className="min-h-0 flex-1">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeDrag={onNodeDrag}
					onNodeDragStop={onNodeDragStop}
					onMove={(_, vp) => setZoomPct(Math.round(vp.zoom * 100))}
					nodeTypes={nodeTypes}
					connectionMode={ConnectionMode.Loose}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					className="obs-graph-canvas !bg-[#1e1e1e]"
					proOptions={{ hideAttribution: true }}
					minZoom={0.08}
					maxZoom={2.5}
				>
					<Background gap={22} color="#2e2e2e" />
					<Panel position="bottom-right" className="m-3 mb-4 mr-3">
						<MiniMap
							className="rounded-md border border-[#3f3f3f] bg-[#252525]"
							nodeColor={(n) => {
								if (n.type === 'centerNode') return '#8b9dc4'
								const k = (n.data as { kind?: string })?.kind
								return k === 'person' ? '#5b8fd4' : '#5ead6b'
							}}
							maskColor="rgba(0,0,0,0.55)"
							pannable
							zoomable
						/>
					</Panel>
					<GraphZoomPanel zoomPct={zoomPct} />
				</ReactFlow>
			</div>
		</div>
	)
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function OwnershipGraph() {
	const navigate = useNavigate()
	const location = useLocation()
	const state = location.state as { registry?: string; entityStatementId?: string } | undefined
	const entityId = state?.entityStatementId
	const registry = state?.registry ?? 'latvia'

	useEffect(() => {
		if (!entityId) navigate('/home', { replace: true })
	}, [entityId, navigate])

	if (!entityId) return null

	return (
		<div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
			<header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-700 px-4 py-3">
				<button
					type="button"
					className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
					onClick={() => navigate(-1)}
				>
					Back
				</button>
				<h1 className="text-lg font-semibold">Ownership structure</h1>
				<span className="text-sm text-neutral-400">Registry: {registry}</span>
				<span className="max-w-[56rem] text-xs leading-snug text-neutral-500">
					Force graph — drag any node to pull its neighbors. Blue = person · Green = company · Gray-blue
					hub = subject entity. Click any node for details.
				</span>
			</header>
			<ReactFlowProvider>
				<GraphDetailProvider>
					<OwnershipGraphCanvas entityId={entityId} registry={registry} />
				</GraphDetailProvider>
			</ReactFlowProvider>
		</div>
	)
}
