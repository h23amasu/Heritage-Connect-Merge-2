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

## Alternativ: SendGrid

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM=din-verifierade-avsandare@domän.se
```

## Test för andra grupper

```powershell
$body = '{"channel":"email","to":"mottagare@example.com","message":"Hej!","subject":"Heritage Connect test"}'
Invoke-WebRequest -Uri "https://ER-NGROK.ngrok-free.dev/notification/send-notification" `
  -Method POST -Body $body -ContentType "application/json" `
  -Headers @{"ngrok-skip-browser-warning"="1"}
```

Kontrollera **spam/skräppost** om inget syns i inkorgen.
