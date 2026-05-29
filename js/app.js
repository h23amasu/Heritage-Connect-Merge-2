/* ==============================
   Heritage Connect – frontend-prototyp
   API-förberedd version
   ============================== */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
/** Tidigare standard-ngrok – migreras till localhost vid laddning */
const LEGACY_DEFAULT_API_BASE_URL = "https://fling-sneer-margarita.ngrok-free.dev";
const API_BASE_STORAGE_KEY = "heritage_connect_api_base_url";
const API_TOKEN = "hemlig-nyckel";

/**
 * Tidningens språk läses från HTML-elementets lang-attribut (t.ex. <html lang="sv">).
 * Ladda om sidan efter att du ändrat lang i index.html.
 */
function getNewspaperLang() {
  return (document.documentElement.lang || "sv").slice(0, 2).toLowerCase();
}

const NEWSPAPER_LANG = getNewspaperLang();

const READER_LANG_LABELS = {
  sv: "Svenska",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  no: "Norsk",
  da: "Dansk",
  ru: "Русский",
  ar: "العربية",
  zh: "中文",
  fi: "Suomi",
  pt: "Português",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  ja: "日本語",
  ko: "한국어"
};

/** Förifyllda tidningstexter (valfri cache när översättnings-API inte nås). */
const NEWSPAPER_I18N = {
  en: {
    "Digital upplaga": "Digital edition",
    "DAGSPRESS NYHETER": "DAGSPRESS NEWS",
    "12°C, klart väder": "12°C, clear weather",
    "Nyheter": "News",
    "Kultur": "Culture",
    "Resor": "Travel",
    "Opinion": "Opinion",
    "Lokalt": "Local",
    "Ekonomi": "Economy",
    "Resandet ökar inför sommaren": "Travel is increasing ahead of summer",
    "Flygplatser och tågstationer rapporterar rekordmånga bokningar. Experter tror på en stark sommar för turistnäringen i Norden.":
      "Airports and train stations report record numbers of bookings. Experts expect a strong summer for tourism in the Nordics.",
    "Nya siffror visar att antalet bokade resor har ökat jämfört med samma period förra året. Flygbolagen rapporterar fullbokade avgångar redan i juni.":
      "New figures show that booked trips have increased compared with the same period last year. Airlines already report fully booked departures in June.",
    "Semesterperioden väntas bli intensiv, särskilt för resenärer som kombinerar natur, kultur och kortare helgresor i Skandinavien.":
      "The holiday season is expected to be busy, especially for travellers combining nature, culture and short weekend trips in Scandinavia.",
    "Researrangörer märker ett växande intresse för platser med historiskt djup – sevärdheter som berättar en historia utöver det vanliga.":
      "Tour operators are seeing growing interest in places with historical depth – sights that tell a story beyond the ordinary.",
    "Flera regioner rapporterar samtidigt ett växande intresse för lokala kulturmiljöer. Många vill hitta information snabbt, direkt i mobilen.":
      "Several regions are reporting growing interest in local cultural environments. Many want to find information quickly, directly on their phone.",
    "Annons": "Advertisement",
    "Världsarv nära dig": "World heritage near you",
    "📍 Tillåt plats för bättre träff": "📍 Allow location for a better match",
    "Läs mer & prenumerera →": "Read more & subscribe →",
    "Resebyråerna noterar även ökat intresse för upplevelser där historiska platser och lokala sevärdheter blir en del av resan.":
      "Travel agencies are also noting increased interest in experiences where historic sites and local attractions become part of the trip.",
    "Senaste nytt": "Latest news",
    "Nya tåglinjer väntas underlätta sommarens resande.": "New rail lines are expected to make summer travel easier.",
    "Flera museer förlänger öppettiderna inför högsäsongen.": "Several museums are extending opening hours ahead of the peak season.",
    "Guidade visningar lockar fler besökare till historiska miljöer.": "Guided tours are attracting more visitors to historic environments.",
    "Prenumerera och få SMS om världsarv nära dig": "Subscribe and get SMS about world heritage near you"
  },
  ar: {
    "Digital upplaga": "طبعة رقمية",
    "DAGSPRESS NYHETER": "أخبار داغسبرس",
    "12°C, klart väder": "12°م، طقس صافٍ",
    "Nyheter": "أخبار",
    "Kultur": "ثقافة",
    "Resor": "سفر",
    "Opinion": "رأي",
    "Lokalt": "محلي",
    "Ekonomi": "اقتصاد",
    "Resandet ökar inför sommaren": "يتزايد السفر قبل الصيف",
    "Flygplatser och tågstationer rapporterar rekordmånga bokningar. Experter tror på en stark sommar för turistnäringen i Norden.":
      "تُبلّغ المطارات ومحطات القطار عن أعداد قياسية من الحجوزات. يتوقع الخبراء صيفًا قويًا لقطاع السياحة في شمال أوروبا.",
    "Nya siffror visar att antalet bokade resor har ökat jämfört med samma period förra året. Flygbolagen rapporterar fullbokade avgångar redan i juni.":
      "تُظهر أرقام جديدة أن عدد الرحلات المحجوزة قد زاد مقارنة بنفس الفترة من العام الماضي. تُبلّغ شركات الطيران عن رحلات ممتلئة بالكامل في يونيو.",
    "Semesterperioden väntas bli intensiv, särskilt för resenärer som kombinerar natur, kultur och kortare helgresor i Skandinavien.":
      "من المتوقع أن تكون فترة العطلة مكثفة، خاصة للمسافرين الذين يجمعون بين الطبيعة والثقافة ورحلات نهاية الأسبوع القصيرة في Scandinavia.",
    "Researrangörer märker ett växande intresse för platser med historiskt djup – sevärdheter som berättar en historia utöver det vanliga.":
      "يلاحظ منظّمو الرحلات اهتمامًا متزايدًا بالأماكن ذات العمق التاريخي — معالم تروي قصة تتجاوز المعتاد.",
    "Flera regioner rapporterar samtidigt ett växande intresse för lokala kulturmiljöer. Många vill hitta information snabbt, direkt i mobilen.":
      "تُبلّغ عدة مناطق في الوقت نفسه عن اهتمام متزايد بالبيئات الثقافية المحلية. يريد كثيرون العثور على المعلومات بسرعة، مباشرة على الهاتف.",
    "Annons": "إعلان",
    "Världsarv nära dig": "تراث عالمي قريب منك",
    "📍 Tillåt plats för bättre träff": "📍 اسمح بالموقع للحصول على نتيجة أفضل",
    "Läs mer & prenumerera →": "اقرأ المزيد واشترك ←",
    "Resebyråerna noterar även ökat intresse för upplevelser där historiska platser och lokala sevärdheter blir en del av resan.":
      "تلاحظ وكالات السفر أيضًا اهتمامًا متزايدًا بتجارب حيث تصبح الأماكن التاريخية والمعالم المحلية جزءًا من الرحلة.",
    "Senaste nytt": "آخر الأخبار",
    "Nya tåglinjer väntas underlätta sommarens resande.": "من المتوقع أن تُسهّل خطوط القطار الجديدة السفر في الصيف.",
    "Flera museer förlänger öppettiderna inför högsäsongen.": "يُمدّد عدة متاحف ساعات العمل قبل موسم الذروة.",
    "Guidade visningar lockar fler besökare till historiska miljöer.": "الجولات الإرشادية تجذب المزيد من الزوار إلى البيئات التاريخية.",
    "Prenumerera och få SMS om världsarv nära dig": "اشترك واحصل على رسائل SMS عن التراث العالمي القريب منك"
  },
  fi: {
    "Digital upplaga": "Digitaalinen painos",
    "DAGSPRESS NYHETER": "DAGSPRESS UUTISET",
    "12°C, klart väder": "12°C, selkeä sää",
    "Nyheter": "Uutiset",
    "Kultur": "Kulttuuri",
    "Resor": "Matkailu",
    "Opinion": "Mielipide",
    "Lokalt": "Paikalliset",
    "Ekonomi": "Talous",
    "Resandet ökar inför sommaren": "Matkailu lisääntyy ennen kesää",
    "Flygplatser och tågstationer rapporterar rekordmånga bokningar. Experter tror på en stark sommar för turistnäringen i Norden.":
      "Lentokentät ja rautatieasemat raportoivat ennätysmäärän varauksia. Asiantuntijat uskovat vahvaan kesään pohjoismaisella matkailualalla.",
    "Nya siffror visar att antalet bokade resor har ökat jämfört med samma period förra året. Flygbolagen rapporterar fullbokade avgångar redan i juni.":
      "Uudet luvut osoittavat, että varattujen matkojen määrä on kasvanut verrattuna samaan aikaan viime vuonna. Lentoyhtiöt raportoivat täyteen varatuista lähdöistä jo kesäkuussa.",
    "Semesterperioden väntas bli intensiv, särskilt för resenärer som kombinerar natur, kultur och kortare helgresor i Skandinavien.":
      "Loma-aikaa odotetaan kiireiseksi, erityisesti matkailijoille, jotka yhdistävät luonnon, kulttuurin ja lyhyitä viikonloppumatkoja Skandinaviassa.",
    "Researrangörer märker ett växande intresse för platser med historiskt djup – sevärdheter som berättar en historia utöver det vanliga.":
      "Matkanjärjestäjät huomaavat kasvavaa kiinnostusta historiallisesti merkittäviin paikkoihin – nähtävyyksiin, jotka kertovat tarinan tavallista enemmän.",
    "Flera regioner rapporterar samtidigt ett växande intresse för lokala kulturmiljöer. Många vill hitta information snabbt, direkt i mobilen.":
      "Useat alueet raportoivat samanaikaisesti kasvavaa kiinnostusta paikallisiin kulttuuriympäristöihin. Monet haluavat löytää tietoa nopeasti suoraan puhelimesta.",
    "Annons": "Mainos",
    "Världsarv nära dig": "Maailmanperintö lähelläsi",
    "📍 Tillåt plats för bättre träff": "📍 Salli sijainti paremman tuloksen saamiseksi",
    "Läs mer & prenumerera →": "Lue lisää ja tilaa →",
    "Resebyråerna noterar även ökat intresse för upplevelser där historiska platser och lokala sevärdheter blir en del av resan.":
      "Matkatoimistot huomaavat myös kasvavaa kiinnostusta kokemuksiin, joissa historialliset paikat ja paikalliset nähtävyydet ovat osa matkaa.",
    "Senaste nytt": "Viimeisimmät uutiset",
    "Nya tåglinjer väntas underlätta sommarens resande.": "Uudet junalinjat helpottavat kesän matkustamista.",
    "Flera museer förlänger öppettiderna inför högsäsongen.": "Useat museot pidentävät aukioloaikojaan ennen sesonkia.",
    "Guidade visningar lockar fler besökare till historiska miljöer.": "Opastetut kierrokset houkuttelevat lisää vierailijoita historiallisiin ympäristöihin.",
    "Prenumerera och få SMS om världsarv nära dig": "Tilaa ja saa SMS-viestejä läheisestä maailmanperinnöstä"
  }
};

