function Star({ spinning }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-28 w-28 ${spinning ? 'animate-starSpin' : ''}`}
      style={{ filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.45))' }}
    >
      <polygon
        points="50,4 61,38 97,38 68,60 79,95 50,73 21,95 32,60 3,38 39,38"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points="50,20 56,40 77,40 60,53 66,74 50,61 34,74 40,53 23,40 44,40"
        fill="rgba(201,168,76,0.18)"
        stroke="rgba(201,168,76,0.5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DrawScreen({ phase, team, onSpin, onContinue }) {
  const revealed = phase === 'revealed'
  const spinning = phase === 'spinning'

  return (
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
      <p className="eyebrow mb-3 animate-fadeUp">UEFA Champions League · 2010—2025</p>
      <h1 className="mb-2 animate-fadeUp font-display text-5xl leading-tight text-cream sm:text-6xl">
        Draw an era.<br />
        <span className="text-gold">Build your eleven.</span>
      </h1>
      <p className="mb-10 max-w-md animate-fadeUp text-xl text-bluegray">
        One edition. One legendary club. Eleven choices between you and the trophy.
      </p>

      <div className="relative flex h-44 items-center justify-center">
        {!revealed && <Star spinning={spinning} />}

        {revealed && team && (
          <div className="animate-spinReveal">
            <p className="eyebrow mb-2">{team.edition} · Champions League</p>
            <p className="font-display text-4xl text-cream sm:text-5xl">{team.club}</p>
            {team.crown && (
              <p className="mt-2 font-display text-base italic tracking-wide text-gold/80">
                {team.crown}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 h-12">
        {!revealed ? (
          <button onClick={onSpin} disabled={spinning} className="btn-gold">
            {spinning ? 'Drawing…' : 'Spin the draw'}
          </button>
        ) : (
          <div className="flex animate-fadeUp items-center gap-3">
            <button onClick={onSpin} className="btn-ghost">
              Draw again
            </button>
            <button onClick={onContinue} className="btn-gold">
              Build this XI →
            </button>
          </div>
        )}
      </div>

      <p
        className={`mt-10 max-w-lg font-display text-lg italic text-bluegray/70 transition-opacity duration-700 ${
          spinning || revealed ? 'opacity-100' : 'opacity-50'
        }`}
      >
        “Every draw is a new chance to write the history of Europe.”
      </p>
    </section>
  )
}
