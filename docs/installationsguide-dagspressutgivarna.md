# Installationsguide – Heritage Connect
**För: Dagspressutgivarna AB**
**Version: 1.0**

---

## Vad är Heritage Connect?

Heritage Connect är ett backend-system som gör det möjligt för er att erbjuda tidningsläsare SMS- och e-postnotiser om UNESCO-världsarv i närheten. Systemet hanterar:

- Geolokalisering och närmaste världsarv
- SMS- och e-postutskick
- Prenumerationer och betalning (Visa/Mastercard via Stripe)
- Automatisk översättning av annonstexter
- AI-frågesvar om världsarv

---

## Krav

### Server
Ni behöver en **Loopia VPS** (Virtual Private Server) – **inte** delat webbhotell. Rekommenderad specifikation:

| Krav | Minimum |
|------|---------|
| OS | Ubuntu 22.04 LTS |
| RAM | 2 GB |
| Disk | 20 GB |
| Portar öppna | 80, 443, 8000 |

> Logga in på Loopia Kundzon → VPS → välj Ubuntu 22.04 vid skapande av server.

### Domännamn (rekommenderat)
Peka er domän mot VPS-serverns IP-adress via Loopia DNS-hantering.

---

## Installation – steg för steg

### 1. Anslut till servern

```bash
ssh root@DIN-SERVER-IP
```

### 2. Installera Docker

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2
systemctl enable docker
systemctl start docker
```

Verifiera: `docker --version` ska visa ett versionsnummer.

### 3. Ladda upp projektfilerna

Kopiera projektet till servern (t.ex. via SFTP eller git):

```bash
mkdir /opt/heritage-connect
cd /opt/heritage-connect
# Kopiera alla projektfiler hit
```

Projektmappen ska innehålla:
```
app/
docker-compose.yml
requirements.txt
.env
```

### 4. Skapa konfigurationsfilen

Kopiera exempelfilen och fyll i era uppgifter:

```bash
cp .env.example .env
nano .env
```

Fyll i minst dessa rader (se avsnitt Konfiguration nedan):

```
DATABASE_URL=postgresql://heritage_connect:ERTLÖSENORD@db:5432/heritage_connect
POSTGRES_PASSWORD=ERTLÖSENORD
SMS_PROVIDER=hellosms
HELLOSMS_API_USERNAME=ert_användarnamn
HELLOSMS_API_PASSWORD=ert_lösenord
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.loopia.se
SMTP_PORT=587
SMTP_USER=noreply@erdoman.se
SMTP_PASSWORD=ertlösenord
SMTP_FROM=noreply@erdoman.se
SITE_BASE_URL=https://erdoman.se
```

### 5. Starta systemet

```bash
docker compose up -d
```

Första starten laddar ned nödvändiga komponenter och skapar databasen automatiskt. Det tar ca 2–5 minuter.

### 6. Verifiera att allt körs

```bash
docker compose ps
```

Alla tjänster ska visa status `running`:

| Tjänst | Port | Funktion |
|--------|------|----------|
| core | 8000 | Huvud-API |
| notification | 8001 | SMS/e-post |
| translate | 8002 | Översättning |
| geo | 8003 | Geolokalisering |
| ai | 8004 | AI-frågesvar |
| db | 5432 | Databas |

Öppna i webbläsaren: `http://DIN-SERVER-IP:8000/` – ni ska se:
```json
{"app": "Heritage Connect", "status": "running"}
```

---

## Konfiguration

### SMS (HelloSMS)
Skapa konto på [app.hellosms.se](https://app.hellosms.se) och hämta era API-uppgifter.

```
SMS_PROVIDER=hellosms
HELLOSMS_API_USERNAME=ert_användarnamn
HELLOSMS_API_PASSWORD=ert_lösenord
HELLOSMS_TEST_MODE=false
```

### Betalning (Stripe)
Skapa konto på [stripe.com](https://stripe.com) och hämta er hemliga nyckel under *Developers → API keys*.

```
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
```

### E-post
Loopia erbjuder SMTP via `smtp.loopia.se`:

```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.loopia.se
SMTP_PORT=587
SMTP_USER=noreply@erdoman.se
SMTP_PASSWORD=lösenord_för_kontot
SMTP_FROM=noreply@erdoman.se
SMTP_USE_TLS=true
```

---

## Daglig drift

### Starta om systemet
```bash
cd /opt/heritage-connect
docker compose restart
```

### Se loggar
```bash
docker compose logs -f core
docker compose logs -f notification
```

### Stäng av
```bash
docker compose down
```

### Uppdatera till ny version
```bash
docker compose down
# Kopiera in nya filer
docker compose up -d --build
```

---

## Säkerhetskopiering

Databasen lagras i Docker-volymen `pgdata`. Ta backup med:

```bash
docker compose exec db pg_dump -U heritage_connect heritage_connect > backup_$(date +%Y%m%d).sql
```

---

## Support

Kontakta utvecklingsgruppen (GIK377) vid tekniska frågor under överlämningsperioden.