function getI18nDictionary(lang) {
  const target = (lang || "sv").toLowerCase().slice(0, 2);
  return NEWSPAPER_I18N[target] || {};
}

const I18N_SV = {
  LOADING_SITE: "Hämtar världsarv…",
  LOADING_CLOSEST: "Hämtar närmaste världsarv…",
  LOADING_DISTANCE: "Hämtar avstånd…",
  LOADING_POSITION: "Hämtar din position…",
  UNKNOWN_SITE: "Okänt världsarv",
  DISTANCE_UNKNOWN: "Avstånd okänt",
  GPS_UNSUPPORTED: "GPS stöds inte – visar närmaste i Sverige.",
  GPS_DENIED: "Plats nekad – visar närmaste världsarv i Sverige.",
  GPS_FAILED: "Kunde inte hämta plats – visar närmaste i Sverige.",
  PREF_ACTIVE: "Markera som besökt, inga fler SMS om detta världsarv",
  PREF_INACTIVE: "Detta världsarv kan visas i SMS igen",
  MOBILE: "Mobilnummer",
  EMAIL: "E-postadress",
  CONFIRM_CHANNEL: "En bekräftelse skickas till vald notiskanal.",
  ACTIVE_SMS: "Aktiv kanal: SMS-notiser",
  ACTIVE_EMAIL: "Aktiv kanal: E-postnotiser",
  BANKID_WAIT: "Väntar på BankID…",
  BANKID_BTN: "🏦 Logga in med BankID (Sverige)",
  SEND_CODE: "Skicka SMS-kod",
  VERIFYING: "Verifierar…",
  LOGIN: "Logga in",
  PAYING: "Betalar…",
  AI_LOADING: "Hämtar svar…",
  AI_ERROR: "Kunde inte hämta svar.",
  AI_EMPTY: "Inget svar.",
  AI_OFFLINE: "API:t är inte igång – demo-läge."
};

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);
const UNESCO_DESC_LANGS = new Set(["en", "fr", "es", "ru", "ar", "zh"]);

function getUnescoDescription(site, lang) {
  const key = `desc_${lang}`;
  const text = site?.[key];
  return text && String(text).trim() ? String(text).trim() : null;
}

function getUnescoSiteName(site, lang) {
  const key = `name_${lang}`;
  const text = site?.[key];
  if (text && String(text).trim()) {
    return String(text).trim();
  }
  if (lang === "en") {
    return site?.name || "";
  }
  return null;
}

/**
 * Beskrivning: UNESCO först (desc_xx), Google Translate backup från engelska.
 */
async function resolveSiteDescription(site, targetLang = getNewspaperLang()) {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);

  const unescoText = getUnescoDescription(site, target);
  if (unescoText) {
    return unescoText;
  }

  const svText = getUnescoDescription(site, "sv");
  const englishText = getUnescoDescription(site, "en") || site?.description || "";
  const sourceText = svText || englishText;
  const sourceLang = svText ? "sv" : "en";

  if (!sourceText) {
    return "";
  }

  if (target === sourceLang) {
    return sourceText;
  }

  return translateViaApi(sourceText, target, sourceLang);
}

/**
 * Rubrik: UNESCO-officiellt namn (fältet name + name_xx), översatt från engelska vid behov.
 */
async function resolveSiteName(site, targetLang = getNewspaperLang()) {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);

  const localizedName = getUnescoSiteName(site, target);
  if (localizedName) {
    return localizedName;
  }

  const officialEnglish = (site?.name || "").trim();
  if (!officialEnglish) {
    return "";
  }

  if (target === "en") {
    return officialEnglish;
  }

  return translateViaApi(officialEnglish, target, "en");
}

let lastClosestSite = null;

const translateCache = new Map();
/** Svenska källtexter per element – ändras aldrig efter första registreringen. */
const i18nSourceRegistry = new WeakMap();
let backendTranslateAvailable = true;

function registerI18nSource(el, sourceText) {
  if (!el || el.dataset.i18nDynamic === "true") return;
  const text = (sourceText || "").trim();
  if (!text) return;
  if (!i18nSourceRegistry.has(el)) {
    i18nSourceRegistry.set(el, text);
  }
  el.dataset.i18nSource = i18nSourceRegistry.get(el);
}

function getI18nSource(el) {
  return i18nSourceRegistry.get(el) || el?.dataset?.i18nSource || el?.textContent?.trim() || "";
}

function captureI18nSources() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    if (el.dataset.i18nDynamic === "true") return;
    if (i18nSourceRegistry.has(el)) {
      el.dataset.i18nSource = i18nSourceRegistry.get(el);
      return;
    }
    registerI18nSource(el, el.textContent);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const source = el.getAttribute("data-i18n-placeholder") || el.getAttribute("placeholder") || "";
    if (!el.dataset.i18nPlaceholderSource) {
      el.dataset.i18nPlaceholderSource = source;
    }
  });
}

function normalizeApiBaseUrl(raw) {
  if (!raw || !String(raw).trim()) {
    return DEFAULT_API_BASE_URL;
  }

  let url = String(raw).trim().replace(/\/+$/, "");
  url = url.replace(/\/docs\/?$/i, "");

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  return url;
}

function isStaleApiBaseUrl(url) {
  const normalized = normalizeApiBaseUrl(url);
  return (
    normalized === LEGACY_DEFAULT_API_BASE_URL ||
    normalized === normalizeApiBaseUrl(LEGACY_DEFAULT_API_BASE_URL)
  );
}

function persistApiBaseUrl(url) {
  API_BASE_URL = normalizeApiBaseUrl(url);
  API_ENDPOINTS = buildApiEndpoints(API_BASE_URL);
  try {
    localStorage.setItem(API_BASE_STORAGE_KEY, API_BASE_URL);
  } catch (_) {
    /* ignore */
  }
}

function resolveDefaultApiBaseUrl() {
  if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return window.location.origin;
    }
  }
  return DEFAULT_API_BASE_URL;
}

function loadApiBaseUrl() {
  try {
    const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeApiBaseUrl(stored);
      if (isStaleApiBaseUrl(normalized)) {
        try {
          localStorage.setItem(API_BASE_STORAGE_KEY, resolveDefaultApiBaseUrl());
        } catch (_) {
          /* ignore */
        }
        return resolveDefaultApiBaseUrl();
      }
      return normalized;
    }
  } catch (_) {
    /* localStorage otillgängligt */
  }

  return resolveDefaultApiBaseUrl();
}

function buildApiEndpoints(baseUrl) {
  const base = normalizeApiBaseUrl(baseUrl);

  return {
    root: `${base}/`,
    notificationSend: `${base}/notification/send-notification`,
    createSubscription: `${base}/api/subscription/create`,
    loginRequestCode: `${base}/api/auth/request-code`,
    loginVerifyCode: `${base}/api/auth/verify-code`,
    loginRequestEmailCode: `${base}/api/auth/request-email-code`,
    loginVerifyEmailCode: `${base}/api/auth/verify-email-code`,
    bankidStart: `${base}/api/auth/bankid/start`,
    bankidComplete: `${base}/api/auth/bankid/complete`,
    updatePreferences: `${base}/api/user/preferences`,
    cancelSubscription: `${base}/api/subscription/cancel`,
    locationUpdate: `${base}/api/location/update`,
    paymentConfig: `${base}/api/payments/config`,
    translate: `${base}/api/translate`,
    translateBatch: `${base}/api/translate/batch`,
    aiAsk: `${base}/api/ai/ask`,
  };
}

const DEFAULT_GEO = { latitude: 62.0, longitude: 15.0 }; // Centrum Sverige

let LOCAL_HERITAGE_SITES = [];

