@echo off
setlocal
rem ZERO-SPEND: static read-only workflow scan, never run child app scripts.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo BLOCKED: Node.js 22+ is required on this Windows PC.
  exit /b 1
)
set "ROOT=E:\BaumanWeb"
if not "%~1"=="" set "ROOT=%~1"
node scripts\zero-spend-audit.mjs --root "%ROOT%" --output "%ROOT%\zero-spend-audit.json"
if errorlevel 1 exit /b 1
echo Created %ROOT%\zero-spend-audit.json
echo Static inventory only. No GitHub-hosted CI or App-manager commands executed.
endlocal
