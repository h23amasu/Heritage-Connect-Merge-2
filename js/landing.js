/**
 * Landningssida fran SMS-lank: /sites/{unesco_id}
 * Lang UNESCO-text som stycken – inga delrubriker, bara styckindelning.
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || document.documentElement.lang || "sv").slice(0, 2);

  const API_BASE_STORAGE_KEY = "heritage_connect_api_base_url";
  const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

  function normalizeApiBaseUrl(raw) {
    if (!raw || !String(raw).trim()) {
      return DEFAULT_API_BASE_URL;
    }
    let url = String(raw).trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    return url;
  }

  function resolveApiBase() {
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored) {
        return normalizeApiBaseUrl(stored);
      }
    } catch (_) {
      /* ignore */
    }
    const { origin, hostname, port } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return origin;
    }
    if (port === "8000" || port === "8080") {
      return origin;
    }
    return DEFAULT_API_BASE_URL;
  }

  const API_BASE = resolveApiBase();

  if (siteRef) {
    window.__landingSite = { unesco_id: siteRef, id: siteRef };
  }

  const SECTION_SPLIT =
    /(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements))/gi;

  const SECTION_HEADER =
    /^(Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*/i;

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

  /** Ta bort UNESCO-rubriker ur löptext – stycken behålls, rubriker visas inte */
  function stripUnescoHeaders(text) {
    return String(text || "")
      .replace(SECTION_HEADER, "")
      .replace(
        /\b(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*/gi,
        " "
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /** Delar i stycken vid UNESCO-avsnitt (semantiskt) utan att visa rubriker */
  function splitIntoSemanticBlocks(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];

    if (!SECTION_SPLIT.test(raw)) {
      SECTION_SPLIT.lastIndex = 0;
      return [raw];
    }
    SECTION_SPLIT.lastIndex = 0;

    return raw
      .split(SECTION_SPLIT)
      .map(part => stripUnescoHeaders(part))
      .filter(part => part.length > 40);
  }

  function splitIntoParagraphs(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];

    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
    if (!sentences || sentences.length <= 3) {
      return [trimmed];
    }

    const paragraphs = [];
    let bucket = "";
    sentences.forEach((sentence, index) => {
      const piece = sentence.trim();
      if (!piece) return;
      bucket = bucket ? `${bucket} ${piece}` : piece;
      if ((index + 1) % 4 === 0 || index === sentences.length - 1) {
        paragraphs.push(bucket);
        bucket = "";
      }
    });
    if (bucket) {
      paragraphs.push(bucket);
    }
    return paragraphs.filter(p => p.length > 20);
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
    const trimmed = stripUnescoHeaders(text);
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

  async function renderLongDescription(site, targetLang) {
    const container = document.getElementById("landingDescription");
    if (!container) return;

    const descEn = englishDescriptionForSite(site);
    const justEn = (site?.justification_en || "").trim();
    const target = normalizeLanguageCode(targetLang);

    clearDescriptionContainer(container);

    if (!descEn && !justEn) {
      const fallback = getUnescoDescription(site, target) || "Ingen beskrivning tillgänglig.";
      appendParagraphs(container, "landing-desc-para", fallback);
      return;
    }

    if (descEn) {
      const introText = await translateBody(descEn, target);
      appendParagraphs(container, "landing-desc-para", introText);
    }

    if (!justEn) return;

    const blocks = splitIntoSemanticBlocks(justEn);
    for (const block of blocks) {
      const translated = await translateBody(block, target);
      appendParagraphs(container, "landing-desc-para", translated);
    }
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

  function setAiAnswer(text, { loading = false } = {}) {
    const answerBox = document.getElementById("landingAiAnswer");
    if (!answerBox) return;
    answerBox.textContent = text;
    answerBox.classList.toggle("is-active", Boolean(text) || loading);
    if (text && !loading) {
      answerBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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
      if (descContainer) {
        descContainer.classList.add("landing-desc-loading");
        descContainer.textContent = "Laddar UNESCO-text…";
      }
      renderLongDescription(site, lang)
        .catch(() => {
          if (!descContainer) return;
          clearDescriptionContainer(descContainer);
          appendParagraphs(
            descContainer,
            "landing-desc-para",
            "Kunde inte visa hela UNESCO-texten just nu. Du kan fortfarande ställa frågor till AI nedan."
          );
        })
        .finally(() => {
          descContainer?.classList.remove("landing-desc-loading");
        });
    } else if (descContainer) {
      clearDescriptionContainer(descContainer);
      const localized = getUnescoDescription(site, lang) || site.description || "";
      appendParagraphs(
        descContainer,
        "landing-desc-para",
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
    const askBtn = document.getElementById("landingAiBtn");
    const site = window.__landingSite;
    const question = input ? input.value.trim() : "";

    if (!question) {
      toast("Skriv en fråga först.");
      return;
    }

    const siteId = parseSiteId(site);
    if (!siteId) {
      toast("Platsen laddas fortfarande – vänta ett ögonblick.");
      return;
    }

    setAiAnswer("AI söker svar…", { loading: true });
    if (askBtn) askBtn.disabled = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          question,
          language: lang,
        }),
        signal: controller.signal,
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
      setAiAnswer(data.answer || "Inget svar tillgängligt.");
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      const isNetwork =
        error?.message === "Failed to fetch" || error?.name === "TypeError";
      let message = error?.message || "okänt fel";
      if (isAbort) {
        message = "Tidsgräns (60 s). Försök igen.";
      } else if (isNetwork) {
        message =
          `Kunde inte nå ${API_BASE}. Öppna sidan via Railway eller starta backend på port 8000 (inte Live Server).`;
      }
      setAiAnswer(`Kunde inte nå AI: ${message}`);
    } finally {
      clearTimeout(timeoutId);
      if (askBtn) askBtn.disabled = false;
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
