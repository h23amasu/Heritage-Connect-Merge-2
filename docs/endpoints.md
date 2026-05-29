# Heritage Connect – Endpointdokument
**Version: 1.0**  
**Bas-URL:** `http://localhost:8000` (lokal) / `https://api.heritage-connect.se` (produktion)

---

## Autentisering

De flesta endpoints accepterar en valfri Bearer-token i HTTP-headern:

```
Authorization: Bearer <token>
```

Token konfigureras i `.env` som `API_BEARER_TOKEN`. Om värdet är tomt accepteras alla anrop.

---

## 1. Systemstatus

### `GET /`
Kontrollerar att API:t körs.

**Svar 200:**
```json
{
  "app": "Heritage Connect",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

### `GET /health`
Hälsokontroll för lastbalansering och Docker.

**Svar 200:**
```json
{"status": "healthy"}
```

---

## 2. Meddelandetjänst (gemensam kursstandard)

### `POST /notification/send-notification`
Skickar SMS eller e-post.

**Body:**
```json
{
  "type": "sms",
  "to": "+46701234567",
  "message": "Du är nära Gruvorna i Falun. Se mer via din länk.",
  "subject": "Världsarv nära dig",
  "user_id": "42",
  "site_id": "1027"
}
```

| Fält | Typ | Krav | Beskrivning |
|------|-----|------|-------------|
| type | `"sms"` eller `"email"` | Ja | Meddelandekanal |
| to | sträng | Ja | Telefon `+46...` eller e-postadress |
| message | sträng (max 2000) | Ja | Meddelandetext |
| subject | sträng | Nej | Ämnesrad för e-post |
| user_id | sträng | Nej | Används för cooldown-kontroll |
| site_id | sträng | Nej | Används för cooldown-kontroll |

**Svar 200:**
```json
{"success": true, "channel": "sms"}
```

**Felkoder:**

| HTTP | error | Betydelse |
|------|-------|-----------|
| 400 | `invalid_type` | Ogiltigt type-värde |
| 400 | `invalid_recipient` | Ogiltigt telefonnummer eller e-post |
| 429 | `cooldown` | För täta meddelanden till samma mottagare |
| 500 | `send_failed` | Leverantörsfel |

---

## 3. Översättning

### `POST /api/translate`
Översätter en text.

**Body:**
```json
{
  "text": "Du är nära Gruvorna i Falun.",
  "source_language": "sv",
  "target_language": "en"
}
```

**Svar 200:**
```json
{
  "success": true,
  "source_language": "sv",
  "target_language": "en",
  "original_text": "Du är nära Gruvorna i Falun.",
  "translated_text": "You are near the Great Copper Mountain in Falun."
}
```

### `POST /api/translate/batch`
Översätter flera texter i ett anrop (används av tidningsprototypen).

**Body:**
```json
{
  "texts": ["Resandet ökar inför sommaren", "Världsarv nära dig"],
  "source_language": "sv",
  "target_language": "fi"
}
```

**Svar 200:** `translations` – array i samma ordning som `texts`.

Stödda språkkoder: tvåbokstavskoder enligt ISO 639-1, t.ex. `sv`, `en`, `de`, `fr`, `es`, `no`, `da`, `fi`, `ar`

---

## 4. UNESCO-världsarv

### `GET /api/sites/closest`
Returnerar närmaste världsarv för en koordinat. Kräver ingen inloggning.

**Query-parametrar:**
| Parameter | Typ | Exempel |
|-----------|-----|---------|
| lat | float | `59.97` |
| lng | float | `15.71` |

**Exempel:** `GET /api/sites/closest?lat=59.97&lng=15.71`

**Svar 200:**
```json
{
  "id": 1,
  "name": "Engelsbergs bruk",
  "country": "Sweden",
  "latitude": 59.9678,
  "longitude": 15.7089,
  "distance_m": 3200,
  "image_url": "https://...",
  "desc_en": "Engelsberg Ironworks is one of the best preserved...",
  "desc_sv": "Engelsbergs bruk är ett av de bäst bevarade...",
  "year_inscribed": 1993,
  "unesco_id": "401"
}
```

### `GET /api/unesco/sites`
Returnerar alla cachade UNESCO-platser.

**Svar 200:** Array av platsobjekt.

### `GET /api/unesco/sites/{unesco_id}`
Returnerar en specifik plats.

**Svar 200:** Platsobjekt.  
**Svar 404:** `{"detail": "Site not found"}`

### `POST /api/unesco/sync`
Synkroniserar UNESCO-data från WHC:s öppna API till lokal cache och databas.

**Svar 200:**
```json
{"cached_count": 1247, "db_upserted": 1247}
```

---

## 5. Geoposition och geofencing

### `POST /api/location/update`
Tar emot position från MAUI-appen och skickar notis om användaren är nära ett världsarv med aktiv prenumeration.

**Body:**
```json
{
  "latitude": 59.9678,
  "longitude": 15.7089,
  "phoneNo": "+46701234567",
  "timestamp": "2025-05-28T10:00:00"
}
```

**Svar 200:**
```json
{
  "success": true,
  "user_id": "42",
  "notified": true,
  "in_commute_zone": false,
  "nearest_site": {"name": "Engelsbergs bruk", "distance_m": 3200},
  "notification": {"channel": "sms", "to": "+46701234567"}
}
```

---

## 6. Autentisering

### `POST /api/auth/request-code`
Skickar en engångskod via SMS.

**Body:**
```json
{"phone": "+46701234567", "purpose": "login"}
```

**Svar 200:**
```json
{"message": "Kod skickad", "expires_in_seconds": 300}
```

---

### `POST /api/auth/verify-code`
Verifierar engångskoden och returnerar access-token.

**Body:**
```json
{"phone": "+46701234567", "code": "123456"}
```

**Svar 200:**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "user_id": "42",
  "method": "sms_code"
}
```

