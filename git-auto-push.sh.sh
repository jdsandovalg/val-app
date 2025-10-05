#!/bin/bash
# git-auto-push.sh
# Script para automatizar commit con fecha y hora

# Obtener fecha y hora actual
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Mostrar archivos modificados
echo "Archivos modificados:"
git status -s

# Pedir comentario
read -p "Comentario del commit: " comment

# Si no hay comentario, usar uno genérico
if [ -z "$comment" ]; then
  comment="Sin comentario"
fi

# Combinar fecha y comentario
commit_msg="[$timestamp] $comment"

# Ejecutar push
git add .
git commit -m "$commit_msg"
git push

echo "Commit realizado y enviado con mensaje:"
echo "$commit_msg"
