@echo off
title XuxuMenu
cd /d "%~dp0"

:: Encerra um servidor antigo que tenha ficado aberto (senao a versao nova nao sobe)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0parar.ps1" >nul 2>&1

:: Inicia o servidor PowerShell em segundo plano (janela oculta)
start /min "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1"

:: Aguarda o servidor iniciar
ping -n 3 127.0.0.1 >nul

:: Abre o navegador
start "" "http://localhost:8090"

:: Fecha esta janela do batch
exit
