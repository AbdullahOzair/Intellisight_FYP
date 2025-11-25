# Download Face-API.js Models
# This script downloads the required model files for face recognition

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Face-API.js Models Downloader" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create models directory
$modelsPath = "D:\FYPprojectIntelisight\admin-dashboard\public\models"
Write-Host "Creating models directory..." -ForegroundColor Yellow
New-Item -Path $modelsPath -ItemType Directory -Force | Out-Null

# Base URL for models
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Model files to download
$models = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

Write-Host ""
Write-Host "Downloading $($models.Count) model files..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($model in $models) {
    $url = "$baseUrl/$model"
    $destination = Join-Path $modelsPath $model
    
    try {
        Write-Host "  Downloading $model..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $destination -ErrorAction Stop
        Write-Host " ✓" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Download Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor Red
Write-Host ""

if ($successCount -eq $models.Count) {
    Write-Host "✅ All models downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Models saved to: $modelsPath" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some models failed to download. Please try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
