# Testar POST /notification/send-notification med type=email
param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$To = "mojgan.ghaffari@gmail.com"
)

$body = @{
    type    = "email"
    to      = $To
    message = "Heritage Connect e-posttest $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    subject = "Heritage Connect test"
} | ConvertTo-Json -Compress

Write-Host "POST $BaseUrl/notification/send-notification -> $To"
try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/notification/send-notification" `
        -Method POST -Body $body -ContentType "application/json; charset=utf-8" -UseBasicParsing
    Write-Host "HTTP $($r.StatusCode)" -ForegroundColor Green
    Write-Host $r.Content
    Write-Host ""
    Write-Host "Om EMAIL_PROVIDER=mock i .env: kolla uvicorn-terminalen for [MOCK EMAIL]."
    Write-Host "Om smtp/sendgrid: kolla inkorg och skrappost."
}
catch {
    Write-Host "Fel: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}
