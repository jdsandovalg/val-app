# 📦 Guía de Portabilidad y Diagnóstico

Este documento sirve como referencia técnica para mover el proyecto entre discos (ej. SSD externo) y como bitácora para registrar errores para la asistencia de IA.

## ⚠️ El Problema: Rutas Absolutas

Herramientas como **Tailwind**, **Webpack** y **Next.js** generan archivos de caché con **rutas absolutas** (ej: `/Users/usuario/proyecto/...`) durante la instalación. Al mover la carpeta a otro disco, estas rutas se rompen, causando errores de "Module not found" o fallos de estilos.

## 🛠️ Workaround (Solución Automática)

Hemos implementado un script (`clean_install.sh`) que realiza una "limpieza profunda" para regenerar estas rutas en el nuevo entorno.

**Instrucciones:**
1. Abre la terminal en la carpeta del proyecto en el nuevo disco.
2. Asegúrate de que el script tenga permisos: `chmod +x clean_install.sh`
3. Ejecuta:
   ```bash
   ./clean_install.sh
   ```

---

## 🤖 BITÁCORA DE ERRORES (Contexto para IA)

**Instrucciones para el desarrollador:**
Si el script falla o la aplicación no compila, **no borres este archivo**. Copia y pega el error completo de tu terminal en la sección de abajo.

Al compartir este archivo con la IA en una nueva sesión, ella leerá esta sección y entenderá el estado exacto del problema.

### 👇 PEGA TUS ERRORES AQUÍ ABAJO 👇

#### [Fecha: DD/MM/AAAA] - Intento de ejecución en SSD
```text
(Pega aquí el log del error...)
```

---

### Historial de Soluciones Intentadas
1. Ejecución de `clean_install.sh` -> [Resultado]
2. Borrado manual de `node_modules` -> [Resultado]

```

### ¿Cómo usar esto?
1.  Guarda este archivo.
2.  Ejecuta tu prueba en el SSD.
3.  Si falla, copia el error de la terminal y pégalo en la sección **"👇 PEGA TUS ERRORES AQUÍ ABAJO 👇"**.
4.  En el futuro, simplemente dile a la IA: *"Revisa `docs/GUIA_PORTABILIDAD.md`, ahí están los logs del último error"*.

<!--
[PROMPT_SUGGESTION]Excelente. Ahora que tengo el entorno listo, ¿cómo puedo verificar manualmente que la compilación de producción (npm run build) funciona correctamente antes de subir a Vercel?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]¿Podemos agregar un paso al script .sh para que guarde automáticamente los errores en este archivo de bitácora si la instalación falla?[/PROMPT_SUGGESTION]
