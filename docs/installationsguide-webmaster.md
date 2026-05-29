# Installationsguide – Heritage Connect-annons

**För: Webmasters på tidningar som använder Heritage Connect**
**Version: 1.0**

---

## Vad är Heritage Connect-annonsen?

Heritage Connect-annonsen är ett litet HTML-block som ni bäddar in på er tidningssida. Den visar automatiskt det UNESCO-världsarv som befinner sig närmast läsarens position och erbjuder en prenumeration på SMS- eller e-postnotiser.

Annonsen:

- Hämtar läsarens position via webbläsaren (med tillstånd)
- Visar närmaste världsarv med bild, namn och avstånd
- Är språkanpassad efter er tidnings `lang`-attribut
- Kräver ingen inloggning för att visas

---

## Vad ni behöver

Innan ni börjar behöver ni **API-URL:en** från Dagspressutgivarna. Det är adressen till Heritage Connect-servern, t.ex.:

```text
https://api.heritage-connect.se
```

---

## Steg 1 – Sätt rätt språk på er sida

Heritage Connect läser automatiskt av ert `<html lang="...">` och anpassar annonsen. Kontrollera att er sida har rätt språkkod:

```html
<html lang="sv">   <!-- Svenska -->
<html lang="en">   <!-- Engelska -->
<html lang="de">   <!-- Tyska -->
<html lang="fr">   <!-- Franska -->
<html lang="es">   <!-- Spanska -->
<html lang="no">   <!-- Norska -->
<html lang="da">   <!-- Danska -->
<html lang="ar">   <!-- Arabiska -->
<html lang="zh">   <!-- Kinesiska -->
<html lang="ru">   <!-- Ryska -->
```

Ni behöver inte ändra något mer – annonsen hämtar språket härifrån automatiskt.

---

## Steg 2 – Hämta HTML-prototypen

Dagspressutgivarna tillhandahåller en HTML-prototyp (`index.html` med tillhörande `js/` och `css/`) som visar hur annonsen ser ut och fungerar. Använd den som referens när ni integrerar annonsen i er tidnings egna CMS eller webbplattform.

Annonsblocket i prototypen är den del som är märkt med `id="heritage-connect-ad"`. Arbeta tillsammans med er webbutvecklare för att anpassa utseendet efter er tidnings grafiska profil.

## Steg 3 – Peka annonsen mot rätt API

I er integration behöver annonsen känna till API-URL:en från Dagspressutgivarna. Den konfigureras som en variabel i JavaScript:

```javascript
const HERITAGE_CONNECT_API = "https://api.heritage-connect.se";
```

Byt ut URL:en mot den adress ni fått från Dagspressutgivarna.

---

## Steg 4 – Testa

1. Öppna sidan i en webbläsare
2. Tillåt platsinformation när webbläsaren frågar
3. Annonsen ska inom några sekunder visa det närmaste världsarvet

**Om inget visas:** Kontrollera att API-URL:en är korrekt och att servern är igång. Öppna `https://api.heritage-connect.se/` i webbläsaren – ni ska se ett JSON-svar med `"status": "running"`.

---

## Felsökning

| Problem | Lösning |
| --- | --- |
| Annonsen visas inte alls | Kontrollera att JS-filen laddas (F12 → Console) |
| "GPS stöds inte" | Webbläsaren stöder inte geolocation – annonsen visar ändå närmaste i Sverige |
| "Plats nekad" | Läsaren har nekat platsbehörighet – annonsen visar närmaste i Sverige |
| Fel språk | Kontrollera `<html lang="...">` på er sida |
| Annonsen syns men är tom | API:t är inte nåbart – kontakta Dagspressutgivarna |

---

## Anpassa utseendet (valfritt)

Annonsen följer er sidas CSS-variabler om ni definierar dessa:

```css
:root {
  --hc-primary: #1a56a0;      /* Knappfärg */
  --hc-background: #ffffff;   /* Annonsens bakgrund */
  --hc-border-radius: 8px;    /* Rundade hörn */
}
```

---

## Kontakt

Kontakta Dagspressutgivarna om ni behöver hjälp med API-URL eller tekniska frågor.
