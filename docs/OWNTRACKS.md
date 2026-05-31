# OwnTracks – bakgrunds-GPS för geofencing-SMS

**Användarguide (svenska, steg för steg):** [anvandarguide.md](anvandarguide.md)

Webbplatsen kan **inte** läsa plats i bakgrunden utan att användaren godkänner om och om igen (särskilt på dator). För riktig “hela tiden”-spårning använder ni **OwnTracks** på **mobil** (iOS/Android).

Officiell guide: [owntracks.org/booklet](https://owntracks.org/booklet/)

## Så funkar det

```
Mobil (OwnTracks)  ──HTTP POST──►  Heritage Connect (/api/location/owntracks)
                                         │
                                         ▼
                                   Geofencing-logik
                                         │
                                         ▼
                                   SMS via HelloSMS
```

1. Användaren prenumererar i Heritage Connect med **SMS** och sitt telefonnummer.
2. OwnTracks-appen skickar position automatiskt i bakgrunden till er server.
3. Servern kör samma geofencing som `POST /api/location/update`:
   - första position = **hemzon**
   - utanför hemzon + inom ~30 km från världsarv + aktiv prenumeration → **SMS**

## Konfiguration i Railway

```env
GEOFENCING_DEMO_MODE=true
SMS_PROVIDER=hellosms
HELLOSMS_API_USERNAME=...
HELLOSMS_API_PASSWORD=...
HELLOSMS_SENDER=Heritage C
HELLOSMS_TEST_MODE=false
SITE_BASE_URL=https://web-production-e43d0.up.railway.app

# Valfritt men rekommenderat – HTTP Basic Auth på webhook
OWOTRACKS_HTTP_USER=heritage
OWOTRACKS_HTTP_PASSWORD=ert-lösenord
```

Webhook-URL (visas också i `GET /api/integration/config`):

```
https://web-production-e43d0.up.railway.app/api/location/owntracks
```

## OwnTracks-appen (iOS / Android)

1. Installera **OwnTracks** från App Store / Google Play.
2. **Settings → Connection**
   - **Mode:** HTTP
   - **URL:**  
     `https://heritage:ert-lösenord@web-production-e43d0.up.railway.app/api/location/owntracks`  
     *(om ni satt OWOTRACKS_HTTP_USER/PASSWORD; annars utan user:pass)*
3. **Settings → Identification**
   - **User:** `+46738100354` ← **samma nummer som prenumerationen** (E.164, med +46)
   - **Device:** t.ex. `iphone`
4. **Settings → Location** (iOS)
   - Slå på bakgrundsspårning
   - Ge appen **“Alltid”** platsbehörighet (inte bara “När appen används”)
5. Tryck **Publish** / låt appen skicka enligt intervall (t.ex. var 15:e minut i rörelse).

### Viktigt

| Krav | Varför |
|------|--------|
| User = telefonnummer | Servern kopplar plats till rätt prenumerant |
| Samma nummer som i Heritage Connect | Annars `no_active_subscription` |
| HelloSMS konfigurerat | Annars inget SMS trots triggad geofencing |
| Resa bort från hemzon | Första fix blir “hem” – SMS skickas först på resa |

## Test utan att resa

Webb-demo använder **Demo-plats** och `simulate_travel`. OwnTracks skickar riktig GPS – för test:

1. Prenumerera med ditt nummer på hemsidan.
2. OwnTracks hemma → första POST registrerar hem.
3. Res till Falun / Engelsberg (eller annan plats nära världsarv) → SMS ska triggas.

Alternativt: anropa manuellt med curl (samma format som OwnTracks):

```bash
curl -X POST "https://web-production-e43d0.up.railway.app/api/location/owntracks" \
  -H "Content-Type: application/json" \
  -H "X-Limit-U: +46738100354" \
  -d '{"_type":"location","lat":59.9678,"lon":15.7089,"tst":1717000000,"tid":"01"}'
```

## Felsökning

| `reason` i loggar | Betydelse |
|-------------------|-----------|
| `home_registered` | Första positionen – normalt |
| `in_commute_zone` | Fortfarande nära hem |
| `no_nearby_site` | Inget världsarv inom 30 km |
| `no_active_subscription` | Fel telefonnummer eller ej prenumererat |
| `already_notified` | Redan SMS för detta världsarv |
| `sms_delivery_failed` | HelloSMS/Railway-problem |

Kontrollera webhook: `GET /api/integration/config` → `owntracks_webhook_url`.
