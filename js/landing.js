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

  const HEADING_LABELS = {
    sv: {
      "brief synthesis": "Sammanfattning",
      integrity: "Integritet",
      authenticity: "Äkthet",
      "protection and management requirements": "Skydd och förvaltning",
    },
    en: {
      "brief synthesis": "Brief synthesis",
      integrity: "Integrity",
      authenticity: "Authenticity",
      "protection and management requirements": "Protection and management",
    },
  };

  const OUV_HEADING = {
    sv: "Unescos motivering (Outstanding Universal Value)",
    en: "Outstanding Universal Value",
  };

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
    const labels = HEADING_LABELS[code] || HEADING_LABELS.en;
    const key = headingKey(rawTitle);

    if (key.startsWith("criterion")) {
      const roman = rawTitle.match(/\([ivx]+\)/i);
      if (code === "sv" && roman) {
        return `Kriterium ${roman[0]}`;
      }
      return rawTitle.trim();
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
    const code = normalizeLanguageCode(targetLang);
    const section = document.createElement("section");
    section.className = "landing-desc-section";
    const h3 = document.createElement("h3");
    h3.textContent = OUV_HEADING[code] || OUV_HEADING.en;
    section.appendChild(h3);

    sections.forEach(item => {
      const article = document.createElement("article");
      article.className = "landing-desc-chunk";
      if (item.heading) {
        const h4 = document.createElement("h4");
        h4.textContent = item.heading;
        article.appendChild(h4);
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
        body,
      });
    }

    appendJustificationSections(container, rendered, target);
  }

  async function renderSite(site) {
    document.title = `${site.name} - Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    if (title) title.textContent = site.name || "Världsarv";
    if (meta) {
      const parts = [site.country, site.category, site.year_inscribed].filter(Boolean);
      meta.textContent = parts.join(" · ");
    }

    if (hasLongUnescoText(site)) {
      await renderLongDescription(site, lang);
    } else {
      const container = document.getElementById("landingDescription");
      clearDescriptionContainer(container);
      const localized = getUnescoDescription(site, lang) || site.description || "";
      appendParagraphs(
        container,
        "landing-desc-intro",
        localized || "Ingen beskrivning tillgänglig."
      );
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

    window.__landingSite = { ...site, unesco_id: uid };

    const loading = document.getElementById("landingLoading");
    const content = document.getElementById("landingContent");
    const error = document.getElementById("landingError");
    if (loading) loading.style.display = "none";
    if (error) error.style.display = "none";
    if (content) content.style.display = "block";
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
    if (!site) return;

    if (answerBox) answerBox.textContent = "AI söker svar...";

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: site.unesco_id || site.id,
          question,
          language: lang,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "AI request failed");
      }
      if (answerBox) {
        answerBox.textContent = data.answer || "Inget svar tillgängligt.";
      }
    } catch (error) {
      if (answerBox) {
        answerBox.textContent =
          error?.message && error.message !== "AI request failed"
            ? `Kunde inte nå AI-tjänsten: ${error.message}`
            : "Kunde inte nå AI-tjänsten.";
      }
    }
  }

  document.getElementById("landingAiBtn")?.addEventListener("click", askAi);
  loadSite();
})();
