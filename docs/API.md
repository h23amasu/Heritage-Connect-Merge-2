# API-dokumentation – Heritage Connect

Bas-URL (lokal): `http://localhost:8000`

## 1. Meddelandetjänst (gemensam standard)

`POST /notification/send-notification`

| Fält | Typ | Krav |
|------|-----|------|
| type | `"sms"` \| `"email"` | Ja |
| to | telefon `+46...` eller e-post | Ja |
| message | sträng | Ja |
| subject | sträng | Nej (e-post) |
| user_id, site_id | sträng | Nej (cooldown) |

**Svar 200:** `{"success": true, "channel": "sms"}`  
**Fel:** `invalid_type`, `invalid_recipient` (400), `cooldown` (429)

Leverantör (HelloSMS, SMTP) exponeras aldrig i svaret.

**SMS-länkar:** Sätt `SITE_BASE_URL` till er publika app-URL (t.ex. Railway). Länken i SMS blir `{SITE_BASE_URL}/sites/{unesco_id}`.

**Byta meddelandetjänst med annan grupp:** Sätt `NOTIFICATION_SERVICE_URL` till deras bas-URL. Geofencing och övriga flöden anropar då `POST {NOTIFICATION_SERVICE_URL}/notification/send-notification` med samma JSON som ovan. Se `GET /api/integration/config` för aktuella URL:er.

**E-post:** Standard `EMAIL_PROVIDER=mock` loggar bara i servern – inget riktigt mail trots `success`. För leverans till inkorg: konfigurera SMTP/SendGrid i `.env` ([docs/EMAIL.md](EMAIL.md)).

---

## 2. Översättning

### En text

`POST /api/translate`

```json
{
  "text": "Du är nära Gruvorna i Falun.",
  "source_language": "sv",
  "target_language": "en"
}
```

**Svar:** `translated_text`, `original_text`, språkkoder.

### Flera texter (tidningen)

`POST /api/translate/batch`

```json
{
  "texts": ["Resandet ökar inför sommaren", "Världsarv nära dig"],
  "source_language": "sv",
  "target_language": "fi"
}
```

**Svar:** `translations` – lista i samma ordning som `texts`.

Språk: tvåbokstavskoder enligt ISO 639-1, t.ex. `sv`, `en`, `de`, `fr`, `es`, `no`, `da`, `fi`, `ar`.

---

## 3. UNESCO-data

| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | `/api/unesco/sites` | Cachad lista |
| GET | `/api/unesco/sites/{unesco_id}` | En plats |
| POST | `/api/unesco/sync` | Hämta WHC JSON → cache (+ DB) |

Backend har `GET /api/sites/closest?lat=59.97&lng=15.71`.  
Prototypen i `/demo` använder i stället lokal beräkning mot `data/heritage-sites.json`.

---

## 4. Geoposition & geofencing

`POST /api/location/update` (MAUI-format)

```json
{
  "latitude": 60.511334,
  "longitude": 14.225256,
  "phoneNo": "+46738100354"
}
```

Logik: hemradie (pendling), aktiv prenumeration, undvik dubbla SMS per plats.

---

## 5. Autentisering

| Metod | Path |
|-------|------|
| POST | `/api/auth/request-code` – body: `{"phone": "+46..."}` |
| POST | `/api/auth/verify-code` – body: `{"phone": "+46...", "code": "123456"}` |
| POST | `/api/auth/bankid/start` |
| POST | `/api/auth/bankid/complete` – body: `{"order_ref": "..."}` |

Utveckling: SMS-kod är `123456` tills HelloSMS skickar riktiga koder.

---

## 6. Prenumeration & betalning

`POST /api/subscription/create` – registrering + prenumeration (+ valfritt kort). Skickar **e-postkvitto** om `email` anges.

`POST /api/subscription/pause` – body: `{"user_id": "1", "paused": true}`

`POST /api/subscription/cancel`

`POST /api/payments/` – Mastercard/Visa (`PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY`, annars mock), `auto_renew` alltid false.

---

## 7. AI (lokala källor)

`POST /api/ai/ask`

```json
{
  "site_id": 1,
  "question": "Vad är Gruvorna i Falun?",
  "user_id": 1
}
```

Svar baseras på `data/pdf/*.txt` och databas-dokument – inte internet.  
Om källorna inte räcker: **"Vi återkommer med mer information…"** (`needs_followup: true`).  
Valfritt fält: `"language": "sv"`.

---

## 8. Användarinställningar

`GET /api/user/preferences?user_id=` eller `?phone=+46...`  
`PATCH /api/user/preferences` – pausa notiser, hemradie, besökt plats, notiskanal.

---

## HTTP-status (meddelande-API)

| Kod | Betydelse |
|-----|-----------|
| 200 | OK |
| 400 | Felaktig input |
| 429 | Cooldown |
| 500 | Serverfel |

---

## 9. Microservices (Docker)

Utveckling: kör **monolit** på port 8000 (`uvicorn app.main:app`).

Med `docker compose up` körs varje tjänst på egen port och IP – se [docs/endpoints.md](endpoints.md) §10 och `docker-compose.yml`. API-kontraktet (paths, JSON-fält) är identiskt; core anropar övriga tjänster via `*_SERVICE_URL` i `.env`.
