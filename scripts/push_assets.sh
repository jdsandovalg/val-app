#!/bin/bash
# push_assets.sh — Sube uno o varios archivos específicos a Git y Vercel
#
# Uso:
#   ./push_assets.sh <archivo1> [archivo2 ... archivoN]
#
# Ejemplo:
#   ./push_assets.sh public/logo.png public/icon.png
#
# Descripción:
#   - Verifica que cada archivo exista.
#   - Agrega todos los archivos válidos al staging de Git.
#   - Hace un solo commit con todos los cambios.
#   - Hace push al repositorio.
#   - Ejecuta deploy en Vercel (producción).

# Verificar que se haya pasado al menos un argumento
if [ "$#" -lt 1 ]; then
  echo "⚠️  Uso: ./push_assets.sh <archivo1> [archivo2 ... archivoN]"
  exit 1
fi

# Lista de archivos válidos para commit
VALID_FILES=()

# Iterar sobre los argumentos
for FILE in "$@"; do
  if [ ! -f "$FILE" ]; then
    echo "❌ El archivo '$FILE' no existe. Se salta."
    continue
  fi
  VALID_FILES+=("$FILE")
done

# Si no hay archivos válidos, salir
if [ "${#VALID_FILES[@]}" -eq 0 ]; then
  echo "❌ No hay archivos válidos para subir."
  exit 1
fi

# Agregar todos los archivos válidos
git add "${VALID_FILES[@]}"

# Hacer un solo commit
git commit -m "Actualización de assets: ${VALID_FILES[*]}"

# Hacer push
git push

# Deploy en Vercel
vercel --prod

echo "✅ Archivos subidos y deploy ejecutado."

