@echo off
rem Updates the photo wall from photos\fotos-japan, then opens the presentation.
cd /d "%~dp0"
echo Actualizando el muro de fotos desde photos\fotos-japan ...
py -3 "photos\sync_wall.py"
if errorlevel 1 goto failed
goto open

:failed
echo.
echo No se pudo actualizar el muro. Se abrira la presentacion con las fotos de la ultima vez.
pause

:open
start "" "index.html"
