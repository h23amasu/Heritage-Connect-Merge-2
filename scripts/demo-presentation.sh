#!/usr/bin/env bash
# Heritage Connect – demo-kommandon för presentation (SMS + plats / OwnTracks)
#
# Användning:
#   chmod +x scripts/demo-presentation.sh
#   ./scripts/demo-presentation.sh config
#   ./scripts/demo-presentation.sh sms
#   ./scripts/demo-presentation.sh home
#   ./scripts/demo-presentation.sh travel
#   ./scripts/demo-presentation.sh owntracks-travel
#   ./scripts/demo-presentation.sh reset-falun
#
# Ändra telefonnummer här (samma som prenumeration + OwnTracks User):
PHONE="${HERITAGE_DEMO_PHONE:-+46761104465}"
BASE="${HERITAGE_API_BASE:-https://web-production-e43d0.up.railway.app}"

# Koordinater
STOCKHOLM_LAT=59.33
STOCKHOLM_LON=18.07
FALUN_LAT=60.60472
FALUN_LON=15.63083
FALUN_SITE_ID=1027

json_pretty() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool
  else
    cat
  fi
}

cmd_config() {
  echo "=== Integration (webhook, SMS, e-post) ==="
  curl -sS "${BASE}/api/integration/config" | json_pretty
}

cmd_sms() {
  echo "=== Steg 1: Direkt SMS-test (meddelandetjänsten) ==="
  echo "Telefon: ${PHONE}"
  curl -sS -X POST "${BASE}/api/notification/send" \
    -H "Content-Type: application/json" \
    -d "$(cat <<EOF
{
  "channel": "sms",
  "to": "${PHONE}",
  "message": "Heritage Connect presentation – SMS fungerar $(date +%H:%M)",
  "user_id": "${PHONE}",
  "site_id": "${FALUN_SITE_ID}"
}
EOF
)" | json_pretty
  echo
  echo "→ Kontrollera mobilen. Vid success: {\"success\": true, \"channel\": \"sms\"}"
}

cmd_home() {
  echo "=== Steg 2: Registrera hemzon (som OwnTracks hemma) ==="
  echo "Telefon: ${PHONE} | Plats: Stockholm"
  echo "(OwnTracks-svar är alltid [] – det betyder OK mottaget)"
  curl -sS -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/location/owntracks" \
    -H "Content-Type: application/json" \
    -H "X-Limit-U: ${PHONE}" \
    -d "$(cat <<EOF
{"_type":"location","lat":${STOCKHOLM_LAT},"lon":${STOCKHOLM_LON},"tst":$(date +%s),"tid":"01"}
EOF
)"
  echo
  echo "→ Förväntat: HTTP 200, body []. Inget SMS än (hem registrerat)."
}

cmd_travel() {
  echo "=== Steg 3: Resa till Falun (synligt JSON-svar) ==="
  echo "Telefon: ${PHONE} | simulate_travel=true"
  curl -sS -X POST "${BASE}/api/location/update" \
    -H "Content-Type: application/json" \
    -d "$(cat <<EOF
{
  "phoneNo": "${PHONE}",
  "latitude": ${FALUN_LAT},
  "longitude": ${FALUN_LON},
  "simulate_travel": true
}
EOF
)" | json_pretty
  echo
  echo "→ Vid lycka: \"notified\": true och nearest_site = Gruvorna i Falun"
  echo "→ SMS ska komma till ${PHONE} inom några sekunder."
}

cmd_owntracks_travel() {
  echo "=== Steg 3b: Samma resa via OwnTracks-format (som mobilen skickar) ==="
  echo "Telefon: ${PHONE} | Plats: Falun"
  echo "Kör detta EFTER 'home' om du vill visa exakt samma flöde som OwnTracks-appen."
  curl -sS -w "\nHTTP %{http_code}\n" -X POST "${BASE}/api/location/owntracks" \
    -H "Content-Type: application/json" \
    -H "X-Limit-U: ${PHONE}" \
    -d "$(cat <<EOF
{"_type":"location","lat":${FALUN_LAT},"lon":${FALUN_LON},"tst":$(date +%s),"tid":"01"}
EOF
)"
  echo
  echo "→ HTTP 200 + []. SMS triggas i bakgrunden om prenumeration är aktiv."
  echo "→ Terminalen visar inte notified – kolla mobilen."
}

cmd_reset_falun() {
  echo "=== Återställ: tillåt SMS om Falun igen (profil/API) ==="
  curl -sS -X PATCH "${BASE}/api/user/preferences" \
    -H "Content-Type: application/json" \
    -d "$(cat <<EOF
{
  "phone": "${PHONE}",
  "site_id": "${FALUN_SITE_ID}",
  "visited": false
}
EOF
)" | json_pretty
  echo
  echo "→ Kör sedan 'travel' eller 'owntracks-travel' igen."
}

cmd_all() {
  cmd_config
  echo
  cmd_sms
  echo
  read -r -p "SMS mottaget? Tryck Enter för hemzon..."
  cmd_home
  echo
  read -r -p "Tryck Enter för resa till Falun (simulate_travel)..."
  cmd_travel
}

usage() {
  cat <<EOF
Heritage Connect – presentationsdemo

  export HERITAGE_DEMO_PHONE="${PHONE}"
  export HERITAGE_API_BASE="${BASE}"

  ./scripts/demo-presentation.sh config           # visa webhook-URL m.m.
  ./scripts/demo-presentation.sh sms              # testa SMS direkt
  ./scripts/demo-presentation.sh home             # OwnTracks: registrera hem
  ./scripts/demo-presentation.sh travel           # geofencing → SMS (syns i terminal)
  ./scripts/demo-presentation.sh owntracks-travel # samma som mobilen (svar: [])
  ./scripts/demo-presentation.sh reset-falun      # tillåt SMS om Falun igen
  ./scripts/demo-presentation.sh all              # guidad demo i ett flöde

OwnTracks på telefon: appen behöver INTE vara öppen om bakgrundsspårning
och HTTP-läge är konfigurerat. Under presentation rekommenderas curl-kommandona
(o tryck Publish i OwnTracks) – mer förutsägbart än att vänta på GPS-intervall.
EOF
}

case "${1:-}" in
  config) cmd_config ;;
  sms) cmd_sms ;;
  home) cmd_home ;;
  travel) cmd_travel ;;
  owntracks-travel) cmd_owntracks_travel ;;
  reset-falun) cmd_reset_falun ;;
  all) cmd_all ;;
  *) usage ;;
esac
