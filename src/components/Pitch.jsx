import { initials } from '../lib/util'

function FieldLines() {
  const stroke = 'rgba(244,241,232,0.32)'
  return (
    <svg
      viewBox="0 0 300 400"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g fill="none" stroke={stroke} strokeWidth="1.6">
        {/* boundary */}
        <rect x="12" y="12" width="276" height="376" rx="2" />
        {/* halfway */}
        <line x1="12" y1="200" x2="288" y2="200" />
        <circle cx="150" cy="200" r="34" />
        <circle cx="150" cy="200" r="1.6" fill={stroke} stroke="none" />

        {/* top (attacking) goal */}
        <rect x="70" y="12" width="160" height="58" />
        <rect x="110" y="12" width="80" height="28" />
        <rect x="130" y="5" width="40" height="7" />
        <circle cx="150" cy="52" r="1.4" fill={stroke} stroke="none" />
        <path d="M121.2,70 A34,34 0 0 0 178.8,70" />

        {/* bottom (own) goal */}
        <rect x="70" y="330" width="160" height="58" />
        <rect x="110" y="360" width="80" height="28" />
        <rect x="130" y="388" width="40" height="7" />
        <circle cx="150" cy="348" r="1.4" fill={stroke} stroke="none" />
        <path d="M121.2,330 A34,34 0 0 1 178.8,330" />
      </g>
    </svg>
  )
}

function Token({ slot, player, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <span
        className={[
          'relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-14',
          'group-hover:-translate-y-0.5',
          player
            ? 'border border-gold/70 bg-gradient-to-b from-navy-700 to-navy-deep text-cream shadow-gold'
            : 'border-2 border-dashed border-gold/40 bg-navy-deep/40 text-gold/70 group-hover:border-gold/80',
          active ? 'ring-2 ring-gold ring-offset-2 ring-offset-navy animate-pulseGlow' : '',
        ].join(' ')}
      >
        {player ? (
          <>
            <span className="font-display text-base font-semibold leading-none">
              {initials(player.name)}
            </span>
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-display text-[0.62rem] font-bold leading-none text-navy-deep shadow">
              {player.rating}
            </span>
          </>
        ) : (
          <span className="font-display text-xs tracking-wide">{slot.role}</span>
        )}
      </span>

      <span
        className={[
          'mt-1 rounded px-1.5 py-0.5 font-display text-[0.62rem] uppercase tracking-wider transition-colors',
          player ? 'bg-navy-deep/70 text-gold' : 'text-bluegray/70',
        ].join(' ')}
      >
        {slot.role}
      </span>
    </button>
  )
}

export default function Pitch({ slots, assignments, activeSlotId, onSlotClick }) {
  return (
    <div
      className="grass-stripes relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-white/5"
      style={{
        background:
          'linear-gradient(180deg, #0f3d2a 0%, #0c3122 50%, #0a2a1d 100%)',
        boxShadow: '0 18px 50px -20px rgba(0,0,0,0.7), inset 0 0 80px rgba(0,0,0,0.35)',
      }}
    >
      <FieldLines />
      {slots.map((slot) => (
        <Token
          key={slot.id}
          slot={slot}
          player={assignments[slot.id]}
          active={activeSlotId === slot.id}
          onClick={() => onSlotClick(slot)}
        />
      ))}
    </div>
  )
}