async function loadHeritageSites() {
  try {
    const response = await fetch("data/heritage-sites.json");
    LOCAL_HERITAGE_SITES = await response.json();
    console.info(`UNESCO-databas laddad: ${LOCAL_HERITAGE_SITES.length} platser.`);
  } catch (err) {
    console.warn("Kunde inte ladda UNESCO-databasen.", err);
    LOCAL_HERITAGE_SITES = [
      { name: "Stonehenge", country: "England", latitude: 51.1789, longitude: -1.8262 },
      { name: "Colosseum",  country: "Italien", latitude: 41.8902, longitude: 12.4922 }
    ];
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Officiell UNESCO-bild per världsarv (whc.unesco.org). */
function unescoSiteImageUrl(unescoId) {
  if (!unescoId) return null;
  return `https://whc.unesco.org/uploads/sites/site_${unescoId}.jpg`;
}

let applySiteUiSeq = 0;
let refreshGeoPending = false;
let refreshGeoRunning = false;

function isStaleUiApply(seq) {
  return seq !== applySiteUiSeq;
}

function resolveSiteImageUrl(site) {
  if (!site) return null;
  const id = site.unesco_id || site.id;
  if (id) return unescoSiteImageUrl(id);
  const url = site.image_url || "";
  return url.includes("/uploads/sites/site_") ? url : null;
}

function urlsMatch(a, b) {
  if (!a || !b) return false;
  try {
    return new URL(a, window.location.href).href === new URL(b, window.location.href).href;
  } catch {
    return a === b;
  }
}

function setSiteImage(imgEl, fallbackEl, url, alt, siteId) {
  if (!imgEl) return;

  const nextSiteId = siteId != null ? String(siteId) : "";
  const signature = `${nextSiteId}|${url || ""}`;

  const showFallback = () => {
    if (fallbackEl) fallbackEl.classList.remove("is-hidden");
  };
  const hideFallback = () => {
    if (fallbackEl) fallbackEl.classList.add("is-hidden");
  };

  if (!url) {
    imgEl.removeAttribute("src");
    imgEl.classList.remove("is-ready");
    delete imgEl.dataset.imageSignature;
    delete imgEl.dataset.loading;
    delete imgEl.dataset.siteId;
    showFallback();
    return;
  }

  imgEl.alt = alt || "";

  if (
    imgEl.dataset.imageSignature === signature &&
    imgEl.classList.contains("is-ready") &&
    imgEl.complete &&
    imgEl.naturalWidth > 0
  ) {
    hideFallback();
    return;
  }

  if (imgEl.dataset.imageSignature === signature && imgEl.dataset.loading === "true") {
    return;
  }

  imgEl.dataset.imageSignature = signature;
  const keepPrevious = imgEl.classList.contains("is-ready") && imgEl.dataset.siteId === nextSiteId;
  if (!keepPrevious) showFallback();

  imgEl.dataset.loading = "true";
  imgEl.classList.remove("is-ready");

  const finishOk = () => {
    imgEl.dataset.siteId = nextSiteId;
    imgEl.dataset.loading = "false";
    imgEl.classList.add("is-ready");
    hideFallback();
    imgEl.onload = null;
    imgEl.onerror = null;
  };

  const finishErr = () => {
    imgEl.dataset.loading = "false";
    imgEl.classList.remove("is-ready");
    imgEl.removeAttribute("src");
    showFallback();
    imgEl.onload = null;
    imgEl.onerror = null;
  };

  if (urlsMatch(imgEl.src, url) && imgEl.complete) {
    if (imgEl.naturalWidth > 0) {
      finishOk();
    } else {
      finishErr();
    }
    return;
  }

  imgEl.onload = finishOk;
  imgEl.onerror = finishErr;
  imgEl.src = url;
}

function findClosestSiteLocal(lat, lng) {
  console.log("🗺 Söker närmaste från:", lat, lng, "| Antal platser:", LOCAL_HERITAGE_SITES.length);
  let closest = null;
  let minDist = Infinity;
  for (const site of LOCAL_HERITAGE_SITES) {
    const d = haversineKm(lat, lng, site.latitude, site.longitude);
    if (d < minDist) { minDist = d; closest = site; }
  }
  if (!closest) return null;
  console.log("Närmaste:", closest.name, `(id ${closest.unesco_id}, ${(minDist).toFixed(1)} km)`);
  const descriptions = Object.fromEntries(
    Object.entries(closest).filter(([key]) => key.startsWith("desc_"))
  );
  const names = Object.fromEntries(
    Object.entries(closest).filter(([key]) => key.startsWith("name_"))
  );
  return {
    name: closest.name,
    country: closest.country,
    image_url: resolveSiteImageUrl(closest),
    description: closest.description || null,
    ...descriptions,
    ...names,
    distance_m: Math.round(minDist * 1000),
    unesco_id: closest.unesco_id || null,
    year_inscribed: closest.year_inscribed || null,
  };
}

const geoState = {
  latitude: DEFAULT_GEO.latitude,
  longitude: DEFAULT_GEO.longitude,
  source: "default"
};

let API_BASE_URL = loadApiBaseUrl();
let API_ENDPOINTS = buildApiEndpoints(API_BASE_URL);

/**
 * Prenumerationspris i SEK. Sätts automatiskt från config.json vid sidladdning.
 * Ändra priset i config.json – rör inte den här raden.
 */
let SUBSCRIPTION_PRICE_SEK = 99;
let PAYMENT_CONFIG = {
  provider: "mock",
  stripe_enabled: false,
  stripe_sandbox: false,
  stripe_publishable_key: null,
};

let locationReportTimer = null;
let geoWatchId = null;

/**
 * Läser config.json och uppdaterar priset i UI:t.
 * config.json ska ligga i samma mapp som index.html.
 */
async function loadConfig() {
  try {
    const response = await fetch("config.json");
    if (!response.ok) return;
    const config = await response.json();
    if (typeof config.subscriptionPriceSEK === "number" && config.subscriptionPriceSEK > 0) {
      SUBSCRIPTION_PRICE_SEK = config.subscriptionPriceSEK;
    }
    if (Array.isArray(config.subscriptionPlans) && config.subscriptionPlans.length > 0) {
      const row = document.getElementById("durationChoiceRow");
      if (row) {
        row.innerHTML = config.subscriptionPlans.map((plan, i) => `
          <div class="choice${i === 0 ? " selected" : ""}" data-days="${plan.days}" data-price="${plan.priceSEK}" onclick="selectDuration(this)">
            <span data-i18n>${plan.label}</span><br><span class="duration-price">${plan.priceSEK} SEK</span>
          </div>`).join("");
      }
      SUBSCRIPTION_PRICE_SEK = config.subscriptionPlans[0].priceSEK;
      prototypeState.duration_days = config.subscriptionPlans[0].days;
      captureI18nSources();
    }
    await updatePriceSummaryBox();
  } catch (_) {
    /* config.json saknas eller är ogiltig – standardvärden används */
    await updatePriceSummaryBox();
  }

  await loadPaymentConfig();
}

async function loadPaymentConfig() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(API_ENDPOINTS.paymentConfig, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return;
    const data = await response.json();
    if (data && data.success !== false) {
      PAYMENT_CONFIG = data;
      prototypeState.payment_provider = data.stripe_enabled ? "stripe" : "mock";
    }
    await updatePaymentProviderUi();
  } catch (_) {
    clearTimeout(timeoutId);
    /* API offline – mock-betalning i UI */
  }
}

async function updatePriceSummaryBox() {
  const priceBox = document.getElementById("priceSummaryBox");
  if (!priceBox) return;
  const months = Math.round(prototypeState.duration_days / 30);
  const period = months === 1 ? "1 månad" : `${months} månader`;
  const svText = `Pris: ${SUBSCRIPTION_PRICE_SEK} SEK – ${period} (ingen auto-förnyelse, SMS-påminnelse 3 dagar innan utgång)`;
  await setElementI18n(priceBox, svText);
}

function apiRequestHeaders() {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1"
  };
}

function updateApiStatusLabel(message) {
  const status = document.getElementById("apiStatus");
  if (status) {
    status.textContent = message;
  }
}

function saveApiBaseUrlFromInput() {
  const input = document.getElementById("apiBaseUrlInput");
  if (!input) return;

  persistApiBaseUrl(input.value);
  input.value = API_BASE_URL;
  updateApiStatusLabel(`Aktiv API: ${API_BASE_URL}`);
  toast("API-adress sparad");
  refreshGeoFromApi();
}

async function readApiError(response, data) {
  if (data?.error) {
    return String(data.error);
  }
  if (data?.detail) {
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail.map(item => item.msg || JSON.stringify(item)).join(", ");
    }
  }
  return `HTTP ${response.status}`;
}

async function probeApiConnection() {
  const response = await fetch(API_ENDPOINTS.root, {
    method: "GET",
    headers: apiRequestHeaders()
  });

  if (!response.ok) {
    throw new Error(`status_${response.status}`);
  }

  return response.json();
}

async function ensureApiConnection({ silent = false, refreshGeo = false } = {}) {
  if (!silent) {
    updateApiStatusLabel("Testar anslutning…");
  }

  try {
    const data = await probeApiConnection();
    const name = data.app || "API";
    updateApiStatusLabel(`OK – ${name} · ${API_BASE_URL}`);
    if (!silent) {
      toast(`${name} svarar`);
    }
    if (refreshGeo) refreshGeoFromApi();
    return true;
  } catch (error) {
    console.warn("API-test misslyckades:", error);

    if (API_BASE_URL !== DEFAULT_API_BASE_URL) {
      persistApiBaseUrl(DEFAULT_API_BASE_URL);
      const input = document.getElementById("apiBaseUrlInput");
      if (input) {
        input.value = API_BASE_URL;
      }

      try {
        const data = await probeApiConnection();
        const name = data.app || "API";
        updateApiStatusLabel(`OK – ${name} · ${API_BASE_URL} (bytte från otillgänglig adress)`);
        if (!silent) {
          toast("Bytte till localhost – API svarar");
        }
        if (refreshGeo) refreshGeoFromApi();
        return true;
      } catch (retryError) {
        console.warn("API-fallback misslyckades:", retryError);
      }
    }

    updateApiStatusLabel(`Kunde inte nå API – starta: uvicorn app.main:app --port 8000`);
    if (!silent) {
      toast("Kunde inte nå API – starta uvicorn på port 8000");
    }
    return false;
  }
}

async function testApiConnection() {
  await ensureApiConnection({ silent: false, refreshGeo: true });
}

function initApiSettings() {
  const input = document.getElementById("apiBaseUrlInput");
  const saveBtn = document.getElementById("apiBaseUrlSave");
  const testBtn = document.getElementById("apiBaseUrlTest");

  if (input) {
    input.value = API_BASE_URL;
  }

  updateApiStatusLabel(`Aktiv API: ${API_BASE_URL}`);

  saveBtn?.addEventListener("click", saveApiBaseUrlFromInput);
  testBtn?.addEventListener("click", testApiConnection);

  input?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveApiBaseUrlFromInput();
    }
  });

  ensureApiConnection({ silent: true, refreshGeo: false });
}

