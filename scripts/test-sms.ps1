# Testar POST /notification/send-notification
# Kräver att servern kör: uvicorn app.main:app --reload --port 8000

$uri = "http://localhost:8000/notification/send-notification"

# Kontrollera att servern svarar
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3
    Write-Host "Server OK:" ($health | ConvertTo-Json -Compress) -ForegroundColor Green
} catch {
    Write-Host "Servern kör inte på port 8000. Starta först:" -ForegroundColor Red
    Write-Host '  uvicorn app.main:app --reload --port 8000' -ForegroundColor Yellow
    exit 1
}

# Avsändare: HELLOSMS_SENDER i .env (46764911139 = +46764911139)
# Mottagare: anges här i "to"
$recipient = "+46738100354"

$payload = @{
    type    = "sms"
    to      = $recipient
    message = "Test fran Heritage Connect $(Get-Date -Format 'HH:mm:ss')"
    user_id = "heritage_$(Get-Date -Format 'yyyyMMddHHmmss')"
    site_id = "1027"
}

$json = $payload | ConvertTo-Json -Compress
Write-Host "Skickar:" $json

try {
    $result = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
    Write-Host "Svar:" ($result | ConvertTo-Json -Compress) -ForegroundColor Green
} catch {
    Write-Host "Fel:" $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message -ForegroundColor Red }
    exit 1
}
