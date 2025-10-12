# Uso: ./push_assets.sh public/logo.png public/icon.png

#!/bin/bash
# push_assets.sh — Sube uno o varios archivos específicos a Git y Vercel

# Verificar que se haya pasado al menos un argumento
if [ "$#" -lt 1 ]; then
  echo "⚠️  Uso: ./push_assets.sh <archivo1> [archivo2 ... archivoN]"
  exit 1
fi

# Iterar sobre todos los archivos pasados como argumentos
for FILE in "$@"; do
  # Verificar que el archivo exista
  if [ ! -f "$FILE" ]; then
    echo "❌ El archivo '$FILE' no existe. Se salta."
    continue
  fi

  # Agregar y hacer commit en Git
  git add "$FILE"
  git commit -m "Actualización de asset: $FILE"
done

# Empujar todos los commits
git push

# Lanzar deploy en Vercel
vercel --prod

