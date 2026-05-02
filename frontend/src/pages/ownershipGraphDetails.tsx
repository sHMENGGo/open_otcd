import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { humanizeDetailRows } from '../utils/ownershipDetailLabels'

export type DetailOpenPayload = {
	nodeId: string
	title: string
	kind: 'entity' | 'person'
	rows: [string, string][]
}

type DetailWindow = DetailOpenPayload & {
	x: number
	y: number
	z: number
}

const GraphDetailContext = createContext<{
	openDetail: (p: DetailOpenPayload) => void
} | null>(null)

export function useGraphDetail() {
	const ctx = useContext(GraphDetailContext)
	if (!ctx) throw new Error('useGraphDetail outside GraphDetailProvider')
	return ctx
}

export function detailPayloadFromNode(
	nodeId: string,
	label: string,
	kind: 'entity' | 'person',
	details?: Record<string, string | null | undefined>,
): DetailOpenPayload {
	const rows = humanizeDetailRows(kind, details)
	if (rows.length === 0) {
		rows.push(['Display name', label], ['Graph node id', nodeId])
	}
	return { nodeId, title: label, kind, rows }
}

let zSeed = 10

function DraggableWindow({
	win,
	onClose,
	onFocus,
}: {
	win: DetailWindow
	onClose: () => void
	onFocus: () => void
}) {
	const drag = useRef({
		active: false,
		startX: 0,
		startY: 0,
		origX: 0,
		origY: 0,
	})
	const [pos, setPos] = useState({ x: win.x, y: win.y })

	useEffect(() => {
		setPos({ x: win.x, y: win.y })
	}, [win.x, win.y])

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!drag.current.active) return
			setPos({
				x: drag.current.origX + (e.clientX - drag.current.startX),
				y: drag.current.origY + (e.clientY - drag.current.startY),
			})
		}
		const onUp = () => {
			drag.current.active = false
		}
		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)
		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
		}
	}, [])

	const onHeaderDown = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest('button')) return
		e.preventDefault()
		onFocus()
		drag.current = {
			active: true,
			startX: e.clientX,
			startY: e.clientY,
			origX: pos.x,
			origY: pos.y,
		}
	}

	const headerBg = win.kind === 'person' ? 'bg-[#1e3a5f]' : 'bg-[#14532d]'

	return (
		<div
			className="fixed max-h-[min(420px,70vh)] w-[min(380px,92vw)] overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 text-sm shadow-2xl"
			style={{ left: pos.x, top: pos.y, zIndex: win.z }}
			onMouseDown={onFocus}
		>
			<div
				data-drag-handle
				className={`flex cursor-grab select-none items-center justify-between gap-2 border-b border-neutral-600 px-3 py-2 active:cursor-grabbing ${headerBg}`}
				onMouseDown={onHeaderDown}
			>
				<span className="min-w-0 flex-1 truncate font-medium text-white">{win.title}</span>
				<button
					type="button"
					className="shrink-0 rounded bg-black/30 px-2 py-0.5 text-xs text-white hover:bg-black/50"
					onClick={(e) => {
						e.stopPropagation()
						onClose()
					}}
				>
					Close
				</button>
			</div>
			<div className="max-h-[min(340px,55vh)] overflow-auto p-3 text-neutral-200">
				<dl className="space-y-2">
					{win.rows.map(([k, v]) => (
						<div key={k} className="grid gap-1 border-b border-neutral-800 pb-2 last:border-0">
							<dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{k}</dt>
							<dd className="break-words text-neutral-100">{v}</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	)
}

export function GraphDetailProvider({ children }: { children: ReactNode }) {
	const [windows, setWindows] = useState<DetailWindow[]>([])

	const openDetail = useCallback((p: DetailOpenPayload) => {
		zSeed += 1
		setWindows((prev) => {
			const idx = prev.findIndex((w) => w.nodeId === p.nodeId)
			const base = {
				...p,
				x: 80 + (prev.length % 4) * 28,
				y: 100 + (prev.length % 3) * 36,
				z: zSeed,
			}
			if (idx >= 0) {
				const copy = [...prev]
				copy[idx] = { ...copy[idx], ...p, z: zSeed }
				return copy
			}
			return [...prev, base]
		})
	}, [])

	const closeWindow = useCallback((nodeId: string) => {
		setWindows((prev) => prev.filter((w) => w.nodeId !== nodeId))
	}, [])

	const focusWindow = useCallback((nodeId: string) => {
		zSeed += 1
		setWindows((prev) =>
			prev.map((w) => (w.nodeId === nodeId ? { ...w, z: zSeed } : w)),
		)
	}, [])

	const value = useMemo(() => ({ openDetail }), [openDetail])

	return (
		<GraphDetailContext.Provider value={value}>
			{children}
			{windows.map((w) => (
				<DraggableWindow
					key={w.nodeId}
					win={w}
					onClose={() => closeWindow(w.nodeId)}
					onFocus={() => focusWindow(w.nodeId)}
				/>
			))}
		</GraphDetailContext.Provider>
	)
}
