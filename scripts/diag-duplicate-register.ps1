Set-StrictMode -Version Latest

try {
  $ErrorActionPreference = 'Stop'

# stop anything listening on 8081
$listen = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listen -and $listen.OwningProcess -ne 0) {
  Write-Host "Stopping 8081 PID" $listen.OwningProcess
  Stop-Process -Id $listen.OwningProcess -Force
  Start-Sleep -Seconds 2
} else {
  Write-Host "No listener on 8081"
}

# start user-service jar detached
$root = "C:\Users\HP\Desktop\Java Projects\ChadhaRangam"
Set-Location (Join-Path $root 'user-service')
Start-Process -FilePath 'java' -ArgumentList @('-jar', 'target\user-service-0.0.1-SNAPSHOT.jar') -WindowStyle Hidden

# wait for 8081 (can take a bit on some machines)
for ($i = 0; $i -lt 120; $i++) {
  if (Test-NetConnection -ComputerName localhost -Port 8081 -InformationLevel Quiet) { break }
  Start-Sleep -Milliseconds 500
}
if (-not (Test-NetConnection -ComputerName localhost -Port 8081 -InformationLevel Quiet)) {
  Write-Host 'ERROR: user-service failed to start on 8081'
  exit 0
}
Write-Host 'user-service up on 8081'

# payload
$u = 'dup_' + ([guid]::NewGuid().ToString('N').Substring(0, 6))
$e = 'dup_' + ([guid]::NewGuid().ToString('N').Substring(0, 6)) + '@example.com'
$json = (@{ username = $u; email = $e; password = 'password123' } | ConvertTo-Json -Compress)
Write-Host 'payload:' $json

function PostShow([string] $url) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method Post -ContentType 'application/json' -Body $json -TimeoutSec 15
    Write-Host ($url + ' -> ' + $r.StatusCode)
    if ($r.Content) { Write-Host $r.Content }
  } catch {
    $status = $null
    $body = $null
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $body = $sr.ReadToEnd()
    }
    Write-Host ($url + ' -> ERROR ' + $status)
    if ($body) { Write-Host $body } else { Write-Host $_.Exception.Message }
  }
}

Write-Host '=== direct user-service ==='
PostShow 'http://localhost:8081/api/users/register'
PostShow 'http://localhost:8081/api/users/register'

Write-Host '=== via gateway ==='
PostShow 'http://localhost:8080/api/users/register'
PostShow 'http://localhost:8080/api/users/register'

} catch {
  Write-Host ('SCRIPT ERROR: ' + $_.Exception.Message)
  # Don't fail the task; this is a diagnostic script.
  exit 0
}
