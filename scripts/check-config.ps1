# Visar vilken SMS-konfiguration Python faktiskt läser in
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".env")) {
    Write-Host "SAKNAS: filen .env" -ForegroundColor Red
    Write-Host "Gör så här:" -ForegroundColor Yellow
    Write-Host "  1. Kopiera .env.example till .env"
    Write-Host "  2. Fyll i HELLOSMS_API_USERNAME och HELLOSMS_API_PASSWORD"
    Write-Host "  3. Starta om uvicorn"
    exit 1
}

python -c @"
from app.core.config import settings
print('SMS_PROVIDER:', settings.SMS_PROVIDER)
print('HELLOSMS_API_USERNAME:', settings.HELLOSMS_API_USERNAME[:4] + '...' if settings.HELLOSMS_API_USERNAME else '(tom)')
print('HELLOSMS_API_PASSWORD:', '***' if settings.HELLOSMS_API_PASSWORD else '(tom)')
print('HELLOSMS_SENDER:', settings.HELLOSMS_SENDER or '(tom)')
print('HELLOSMS_TEST_MODE:', settings.HELLOSMS_TEST_MODE)
"@
