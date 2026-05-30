/* ==============================
   Heritage Connect – frontend-prototyp
   API-förberedd version
   ============================== */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
/** Tidigare standard-ngrok – migreras till localhost vid laddning */
const LEGACY_DEFAULT_API_BASE_URL = "https://fling-sneer-margarita.ngrok-free.dev";
const API_BASE_STORAGE_KEY = "heritage_connect_api_base_url";
const DEMO_POSITION_STORAGE_KEY = "heritage_connect_demo_position";
const API_TOKEN = "hemlig-nyckel";

/** Standard vid sidladdning: `<html lang="…">` i index.html (ISO 639-1, t.ex. sv, ja, hi). */
function getNewspaperLang() {
  return normalizeLanguageCode(document.documentElement.lang || "sv");
}

/** Aktivt tidningsspråk (dropdown-val eller html lang efter omladdning). */
let preferredReaderLang = null;

function getActiveReaderLang() {
  if (preferredReaderLang) {
    return normalizeLanguageCode(preferredReaderLang);
  }
  return getNewspaperLang();
}

function syncDemoLanguageSelectToLang(lang) {
  const select = document.getElementById("demoLanguageSelect");
  const target = normalizeLanguageCode(lang || getNewspaperLang());
  preferredReaderLang = isValidLanguageCode(target) ? target : "sv";

  if (!select) return preferredReaderLang;

  ensureLanguageOption(select, preferredReaderLang);
  select.dataset.selectedLang = preferredReaderLang;
  return preferredReaderLang;
}

const NEWSPAPER_LANG = getNewspaperLang();

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
    "Prenumerera och få SMS om världsarv nära dig": "Subscribe and get SMS about world heritage near you",
    "Översätter tidning och annons…": "Translating newspaper and ad…"
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

/** Modal och formulärtexter – offline för snabb demo utan API. */
const UI_MODAL_I18N = {
  en: {
    "Steg 1 av 4: Världsarvsinformation": "Step 1 of 4: World heritage information",
    "Tillbaka till tidningen": "Back to the newspaper",
    "Tillbaka": "Back",
    "Tillbaka till prenumeration": "Back to subscription",
    "Tillbaka till världsarvet": "Back to world heritage site",
    "Steg 2 av 4: Starta prenumeration": "Step 2 of 4: Start subscription",
    "Steg 3 av 4: Betalning": "Step 3 of 4: Payment",
    "Steg 4 av 4: Bekräftelse": "Step 4 of 4: Confirmation",
    "Skapa en prenumeration för att få SMS om världsarv nära dig. Konto skapas i samband med betalningen.":
      "Create a subscription to receive SMS about world heritage near you. An account is created when you pay.",
    "Skapa konto": "Create account",
    "Ange dina uppgifter och starta prenumerationen.": "Enter your details and start the subscription.",
    "Mobilnummer": "Mobile number",
    "Välj notiskanal": "Choose notification channel",
    "E-post": "Email",
    "Betalning i nästa steg via Stripe (Visa/Mastercard). Kort sparas inte i Heritage Connect.":
      "Payment in the next step via Stripe (Visa/Mastercard). Card details are not stored in Heritage Connect.",
    "Jag godkänner villkoren och": "I accept the terms and",
    "integritetspolicyn": "privacy policy",
    "Integritetspolicy – Heritage Connect": "Privacy policy – Heritage Connect",
    "Heritage Connect samlar in ditt mobilnummer och/eller din e-postadress för att kunna skicka notiser om UNESCO-världsarv i närheten av din position.":
      "Heritage Connect collects your mobile number and/or email address to send notifications about UNESCO world heritage near your location.",
    "Din position används enbart för att avgöra vilket världsarv som är närmast dig. Positionsdata lagras inte permanent.":
      "Your location is only used to determine which world heritage site is nearest. Location data is not stored permanently.",
    "Du kan när som helst avsluta din prenumeration och begära radering av dina uppgifter via din profil eller genom att kontakta oss.":
      "You can cancel your subscription and request deletion of your data at any time via your profile or by contacting us.",
    "Betalningsinformation hanteras av Stripe och lagras inte av Heritage Connect.":
      "Payment information is handled by Stripe and is not stored by Heritage Connect.",
    "Gå vidare till betalning": "Continue to payment",
    "eller": "or",
    "Har du redan ett konto?": "Already have an account?",
    "🏦 Logga in med BankID (Sverige)": "🏦 Log in with BankID (Sweden)",
    "eller via SMS-kod": "or via SMS code",
    "Ange ditt registrerade mobilnummer.": "Enter your registered mobile number.",
    "Skicka SMS-kod": "Send SMS code",
    "Engångskod via SMS": "One-time code via SMS",
    "Utveckling: efter \"Skicka SMS-kod\" är koden 123456 (samma som i API-test).":
      "Development: after \"Send SMS code\" the code is 123456 (same as in the API test).",
    "Logga in": "Log in",
    "eller via e-postkod (utlandet)": "or via email code (international)",
    "Ange din registrerade e-postadress.": "Enter your registered email address.",
    "Skicka e-postkod": "Send email code",
    "Engångskod via e-post": "One-time code via email",
    "Utveckling: efter \"Skicka e-postkod\" är koden 123456.":
      "Development: after \"Send email code\" the code is 123456.",
    "Logga in med e-post": "Log in with email",
    "Betala prenumeration": "Pay for subscription",
    "Sammanfattning innan betalning.": "Summary before payment.",
    "Prenumeration: SMS om världsarv nära dig": "Subscription: SMS about world heritage near you",
    "Pris: 99 SEK (engångsbetalning, ingen auto-förnyelse – SMS-påminnelse skickas 3 dagar innan utgång)":
      "Price: 99 SEK (one-time payment, no auto-renewal – SMS reminder sent 3 days before expiry)",
    "Kort hanteras av betalleverantören – sparas inte i Heritage Connect":
      "Card is handled by the payment provider – not stored in Heritage Connect",
    "Välj prenumerationsperiod": "Choose subscription period",
    "1 månad": "1 month",
    "3 månader": "3 months",
    "6 månader": "6 months",
    "Du kan avsluta prenumerationen när som helst.": "You can cancel the subscription at any time.",
    "Korttyp": "Card type",
    "Kortnummer (test)": "Card number (test)",
    "Mock-betalning i demo. Med Stripe-nyckel i .env anropas Stripe PaymentIntent.":
      "Mock payment in demo. With Stripe key in .env, Stripe PaymentIntent is called.",
    "Mock-betalning i demo. Sätt PAYMENT_PROVIDER=stripe och STRIPE_SECRET_KEY i .env för riktig sandbox.":
      "Mock payment in demo. Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY in .env for real sandbox.",
    "Stripe testläge – ange kortuppgifter nedan. Testkort: 4242 4242 4242 4242.":
      "Stripe test mode – enter card details below. Test card: 4242 4242 4242 4242.",
    "E-post för kvitto (valfritt)": "Email for receipt (optional)",
    "Betala med Stripe (demo)": "Pay with Stripe (demo)",
    "Tack för din prenumeration. Prenumerationen är nu aktiv.":
      "Thank you for your subscription. Your subscription is now active.",
    "En bekräftelse skickas till vald notiskanal.": "A confirmation will be sent to your chosen notification channel.",
    "NOTISKANAL": "NOTIFICATION CHANNEL",
    "📱 SMS-notiser": "📱 SMS notifications",
    "✉️ E-postnotiser": "✉️ Email notifications",
    "Aktiv kanal: SMS-notiser": "Active channel: SMS notifications",
    "BETALNINGSINFORMATION": "PAYMENT INFORMATION",
    "Betalning via Stripe (Visa/Mastercard). Ingen automatisk förnyelse.":
      "Payment via Stripe (Visa/Mastercard). No automatic renewal.",
    "Ändra betalningsmetod": "Change payment method",
    "INNEHÅLLSPREFERENSER": "CONTENT PREFERENCES",
    "Markera som besökt, inga fler SMS om detta världsarv":
      "Mark as visited, no more SMS about this world heritage site",
    "PRENUMERATION": "SUBSCRIPTION",
    "Avsluta prenumeration": "Cancel subscription",
    "Dessa inställningar kräver inloggning och visas bara för aktiva prenumeranter.":
      "These settings require login and are only shown to active subscribers.",
    "Prenumerationen är avslutad": "Subscription cancelled",
    "Du får inga fler notiser om världsarv. Tack för att du använde Heritage Connect.":
      "You will no longer receive world heritage notifications. Thank you for using Heritage Connect.",
    "Tillbaka till världsarvet": "Back to the world heritage site",
    "Ca 71 km bort": "Approx. 71 km away",
    "Ca 1.7 km bort": "Approx. 1.7 km away",
    "Hämtar närmaste världsarv…": "Finding nearest world heritage site…",
    "Hämtar avstånd…": "Calculating distance…",
    "Hämtar världsarv…": "Loading world heritage site…",
    "Avstånd okänt": "Distance unknown",
    "Avstånd från din position kunde inte beräknas": "Distance from your location could not be calculated",
    "För att byta till e-postnotiser behöver du ange en e-postadress.":
      "To switch to email notifications, enter an email address.",
    "För att byta till SMS-notiser behöver du ange ett mobilnummer.":
      "To switch to SMS notifications, enter a mobile number.",
    "E-postnotiser kräver en giltig e-postadress.": "Email notifications require a valid email address.",
    "SMS-notiser kräver ett mobilnummer.": "SMS notifications require a mobile number.",
    "Notiskanal uppdaterad till E-postnotiser.": "Notification channel updated to email notifications.",
    "Notiskanal uppdaterad till SMS-notiser.": "Notification channel updated to SMS notifications.",
    "En bekräftelse har skickats via SMS.": "A confirmation has been sent via SMS.",
    "En bekräftelse har skickats via e-post.": "A confirmation has been sent via email.",
    " E-postkvitto skickades.": " A receipt email was sent.",
    " Prenumerationen gäller till ": " Subscription valid until "
  }
};

