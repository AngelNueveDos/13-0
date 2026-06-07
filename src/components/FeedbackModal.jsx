import { useState } from 'react'
import { useI18n } from '../i18n'

// Where suggestions are sent. Zero-backend: opens the visitor's mail client.
// Swap for a Formspree/Tally endpoint later if you want silent collection.
const FEEDBACK_EMAIL = 'ange.louvier92@gmail.com'

export default function FeedbackModal({ open, onClose }) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  if (!open) return null

  function send() {
    const body = encodeURIComponent(text || '')
    const subject = encodeURIComponent('13—0 · feedback')
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-lg animate-fadeUp p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="eyebrow">{t('fb.eyebrow')}</p>
            <h2 className="font-display text-2xl text-cream">{t('fb.title')}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-bluegray transition hover:border-gold/50 hover:text-gold" aria-label="Close">✕</button>
        </div>

        <p className="mb-3 text-lg text-bluegray">{t('fb.prompt')}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('fb.placeholder')}
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-navy-deep/60 px-4 py-3 font-body text-lg text-cream placeholder:text-bluegray/50 focus:border-gold/50 focus:outline-none"
        />
        <p className="mt-2 text-sm text-bluegray/70">{t('fb.hint')}</p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">{t('fb.cancel')}</button>
          <button onClick={send} disabled={!text.trim()} className="btn-gold">{t('fb.send')}</button>
        </div>
      </div>
    </div>
  )
}
