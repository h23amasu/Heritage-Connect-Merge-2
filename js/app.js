/* ==============================
   Heritage Connect – frontend-prototyp
   API-förberedd version
   ============================== */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
/** Tidigare standard-ngrok – migreras till localhost vid laddning */
const LEGACY_DEFAULT_API_BASE_URL = "https://fling-sneer-margarita.ngrok-free.dev";
const API_BASE_STORAGE_KEY = "heritage_connect_api_base_url";
const DEMO_POSITION_STORAGE_KEY = "heritage_connect_demo_position";
const READER_LANG_STORAGE_KEY = "heritage_connect_reader_lang";
const API_TOKEN = "hemlig-nyckel";

/** Standard vid sidladdning: `<html lang="…">` i index.html (ISO 639-1, t.ex. sv, ja, hi). */
function getNewspaperLang() {
  return normalizeLanguageCode(document.documentElement.lang || "sv");
}

/** Aktivt tidningsspråk (dropdown-val eller html lang efter omladdning). */
let preferredReaderLang = null;

function getActiveReaderLang() {
  const select = document.getElementById("demoLanguageSelect");
  if (select?.value && isValidLanguageCode(select.value)) {
    const fromSelect = normalizeLanguageCode(select.value);
    preferredReaderLang = fromSelect;
    return fromSelect;
  }
  if (preferredReaderLang && isValidLanguageCode(preferredReaderLang)) {
    return normalizeLanguageCode(preferredReaderLang);
  }
  try {
    const stored = sessionStorage.getItem(READER_LANG_STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return normalizeLanguageCode(stored);
    }
  } catch (_) {
    /* private mode */
  }
  const htmlLang = document.documentElement.lang;
  if (htmlLang && isValidLanguageCode(htmlLang)) {
    return normalizeLanguageCode(htmlLang);
  }
  return getNewspaperLang();
}

function syncDemoLanguageSelectToLang(lang) {
  const select = document.getElementById("demoLanguageSelect");
  const target = normalizeLanguageCode(lang || getNewspaperLang());
  preferredReaderLang = isValidLanguageCode(target) ? target : "sv";

  try {
    sessionStorage.setItem(READER_LANG_STORAGE_KEY, preferredReaderLang);
  } catch (_) {
    /* ignore */
  }

  if (!select) return preferredReaderLang;

  ensureLanguageOption(select, preferredReaderLang);
  select.dataset.selectedLang = preferredReaderLang;
  document.documentElement.lang = preferredReaderLang;
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
    "Heritage Connect samlar in ditt mobilnummer och/eller din e-postadress, samt din position, med ditt samtycke. Uppgifterna används för att skicka notiser om UNESCO-världsarv när du befinner dig i närheten av ett objekt.":
      "Heritage Connect collects your mobile number and/or email address, and your location, with your consent. The data is used to send notifications about UNESCO world heritage when you are near a site.",
    "Din position används enbart för geofencing – att avgöra när du är tillräckligt nära ett världsarv för att få ett meddelande. Vi använder inte platsdata för reklam eller annan spårning.":
      "Your location is only used for geofencing – to determine when you are close enough to a world heritage site to receive a message. We do not use location data for advertising or other tracking.",
    "Medan prenumerationen är aktiv kan vi spara en ungefärlig hemposition och din senaste position för att undvika upprepade notiser i vardagen (t.ex. vid pendling). Dessa uppgifter används inte för andra syften.":
      "While your subscription is active, we may store an approximate home location and your last known position to avoid repeated notifications in everyday situations (e.g. commuting). This data is not used for other purposes.",
    "Du kan när som helst avsluta prenumerationen i din profil. Efter avslut skickas inga fler notiser. Vill du radera dina uppgifter helt kan du begära det via din tidning eller Heritage Connect-support.":
      "You can cancel your subscription at any time in your profile. After cancellation, no further notifications are sent. To request full deletion of your data, contact your newspaper or Heritage Connect support.",
    "Betalningsinformation hanteras av Stripe och lagras inte av Heritage Connect. SMS och e-post skickas via HelloSMS respektive SendGrid. Tjänsten driftas på servrar hos Railway.":
      "Payment information is handled by Stripe and is not stored by Heritage Connect. SMS and email are sent via HelloSMS and SendGrid respectively. The service is hosted on servers at Railway.",
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
    "Koden skickas till ditt mobilnummer och gäller i 5 minuter.":
      "The code is sent to your mobile number and is valid for 5 minutes.",
    "Logga in": "Log in",
    "eller via e-postkod (utlandet)": "or via email code (international)",
    "Ange din registrerade e-postadress.": "Enter your registered email address.",
    "Skicka e-postkod": "Send email code",
    "Engångskod via e-post": "One-time code via email",
    "Utveckling: efter \"Skicka e-postkod\" är koden 123456.":
      "Development: after \"Send email code\" the code is 123456.",
    "Koden skickas till din e-post och gäller i 5 minuter.":
      "The code is sent to your email and is valid for 5 minutes.",
    "Logga in med e-post": "Log in with email",
    "Betala prenumeration": "Pay for subscription",
    "Sammanfattning innan betalning.": "Summary before payment.",
    "Prenumeration: SMS om världsarv nära dig": "Subscription: SMS about world heritage near you",
    "Pris: 99 SEK (engångsbetalning, ingen auto-förnyelse – SMS-påminnelse skickas 3 dagar innan utgång)":
      "Price: 99 SEK (one-time payment, no auto-renewal – you must pay again to continue after the period ends)",
    "Pris: 99 SEK (engångsbetalning – du betalar igen manuellt när perioden löper ut, ingen auto-förnyelse)":
      "Price: 99 SEK (one-time payment – you pay again manually when the period ends, no auto-renewal)",
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
    "Stripe testläge – riktiga kort fungerar inte. Testkort: 4242 4242 4242 4242, valfritt datum/CVC.":
      "Stripe test mode – real cards do not work. Test card: 4242 4242 4242 4242, any future date/CVC.",
    "Stripe – ange kortuppgifter nedan.":
      "Stripe – enter card details below.",
    "E-post för bekräftelse och OwnTracks": "Email for confirmation and OwnTracks",
    "E-post för bekräftelse (samma som prenumeration)": "Email for confirmation (same as subscription)",
    "Alla får bekräftelse via e-post med kvitto och instruktioner för OwnTracks-appen (GPS i bakgrunden).":
      "Everyone receives email confirmation with receipt and OwnTracks app instructions (background GPS).",
    "Bekräftelse med OwnTracks-instruktioner har skickats till din e-post.":
      "Confirmation with OwnTracks instructions was sent to your email.",
    " Du fick även ett kort SMS.": " You also received a short SMS.",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Enter an email address for confirmation and OwnTracks instructions.",
    "Betala med Stripe (demo)": "Pay with Stripe (demo)",
    "Betala och starta prenumeration": "Pay and start subscription",
    "Betalar…": "Paying…",
    "Tack för din prenumeration. Prenumerationen är nu aktiv.":
      "Thank you for your subscription. Your subscription is now active.",
    "En bekräftelse skickas till vald notiskanal.": "A confirmation will be sent to your chosen notification channel.",
    "NOTISKANAL": "NOTIFICATION CHANNEL",
    "Ändra kontaktuppgifter": "Change contact details",
    "E-postadress": "Email address",
    "Spara kontaktuppgifter": "Save contact details",
    "Kontaktuppgifter sparade.": "Contact details saved.",
    "Ange ett giltigt mobilnummer.": "Enter a valid mobile number.",
    "Ange en giltig e-postadress.": "Enter a valid email address.",
    "Mobilnummeret används redan.": "This mobile number is already in use.",
    "Inga ändringar att spara.": "No changes to save.",
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
    "Aktivera SMS om detta världsarv": "Enable SMS for this world heritage site",
    "Stoppa SMS om detta världsarv": "Stop SMS for this world heritage site",
    "Grön = aktivera SMS. Röd = stoppa SMS. Grön kan alltid klickas först.":
      "Green = enable SMS. Red = stop SMS. You can always tap green first.",
    "SMS aktiverat för detta världsarv.": "SMS enabled for this world heritage site.",
    "SMS stoppat för detta världsarv.": "SMS stopped for this world heritage site.",
    "SMS om detta världsarv är redan aktiverat.":
      "SMS for this world heritage site is already enabled.",
    "SMS om detta världsarv är redan stoppat.":
      "SMS for this world heritage site is already stopped.",
    "Inga fler SMS om detta världsarv.": "No more SMS about this world heritage site.",
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

/** Toast – offline för UNESCO-språk (ingen API-väntan vid betalning). */
const TOAST_I18N_ENTRIES = {
  en: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Payment completed. Your subscription is active.",
    "Inloggning genomförd via e-post.": "Signed in via email.",
    "Inloggning genomförd via API.": "Signed in via API.",
    "Stripe laddas – försök igen om ett ögonblick.": "Stripe is loading – try again in a moment.",
    "Betalningen kunde inte bekräftas.": "Payment could not be confirmed.",
    "Ange ett giltigt kortnummer (test).": "Enter a valid card number (test).",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Enter an email for confirmation and OwnTracks instructions.",
    "Kontaktuppgifter sparade.": "Contact details saved.",
  },
  it: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Pagamento completato. L'abbonamento è attivo.",
    "Inloggning genomförd via e-post.": "Accesso effettuato via e-mail.",
    "Stripe laddas – försök igen om ett ögonblick.": "Stripe si sta caricando – riprova tra un momento.",
    "Betalningen kunde inte bekräftas.": "Impossibile confermare il pagamento.",
    "Ange ett giltigt kortnummer (test).": "Inserisci un numero di carta valido (test).",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Inserisci un'e-mail per la conferma e le istruzioni OwnTracks.",
    "Kontaktuppgifter sparade.": "Dati di contatto salvati.",
  },
  fr: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Paiement effectué. L'abonnement est actif.",
    "Inloggning genomförd via e-post.": "Connexion par e-mail réussie.",
    "Stripe laddas – försök igen om ett ögonblick.": "Stripe se charge – réessayez dans un instant.",
    "Betalningen kunde inte bekräftas.": "Le paiement n'a pas pu être confirmé.",
    "Ange ett giltigt kortnummer (test).": "Saisissez un numéro de carte valide (test).",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Saisissez un e-mail pour la confirmation et les instructions OwnTracks.",
    "Kontaktuppgifter sparade.": "Coordonnées enregistrées.",
  },
  de: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Zahlung abgeschlossen. Das Abonnement ist aktiv.",
    "Inloggning genomförd via e-post.": "Anmeldung per E-Mail erfolgreich.",
    "Stripe laddas – försök igen om ett ögonblick.": "Stripe wird geladen – versuchen Sie es gleich erneut.",
    "Betalningen kunde inte bekräftas.": "Die Zahlung konnte nicht bestätigt werden.",
    "Ange ett giltigt kortnummer (test).": "Geben Sie eine gültige Kartennummer ein (Test).",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Geben Sie eine E-Mail für Bestätigung und OwnTracks-Anleitung ein.",
    "Kontaktuppgifter sparade.": "Kontaktdaten gespeichert.",
  },
  es: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Pago completado. La suscripción está activa.",
    "Inloggning genomförd via e-post.": "Inicio de sesión por correo electrónico.",
    "Stripe laddas – försök igen om ett ögonblick.": "Stripe se está cargando – inténtelo de nuevo en un momento.",
    "Betalningen kunde inte bekräftas.": "No se pudo confirmar el pago.",
    "Ange ett giltigt kortnummer (test).": "Introduzca un número de tarjeta válido (prueba).",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Introduzca un correo para la confirmación e instrucciones de OwnTracks.",
    "Kontaktuppgifter sparade.": "Datos de contacto guardados.",
  },
  ar: {
    "Betalning genomförd. Prenumerationen är aktiv.": "تم الدفع. الاشتراك نشط الآن.",
    "Inloggning genomförd via e-post.": "تم تسجيل الدخول عبر البريد الإلكتروني.",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "أدخل بريدًا إلكترونيًا للتأكيد وتعليمات OwnTracks.",
    "Kontaktuppgifter sparade.": "تم حفظ بيانات الاتصال.",
  },
  ru: {
    "Betalning genomförd. Prenumerationen är aktiv.": "Оплата выполнена. Подписка активна.",
    "Inloggning genomförd via e-post.": "Вход по электронной почте выполнен.",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "Укажите e-mail для подтверждения и инструкций OwnTracks.",
    "Kontaktuppgifter sparade.": "Контактные данные сохранены.",
  },
  zh: {
    "Betalning genomförd. Prenumerationen är aktiv.": "付款完成。订阅已激活。",
    "Inloggning genomförd via e-post.": "已通过电子邮件登录。",
    "Ange e-post för bekräftelse och OwnTracks-instruktioner.":
      "请输入用于确认和 OwnTracks 说明的电子邮件。",
    "Kontaktuppgifter sparade.": "联系方式已保存。",
  },
};

