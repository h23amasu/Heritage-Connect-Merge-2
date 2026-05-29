/**
 * Landningssida från SMS-länk: /sites/{unesco_id}
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || document.documentElement.lang || "sv").slice(0, 2);

  const API_BASE = window.location.origin;

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

  function pickDescription(site) {
    const key = `desc_${lang}`;
    return site[key] || site.description || site.desc_en || site.desc_sv || "";
  }

  function renderSite(site) {
    document.title = `${site.name} – Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const desc = document.getElementById("landingDescription");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    if (title) title.textContent = site.name || "Världsarv";
    if (meta) {
      const parts = [site.country, site.category, site.year_inscribed].filter(Boolean);
      meta.textContent = parts.join(" · ");
    }
    if (desc) {
      desc.textContent = pickDescription(site) || "Ingen beskrivning tillgänglig.";
    }
    if (img) {
      img.src = site.image_url || unescoImageUrl(uid);
      img.alt = site.name || "Världsarv";
      img.onerror = () => {
        img.style.display = "none";
      };
    }
    if (profileLink) {
      profileLink.href = `/demo?site=${encodeURIComponent(uid)}`;
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
        renderSite(await response.json());
        return;
      }
    } catch (_) {
      /* fall back to local JSON */
    }

    try {
      renderSite(await loadFromLocalJson());
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

    if (answerBox) answerBox.textContent = "AI söker svar…";

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
      if (answerBox) {
        answerBox.textContent = data.answer || "Inget svar tillgängligt.";
      }
    } catch (_) {
      if (answerBox) answerBox.textContent = "Kunde inte nå AI-tjänsten.";
    }
  }

  document.getElementById("landingAiBtn")?.addEventListener("click", askAi);
  loadSite();
})();
