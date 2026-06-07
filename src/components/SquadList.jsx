import { useMemo, useState } from 'react'

const ORDER = ['GK', 'CB', 'SW', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']

export default function SquadList({ squad, usedNames, armedName, onArm, onRemove }) {
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  const chips = useMemo(() => {
    const set = new Set()
    squad.forEach((p) => p.positions.forEach((pos) => set.add(pos)))
    return ['ALL', ...ORDER.filter((o) => set.has(o))]
  }, [squad])

  const visible = useMemo(() => {
    let list = filter === 'ALL' ? squad : squad.filter((p) => p.positions.includes(filter))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => b.rating - a.rating)
  }, [squad, filter, query])

  return (
    <div className="panel flex h-full flex-col">
      <div className="space-y-2 border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">Squad · {squad.length}</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-28 rounded-full border border-white/10 bg-navy-deep/60 px-3 py-1 font-body text-sm text-cream placeholder:text-bluegray/50 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={[
                'rounded-full px-2.5 py-1 font-display text-xs tracking-wide transition-colors',
                filter === c ? 'bg-gold text-navy-deep' : 'border border-white/10 text-bluegray hover:border-gold/40 hover:text-gold',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {visible.map((p) => {
          const used = usedNames.has(p.name)
          const armed = armedName === p.name
          return (
            <li key={p.name}>
              <button
                onClick={() => (used ? onRemove(p) : onArm(p))}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5',
                  armed
                    ? 'border-gold bg-gold/10 shadow-gold'
                    : used
                      ? 'border-gold/40 bg-navy-700/40'
                      : 'border-white/5 hover:border-gold/40 hover:bg-navy-700/30',
                ].join(' ')}
              >
                <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-sm font-bold text-navy-deep">
                  {p.rating}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base leading-tight text-cream">{p.name}</span>
                  <span className="block text-xs text-bluegray">{p.positions.join(' · ')}</span>
                </span>
                {armed ? (
                  <span className="shrink-0 font-display text-[0.62rem] uppercase tracking-wider text-gold">Placing…</span>
                ) : used ? (
                  <span className="shrink-0 font-display text-[0.62rem] uppercase tracking-wider text-gold/80">✕ Remove</span>
                ) : null}
              </button>
            </li>
          )
        })}
        {visible.length === 0 && <li className="px-2 py-6 text-center text-bluegray">No players match.</li>}
      </ul>
    </div>
  )
}
