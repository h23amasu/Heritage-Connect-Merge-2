/**
 * Landningssida fran SMS-lank: /sites/{unesco_id}
 * Visar langa UNESCO-texter (description_en + justification_en) fran whc001.
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || document.documentElement.lang || "sv").slice(0, 2);

  const API_BASE = window.location.origin;
  const UNESCO_DESC_LANGS = ["sv", "fi", "fr", "es", "de", "it", "pt", "ar", "zh", "ru", "ja"];
  const SECTION_SPLIT =
    /(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management))/gi;

  const SECTION_TITLES = {
    sv: {
      description: "Om platsen",
      outstanding: "Outstanding Universal Value",
      brief: "Sammanfattning",
    },
    en: {
      description: "About the site",
      outstanding: "Outstanding Universal Value",
      brief: "Brief synthesis",
    },
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

  function sectionLabels(targetLang) {
    const code = normalizeLanguageCode(targetLang);
    return SECTION_TITLES[code] || SECTION_TITLES.en;
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

  function splitJustificationSections(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];
    if (!SECTION_SPLIT.test(raw)) {
      SECTION_SPLIT.lastIndex = 0;
      return [{ title: "", body: raw }];
    }
    SECTION_SPLIT.lastIndex = 0;
    return raw
      .split(SECTION_SPLIT)
      .map(part => part.trim())
      .filter(part => part.length > 40)
      .map(part => {
        const match = part.match(
          /^(Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management)\s*/i
        );
        if (!match) {
          return { title: "", body: part };
        }
        return {
          title: match[1],
          body: part.slice(match[0].length).trim() || part,
        };
      });
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
      /* ignore and fall back */
    }

    return text;
  }

  async function translateChunk(text, targetLang) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return "";
    if (trimmed.length <= 4500) {
      return translateViaApi(trimmed, targetLang, "en");
    }
    const parts = trimmed.match(/[\s\S]{1,4200}(?:\.\s|$)/g) || [trimmed];
    const translated = [];
    for (const part of parts) {
      translated.push(await translateViaApi(part.trim(), targetLang, "en"));
    }
    return translated.filter(Boolean).join("\n\n");
  }

  function clearDescriptionContainer(container) {
    if (!container) return;
    container.classList.remove("landing-desc-loading");
    container.innerHTML = "";
    container.replaceChildren();
  }

  function appendParagraph(parent, className, text) {
    if (!text?.trim()) return;
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text.trim();
    parent.appendChild(p);
  }

  function appendSection(container, heading, chunks) {
    if (!chunks.length) return;
    const section = document.createElement("section");
    section.className = "landing-desc-section";
    if (heading) {
      const h = document.createElement("h3");
      h.textContent = heading;
      section.appendChild(h);
    }
    chunks.forEach(chunk => {
      const block = document.createElement("div");
      block.className = "landing-desc-chunk";
      if (chunk.title) {
        const sub = document.createElement("strong");
        sub.textContent = `${chunk.title}. `;
        block.appendChild(sub);
      }
      const span = document.createElement("span");
      span.textContent = chunk.body || chunk;
      block.appendChild(span);
      section.appendChild(block);
    });
    container.appendChild(section);
  }

  async function renderLongDescription(site, targetLang) {
    const container = document.getElementById("landingDescription");
    if (!container) return;

    const labels = sectionLabels(targetLang);
    const descEn = englishDescriptionForSite(site);
    const justEn = (site?.justification_en || "").trim();
    const target = normalizeLanguageCode(targetLang);

    clearDescriptionContainer(container);

    if (!descEn && !justEn) {
      const fallback = getUnescoDescription(site, target) || "Ingen beskrivning tillganglig.";
      appendParagraph(container, "landing-desc-intro", fallback);
      return;
    }

    const introText = descEn ? await translateChunk(descEn, target) : "";
    appendParagraph(container, "landing-desc-intro", introText);

    if (!justEn) return;

    const sections = splitJustificationSections(justEn);
    const translatedSections = [];
    for (const section of sections) {
      translatedSections.push({
        title: section.title ? await translateChunk(section.title, target) : "",
        body: await translateChunk(section.body, target),
      });
    }

    appendSection(container, labels.outstanding, translatedSections);
  }

  async function renderSite(site) {
    document.title = `${site.name} - Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    if (title) title.textContent = site.name || "Varldsarv";
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
      appendParagraph(
        container,
        "landing-desc-intro",
        localized || "Ingen beskrivning tillganglig."
      );
    }

    if (img) {
      img.src = site.image_url || unescoImageUrl(uid);
      img.alt = site.name || "Varldsarv";
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
      /* fall back to local JSON */
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
      toast("Skriv en fraga forst.");
      return;
    }
    if (!site) return;

    if (answerBox) answerBox.textContent = "AI soker svar...";

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
        answerBox.textContent = data.answer || "Inget svar tillgangligt.";
      }
    } catch (error) {
      if (answerBox) {
        answerBox.textContent =
          error?.message && error.message !== "AI request failed"
            ? `Kunde inte na AI-tjansten: ${error.message}`
            : "Kunde inte na AI-tjansten.";
      }
    }
  }

  document.getElementById("landingAiBtn")?.addEventListener("click", askAi);
  loadSite();
})();