**Svar 401:** `{"detail": "Invalid code"}`

---

### `POST /api/auth/bankid/start`
Startar BankID-inloggning (demo-implementation).

**Svar 200:**
```json
{"order_ref": "abc123", "auto_start_token": "..."}
```

### `POST /api/auth/bankid/complete`
Slutför BankID-inloggning.

**Body:** `{"order_ref": "abc123"}`

**Svar 200:** Samma som `verify-code`.

---

## 7. Prenumeration och betalning

### `POST /api/subscription/create`
Skapar prenumeration med valfri kortbetalning. Skickar e-postkvitto om `email` anges.

**Body:**
```json
{
  "channel": "sms",
  "to": "+46701234567",
  "phone": "+46701234567",
  "site_id": "401",
  "site_name": "Engelsbergs bruk",
  "language": "sv",
  "duration_days": 30,
  "amount": 99,
  "card_type": "visa",
  "card_number": "4111111111111111",
  "email": "kvitto@example.com"
}
```

**Svar 200:**
```json
{
  "success": true,
  "user_id": "42",
  "subscription_id": 7,
  "subscription_active": true,
  "payment_id": 3,
  "end_date": "2025-06-28",
  "receipt_sent": true
}
```

---

### `POST /api/subscriptions/send-reminders`
Skickar SMS-påminnelse till prenumeranter vars prenumeration löper ut inom `days_before` dagar (standard: 3). Markerar `reminder_sent = true` så ingen får dubbla påminnelser. Anropas av ett schemalagt jobb på servern en gång per dag.

**Query-parameter:** `?days_before=3` (valfritt)

**Svar 200:**
```json
{"sent": 5, "checked": 7}
```

---

### `POST /api/subscription/pause`

Pausar eller återaktiverar prenumeration.

**Body:**
```json
{"user_id": "42", "paused": true}
```

**Svar 200:** `{"success": true}`

---

### `POST /api/subscription/cancel`
Avslutar prenumeration.

**Body:**
```json
{
  "user_id": "42",
  "channel": "sms",
  "to": "+46701234567"
}
```

**Svar 200:** `{"success": true}`

---

### `POST /api/payments/`
Skapar en separat betalning kopplad till en befintlig prenumeration.

**Body:**
```json
{
  "user_id": 42,
  "subscription_id": 7,
  "amount": 99,
  "card_type": "visa",
  "card_number": "4111111111111111"
}
```