function getI18nDictionary(lang) {
  const target = (lang || "sv").toLowerCase().slice(0, 2);
  return {
    ...(NEWSPAPER_I18N[target] || {}),
    ...(UI_MODAL_I18N[target] || {}),
    ...(TOAST_I18N_ENTRIES[target] || {}),
  };
}

const I18N_SV = {
  LOADING_SITE: "Hämtar världsarv…",
  TRANSLATION_FAILED: "Översättningen misslyckades – försök igen.",
  LOADING_CLOSEST: "Hämtar närmaste världsarv…",
  LOADING_DISTANCE: "Hämtar avstånd…",
  LOADING_POSITION: "Hämtar din position…",
  UNKNOWN_SITE: "Okänt världsarv",
  DISTANCE_UNKNOWN: "Avstånd okänt",
  GPS_UNSUPPORTED: "GPS stöds inte – visar närmaste i Sverige.",
  GPS_DENIED: "Plats nekad – visar närmaste världsarv i Sverige.",
  GPS_FAILED: "Kunde inte hämta plats – visar närmaste i Sverige.",
  PREF_MARK_VISITED: "Stoppa SMS om detta världsarv",
  PREF_WANT_SMS_AGAIN: "Aktivera SMS om detta världsarv",
  PREF_SMS_ENABLED: "SMS aktiverat för detta världsarv.",
  PREF_SMS_STOPPED: "SMS stoppat för detta världsarv.",
  PREF_SMS_ALREADY_ON: "SMS om detta världsarv är redan aktiverat.",
  PREF_SMS_ALREADY_OFF: "SMS om detta världsarv är redan stoppat.",
  MOBILE: "Mobilnummer",
  EMAIL: "E-postadress",
  CONFIRM_CHANNEL: "En bekräftelse skickas till vald notiskanal.",
  CONFIRM_EMAIL_OWNOTRACKS: "Bekräftelse med OwnTracks-instruktioner har skickats till din e-post.",
  CONFIRM_EMAIL_PLUS_SMS: " Du fick även ett kort SMS.",
  PAYMENT_EMAIL_REQUIRED: "Ange e-post för bekräftelse och OwnTracks-instruktioner.",
  PAYMENT_EMAIL_LABEL_SMS: "E-post för bekräftelse och OwnTracks (obligatoriskt)",
  PAYMENT_EMAIL_LABEL_EMAIL: "E-post för bekräftelse (samma som prenumeration)",
  ACTIVE_SMS: "Aktiv kanal: SMS-notiser",
  ACTIVE_EMAIL: "Aktiv kanal: E-postnotiser",
  SAVE_CONTACT: "Spara kontaktuppgifter",
  CONTACT_SAVED: "Kontaktuppgifter sparade.",
  BANKID_WAIT: "Väntar på BankID…",
  BANKID_BTN: "🏦 Logga in med BankID (Sverige)",
  SEND_CODE: "Skicka SMS-kod",
  VERIFYING: "Verifierar…",
  LOGIN: "Logga in",
  PAYING: "Betalar…",
  PAYMENT_COMPLETE: "Betalning genomförd. Prenumerationen är aktiv.",
  LOGIN_EMAIL_DONE: "Inloggning genomförd via e-post.",
  STRIPE_LOADING: "Stripe laddas – försök igen om ett ögonblick.",
  PAYMENT_NOT_CONFIRMED: "Betalningen kunde inte bekräftas.",
  CARD_INVALID: "Ange ett giltigt kortnummer (test).",
  CONFIRM_SENT_EMAIL: "En bekräftelse har skickats via e-post.",
  CONFIRM_SENT_SMS: "En bekräftelse har skickats via SMS.",
  SUBSCRIPTION_UNTIL: "Prenumerationen gäller till",
};

/** Betalnings-toast per språk – direkt lookup (ingen strängmatchning). */
const PAYMENT_COMPLETE_TOAST = {
  sv: "Betalning genomförd. Prenumerationen är aktiv.",
  en: "Payment completed. Your subscription is active.",
  it: "Pagamento completato. L'abbonamento è attivo.",
  fr: "Paiement effectué. L'abonnement est actif.",
  de: "Zahlung abgeschlossen. Das Abonnement ist aktiv.",
  es: "Pago completado. La suscripción está activa.",
  ar: "تم الدفع. الاشتراك نشط الآن.",
  ru: "Оплата выполнена. Подписка активна.",
  zh: "付款完成。订阅已激活。",
};

let paymentToastLockUntil = 0;
let lockedPaymentToastMessage = null;