const currentSite = {
  site_id: null,
  api_site_id: null,
  name: "",
  distance_km: null,
  country: "",
  language: NEWSPAPER_LANG
};

function formatDistanceKm(distanceM) {
  if (distanceM == null || Number.isNaN(distanceM)) {
    return null;
  }
  const km = distanceM / 1000;
  if (km < 1) {
    return `${Math.round(distanceM)} m`;
  }
  const rounded = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return rounded;
}

function buildDistanceAdText(kmValue) {
  if (kmValue == null) {
    return "Avstånd okänt";
  }
  if (typeof kmValue === "string" && kmValue.endsWith(" m")) {
    return `${kmValue} bort`;
  }
  return `Ca ${kmValue} km bort`;
}

function buildDistanceDetailText(kmValue) {
  if (kmValue == null) {
    return "Avstånd från din position kunde inte beräknas";
  }
  if (typeof kmValue === "string" && kmValue.endsWith(" m")) {
    return `${kmValue} från din position`;
  }
  return `Ca ${kmValue} km från din position`;
}

function updateDistanceLabels() {
  const kmValue = currentSite.distance_km;
  const adText = buildDistanceAdText(kmValue);
  const detailText = buildDistanceDetailText(kmValue);

  const adPill = document.getElementById("heritageDistancePill");
  const detailDist = document.getElementById("siteDetailDistance");

  if (adPill) {
    adPill.textContent = adText;
    adPill.dataset.i18nSource = adText;
  }
  if (detailDist) {
    detailDist.textContent = detailText;
    detailDist.dataset.i18nSource = detailText;
  }
}

async function translateDistanceLabels(targetLang) {
  const adPill = document.getElementById("heritageDistancePill");
  const detailDist = document.getElementById("siteDetailDistance");

  if (adPill?.dataset.i18nSource) {
    adPill.textContent = await translateViaApi(adPill.dataset.i18nSource, targetLang);
  }
  if (detailDist?.dataset.i18nSource) {
    detailDist.textContent = await translateViaApi(detailDist.dataset.i18nSource, targetLang);
  }
}

async function refreshClosestSiteTextOnly(site, lang) {
  if (!site) return;

  const target = (lang || getNewspaperLang()).toLowerCase().slice(0, 2);
  currentSite.name = await resolveSiteName(site, target);
  const displayDesc = await resolveSiteDescription(site, target);

  const adName = document.getElementById("adSiteName");
  if (adName) {
    adName.textContent = currentSite.name || "";
    if (currentSite.name) {
      adName.dataset.i18nDynamic = "true";
    } else {
      delete adName.dataset.i18nDynamic;
    }
  }

  const adTeaser = document.getElementById("adTeaser");
  if (adTeaser) {
    adTeaser.textContent = displayDesc ? `${displayDesc.slice(0, 180).trimEnd()}…` : "";
    adTeaser.dataset.i18nDynamic = displayDesc ? "true" : "";
  }

  const title = document.getElementById("siteDetailTitle");
  if (title && currentSite.name) {
    title.textContent = currentSite.name;
    title.dataset.i18nDynamic = "true";
  }

  const desc = document.getElementById("siteDetailDescription");
  if (desc) {
    desc.textContent = displayDesc || "";
    desc.dataset.i18nDynamic = displayDesc ? "true" : "";
  }

  if (target === "sv") {
    updateDistanceLabels();
  } else {
    await translateDistanceLabels(target);
  }
}

async function applyClosestSiteToUi(site) {
  if (!site) return;

  const seq = ++applySiteUiSeq;

  const distanceM = site.distance_m != null ? Number(site.distance_m) : null;
  const kmFormatted = formatDistanceKm(distanceM);

  const siteName = await resolveSiteName(site);
  if (isStaleUiApply(seq)) return;

  const displayDesc = await resolveSiteDescription(site);
  if (isStaleUiApply(seq)) return;

  const siteImageId = site.unesco_id || site.id;
  const siteKey = String(siteImageId || "");
  const adImg = document.getElementById("adSiteImage");
  const adImgPlaceholder = document.getElementById("adImagePlaceholder");
  const detailImg = document.getElementById("siteDetailImage");
  const detailFallback = document.getElementById("siteDetailFallback");
  const imagesStable =
    siteKey &&
    adImg?.dataset.siteId === siteKey &&
    adImg.classList.contains("is-ready");

  if (!imagesStable) {
    const photoUrl = unescoSiteImageUrl(siteImageId) || resolveSiteImageUrl(site);
    if (isStaleUiApply(seq)) return;
    setSiteImage(adImg, adImgPlaceholder, photoUrl, siteName, siteImageId);
    setSiteImage(detailImg, detailFallback, photoUrl, siteName, siteImageId);
  }

  if (isStaleUiApply(seq)) return;

  lastClosestSite = site;
  currentSite.api_site_id = site.id ?? currentSite.api_site_id;
  currentSite.distance_km = kmFormatted;
  if (site.country) currentSite.country = site.country;
  if (site.unesco_id) currentSite.site_id = String(site.unesco_id);
  currentSite.name = siteName;

  const adName = document.getElementById("adSiteName");
  if (adName) {
    adName.textContent = siteName || "";
    if (siteName) {
      adName.dataset.i18nDynamic = "true";
    } else {
      delete adName.dataset.i18nDynamic;
      await setElementI18n(adName, I18N_SV.LOADING_CLOSEST);
      if (isStaleUiApply(seq)) return;
    }
  }

  const adTeaser = document.getElementById("adTeaser");
  if (adTeaser) {
    adTeaser.textContent = displayDesc ? `${displayDesc.slice(0, 180).trimEnd()}…` : "";
    adTeaser.dataset.i18nDynamic = displayDesc ? "true" : "";
  }

  const title = document.getElementById("siteDetailTitle");
  if (title) {
    if (siteName) {
      title.textContent = siteName;
      title.dataset.i18nDynamic = "true";
    } else {
      delete title.dataset.i18nDynamic;
      await setElementI18n(title, I18N_SV.LOADING_SITE);
      if (isStaleUiApply(seq)) return;
    }
  }

  const meta = document.getElementById("siteDetailMeta");
  if (meta) {
    const parts = [currentSite.country, site.year_inscribed].filter(Boolean);
    meta.textContent = parts.join(", ");
  }

  const desc = document.getElementById("siteDetailDescription");
  if (desc) {
    desc.textContent = displayDesc || "";
    desc.dataset.i18nDynamic = displayDesc ? "true" : "";
  }

  updateDistanceLabels();
  const lang = getNewspaperLang();
  if (lang !== "sv") {
    await translateDistanceLabels(lang);
  }
}

async function refreshGeoFromApi() {
  refreshGeoPending = true;
  if (refreshGeoRunning) return;
  refreshGeoRunning = true;
  while (refreshGeoPending) {
    refreshGeoPending = false;
    await refreshGeoFromApiOnce();
  }
  refreshGeoRunning = false;
}

async function refreshGeoFromApiOnce() {
  const adPill = document.getElementById("heritageDistancePill");
  if (adPill && !lastClosestSite) {
    await setElementI18n(adPill, I18N_SV.LOADING_DISTANCE);
  }

  const lat = geoState.latitude;
  const lng = geoState.longitude;
  const site = findClosestSiteLocal(lat, lng);
  if (site) await applyClosestSiteToUi(site);
}

function setGeoCoords(lat, lng, source) {
  geoState.latitude = lat;
  geoState.longitude = lng;
  geoState.source = source;
}

function syncDemoPositionSelect(lat, lng) {
  const value = `${lat},${lng}`;
  let matched = "";
  document.querySelectorAll("#testPositionSelectDemo option").forEach(opt => {
    if (opt.value === value) matched = value;
  });
  const select = document.getElementById("testPositionSelect");
  const selectDemo = document.getElementById("testPositionSelectDemo");
  if (select) select.value = matched;
  if (selectDemo) selectDemo.value = matched;
}

function applyTestPosition(value) {
  const select = document.getElementById("testPositionSelect");
  const selectDemo = document.getElementById("testPositionSelectDemo");
  if (select) select.value = value || "";
  if (selectDemo) selectDemo.value = value || "";

  if (!value) {
    stopGeoWatch();
    startGeoWatch();
    return;
  }
  stopGeoWatch();
  const [lat, lng] = value.split(",").map(Number);
  setGeoCoords(lat, lng, "test");
  refreshGeoFromApi();
}

function readUrlPosition() {
  const params = new URLSearchParams(window.location.search);
  const lat = parseFloat(params.get("lat"));
  const lon = parseFloat(params.get("lon"));
  if (!isNaN(lat) && !isNaN(lon)) return { latitude: lat, longitude: lon };
  return null;
}

function readUrlSiteRef() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("site") || "").trim();
}

async function applySiteFromRef(siteRef) {
  if (!siteRef) return;

  const local = LOCAL_HERITAGE_SITES.find(
    site => String(site.unesco_id) === siteRef || String(site.id) === siteRef
  );

  if (local) {
    const distM = haversineKm(
      geoState.latitude,
      geoState.longitude,
      local.latitude,
      local.longitude
    ) * 1000;
    await applyClosestSiteToUi({
      name: local.name,
      country: local.country,
      unesco_id: local.unesco_id,
      year_inscribed: local.year_inscribed,
      distance_m: Math.round(distM),
      ...Object.fromEntries(Object.entries(local).filter(([key]) => key.startsWith("desc_"))),
    });
    return;
  }

  try {
    const lang = getNewspaperLang();
    const response = await fetch(
      `${API_BASE_URL}/api/sites/public/${encodeURIComponent(siteRef)}?lang=${lang}`
    );
    if (!response.ok) return;
    const site = await response.json();
    const distM = haversineKm(
      geoState.latitude,
      geoState.longitude,
      site.latitude,
      site.longitude
    ) * 1000;
    await applyClosestSiteToUi({ ...site, distance_m: Math.round(distM) });
  } catch (error) {
    console.warn("Kunde inte ladda plats från URL:", error);
  }
}

