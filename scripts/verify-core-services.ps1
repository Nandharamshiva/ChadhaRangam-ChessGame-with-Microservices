param(
  [switch]$Build,
  [switch]$OAuth
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

function Kill-Port([int]$Port) {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Write-Host ("Killing port {0} PID {1}" -f $Port, $conn.OwningProcess)
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

function Ensure-Jar([string]$Path) {
  if (!(Test-Path $Path)) {
    throw "Jar not found: $Path"
  }
}

Kill-Port 8761
Kill-Port 8080
Kill-Port 8081

$srDir = Join-Path $root 'service-registry'
$gwDir = Join-Path $root 'api-gateway'
$usDir = Join-Path $root 'user-service'

if ($Build) {
  Write-Host 'Building service-registry...'
  Push-Location $srDir
  & .\mvnw.cmd -q -DskipTests package
  Pop-Location

  Write-Host 'Building api-gateway...'
  Push-Location $gwDir
  & .\mvnw.cmd -q -DskipTests package
  Pop-Location

  Write-Host 'Building user-service...'
  Push-Location $usDir
  & .\mvnw.cmd -q -DskipTests package
  Pop-Location
}

$srJar = Join-Path $srDir 'target\service-registry-0.0.1-SNAPSHOT.jar'
$gwJar = Join-Path $gwDir 'target\api-gateway-0.0.1-SNAPSHOT.jar'
$usJar = Join-Path $usDir 'target\user-service-0.0.1-SNAPSHOT.jar'

Ensure-Jar $srJar
Ensure-Jar $gwJar
Ensure-Jar $usJar

$srOut = Join-Path $srDir 'service-registry.out.log'
$srErr = Join-Path $srDir 'service-registry.err.log'
$gwOut = Join-Path $gwDir 'gateway.out.log'
$gwErr = Join-Path $gwDir 'gateway.err.log'
$usOut = Join-Path $usDir 'user-service.out.log'
$usErr = Join-Path $usDir 'user-service.err.log'

foreach ($f in @($srOut,$srErr,$gwOut,$gwErr,$usOut,$usErr)) {
  if (Test-Path $f) { Remove-Item $f -Force }
}

$p1 = Start-Process -FilePath 'java' -WorkingDirectory $srDir -ArgumentList @('-jar', ('"' + $srJar + '"')) -RedirectStandardOutput $srOut -RedirectStandardError $srErr -PassThru -WindowStyle Hidden

$usArgs = @('-jar', ('"' + $usJar + '"'))
if ($OAuth) {
  $usArgs += '--spring.profiles.active=oauth'
}
$p2 = Start-Process -FilePath 'java' -WorkingDirectory $usDir -ArgumentList $usArgs -RedirectStandardOutput $usOut -RedirectStandardError $usErr -PassThru -WindowStyle Hidden

$p3 = Start-Process -FilePath 'java' -WorkingDirectory $gwDir -ArgumentList @('-jar', ('"' + $gwJar + '"')) -RedirectStandardOutput $gwOut -RedirectStandardError $gwErr -PassThru -WindowStyle Hidden

Write-Host ("Started Service Registry PID {0}" -f $p1.Id)
Write-Host ("Started User Service PID {0}" -f $p2.Id)
Write-Host ("Started API Gateway PID {0}" -f $p3.Id)

if ($OAuth) {
  Write-Host 'User-service started with profile: oauth'
  Write-Host 'Expected env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (and/or GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)'
}

function Wait-HttpOk([string]$Url, [int]$TimeoutSec = 40) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $code = (Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 4).StatusCode
      if ($code -ge 200 -and $code -lt 500) { return $code }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  return $null
}

function Wait-GatewayReachable([int]$TimeoutSec = 50) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-WebRequest -UseBasicParsing http://localhost:8080/api/users/login -Method Get -TimeoutSec 4 | Out-Null
      return 'OK'
    } catch {
      if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.value__
        # 405 is expected (endpoint exists but requires POST). 401 is also acceptable if auth filter kicks in.
        if ($status -eq 405 -or $status -eq 401) { return $status }
        if ($status -eq 503) { Start-Sleep -Seconds 2; continue }
        return $status
      }
      Start-Sleep -Seconds 2
    }
  }
  return 'TIMEOUT'
}

# Give processes time to bind ports + register in Eureka.
Start-Sleep -Seconds 6

Get-NetTCPConnection -State Listen -LocalPort 8761,8081,8080 -ErrorAction SilentlyContinue |
  Sort-Object LocalPort |
  Format-Table LocalAddress,LocalPort,OwningProcess -AutoSize

$eurekaCode = Wait-HttpOk -Url 'http://localhost:8761/' -TimeoutSec 40
if ($null -ne $eurekaCode) {
  Write-Host "Eureka HTTP: $eurekaCode"
} else {
  Write-Host 'Eureka check failed: timed out'
}

$gwResult = Wait-GatewayReachable -TimeoutSec 50
Write-Host "Gateway check result: $gwResult"

Write-Host 'Logs:'
Write-Host "  $srOut"
Write-Host "  $gwOut"
Write-Host "  $usOut"
