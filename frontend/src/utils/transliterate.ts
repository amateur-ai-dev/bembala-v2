/**
 * Phonetic transliteration: romanized input → Kannada / Telugu / Tamil
 *
 * Algorithm: greedy longest-match left-to-right.
 *   - Consonant + vowel letter  → consonant + vowel sign
 *   - Consonant + consonant     → consonant + halant (conjunct)
 *   - Consonant at end of word  → consonant (keeps inherent 'a')
 *   - Vowel at non-consonant position → standalone vowel form
 */

export type TranslitLang = 'kn' | 'te' | 'ta'

// index into per-language tuples
const IDX: Record<TranslitLang, 0 | 1 | 2> = { kn: 0, te: 1, ta: 2 }

// virama (halant) per language — suppresses inherent 'a' vowel
const HALANT: [string, string, string] = ['್', '్', '்']

// Consonant base characters (includes inherent 'a').
// Listed longest-pattern first so greedy match works correctly.
const CONS: [string, string, string, string][] = [
  // tri-grams
  ['ksh', 'ಕ್ಷ', 'క్ష',  'க்ஷ'],
  ['gny', 'ಜ್ಞ', 'జ్ఞ',  'ஜ்ஞ'],
  // di-grams
  ['kh',  'ಖ',   'ఖ',    'க'],
  ['gh',  'ಘ',   'ఘ',    'க'],
  ['ch',  'ಚ',   'చ',    'ச'],
  ['jh',  'ಝ',   'ఝ',    'ஜ'],
  ['ng',  'ಙ',   'ఙ',    'ங'],
  ['ny',  'ಞ',   'ఞ',    'ஞ'],
  ['Th',  'ಠ',   'ఠ',    'ட'],
  ['Dh',  'ಢ',   'ఢ',    'ட'],
  ['th',  'ತ',   'థ',    'த'],
  ['dh',  'ಧ',   'ధ',    'த'],
  ['ph',  'ಫ',   'ఫ',    'ப'],
  ['bh',  'ಭ',   'భ',    'ப'],
  ['sh',  'ಶ',   'శ',    'ஷ'],
  ['Sh',  'ಷ',   'ష',    'ஷ'],
  ['nn',  'ಣ',   'ణ',    'ண'],
  ['ll',  'ಳ',   'ళ',    'ள'],
  ['rr',  'ಱ',   'ఱ',    'ற'],
  // mono-grams
  ['k',   'ಕ',   'క',    'க'],
  ['g',   'ಗ',   'గ',    'க'],
  ['c',   'ಚ',   'చ',    'ச'],
  ['j',   'ಜ',   'జ',    'ஜ'],
  ['T',   'ಟ',   'ట',    'ட'],
  ['D',   'ಡ',   'డ',    'ட'],
  ['N',   'ಣ',   'ణ',    'ண'],
  ['t',   'ತ',   'త',    'த'],
  ['d',   'ದ',   'ద',    'த'],
  ['n',   'ನ',   'న',    'ந'],
  ['p',   'ಪ',   'ప',    'ப'],
  ['b',   'ಬ',   'బ',    'ப'],
  ['m',   'ಮ',   'మ',    'ம'],
  ['y',   'ಯ',   'య',    'ய'],
  ['r',   'ರ',   'ర',    'ர'],
  ['l',   'ಲ',   'ల',    'ல'],
  ['v',   'ವ',   'వ',    'வ'],
  ['w',   'ವ',   'వ',    'வ'],
  ['s',   'ಸ',   'స',    'ஸ'],
  ['h',   'ಹ',   'హ',    'ஹ'],
  ['f',   'ಫ',   'ఫ',    'ப'],
  ['z',   'ಜ',   'జ',    'ஜ'],
  ['L',   'ಳ',   'ళ',    'ள'],
]

// Vowels: [roman, kn_sign, te_sign, ta_sign, kn_standalone, te_standalone, ta_standalone]
// sign = combining form after a consonant; standalone = used at word start / alone
// Listed longest-pattern first.
const VOWELS: [string, string, string, string, string, string, string][] = [
  ['aa', 'ಾ',  'ా',  'ா',  'ಆ',  'ఆ',  'ஆ'],
  ['ii', 'ೀ',  'ీ',  'ீ',  'ಈ',  'ఈ',  'ஈ'],
  ['uu', 'ೂ',  'ూ',  'ூ',  'ಊ',  'ఊ',  'ஊ'],
  ['ee', 'ೇ',  'ే',  'ே',  'ಏ',  'ఏ',  'ஏ'],
  ['oo', 'ೋ',  'ో',  'ோ',  'ಓ',  'ఓ',  'ஓ'],
  ['ai', 'ೈ',  'ై',  'ை',  'ಐ',  'ఐ',  'ஐ'],
  ['au', 'ೌ',  'ౌ',  'ௌ',  'ಔ',  'ఔ',  'ஔ'],
  ['a',  '',   '',   '',   'ಅ',  'అ',  'அ'],  // inherent — sign is empty (no-op after consonant)
  ['i',  'ಿ',  'ి',  'ி',  'ಇ',  'ఇ',  'இ'],
  ['u',  'ು',  'ు',  'ு',  'ಉ',  'ఉ',  'உ'],
  ['e',  'ೆ',  'ె',  'ெ',  'ಎ',  'ఎ',  'எ'],
  ['o',  'ೊ',  'ొ',  'ொ',  'ಒ',  'ఒ',  'ஒ'],
]

// ── public API ────────────────────────────────────────────────────────────────

export function transliterate(input: string, lang: TranslitLang): string {
  const idx = IDX[lang]
  let result = ''
  let i = 0

  while (i < input.length) {
    // try consonant match
    let consNative: string | null = null
    let afterCons = i
    for (const [roman, kn, te, ta] of CONS) {
      if (input.startsWith(roman, i)) {
        consNative = [kn, te, ta][idx]
        afterCons = i + roman.length
        break
      }
    }

    if (consNative !== null) {
      // look for a vowel after the consonant
      let vowelSign: string | null = null
      let afterVowel = afterCons
      for (const [roman, knS, teS, taS] of VOWELS) {
        if (input.startsWith(roman, afterCons)) {
          vowelSign = [knS, teS, taS][idx]
          afterVowel = afterCons + roman.length
          break
        }
      }

      if (vowelSign !== null) {
        // consonant + vowel sign (empty sign = inherent 'a', which is the default)
        result += consNative + vowelSign
        i = afterVowel
      } else {
        // no vowel follows — check whether a consonant comes next
        let nextIsConsonant = false
        for (const [roman] of CONS) {
          if (input.startsWith(roman, afterCons)) { nextIsConsonant = true; break }
        }
        if (nextIsConsonant) {
          // conjunct: suppress inherent vowel with halant
          result += consNative + HALANT[idx]
        } else {
          // end of word / space / punct — keep inherent 'a'
          result += consNative
        }
        i = afterCons
      }
    } else {
      // try standalone vowel
      let matched = false
      for (const [roman, , , , knSA, teSA, taSA] of VOWELS) {
        if (input.startsWith(roman, i)) {
          result += [knSA, teSA, taSA][idx]
          i += roman.length
          matched = true
          break
        }
      }
      if (!matched) {
        result += input[i]
        i++
      }
    }
  }

  return result
}

/** Derive transliteration language from a dialect code like 'kn-bengaluru' */
export function langFromDialect(dialectCode: string): TranslitLang {
  const prefix = dialectCode.split('-')[0]
  if (prefix === 'te') return 'te'
  if (prefix === 'ta') return 'ta'
  return 'kn'
}
