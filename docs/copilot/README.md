# 📚 Documentación de Copilot - Val-App

Este directorio contiene toda la documentación de colaboración con GitHub Copilot para el proyecto **Val-App**, un sistema de gestión de condominios, edificios y residenciales.

## 📂 Contenido de este Directorio

### 📋 Documentos de Contexto
- **`CONTEXTO_COPILOT.md`** - Contexto general del proyecto para GitHub Copilot
- **`INSTRUCCION_INICIO_COPILOT.md`** - Instrucciones iniciales para nuevas sesiones

### 🎯 Metodología y Estilo
- **`ESTILO_DE_TRABAJO.md`** - Guía de estilo y mejores prácticas de código
- **`PLAN_DE_TRABAJO_PROFESIONAL.md`** - Plan maestro del proyecto

### ✅ Seguimiento de Tareas
- **`TAREAS_PENDIENTES.md`** - Lista principal de tareas pendientes (formato Markdown)
- **`TAREAS_PENDIENTES_COPILOT`** - Lista de tareas en formato texto plano

### 🛠️ Mejores Prácticas Técnicas
- **`MEJORES_PRACTICAS_SQL.md`** - Guía de mejores prácticas SQL y PostgreSQL
- **`MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md`** - Manual completo de arquitectura (agnóstico de stack)
- **`LECCION_SEPARACION_RESPONSABILIDADES.md`** - Lección: RPC vs Frontend - Dónde filtrar datos

## 🎯 Propósito

Estos documentos sirven para:

1. **Mantener contexto entre sesiones** - GitHub Copilot puede consultar estos archivos para entender el estado del proyecto
2. **Documentar decisiones arquitectónicas** - Registro de por qué se tomaron ciertas decisiones
3. **Guiar el desarrollo** - Referencias rápidas para patrones y mejores prácticas
4. **Facilitar la colaboración** - Nuevos desarrolladores pueden ponerse al día rápidamente
5. **Transferencia de conocimiento** - Base para implementar en otros proyectos (ej: Flutter/Dart)

## 📖 Cómo Usar Esta Documentación

### Para Desarrolladores
1. Lee **CONTEXTO_COPILOT.md** primero para entender el proyecto
2. Revisa **TAREAS_PENDIENTES.md** para ver qué está en progreso
3. Consulta **MEJORES_PRACTICAS_*.md** antes de implementar nuevas features

### Para GitHub Copilot
- Estos documentos están optimizados para ser leídos por Copilot
- Contienen contexto estructurado para generar código consistente
- Se actualizan después de cada sesión de trabajo importante

### Para Trasladar a Otros Proyectos
- **MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md** es agnóstico de tecnología
- Puede ser usado en proyectos Flutter/Dart, React Native, o cualquier stack
- Contiene principios universales aplicables a sistemas multi-tenant

## 🔄 Mantenimiento

**Frecuencia de Actualización:**
- TAREAS_PENDIENTES.md: Diario (después de completar tareas)
- CONTEXTO_COPILOT.md: Semanal (cuando hay cambios arquitectónicos)
- MEJORES_PRACTICAS_*.md: Por sesión (cuando se descubren nuevos patrones)

**Responsable:** Equipo de desarrollo + GitHub Copilot

## 📦 Estructura del Proyecto Completo

```
val-app/
├── docs/
│   ├── copilot/              ← TÚ ESTÁS AQUÍ
│   │   ├── README.md         ← Este archivo
│   │   ├── CONTEXTO_COPILOT.md
│   │   ├── ESTILO_DE_TRABAJO.md
│   │   ├── INSTRUCCION_INICIO_COPILOT.md
│   │   ├── MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md
│   │   ├── MEJORES_PRACTICAS_SQL.md
│   │   ├── PLAN_DE_TRABAJO_PROFESIONAL.md
│   │   ├── TAREAS_PENDIENTES.md
│   │   └── TAREAS_PENDIENTES_COPILOT
│   └── MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md  ← Copia maestra para Flutter
├── sql-backups/              ← Scripts SQL de correcciones
├── src/                      ← Código fuente Next.js
├── supabase/                 ← Configuración Supabase
└── ...
```

## 🚀 Próximos Pasos

Este sistema de documentación será replicado en **FlesiSuite** (Flutter/Dart), adaptando las mejores prácticas a ese stack tecnológico.

---

**Última actualización:** 18 de Noviembre de 2025  
**Versión:** 1.0  
**Proyecto:** Val-App (Next.js 15 + React 19 + Supabase)
