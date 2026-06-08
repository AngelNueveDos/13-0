import { useI18n } from '../i18n'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header({ onHowTo, onReplay, onFeedback }) {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-deep/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <button
          onClick={onReplay}
          className="group flex items-baseline gap-0.5 font-display text-2xl font-bold tracking-tight text-cream"
          aria-label="13—0 home"
        >
          <span className="text-gold transition-colors group-hover:text-gold-soft">13</span>
          <span className="text-bluegray/60">—</span>
          <span className="transition-colors group-hover:text-gold-soft">0</span>
        </button>

        <nav className="flex items-center gap-2 sm:gap-3">
          <button onClick={onHowTo} className="btn-ghost !px-4 !py-2 text-xs sm:text-sm">{t('header.howToPlay')}</button>
          <button onClick={onFeedback} className="btn-ghost !px-4 !py-2 text-xs sm:text-sm">{t('header.feedback')}</button>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
