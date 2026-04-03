import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import kn from './kn.json'
import te from './te.json'
import ta from './ta.json'

const savedLang = localStorage.getItem('vaakya_lang') || 'kn'

i18n.use(initReactI18next).init({
  resources: {
    kn: { translation: kn },
    te: { translation: te },
    ta: { translation: ta },
  },
  lng: savedLang,
  fallbackLng: 'kn',
  interpolation: { escapeValue: false },
})

export default i18n
