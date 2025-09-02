# Inicializa git si no lo has hecho
git init -b main

# Añade todos tus archivos para subirlos
git add .

# Crea tu primer "commit" (una foto del estado actual de tu código)
git commit -m "Versión inicial para despliegue"

# Conecta tu proyecto local con el repositorio de GitHub
# (Reemplaza la URL con la de tu repositorio)
git remote add origin https://github.com/jdsandovalg/val-app.git

# Sube tu código a GitHub
git push -u origin main
