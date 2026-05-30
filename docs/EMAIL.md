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

**Lösning:** använd en e-posttjänst med HTTPS API i Railway-miljövariabler:

### SMTP2GO (bra för Railway)

1. Skapa konto på [smtp2go.com](https://www.smtp2go.com) → **Sending → API Keys**.
2. Verifiera avsändare under **Sending → Verified Senders** (domän eller enskild e-post).
3. Sätt i Railway → Variables:

```env
EMAIL_PROVIDER=smtp2go
SMTP2GO_API_KEY=api-...
SMTP2GO_FROM=din@verifierade-adress.se
```

Använd **API** (ovan), inte SMTP-relay (`mail.smtp2go.com:587`) – SMTP blockeras på Railway Hobby.

Gratisnivå: ca 1 000 mail/månad (räcker för demo/kurs).

### Resend (enklast)

1. Skapa konto på [resend.com](https://resend.com) och API-nyckel.
2. Sätt i Railway → Variables:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
RESEND_FROM=onboarding@resend.dev
```

(`onboarding@resend.dev` fungerar för test; verifiera egen domän för skarp drift.)

### SendGrid

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM=din-verifierade-avsandare@domän.se
```

Kontrollera konfiguration: `GET /api/integration/config` → `email_provider`, `email_railway_smtp_note`.

## Alternativ: SendGrid

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM=din-verifierade-avsandare@domän.se
```

## Test för andra grupper

```powershell
$body = '{"channel":"email","to":"mottagare@example.com","message":"Hej!","subject":"Heritage Connect test"}'
Invoke-WebRequest -Uri "https://ER-NGROK.ngrok-free.dev/api/notification/send" `
  -Method POST -Body $body -ContentType "application/json" `
  -Headers @{"ngrok-skip-browser-warning"="1"}
```

Kontrollera **spam/skräppost** om inget syns i inkorgen.