function getI18nDictionary(lang) {
  const target = (lang || "sv").toLowerCase().slice(0, 2);
  return { ...(NEWSPAPER_I18N[target] || {}), ...(UI_MODAL_I18N[target] || {}) };
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
};

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);
const UNESCO_DESC_LANGS = new Set(["en", "fr", "es", "ru", "ar", "zh"]);

function getUnescoDescription(site, lang) {
  const key = `desc_${lang}`;
  const text = site?.[key];
  return text && String(text).trim() ? String(text).trim() : null;
}

function pickUnescoDescriptionSource(site, targetLang) {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const localized = getUnescoDescription(site, target);
  const english = getUnescoDescription(site, "en") || site?.description || "";

  if (localized) {
    if (target === "sv") {
      return { text: localized, lang: target };
    }
    // desc_xx kan vara korta introtexter – använd full UNESCO-text när den finns.
    if (english && localized.length < english.length * 0.6) {
      return { text: english, lang: "en" };
    }
    return { text: localized, lang: target };
  }

  if (english) {
    return { text: english, lang: "en" };
  }

  const swedish = getUnescoDescription(site, "sv");
  if (swedish) {
    return { text: swedish, lang: "sv" };
  }

  return { text: "", lang: target };
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
async function resolveSiteDescription(site, targetLang = getActiveReaderLang()) {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const { text: sourceText, lang: sourceLang } = pickUnescoDescriptionSource(site, target);

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
async function resolveSiteName(site, targetLang = getActiveReaderLang()) {
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
let applyReaderLanguageSeq = 0;

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

function isLocalhostApiUrl(url) {
  try {
    const { hostname } = new URL(normalizeApiBaseUrl(url));
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch (_) {
    return false;
  }
}

function isStaleApiBaseUrl(url) {
  const normalized = normalizeApiBaseUrl(url);
  if (
    normalized === LEGACY_DEFAULT_API_BASE_URL ||
    normalized === normalizeApiBaseUrl(LEGACY_DEFAULT_API_BASE_URL)
  ) {
    return true;
  }
  if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
    const pageHost = window.location.hostname;
    const onLocalPage = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (!onLocalPage && isLocalhostApiUrl(normalized)) {
      return true;
    }
    if (!onLocalPage) {
      try {
        const storedHost = new URL(normalized).hostname;
        if (storedHost !== pageHost) {
          return true;
        }
      } catch (_) {
        return true;
      }
    }
  }
  return false;
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
    notificationSend: `${base}/api/notification/send`,
    createSubscription: `${base}/api/subscription/create`,
    loginRequestCode: `${base}/api/auth/request-code`,
    loginVerifyCode: `${base}/api/auth/verify-code`,
    loginRequestEmailCode: `${base}/api/auth/request-email-code`,
    loginVerifyEmailCode: `${base}/api/auth/verify-email-code`,
    bankidStart: `${base}/api/auth/bankid/start`,
    bankidCollect: `${base}/api/auth/bankid/collect`,
    bankidQr: `${base}/api/auth/bankid/qr`,
    bankidConfig: `${base}/api/auth/bankid/config`,
    bankidComplete: `${base}/api/auth/bankid/complete`,
    updatePreferences: `${base}/api/user/preferences`,
    cancelSubscription: `${base}/api/subscription/cancel`,
    locationUpdate: `${base}/api/location/update`,
    paymentConfig: `${base}/api/payments/config`,
    paymentIntent: `${base}/api/payments/intent`,
    translate: `${base}/api/translate`,
    translateBatch: `${base}/api/translate/batch`,
  };
}

const DEFAULT_GEO = { latitude: 62.0, longitude: 15.0 }; // Centrum Sverige

const SWEDISH_GEO_FALLBACK = [
  { name: "Mining Area of the Great Copper Mountain in Falun", country: "Sweden", latitude: 60.60472, longitude: 15.63083, unesco_id: "1027", name_sv: "Gruvorna i Falun" },
  { name: "Engelsberg Ironworks", country: "Sweden", latitude: 59.97, longitude: 16.01, unesco_id: "556", name_sv: "Engelsbergs bruk" },
  { name: "Decorated Farmhouses of Hälsingland", country: "Sweden", latitude: 61.7072222222, longitude: 16.1958333333, unesco_id: "1282", name_sv: "Hälsingegårdar" },
  { name: "Royal Domain of Drottningholm", country: "Sweden", latitude: 59.32306, longitude: 17.88333, unesco_id: "559", name_sv: "Drottningholms slott" },
  { name: "Birka and Hovgården", country: "Sweden", latitude: 59.33514, longitude: 17.54264, unesco_id: "555" },
  { name: "Hanseatic Town of Visby", country: "Sweden", latitude: 57.64167, longitude: 18.29583, unesco_id: "731" },
  { name: "Skogskyrkogården", country: "Sweden", latitude: 59.27556, longitude: 18.09944, unesco_id: "558", name_sv: "Skogskyrkogården" },
  { name: "Naval Port of Karlskrona", country: "Sweden", latitude: 56.16667, longitude: 15.58333, unesco_id: "871" },
  { name: "Rock Carvings in Tanum", country: "Sweden", latitude: 58.70111, longitude: 11.34111, unesco_id: "557" },
  { name: "Church Town of Gammelstad, Luleå", country: "Sweden", latitude: 65.64611, longitude: 22.02861, unesco_id: "762" }
];

let LOCAL_HERITAGE_SITES = SWEDISH_GEO_FALLBACK.slice();
let heritageSitesLoadPromise = null;

async function enrichHeritageSitesFromFullData() {
  try {
    const response = await fetch("data/heritage-sites.json");
    if (!response.ok) return;
    const fullSites = await response.json();
    if (Array.isArray(fullSites) && fullSites.length > 0) {
      LOCAL_HERITAGE_SITES = fullSites;
      console.info(`UNESCO fullständig databas laddad: ${LOCAL_HERITAGE_SITES.length} platser.`);
      await refreshGeoFromApi();
    }
  } catch (error) {
    console.debug("Kunde inte ladda fullständig UNESCO-data i bakgrunden.", error);
  }
}

async function loadHeritageSitesOnce() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("data/heritage-geo.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      LOCAL_HERITAGE_SITES = await response.json();
      console.info(`UNESCO-geodata laddad: ${LOCAL_HERITAGE_SITES.length} platser.`);
      void enrichHeritageSitesFromFullData();
      return LOCAL_HERITAGE_SITES;
    } catch (err) {
      if (attempt < 2) {
        await new Promise(resolve => window.setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      console.warn("Kunde inte ladda UNESCO-geodata.", err);
      LOCAL_HERITAGE_SITES = SWEDISH_GEO_FALLBACK.slice();
      return LOCAL_HERITAGE_SITES;
    }
  }
  return LOCAL_HERITAGE_SITES;
}

function loadHeritageSites() {
  if (!heritageSitesLoadPromise) {
    heritageSitesLoadPromise = loadHeritageSitesOnce();
  }
  return heritageSitesLoadPromise;
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
let refreshGeoTail = Promise.resolve();

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
  stripe_configured: false,
  demo_use_mock: false,
  stripe_sandbox: false,
  stripe_publishable_key: null,
};

function formatStripePaymentError(error) {
  if (!error) return "Betalning misslyckades.";
  const code = (error.decline_code || error.code || "").toLowerCase();
  if (
    code.includes("decline") ||
    code === "card_declined" ||
    /nek/i.test(error.message || "")
  ) {
    return PAYMENT_CONFIG.stripe_sandbox
      ? "Kortet nekades. I Stripe testläge: använd 4242 4242 4242 4242, valfritt framtida datum och valfri CVC (t.ex. 123)."
      : "Betalningsmetoden nekades – prova ett annat kort.";
  }
  return error.message || "Betalning misslyckades.";
}
let stripeClient = null;
let stripeElements = null;
let stripePaymentElement = null;
let stripeClientSecret = null;
let stripeIntentAmount = null;

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

function loadStripeJs() {
  if (window.Stripe) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Stripe.js failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Stripe.js failed to load"));
    document.head.appendChild(script);
  });
}

