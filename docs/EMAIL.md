# E-post – Heritage Connect

## Varför `success` men inget mail?

API:t svarar **`{"success": true, "channel": "email"}`** när förfrågan är giltig. Själva utskicket sker **i bakgrunden**.

Standard i `.env` är **`EMAIL_PROVIDER=mock`**: då loggas mailet bara i uvicorn-terminalen (`[MOCK EMAIL]`) – **ingen riktig inkorg**.

Det är det klasskamrater ser: success i test-UI, men inget e-post.

## Snabbfix: Gmail (SMTP)

1. Google-konto → **Säkerhet** → **Tvåstegsverifiering** (på).
2. **App-lösenord** → skapa lösenord för "Mail".
3. Lägg i `.env` (starta om uvicorn efteråt):

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din@gmail.com
SMTP_PASSWORD=ditt-app-losenord-16-tecken
SMTP_FROM=din@gmail.com
SMTP_USE_TLS=true
SMTP_USE_SSL=false
```

4. Testa:

```powershell
.\scripts\test-email.ps1 -To "mojgan.ghaffari@gmail.com"
```

## Railway (produktion)

Railway **Hobby/Free blockerar utgående SMTP** (port 587/465). Gmail SMTP fungerar lokalt men **inte** på Railway med dessa planer.

**Lösning:** använd en e-posttjänst med HTTPS API i Railway-miljövariabler.

### Resend (rekommenderat – enklast på Railway)

1. Skapa konto på [resend.com](https://resend.com) → **API Keys**.
2. Sätt i Railway → Variables:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM=onboarding@resend.dev
```

**Viktigt:** `onboarding@resend.dev` kan bara skicka till **samma e-postadress som Resend-kontot** (bra för egen test). För att skicka till klasskamrater: verifiera en egen domän under **Domains** i Resend, eller använd SendGrid nedan med Single Sender.

Gratisnivå: ca 3 000 mail/månad.

### SendGrid (bra utan egen domän)

1. Konto på [sendgrid.com](https://sendgrid.com) → **Settings → Sender Authentication → Single Sender Verification** (verifiera din e-post via länk).
2. **Settings → API Keys** → skapa nyckel med Mail Send.
3. Railway → Variables:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM=din@verifierade-adress.se
```

Gratisnivå: ca 100 mail/dag.

### SMTP2GO

Om SMTP2GO inte levererar till Hotmail/Gmail: byt till Resend eller SendGrid ovan. SMTP2GO kräver ofta egen domän för pålitlig leverans.

```env
EMAIL_PROVIDER=smtp2go
SMTP2GO_API_KEY=api-...
SMTP2GO_FROM=din@verifierade-adress.se
```

Använd **API** (ovan), inte SMTP-relay (`mail.smtp2go.com:587`) – SMTP blockeras på Railway Hobby.

Kontrollera konfiguration: `GET /api/integration/config` → `email_provider`, `email_railway_smtp_note`.

## Alternativ: SendGrid (Single Sender utan domän)

Se avsnittet **SendGrid** ovan.

## Test för andra grupper

```powershell
$body = '{"channel":"email","to":"mottagare@example.com","message":"Hej!","subject":"Heritage Connect test"}'
Invoke-WebRequest -Uri "https://ER-NGROK.ngrok-free.dev/api/notification/send" `
  -Method POST -Body $body -ContentType "application/json" `
  -Headers @{"ngrok-skip-browser-warning"="1"}
```

Kontrollera **spam/skräppost** om inget syns i inkorgen.
