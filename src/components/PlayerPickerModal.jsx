import { playerFitsRole } from '../data/formations'

export default function PlayerPickerModal({ slot, squad, usedNames, currentName, onPick, onClear, onClose }) {
  if (!slot) return null

  const eligible = squad
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => playerFitsRole(p, slot.role))
    .sort((a, b) => b.p.rating - a.p.rating)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel flex max-h-[80vh] w-full max-w-md animate-fadeUp flex-col rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="eyebrow">Choose a player</p>
            <h3 className="font-display text-2xl text-cream">
              {slot.role} <span className="text-bluegray/60">·</span>{' '}
              <span className="text-gold">{eligible.length} options</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-bluegray transition hover:border-gold/50 hover:text-gold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {currentName && (
            <button
              onClick={onClear}
              className="mb-2 w-full rounded-xl border border-white/5 px-4 py-2 text-left font-display text-sm text-bluegray transition hover:border-red-400/30 hover:text-red-300/90"
            >
              ✕ Remove {currentName} from this position
            </button>
          )}

          <ul className="space-y-1.5">
            {eligible.map(({ p }) => {
              const used = usedNames.has(p.name) && p.name !== currentName
              const isCurrent = p.name === currentName
              return (
                <li key={p.name}>
                  <button
                    disabled={used}
                    onClick={() => onPick(p)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200',
                      used
                        ? 'cursor-not-allowed border-white/5 opacity-35'
                        : 'border-white/5 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-navy-700/40',
                      isCurrent ? 'border-gold/60 bg-navy-700/40' : '',
                    ].join(' ')}
                  >
                    <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-sm font-bold text-navy-deep">
                      {p.rating}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg leading-tight text-cream">
                        {p.name}
                      </span>
                      <span className="block text-sm text-bluegray">
                        {p.positions.join(' · ')}
                      </span>
                    </span>
                    {used && <span className="text-xs font-display text-bluegray/70">On pitch</span>}
                    {isCurrent && <span className="text-xs font-display text-gold">Selected</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
