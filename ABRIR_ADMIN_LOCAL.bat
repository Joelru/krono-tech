@echo off
title Krono Tech - Panel de Administracion Local
cd /d "%~dp0"
echo ========================================================
echo   KRONO TECH - INICIANDO PANEL DE ADMINISTRACION LOCAL
echo   Base de Datos guardada en tu PC: data\krono-store.json
echo ========================================================
start "" "http://localhost:3000/krono-hq-9x7k"
npm run dev
pause
