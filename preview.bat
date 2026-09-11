@echo off
title Escaneos Notificaciones
echo =======================================================
echo   Iniciando Vista Previa (Escaneos Notificaciones)...
echo =======================================================
echo.
cd /d "c:\Users\LmartinezN\Documents\Proyectos\EscaneosNotis_Go"

echo [1/2] Compilando y empaquetando cambios...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$job = Start-Job -ScriptBlock { cd 'c:\Users\LmartinezN\Documents\Proyectos\EscaneosNotis_Go'; npm --prefix frontend run build }; $t = 0.0; while ($job.State -eq 'Running') { Start-Sleep -Milliseconds 100; $t += 0.1; Write-Host -NoNewline (\"{0:F1}s... \" -f $t) }; Write-Host ''; Receive-Job $job; Remove-Job $job"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error al compilar el frontend.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Lanzando aplicacion...
go run -tags desktop,production .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocurrio un error al ejecutar la aplicacion.
    pause
)

