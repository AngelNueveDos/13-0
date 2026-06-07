import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'

const ORDER = ['GK', 'CB', 'SW', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST']

export default function DraftList({ club, edition, players, armedName, canPlace, onPick }) {
  const { t } = useI18n()
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  const chips = useMemo(() => {
    const set = new Set()
    players.forEach((p) => p.positions.forEach((pos) => set.add(pos)))
    return ['ALL', ...ORDER.filter((o) => set.has(o))]
  }, [players])

  const visible = useMemo(() => {
    let list = filter === 'ALL' ? players : players.filter((p) => p.positions.includes(filter))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => Number(canPlace(b)) - Number(canPlace(a)) || b.rating - a.rating)
  }, [players, filter, query, canPlace])

  return (
    <div className="panel flex h-full flex-col">
      <div className="space-y-2 border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="eyebrow truncate">{t('list.drawn')} · {club}</p>
            <p className="font-display text-base text-bluegray">{edition}</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('list.search')}
            className="w-28 rounded-full border border-white/10 bg-navy-deep/60 px-3 py-1.5 font-body text-base text-cream placeholder:text-bluegray/50 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={[
                'rounded-full px-2.5 py-1 font-display text-sm tracking-wide transition-colors',
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
          const placeable = canPlace(p)
          const armed = armedName === p.name
          return (
            <li key={p.name}>
              <button
                disabled={!placeable}
                onClick={() => onPick(p)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                  armed
                    ? 'border-gold bg-gold/10 shadow-gold'
                    : placeable
                      ? 'border-white/5 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-navy-700/30'
                      : 'cursor-not-allowed border-white/5 opacity-30',
                ].join(' ')}
              >
                <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-base font-bold text-navy-deep">
                  {p.rating}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg leading-tight text-cream">{p.name}</span>
                  <span className="block text-sm text-bluegray">{p.positions.join(' · ')}</span>
                </span>
                {armed && <span className="shrink-0 font-display text-[0.66rem] uppercase tracking-wider text-gold">●</span>}
              </button>
            </li>
          )
        })}
        {visible.length === 0 && <li className="px-2 py-6 text-center text-bluegray">{t('list.noMatch')}</li>}
      </ul>
    </div>
  )
}
