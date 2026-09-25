@echo off
title Empaquetador de Produccion - Escaneos MB
echo =======================================================
echo   Empaquetando Aplicacion Escaneos MB (Incrementando Version +0.1)...
echo =======================================================
echo.
cd /d "c:\Users\LmartinezN\Documents\Proyectos\EscaneosNotis_Go"

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $wailsJson = Get-Content 'wails.json' -Raw | ConvertFrom-Json; $curVer = [double]$wailsJson.info.productVersion; $newVer = [math]::Round($curVer + 0.1, 1); $verStr = ('{0:0.0}' -f $newVer); Write-Host ('[+] Incrementando version a: Escaneos MB ' + $verStr); $wailsJson.name = ('Escaneos MB ' + $verStr); $wailsJson.outputfilename = ('Escaneos_MB_' + $verStr); $wailsJson.info.productName = ('Escaneos MB ' + $verStr); $wailsJson.info.productVersion = $verStr; $wailsJson | ConvertTo-Json -Depth 5 | Set-Content 'wails.json'; $mainGo = Get-Content 'main.go' -Raw; $mainGo = $mainGo -replace 'Title:\s*\"Escaneos MB [0-9\.]+\"', ('Title:  \"Escaneos MB ' + $verStr + '\"'); Set-Content 'main.go' $mainGo; $hdr = Get-Content 'frontend/src/components/HeaderControls.jsx' -Raw; $hdr = $hdr -replace 'Escaneos MB [0-9\.]+', ('Escaneos MB ' + $verStr); Set-Content 'frontend/src/components/HeaderControls.jsx' $hdr }"

echo.
echo [1/3] Compilando frontend...
call npm --prefix frontend run build

echo.
echo [2/3] Empaquetando ejecutable final de produccion con Wails...
call wails build

if %ERRORLEVEL% NEQ 0 (
    echo Error al empaquetar con Wails.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Copiando ejecutable al Escritorio...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$wailsJson = Get-Content 'wails.json' -Raw | ConvertFrom-Json; $exeName = $wailsJson.outputfilename + '.exe'; Copy-Item -Path ('build/bin/' + $exeName) -Destination ('C:\Users\LmartinezN\Desktop\' + $exeName) -Force; Write-Host ('Ejecutable listo en Escritorio: C:\Users\LmartinezN\Desktop\' + $exeName)"

echo.
echo =======================================================
echo   Empaquetado Completado Exitosamente!
echo =======================================================
pause
