$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$rpmNodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($rpmNodeCommand) {
    $rpmNodePath = $rpmNodeCommand.Source
} else {
    $rpmNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $rpmNodePath)) {
    Write-Host 'Node.js is required. Install Node.js 22 or newer, then run this file again.'
    exit 1
}
try {
    $rpmResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2 -UseBasicParsing
    if ($rpmResponse.Content -match '<title>RPM Roadworks Lab</title>') {
        Start-Process 'http://127.0.0.1:5173/'
        Write-Host 'RPM Demo is already running.'
        exit 0
    }
    Write-Host 'Port 5173 is already used by another application. Close that application first.'
    exit 1
} catch { }
Write-Host 'RPM Roadworks Lab - local simulation'
Write-Host 'Open http://127.0.0.1:5173 in your browser. Keep this window open.'
Write-Host 'Press Ctrl+C to stop. No installation, API key or internet connection is required.'
Start-Process 'http://127.0.0.1:5173/'
& $rpmNodePath server.mjs
