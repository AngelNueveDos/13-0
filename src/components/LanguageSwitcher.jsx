import { useEffect, useRef, useState } from 'react'
import { LANGS, useI18n } from '../i18n'

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = LANGS.find((l) => l.code === lang) || LANGS[0]

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-2 font-display text-sm text-gold/90 transition hover:border-gold/70 hover:text-gold"
        aria-label="Language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <span className="text-[0.6rem] opacity-70">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-44 animate-fadeUp overflow-hidden rounded-xl border border-white/10 bg-navy-800/95 backdrop-blur-md shadow-card">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={[
                'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-body text-base transition-colors',
                l.code === lang ? 'bg-gold/15 text-gold' : 'text-cream hover:bg-navy-700/60',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
