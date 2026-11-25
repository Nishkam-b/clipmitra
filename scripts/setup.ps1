# One-time setup: Python 3.12 venv + backend deps, frontend npm deps.
# Native tools (uv, npm) print progress to stderr, so we check $LASTEXITCODE instead of
# using $ErrorActionPreference = "Stop" (which treats any stderr line as fatal in PowerShell 5.1).
$root = Split-Path -Parent $PSScriptRoot

function Assert-Ok($what) { if ($LASTEXITCODE -ne 0) { Write-Error "$what failed (exit $LASTEXITCODE)"; exit 1 } }

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Warning "FFmpeg missing: winget install Gyan.FFmpeg" }
if (-not (Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe")) { Write-Warning "Ollama missing: winget install Ollama.Ollama" }

cmd /c "py -m uv --version >nul 2>&1"
if ($LASTEXITCODE -ne 0) { cmd /c "py -m pip install --user uv"; Assert-Ok "Installing uv" }

Push-Location "$root\backend"
if (-not (Test-Path .venv\Scripts\python.exe)) { cmd /c "py -m uv venv --python 3.12 .venv 2>&1"; Assert-Ok "Creating venv" }
cmd /c "py -m uv pip install --python .venv\Scripts\python.exe -r requirements.txt 2>&1"; Assert-Ok "Installing Python packages"
Pop-Location

Push-Location "$root\frontend"
cmd /c "npm install 2>&1"; Assert-Ok "npm install"
Pop-Location

Write-Host "`nSetup done."
