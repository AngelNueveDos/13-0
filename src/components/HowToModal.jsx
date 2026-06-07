const STEPS = [
  {
    n: '01',
    title: 'Draw your fate',
    body: 'Spin the draw to be handed a Champions League edition and one of the era’s great clubs. No two runs alike.',
  },
  {
    n: '02',
    title: 'Pick your eleven',
    body: 'Place eleven players from that squad onto the pitch. Tap a position to see who fits, then choose your formation.',
  },
  {
    n: '03',
    title: 'Write history',
    body: 'Simulate the campaign. The stronger your average rating, the better your odds of lifting the trophy in Europe.',
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
