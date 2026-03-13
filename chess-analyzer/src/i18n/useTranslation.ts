import { createContext, useContext } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

export interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (key) => translations.pt[key],
});

export function useTranslation() {
  return useContext(I18nContext);
}
