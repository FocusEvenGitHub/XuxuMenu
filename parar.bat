@echo off
title XuxuMenu - Parar
cd /d "%~dp0"

echo.
echo Parando servidor XuxuMenu...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0parar.ps1"

echo Servidor parado.
echo.
timeout /t 2 /nobreak >nul
