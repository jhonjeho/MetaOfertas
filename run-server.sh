#!/bin/bash

# Script para ejecutar MetaOfertas Backend en Linux/Mac

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🛒 MetaOfertas - Backend Server 🛒  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Verificar si node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Instálalo desde: https://nodejs.org/"
    exit 1
fi

# Verificar si npm_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar dependencias"
        exit 1
    fi
    echo "✅ Dependencias instaladas"
fi

echo ""
echo "🚀 Iniciando servidor en modo desarrollo..."
echo "📍 Puerto: 3001"
echo "🔐 Contraseña Admin: admin123"
echo ""
echo "💡 Presiona Ctrl+C para detener el servidor"
echo ""

npm run dev
