/**
 * Landningssida fran SMS-lank: /sites/{unesco_id}
 * Lang UNESCO-text (whc001) med fasta avsnittsrubriker – rubriker oversatts inte via API.
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || document.documentElement.lang || "sv").slice(0, 2);

  const API_BASE = window.location.origin;

  const SECTION_SPLIT =
    /(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements))/gi;

  const SECTION_HEADER =
    /^(Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*/i;

  /** Läsarvänliga rubriker – inga engelska UNESCO-termer i svensk UI */
  const READER_LABELS = {
    sv: {
      ouv: "Varför platsen är världsarv",
      "brief synthesis": "Sammanfattning",
      integrity: "Bevarandetillstånd",
      authenticity: "Äkthet",
      "protection and management requirements": "Skydd och förvaltning",
    },
    en: {
      ouv: "Why this site is World Heritage",
      "brief synthesis": "Summary",
      integrity: "Integrity",
      authenticity: "Authenticity",
      "protection and management requirements": "Protection and management",
    },
    fi: {
      ouv: "Miksi kohde on maailmanperintöä",
      "brief synthesis": "Yhteenveto",
      integrity: "Eheys",
      authenticity: "Aitous",
      "protection and management requirements": "Suojelu ja hoito",
    },
    de: {
      ouv: "Warum die Stätte Welterbe ist",
      "brief synthesis": "Zusammenfassung",
      integrity: "Integrität",
      authenticity: "Authentizität",
      "protection and management requirements": "Schutz und Verwaltung",
    },
    fr: {
      ouv: "Pourquoi ce site est classé",
      "brief synthesis": "Synthèse",
      integrity: "Intégrité",
      authenticity: "Authenticité",
      "protection and management requirements": "Protection et gestion",
    },
    es: {
      ouv: "Por qué es patrimonio mundial",
      "brief synthesis": "Síntesis",
      integrity: "Integridad",
      authenticity: "Autenticidad",
      "protection and management requirements": "Protección y gestión",
    },
  };

  function readerLabels(targetLang) {
    const code = normalizeLanguageCode(targetLang);
    return READER_LABELS[code] || READER_LABELS.en;
  }

  /** Vad UNESCO:s kriterium (i)–(vi) betyder för läsaren */
  const CRITERION_EXPLAIN = {
    sv: {
      "(i)": "Platsen är ett konstnärligt eller vetenskapligt mästerverk.",
      "(ii)": "Platsen visar ett viktigt utbyte mellan mänskliga värderingar eller har haft stort internationellt inflytande.",
      "(iii)": "Platsen är ett unikt vittnesbörd om en kultur eller civilisation.",
      "(iv)": "Platsen är ett enastående exempel på en viss typ av byggnad, landskap eller teknik.",
      "(v)": "Platsen är ett traditionellt samhälle eller traditionellt bruk av land/hav.",
      "(vi)": "Platsen har koppling till viktiga händelser eller levande traditioner.",
    },
    en: {
      "(i)": "The site represents a masterpiece of human creativity.",
      "(ii)": "The site shows important interchange of human values or major international influence.",
      "(iii)": "The site bears unique testimony to a cultural tradition or civilization.",
      "(iv)": "The site is an outstanding example of a type of building, landscape, or technology.",
      "(v)": "The site is a traditional human settlement or land/sea use.",
      "(vi)": "The site is associated with living traditions or significant events.",
    },
    fi: {
      "(ii)": "Kohde kuvastaa merkittävää kansainvälistä vuorovaikutusta tai vaikutusta.",
      "(iv)": "Kohde on erinomainen esimerkki tietystä paikka- tai rakennustyypistä.",
    },
  };

  function criterionExplanation(rawTitle, targetLang) {
    const roman = String(rawTitle || "").match(/\([ivx]+\)/i);
    if (!roman) return "";
    const code = normalizeLanguageCode(targetLang);
    const hints = CRITERION_EXPLAIN[code] || CRITERION_EXPLAIN.en;
    return hints[roman[0].toLowerCase()] || hints[roman[0]] || "";
  }

  function toast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
  }

  function unescoImageUrl(unescoId) {
    if (!unescoId) return "";
    return `https://whc.unesco.org/uploads/sites/site_${unescoId}.jpg`;
  }

  function normalizeLanguageCode(value) {
    return String(value || "sv").toLowerCase().slice(0, 2);
  }

  function getUnescoDescription(site, language) {
    const key = `desc_${normalizeLanguageCode(language)}`;
    return String(site?.[key] || "").trim();
  }

  function englishDescriptionForSite(site) {
    return (
      (site?.description_en || "").trim() ||
      getUnescoDescription(site, "en") ||
      (site?.description || "").trim()
    );
  }

  function hasLongUnescoText(site) {
    return Boolean(
      site?.has_long_description ||
        (site?.description_en || "").trim() ||
        (site?.justification_en || "").trim()
    );
  }

  function headingKey(rawTitle) {
    return String(rawTitle || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function localizeSectionHeading(rawTitle, targetLang) {
    const code = normalizeLanguageCode(targetLang);
    const labels = readerLabels(targetLang);
    const key = headingKey(rawTitle);

    if (key.startsWith("criterion")) {
      const roman = rawTitle.match(/\([ivx]+\)/i);
      if (!roman) {
        return labels.criterion || "Kriterium";
      }
      const numeral = roman[0].replace(/[()]/g, "").toUpperCase();
      const templates = {
        sv: `UNESCO-kriterium ${numeral}`,
        en: `UNESCO criterion ${numeral}`,
        fi: `UNESCO-kriteeri ${numeral}`,
        de: `UNESCO-Kriterium ${numeral}`,
        fr: `Critère UNESCO ${numeral}`,
        es: `Criterio UNESCO ${numeral}`,
      };
      return templates[code] || templates.en;
    }

    return labels[key] || rawTitle.trim();
  }

  function splitJustificationSections(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];

    const parts = SECTION_SPLIT.test(raw) ? raw.split(SECTION_SPLIT) : [raw];
    SECTION_SPLIT.lastIndex = 0;

    return parts
      .map(part => part.trim())
      .filter(part => part.length > 40)
      .map(part => {
        const match = part.match(SECTION_HEADER);
        if (!match) {
          return { titleKey: "", titleRaw: "", body: part };
        }
        return {
          titleKey: headingKey(match[1]),
          titleRaw: match[1],
          body: part.slice(match[0].length).trim() || part,
        };
      });
  }

  function splitIntoParagraphs(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];
    if (trimmed.includes("\n\n")) {
      return trimmed
        .split(/\n\s*\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
    if (!sentences || sentences.length <= 4) {
      return [trimmed];
    }
    const paragraphs = [];
    let bucket = "";
    sentences.forEach((sentence, index) => {
      bucket += sentence.trim() + " ";
      if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
        paragraphs.push(bucket.trim());
        bucket = "";
      }
    });
    return paragraphs.filter(Boolean);
  }

  async function translateViaApi(text, targetLang, sourceLang = "en") {
    const target = normalizeLanguageCode(targetLang);
    const source = normalizeLanguageCode(sourceLang);

    if (!text?.trim() || target === source) {
      return text || "";
    }

    try {
      const response = await fetch(`${API_BASE}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source_language: source,
          target_language: target,
        }),
      });
      const data = await response.json();
      if (response.ok && data?.translated_text?.trim()) {
        return data.translated_text.trim();
      }
    } catch (_) {
      /* ignore */
    }

    return text;
  }

  async function translateBody(text, targetLang) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return "";
    const target = normalizeLanguageCode(targetLang);
    if (target === "en") {
      return trimmed;
    }
    if (trimmed.length <= 4800) {
      return translateViaApi(trimmed, target, "en");
    }
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [trimmed];
    const blocks = [];
    let chunk = "";
    for (const sentence of sentences) {
      if ((chunk + sentence).length > 4000 && chunk) {
        blocks.push(chunk.trim());
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    }
    if (chunk.trim()) {
      blocks.push(chunk.trim());
    }
    const translated = [];
    for (const block of blocks) {
      translated.push(await translateViaApi(block, target, "en"));
    }
    return translated.filter(Boolean).join(" ");
  }

  function clearDescriptionContainer(container) {
    if (!container) return;
    container.classList.remove("landing-desc-loading");
    container.replaceChildren();
  }

  function appendParagraphs(parent, className, text) {
    splitIntoParagraphs(text).forEach(paragraph => {
      const p = document.createElement("p");
      p.className = className;
      p.textContent = paragraph;
      parent.appendChild(p);
    });
  }

  function appendJustificationSections(container, sections, targetLang) {
    const labels = readerLabels(targetLang);
    const section = document.createElement("section");
    section.className = "landing-desc-section";
    const h3 = document.createElement("h3");
    h3.textContent = labels.ouv;
    section.appendChild(h3);

    sections.forEach(item => {
      const article = document.createElement("article");
      article.className = "landing-desc-chunk";
      if (item.heading) {
        const h4 = document.createElement("h4");
        h4.textContent = item.heading;
        article.appendChild(h4);
      }
      if (item.criterionHint) {
        const hint = document.createElement("p");
        hint.className = "landing-criterion-hint";
        hint.textContent = item.criterionHint;
        article.appendChild(hint);
      }
      appendParagraphs(article, "landing-desc-para", item.body);
      section.appendChild(article);
    });

    container.appendChild(section);
  }

  async function renderLongDescription(site, targetLang) {
    const container = document.getElementById("landingDescription");
    if (!container) return;

    const descEn = englishDescriptionForSite(site);
    const justEn = (site?.justification_en || "").trim();
    const target = normalizeLanguageCode(targetLang);

    clearDescriptionContainer(container);

    if (!descEn && !justEn) {
      const fallback = getUnescoDescription(site, target) || "Ingen beskrivning tillgänglig.";
      appendParagraphs(container, "landing-desc-intro", fallback);
      return;
    }

    if (descEn) {
      const introText = await translateBody(descEn, target);
      appendParagraphs(container, "landing-desc-intro", introText);
    }

    if (!justEn) return;

    const parsed = splitJustificationSections(justEn);
    const rendered = [];
    for (const part of parsed) {
      const body = await translateBody(part.body, target);
      rendered.push({
        heading: part.titleRaw
          ? localizeSectionHeading(part.titleRaw, target)
          : "",
        criterionHint: part.titleRaw
          ? criterionExplanation(part.titleRaw, target)
          : "",
        body,
      });
    }

    appendJustificationSections(container, rendered, target);
  }

  function parseSiteId(site) {
    const raw = String(site?.unesco_id || site?.id || siteRef || "").trim();
    const numeric = Number.parseInt(raw, 10);
    return Number.isFinite(numeric) ? numeric : raw;
  }

  function formatApiError(data, fallback) {
    if (!data?.detail) return fallback;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map(entry => entry?.msg || entry?.message || "")
        .filter(Boolean)
        .join(" ");
    }
    return fallback;
  }

  function showPageContent() {
    const loading = document.getElementById("landingLoading");
    const content = document.getElementById("landingContent");
    const error = document.getElementById("landingError");
    if (loading) loading.style.display = "none";
    if (error) error.style.display = "none";
    if (content) content.style.display = "block";
  }

  async function renderSite(site) {
    document.title = `${site.name} - Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    window.__landingSite = { ...site, unesco_id: uid };
    showPageContent();

    if (title) title.textContent = site.name || "Världsarv";
    if (meta) {
      const parts = [site.country, site.category, site.year_inscribed].filter(Boolean);
      meta.textContent = parts.join(" · ");
    }

    if (img) {
      img.src = site.image_url || unescoImageUrl(uid);
      img.alt = site.name || "Världsarv";
      img.onerror = () => {
        img.style.display = "none";
      };
    }
    if (profileLink) {
      const profileParams = new URLSearchParams({
        site: uid,
        step: "confirmation",
      });
      if (lang) {
        profileParams.set("lang", lang);
      }
      profileLink.href = `/demo?${profileParams.toString()}`;
    }

    const descContainer = document.getElementById("landingDescription");
    if (hasLongUnescoText(site)) {
      try {
        await renderLongDescription(site, lang);
      } catch (_) {
        if (descContainer) {
          clearDescriptionContainer(descContainer);
          appendParagraphs(
            descContainer,
            "landing-desc-para",
            "Kunde inte visa hela UNESCO-texten just nu. Du kan fortfarande ställa frågor till AI nedan."
          );
        }
      }
    } else if (descContainer) {
      clearDescriptionContainer(descContainer);
      const localized = getUnescoDescription(site, lang) || site.description || "";
      appendParagraphs(
        descContainer,
        "landing-desc-intro",
        localized || "Ingen beskrivning tillgänglig."
      );
    }
  }

  function showError() {
    const loading = document.getElementById("landingLoading");
    const content = document.getElementById("landingContent");
    const error = document.getElementById("landingError");
    if (loading) loading.style.display = "none";
    if (content) content.style.display = "none";
    if (error) error.style.display = "block";
  }

  async function loadFromLocalJson() {
    const response = await fetch("/data/heritage-sites.json");
    if (!response.ok) throw new Error("json_unavailable");
    const sites = await response.json();
    const site = sites.find(
      item => String(item.unesco_id) === siteRef || String(item.id) === siteRef
    );
    if (!site) throw new Error("not_found");
    return site;
  }

  async function enrichSiteFromApi(site) {
    const uid = String(site.unesco_id || site.id || siteRef);
    try {
      const response = await fetch(
        `${API_BASE}/api/sites/public/${encodeURIComponent(uid)}?lang=${lang}`
      );
      if (response.ok) {
        return response.json();
      }
    } catch (_) {
      /* use partial site */
    }
    return site;
  }

  async function loadSite() {
    if (!siteRef) {
      showError();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/sites/public/${encodeURIComponent(siteRef)}?lang=${lang}`
      );
      if (response.ok) {
        await renderSite(await response.json());
        return;
      }
    } catch (_) {
      /* fall back */
    }

    try {
      const site = await loadFromLocalJson();
      await renderSite(await enrichSiteFromApi(site));
    } catch (_) {
      showError();
    }
  }

  async function askAi() {
    const input = document.getElementById("landingAiInput");
    const answerBox = document.getElementById("landingAiAnswer");
    const site = window.__landingSite;
    const question = input ? input.value.trim() : "";

    if (!question) {
      toast("Skriv en fråga först.");
      return;
    }
    if (!site) {
      toast("Platsen laddas fortfarande – vänta ett ögonblick.");
      return;
    }

    const siteId = parseSiteId(site);
    if (!siteId) {
      toast("Ogiltigt plats-id.");
      return;
    }

    if (answerBox) answerBox.textContent = "AI söker svar...";

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          question,
          language: lang,
        }),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }
      if (!response.ok) {
        throw new Error(formatApiError(data, `AI-fel (${response.status})`));
      }
      if (answerBox) {
        answerBox.textContent = data.answer || "Inget svar tillgängligt.";
      }
    } catch (error) {
      if (answerBox) {
        answerBox.textContent = `Kunde inte nå AI: ${error?.message || "okänt fel"}`;
      }
    }
  }

  document.getElementById("landingAiBtn")?.addEventListener("click", askAi);
  document.getElementById("landingAiInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      askAi();
    }
  });
  loadSite();
})();
