# Heritage Connect

Backend-API (GIK377) för Dagspressutgivarna AB:s digitala världsarvstjänst **Heritage Connect**.  
API-gruppens leverans: REST/JSON, gemensamt meddelande-API, översättning, UNESCO-data, geo, auth, betalning, AI och geofencing.

> **Slagen version (maj 2026):** Den här mappen innehåller både API-gruppens backend och UI-gruppens senaste prototyp (`/demo`, i18n, demo-plats, UNESCO-bilder). API följer [docs/endpoints.md](docs/endpoints.md).

## Snabbstart (demo utan Docker)

Byt ut `sökväg-till-projektmappen` mot var du laddat ner repot (t.ex. `~/Downloads/Heritage Connect-merge`).

### macOS / Linux

```bash
cd "sökväg-till-projektmappen"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Windows (PowerShell)

```powershell
cd "sökväg-till-projektmappen"
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

I `.env` ska finnas (demo):

```
APP_NAME=Heritage Connect
GEOFENCING_DEMO_MODE=true
```

Öppna [http://localhost:8000/docs](http://localhost:8000/docs) – titeln ska vara **Heritage Connect**.  
Öppna prototypen via **[http://localhost:8000/demo](http://localhost:8000/demo)** (inte `index.html` direkt – då laddas inte `data/heritage-sites.json`).

**Viktigt:** Om du fortfarande ser "AV Backend", stoppa servern med `Ctrl+C` och starta om kommandot ovan.

Test:

```powershell
.\scripts\test-sms.ps1
.\scripts\test-location.ps1
.\scripts\test-email.ps1
```

**E-post till klasskamrater:** Sätt `EMAIL_PROVIDER=smtp` i `.env` (Gmail app-lösenord) – annars svarar API `success` men skickar bara mock-logg. Se [docs/EMAIL.md](docs/EMAIL.md).

### Med PostgreSQL + microservices (Docker)

Kräver Docker Desktop. Projektet har **både monolit och microservices**:

| Läge | Hur | När |
|------|-----|-----|
| **Monolit** | `uvicorn app.main:app --port 8000` | Utveckling, demo, enkel test |
| **Microservices** | `docker compose up -d` | Produktionstest med egna IP/port per tjänst |

Microservice-entrypoints finns i projektet:

| Tjänst | Fil | Port | Docker-IP |
|--------|-----|------|-----------|
| core | `app/main.py` | 8000 | 172.28.0.20 |
| notification | `app/main_notification.py` | 8001 | 172.28.0.10 |
| translate | `app/main_translate.py` | 8002 | 172.28.0.11 |
| geo | `app/main_geo.py` | 8003 | 172.28.0.12 |
| ai | `app/main_ai.py` | 8004 | 172.28.0.13 |
| db (PostgreSQL) | — | 5432 | 172.28.0.2 |

```bash
docker compose up -d
python scripts/seed_data.py   # eller .venv/Scripts/python.exe på Windows
```

Core-tjänsten får då service-URL:er via `docker-compose.yml` (se `.env.example`).  
Sätt `GEOFENCING_DEMO_MODE=false` i `.env` om du vill köra mot PostgreSQL.

## Kurs-API:er (översikt)

| Tjänst | Endpoint |
|--------|----------|
| **Meddelanden (gemensamt)** | `POST /api/notification/send` |
| **Översättning** | `POST /api/translate`, `POST /api/translate/batch` |
| **UNESCO** | `GET /api/unesco/sites`, `POST /api/unesco/sync` |
| **Närmaste världsarv (backend)** | `GET /api/sites/closest?lat=&lng=` |
| **Plats / geofencing** | `POST /api/location/update` |
| **Auth SMS** | `POST /api/auth/request-code`, `POST /api/auth/verify-code` |
| **BankID** | `POST /api/auth/bankid/start`, `POST /api/auth/bankid/collect` – se [docs/BANKID.md](docs/BANKID.md) |
| **Prenumeration** | `POST /api/subscription/create`, `POST /api/subscription/pause`, `POST /api/subscription/cancel` |
| **Betalning** | `POST /api/payments/` |
| **AI (lokala PDF)** | `POST /api/ai/ask` |
| **Inställningar** | `GET/PATCH /api/user/preferences` |

Detaljer: [docs/API.md](docs/API.md), [docs/endpoints.md](docs/endpoints.md) och [docs/HELLOSMS.md](docs/HELLOSMS.md).

## Gemensamt meddelande-API

Request:

```json
{
  "channel": "sms",
  "to": "+46738100354",
  "message": "Hej!",
  "subject": "valfritt för e-post",
  "user_id": "abc123",
  "site_id": "site_1"
}
```

Svar vid lycka: `{"success": true, "channel": "sms"}`  
Fel: `invalid_type`, `invalid_recipient`, `cooldown` (HTTP 400/429).

## Demo / frontend

Annonsen i `/demo` räknar själv ut närmaste världsarv i webbläsaren mot `data/heritage-sites.json`.  
Bilder hämtas från UNESCO: `https://whc.unesco.org/uploads/sites/site_<unesco_id>.jpg`.

Välj **demo-plats** (Falun, Stockholm, m.fl.) i tidningen eller tillåt GPS.

## Testmiljö för andra grupper

1. Exponera API (ngrok, Azure, skolserver): `ngrok http 8000`
2. Dela bas-URL + exempel i `docs/API.md`
3. Byt leverantör genom att peka klienter mot annan grupps `POST /api/notification/send` – samma JSON-format

## Tester

```bash
pytest
```

## Projektstruktur

- `app/main.py` – monolit (alla routes + statisk `/demo`)
- `app/main_*.py` – fristående microservices (notification, translate, geo, ai)
- `app/routers/` – HTTP-endpoints
- `app/services/` – affärslogik (SMS, geo, UNESCO, AI, översättning)
- `app/clients/remote_services.py` – anropar microservices när `*_SERVICE_URL` är satt
- `data/` – UNESCO-data, PDF/txt för AI
- `scripts/` – test- och seed-skript
- `index.html` + `js/app.js` + `css/style.css` – frontend-prototyp
- `docker-compose.yml` – core + db + fyra microservices med fasta IP i nätverket `heritage_net`
