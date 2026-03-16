import { useState, useCallback, useMemo } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { I18nContext } from './i18n/useTranslation';
import { translations, type Language, type TranslationKey } from './i18n/translations';
import LanguageToggle from './components/LanguageToggle/LanguageToggle';
import Analysis from './pages/Analysis';
import PlayBot from './pages/PlayBot';
import './App.css';

export default function App() {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('chess-analyzer-lang') as Language) || 'pt';
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('chess-analyzer-lang', l);
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);

  const i18nValue = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1 className="app-title">{t('title')}</h1>
            <nav className="app-nav">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {t('analysis')}
              </NavLink>
              <NavLink to="/play" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {t('playBot')}
              </NavLink>
            </nav>
          </div>
          <LanguageToggle />
        </header>

        <Routes>
          <Route path="/" element={<Analysis />} />
          <Route path="/play" element={<PlayBot />} />
        </Routes>
      </div>
    </I18nContext.Provider>
  );
}
