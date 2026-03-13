import { useTranslation } from '../../i18n/useTranslation';
import './LanguageToggle.css';

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation();

  return (
    <button
      className="lang-toggle"
      onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
    >
      {lang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
    </button>
  );
}