function stopGeoWatch() {
  if (geoWatchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
}

function onGeoPosition(pos) {
  if (geoState.source === "test" || geoState.source === "url") return;

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  if (
    geoState.source === "gps" &&
    Math.abs(geoState.latitude - lat) < 0.00005 &&
    Math.abs(geoState.longitude - lng) < 0.00005
  ) {
    return;
  }

  geoState.latitude = lat;
  geoState.longitude = lng;
  geoState.source = "gps";
  void refreshGeoFromApi();
}

function onGeoError(err) {
  if (geoState.source === "test" || geoState.source === "url" || geoState.source === "gps") return;
  console.warn("GPS otillgänglig, visar närmaste utifrån Sverige:", err?.code);
  geoState.latitude = DEFAULT_GEO.latitude;
  geoState.longitude = DEFAULT_GEO.longitude;
  geoState.source = "default";
  void refreshGeoFromApi();
}

/**
 * Startar automatisk GPS-uppdatering (ingen knapp – webbläsaren frågar vid behov).
 */
function startGeoWatch() {
  stopGeoWatch();
  setGeoCoords(DEFAULT_GEO.latitude, DEFAULT_GEO.longitude, "default");
  void refreshGeoFromApi();

  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(onGeoPosition, onGeoError, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  });

  geoWatchId = navigator.geolocation.watchPosition(onGeoPosition, onGeoError, {
    enableHighAccuracy: true,
    maximumAge: 60000,
    timeout: 30000,
  });
}

function initGeoPrototype() {
  startGeoWatch();
}

const prototypeState = {
  user_id: null,
  access_token: null,
  phone: "",
  email: "",
  channel: "sms",
  payment_provider: "stripe",
  subscription_active: false,
  visited_sites: [],
  last_subscription: null,
  duration_days: 30,
};

function resetDemoState() {
  stopLocationReporting();
  prototypeState.user_id = null;
  prototypeState.access_token = null;
  prototypeState.phone = "";
  prototypeState.email = "";
  prototypeState.channel = "sms";
  prototypeState.payment_provider = "stripe";
  prototypeState.subscription_active = false;
  prototypeState.visited_sites = [];
  prototypeState.duration_days = 30;

  const contactInput = document.getElementById("newPhone");
  if (contactInput) {
    contactInput.value = "+46";
    contactInput.type = "tel";
  }

  const loginPhone = document.getElementById("loginPhone");
  if (loginPhone) {
    loginPhone.value = "+46";
  }

  const otp = document.getElementById("otp");
  if (otp) {
    otp.value = "";
  }

  document.querySelectorAll("[data-choice-group]").forEach(group => {
    const choices = group.querySelectorAll(".choice");

    choices.forEach(choice => {
      choice.classList.remove("selected");
    });

    const firstChoice = choices[0];
    if (firstChoice) {
      firstChoice.classList.add("selected");
    }
  });

  updateContactField();
  setElementI18n(document.getElementById("confirmationMessage"), I18N_SV.CONFIRM_CHANNEL).catch(() => {});
  setElementI18n(document.getElementById("settingsChannelMessage"), I18N_SV.ACTIVE_SMS).catch(() => {});

  document.querySelectorAll(".preference-box").forEach(box => {
    setElementI18n(box, I18N_SV.PREF_ACTIVE).catch(() => {});
    box.style.background = "var(--danger-bg)";
    box.style.color = "var(--danger)";
    box.style.borderColor = "#e58c8c";
  });
}

function resolveI18nText(source, target) {
  if (target === "sv") {
    return source;
  }
  const offlineDict = getI18nDictionary(target);
  return offlineDict[source] || null;
}

async function translateUiText(text, targetLang, sourceLang = "sv") {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const source = (sourceLang || "sv").toLowerCase().slice(0, 2);
  if (!text?.trim() || target === source) {
    return text;
  }
  const offline = resolveI18nText(text, target);
  if (offline) {
    return offline;
  }
  return translateViaApi(text, target, source);
}

async function translateInParallel(items, worker, concurrency = 6) {
  const results = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );
  await Promise.all(workers);
  return results;
}

async function translateBatchMap(texts, targetLang, sourceLang = "sv") {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const source = (sourceLang || "sv").toLowerCase().slice(0, 2);
  const result = {};

  if (target === source) {
    for (const text of texts) {
      result[text] = text;
    }
    return result;
  }

  const pending = [];
  for (const text of texts) {
    if (!text?.trim()) {
      result[text] = text;
      continue;
    }
    const cacheKey = `${source}|${target}|${text}`;
    if (translateCache.has(cacheKey)) {
      result[text] = translateCache.get(cacheKey);
      continue;
    }
    const offline = resolveI18nText(text, target);
    if (offline) {
      translateCache.set(cacheKey, offline);
      result[text] = offline;
      continue;
    }
    pending.push(text);
  }

  if (pending.length === 0) {
    return result;
  }

  if (backendTranslateAvailable) {
    try {
      const response = await fetch(API_ENDPOINTS.translateBatch, {
        method: "POST",
        headers: apiRequestHeaders(),
        body: JSON.stringify({
          texts: pending,
          source_language: source,
          target_language: target
        })
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.translations)) {
        pending.forEach((text, idx) => {
          const translated = data.translations[idx] || text;
          translateCache.set(`${source}|${target}|${text}`, translated);
          result[text] = translated;
        });
        return result;
      }
      if (response.status === 404) {
        backendTranslateAvailable = false;
      }
    } catch (error) {
      console.warn("Batch-översättning misslyckades:", error);
    }
  }

  await translateInParallel(pending, async text => {
    const translated = await translateViaApi(text, target, source);
    result[text] = translated;
    return translated;
  });

  return result;
}

async function setElementI18n(element, svText, lang = getNewspaperLang()) {
  if (!element) return;
  registerI18nSource(element, svText);
  delete element.dataset.i18nDynamic;
  if (!element.hasAttribute("data-i18n")) {
    element.setAttribute("data-i18n", "");
  }
  element.textContent = lang === "sv" ? svText : await translateUiText(svText, lang, "sv");
}

async function translateViaMyMemory(text, targetLang, sourceLang = "sv") {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const source = (sourceLang || "sv").toLowerCase().slice(0, 2);
  const chunk = text.slice(0, 450);

  try {
    const url =
      "https://api.mymemory.translated.net/get?" +
      new URLSearchParams({ q: chunk, langpair: `${source}|${target}` });
    const response = await fetch(url);
    const data = await response.json();
    const translated = data?.responseData?.translatedText?.trim();
    if (data?.responseStatus === 200 && translated) {
      return text.length > 450 ? translated + text.slice(450) : translated;
    }
  } catch (error) {
    console.warn("Reserv-översättning (MyMemory) misslyckades:", error);
  }
  return null;
}

async function translateViaApi(text, targetLang, sourceLang = "sv") {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const source = (sourceLang || "sv").toLowerCase().slice(0, 2);

  if (!text?.trim() || target === source) {
    return text;
  }

  const cacheKey = `${source}|${target}|${text}`;
  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey);
  }

  const offline = resolveI18nText(text, target);
  if (offline) {
    translateCache.set(cacheKey, offline);
    return offline;
  }

  if (backendTranslateAvailable) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(API_ENDPOINTS.translate, {
        method: "POST",
        headers: apiRequestHeaders(),
        body: JSON.stringify({
          text,
          source_language: source,
          target_language: target
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.translated_text) {
        translateCache.set(cacheKey, data.translated_text);
        return data.translated_text;
      }

      if (response.status === 400 && data?.error === "unsupported_language") {
        backendTranslateAvailable = false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
    }
  }

  const fallback = await translateViaMyMemory(text, target, source);
  if (fallback) {
    translateCache.set(cacheKey, fallback);
    return fallback;
  }

  return text;
}

function syncReaderLanguageUi(lang) {
  const target = (lang || "sv").toLowerCase().slice(0, 2);

  const label = document.getElementById("heritageLangLabel");
  if (label) {
    label.textContent = READER_LANG_LABELS[target] || target.toUpperCase();
  }
}

async function applyReaderLanguage(lang) {
  const target = (lang || getNewspaperLang()).toLowerCase().slice(0, 2);
  currentSite.language = target;
  captureI18nSources();
  syncReaderLanguageUi(target);
  document.documentElement.dir = RTL_LANGS.has(target) ? "rtl" : "ltr";
  document.body.classList.toggle("is-translating", target !== "sv");

  try {
    const elements = Array.from(document.querySelectorAll("[data-i18n]"))
      .filter(el => el.dataset.i18nDynamic !== "true");

    const sources = elements.map(el => getI18nSource(el)).filter(Boolean);
    const uniqueSources = [...new Set(sources)];
    const translatedMap = target === "sv"
      ? Object.fromEntries(uniqueSources.map(text => [text, text]))
      : await translateBatchMap(uniqueSources, target, "sv");

    elements.forEach(el => {
      const source = getI18nSource(el);
      el.textContent = translatedMap[source] || source;
    });

    const placeholderEls = document.querySelectorAll("[data-i18n-placeholder]");
    const placeholderSources = [...new Set(
      Array.from(placeholderEls).map(el => el.dataset.i18nPlaceholderSource || el.getAttribute("placeholder") || "")
    )].filter(Boolean);
    const placeholderMap = target === "sv"
      ? Object.fromEntries(placeholderSources.map(text => [text, text]))
      : await translateBatchMap(placeholderSources, target, "sv");

    placeholderEls.forEach(el => {
      const source = el.dataset.i18nPlaceholderSource || el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", placeholderMap[source] || source);
    });

    await updateModalProgressTitle(target);
    updateTodayDate();

    if (target === "sv") {
      updateDistanceLabels();
    } else {
      await translateDistanceLabels(target);
    }

    if (lastClosestSite) {
      await refreshClosestSiteTextOnly(lastClosestSite, target);
    }
  } catch (error) {
    console.error("Språkbyte misslyckades:", error);
  } finally {
    document.body.classList.remove("is-translating");
  }
}

async function updateModalProgressTitle(targetLang = getNewspaperLang()) {
  const modalProgress = document.getElementById("modalProgress");
  const activeStep = document.querySelector(".modal-step.active");
  if (!modalProgress || !activeStep?.dataset.i18nTitle) return;

  const source = activeStep.dataset.i18nTitle;
  modalProgress.dataset.i18nSource = source;
  modalProgress.textContent = targetLang === "sv"
    ? source
    : await translateUiText(source, targetLang, "sv");
}

function handleAdKey(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openServiceModal("detail");
  }
}