/** Språk vid betalning – samma källa som Stripe (dropdown → html → Stripe locale). */
function stripeLocaleToReaderLang(locale) {
  if (!locale) return null;
  const raw = String(locale).trim();
  if (raw.startsWith("en")) return "en";
  const code = normalizeLanguageCode(raw.split("-")[0]);
  if (code === "nb") return "nb";
  if (PAYMENT_COMPLETE_TOAST[code]) return code;
  if (isValidLanguageCode(code)) return code;
  return null;
}

function getCheckoutLangForPayment(explicitLang) {
  if (explicitLang && isValidLanguageCode(explicitLang)) {
    return normalizeLanguageCode(explicitLang);
  }
  if (prototypeState.checkoutLang && isValidLanguageCode(prototypeState.checkoutLang)) {
    return normalizeLanguageCode(prototypeState.checkoutLang);
  }
  const select = document.getElementById("demoLanguageSelect");
  if (select?.value && isValidLanguageCode(select.value)) {
    return normalizeLanguageCode(select.value);
  }
  const htmlLang = document.documentElement.lang;
  if (htmlLang && isValidLanguageCode(htmlLang) && htmlLang !== "sv") {
    return normalizeLanguageCode(htmlLang);
  }
  const fromStripe = stripeLocaleToReaderLang(stripeLocale);
  if (fromStripe) return fromStripe;
  try {
    const stored = sessionStorage.getItem(READER_LANG_STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return normalizeLanguageCode(stored);
    }
  } catch (_) {
    /* ignore */
  }
  return getActiveReaderLang();
}

function resolveCheckoutLang() {
  return getCheckoutLangForPayment();
}

function getPaymentCompleteToast(lang) {
  const target = getCheckoutLangForPayment(lang);
  return PAYMENT_COMPLETE_TOAST[target] || PAYMENT_COMPLETE_TOAST.en || PAYMENT_COMPLETE_TOAST.sv;
}

async function ensureCheckoutLanguageReady() {
  if (readerLanguageApplyPromise) {
    try {
      await readerLanguageApplyPromise;
    } catch (_) {
      /* fortsätt – toast har offline-texter */
    }
  }
  const target = getActiveReaderLang();
  if (target === "sv") return target;

  const waitStarted = Date.now();
  while (document.body.classList.contains("is-translating") && Date.now() - waitStarted < 45000) {
    await new Promise(resolve => window.setTimeout(resolve, 120));
  }
  return getActiveReaderLang();
}

function showPaymentCompleteToast(lang) {
  const checkoutLang = getCheckoutLangForPayment(lang);
  const message = getPaymentCompleteToast(checkoutLang);
  lockedPaymentToastMessage = message;
  paymentToastLockUntil = Date.now() + 8000;
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.dataset.checkoutLang = checkoutLang;
  toastEl.classList.add("show");
  if (window.__paymentToastHideTimer) {
    clearTimeout(window.__paymentToastHideTimer);
  }
  window.__paymentToastHideTimer = window.setTimeout(() => {
    toastEl.classList.remove("show");
    paymentToastLockUntil = 0;
    lockedPaymentToastMessage = null;
  }, 7500);
}

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);
const UNESCO_DESC_LANGS = new Set(["en", "fr", "es", "ru", "ar", "zh"]);

function getUnescoDescription(site, lang) {
  const key = `desc_${lang}`;
  const text = site?.[key];
  return text && String(text).trim() ? String(text).trim() : null;
}

/** Max tecken i annonsens faktatext (ingress). Detaljvyn visar hela texten. */
const AD_FACT_MAX_CHARS = 700;

function longestUnescoDescription(site) {
  let best = (site?.description || "").trim();
  let bestLang = "en";

  for (const code of ["en", ...UNESCO_DESC_LANGS]) {
    const text = getUnescoDescription(site, code);
    if (text && text.length > best.length) {
      best = text;
      bestLang = code;
    }
  }

  return { text: best, lang: bestLang };
}

