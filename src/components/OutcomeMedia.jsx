import { useState } from 'react'
import { OUTCOME_GIFS, OUTCOME_SCENE } from '../data/outcomeMedia'

export default function OutcomeMedia({ outcome }) {
  const gif = OUTCOME_GIFS[outcome]
  const scene = OUTCOME_SCENE[outcome] || { emoji: '⚽', accent: 'dim' }
  const [broken, setBroken] = useState(false)

  if (gif && !broken) {
    return (
      <div className="mx-auto mb-4 overflow-hidden rounded-2xl border border-white/10" style={{ maxWidth: 320 }}>
        <img
          src={gif}
          alt=""
          onError={() => setBroken(true)}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  const champ = scene.glow
  return (
    <div
      className={`mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border ${champ ? 'border-gold/60' : 'border-white/10'}`}
      style={{
        background: champ
          ? 'radial-gradient(circle at 50% 35%, rgba(201,168,76,0.25), rgba(10,22,40,0.2))'
          : 'radial-gradient(circle at 50% 35%, rgba(142,160,184,0.12), rgba(10,22,40,0.15))',
        boxShadow: champ ? '0 0 50px -8px rgba(201,168,76,0.5)' : 'none',
      }}
    >
      <span className={`text-6xl ${champ ? 'animate-spinReveal' : 'animate-fadeUp'}`} aria-hidden="true">
        {scene.emoji}
      </span>
    </div>
  )
}