function openServiceModal(step = "detail") {
  const modal = document.getElementById("serviceModal");
  if (!modal) return;

  const startsNewFlow = !modal.classList.contains("show") && step === "detail";

  if (startsNewFlow) {
    resetDemoState();
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  void openModalStep(step);
}

function closeServiceModal() {
  const modal = document.getElementById("serviceModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  const stepLabel = document.getElementById("stepLabel");
  if (stepLabel) {
    stepLabel.textContent = "Vy 1: Digital tidningssida med annons";
  }

  resetDemoState();
}

function openModalStep(step) {
  document.querySelectorAll(".modal-step").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById(step);

  if (!target) {
    console.error("Kunde inte hitta vyn:", step);
    toast("Demo-fel: vyn kunde inte hittas.");
    return;
  }

  target.classList.add("active");

  const run = async () => {
    if (step === "payment") {
      await updatePaymentProviderUi();
      await updatePriceSummaryBox();
    }
    await updateModalProgressTitle(getNewspaperLang());

    const stepLabel = document.getElementById("stepLabel");
    if (stepLabel && target.dataset.i18nTitle) {
      stepLabel.textContent = `${target.dataset.i18nTitle} i modal`;
    }
  };

  run().catch(() => {});
}

function selectChoice(element) {
  const group = element.closest("[data-choice-group]");
  if (!group) return;

  group.querySelectorAll(".choice").forEach(choice => {
    choice.classList.remove("selected");
  });

  element.classList.add("selected");
}

function updateContactField() {
  const channelChoice = getSelectedChoice("subscribeChannel");
  const contactLabel = document.getElementById("contactLabel");
  const contactInput = document.getElementById("newPhone");

  if (!contactLabel || !contactInput) return;

  const channel = normalizeChannel(channelChoice);

  if (channel === "email") {
    setElementI18n(contactLabel, I18N_SV.EMAIL).catch(() => {});
    contactInput.value = "";
    contactInput.type = "email";
  } else {
    setElementI18n(contactLabel, I18N_SV.MOBILE).catch(() => {});
    contactInput.value = "+46";
    contactInput.type = "tel";
  }
}

function getSelectedChoice(groupName) {
  const selected = document.querySelector(`[data-choice-group="${groupName}"] .choice.selected`);
  if (!selected) return null;
  if (selected.dataset.channel) return selected.dataset.channel;
  const source = selected.dataset.i18nSource || selected.textContent.trim().toLowerCase();
  return normalizeChannel(source);
}

function normalizeChannel(value) {
  if (!value) return "sms";
  const normalized = String(value).toLowerCase();
  if (normalized.includes("e-post") || normalized.includes("email") || normalized === "email") {
    return "email";
  }
  return "sms";
}

function selectDuration(element) {
  const group = element.closest("[data-choice-group]");
  if (!group) return;
  group.querySelectorAll(".choice").forEach(c => c.classList.remove("selected"));
  element.classList.add("selected");
  prototypeState.duration_days = parseInt(element.dataset.days, 10) || 30;
  SUBSCRIPTION_PRICE_SEK = parseInt(element.dataset.price, 10) || SUBSCRIPTION_PRICE_SEK;
  updatePriceSummaryBox();
}

async function updatePaymentProviderUi() {
  const summary = document.getElementById("paymentSummaryChannel");
  if (summary) {
    const contact = getRecipientValue();
    const label = prototypeState.channel === "email" ? "E-post" : "SMS";
    const svText = `Prenumeration (${label}): ${contact || "–"}`;
    await setElementI18n(summary, svText);
  }

  const stripeHint = document.getElementById("stripePaymentHint");
  if (stripeHint) {
    if (PAYMENT_CONFIG.stripe_enabled) {
      const mode = PAYMENT_CONFIG.stripe_sandbox ? "Stripe sandbox" : "Stripe";
      stripeHint.textContent =
        `${mode} aktiv – testkort 4242… debiteras via Stripe PaymentIntent.`;
    } else {
      stripeHint.textContent =
        "Mock-betalning i demo. Sätt PAYMENT_PROVIDER=stripe och STRIPE_SECRET_KEY i .env för riktig sandbox.";
    }
  }
}

function buildPreferencesPayload(extra = {}) {
  return {
    user_id: prototypeState.user_id,
    phone: prototypeState.phone || undefined,
    email: prototypeState.email || undefined,
    ...extra,
  };
}

function getLocationReportPhone() {
  const phone = (prototypeState.phone || "").trim();
  if (!phone || isPlaceholderContact(phone) || phone === "bankid-user") {
    return null;
  }
  return phone;
}

async function reportLocationToApi() {
  const phone = getLocationReportPhone();
  if (!phone || !prototypeState.subscription_active) return;
  if (geoState.latitude == null || geoState.longitude == null) return;

  const payload = {
    phoneNo: phone,
    latitude: geoState.latitude,
    longitude: geoState.longitude,
  };

  try {
    const response = await fetch(API_ENDPOINTS.locationUpdate, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.notified && data.nearest_site?.name) {
      toast(`Notis skickad – du är nära ${data.nearest_site.name}.`);
    }
  } catch (error) {
    console.debug("location/update:", error);
  }
}

function startLocationReporting() {
  stopLocationReporting();
  if (!getLocationReportPhone() || !prototypeState.subscription_active) return;
  reportLocationToApi();
  locationReportTimer = window.setInterval(reportLocationToApi, 120000);
}

function stopLocationReporting() {
  if (locationReportTimer) {
    clearInterval(locationReportTimer);
    locationReportTimer = null;
  }
}

async function patchToApi(endpoint, payload) {
  try {
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      toast(`Kunde inte spara: ${await readApiError(response, data)}`);
      return null;
    }
    return data;
  } catch (error) {
    console.warn("PATCH misslyckades:", error);
    toast("Kunde inte nå API – inställningen sparades lokalt.");
    return null;
  }
}

function buildSubscriptionCreatePayload(paymentFields = {}) {
  const to = getRecipientValue();
  const payload = {
    channel: prototypeState.channel,
    to,
    site_id: currentSite.site_id,
    site_name: currentSite.name,
    language: currentSite.language || NEWSPAPER_LANG,
    subscription_type: "world_heritage_nearby",
    duration_days: prototypeState.duration_days
  };

  if (prototypeState.channel === "sms") {
    payload.phone = prototypeState.phone || to;
  }

  const receiptEmail =
    paymentFields.email ||
    (prototypeState.channel === "email" ? prototypeState.email || to : null);
  if (receiptEmail && receiptEmail.includes("@")) {
    payload.email = receiptEmail;
  }

  if (paymentFields.amount && paymentFields.card_type && paymentFields.card_number) {
    payload.amount = paymentFields.amount;
    payload.card_type = paymentFields.card_type;
    payload.card_number = paymentFields.card_number;
  }

  return payload;
}

function getContactValue() {
  const phoneInput = document.getElementById("newPhone");
  return phoneInput ? phoneInput.value.trim() : "";
}

function logApiPayload(label, endpoint, payload) {
  console.group(label);
  console.log("Endpoint:", endpoint);
  console.log("Payload:", payload);
  console.groupEnd();
}

function createSubscriptionDraft() {
  const contactValue = getContactValue();
  const channelChoice = getSelectedChoice("subscribeChannel");

  prototypeState.channel = normalizeChannel(channelChoice);

  if (prototypeState.channel === "email") {
    if (!contactValue || !contactValue.includes("@") || isPlaceholderContact(contactValue)) {
      toast("Ange en giltig e-postadress.");
      return;
    }
    prototypeState.email = contactValue;
    prototypeState.phone = "";
  } else {
    if (!contactValue || isPlaceholderContact(contactValue)) {
      toast("Ange ett giltigt mobilnummer.");
      return;
    }
    prototypeState.phone = contactValue;
    prototypeState.email = "";
  }

  const payload = {
    channel: prototypeState.channel,
    to: contactValue,
    site_id: currentSite.site_id,
    site_name: currentSite.name,
    language: currentSite.language,
    subscription_type: "world_heritage_nearby"
  };

  logApiPayload(
    "Förbereder prenumeration",
    API_ENDPOINTS.createSubscription,
    payload
  );

  openModalStep("payment");
  updatePaymentProviderUi();
  toast("Prenumerationen är förberedd.");
}

async function sendSmsCode() {
  const phone = document.getElementById("loginPhone")?.value.trim() || "";
  const sendBtn = document.getElementById("loginSendCodeBtn");

  if (!phone || isPlaceholderContact(phone)) {
    toast("Ange ett giltigt mobilnummer (t.ex. +46701234567).");
    return;
  }

  const payload = {
    phone,
    purpose: "login"
  };

  logApiPayload("Skickar SMS-kod", API_ENDPOINTS.loginRequestCode, payload);

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = "Skickar…";
  }

  try {
    const response = await fetch(API_ENDPOINTS.loginRequestCode, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      toast(`Kunde inte skicka kod: ${await readApiError(response, data)}`);
      return;
    }

    const otp = document.getElementById("otp");
    if (otp) {
      otp.value = "123456";
      otp.focus();
    }

    toast(data.message || "SMS-kod skickad. Utvecklingskod: 123456");
  } catch (error) {
    console.warn("request-code misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att uvicorn körs på port 8000.");
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = "Skicka SMS-kod";
    }
  }
}

