# Check if all required game assets exist

$assetsPath = "src\client\public\assets"
$requiredFiles = @(
    "counter.png",
    "empty_pop_corn_cup.png",
    "kitchen backgorund.png",
    "larger pot.png",
    "single corn.png"
)

Write-Host "Checking assets in: $assetsPath" -ForegroundColor Cyan
Write-Host ""

$allFound = $true

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $assetsPath $file
    if (Test-Path $fullPath) {
        Write-Host "[✓] Found: $file" -ForegroundColor Green
    } else {
        Write-Host "[✗] Missing: $file" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""
if ($allFound) {
    Write-Host "All assets found! You can run 'npm run dev' now." -ForegroundColor Green
} else {
    Write-Host "Some assets are missing. Please copy them to the assets folder." -ForegroundColor Yellow
}
