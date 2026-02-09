#!/bin/bash

# Nombre del script: clean_install.sh
# Descripción: Limpia dependencias y caché para solucionar problemas de rutas absolutas al mover el proyecto.
# Uso: ./clean_install.sh

echo "======================================================="
echo "🧹  VAL-APP: LIMPIEZA Y REINSTALACIÓN DE DEPENDENCIAS"
echo "======================================================="
echo "Este script eliminará 'node_modules' y '.next' para"
echo "regenerar las rutas absolutas en este entorno."
echo ""

# Confirmación del usuario
read -p "¿Deseas continuar? (s/n): " confirm
if [[ $confirm != "s" && $confirm != "S" ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""

# 1. Eliminar node_modules
if [ -d "node_modules" ]; then
    echo "🗑️  Eliminando carpeta 'node_modules'..."
    rm -rf node_modules
    echo "   -> 'node_modules' eliminada."
else
    echo "ℹ️  'node_modules' no existe, saltando paso."
fi

# 2. Eliminar .next
if [ -d ".next" ]; then
    echo "🗑️  Eliminando carpeta '.next' (caché de build)..."
    rm -rf .next
    echo "   -> '.next' eliminada."
else
    echo "ℹ️  '.next' no existe, saltando paso."
fi

# 3. Eliminar package-lock.json (Opcional pero recomendado para consistencia total)
if [ -f "package-lock.json" ]; then
    echo "🗑️  Eliminando 'package-lock.json' para regenerar árbol..."
    rm package-lock.json
    echo "   -> 'package-lock.json' eliminado."
fi

echo ""
echo "✨ Limpieza finalizada."
echo "======================================================="
echo "📦  INSTALANDO DEPENDENCIAS (npm install)"
echo "    Esto puede tardar unos minutos..."
echo "======================================================="

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅  Dependencias instaladas correctamente."
    echo "======================================================="
    echo "🚀  INICIANDO SERVIDOR DE DESARROLLO (npm run dev)"
    echo "======================================================="
    npm run dev
else
    echo ""
    echo "❌  Ocurrió un error durante la instalación."
    echo "    Por favor, verifica tu conexión a internet o los logs de error."
    exit 1
fi