async function loginWithSmsCode() {
  const phone = document.getElementById("loginPhone")?.value.trim() || "";
  const code = document.getElementById("otp")?.value.trim() || "";
  const verifyBtn = document.getElementById("loginVerifyBtn");

  if (!phone || !code) {
    toast("Ange mobilnummer och engångskod.");
    return;
  }

  const payload = { phone, code };

  logApiPayload("Loggar in med SMS-kod", API_ENDPOINTS.loginVerifyCode, payload);

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifierar…";
  }

  try {
    const response = await fetch(API_ENDPOINTS.loginVerifyCode, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      toast(`Inloggning misslyckades: ${await readApiError(response, data)}`);
      return;
    }

    prototypeState.phone = phone;
    prototypeState.channel = "sms";
    prototypeState.user_id = data.user_id || phone;
    prototypeState.access_token = data.access_token || null;
    prototypeState.subscription_active = true;

    updateConfirmationMessage();
    syncSettingsChannelButtons();
    openModalStep("confirmation");
    startLocationReporting();
    toast("Inloggning genomförd via API.");
  } catch (error) {
    console.warn("verify-code misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att uvicorn körs.");
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Logga in";
    }
  }
}

async function sendEmailCode() {
  const email = document.getElementById("loginEmail")?.value.trim() || "";
  const sendBtn = document.getElementById("loginSendEmailCodeBtn");

  if (!email || !email.includes("@") || isPlaceholderContact(email)) {
    toast("Ange en giltig e-postadress.");
    return;
  }

  const payload = { email, purpose: "login" };
  logApiPayload("Skickar e-postkod", API_ENDPOINTS.loginRequestEmailCode, payload);

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = "Skickar…";
  }

  try {
    const response = await fetch(API_ENDPOINTS.loginRequestEmailCode, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      toast(`Kunde inte skicka kod: ${await readApiError(response, data)}`);
      return;
    }

    const otp = document.getElementById("emailOtp");
    if (otp) {
      otp.value = "123456";
      otp.focus();
    }

    toast(data.message || "E-postkod skickad. Utvecklingskod: 123456");
  } catch (error) {
    console.warn("request-email-code misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att uvicorn körs på port 8000.");
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = "Skicka e-postkod";
    }
  }
}

async function loginWithEmailCode() {
  const email = document.getElementById("loginEmail")?.value.trim() || "";
  const code = document.getElementById("emailOtp")?.value.trim() || "";
  const verifyBtn = document.getElementById("loginVerifyEmailBtn");

  if (!email || !code) {
    toast("Ange e-post och engångskod.");
    return;
  }

  const payload = { email, code };
  logApiPayload("Loggar in med e-postkod", API_ENDPOINTS.loginVerifyEmailCode, payload);

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifierar…";
  }

  try {
    const response = await fetch(API_ENDPOINTS.loginVerifyEmailCode, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      toast(`Inloggning misslyckades: ${await readApiError(response, data)}`);
      return;
    }

    prototypeState.email = email;
    prototypeState.channel = "email";
    prototypeState.phone = "";
    prototypeState.user_id = data.user_id || email;
    prototypeState.access_token = data.access_token || null;
    prototypeState.subscription_active = true;

    updateConfirmationMessage();
    syncSettingsChannelButtons();
    openModalStep("confirmation");
    toast("Inloggning genomförd via e-post.");
  } catch (error) {
    console.warn("verify-email-code misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att uvicorn körs.");
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Logga in med e-post";
    }
  }
}

function getRecipientValue() {
  if (prototypeState.channel === "email") {
    return prototypeState.email || "";
  }

  return prototypeState.phone || "";
}

function getChannelLabel() {
  return prototypeState.channel === "email" ? "e-post" : "SMS";
}

async function updateConfirmationMessage(extra) {
  const confirmationMessage = document.getElementById("confirmationMessage");

  if (!confirmationMessage) return;

  let text = `En bekräftelse har skickats via ${getChannelLabel()}.`;
  if (extra?.receipt_sent) {
    text += " E-postkvitto skickades.";
  }
  if (extra?.end_date) {
    text += ` Prenumerationen gäller till ${extra.end_date}.`;
  }
  await setElementI18n(confirmationMessage, text);
}

function sendConfirmationNotificationPayload() {
  const confirmationPayload = {
    type: prototypeState.channel,
    to: getRecipientValue(),
    message: "Din Heritage Connect-prenumeration är nu aktiv. Du får nu notiser om världsarv nära dig.",
    subject: "Din Heritage Connect-prenumeration är aktiv",
    user_id: prototypeState.user_id,
    site_id: currentSite.site_id
  };

  logApiPayload(
    "Bekräftelse via vald notiskanal",
    API_ENDPOINTS.notificationSend,
    confirmationPayload
  );

  sendToApi(API_ENDPOINTS.notificationSend, confirmationPayload);

  return confirmationPayload;
}

async function paymentComplete() {
  const cardTypeChoice = getSelectedChoice("paymentCardType");
  const cardType = cardTypeChoice?.includes("master") ? "mastercard" : "visa";
  const cardNumber = (
    document.getElementById("paymentCardNumber")?.value || ""
  ).replace(/\s/g, "");
  const receiptEmail = document.getElementById("paymentReceiptEmail")?.value.trim();

  if (!cardNumber || cardNumber.length < 12) {
    toast("Ange ett giltigt kortnummer (test).");
    return;
  }

  const paymentPayload = buildSubscriptionCreatePayload({
    amount: SUBSCRIPTION_PRICE_SEK,
    card_type: cardType,
    card_number: cardNumber,
    email: receiptEmail || undefined
  });

  logApiPayload(
    "Betalning och prenumeration",
    API_ENDPOINTS.createSubscription,
    paymentPayload
  );

  const submitBtn = document.getElementById("paymentSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Betalar…";
  }

  try {
    const response = await fetch(API_ENDPOINTS.createSubscription, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(paymentPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : data.detail?.message || JSON.stringify(data.detail || data);
      toast(`Betalning misslyckades: ${detail}`);
      return;
    }

    prototypeState.payment_provider = "stripe";
    prototypeState.subscription_active = Boolean(data.subscription_active);
    prototypeState.user_id = data.user_id || prototypeState.user_id;
    prototypeState.last_subscription = data;

    updateConfirmationMessage({
      receipt_sent: data.receipt_sent,
      end_date: data.end_date
    });
    syncSettingsChannelButtons();
    openModalStep("confirmation");
    toast("Betalning genomförd. Prenumerationen är aktiv.");

    sendConfirmationNotificationPayload();
    startLocationReporting();
  } catch (error) {
    console.warn("Prenumeration/betalning misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att servern körs.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      updatePaymentProviderUi();
    }
  }
}

function previewNotificationPayload() {
  const toValue = prototypeState.channel === "email"
    ? prototypeState.email
    : prototypeState.phone;

  const notificationPayload = {
    type: prototypeState.channel,
    to: toValue,
    message: `Du är nära ${currentSite.name}. Läs mer via din personliga länk.`,
    subject: "Världsarv nära dig",
    user_id: prototypeState.user_id,
    site_id: currentSite.site_id
  };

  logApiPayload(
    "Payload till gemensamt notis-API",
    API_ENDPOINTS.notificationSend,
    notificationPayload
  );

  sendToApi(API_ENDPOINTS.notificationSend, notificationPayload);

  return notificationPayload;
}

async function sendToApi(endpoint, payload) {
  console.log("Skickar API-anrop:", {
    endpoint,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    },
    payload
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    console.log("API-svar:", result);

    if (!response.ok) {
      toast(`API-fel: ${result.error || "okänt fel"}`);
      return result;
    }

    toast(`Notis skickad via ${result.channel}`);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    console.warn("Kunde inte nå API:t. Prototypen fortsätter som demo.", error);
    toast("Demo-läge: API:t är inte igång, men payloaden visas i konsolen.");

    return {
      success: false,
      error: "network_or_timeout",
      demo_payload: payload
    };
  }
}

function isPlaceholderContact(value) {
  if (!value) return true;

  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue === "+46" ||
    normalizedValue === "+46 7xx xxx xxx" ||
    normalizedValue === "namn@example.com" ||
    normalizedValue.includes("xxx")
  );
}

function hasSavedContactForChannel(channel) {
  if (channel === "email") {
    return Boolean(
      prototypeState.email &&
      prototypeState.email.includes("@") &&
      !isPlaceholderContact(prototypeState.email)
    );
  }

  return Boolean(
    prototypeState.phone &&
    prototypeState.phone.trim().length > 0 &&
    !isPlaceholderContact(prototypeState.phone)
  );
}

function askForMissingContact(channel) {
  if (channel === "email") {
    const email = window.prompt(
      "För att byta till e-postnotiser behöver du ange en e-postadress."
    );

    if (!email || !email.includes("@") || isPlaceholderContact(email)) {
      toast("E-postnotiser kräver en giltig e-postadress.");
      return false;
    }

    prototypeState.email = email.trim();
    return true;
  }

  const phone = window.prompt(
    "För att byta till SMS-notiser behöver du ange ett mobilnummer."
  );

  if (!phone || phone.trim().length < 5 || isPlaceholderContact(phone)) {
    toast("SMS-notiser kräver ett mobilnummer.");
    return false;
  }

  prototypeState.phone = phone.trim();
  return true;
}