Korttyp: `"visa"` eller `"mastercard"`. Automatisk förnyelse är alltid avstängd.

**Svar 201:**
```json
{
  "id": 3,
  "amount": "99.00",
  "currency": "SEK",
  "status": "completed",
  "transaction_id": "mock_tx_abc123",
  "created_at": "2025-05-28T10:00:00"
}
```

---

## 8. AI-frågesvar

### `POST /api/ai/ask`
Ställer en fråga till AI:n om ett världsarv. AI:n svarar enbart baserat på lokala UNESCO-källor (PDF/txt) – ingen internetåtkomst.

**Body:**
```json
{
  "site_id": 401,
  "question": "Varför är Engelsbergs bruk ett världsarv?",
  "user_id": 42,
  "language": "sv"
}
```

| Fält | Typ | Krav |
|------|-----|------|
| site_id | int | Ja |
| question | sträng (3–500 tecken) | Ja |
| user_id | int | Nej |
| language | sträng (t.ex. `"sv"`) | Nej (default: `"sv"`) |

**Svar 200:**
```json
{
  "answer": "Engelsbergs bruk är ett världsarv eftersom det är ett av Europas bäst bevarade järnbruk från 1600-talet...",
  "sources": ["engelsberg_bruk.txt"],
  "needs_followup": false
}
```

Om källorna inte räcker returneras `needs_followup: true` och svaret `"Vi återkommer med mer information…"`.

### `GET /api/ai/history/{user_id}`
Returnerar en användares tidigare frågor.

**Svar 200:** Array av fråge-/svarobjekt.

---

## 9. Användarinställningar

### `GET /api/user/preferences`
Hämtar inställningar för en användare.

**Query-parametrar:** `user_id=42` eller `phone=+46701234567`

**Svar 200:**
```json
{
  "success": true,
  "user_id": "42",
  "phone": "+46701234567",
  "preferred_language": "sv",
  "notifications_paused": false,
  "home_radius_km": 5.0,
  "notification_channel": "sms"
}
```

### `PATCH /api/user/preferences`
Uppdaterar inställningar.

**Body (alla fält valfria):**
```json
{
  "user_id": "42",
  "notification_channel": "email",
  "notifications_paused": false,
  "home_radius_km": 10.0,
  "preferred_language": "en",
  "site_id": "401",
  "visited": true
}
```

**Svar 200:** Uppdaterat preferensobjekt.

---

## 10. Microservice-portar och Docker-IP

| Tjänst | Port | Docker-IP | Entrypoint | Endpoints |
|--------|------|-----------|------------|-----------|
| core | 8000 | 172.28.0.20 | `app/main.py` | Alla endpoints (monolit) |
| notification | 8001 | 172.28.0.10 | `app/main_notification.py` | `/notification/send-notification`, `/api/sms/...` |
| translate | 8002 | 172.28.0.11 | `app/main_translate.py` | `/api/translate`, `/api/translate/batch` |
| geo | 8003 | 172.28.0.12 | `app/main_geo.py` | `/api/location/...`, `/api/sites/...`, `/api/unesco/...` |
| ai | 8004 | 172.28.0.13 | `app/main_ai.py` | `/api/ai/...` |
| db | 5432 | 172.28.0.2 | PostgreSQL/PostGIS | — |

**Monolit (utveckling):** kör `uvicorn app.main:app --port 8000` – alla `*_SERVICE_URL` ska vara tomma i `.env`.

**Microservice-läge:** kör `docker compose up -d`. Core (172.28.0.20) anropar notification, translate, geo och ai via HTTP enligt `app/clients/remote_services.py`. API-kontraktet (paths och JSON) är detsamma som i tabellerna ovan.

---

## HTTP-statuskoder

| Kod | Betydelse |
|-----|-----------|
| 200 | OK |
| 201 | Skapad |
| 400 | Felaktig förfrågan (se `detail` i svaret) |
| 401 | Ej autentiserad |
| 404 | Hittades inte |
| 429 | Cooldown – för täta anrop |
| 500 | Serverfel |

Interaktiv API-dokumentation (Swagger): `http://DIN-SERVER:8000/docs`
