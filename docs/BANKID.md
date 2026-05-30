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
| *Expecting value* / *403 Forbidden* | Auto-cert fungerar inte mot BankID längre. Använd `BANKID_PROVIDER=mock` **eller** skaffa RP-cert via [Demo Bank](https://demo.bankid.com) |
| *Kunde inte nå API* | Kör via `/demo` på port 8000, inte VS Code Live Server |
| QR fungerar inte | Använd BankID-app i **testläge**, inte produktion |
| Pending forever | Godkänn i appen; collect pollas var 2:e sekund |

## Test-BankID på telefon (kort guide)

Det finns **ingen separat “test-app”** i App Store. Ni använder vanliga **BankID-appen**, men i testläge + ett **test-BankID** från Demo Bank.

1. **Demo Bank:** [demo.bankid.com](https://demo.bankid.com) – logga in och skapa testperson + utfärda Mobilt BankID.
2. **Ladda ner BankID-appen** från App Store (iPhone) eller Google Play (Android).
3. **Ställ appen i testläge:**
   - **iPhone:** Inställningar → BankID → Utvecklare → ange `cavainternal.test.bankid.com`
   - **Android:** Öppna BankID → Inställningar → Om BankID → håll in “Felinformation” → skriv `kundtest` → starta om appen
4. **Aktivera test-BankID** enligt instruktionerna i Demo Bank (QR-kod / aktiveringskod).

**Tips:** Använd gärna en **extra telefon** – samma telefon kan inte ha både riktigt och test-BankID enkelt.

**För kurs/demo utan RP-certifikat:** sätt `BANKID_PROVIDER=mock` – då fungerar knappen direkt utan app.
