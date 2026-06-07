const STEPS = [
  {
    n: '01',
    title: 'Lock your shape',
    body: 'Pick one of eight formations. It’s fixed for the whole draft, so choose the system you want to fill.',
  },
  {
    n: '02',
    title: 'Draft your eleven',
    body: 'A random club is drawn. Take one player and place him at a position he can play — then a new club is drawn. Repeat until eleven are on the pitch. Tap a placed player to move or swap him.',
  },
  {
    n: '03',
    title: 'Win Europe',
    body: 'Simulate a six-match group, then two-legged knockouts and a one-off final. Top two of the group advance — a stronger XI tilts the odds your way.',
  },
]

export default function HowToModal({ open, onClose }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-lg animate-fadeUp p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">The ritual</p>
            <h2 className="font-display text-2xl text-cream">How to play</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-bluegray transition hover:border-gold/50 hover:text-gold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <ol className="space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="font-display text-xl text-gold/60">{s.n}</span>
              <div>
                <h3 className="font-display text-lg text-cream">{s.title}</h3>
                <p className="text-[1.05rem] leading-snug text-bluegray">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button onClick={onClose} className="btn-gold mt-7 w-full">
          Understood
        </button>
      </div>
    </div>
  )
}
