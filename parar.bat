@echo off
title XuxuMenu - Parar
cd /d "%~dp0"

echo.
echo Parando servidor XuxuMenu...

:: Tenta matar pelo PID salvo
if exist "%TEMP%\xuxumenu.pid" (
    set /p PID=<"%TEMP%\xuxumenu.pid"
    taskkill /F /PID %PID% >nul 2>&1
    del "%TEMP%\xuxumenu.pid" >nul 2>&1
) else (
    taskkill /F /FI "IMAGENAME eq powershell.exe" /FI "CMDLINE contains iniciar.ps1" >nul 2>&1
)

echo Servidor parado.
echo.
timeout /t 2 /nobreak >nul
