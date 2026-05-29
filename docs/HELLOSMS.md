# HelloSMS – integration

Officiell dokumentation: [Använd vårt API](https://guide.hellosms.se/article/28-hellosms-api)  
PDF: [HelloSMS API v1.1](https://hellosms.se/wp-content/uploads/2024/04/HelloSMS-API-Documentation-v1.1.pdf)

## Konfiguration

1. Logga in på [app.hellosms.se](https://app.hellosms.se/)
2. Skapa API-användare: [dashboard.hellosms.se/dashboard-api](https://dashboard.hellosms.se/dashboard-api/)
3. Kopiera `.env.example` till `.env` och fyll i:

```env
SMS_PROVIDER=hellosms
HELLOSMS_API_USERNAME=...
HELLOSMS_API_PASSWORD=...
HELLOSMS_SENDER=Heritage C
HELLOSMS_TEST_MODE=true
```

`HELLOSMS_TEST_MODE=true` skickar inga riktiga SMS (rekommenderat vid utveckling).

## Tekniskt

- Endpoint: `POST https://api.hellosms.se/v1/sms/send/`
- Auth: HTTP Basic (API-användare + lösenord)
- Body: JSON med `to`, `message`, valfritt `from`, `subject`, `testMode`

Ert gemensamma API (`POST /notification/send-notification`) anropar HelloSMS internt när `SMS_PROVIDER=hellosms`. Svaret avslöjar inte leverantören.
