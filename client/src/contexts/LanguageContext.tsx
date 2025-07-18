import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getCurrentLanguage, setCurrentLanguage, initializeLanguage, translations, TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    initializeLanguage();
    const lang = getCurrentLanguage();
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
    
    // Reload the page to apply RTL/LTR changes properly
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Custom hook for getting translations
export function useTranslation() {
  const { language } = useLanguage();
  
  return {
    t: (key: TranslationKey, variables?: Record<string, string>) => {
      let translation = translations[key]?.[language] || translations[key]?.en || key;
      
      // Replace variables in the translation
      if (variables) {
        Object.entries(variables).forEach(([varKey, value]) => {
          translation = translation.replace(new RegExp(`{${varKey}}`, 'g'), value);
        });
      }
      
      return translation;
    },
    language
  };
}