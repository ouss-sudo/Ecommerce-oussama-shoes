import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language } from "../i18n/translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: any;
    dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>(
        (localStorage.getItem("language") as Language) || "fr"
    );

    useEffect(() => {
        localStorage.setItem("language", language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }, [language]);

    const t = translations[language];
    const dir = language === "ar" ? "rtl" : "ltr";

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            <div dir={dir} className={language === "ar" ? "font-arabic" : ""}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
