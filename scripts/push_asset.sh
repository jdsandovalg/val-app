#!/bin/bash
# push_asset.sh - Sube un solo archivo específico a Git y Vercel

# Verificar que se haya pasado un argumento
if [ -z "$1" ]; then
  echo "⚠️  Uso: ./push_asset.sh <nombre_del_archivo>"
  exit 1
fi

FILE=$1

# Verificar que el archivo exista
if [ ! -f "$FILE" ]; then
  echo "❌ El archivo '$FILE' no existe en este directorio."
  exit 1
fi

# Agregar y subir a Git
git add "$FILE"
git commit -m "Actualización de asset: $FILE"
git push

# Desplegar en Vercel
vercel --prod