function pickUnescoDescriptionSource(site, targetLang) {
  const target = normalizeLanguageCode(targetLang);
  const localized = getUnescoDescription(site, target);
  const english = englishDescriptionForSite(site);
  const longest = longestUnescoDescription(site);

  if (target === "en") {
    const text = english || longest.text || localized || "";
    return { text, lang: "en" };
  }

  const referenceLen = Math.max(english.length, longest.text.length);
  if (
    localized?.trim() &&
    (!referenceLen || localized.length >= referenceLen * 0.85)
  ) {
    return { text: localized.trim(), lang: target };
  }

  if (english) {
    return { text: english, lang: "en" };
  }

  if (longest.text) {
    return longest;
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

function siteNeedsNameTranslation(site, targetLang) {
  const target = normalizeLanguageCode(targetLang);
  if (getUnescoSiteName(site, target)) {
    return false;
  }
  const english = (site?.name || "").trim();
  return Boolean(english) && target !== "en";
}

function siteNeedsDescriptionTranslation(site, targetLang) {
  const target = normalizeLanguageCode(targetLang);
  const { text, lang: sourceLang } = pickUnescoDescriptionSource(site, target);
  return Boolean(text?.trim()) && sourceLang !== target;
}

function formatAdTeaserText(description) {
  if (!description?.trim()) {
    return "";
  }
  const trimmed = description.trim();
  if (trimmed.length <= AD_FACT_MAX_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, AD_FACT_MAX_CHARS).trimEnd()}…`;
}

/**
 * Beskrivning: UNESCO först (desc_xx), Google Translate backup från engelska.
 */
async function resolveSiteDescription(site, targetLang = getActiveReaderLang()) {
  const target = normalizeLanguageCode(targetLang);
  const { text: sourceText, lang: sourceLang } = pickUnescoDescriptionSource(site, target);

  if (!sourceText?.trim()) {
    return "";
  }

  const source = normalizeLanguageCode(sourceLang);
  if (target === source) {
    return sourceText;
  }

  const translated = await translateViaApi(sourceText, target, source);
  if (translated?.trim()) {
    return translated;
  }

  const english = englishDescriptionForSite(site);
  if (english && source !== "en") {
    return translateViaApi(english, target, "en");
  }

  return sourceText;
}

function englishDescriptionForSite(site) {
  return (getUnescoDescription(site, "en") || site?.description || "").trim();
}

function translationSucceeded(source, translated) {
  if (!translated?.trim()) return false;
  const s = (source || "").trim();
  const t = translated.trim();
  return Boolean(s) && s !== t;
}

function adDescriptionSource(site, targetLang) {
  const target = normalizeLanguageCode(targetLang);
  const english = englishDescriptionForSite(site);
  if (target === "en") {
    return { text: english, needsTranslate: false };
  }
  const bundled = getUnescoDescription(site, target);
  if (bundled && bundled.length >= 120) {
    return { text: bundled, needsTranslate: false };
  }
  return { text: english, needsTranslate: Boolean(english) };
}

function translateApiUrls(path = "/api/translate") {
  const urls = [];
  if (typeof window !== "undefined" && window.location?.origin) {
    urls.push(`${window.location.origin}${path}`);
  }
  const configured =
    path === "/api/translate/batch" ? API_ENDPOINTS.translateBatch : API_ENDPOINTS.translate;
  if (configured && !urls.includes(configured)) {
    urls.push(configured);
  }
  return urls;
}

/** UNESCO/API-översättning – använder aldrig svenska UI-ordboken. */
async function translateRemoteText(text, targetLang, sourceLang = "en") {
  const target = normalizeLanguageCode(targetLang);
  const source = normalizeLanguageCode(sourceLang);
  if (!text?.trim() || target === source) {
    return text?.trim() || "";
  }

  const cacheKey = `${source}|${target}|${text}`;
  const cached = translateCache.get(cacheKey);
  if (cached && translationSucceeded(text, cached)) {
    return cached;
  }

  const body = JSON.stringify({
    text,
    source_language: source,
    target_language: target
  });
  const timeoutMs = text.length > 400 ? 30000 : 15000;

  if (backendTranslateAvailable) {
    for (const url of translateApiUrls("/api/translate")) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: apiRequestHeaders(),
          body,
          signal: controller.signal
        });
        window.clearTimeout(timeoutId);
        const data = await response.json();
        if (response.ok && data.translated_text?.trim()) {
          const translated = data.translated_text.trim();
          translateCache.set(cacheKey, translated);
          if (translationSucceeded(text, translated)) {
            return translated;
          }
          // API svarade men text liknar källan – använd ändå (bättre än felmeddelande).
          return translated;
        }
        if (response.status === 400 && data?.error === "invalid_language_code") {
          backendTranslateAvailable = false;
          break;
        }
      } catch (error) {
        window.clearTimeout(timeoutId);
        console.warn("UNESCO-översättning misslyckades:", url, error);
      }
    }
  }

  const mem = await translateViaMyMemory(text, target, source);
  if (mem && translationSucceeded(text, mem)) {
    translateCache.set(cacheKey, mem);
    return mem;
  }

  return null;
}

/**
 * Översätter annonsens UNESCO-text till läsarens språk.
 * Fakta: inbyggd desc_xx om tillräckligt lång, annars en→mål via /api/translate (samma origin först).
 */
function serverLocalizedLang(site) {
  return normalizeLanguageCode(site?.server_localized_lang || "");
}

/** API-text gäller bara för det språk som /closest hämtades med – inte vid byte till t.ex. fi/en. */
function serverLocalizedDescription(site, targetLang) {
  const target = normalizeLanguageCode(targetLang);
  const fromApi = (site?.description || "").trim();
  if (!fromApi || !site?.server_localized) return "";

  const serverLang = serverLocalizedLang(site);
  if (!serverLang || serverLang !== target) return "";

  const descEn = englishDescriptionForSite(site);
  if (target === "en") {
    return descEn || fromApi;
  }
  if (fromApi !== descEn) {
    return fromApi;
  }
  return "";
}

async function translateAdHeritageContent(site, targetLang, rawSite = null) {
  const target = normalizeLanguageCode(targetLang);
  const englishName = (site?.name || "").trim();
  const englishCountry = (site?.country || rawSite?.country || "").trim();
  const descSource = adDescriptionSource(site, target);
  const serverDesc = serverLocalizedDescription(site, target);

  if (target === "en") {
    return {
      name: englishName,
      description: englishDescriptionForSite(site) || descSource.text,
      country: englishCountry,
      failed: false
    };
  }

  const serverLang = serverLocalizedLang(site);
  const serverMatchesTarget = site?.server_localized && serverLang === target;

  const localizedName = getUnescoSiteName(site, target);
  let name = localizedName || "";
  if (serverMatchesTarget && (site?.name || "").trim()) {
    name = (site.name || "").trim();
  } else if (!name && englishName) {
    name = (await translateRemoteText(englishName, target, "en")) || englishName;
  }

  let description = serverDesc;
  if (!description) {
    const english = englishDescriptionForSite(site);
    const sourceText = descSource.needsTranslate ? descSource.text : english || descSource.text;
    description =
      (await translateRemoteText(sourceText, target, "en")) || sourceText || descSource.text || "";
  }

  let country = englishCountry;
  if (englishCountry) {
    if (serverMatchesTarget && (site?.country || "").trim()) {
      country = (site.country || "").trim();
    } else {
      country = (await translateRemoteText(englishCountry, target, "en")) || englishCountry;
    }
  }

  return {
    name: name || englishName,
    description,
    country,
    failed: false
  };
}

async function resolveSiteCountry(country, targetLang = getActiveReaderLang()) {
  const text = (country || "").trim();
  if (!text) return "";

  const target = normalizeLanguageCode(targetLang);
  if (target === "en") {
    return text;
  }

  return translateViaApi(text, target, "en");
}

/**
 * Rubrik: UNESCO-officiellt namn (fältet name + name_xx), översatt från engelska vid behov.
 */
async function resolveSiteName(site, targetLang = getActiveReaderLang()) {
  const target = normalizeLanguageCode(targetLang);

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

  const translated = await translateViaApi(officialEnglish, target, "en");
  return translated?.trim() || officialEnglish;
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

const DEFAULT_GEO = { latitude: 60.60472, longitude: 15.63083 }; // Falun – demo-fallback när GPS saknas

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
/** Full UNESCO-post per unesco_id – texter även när geo-filen saknar desc_xx. */
const HERITAGE_TEXT_BY_ID = new Map();
let heritageSitesLoadPromise = null;
let heritageTextsReady = false;

function indexHeritageSiteTexts(sites) {
  if (!Array.isArray(sites)) return;
  for (const site of sites) {
    const id = String(site?.unesco_id || site?.id || "");
    if (id) HERITAGE_TEXT_BY_ID.set(id, site);
  }
}

function mergeHeritageSiteTexts(site) {
  if (!site) return site;
  const id = String(site.unesco_id || site.id || "");
  const full = id ? HERITAGE_TEXT_BY_ID.get(id) : null;
  if (!full) return site;

  const textFields = Object.fromEntries(
    Object.entries(full).filter(([key]) => key.startsWith("desc_") || key.startsWith("name_"))
  );
  return { ...full, ...site, ...textFields };
}

function applyFullHeritageDataset(fullSites) {
  if (!Array.isArray(fullSites) || fullSites.length === 0) {
    return false;
  }
  indexHeritageSiteTexts(fullSites);
  LOCAL_HERITAGE_SITES = fullSites;
  heritageTextsReady = true;
  console.info(`UNESCO-databas laddad: ${LOCAL_HERITAGE_SITES.length} platser.`);
  return true;
}

async function ensureHeritageTextsReady() {
  if (heritageTextsReady && HERITAGE_TEXT_BY_ID.size > 0) {
    return;
  }
  await loadHeritageSites();
}

async function loadHeritageSitesOnce() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("data/heritage-sites.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const fullSites = await response.json();
      if (applyFullHeritageDataset(fullSites)) {
        return LOCAL_HERITAGE_SITES;
      }
      throw new Error("Tom UNESCO-databas");
    } catch (err) {
      if (attempt < 2) {
        await new Promise(resolve => window.setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
      console.warn("Kunde inte ladda heritage-sites.json, försöker geo-fallback.", err);
    }
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("data/heritage-geo.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const geoSites = await response.json();
      indexHeritageSiteTexts(geoSites);
      LOCAL_HERITAGE_SITES = geoSites;
      heritageTextsReady = HERITAGE_TEXT_BY_ID.size > 0;
      console.info(`UNESCO-geodata (fallback) laddad: ${LOCAL_HERITAGE_SITES.length} platser.`);
      return LOCAL_HERITAGE_SITES;
    } catch (err) {
      console.warn("Kunde inte ladda UNESCO-geodata.", err);
    }
  }

  LOCAL_HERITAGE_SITES = SWEDISH_GEO_FALLBACK.slice();
  indexHeritageSiteTexts(LOCAL_HERITAGE_SITES);
  heritageTextsReady = true;
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
  const site = mergeHeritageSiteTexts(closest);
  console.log("Närmaste:", site.name, `(id ${site.unesco_id}, ${(minDist).toFixed(1)} km)`);
  const descriptions = Object.fromEntries(
    Object.entries(site).filter(([key]) => key.startsWith("desc_"))
  );
  const names = Object.fromEntries(
    Object.entries(site).filter(([key]) => key.startsWith("name_"))
  );
  return {
    name: site.name,
    country: site.country,
    image_url: resolveSiteImageUrl(site),
    description: site.description || null,
    ...descriptions,
    ...names,
    distance_m: Math.round(minDist * 1000),
    unesco_id: site.unesco_id || null,
    year_inscribed: site.year_inscribed || null,
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
let stripeLocale = null;

const STRIPE_SUPPORTED_LOCALES = new Set([
  "ar", "bg", "cs", "da", "de", "el", "en", "en-GB", "es", "es-419",
  "et", "fi", "fil", "fr", "fr-CA", "hr", "hu", "id", "it", "ja",
  "ko", "lt", "lv", "ms", "mt", "nb", "nl", "pl", "pt", "pt-BR",
  "ro", "ru", "sk", "sl", "sv", "th", "tr", "vi", "zh", "zh-HK", "zh-TW"
]);

/** ISO 639-1 → Stripe Elements locale (Stripe använder t.ex. nb, inte no). */
const STRIPE_LOCALE_ALIASES = {
  no: "nb",
  nn: "nb",
};

function stripeLocaleForLang(lang) {
  const code = normalizeLanguageCode(lang);
  const mapped = STRIPE_LOCALE_ALIASES[code] || code;
  if (STRIPE_SUPPORTED_LOCALES.has(mapped)) {
    return mapped;
  }
  if (code === "sv") {
    return "sv";
  }
  return "en";
}

async function reloadStripeForReaderLanguage(lang = getActiveReaderLang()) {
  if (!PAYMENT_CONFIG.stripe_enabled) return;
  const paymentOpen = document.getElementById("payment")?.classList.contains("active");
  const modalOpen = document.getElementById("serviceModal")?.classList.contains("show");
  if (!paymentOpen && !modalOpen) return;
  await prepareStripePaymentStep(lang);
}

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
  stripeClient = null;
  stripeClientSecret = null;
  stripeIntentAmount = null;
  stripeLocale = null;
}

async function prepareStripePaymentStep(lang = resolveCheckoutLang()) {
  await loadPaymentConfig();
  await updatePaymentProviderUi();
  const targetStripeLocale = stripeLocaleForLang(lang);

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
    stripePaymentElement &&
    stripeLocale === targetStripeLocale
  ) {
    return;
  }

  destroyStripePaymentElement();

  try {
    await loadStripeJs();
    stripeClient = window.Stripe(PAYMENT_CONFIG.stripe_publishable_key, {
      locale: targetStripeLocale,
    });

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
    stripeLocale = targetStripeLocale;
    const readerLang = stripeLocaleToReaderLang(targetStripeLocale) || getCheckoutLangForPayment(lang);
    prototypeState.checkoutLang = readerLang;
    stripeElements = stripeClient.elements({
      clientSecret: stripeClientSecret,
      locale: targetStripeLocale,
      appearance: { theme: "stripe" },
    });
    stripePaymentElement = stripeElements.create("payment", {
      layout: "tabs",
    });
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
  const svText = `Pris: ${SUBSCRIPTION_PRICE_SEK} SEK – ${period} (engångsbetalning, du betalar igen manuellt när perioden löper ut)`;
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

async function fetchApiJson(url, options = {}, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    let data = {};
    const raw = await response.text();
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (!response.ok) {
          throw new Error(raw.slice(0, 200) || `HTTP ${response.status}`);
        }
      }
    }

    return { response, data };
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw new Error("timeout");
    }
    throw error;
  }
}

function formatApiConnectionError(error) {
  if (error?.message === "timeout") {
    return "API:t svarade inte i tid – försök igen om ett ögonblick.";
  }
  if (window.location.hostname.includes("railway.app")) {
    return "Kunde inte nå API – kontrollera att Railway-deployen är aktiv.";
  }
  return "Kunde inte nå API – kontrollera att uvicorn körs på port 8000.";
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

/** Uppdaterar platsmetadata och avstånd – skriver aldrig engelska UNESCO-rubriker i annonsen. */
function applyClosestSiteMetaSync(site) {
  if (!site) return;

  const distanceM = site.distance_m != null ? Number(site.distance_m) : null;
  const kmFormatted = formatDistanceKm(distanceM);

  lastClosestSite = site;
  currentSite.api_site_id = site.id ?? currentSite.api_site_id;
  currentSite.distance_km = kmFormatted;
  if (site.country) currentSite.country = site.country;
  if (site.unesco_id) currentSite.site_id = String(site.unesco_id);

  updateDistanceLabels();
}

async function setHeritageAdLoadingState(lang = getActiveReaderLang()) {
  const adName = document.getElementById("adSiteName");
  const adTeaser = document.getElementById("adTeaser");
  const title = document.getElementById("siteDetailTitle");
  const desc = document.getElementById("siteDetailDescription");
  const tasks = [];

  if (adName) {
    tasks.push(setElementI18n(adName, I18N_SV.LOADING_CLOSEST, lang));
  }
  if (adTeaser) {
    tasks.push(setElementI18n(adTeaser, I18N_SV.LOADING_SITE, lang));
  }
  if (title) {
    tasks.push(setElementI18n(title, I18N_SV.LOADING_SITE, lang));
  }
  if (desc) {
    tasks.push(setElementI18n(desc, I18N_SV.LOADING_SITE, lang));
  }

  await Promise.all(tasks).catch(() => {});
}

function renderClosestSiteNow() {
  void refreshGeoFromApi();
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
  const seq = ++applySiteUiSeq;
  if (lastClosestSite) {
    await refreshClosestSiteTextOnly(lastClosestSite, getActiveReaderLang(), seq);
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

function applyHeritageTextToDom(siteName, displayDesc, target) {
  const adName = document.getElementById("adSiteName");
  if (adName) {
    adName.textContent = siteName || "";
    if (siteName) {
      adName.dataset.i18nDynamic = "true";
    } else {
      delete adName.dataset.i18nDynamic;
    }
  }

  const teaserText = formatAdTeaserText(displayDesc);
  const adTeaser = document.getElementById("adTeaser");
  if (adTeaser) {
    adTeaser.textContent = teaserText;
    if (teaserText) {
      adTeaser.dataset.i18nDynamic = "true";
    } else {
      delete adTeaser.dataset.i18nDynamic;
    }
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

  const desc = document.getElementById("siteDetailDescription");
  if (desc) {
    desc.textContent = displayDesc || "";
    if (displayDesc) {
      desc.dataset.i18nDynamic = "true";
    } else {
      delete desc.dataset.i18nDynamic;
    }
  }
}

async function refreshClosestSiteTextOnly(site, lang, uiSeq = applySiteUiSeq) {
  if (!site) return;

  await ensureHeritageTextsReady();
  if (uiSeq !== applySiteUiSeq) return;

  let workingSite = site;
  const target = normalizeLanguageCode(lang || getNewspaperLang());
  const lat = geoState.latitude;
  const lng = geoState.longitude;
  const serverLang = serverLocalizedLang(workingSite);

  if (
    lat != null &&
    lng != null &&
    (!workingSite?.server_localized || serverLang !== target)
  ) {
    const apiSite = await fetchClosestSiteFromApi(lat, lng, target);
    if (uiSeq !== applySiteUiSeq) return;
    if (apiSite) {
      workingSite = mergeHeritageSiteTexts({
        ...workingSite,
        ...apiSite,
        unesco_id: apiSite.unesco_id || workingSite.unesco_id,
        distance_m: apiSite.distance_m ?? workingSite.distance_m,
        server_localized: true,
        server_localized_lang: target
      });
      lastClosestSite = workingSite;
    }
  }

  const merged = mergeHeritageSiteTexts(workingSite);

  if (target !== "en") {
    await setHeritageAdLoadingState(target);
  }
  if (uiSeq !== applySiteUiSeq) return;

  const content = await translateAdHeritageContent(merged, target, workingSite);
  if (uiSeq !== applySiteUiSeq) return;

  currentSite.name = content.name;
  applyHeritageTextToDom(content.name, content.description, target);

  const meta = document.getElementById("siteDetailMeta");
  if (meta) {
    const parts = [content.country, merged.year_inscribed || workingSite.year_inscribed].filter(Boolean);
    meta.textContent = parts.join(", ");
  }

  if (uiSeq !== applySiteUiSeq) return;

  updateDistanceLabels();
  if (target !== "sv") {
    await translateDistanceLabels(target);
  }
}

async function applyClosestSiteToUi(site) {
  if (!site) return;

  const seq = ++applySiteUiSeq;
  const lang = getActiveReaderLang();
  const target = normalizeLanguageCode(lang);
  const merged = mergeHeritageSiteTexts(site);

  await ensureHeritageTextsReady();
  if (isStaleUiApply(seq)) return;

  if (target !== "en") {
    await setHeritageAdLoadingState(lang);
  }
  if (isStaleUiApply(seq)) return;

  applyClosestSiteMetaSync(site);
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

  const siteNameForImage = getUnescoSiteName(merged, lang) || (merged?.name || "").trim();
  if (!imagesStable) {
    const photoUrl = unescoSiteImageUrl(siteImageId) || resolveSiteImageUrl(site);
    if (isStaleUiApply(seq)) return;
    setSiteImage(adImg, adImgPlaceholder, photoUrl, siteNameForImage, siteImageId);
    setSiteImage(detailImg, detailFallback, photoUrl, siteNameForImage, siteImageId);
  }

  if (isStaleUiApply(seq)) return;

  await refreshClosestSiteTextOnly(site, lang, seq);
}

async function refreshGeoFromApi() {
  refreshGeoTail = refreshGeoTail
    .then(() => refreshGeoFromApiOnce())
    .catch(error => {
      console.error("Geo-uppdatering misslyckades:", error);
    });
  return refreshGeoTail;
}

async function fetchClosestSiteFromApi(lat, lng, lang) {
  const target = normalizeLanguageCode(lang || getActiveReaderLang());
  const query = `lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&lang=${encodeURIComponent(target)}`;
  const urls = [
    `${window.location.origin}/api/sites/closest?${query}`,
    `${API_BASE_URL}/api/sites/closest?${query}`
  ];

  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        headers: apiRequestHeaders(),
        signal: controller.signal
      });
      if (!response.ok) {
        window.clearTimeout(timeoutId);
        continue;
      }
      window.clearTimeout(timeoutId);
      const data = await response.json();
      if (data?.name || data?.description) {
        return { ...data, server_localized: true, server_localized_lang: target };
      }
    } catch (error) {
      window.clearTimeout(timeoutId);
      console.warn("Närmaste plats via API misslyckades:", url, error);
    }
  }
  return null;
}

async function refreshGeoFromApiOnce() {
  if (LOCAL_HERITAGE_SITES.length === 0) {
    await loadHeritageSites();
  }

  const lat = geoState.latitude;
  const lng = geoState.longitude;
  const lang = getActiveReaderLang();
  let site = findClosestSiteLocal(lat, lng);
  if (!site) return;

  const apiSite = await fetchClosestSiteFromApi(lat, lng, lang);
  if (apiSite) {
    site = mergeHeritageSiteTexts({
      ...site,
      ...apiSite,
      unesco_id: apiSite.unesco_id || site.unesco_id,
      distance_m: apiSite.distance_m ?? site.distance_m,
      server_localized: true,
      server_localized_lang: lang
    });
  }

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
  /** Språk låst vid klick på Betala – används för toast efter Stripe (kan ta flera sek). */
  checkoutLang: null,
};

let readerLanguageApplyPromise = null;

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

  const confirmationMessage = document.getElementById("confirmationMessage");
  if (confirmationMessage) confirmationMessage.style.display = "";

  syncProfileContactFields();
  syncSitePreferenceUi().catch(() => {});
}

/** Ordbok gäller bara svenska UI-källtexter (data-i18n), inte UNESCO en→sv. */
function resolveI18nText(source, target, sourceLang = "sv") {
  const src = normalizeLanguageCode(sourceLang);
  const tgt = normalizeLanguageCode(target);
  if (src === tgt) {
    return source;
  }
  if (src !== "sv") {
    return null;
  }
  const offlineDict = getI18nDictionary(tgt);
  return offlineDict[source] || null;
}

async function translateUiText(text, targetLang, sourceLang = "sv") {
  const target = (targetLang || "sv").toLowerCase().slice(0, 2);
  const source = (sourceLang || "sv").toLowerCase().slice(0, 2);
  if (!text?.trim() || target === source) {
    return text;
  }
  const offline = resolveI18nText(text, target, source);
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
    if (source === "sv") {
      const offline = resolveI18nText(text, target, source);
      if (offline) {
        translateCache.set(cacheKey, offline);
        result[text] = offline;
        continue;
      }
    }
    pending.push(text);
  }

  if (pending.length === 0) {
    return result;
  }

  if (backendTranslateAvailable) {
    const batchBody = JSON.stringify({
      texts: pending,
      source_language: source,
      target_language: target
    });
    for (const url of translateApiUrls("/api/translate/batch")) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: apiRequestHeaders(),
        body: batchBody
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.translations)) {
        pending.forEach((text, idx) => {
          const translated = data.translations[idx];
          if (translationSucceeded(text, translated)) {
            translateCache.set(`${source}|${target}|${text}`, translated);
            result[text] = translated;
          }
        });
        const stillPending = pending.filter(text => !result[text]);
        if (stillPending.length === 0) {
          return result;
        }
        await translateInParallel(stillPending, async text => {
          const translated =
            (await translateRemoteText(text, target, source)) ||
            (await translateViaApi(text, target, source));
          result[text] = translated;
          return translated;
        });
        return result;
      }
      if (response.status === 404) {
        backendTranslateAvailable = false;
      }
    } catch (error) {
      console.warn("Batch-översättning misslyckades:", url, error);
    }
    }
  }

  await translateInParallel(pending, async text => {
    const translated =
      source === "sv"
        ? await translateViaApi(text, target, source)
        : (await translateRemoteText(text, target, source)) ||
          (await translateViaApi(text, target, source));
    result[text] = translated;
    return translated;
  });

  return result;
}

function resolveReaderText(svText, lang = getActiveReaderLang()) {
  const target = normalizeLanguageCode(lang);
  if (!svText?.trim() || target === "sv") {
    return svText;
  }
  const offline = resolveI18nText(svText, target, "sv");
  if (offline) {
    return offline;
  }
  const cacheKey = `sv|${target}|${svText}`;
  if (translateCache.has(cacheKey)) {
    return translateCache.get(cacheKey);
  }
  return null;
}

function applyElementI18nSync(element, svText, lang = getActiveReaderLang()) {
  if (!element) return;
  registerI18nSource(element, svText);
  delete element.dataset.i18nDynamic;
  if (!element.hasAttribute("data-i18n")) {
    element.setAttribute("data-i18n", "");
  }
  const target = normalizeLanguageCode(lang);
  const translated = resolveReaderText(svText, target);
  element.textContent = translated || svText;
}

async function setElementI18n(element, svText, lang = getActiveReaderLang()) {
  if (!element) return;
  const target = normalizeLanguageCode(lang);
  applyElementI18nSync(element, svText, target);
  if (target === "sv") return;

  const current = element.textContent?.trim();
  const source = svText?.trim();
  if (current && source && current !== source) {
    return;
  }

  const translated = await translateUiText(svText, target, "sv");
  if (translated && translated !== svText) {
    element.textContent = translated;
    translateCache.set(`sv|${target}|${svText}`, translated);
  }
}

function resolveToastText(svText, lang = getActiveReaderLang()) {
  return resolveReaderText(svText, lang);
}

function showReaderToast(svText, lang = getActiveReaderLang()) {
  if (Date.now() < paymentToastLockUntil) {
    return;
  }
  const target = normalizeLanguageCode(lang);
  const immediate = resolveReaderText(svText, target);
  toast(immediate || svText);

  if (target === "sv" || !svText?.trim() || (immediate && immediate !== svText)) {
    return;
  }

  void (async () => {
    if (Date.now() < paymentToastLockUntil) return;
    let translated = await translateUiText(svText, target, "sv");
    if (!translated || translated === svText) {
      translated =
        (await translateViaMyMemory(svText, target, "sv")) || translated || svText;
    }
    if (Date.now() < paymentToastLockUntil) return;
    if (translated && translated !== svText) {
      toast(translated);
    }
  })();
}

async function localizedToast(svText, lang = getActiveReaderLang()) {
  showReaderToast(svText, lang);
}

async function refreshServiceModalI18n(lang = getActiveReaderLang()) {
  const target = normalizeLanguageCode(lang);
  const root = document.getElementById("serviceModal");
  if (!root) return;

  if (target === "sv") {
    await updateModalProgressTitle("sv");
    return;
  }

  const elements = Array.from(root.querySelectorAll("[data-i18n]")).filter(
    el => el.dataset.i18nDynamic !== "true"
  );
  const uniqueSources = [...new Set(elements.map(el => getI18nSource(el)).filter(Boolean))];
  const { map: translatedMap, pending } = buildTranslationMapSync(uniqueSources, target, "sv");
  applyTranslationMapToElements(elements, translatedMap);

  if (pending.length > 0 && isActiveReaderLanguageTarget(target)) {
    const apiMap = await translateBatchMap(pending, target, "sv");
    if (isActiveReaderLanguageTarget(target)) {
      Object.assign(translatedMap, apiMap);
      applyTranslationMapToElements(elements, translatedMap);
    }
  }

  await updateModalProgressTitle(target);
}

async function translateViaMyMemoryChunk(text, targetLang, sourceLang = "sv") {
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
      return translated;
    }
  } catch (error) {
    console.warn("Reserv-översättning (MyMemory) misslyckades:", error);
  }
  return null;
}

async function translateViaMyMemory(text, targetLang, sourceLang = "sv") {
  const maxChunk = 450;
  if (text.length <= maxChunk) {
    return translateViaMyMemoryChunk(text, targetLang, sourceLang);
  }

  let combined = "";
  for (let offset = 0; offset < text.length; offset += maxChunk) {
    const piece = text.slice(offset, offset + maxChunk);
    const translated = await translateViaMyMemoryChunk(piece, targetLang, sourceLang);
    if (!translated) {
      return null;
    }
    combined += translated;
  }
  return combined || null;
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

  if (source === "sv") {
    const offline = resolveI18nText(text, target, source);
    if (offline) {
      translateCache.set(cacheKey, offline);
      return offline;
    }
  } else if (source !== target) {
    const remote = await translateRemoteText(text, target, source);
    if (remote) {
      return remote;
    }
  }

  if (backendTranslateAvailable) {
    const controller = new AbortController();
    const timeoutMs = text.length > 400 ? 25000 : 12000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

      if (response.status === 400 && data?.error === "invalid_language_code") {
        backendTranslateAvailable = false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn("Översättnings-API misslyckades:", error);
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
  prototypeState.checkoutLang = target;
  const applyTask = applyReaderLanguage(target);
  readerLanguageApplyPromise = applyTask;
  try {
    await applyTask;
  } finally {
    if (readerLanguageApplyPromise === applyTask) {
      readerLanguageApplyPromise = null;
    }
  }
  if (getActiveReaderLang() !== target) return;
  await refreshGeoUiSafeguard();
  if (document.getElementById("serviceModal")?.classList.contains("show")) {
    await refreshServiceModalI18n(target);
  }
  await reloadStripeForReaderLanguage(target);
}

function readStoredReaderLang() {
  const urlLang = readUrlLang();
  if (urlLang) return urlLang;
  try {
    const stored = sessionStorage.getItem(READER_LANG_STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return normalizeLanguageCode(stored);
    }
  } catch (_) {
    /* ignore */
  }
  return getNewspaperLang();
}

function initDemoLanguageSelect() {
  const select = document.getElementById("demoLanguageSelect");
  if (!select) return;

  const initialLang = readStoredReaderLang();
  rebuildLanguageSelect(select, initialLang);
  syncDemoLanguageSelectToLang(initialLang);

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
    const offline = resolveI18nText(text, target, source);
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
    const seq = ++applySiteUiSeq;
    await refreshClosestSiteTextOnly(lastClosestSite, target, seq);
  } else {
    await showGeoLoadingState();
  }

  if (document.getElementById("confirmation")?.classList.contains("active")) {
    await updateConfirmationMessage();
    syncSettingsChannelButtons();
    syncProfileContactFields();
    await syncSitePreferenceUi();
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
  prototypeState.checkoutLang = target;
  captureI18nSources();
  syncReaderLanguageUi(target);
  document.documentElement.dir = RTL_LANGS.has(target) ? "rtl" : "ltr";
  setTranslationLoading(true);

  try {
    const elements = Array.from(document.querySelectorAll("[data-i18n]"))
      .filter(el => el.dataset.i18nDynamic !== "true");

    const uniqueSources = [...new Set(elements.map(el => getI18nSource(el)).filter(Boolean))];
    const { map: translatedMap, pending } = buildTranslationMapSync(uniqueSources, target, "sv");
    applyTranslationMapToElements(elements, translatedMap);

    await applyDynamicLanguageContent(target);
    if (!isActiveReaderLanguageTarget(target)) return;

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
      if (target !== "sv") {
        const toastSources = Object.values(I18N_SV).filter(
          value => typeof value === "string" && value.trim().length > 2
        );
        try {
          await translateBatchMap(toastSources, target, "sv");
        } catch (_) {
          /* toast visas ändå via offline-ordbok eller MyMemory */
        }
      }
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

let modalScrollLockY = 0;

function lockBodyScrollForModal() {
  modalScrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.style.top = `-${modalScrollLockY}px`;
  document.body.classList.add("modal-open");
}

function unlockBodyScrollForModal() {
  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, modalScrollLockY);
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
  lockBodyScrollForModal();
  void openModalStep(step);
}

function closeServiceModal() {
  const modal = document.getElementById("serviceModal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  unlockBodyScrollForModal();

  const stepLabel = document.getElementById("stepLabel");
  if (stepLabel) {
    stepLabel.textContent = "Vy 1: Digital tidningssida med annons";
  }

  resetDemoState();
}

function getModalStepScrollElement() {
  return document.querySelector(".service-modal-body");
}

function scrollModalToTop(stepElement) {
  const scrollEl = getModalStepScrollElement(stepElement);
  if (!scrollEl) return;

  scrollEl.scrollTop = 0;
  scrollEl.scrollTo({ top: 0, left: 0, behavior: "instant" });

  window.requestAnimationFrame(() => {
    scrollEl.scrollTop = 0;
    scrollEl.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
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
  scrollModalToTop(target);

  const run = async () => {
    if (step === "payment") {
      await updatePaymentProviderUi();
      await updatePriceSummaryBox();
      await prepareStripePaymentStep();
    }
    if (step === "confirmation") {
      const confirmationMessage = document.getElementById("confirmationMessage");
      if (confirmationMessage) {
        confirmationMessage.style.display = prototypeState.subscription_active ? "none" : "";
      }
      syncProfileContactFields();
      await syncSitePreferenceUi();
    }
    scrollModalToTop(target);
    await refreshServiceModalI18n(getActiveReaderLang());

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

function resolveConfirmationEmail() {
  const paymentField = document.getElementById("paymentReceiptEmail")?.value.trim() || "";
  if (paymentField && paymentField.includes("@")) {
    return paymentField;
  }
  if (prototypeState.channel === "email") {
    return (prototypeState.email || "").trim();
  }
  return "";
}

async function syncPaymentReceiptEmailField() {
  const input = document.getElementById("paymentReceiptEmail");
  const label = document.querySelector('label[for="paymentReceiptEmail"]');
  if (!input) return;

  if (prototypeState.channel === "email") {
    input.value = prototypeState.email || input.value || "";
    input.required = true;
    if (label) {
      await setElementI18n(label, I18N_SV.PAYMENT_EMAIL_LABEL_EMAIL);
    }
  } else {
    input.required = true;
    if (label) {
      await setElementI18n(label, I18N_SV.PAYMENT_EMAIL_LABEL_SMS);
    }
  }
}

async function updatePaymentProviderUi() {
  await syncPaymentReceiptEmailField();

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
      if (Date.now() >= paymentToastLockUntil) {
        const lang = getActiveReaderLang();
        const name = data.nearest_site.name;
        const nearTemplates = {
          en: `SMS sent – you are near ${name}.`,
          it: `SMS inviato – sei vicino a ${name}.`,
          fr: `SMS envoyé – vous êtes près de ${name}.`,
          de: `SMS gesendet – Sie sind in der Nähe von ${name}.`,
          es: `SMS enviado – estás cerca de ${name}.`,
        };
        toast(nearTemplates[lang] || `SMS skickat – du är nära ${name}.`);
      }
    } else if (data.reason === "sms_delivery_failed") {
      showReaderToast(describeGeofencingSkipReason(data.reason));
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
        showReaderToast(hint);
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
  const delay = Math.max(5000, paymentToastLockUntil - Date.now() + 800);
  window.setTimeout(() => {
    if (prototypeState.subscription_active) {
      void reportLocationToApi();
    }
  }, delay);
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
    language: getActiveReaderLang(),
    subscription_type: "world_heritage_nearby",
    duration_days: prototypeState.duration_days
  };

  if (prototypeState.channel === "sms") {
    payload.phone = prototypeState.phone || to;
  }

  const receiptEmail =
    paymentFields.email ||
    resolveConfirmationEmail() ||
    (prototypeState.channel === "email" ? prototypeState.email || to : null);
  if (receiptEmail && receiptEmail.includes("@")) {
    payload.email = receiptEmail;
    prototypeState.email = receiptEmail;
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
      otp.value = "";
      otp.focus();
    }

    toast(data.message || "SMS-kod skickad. Kontrollera ditt mobilnummer.");
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
    showReaderToast("Inloggning genomförd via API.");
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
    const { response, data } = await fetchApiJson(
      API_ENDPOINTS.loginRequestEmailCode,
      {
        method: "POST",
        headers: apiRequestHeaders(),
        body: JSON.stringify(payload),
      },
      { timeoutMs: 12000 }
    );

    if (!response.ok) {
      const detail = data?.message || (await readApiError(response, data));
      toast(`Kunde inte skicka kod: ${detail}`);
      return;
    }

    const otp = document.getElementById("emailOtp");
    if (otp) {
      otp.value = "";
      otp.focus();
    }

    toast(data.message || "Inloggningskod skickad. Kontrollera din e-post.");
  } catch (error) {
    console.warn("request-email-code misslyckades:", error);
    toast(formatApiConnectionError(error));
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
    const { response, data } = await fetchApiJson(
      API_ENDPOINTS.loginVerifyEmailCode,
      {
        method: "POST",
        headers: apiRequestHeaders(),
        body: JSON.stringify(payload),
      },
      { timeoutMs: 10000 }
    );

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

    await updateConfirmationMessage();
    syncSettingsChannelButtons();
    openModalStep("confirmation");
    startLocationReporting();
    await localizedToast(I18N_SV.LOGIN_EMAIL_DONE);
  } catch (error) {
    console.warn("verify-email-code misslyckades:", error);
    toast(formatApiConnectionError(error));
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
      ? I18N_SV.CONFIRM_SENT_EMAIL
      : I18N_SV.CONFIRM_SENT_SMS;
  if (extra?.receipt_sent) {
    text = I18N_SV.CONFIRM_EMAIL_OWNOTRACKS;
    if (prototypeState.channel === "sms") {
      text += I18N_SV.CONFIRM_EMAIL_PLUS_SMS;
    }
  }
  if (extra?.end_date) {
    text += ` ${I18N_SV.SUBSCRIPTION_UNTIL} ${extra.end_date}.`;
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
  const lang = getCheckoutLangForPayment(
    paymentFields.checkout_lang || prototypeState.checkoutLang
  );
  prototypeState.checkoutLang = lang;
  document.documentElement.lang = lang;
  updateConfirmationMessage({
    receipt_sent: data.receipt_sent,
    end_date: data.end_date,
  });
  syncSettingsChannelButtons();
  openModalStep("confirmation");
  const statusBox = document.getElementById("subscriptionStatusBox");
  if (statusBox) {
    applyElementI18nSync(
      statusBox,
      getI18nSource(statusBox) || "Tack för din prenumeration. Prenumerationen är nu aktiv.",
      lang
    );
  }
  await refreshServiceModalI18n(lang);
  showPaymentCompleteToast(lang);

  startLocationReporting();
  return true;
}

async function paymentComplete() {
  if (!isTermsAccepted()) {
    toast("Du måste godkänna villkoren och integritetspolicyn.");
    openModalStep("subscribe");
    return;
  }

  const receiptEmail = resolveConfirmationEmail();
  if (!receiptEmail || !receiptEmail.includes("@")) {
    await localizedToast(I18N_SV.PAYMENT_EMAIL_REQUIRED);
    return;
  }
  prototypeState.email = receiptEmail;

  const lang = await ensureCheckoutLanguageReady();
  prototypeState.checkoutLang = getCheckoutLangForPayment(lang);
  document.documentElement.lang = prototypeState.checkoutLang;
  try {
    sessionStorage.setItem(READER_LANG_STORAGE_KEY, prototypeState.checkoutLang);
  } catch (_) {
    /* ignore */
  }

  const submitBtn = document.getElementById("paymentSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent =
      resolveToastText(I18N_SV.PAYING, lang) ||
      (lang === "sv" ? I18N_SV.PAYING : await translateUiText(I18N_SV.PAYING, lang, "sv"));
  }

  try {
    if (PAYMENT_CONFIG.stripe_enabled) {
      if (!stripeClient || !stripeElements || !stripeClientSecret) {
        await localizedToast(I18N_SV.STRIPE_LOADING);
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
        await localizedToast(I18N_SV.PAYMENT_NOT_CONFIRMED);
        return;
      }

      await ensureApiConnection({ silent: true });
      await completeSubscriptionAfterPayment({
        amount: SUBSCRIPTION_PRICE_SEK,
        payment_intent_id: paymentIntent.id,
        email: receiptEmail || undefined,
        checkout_lang: prototypeState.checkoutLang,
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
      await localizedToast(I18N_SV.CARD_INVALID);
      return;
    }

    await completeSubscriptionAfterPayment({
      amount: SUBSCRIPTION_PRICE_SEK,
      card_type: cardType,
      card_number: cardNumber,
      email: receiptEmail || undefined,
      checkout_lang: prototypeState.checkoutLang,
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
      const payLabelSource =
        getI18nSource(submitBtn) || "Betala och starta prenumeration";
      const activeLang = getActiveReaderLang();
      submitBtn.textContent =
        resolveI18nText(payLabelSource, activeLang, "sv") ||
        (activeLang === "sv"
          ? payLabelSource
          : resolveToastText(payLabelSource, activeLang) || payLabelSource);
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

function syncProfileContactFields() {
  const phoneInput = document.getElementById("settingsPhone");
  const emailInput = document.getElementById("settingsEmail");
  if (!phoneInput || !emailInput) return;

  phoneInput.value = prototypeState.phone || "+46";
  emailInput.value = prototypeState.email || "";
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

async function saveProfileContact() {
  const lang = getActiveReaderLang();
  const phoneInput = document.getElementById("settingsPhone");
  const emailInput = document.getElementById("settingsEmail");
  if (!phoneInput || !emailInput) return;

  const previousPhone = normalizePhoneForApi(prototypeState.phone || "");
  const newPhone = normalizePhoneForApi(phoneInput.value.trim());
  const previousEmail = (prototypeState.email || "").trim().toLowerCase();
  const newEmail = emailInput.value.trim().toLowerCase();

  if (!newPhone || newPhone.length < 8 || isPlaceholderContact(newPhone)) {
    toast(await translateUiText("Ange ett giltigt mobilnummer.", lang));
    return;
  }

  if (newEmail && (!newEmail.includes("@") || isPlaceholderContact(newEmail))) {
    toast(await translateUiText("Ange en giltig e-postadress.", lang));
    return;
  }

  if (prototypeState.channel === "email" && !newEmail) {
    toast(await translateUiText("E-postnotiser kräver en giltig e-postadress.", lang));
    return;
  }

  const phoneChanged = newPhone !== previousPhone;
  const emailChanged = newEmail !== previousEmail;

  if (!phoneChanged && !emailChanged) {
    toast(await translateUiText("Inga ändringar att spara.", lang));
    return;
  }

  const payload = buildPreferencesPayload({
    ...(phoneChanged ? { new_phone: newPhone } : {}),
    ...(emailChanged && newEmail ? { email: newEmail } : {}),
  });

  logApiPayload(
    "Uppdaterar kontaktuppgifter",
    API_ENDPOINTS.updatePreferences,
    payload
  );

  try {
    const { response, data } = await fetchApiJson(
      API_ENDPOINTS.updatePreferences,
      {
        method: "PATCH",
        headers: apiRequestHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const detail = await readApiError(response, data);
      if (response.status === 409) {
        toast(await translateUiText("Mobilnummeret används redan.", lang));
      } else {
        toast(`Kunde inte spara kontaktuppgifter: ${detail}`);
      }
      return;
    }

    if (phoneChanged) {
      prototypeState.phone = data.phone || newPhone;
      if (!prototypeState.user_id || String(prototypeState.user_id) === previousPhone) {
        prototypeState.user_id = data.user_id || prototypeState.user_id || newPhone;
      }
    }

    if (emailChanged) {
      prototypeState.email = newEmail;
    }

    syncProfileContactFields();
    toast(await translateUiText(I18N_SV.CONTACT_SAVED, lang));
  } catch (error) {
    console.warn("saveProfileContact misslyckades:", error);
    toast("Kunde inte nå API – kontrollera att servern körs.");
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
    syncProfileContactFields();
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

function isCurrentSiteMarkedVisited() {
  const siteId = currentSite?.site_id;
  if (!siteId) return false;
  const key = String(siteId);
  return prototypeState.visited_sites.some(site => String(site) === key);
}

async function syncSitePreferenceUi() {
  const markBtn = document.getElementById("markSiteVisitedBtn");
  const resetBtn = document.getElementById("resetVisitedBtn");
  if (!markBtn || !resetBtn) return;

  const visited = isCurrentSiteMarkedVisited();
  markBtn.classList.toggle("is-active", visited);
  markBtn.classList.toggle("is-inactive", !visited);
  resetBtn.classList.toggle("is-active", !visited);
  resetBtn.classList.toggle("is-inactive", visited);
  markBtn.setAttribute("aria-pressed", visited ? "true" : "false");
  resetBtn.setAttribute("aria-pressed", visited ? "false" : "true");

  await setElementI18n(markBtn, I18N_SV.PREF_MARK_VISITED);
  await setElementI18n(resetBtn, I18N_SV.PREF_WANT_SMS_AGAIN);
}

async function markSiteAsVisited() {
  const siteId = currentSite?.site_id;
  if (!siteId) {
    toast(await translateUiText("Inget världsarv valt.", getActiveReaderLang()));
    return;
  }
  if (isCurrentSiteMarkedVisited()) {
    toast(await translateUiText(I18N_SV.PREF_SMS_ALREADY_OFF, getActiveReaderLang()));
    return;
  }

  const key = String(siteId);
  if (!prototypeState.visited_sites.includes(key)) {
    prototypeState.visited_sites.push(key);
  }

  const payload = buildPreferencesPayload({
    site_id: siteId,
    visited: true,
  });

  logApiPayload(
    "Markerar världsarv som besökt",
    API_ENDPOINTS.updatePreferences,
    payload
  );

  await patchToApi(API_ENDPOINTS.updatePreferences, payload);
  await syncSitePreferenceUi();
  toast(await translateUiText(I18N_SV.PREF_SMS_STOPPED, getActiveReaderLang()));
}

async function resetSiteNotifications() {
  const siteId = currentSite?.site_id;
  if (!siteId) {
    toast(await translateUiText("Inget världsarv valt.", getActiveReaderLang()));
    return;
  }

  const key = String(siteId);
  const wasBlocked = isCurrentSiteMarkedVisited();
  prototypeState.visited_sites = prototypeState.visited_sites.filter(
    site => String(site) !== key
  );

  const payload = buildPreferencesPayload({
    site_id: siteId,
    visited: false,
  });

  logApiPayload(
    "Aktiverar SMS för världsarv",
    API_ENDPOINTS.updatePreferences,
    payload
  );

  await patchToApi(API_ENDPOINTS.updatePreferences, payload);
  await syncSitePreferenceUi();

  if (wasBlocked) {
    toast(await translateUiText(I18N_SV.PREF_SMS_ENABLED, getActiveReaderLang()));
  } else {
    toast(await translateUiText(I18N_SV.PREF_SMS_ALREADY_ON, getActiveReaderLang()));
  }
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

  if (Date.now() < paymentToastLockUntil && lockedPaymentToastMessage) {
    toastEl.textContent = lockedPaymentToastMessage;
    toastEl.classList.add("show");
    return;
  }

  toastEl.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => {
    if (Date.now() < paymentToastLockUntil) {
      return;
    }
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

  await loadHeritageSites();
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
    if (lastClosestSite) {
      await refreshClosestSiteTextOnly(lastClosestSite, finalLang);
    }
  }

  const urlStep = readUrlStep();
  if (urlStep === "confirmation") {
    openServiceModal("confirmation");
  }
}

void showGeoLoadingState();
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
window.markSiteAsVisited = markSiteAsVisited;
window.resetSiteNotifications = resetSiteNotifications;
window.syncSitePreferenceUi = syncSitePreferenceUi;
window.syncProfileContactFields = syncProfileContactFields;
window.saveProfileContact = saveProfileContact;
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

