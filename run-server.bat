<<<<<<< HEAD
@echo off
REM Script para ejecutar MetaOfertas Backend en Windows

echo.
echo ╔════════════════════════════════════════╗
echo ║   🛒 MetaOfertas - Backend Server 🛒  ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar si node está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo Descárgalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
)

echo.
echo 🚀 Iniciando servidor en modo desarrollo...
echo 📍 Puerto: 3001
echo 🔐 Contraseña Admin: admin123
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
=======
@echo off
REM Script para ejecutar MetaOfertas Backend en Windows

echo.
echo ╔════════════════════════════════════════╗
echo ║   🛒 MetaOfertas - Backend Server 🛒  ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar si node está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo Descárgalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
)

echo.
echo 🚀 Iniciando servidor en modo desarrollo...
echo 📍 Puerto: 3001
echo 🔐 Contraseña Admin: admin123
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
>>>>>>> 501eef96e7e1bf4b282028af1297426bac033904
