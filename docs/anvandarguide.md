# Användarguide – Heritage Connect

**För dig som prenumererar och vill få SMS när du är nära ett UNESCO-världsarv**

---

## Vad är Heritage Connect?

Heritage Connect skickar **SMS** (eller e-post) när du reser nära ett världsarv som finns registrerat i tjänsten. Du prenumererar via tidningens digitala annons, betalar en gång och kan sedan få notiser under prenumerationsperioden.

För att platsen ska fungera **i bakgrunden** (när telefonen ligger i fickan) behöver du appen **OwnTracks** på mobilen. Webbplatsen kan inte läsa GPS hela tiden på egen hand – det är därför OwnTracks används.

---

## Översikt – så här gör du

| Steg | Vad du gör |
|------|------------|
| 1 | Prenumerera på Heritage Connect (mobilnummer + betalning) |
| 2 | Ladda ner **OwnTracks** (iOS eller Android) |
| 3 | Fyll i webhook-URL och **samma telefonnummer** som vid prenumerationen |
| 4 | Ge appen platsbehörighet **Alltid** + bakgrundsspårning |
| 5 | Res – första platsen blir din **hemzon**, SMS skickas när du är borta från hem och nära ett världsarv |

**Webbdemo:** [https://web-production-e43d0.up.railway.app/demo](https://web-production-e43d0.up.railway.app/demo)

---

## Steg 1 – Prenumerera

1. Öppna Heritage Connect-annonsen i tidningen (eller länken ovan).
2. Välj **Prenumerera och få SMS om världsarv nära dig**.
3. Ange **mobilnummer** i internationellt format, t.ex. `+46701234567`.
4. Välj **SMS-notiser** som kanal.
5. Betala med kort (Stripe) och slutför prenumerationen.
6. Spara numret – **samma nummer** ska in i OwnTracks senare.

Du kan senare ändra nummer, e-post och notisinställningar under **profil / prenumerationsinställningar** (Steg 4 i flödet efter inloggning).

---

## Steg 2 – Ladda ner OwnTracks

OwnTracks är en gratis app som skickar din GPS-position till Heritage Connect.

| Plattform | Ladda ner |
|-----------|-----------|
| **iPhone (iOS)** | [App Store – OwnTracks](https://apps.apple.com/app/owntracks/id1129540244) |
| **Android** | [Google Play – OwnTracks](https://play.google.com/store/apps/details?id=org.owntracks.android) |

Mer hjälp: [owntracks.org/booklet](https://owntracks.org/booklet/)

---

## Steg 3 – Konfigurera OwnTracks

Öppna OwnTracks och gå till **Settings** (iOS) eller **Preferences** (Android).

### A) Anslutning (Connection)

| Fält | Värde |
|------|--------|
| **Mode** | `HTTP` |
| **URL** | `https://web-production-e43d0.up.railway.app/api/location/owntracks` |

> Om er skola senare sätter lösenord på webhooken blir URL:en  
> `https://användare:lösenord@web-production-e43d0.up.railway.app/api/location/owntracks`  
> (ni får då användarnamn och lösenord av administratören).

**Viktigt:** Använd **HTTP-läge**, inte MQTT, om inte annat sägs.

### B) Identitet (Identification)

| Fält | Värde |
|------|--------|
| **User** | Ditt mobilnummer vid prenumerationen, t.ex. `+46701234567` |
| **Device** | Valfritt namn, t.ex. `iphone` eller `android` |

**User måste vara exakt samma nummer** som du prenumererade med. Annars kopplas inte GPS till ditt konto och du får inget SMS.

### C) Plats (Location)

| Inställning | Rekommendation |
|-------------|----------------|
| **Bakgrundsspårning** | På |
| **Platsbehörighet (iOS)** | **Alltid** – inte bara “När appen används” |
| **Platsbehörighet (Android)** | **Tillåt hela tiden** |
| **Rörelse / Publish** | Låt appen skicka position automatiskt (t.ex. vid rörelse eller med jämna intervall) |

På iPhone: **Inställningar → Integritet → Plats → OwnTracks → Alltid**.

---

## Steg 4 – Så funkar SMS-notisen

1. **Första gången** OwnTracks skickar position registreras platsen som din **hemzon** (pendlingszon). Då skickas inget SMS – det är normalt.
2. När du **lämnar hemzonen** och kommer inom ca **30 km** från ett världsarv, och du har **aktiv prenumeration**, skickas SMS.
3. Om du redan fått SMS om samma världsarv kan du i profilen markera platsen som **besökt** så att inga fler SMS skickas för just den platsen.

Exempel på SMS:

> Du är nära Gruvorna i Falun. Läs mer: https://web-production-e43d0.up.railway.app/sites/1027

---

## Steg 5 – Hantera prenumerationen

Öppna profilen i Heritage Connect (Steg 4: Bekräftelse / inställningar efter inloggning):

- **Notiskanal** – SMS eller e-post
- **Ändra kontaktuppgifter** – mobilnummer och e-post
- **Markera som besökt** – inga fler SMS om det världsarvet
- **Jag vill få fler SMS** – återaktivera SMS för platsen
- **Avsluta prenumeration** – inga fler notiser

---

## Vanliga problem

| Problem | Lösning |
|---------|---------|
| Inget SMS trots att jag är nära världsarv | Kontrollera att **User** i OwnTracks = prenumerationsnummer. Res bort från hemzonen först. |
| OwnTracks skickar men inget händer | Prenumerationen måste vara **aktiv**. Kontrollera att du valde SMS som kanal. |
| Fick SMS en gång, inte igen | Normalt om samma plats redan notifierats – återaktivera under profilinställningar om du vill. |
| “Plats nekad” i webbläsaren | OwnTracks på **mobil** ska användas för riktig bakgrunds-GPS, inte webbläsaren på dator. |
| Fel nummer i OwnTracks | Ändra till rätt `+46…` under Identification → User. |

---

## Integritet

- Heritage Connect använder din position för att avgöra om du är nära ett världsarv.
- Du kan när som helst **avsluta prenumerationen** och sluta skicka position genom att stänga av eller avinstallera OwnTracks.
- Mer information finns i **integritetspolicyn** i prenumerationsflödet.

---

## Teknisk dokumentation (för skola/admin)

- OwnTracks webhook och server: [OWNTRACKS.md](OWNTRACKS.md)
- API och integration: [API.md](API.md)
- Installationsguide för utgivare: [installationsguide-dagspressutgivarna.md](installationsguide-dagspressutgivarna.md)
