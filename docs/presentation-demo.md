# Presentation – visa SMS och plats (OwnTracks)

Kort guide för att demonstrera Heritage Connect inför klass/lärare.

## Måste OwnTracks vara öppen på telefonen?

**Nej, inte nödvändigtvis.**

| Situation | Behöver appen vara öppen? |
|-----------|---------------------------|
| **Efter konfiguration** – bakgrund + plats **Alltid** | Nej. OwnTracks skickar position i bakgrunden. |
| **Under presentation med curl** (rekommenderat) | Telefonen behöver bara ta emot SMS – ingen app öppen. |
| **Live-demo med riktig GPS** | Appen kan vara stängd om bakgrund fungerar; tryck **Publish** i OwnTracks om ni vill tvinga en uppdatering direkt. |
| **Första gången / felsökning** | Öppna appen, kontrollera Settings → Connection (HTTP) och Identification (User = `+46…`). |

**Tips:** Kör terminalkommandona under presentationen – då ser publiken tydligt vad som händer. Låt mobilen ligga synlig så SMS:et syns när det kommer.

---

## Förberedelse (innan presentationen)

1. **Prenumerera** på `/demo` med ert presentationsnummer (SMS-kanal).
2. **OwnTracks** (valfritt för live): User = samma nummer, URL = webhook från steg 1 nedan.
3. Sätt nummer i terminalen:

```bash
export HERITAGE_DEMO_PHONE="+46761104465"
export HERITAGE_API_BASE="https://web-production-e43d0.up.railway.app"
```

4. Gör scriptet körbart (en gång):

```bash
chmod +x scripts/demo-presentation.sh
```

---

## Snabbkommandon (spara detta)

### 0. Visa webhook och inställningar

```bash
./scripts/demo-presentation.sh config
```

Eller:

```bash
curl -s "https://web-production-e43d0.up.railway.app/api/integration/config" | python3 -m json.tool
```

---

### 1. Testa att SMS fungerar (meddelandetjänsten)

```bash
./scripts/demo-presentation.sh sms
```

Förväntat svar: `"success": true`, `"channel": "sms"`. **SMS ska landa på telefonen.**

---

### 2. Registrera hemzon (som OwnTracks hemma)

```bash
./scripts/demo-presentation.sh home
```

Svar från OwnTracks-webhook: `[]` och HTTP 200 – **normalt**. Inget SMS än.

---

### 3. “Resa” till Falun → geofencing-SMS (syns i terminal)

```bash
./scripts/demo-presentation.sh travel
```

Förväntat svar:

```json
"notified": true,
"nearest_site": { "name": "Gruvorna i Falun", ... }
```

**SMS om världsarv ska komma till telefonen.**

---

### 3b. Samma resa som OwnTracks skickar (mobilformat)

```bash
./scripts/demo-presentation.sh owntracks-travel
```

Svar: `[]` – SMS triggas ändå i bakgrunden. Använd efter steg 2 om ni vill visa **exakt samma API** som appen.

---

### 4. Om ni redan fått SMS om Falun – nollställ

```bash
./scripts/demo-presentation.sh reset-falun
```

Kör sedan steg 3 igen.

---

### Guidad demo (allt i ett)

```bash
./scripts/demo-presentation.sh all
```

---

## Manuella curl-kommandon (utan script)

**SMS:**

```bash
curl -X POST "https://web-production-e43d0.up.railway.app/api/notification/send" \
  -H "Content-Type: application/json" \
  -d '{"channel":"sms","to":"+46761104465","message":"Test Heritage Connect","user_id":"+46761104465","site_id":"1027"}'
```

**OwnTracks (Falun):**

```bash
curl -X POST "https://web-production-e43d0.up.railway.app/api/location/owntracks" \
  -H "Content-Type: application/json" \
  -H "X-Limit-U: +46761104465" \
  -d '{"_type":"location","lat":60.60472,"lon":15.63083,"tst":1717000000,"tid":"01"}'
```

**Geofencing med synligt svar:**

```bash
curl -X POST "https://web-production-e43d0.up.railway.app/api/location/update" \
  -H "Content-Type: application/json" \
  -d '{"phoneNo":"+46761104465","latitude":60.60472,"longitude":15.63083,"simulate_travel":true}'
```

Byt `+46761104465` till ert nummer.

---

## Felsökning under presentation

| Symptom | Åtgärd |
|---------|--------|
| `"reason": "already_notified"` | `./scripts/demo-presentation.sh reset-falun` |
| `"reason": "no_active_subscription"` | Prenumerera igen på `/demo` med samma nummer |
| `"reason": "in_commute_zone"` | Kör `home` med annan plats långt bort, eller använd `travel` med `simulate_travel: true` |
| SMS API OK men inget SMS | Kontrollera HelloSMS/Railway; kolla spam |
| OwnTracks svarar `[]` men inget SMS | Normalt svar – kolla `reason` via `travel`-kommandot istället |

---

## Relaterade dokument

- [anvandarguide.md](anvandarguide.md) – slutanvändare, OwnTracks-installation
- [OWNTRACKS.md](OWNTRACKS.md) – teknisk webhook-dokumentation
