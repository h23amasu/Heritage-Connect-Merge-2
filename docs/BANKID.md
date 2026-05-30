# BankID (Sverige)

Heritage Connect stöder **mock** (demo) och **riktig BankID** via [pybankid](https://github.com/hbldh/pybankid) (API v6).

## Snabbstart – demo (mock)

Standard i `.env`:

```env
BANKID_PROVIDER=mock
```

Knappen *Logga in med BankID* bekräftar automatiskt utan BankID-app.

## Riktig BankID (testmiljö)

1. Sätt i `.env` (lokal) eller Railway Variables:

```env
BANKID_PROVIDER=bankid
BANKID_TEST_SERVER=true
```

2. **Testcertifikat** genereras automatiskt första gången (kräver `pybankid`). Alternativt ange egna filer:

```env
BANKID_CERT_FILE=/path/to/certificate.pem
BANKID_KEY_FILE=/path/to/key.pem
```

För Railway (PEM-innehåll som env, en rad med `\n`):

```env
BANKID_CERT_PEM=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
BANKID_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

3. Installera beroenden och starta servern:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

4. Öppna **`http://localhost:8000/demo`** (inte Live Server / `index.html` direkt).

5. På telefon: installera **BankID test-appen** ([Test BankID](https://www.bankid.com/utvecklare/test)). Skanna QR-koden eller klicka *Öppna BankID-appen*.

## Produktion

- Sätt `BANKID_TEST_SERVER=false`
- Anskaffa produktionscertifikat via [BankID för företag](https://www.bankid.com/foretag/anslut-foeretag)
- Ladda upp cert/key till Railway Variables (`BANKID_CERT_PEM` / `BANKID_KEY_PEM`)

## API

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/api/auth/bankid/config` | Mock eller riktig |
| POST | `/api/auth/bankid/start` | Startar order (IP från `X-Forwarded-For`) |
| GET | `/api/auth/bankid/qr?order_ref=` | QR-innehåll (poll varje sekund) |
| POST | `/api/auth/bankid/collect` | Polla status (max 1 gång/sek) |
| POST | `/api/auth/bankid/complete` | Legacy – använd collect |

## Felsökning

| Problem | Lösning |
|---------|---------|
| *Kunde inte nå API* | Kör via `/demo` på port 8000, inte VS Code Live Server |
| *BankID error: certificate* | Sätt cert eller `BANKID_TEST_SERVER=true` |
| QR fungerar inte | Använd BankID **test**-app, inte produktions-app |
| Pending forever | Godkänn i appen; collect pollas var 2:e sekund |
