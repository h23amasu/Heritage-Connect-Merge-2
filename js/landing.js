/**
 * Landningssida fran SMS-lank: /sites/{unesco_id}
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || document.documentElement.lang || "sv").slice(0, 2);

  const API_BASE = window.location.origin;
  const UNESCO_DESC_LANGS = ["sv", "fi", "fr", "es", "de", "it", "pt", "ar", "zh", "ru", "ja"];

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
    return (getUnescoDescription(site, "en") || site?.description || "").trim();
  }

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

  function pickDescriptionSource(site, targetLang) {
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
      localized &&
      (!referenceLen || localized.length >= referenceLen * 0.85)
    ) {
      return { text: localized, lang: target };
    }

    if (english) {
      return { text: english, lang: "en" };
    }

    if (longest.text) {
      return longest;
    }

    return { text: "", lang: target };
  }

  async function translateViaApi(text, targetLang, sourceLang = "sv") {
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

  async function resolveSiteDescription(site, targetLang) {
    const { text, lang: sourceLang } = pickDescriptionSource(site, targetLang);
    if (!text) {
      return "";
    }
    if (normalizeLanguageCode(targetLang) === normalizeLanguageCode(sourceLang)) {
      return text;
    }
    return translateViaApi(text, targetLang, sourceLang);
  }

  async function renderSite(site) {
    document.title = `${site.name} - Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const desc = document.getElementById("landingDescription");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    if (title) title.textContent = site.name || "Varldsarv";
    if (meta) {
      const parts = [site.country, site.category, site.year_inscribed].filter(Boolean);
      meta.textContent = parts.join(" · ");
    }
    if (desc) {
      const description = await resolveSiteDescription(site, lang);
      desc.textContent = description || "Ingen beskrivning tillganglig.";
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
      await renderSite(await loadFromLocalJson());
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
