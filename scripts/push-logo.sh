#!/bin/bash
# push_logo.sh — actualiza solo el logo del proyecto Next.js en Vercel

# Verifica que el archivo exista
if [ ! -f "./public/logo.png" ]; then
  echo "⚠️  No se encontró ./public/logo.png"
  exit 1
fi

# Agrega solo el logo y hace commit
git add public/logo.png
git commit -m "Actualización del logo"
git push origin main  # Cambia 'main' si tu rama principal se llama diferente

echo "✅ Logo actualizado y enviado al repositorio."

