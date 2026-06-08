import { useI18n } from '../i18n'

export default function HowToModal({ open, onClose }) {
  const { t } = useI18n()
  if (!open) return null
  const steps = [
    { n: '01', title: t('howto.s1t'), body: t('howto.s1b') },
    { n: '02', title: t('howto.s2t'), body: t('howto.s2b') },
    { n: '03', title: t('howto.s3t'), body: t('howto.s3b') },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-lg animate-fadeUp p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">{t('howto.eyebrow')}</p>
            <h2 className="font-display text-2xl text-cream">{t('howto.title')}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-bluegray transition hover:border-gold/50 hover:text-gold" aria-label="Close">✕</button>
        </div>

        <ol className="space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="font-display text-xl text-gold/60">{s.n}</span>
              <div>
                <h3 className="font-display text-lg text-cream">{s.title}</h3>
                <p className="text-[1.05rem] leading-snug text-bluegray">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button onClick={onClose} className="btn-gold mt-7 w-full">{t('howto.understood')}</button>
      </div>
    </div>
  )
}
