# PowerShell script to start all microservices

Write-Host "Starting ChadhaRangam Chess Application..." -ForegroundColor Green

# Check if Java is installed
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Java not found. Please install Java 21." -ForegroundColor Red
    exit 1
}

# Check if MySQL is running
Write-Host "`nChecking MySQL..." -ForegroundColor Yellow
$mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "✓ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL is not running. Please start MySQL." -ForegroundColor Red
    Write-Host "  You can start MySQL with: net start MySQL80" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting services in order..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to start a service in a new window
function Start-Service {
    param (
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$Host.UI.RawUI.WindowTitle = '$ServiceName'
        Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan
        Write-Host '$ServiceName' -ForegroundColor Green
        Write-Host 'Port: $Port' -ForegroundColor Yellow
        Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan
        Set-Location '$ServicePath'
        Write-Host 'Running: mvn spring-boot:run' -ForegroundColor Gray
        mvn spring-boot:run
"@
    
    Start-Sleep -Seconds 2
}

# 1. Start Service Registry (MUST BE FIRST)
Write-Host "[1/7] Starting Service Registry..." -ForegroundColor Cyan
Start-Service "Service Registry" "$PSScriptRoot\service-registry" 8761
Write-Host "Waiting 15 seconds for Service Registry to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 2. Start API Gateway
Write-Host "[2/7] Starting API Gateway..." -ForegroundColor Cyan
Start-Service "API Gateway" "$PSScriptRoot\api-gateway" 8080
Start-Sleep -Seconds 10

# 3. Start User Service
Write-Host "[3/7] Starting User Service..." -ForegroundColor Cyan
Start-Service "User Service" "$PSScriptRoot\user-service" 8081
Start-Sleep -Seconds 5

# 4. Start Game Service
Write-Host "[4/7] Starting Game Service..." -ForegroundColor Cyan
Start-Service "Game Service" "$PSScriptRoot\game-service" 8082
Start-Sleep -Seconds 5

# 5. Start Matchmaking Service
Write-Host "[5/7] Starting Matchmaking Service..." -ForegroundColor Cyan
Start-Service "Matchmaking Service" "$PSScriptRoot\matchmaking-service" 8083
Start-Sleep -Seconds 5

# 6. Start Notification Service
Write-Host "[6/7] Starting Notification Service..." -ForegroundColor Cyan
Start-Service "Notification Service" "$PSScriptRoot\notification-service" 8084
Start-Sleep -Seconds 5

# 7. Start Frontend
Write-Host "[7/7] Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
    `$Host.UI.RawUI.WindowTitle = 'Chess Frontend'
    Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan
    Write-Host 'Chess Frontend (React + Vite)' -ForegroundColor Green
    Write-Host 'Port: 5173' -ForegroundColor Yellow
    Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan
    Set-Location '$PSScriptRoot\chess-frontend'
    Write-Host 'Installing dependencies...' -ForegroundColor Gray
    npm install
    Write-Host 'Starting dev server...' -ForegroundColor Gray
    npm run dev
"@

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All services starting!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host "  API Gateway:      http://localhost:8080" -ForegroundColor White
Write-Host "  Eureka Dashboard: http://localhost:8761" -ForegroundColor White

Write-Host "`nNote: Services may take 1-2 minutes to fully start and register." -ForegroundColor Gray
Write-Host "Check the Eureka Dashboard to verify all services are registered.`n" -ForegroundColor Gray

Write-Host "Press any key to close this window (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