function destroyStripePaymentElement() {
  if (stripePaymentElement) {
    stripePaymentElement.unmount();
    stripePaymentElement = null;
  }
  stripeElements = null;
  stripeClientSecret = null;
  stripeIntentAmount = null;
}

async function prepareStripePaymentStep() {
  await loadPaymentConfig();
  await updatePaymentProviderUi();

  const mockFields = document.getElementById("mockPaymentFields");
  const stripeMount = document.getElementById("stripePaymentMount");

  if (!PAYMENT_CONFIG.stripe_enabled || !PAYMENT_CONFIG.stripe_publishable_key) {
    destroyStripePaymentElement();
    mockFields?.removeAttribute("hidden");
    stripeMount?.setAttribute("hidden", "");
    return;
  }

  mockFields?.setAttribute("hidden", "");
  stripeMount?.removeAttribute("hidden");

  if (
    stripeClientSecret &&
    stripeIntentAmount === SUBSCRIPTION_PRICE_SEK &&
    stripePaymentElement
  ) {
    return;
  }

  destroyStripePaymentElement();

  try {
    await loadStripeJs();
    stripeClient = window.Stripe(PAYMENT_CONFIG.stripe_publishable_key);

    const response = await fetch(API_ENDPOINTS.paymentIntent, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify({
        amount: SUBSCRIPTION_PRICE_SEK,
        site_id: currentSite.site_id || undefined,
        site_name: currentSite.name || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "Kunde inte starta Stripe-betalning.";
      toast(detail);
      return;
    }

    stripeClientSecret = data.client_secret;
    stripeIntentAmount = SUBSCRIPTION_PRICE_SEK;
    stripeElements = stripeClient.elements({
      clientSecret: stripeClientSecret,
      appearance: { theme: "stripe" },
    });
    stripePaymentElement = stripeElements.create("payment");
    stripePaymentElement.mount("#stripe-payment-element");
  } catch (error) {
    console.error("Stripe init failed:", error);
    toast("Kunde inte ladda Stripe-betalning.");
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

    const fallback = resolveDefaultApiBaseUrl();
    if (API_BASE_URL !== fallback) {
      persistApiBaseUrl(fallback);
      const input = document.getElementById("apiBaseUrlInput");
      if (input) {
        input.value = API_BASE_URL;
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
      } catch (retryError) {
        console.warn("API-fallback misslyckades:", retryError);
      }
    }

    const pageHost = window.location?.hostname || "";
    const onLocalPage = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (onLocalPage && API_BASE_URL !== DEFAULT_API_BASE_URL) {
      persistApiBaseUrl(DEFAULT_API_BASE_URL);
      const input = document.getElementById("apiBaseUrlInput");
      if (input) {
        input.value = API_BASE_URL;
      }

      try {
        const data = await probeApiConnection();
        const name = data.app || "API";
        updateApiStatusLabel(`OK – ${name} · ${API_BASE_URL} (bytte till localhost)`);
        if (!silent) {
          toast("Bytte till localhost – API svarar");
        }
        if (refreshGeo) refreshGeoFromApi();
        return true;
      } catch (retryError) {
        console.warn("API-localhost-fallback misslyckades:", retryError);
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

  window.setTimeout(() => {
    ensureApiConnection({ silent: true, refreshGeo: false });
  }, 100);
}

const currentSite = {
  site_id: null,
  api_site_id: null,
  name: "",
  distance_km: null,
  country: "",
  language: NEWSPAPER_LANG
};

function resolveSiteNameSync(site, targetLang = getActiveReaderLang()) {
  const localizedName = getUnescoSiteName(site, targetLang);
  if (localizedName) return localizedName;
  return (site?.name || "").trim();
}

function applyClosestSiteToUiSync(site) {
  if (!site) return;

  const distanceM = site.distance_m != null ? Number(site.distance_m) : null;
  const kmFormatted = formatDistanceKm(distanceM);
  const siteName = resolveSiteNameSync(site);

  lastClosestSite = site;
  currentSite.api_site_id = site.id ?? currentSite.api_site_id;
  currentSite.distance_km = kmFormatted;
  currentSite.name = siteName;
  if (site.country) currentSite.country = site.country;
  if (site.unesco_id) currentSite.site_id = String(site.unesco_id);

  const adName = document.getElementById("adSiteName");
  if (adName) {
    adName.textContent = siteName || site.name || "";
    adName.dataset.i18nDynamic = siteName || site.name ? "true" : "";
  }

  const title = document.getElementById("siteDetailTitle");
  if (title) {
    title.textContent = siteName || site.name || I18N_SV.LOADING_SITE;
    title.dataset.i18nDynamic = siteName || site.name ? "true" : "";
  }

  updateDistanceLabels();
}

function renderClosestSiteNow() {
  const site = findClosestSiteLocal(geoState.latitude, geoState.longitude);
  if (site) {
    applyClosestSiteToUiSync(site);
  }
}

function showGeoLoadingState() {
  const adName = document.getElementById("adSiteName");
  if (adName?.dataset.i18nDynamic === "true" && adName.textContent?.trim()) {
    return Promise.resolve();
  }
  const adPill = document.getElementById("heritageDistancePill");
  const title = document.getElementById("siteDetailTitle");
  const detailDist = document.getElementById("siteDetailDistance");
  const lang = getActiveReaderLang();

  const tasks = [];
  if (adName) tasks.push(setElementI18n(adName, I18N_SV.LOADING_CLOSEST, lang));
  if (adPill) tasks.push(setElementI18n(adPill, I18N_SV.LOADING_DISTANCE, lang));
  if (title) tasks.push(setElementI18n(title, I18N_SV.LOADING_SITE, lang));
  if (detailDist) tasks.push(setElementI18n(detailDist, I18N_SV.LOADING_DISTANCE, lang));
  return Promise.all(tasks).catch(() => {});
}

async function refreshGeoUiSafeguard() {
  if (lastClosestSite) {
    await refreshClosestSiteTextOnly(lastClosestSite, getActiveReaderLang());
    return;
  }
  if (LOCAL_HERITAGE_SITES.length > 0) {
    await refreshGeoFromApi();
  }
}

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
    adPill.dataset.i18nDynamic = kmValue != null ? "true" : "";
  }
  if (detailDist) {
    detailDist.textContent = detailText;
    detailDist.dataset.i18nSource = detailText;
    detailDist.dataset.i18nDynamic = kmValue != null ? "true" : "";
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
    updateDistanceLabels();
    await translateDistanceLabels(target);
  }
}

async function applyClosestSiteToUi(site) {
  if (!site) return;

  applyClosestSiteToUiSync(site);

  const seq = ++applySiteUiSeq;
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

  currentSite.name = siteName;

  const adName = document.getElementById("adSiteName");
  if (adName) {
    adName.textContent = siteName || "";
    if (siteName) {
      adName.dataset.i18nDynamic = "true";
    } else {
      delete adName.dataset.i18nDynamic;
      adName.textContent = I18N_SV.LOADING_CLOSEST;
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
      title.textContent = I18N_SV.LOADING_SITE;
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

  const lang = getActiveReaderLang();
  if (lang !== "sv") {
    await translateDistanceLabels(lang);
  }
}

async function refreshGeoFromApi() {
  refreshGeoTail = refreshGeoTail
    .then(() => refreshGeoFromApiOnce())
    .catch(error => {
      console.error("Geo-uppdatering misslyckades:", error);
    });
  return refreshGeoTail;
}

async function refreshGeoFromApiOnce() {
  if (LOCAL_HERITAGE_SITES.length === 0) {
    await loadHeritageSites();
  }

  const lat = geoState.latitude;
  const lng = geoState.longitude;
  const site = findClosestSiteLocal(lat, lng);
  if (!site) return;

  applyClosestSiteToUiSync(site);
  await applyClosestSiteToUi(site);
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

function loadPersistedDemoPosition() {
  try {
    return sessionStorage.getItem(DEMO_POSITION_STORAGE_KEY) || "";
  } catch (_) {
    return "";
  }
}

function persistDemoPosition(value) {
  try {
    if (value) {
      sessionStorage.setItem(DEMO_POSITION_STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(DEMO_POSITION_STORAGE_KEY);
    }
  } catch (_) {
    /* ignore */
  }
}

function restoreDemoPositionSelects(value = loadPersistedDemoPosition()) {
  const select = document.getElementById("testPositionSelect");
  const selectDemo = document.getElementById("testPositionSelectDemo");
  if (select) select.value = value || "";
  if (selectDemo) selectDemo.value = value || "";
}

function applyTestPosition(value) {
  const select = document.getElementById("testPositionSelect");
  const selectDemo = document.getElementById("testPositionSelectDemo");
  if (select) select.value = value || "";
  if (selectDemo) selectDemo.value = value || "";
  persistDemoPosition(value || "");

  if (!value) {
    stopGeoWatch();
    startGeoWatch();
    renderClosestSiteNow();
    void refreshGeoFromApi();
    return;
  }

  stopGeoWatch();
  const [lat, lng] = value.split(",").map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn("Ogiltig demo-plats:", value);
    return;
  }

  setGeoCoords(lat, lng, "test");
  renderClosestSiteNow();
  void refreshGeoFromApi();
  void reportLocationToApi();
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

function readUrlStep() {
  const params = new URLSearchParams(window.location.search);
  const step = (params.get("step") || "").trim().toLowerCase();
  if (step === "profile") {
    return "confirmation";
  }
  return step;
}

function readUrlLang() {
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || "").trim();
  if (!lang) return null;
  const normalized = normalizeLanguageCode(lang);
  return isValidLanguageCode(normalized) ? normalized : null;
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
    const lang = getActiveReaderLang();
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
  void reportLocationToApi();
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
  if (geoState.source !== "test" && geoState.source !== "url") {
    setGeoCoords(DEFAULT_GEO.latitude, DEFAULT_GEO.longitude, "default");
  }

  if (!navigator.geolocation) {
    if (geoState.source !== "test" && geoState.source !== "url") {
      void refreshGeoFromApi();
    }
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
  if (geoState.source === "test" || geoState.source === "url") {
    return;
  }
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

async function setElementI18n(element, svText, lang = getActiveReaderLang()) {
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
  const target = normalizeLanguageCode(lang || "sv");
  const label = document.getElementById("heritageLangLabel");
  if (label) {
    label.textContent = getLanguageDisplayName(target);
  }
}

async function changeDemoLanguage(lang) {
  const target = normalizeLanguageCode(lang || "sv");
  if (!isValidLanguageCode(target)) {
    toast("Ogiltig språkkod – använd två bokstäver (ISO 639-1), t.ex. ja, hi, uk.");
    return;
  }
  syncDemoLanguageSelectToLang(target);
  document.documentElement.lang = target;
  await applyReaderLanguage(target);
  if (getActiveReaderLang() !== target) return;
  await refreshGeoUiSafeguard();
}

function initDemoLanguageSelect() {
  const select = document.getElementById("demoLanguageSelect");
  if (!select) return;

  rebuildLanguageSelect(select, getNewspaperLang());
  syncDemoLanguageSelectToLang(getNewspaperLang());

  select.addEventListener("change", () => {
    if (!select.value) return;
    changeDemoLanguage(select.value).catch(error => {
      console.error("Språkbyte misslyckades:", error);
    });
  });
}

function initGeoDemoControls() {
  const demoSelect = document.getElementById("testPositionSelectDemo");
  const topSelect = document.getElementById("testPositionSelect");
  restoreDemoPositionSelects();

  demoSelect?.addEventListener("change", event => {
    applyTestPosition(event.target.value);
  });
  topSelect?.addEventListener("change", event => {
    applyTestPosition(event.target.value);
  });
}

function buildTranslationMapSync(uniqueSources, target, source = "sv") {
  const map = {};
  const pending = [];

  if (target === source) {
    for (const text of uniqueSources) {
      map[text] = text;
    }
    return { map, pending };
  }

  for (const text of uniqueSources) {
    if (!text?.trim()) {
      map[text] = text;
      continue;
    }
    const cacheKey = `${source}|${target}|${text}`;
    if (translateCache.has(cacheKey)) {
      map[text] = translateCache.get(cacheKey);
      continue;
    }
    const offline = resolveI18nText(text, target);
    if (offline) {
      translateCache.set(cacheKey, offline);
      map[text] = offline;
      continue;
    }
    pending.push(text);
  }

  return { map, pending };
}

function isActiveReaderLanguageTarget(target) {
  return getActiveReaderLang() === normalizeLanguageCode(target);
}

function applyTranslationMapToElements(elements, translatedMap) {
  elements.forEach(el => {
    if (el.dataset.i18nDynamic === "true") return;
    const source = getI18nSource(el);
    if (Object.prototype.hasOwnProperty.call(translatedMap, source)) {
      el.textContent = translatedMap[source];
    }
  });
}

async function applyDynamicLanguageContent(target) {
  updateTodayDate();
  if (target === "sv") {
    updateDistanceLabels();
  } else {
    updateDistanceLabels();
    await translateDistanceLabels(target);
  }
  if (lastClosestSite) {
    await refreshClosestSiteTextOnly(lastClosestSite, target);
  } else {
    await showGeoLoadingState();
  }

  if (document.getElementById("confirmation")?.classList.contains("active")) {
    await updateConfirmationMessage();
    syncSettingsChannelButtons();
  }
  if (document.getElementById("subscribe")?.classList.contains("active")) {
    updateContactField();
  }
  if (document.getElementById("payment")?.classList.contains("active")) {
    await updatePaymentProviderUi();
    await updatePriceSummaryBox();
  }
}

function setTranslationLoading(active) {
  document.body.classList.toggle("is-translating", active);
  const loader = document.getElementById("translationLoader");
  if (!loader) return;
  loader.hidden = !active;
  loader.setAttribute("aria-hidden", active ? "false" : "true");
}

function isTermsAccepted() {
  return document.getElementById("termsAccepted")?.checked === true;
}

async function applyReaderLanguage(lang) {
  const target = (lang || getActiveReaderLang()).toLowerCase().slice(0, 2);
  const seq = ++applyReaderLanguageSeq;
  currentSite.language = target;
  document.documentElement.lang = target;
  captureI18nSources();
  syncReaderLanguageUi(target);
  document.documentElement.dir = RTL_LANGS.has(target) ? "rtl" : "ltr";
  setTranslationLoading(true);

  try {
    await applyDynamicLanguageContent(target);
    if (!isActiveReaderLanguageTarget(target)) return;

    const elements = Array.from(document.querySelectorAll("[data-i18n]"))
      .filter(el => el.dataset.i18nDynamic !== "true");

    const uniqueSources = [...new Set(elements.map(el => getI18nSource(el)).filter(Boolean))];
    const { map: translatedMap, pending } = buildTranslationMapSync(uniqueSources, target, "sv");
    applyTranslationMapToElements(elements, translatedMap);

    const placeholderEls = document.querySelectorAll("[data-i18n-placeholder]");
    const placeholderSources = [...new Set(
      Array.from(placeholderEls).map(el => el.dataset.i18nPlaceholderSource || el.getAttribute("placeholder") || "")
    )].filter(Boolean);
    const { map: placeholderMap, pending: pendingPlaceholders } =
      buildTranslationMapSync(placeholderSources, target, "sv");

    placeholderEls.forEach(el => {
      const source = el.dataset.i18nPlaceholderSource || el.getAttribute("placeholder") || "";
      if (Object.prototype.hasOwnProperty.call(placeholderMap, source)) {
        el.setAttribute("placeholder", placeholderMap[source]);
      }
    });

    if (pending.length > 0 && isActiveReaderLanguageTarget(target)) {
      const apiMap = await translateBatchMap(pending, target, "sv");
      if (isActiveReaderLanguageTarget(target)) {
        Object.assign(translatedMap, apiMap);
        applyTranslationMapToElements(elements, translatedMap);
      }
    }

    if (pendingPlaceholders.length > 0 && isActiveReaderLanguageTarget(target)) {
      const apiPlaceholders = await translateBatchMap(pendingPlaceholders, target, "sv");
      if (isActiveReaderLanguageTarget(target)) {
        Object.assign(placeholderMap, apiPlaceholders);
        placeholderEls.forEach(el => {
          const source = el.dataset.i18nPlaceholderSource || el.getAttribute("placeholder") || "";
          el.setAttribute("placeholder", placeholderMap[source] || source);
        });
      }
    }

    if (isActiveReaderLanguageTarget(target)) {
      await updateModalProgressTitle(target);
    }
  } catch (error) {
    console.error("Språkbyte misslyckades:", error);
  } finally {
    if (isActiveReaderLanguageTarget(target) && seq === applyReaderLanguageSeq) {
      setTranslationLoading(false);
    }
  }
}

async function updateModalProgressTitle(targetLang = getActiveReaderLang()) {
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
      await prepareStripePaymentStep();
    }
    await updateModalProgressTitle(getActiveReaderLang());

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
  destroyStripePaymentElement();
  updatePriceSummaryBox();
  if (document.getElementById("payment")?.classList.contains("active")) {
    prepareStripePaymentStep().catch(error => console.error("Stripe reload failed:", error));
  }
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
    if (PAYMENT_CONFIG.demo_use_mock) {
      await setElementI18n(
        stripeHint,
        "Demo-betalning: ange valfritt testkortnummer (t.ex. 4242 4242 4242 4242) – ingen riktig debitering."
      );
    } else if (PAYMENT_CONFIG.stripe_enabled) {
      const svText = PAYMENT_CONFIG.stripe_sandbox
        ? "Stripe testläge – riktiga kort fungerar inte. Testkort: 4242 4242 4242 4242, valfritt datum/CVC."
        : "Stripe – ange kortuppgifter nedan.";
      await setElementI18n(stripeHint, svText);
    } else {
      stripeHint.textContent =
        "Mock-betalning i demo. Sätt PAYMENT_PROVIDER=stripe och STRIPE_SECRET_KEY i .env för riktig sandbox.";
    }
  }

  const mockFields = document.getElementById("mockPaymentFields");
  const stripeMount = document.getElementById("stripePaymentMount");
  if (mockFields && stripeMount) {
    if (PAYMENT_CONFIG.stripe_enabled) {
      mockFields.setAttribute("hidden", "");
      stripeMount.removeAttribute("hidden");
    } else {
      mockFields.removeAttribute("hidden");
      stripeMount.setAttribute("hidden", "");
    }
  }
}

function isDemoWebapp() {
  const path = window.location.pathname || "";
  return path.includes("/demo") || path.endsWith("/index.html") || path === "/";
}

function shouldSimulateTravelForGeofencing() {
  return isDemoWebapp() || geoState.source === "test" || geoState.source === "url";
}

function normalizePhoneForApi(phone) {
  let value = String(phone || "").trim().replace(/[\s-]/g, "");
  if (!value) return "";
  if (value.startsWith("0") && value.length >= 9) {
    value = `+46${value.slice(1)}`;
  }
  if (!value.startsWith("+")) {
    value = `+${value}`;
  }
  return value;
}

function buildPreferencesPayload(extra = {}) {
  const phone = prototypeState.phone ? normalizePhoneForApi(prototypeState.phone) : undefined;
  return {
    user_id: prototypeState.user_id,
    phone: phone || undefined,
    email: prototypeState.email || undefined,
    ...extra,
  };
}

function getLocationReportPhone() {
  const phone = normalizePhoneForApi(prototypeState.phone || "");
  if (!phone || isPlaceholderContact(phone) || phone === "bankid-user") {
    return null;
  }
  return phone;
}

function describeGeofencingSkipReason(reason) {
  switch (reason) {
    case "already_notified":
      return "Du har redan fått SMS om denna plats – välj t.ex. Engelsberg i Demo-plats.";
    case "in_commute_zone":
      return "Du är i hemzonen – byt Demo-plats till Falun eller Engelsberg.";
    case "home_registered":
      return "Hemposition registrerad – byt Demo-plats för att trigga världsarv-SMS.";
    case "no_nearby_site":
      return "Inget världsarv inom 30 km – välj Falun i Demo-plats.";
    case "no_active_subscription":
      return "Prenumerationen är inte aktiv – betala klart först.";
    case "sms_delivery_failed":
      return "SMS kunde inte skickas – kontrollera HelloSMS-inställningarna.";
    default:
      return null;
  }
}

async function reportLocationToApi() {
  const phone = getLocationReportPhone();
  if (!phone || !prototypeState.subscription_active) return;
  if (geoState.latitude == null || geoState.longitude == null) return;

  const payload = {
    phoneNo: phone,
    latitude: geoState.latitude,
    longitude: geoState.longitude,
    simulate_travel: shouldSimulateTravelForGeofencing(),
  };

  try {
    const response = await fetch(API_ENDPOINTS.locationUpdate, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      console.warn("location/update:", data);
      return;
    }
    if (data.notified && data.nearest_site?.name) {
      toast(`SMS skickat – du är nära ${data.nearest_site.name}.`);
      if (data.nearest_site.unesco_id || data.nearest_site.id) {
        const siteId = String(data.nearest_site.unesco_id || data.nearest_site.id);
        if (!prototypeState.visited_sites.includes(siteId)) {
          prototypeState.visited_sites.push(siteId);
        }
      }
    } else if (data.reason === "sms_delivery_failed") {
      toast(describeGeofencingSkipReason(data.reason));
    } else if (data.reason === "cooldown") {
      console.debug("Geofencing-SMS väntar på cooldown – försöker igen om 65 sekunder.");
      window.setTimeout(() => {
        if (prototypeState.subscription_active) {
          void reportLocationToApi();
        }
      }, 65000);
    } else {
      const hint = describeGeofencingSkipReason(data.reason);
      if (hint) {
        toast(hint);
      } else if (data.reason) {
        console.debug("location/update:", data.reason);
      }
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

  if (paymentFields.payment_intent_id) {
    payload.amount = paymentFields.amount;
    payload.payment_intent_id = paymentFields.payment_intent_id;
  } else if (paymentFields.amount && paymentFields.card_type && paymentFields.card_number) {
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
  if (!isTermsAccepted()) {
    toast("Du måste godkänna villkoren och integritetspolicyn.");
    return;
  }

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
    prototypeState.phone = normalizePhoneForApi(contactValue);
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
    toast("Ange ett giltigt mobilnummer (t.ex. +46761104465).");
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

    prototypeState.phone = normalizePhoneForApi(phone);
    prototypeState.channel = "sms";
    prototypeState.user_id = data.user_id || normalizePhoneForApi(phone);
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

  const phone = prototypeState.phone || "";
  return phone ? normalizePhoneForApi(phone) : "";
}

function getChannelLabel() {
  return prototypeState.channel === "email" ? "e-post" : "SMS";
}

async function updateConfirmationMessage(extra) {
  const confirmationMessage = document.getElementById("confirmationMessage");

  if (!confirmationMessage) return;

  let text =
    prototypeState.channel === "email"
      ? "En bekräftelse har skickats via e-post."
      : "En bekräftelse har skickats via SMS.";
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
    channel: prototypeState.channel,
    to: getRecipientValue(),
    message: "Din Heritage Connect-prenumeration är nu aktiv. Du får nu notiser om världsarv nära dig.",
    subject: "Din Heritage Connect-prenumeration är aktiv",
    user_id: prototypeState.user_id,
  };

  logApiPayload(
    "Bekräftelse via vald notiskanal",
    API_ENDPOINTS.notificationSend,
    confirmationPayload
  );

  sendToApi(API_ENDPOINTS.notificationSend, confirmationPayload);

  return confirmationPayload;
}

async function completeSubscriptionAfterPayment(paymentFields) {
  const paymentPayload = buildSubscriptionCreatePayload(paymentFields);

  logApiPayload(
    "Betalning och prenumeration",
    API_ENDPOINTS.createSubscription,
    paymentPayload
  );

  const response = await fetch(API_ENDPOINTS.createSubscription, {
    method: "POST",
    headers: apiRequestHeaders(),
    body: JSON.stringify(paymentPayload),
  });

  let data = {};
  const raw = await response.text();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (!response.ok) {
        toast(`Betalning misslyckades: ${raw.slice(0, 200) || response.statusText}`);
        return false;
      }
    }
  }

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : data.detail?.message || JSON.stringify(data.detail || data) || response.statusText;
    toast(`Betalning misslyckades: ${detail}`);
    return false;
  }

  prototypeState.payment_provider = PAYMENT_CONFIG.stripe_enabled ? "stripe" : "mock";
  prototypeState.subscription_active = Boolean(data.subscription_active);
  prototypeState.user_id = data.user_id || prototypeState.user_id;
  if (prototypeState.channel === "sms" && data.user_id) {
    prototypeState.phone = normalizePhoneForApi(data.user_id);
  }
  prototypeState.last_subscription = data;

  updateConfirmationMessage({
    receipt_sent: data.receipt_sent,
    end_date: data.end_date,
  });
  syncSettingsChannelButtons();
  openModalStep("confirmation");
  toast("Betalning genomförd. Prenumerationen är aktiv.");

  startLocationReporting();
  window.setTimeout(() => {
    if (prototypeState.subscription_active) {
      void reportLocationToApi();
    }
  }, 2500);
  return true;
}

async function paymentComplete() {
  if (!isTermsAccepted()) {
    toast("Du måste godkänna villkoren och integritetspolicyn.");
    openModalStep("subscribe");
    return;
  }

  const receiptEmail = document.getElementById("paymentReceiptEmail")?.value.trim();
  const submitBtn = document.getElementById("paymentSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Betalar…";
  }

  try {
    if (PAYMENT_CONFIG.stripe_enabled) {
      if (!stripeClient || !stripeElements || !stripeClientSecret) {
        toast("Stripe laddas – försök igen om ett ögonblick.");
        await prepareStripePaymentStep();
        return;
      }

      const { error: submitError } = await stripeElements.submit();
      if (submitError) {
        toast(formatStripePaymentError(submitError));
        return;
      }

      const result = await stripeClient.confirmPayment({
        elements: stripeElements,
        clientSecret: stripeClientSecret,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              email: receiptEmail || undefined,
            },
          },
        },
      });

      if (result.error) {
        toast(formatStripePaymentError(result.error));
        return;
      }

      const paymentIntent = result.paymentIntent;
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        toast("Betalningen kunde inte bekräftas.");
        return;
      }

      await ensureApiConnection({ silent: true });
      await completeSubscriptionAfterPayment({
        amount: SUBSCRIPTION_PRICE_SEK,
        payment_intent_id: paymentIntent.id,
        email: receiptEmail || undefined,
      });
      return;
    }

    await ensureApiConnection({ silent: true });

    const cardTypeChoice = getSelectedChoice("paymentCardType");
    const cardType = cardTypeChoice?.includes("master") ? "mastercard" : "visa";
    const cardNumber = (
      document.getElementById("paymentCardNumber")?.value || ""
    ).replace(/\s/g, "");

    if (!cardNumber || cardNumber.length < 12) {
      toast("Ange ett giltigt kortnummer (test).");
      return;
    }

    await completeSubscriptionAfterPayment({
      amount: SUBSCRIPTION_PRICE_SEK,
      card_type: cardType,
      card_number: cardNumber,
      email: receiptEmail || undefined,
    });
  } catch (error) {
    console.warn("Prenumeration/betalning misslyckades:", error);
    const msg = error?.message || String(error);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      toast("Kunde inte nå API – kontrollera att servern körs och att API-adressen stämmer.");
      await ensureApiConnection({ silent: false });
    } else {
      toast(`Betalning misslyckades: ${msg}`);
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Betala och starta prenumeration";
      updatePaymentProviderUi().catch(() => {});
    }
  }
}

