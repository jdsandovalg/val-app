

#¿Cómo usar el script?
#Conéctate a tu servidor AWS vía SSH.
#Crea el archivo: nano deploy.sh.
#Pega el contenido del script que te proporcioné.
#Guarda y cierra el editor (en nano, es Ctrl+X, luego Y, y Enter).
#Dale permisos de ejecución: chmod +x deploy.sh.
#Edita el script para poner la URL de tu repositorio Git y tu dominio.
#Ejecútalo: ./deploy.sh.




#!/bin/bash

# ==============================================================================
# Script de Despliegue para Val-App en un servidor Debian/Ubuntu
# ==============================================================================
#
# Este script automatiza la configuración de un servidor para ejecutar la
# aplicación Next.js en modo de producción.
#
# Pasos que realiza:
# 1. Actualiza los paquetes del sistema.
# 2. Instala Nginx como servidor web (reverse proxy).
# 3. Instala NVM (Node Version Manager) para gestionar las versiones de Node.js.
# 4. Instala la última versión LTS de Node.js.
# 5. Instala PM2, un gestor de procesos para mantener la aplicación corriendo.
# 6. Configura Nginx para servir la aplicación.
# 7. Configura el firewall (UFW).
#
# ==============================================================================

# Detener el script si un comando falla
set -e

# --- 1. Actualización del Sistema ---
echo "### 1/7 - Actualizando paquetes del sistema..."
sudo apt-get update
sudo apt-get upgrade -y

# --- 2. Instalación de Nginx y otras utilidades ---
echo "### 2/7 - Instalando Nginx, Git y Curl..."
sudo apt-get install -y nginx curl git

# --- 3. Instalación de NVM (Node Version Manager) ---
echo "### 3/7 - Instalando NVM..."
# Se descarga y ejecuta el script de instalación de NVM.
# Esto evita problemas de versiones de Node.js de los repositorios de Debian.
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cargar NVM en la sesión actual del shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# --- 4. Instalación de Node.js ---
# Instala la última versión LTS (Long-Term Support) de Node.js
echo "### 4/7 - Instalando Node.js (LTS)..."
nvm install --lts
nvm use --lts

# --- 5. Instalación de PM2 ---
echo "### 5/7 - Instalando PM2 globalmente..."
npm install pm2 -g

# --- 6. Clonar, Instalar Dependencias y Construir la App ---
# NOTA: Reemplaza <URL_DEL_REPOSITORIO> con la URL de tu repositorio Git.
echo "### 6/7 - Clonando el repositorio y construyendo la aplicación..."
cd /var/www
git clone https://github.com/tu_usuario/val-app.git # <-- CAMBIA ESTA URL
cd val-app

echo "Instalando dependencias de npm..."
npm install

echo "Construyendo la aplicación Next.js para producción..."
npm run build

# Iniciar la aplicación con PM2
echo "Iniciando la aplicación con PM2..."
pm2 start npm --name "val-app" -- start

# Configurar PM2 para que se inicie automáticamente en el arranque del sistema
echo "Configurando PM2 para el arranque del sistema..."
pm2 startup
pm2 save

# --- 7. Configuración de Nginx como Reverse Proxy ---
echo "### 7/7 - Configurando Nginx..."

# Crear un archivo de configuración para la aplicación
# NOTA: Reemplaza `tu_dominio.com` con tu dominio real o la IP pública del servidor.
sudo tee /etc/nginx/sites-available/val-app > /dev/null <<EOF
server {
    listen 80;
    server_name tu_dominio.com www.tu_dominio.com; # <-- CAMBIA ESTO

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar el sitio creando un enlace simbólico
sudo ln -s /etc/nginx/sites-available/val-app /etc/nginx/sites-enabled/

# Eliminar la configuración por defecto de Nginx si existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Probar la configuración de Nginx y reiniciar el servicio
sudo nginx -t
sudo systemctl restart nginx

# --- Configuración del Firewall (UFW) ---
echo "Configurando el firewall (UFW)..."
sudo ufw allow 'Nginx Full'
sudo ufw enable # Asegúrate de tener acceso SSH configurado si lo habilitas por primera vez

echo "=================================================="
echo "¡Despliegue completado!"
echo ""
echo "Pasos finales:"
echo "1. Asegúrate de que tu dominio (ej. tu_dominio.com) apunte a la IP de este servidor."
echo "2. Si usas HTTPS (recomendado), instala Certbot para obtener un certificado SSL gratuito:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx"
echo "3. Tu aplicación está corriendo en http://localhost:3000 y es servida por Nginx en el puerto 80."
echo "=================================================="
