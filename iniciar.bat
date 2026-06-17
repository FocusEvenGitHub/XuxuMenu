@echo off
title XuxuMenu
cd /d "%~dp0"

:: Inicia o servidor PowerShell em segundo plano (janela oculta)
start /min "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1"

:: Aguarda o servidor iniciar
ping -n 3 127.0.0.1 >nul

:: Abre o navegador
start "" "http://localhost:8080"

:: Fecha esta janela do batch
exit
