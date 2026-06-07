import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Bundled at build time — no network requests, works fully offline
import enCommon from "./locales/en/common.json";
import frCommon from "./locales/fr/common.json";

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: { common: enCommon },
			fr: { common: frCommon },
		},
		fallbackLng: "en",
		defaultNS: "common",
		ns: ["common"],
		// Normalise "en-US" → "en" so the detector always resolves to a key we have
		load: "languageOnly",
		interpolation: {
			// React already escapes output; disabling prevents double-escaping
			escapeValue: false,
		},
		detection: {
			// Check localStorage first (user's explicit choice), then browser language
			order: ["localStorage", "navigator"],
			caches: ["localStorage"],
			lookupLocalStorage: "gymtracker-lang",
		},
	});

export default i18n;
