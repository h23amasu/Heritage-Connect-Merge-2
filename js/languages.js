/* ISO 639-1 – alla standardiserade tvåbokstavsspråkkoder (krav: världens språk). */
const ISO639_1_CODES = [
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce", "ch",
  "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee", "el",
  "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy",
  "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr", "ht",
  "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is", "it",
  "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn", "ko",
  "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln", "lo",
  "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt",
  "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny",
  "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu", "rm",
  "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk", "sl",
  "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta", "te",
  "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty",
  "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi", "yo",
  "za", "zh", "zu"
];

/** Vanliga språk visas först i listan. */
const POPULAR_LANGUAGE_CODES = [
  "sv", "en", "de", "fr", "es", "no", "da", "fi", "ar", "zh", "ru", "ja",
  "ko", "pt", "it", "nl", "pl", "hi", "tr", "uk", "vi", "th", "el", "he",
  "cs", "hu", "ro", "id", "ms", "bn", "fa", "ur", "sw", "ca", "hr", "sk",
  "sl", "bg", "sr", "lt", "lv", "et", "is", "ga", "mt", "sq", "mk", "hy",
  "ka", "az", "kk", "uz", "ta", "te", "mr", "gu", "kn", "ml", "pa", "ne",
  "si", "my", "km", "lo", "am", "ti", "so", "ha", "yo", "ig", "zu", "af",
  "eu", "gl", "cy", "lb", "eo", "la", "jv", "su", "mg", "ny", "sm"
];

const LANGUAGE_LABEL_OVERRIDES = {
  sv: "Svenska",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  no: "Norsk",
  nb: "Norsk bokmål",
  nn: "Nynorsk",
  da: "Dansk",
  fi: "Suomi",
  ar: "العربية",
  zh: "中文",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  el: "Ελληνικά",
  he: "עברית",
  hi: "हिन्दी",
  th: "ไทย",
  uk: "Українська",
  vi: "Tiếng Việt"
};

let languageDisplayNamesSv = null;

function getLanguageDisplayNames() {
  if (!languageDisplayNamesSv) {
    try {
      languageDisplayNamesSv = new Intl.DisplayNames(["sv"], { type: "language" });
    } catch (_) {
      languageDisplayNamesSv = null;
    }
  }
  return languageDisplayNamesSv;
}

function normalizeLanguageCode(raw) {
  if (!raw || !String(raw).trim()) return "sv";
  return String(raw).trim().toLowerCase().split("-")[0].slice(0, 2);
}

function isValidLanguageCode(code) {
  const normalized = normalizeLanguageCode(code);
  return ISO639_1_CODES.includes(normalized);
}

function getLanguageDisplayName(code, locale = "sv") {
  const target = normalizeLanguageCode(code);
  if (LANGUAGE_LABEL_OVERRIDES[target]) {
    return LANGUAGE_LABEL_OVERRIDES[target];
  }
  try {
    const dn = new Intl.DisplayNames([locale], { type: "language" });
    const label = dn.of(target);
    if (label && label.toLowerCase() !== target) {
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  } catch (_) {
    /* ignore */
  }
  return target.toUpperCase();
}

function formatLanguageOptionLabel(code) {
  const target = normalizeLanguageCode(code);
  const svName = getLanguageDisplayName(target, "sv");
  const native = LANGUAGE_LABEL_OVERRIDES[target] || getLanguageDisplayName(target, target);
  if (native && native.toLowerCase() !== svName.toLowerCase()) {
    return `${svName} (${target}) — ${native}`;
  }
  return `${svName} (${target})`;
}

function rebuildLanguageSelect(select, selectedCode = null) {
  if (!select) return;

  const popular = POPULAR_LANGUAGE_CODES.filter(code => ISO639_1_CODES.includes(code));
  const popularSet = new Set(popular);
  const rest = ISO639_1_CODES
    .filter(code => !popularSet.has(code))
    .sort((a, b) => getLanguageDisplayName(a, "sv").localeCompare(getLanguageDisplayName(b, "sv"), "sv"));

  select.innerHTML = "";

  const appendOption = (parent, code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = formatLanguageOptionLabel(code);
    parent.appendChild(option);
  };

  const popGroup = document.createElement("optgroup");
  popGroup.label = "Vanliga språk";
  popular.forEach(code => appendOption(popGroup, code));
  if (popGroup.children.length) select.appendChild(popGroup);

  const allGroup = document.createElement("optgroup");
  allGroup.label = `Alla språk (ISO 639-1, ${ISO639_1_CODES.length})`;
  rest.forEach(code => appendOption(allGroup, code));
  select.appendChild(allGroup);

  const normalizedSelected = selectedCode ? normalizeLanguageCode(selectedCode) : null;
  const ordered = [...popular, ...rest];
  if (normalizedSelected && ordered.includes(normalizedSelected)) {
    select.value = normalizedSelected;
  } else if (ordered.includes(normalizeLanguageCode(select.dataset.selectedLang || ""))) {
    select.value = normalizeLanguageCode(select.dataset.selectedLang);
  }
}

function ensureLanguageOption(select, code) {
  const target = normalizeLanguageCode(code);
  if (!select) return target;

  let option = Array.from(select.options).find(opt => opt.value === target);
  if (!option) {
    rebuildLanguageSelect(select, target);
    option = Array.from(select.options).find(opt => opt.value === target);
    if (!option) {
      option = document.createElement("option");
      option.value = target;
      option.textContent = formatLanguageOptionLabel(target);
      select.appendChild(option);
    }
  }
  select.value = target;
  select.dataset.selectedLang = target;
  return target;
}
