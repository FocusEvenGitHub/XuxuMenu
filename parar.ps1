# parar.ps1 - Encerra o servidor do XuxuMenu (todas as copias do iniciar.ps1)
# Usado pelo parar.bat e pelo iniciar.bat (para nunca ficar um servidor antigo rodando).
# Obs.: mantenha este arquivo so com caracteres ASCII (sem acentos).

$filtro = "Name='powershell.exe' OR Name='pwsh.exe'"
try {
    $procs = Get-CimInstance Win32_Process -Filter $filtro -ErrorAction Stop
} catch {
    $procs = Get-WmiObject Win32_Process -Filter $filtro
}

$parados = 0
foreach ($p in $procs) {
    if ($p.ProcessId -eq $PID) { continue }                 # nao encerra a si mesmo
    if ($p.CommandLine -notlike '*iniciar.ps1*') { continue }
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    $parados++
}

Remove-Item "$env:TEMP\xuxumenu.pid" -Force -ErrorAction SilentlyContinue

if ($parados -gt 0) { Start-Sleep -Milliseconds 500 }       # libera as portas
Write-Host "Servidores encerrados: $parados"