function syncSettingsChannelButtons() {
  const group = document.querySelector('[data-choice-group="settingsChannel"]');
  const messageElement = document.getElementById("settingsChannelMessage");

  if (!group) return;

  group.querySelectorAll(".choice").forEach(choice => {
    choice.classList.remove("selected");

    if (choice.dataset.channel === prototypeState.channel) {
      choice.classList.add("selected");
    }
  });

  if (messageElement) {
    const svText = prototypeState.channel === "email" ? I18N_SV.ACTIVE_EMAIL : I18N_SV.ACTIVE_SMS;
    setElementI18n(messageElement, svText).catch(() => {});
  }
}

async function updateSettingsChannel(element, channel) {
  const previousChannel = prototypeState.channel;

  if (!hasSavedContactForChannel(channel)) {
    const contactWasAdded = askForMissingContact(channel);

    if (!contactWasAdded) {
      prototypeState.channel = previousChannel;
      syncSettingsChannelButtons();
      return;
    }
  }

  prototypeState.channel = channel;
  syncSettingsChannelButtons();
  updateConfirmationMessage();

  const payload = buildPreferencesPayload({ notification_channel: channel });

  logApiPayload(
    "Uppdaterar notiskanal",
    API_ENDPOINTS.updatePreferences,
    payload
  );

  await patchToApi(API_ENDPOINTS.updatePreferences, payload);

  const channelText = channel === "email" ? "E-postnotiser" : "SMS-notiser";
  toast(`Notiskanal uppdaterad till ${channelText}.`);
}

async function togglePreference(element) {
  const source = element.dataset.i18nSource || element.textContent.trim();
  const isMarkingVisited = source === I18N_SV.PREF_ACTIVE;

  if (isMarkingVisited) {
    await setElementI18n(element, I18N_SV.PREF_INACTIVE);
    element.style.background = "var(--success-bg)";
    element.style.color = "var(--success)";
    element.style.borderColor = "#86efac";

    if (!prototypeState.visited_sites.includes(currentSite.site_id)) {
      prototypeState.visited_sites.push(currentSite.site_id);
    }
  } else {
    await setElementI18n(element, I18N_SV.PREF_ACTIVE);
    element.style.background = "var(--danger-bg)";
    element.style.color = "var(--danger)";
    element.style.borderColor = "#e58c8c";

    prototypeState.visited_sites = prototypeState.visited_sites.filter(
      site => site !== currentSite.site_id
    );
  }

  const payload = buildPreferencesPayload({
    site_id: currentSite.site_id,
    visited: isMarkingVisited,
  });

  logApiPayload(
    "Uppdaterar innehållspreferens",
    API_ENDPOINTS.updatePreferences,
    payload
  );

  await patchToApi(API_ENDPOINTS.updatePreferences, payload);
}

function cancelSubscription() {
  const confirmed = window.confirm(
    "Är du säker på att du vill avsluta prenumerationen?\n\nDu får inga fler notiser om världsarv nära dig."
  );
  if (!confirmed) return;

  prototypeState.subscription_active = false;
  stopLocationReporting();

  const payload = {
    user_id: prototypeState.user_id,
    channel: prototypeState.channel,
    to: prototypeState.channel === "email" ? prototypeState.email : prototypeState.phone,
    subscription_active: false
  };

  logApiPayload("Avslutar prenumeration", API_ENDPOINTS.cancelSubscription, payload);

  fetch(API_ENDPOINTS.cancelSubscription, {
    method: "POST",
    headers: apiRequestHeaders(),
    body: JSON.stringify(payload),
  })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) {
        toast(`Avslut misslyckades: ${await readApiError(response, data)}`);
      } else {
        toast("Prenumerationen är avslutad.");
      }
    })
    .catch(() => {
      toast("Kunde inte nå API – prenumerationen avslutades lokalt i demo.");
    });

  const activeContent = document.getElementById("activeSubscriptionContent");
  const cancelledContent = document.getElementById("cancelledSubscriptionContent");
  const statusBox = document.getElementById("subscriptionStatusBox");
  const confirmationMessage = document.getElementById("confirmationMessage");

  if (activeContent) activeContent.style.display = "none";
  if (cancelledContent) cancelledContent.style.display = "block";
  if (statusBox) statusBox.style.display = "none";
  if (confirmationMessage) confirmationMessage.style.display = "none";
}

async function loginWithBankId() {
  const btn = document.querySelector(".bankid-btn");
  if (btn) {
    btn.disabled = true;
    await setElementI18n(btn, I18N_SV.BANKID_WAIT);
  }

  try {
    const startRes = await fetch(API_ENDPOINTS.bankidStart, {
      method: "POST",
      headers: apiRequestHeaders(),
    });
    const startData = await startRes.json();

    if (!startRes.ok) {
      toast("BankID kunde inte startas.");
      return;
    }

    await new Promise(r => setTimeout(r, 1500));

    const completeRes = await fetch(API_ENDPOINTS.bankidComplete, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify({ order_ref: startData.order_ref }),
    });
    const data = await completeRes.json();

    if (!completeRes.ok) {
      toast(`BankID-inloggning misslyckades: ${await readApiError(completeRes, data)}`);
      return;
    }

    prototypeState.phone = "+46701234567";
    prototypeState.channel = "sms";
    prototypeState.user_id = data.user_id || "bankid_user";
    prototypeState.access_token = data.access_token || null;
    prototypeState.subscription_active = true;
    updateConfirmationMessage();
    syncSettingsChannelButtons();
    openModalStep("confirmation");
    startLocationReporting();
    toast("Inloggad via BankID.");
  } catch (error) {
    console.warn("BankID misslyckades:", error);
    toast("Kunde inte nå BankID-API – kontrollera att servern körs.");
  } finally {
    if (btn) {
      btn.disabled = false;
      await setElementI18n(btn, I18N_SV.BANKID_BTN);
    }
  }
}

function togglePolicy(event) {
  event.stopPropagation();
  const details = document.getElementById("policyDetails");
  if (details) details.open = !details.open;
}

async function askAiQuestion() {
  const input = document.getElementById("aiQuestionInput");
  const answerBox = document.getElementById("aiAnswer");
  const question = input ? input.value.trim() : "";

  if (!question) {
    toast("Skriv en fråga först.");
    return;
  }

  if (answerBox) {
    await setElementI18n(answerBox, I18N_SV.AI_LOADING);
    answerBox.dataset.i18nDynamic = "true";
  }

  const payload = {
    site_id: currentSite.site_id || currentSite.name,
    question,
    user_id: prototypeState.user_id,
    language: currentSite.language || NEWSPAPER_LANG,
  };

  try {
    const response = await fetch(API_ENDPOINTS.aiAsk, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      if (answerBox) {
        delete answerBox.dataset.i18nDynamic;
        await setElementI18n(answerBox, I18N_SV.AI_ERROR);
      }
      return;
    }
    if (answerBox) {
      answerBox.dataset.i18nDynamic = "true";
      answerBox.textContent = data.answer || I18N_SV.AI_EMPTY;
    }
  } catch (_) {
    if (answerBox) {
      delete answerBox.dataset.i18nDynamic;
      await setElementI18n(answerBox, I18N_SV.AI_OFFLINE);
    }
  }
}

function toast(message) {
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2400);
}

function updateTodayDate() {
  const dateElement = document.getElementById("todayDate");

  if (!dateElement) return;

  const today = new Date();
  const lang = getNewspaperLang();
  const localeMap = {
    sv: "sv-SE",
    fi: "fi-FI",
    ar: "ar-SA",
    en: "en-GB",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    no: "nb-NO",
    da: "da-DK",
  };
  const locale = localeMap[lang] || lang;

  const formattedDate = today.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  dateElement.textContent =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

/* ==============================
   Initiering
   ============================== */

updateTodayDate();

async function bootstrapApp() {
  captureI18nSources();
  await loadHeritageSites();

  const urlPos = readUrlPosition();
  const urlSiteRef = readUrlSiteRef();

  if (urlPos) {
    stopGeoWatch();
    setGeoCoords(urlPos.latitude, urlPos.longitude, "url");
    syncDemoPositionSelect(urlPos.latitude, urlPos.longitude);
    await refreshGeoFromApi();
  } else {
    initGeoPrototype();
  }

  if (urlSiteRef) {
    await applySiteFromRef(urlSiteRef);
  }

  void loadConfig();
  captureI18nSources();
  await applyReaderLanguage(getNewspaperLang());
}

initApiSettings();
bootstrapApp().catch(error => {
  console.error("Initiering misslyckades:", error);
  syncReaderLanguageUi(getNewspaperLang());
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeServiceModal();
  }
});

// Gör funktionerna tillgängliga för onclick i index.html.
window.handleAdKey = handleAdKey;
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;
window.openModalStep = openModalStep;
window.selectChoice = selectChoice;
window.createSubscriptionDraft = createSubscriptionDraft;
window.sendSmsCode = sendSmsCode;
window.sendEmailCode = sendEmailCode;
window.loginWithSmsCode = loginWithSmsCode;
window.loginWithEmailCode = loginWithEmailCode;
window.paymentComplete = paymentComplete;
window.togglePreference = togglePreference;
window.cancelSubscription = cancelSubscription;
window.previewNotificationPayload = previewNotificationPayload;
window.updateContactField = updateContactField;
window.updateConfirmationMessage = updateConfirmationMessage;
window.sendConfirmationNotificationPayload = sendConfirmationNotificationPayload;
window.updateSettingsChannel = updateSettingsChannel;
window.hasSavedContactForChannel = hasSavedContactForChannel;
window.askForMissingContact = askForMissingContact;
window.syncSettingsChannelButtons = syncSettingsChannelButtons;
window.resetDemoState = resetDemoState;
window.isPlaceholderContact = isPlaceholderContact;
window.saveApiBaseUrlFromInput = saveApiBaseUrlFromInput;
window.testApiConnection = testApiConnection;
window.applyReaderLanguage = applyReaderLanguage;
window.refreshGeoFromApi = refreshGeoFromApi;
window.loginWithBankId = loginWithBankId;
window.togglePolicy = togglePolicy;
window.askAiQuestion = askAiQuestion;
window.selectDuration = selectDuration;
