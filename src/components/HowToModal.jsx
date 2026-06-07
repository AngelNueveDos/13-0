const STEPS = [
  {
    n: '01',
    title: 'Set your terms',
    body: 'Choose a formation, a format (classic Group Stage or the new 36-team League Stage) and a difficulty — Easy/Medium/Hard set how many re-rolls you get (3/1/0).',
  },
  {
    n: '02',
    title: 'Draft your eleven',
    body: 'Press Roll to draw a random club, then take one player and place him at a position he can play. Roll again for the next pick — re-roll a club you dislike if you still have credits. Tap a placed player to move or swap him.',
  },
  {
    n: '03',
    title: 'Win Europe',
    body: 'Simulate the campaign: a group (or league) phase, two-legged knockouts and a one-off final. A stronger XI tilts the odds your way.',
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
