@echo off
rem Abre o jogo com a Batalha (PvP por turnos) de teste ligada, usando o seu save de verdade. Feche o jogo instalado antes.
cd /d "%~dp0"
set VERITY_ARENA=1
start "" "%~dp0node_modules\electron\dist\electron.exe" .
