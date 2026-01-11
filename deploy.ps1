# Deploy script for CRM Yanick - Backend and Frontend
# Usage: .\deploy.ps1

Write-Host "Deploiement CRM Yanick sur Fly.io" -ForegroundColor Cyan
Write-Host ""

# Deploy Backend
Write-Host "Deploiement Backend..." -ForegroundColor Yellow
Set-Location backend
fly deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du deploiement backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "Backend deploye avec succes!" -ForegroundColor Green
Write-Host ""

# Deploy Frontend
Write-Host "Deploiement Frontend..." -ForegroundColor Yellow
Set-Location frontend
fly deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du deploiement frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "Frontend deploye avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Deploiement complet termine!" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor White
Write-Host "   Backend:  https://crm-yanick-backend.fly.dev/" -ForegroundColor Gray
Write-Host "   Frontend: https://crm-yanick-frontend.fly.dev/" -ForegroundColor Gray
