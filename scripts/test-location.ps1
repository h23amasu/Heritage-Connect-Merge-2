# Testar POST /api/location/update (kräver server på port 8000)
$uri = "http://localhost:8000/api/location/update"

try {
    Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 3 | Out-Null
} catch {
    Write-Host "Starta servern forst: python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Red
    exit 1
}

$payload = @{
    latitude  = 60.511334
    longitude = 14.225256
    phoneNo   = "+46738100354"
}
$json = $payload | ConvertTo-Json -Compress
Write-Host "Skickar plats:" $json

try {
    $result = Invoke-RestMethod `
        -Uri $uri `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Fel:" $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}