function previewNotificationPayload() {
  const toValue = prototypeState.channel === "email"
    ? prototypeState.email
    : prototypeState.phone;

  const notificationPayload = {
    channel: prototypeState.channel,
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
      const err = result.error || "okänt fel";
      if (err === "invalid_recipient") {
        toast("API-fel: ogiltigt mobilnummer – använd format +46761104465");
      } else {
        toast(`API-fel: ${err}`);
      }
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

async function askForMissingContact(channel) {
  const lang = getActiveReaderLang();

  if (channel === "email") {
    const promptText = await translateUiText(
      "För att byta till e-postnotiser behöver du ange en e-postadress.",
      lang
    );
    const email = window.prompt(promptText);

    if (!email || !email.includes("@") || isPlaceholderContact(email)) {
      toast(await translateUiText("E-postnotiser kräver en giltig e-postadress.", lang));
      return false;
    }

    prototypeState.email = email.trim();
    return true;
  }

  const promptText = await translateUiText(
    "För att byta till SMS-notiser behöver du ange ett mobilnummer.",
    lang
  );
  const phone = window.prompt(promptText);

  if (!phone || phone.trim().length < 5 || isPlaceholderContact(phone)) {
    toast(await translateUiText("SMS-notiser kräver ett mobilnummer.", lang));
    return false;
  }

  prototypeState.phone = normalizePhoneForApi(phone.trim());
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
    const contactWasAdded = await askForMissingContact(channel);

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

  const channelText =
    channel === "email" ? "Notiskanal uppdaterad till E-postnotiser." : "Notiskanal uppdaterad till SMS-notiser.";
  toast(await translateUiText(channelText, getActiveReaderLang()));
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

function hideBankIdStatusPanel() {
  const panel = document.getElementById("bankidStatusPanel");
  const qrImage = document.getElementById("bankidQrImage");
  const launchLink = document.getElementById("bankidLaunchLink");
  if (panel) panel.setAttribute("hidden", "");
  if (qrImage) qrImage.setAttribute("hidden", "");
  if (launchLink) launchLink.setAttribute("hidden", "");
}

function showBankIdStatusPanel(message, { launchUrl = null, showQr = false } = {}) {
  const panel = document.getElementById("bankidStatusPanel");
  const statusText = document.getElementById("bankidStatusText");
  const launchLink = document.getElementById("bankidLaunchLink");
  const qrImage = document.getElementById("bankidQrImage");

  if (statusText && message) {
    statusText.textContent = message;
  }
  if (panel) panel.removeAttribute("hidden");

  if (launchLink && launchUrl) {
    launchLink.href = launchUrl;
    launchLink.removeAttribute("hidden");
  } else if (launchLink) {
    launchLink.setAttribute("hidden", "");
  }

  if (qrImage) {
    if (showQr) {
      qrImage.removeAttribute("hidden");
    } else {
      qrImage.setAttribute("hidden", "");
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function pollBankIdCollect(orderRef, { maxAttempts = 90, intervalMs = 2000 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(API_ENDPOINTS.bankidCollect, {
      method: "POST",
      headers: apiRequestHeaders(),
      body: JSON.stringify({ order_ref: orderRef }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(await readApiError(response, data));
    }

    if (data.status === "complete") {
      return data;
    }
    if (data.status === "failed") {
      throw new Error(data.error || "BankID avbröts");
    }

    const statusText = document.getElementById("bankidStatusText");
    if (statusText) {
      const hint = data.hint_code ? ` (${data.hint_code})` : "";
      statusText.textContent = `Väntar på BankID…${hint}`;
    }

    await sleep(intervalMs);
  }

  throw new Error("BankID tog för lång tid – försök igen.");
}

async function refreshBankIdQr(orderRef) {
  const qrImage = document.getElementById("bankidQrImage");
  if (!qrImage) return;

  const response = await fetch(
    `${API_ENDPOINTS.bankidQr}?order_ref=${encodeURIComponent(orderRef)}`,
    { headers: apiRequestHeaders() }
  );
  if (!response.ok) return;

  const data = await response.json();
  if (!data.qr_content) return;

  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.qr_content)}`;
}

function finishBankIdLogin(data) {
  prototypeState.phone = "";
  prototypeState.email = "";
  prototypeState.channel = "sms";
  prototypeState.user_id = data.user_id || "bankid_user";
  prototypeState.access_token = data.access_token || null;
  prototypeState.subscription_active = true;
  hideBankIdStatusPanel();
  updateConfirmationMessage();
  syncSettingsChannelButtons();
  openModalStep("confirmation");
  startLocationReporting();
  toast(data.name ? `Inloggad via BankID som ${data.name}.` : "Inloggad via BankID.");
}

async function loginWithBankId() {
  const btn = document.querySelector(".bankid-btn");
  let qrTimer = null;

  if (btn) {
    btn.disabled = true;
    await setElementI18n(btn, I18N_SV.BANKID_WAIT);
  }

  hideBankIdStatusPanel();

  try {
    const startRes = await fetch(API_ENDPOINTS.bankidStart, {
      method: "POST",
      headers: apiRequestHeaders(),
    });
    const startData = await startRes.json();

    if (!startRes.ok) {
      toast(startData.error || "BankID kunde inte startas.");
      return;
    }

    if (startData.mock) {
      showBankIdStatusPanel(
        startData.message || "BankID demo – skanna QR-koden.",
        { showQr: true }
      );
    } else {
      showBankIdStatusPanel(
        startData.message || "Öppna BankID-appen och godkänn inloggningen.",
        {
          launchUrl: startData.bankid_launch_url,
          showQr: true,
        }
      );

      if (startData.bankid_launch_url) {
        window.open(startData.bankid_launch_url, "_blank", "noopener,noreferrer");
      }
    }

    await refreshBankIdQr(startData.order_ref);
    qrTimer = window.setInterval(() => {
      refreshBankIdQr(startData.order_ref).catch(() => {});
    }, 1000);

    const pollIntervalMs = startData.mock ? 1000 : 2000;
    const result = await pollBankIdCollect(startData.order_ref, { intervalMs: pollIntervalMs });
    finishBankIdLogin(result);
  } catch (error) {
    console.warn("BankID misslyckades:", error);
    hideBankIdStatusPanel();
    toast(error?.message || "BankID-inloggning misslyckades.");
  } finally {
    if (qrTimer) {
      clearInterval(qrTimer);
    }
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
  const localeMap = {
    sv: "sv-SE", fi: "fi-FI", ar: "ar-SA", en: "en-GB", de: "de-DE",
    fr: "fr-FR", es: "es-ES", no: "nb-NO", nb: "nb-NO", nn: "nb-NO",
    da: "da-DK", ja: "ja-JP", ko: "ko-KR", pt: "pt-PT", it: "it-IT",
    nl: "nl-NL", pl: "pl-PL", ru: "ru-RU", zh: "zh-CN", hi: "hi-IN",
    tr: "tr-TR", uk: "uk-UA", vi: "vi-VN", th: "th-TH", el: "el-GR",
    he: "he-IL", cs: "cs-CZ", hu: "hu-HU", ro: "ro-RO", id: "id-ID"
  };
  const lang = normalizeLanguageCode(getActiveReaderLang());
  let locale = localeMap[lang];
  if (!locale) {
    try {
      locale = Intl.getCanonicalLocales(lang)[0] || lang;
    } catch (_) {
      locale = lang;
    }
  }

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
  const urlPos = readUrlPosition();
  const urlSiteRef = readUrlSiteRef();
  const urlLang = readUrlLang();

  if (urlLang) {
    syncDemoLanguageSelectToLang(urlLang);
  }

  if (urlPos) {
    stopGeoWatch();
    setGeoCoords(urlPos.latitude, urlPos.longitude, "url");
    syncDemoPositionSelect(urlPos.latitude, urlPos.longitude);
  } else {
    const persistedDemoPosition = loadPersistedDemoPosition();
    if (persistedDemoPosition) {
      applyTestPosition(persistedDemoPosition);
    } else {
      initGeoPrototype();
    }
  }

  renderClosestSiteNow();
  void loadHeritageSites().then(() => refreshGeoFromApi());
  await refreshGeoFromApi();

  if (urlSiteRef) {
    await applySiteFromRef(urlSiteRef);
  }

  void loadConfig();
  captureI18nSources();
  await refreshGeoUiSafeguard();
  const finalLang = getActiveReaderLang();
  if (finalLang !== "sv") {
    await applyReaderLanguage(finalLang);
  } else {
    syncReaderLanguageUi("sv");
  }

  const urlStep = readUrlStep();
  if (urlStep === "confirmation") {
    openServiceModal("confirmation");
  }
}

renderClosestSiteNow();
initApiSettings();
initGeoDemoControls();
initDemoLanguageSelect();
bootstrapApp().catch(error => {
  console.error("Initiering misslyckades:", error);
  syncReaderLanguageUi(getNewspaperLang());
  renderClosestSiteNow();
  void refreshGeoFromApi();
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
window.changeDemoLanguage = changeDemoLanguage;
window.refreshGeoFromApi = refreshGeoFromApi;
window.bootstrapApp = bootstrapApp;
window.applyTestPosition = applyTestPosition;
window.loginWithBankId = loginWithBankId;
window.togglePolicy = togglePolicy;
window.selectDuration = selectDuration;
