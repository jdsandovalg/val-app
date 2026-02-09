# 📦 Guía de Portabilidad y Solución de Errores de Rutas

## ⚠️ El Problema: Rutas Absolutas en Node.js

Cuando mueves la carpeta del proyecto (por ejemplo, de tu Mac a un SSD externo, o entre carpetas), es común encontrar errores como:
- `Error: Cannot find module ...`
- Errores de Tailwind CSS no encontrando archivos.
- Errores de Webpack o Next.js.

### ¿Por qué ocurre?
Herramientas como **Tailwind**, **Webpack** y **Next.js** generan archivos de caché y enlaces simbólicos dentro de las carpetas `node_modules` y `.next` durante la instalación (`npm install`).

Estos archivos a menudo contienen **rutas absolutas** (ej: `/Users/daniel/proyecto/...`) que apuntan a la ubicación original. Al mover la carpeta, esas rutas se rompen porque el disco o la ruta ya no coinciden.

## 🛠️ La Solución: Limpieza y Reinstalación

Para arreglar esto, debemos forzar al proyecto a regenerar todas sus dependencias y cachés en la **nueva ubicación**.

### Opción A: Usando el Script Automático (Recomendado)

Hemos creado un script que realiza todo el proceso de forma segura.

1. Abre la terminal en la carpeta del proyecto (en el SSD o nueva ubicación).
2. Dale permisos de ejecución (solo la primera vez):
   ```bash
   chmod +x clean_install.sh
