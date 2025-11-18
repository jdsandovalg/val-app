# 🏘️ Val-App - Sistema de Gestión de Condominios

Sistema completo de administración para condominios, edificios y residenciales. Multi-tenant, multi-idioma (i18n) y multi-usuario con control de roles.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 15.5.2 (App Router) + React 19
- **Backend:** Supabase (PostgreSQL + Storage + Auth)
- **Estilos:** Tailwind CSS + shadcn/ui
- **Generación PDF:** API Routes con jsPDF
- **i18n:** Sistema personalizado (ES/EN/FR)
- **Estado:** React Hooks + Context API

## ⚡ Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
val-app/
├── docs/
│   ├── copilot/                          ← Documentación para GitHub Copilot
│   │   ├── README.md                     ← Guía de documentación
│   │   ├── CONTEXTO_COPILOT.md          ← Contexto del proyecto
│   │   ├── TAREAS_PENDIENTES.md         ← Lista de tareas
│   │   └── MEJORES_PRACTICAS_*.md       ← Guías técnicas
│   └── MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md  ← Manual maestro
│
├── sql-backups/                          ← Scripts SQL y correcciones
│   ├── diagnostico_*.sql                ← Scripts de diagnóstico
│   └── *_CORREGIDO_*.sql                ← Funciones RPC corregidas
│
├── src/
│   ├── app/
│   │   ├── page.tsx                     ← Login
│   │   ├── menu/                        ← Dashboard principal
│   │   │   ├── admin/                   ← Módulos de administración
│   │   │   │   ├── manage-users/        ← Gestión de usuarios
│   │   │   │   ├── projects_management/ ← Gestión de proyectos
│   │   │   │   ├── manage-house-contributions/ ← Contribuciones
│   │   │   │   └── ...
│   │   │   ├── voting/                  ← Sistema de votaciones
│   │   │   ├── calendarios/             ← Calendario de contribuciones
│   │   │   ├── grupos-de-trabajo/       ← Grupos de mantenimiento
│   │   │   └── avisos/                  ← Anuncios
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── i18n-provider.tsx
│   │
│   ├── components/
│   │   ├── modals/                      ← Modales reutilizables
│   │   └── ui/                          ← Componentes shadcn/ui
│   │
│   ├── hooks/                           ← Custom hooks
│   ├── locales/                         ← Traducciones (es/en/fr)
│   ├── services/                        ← Lógica de negocio
│   ├── types/                           ← TypeScript definitions
│   └── utils/                           ← Utilidades y helpers
│
├── supabase/
│   ├── config.toml                      ← Configuración Supabase
│   └── functions/                       ← Edge Functions
│
├── public/                              ← Assets estáticos
└── scripts/                             ← Scripts de deployment
```

## 🎯 Características Principales

### ✅ Implementadas
- ✅ **Autenticación flexible** - Login con # de casa o email
- ✅ **Sistema de roles** - Administrador, Presidente, Operador
- ✅ **Gestión de proyectos** - CRUD completo con estados
- ✅ **Sistema de votaciones** - Votación por casa con consenso
- ✅ **Contribuciones** - Generación automática y manual
- ✅ **Evidencias/Documentos** - Upload a Supabase Storage
- ✅ **Reportes PDF** - Votaciones, contribuciones, calendarios
- ✅ **Calendario** - Vista mensual de contribuciones
- ✅ **Grupos de trabajo** - Asignación de responsabilidades
- ✅ **Multi-idioma** - Español, Inglés, Francés
- ✅ **Avatar upload** - Gestión de perfiles de usuario
- ✅ **Distribución personalizada** - Contribuciones variables por casa

### 🚧 En Desarrollo
- 🚧 Notificaciones push
- 🚧 Historial de pagos
- 🚧 Dashboard de analytics

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev                  # Servidor de desarrollo
npm run build                # Build de producción
npm run start                # Servidor de producción
npm run lint                 # Linting con ESLint

# Base de Datos
# Los scripts SQL están en /sql-backups/
# Ejecutar en el SQL Editor de Supabase
```

## 📚 Documentación Técnica

### Para Desarrolladores
- [`docs/copilot/README.md`](docs/copilot/README.md) - Guía de documentación
- [`docs/copilot/CONTEXTO_COPILOT.md`](docs/copilot/CONTEXTO_COPILOT.md) - Contexto del proyecto
- [`docs/copilot/MEJORES_PRACTICAS_SQL.md`](docs/copilot/MEJORES_PRACTICAS_SQL.md) - Guía SQL

### Manual de Arquitectura
- [`docs/MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md`](docs/MEJORES_PRACTICAS_ARQUITECTURA_CONDOMINIOS.md) - **Manual maestro** con todos los patrones y mejores prácticas (agnóstico de stack)

## 🗃️ Base de Datos

### Funciones RPC Principales
```sql
-- Autenticación
login_user(p_identifier, p_clave)

-- Proyectos
gestionar_proyectos(p_action, p_id_proyecto, ...)
get_project_info_with_status(p_id_proyecto)

-- Evidencias
fn_gestionar_proyecto_evidencias(p_accion, p_id_proyecto, p_tipo_evidencia, ...)

-- Votaciones
fn_gestionar_votos(p_accion, p_id_proyecto, p_id_evidencia, ...)
fn_gestionar_votos_con_responsable(p_id_proyecto)

-- Contribuciones
gestionar_contribuciones_proyecto(p_action, p_id_proyecto, ...)
aprobar_proyecto_y_generar_contribuciones(p_id_proyecto, p_valor_cotizacion)
aprobar_proyecto_con_distribucion_personalizada(p_id_proyecto, p_datos_contribuciones)
```

### Correcciones Recientes
Los scripts SQL corregidos están en `/sql-backups/`:
- `fn_gestionar_proyecto_evidencias_CORREGIDO_2025-11-18.sql` - Filtro de tipo_evidencia
- `login_user_PRO_MAX_2025-11-17.sql` - Login flexible
- `gestionar_proyectos_CORREGIDO_2025-11-15.sql` - Manejo de ambigüedad

## 🌍 Internacionalización

El sistema soporta 3 idiomas:
- 🇪🇸 Español (Guatemala - Q GTQ)
- 🇺🇸 Inglés (Estados Unidos - $ USD)
- 🇫🇷 Francés (Francia - € EUR)

Archivos de traducción en `src/locales/`.

## 🔐 Sistema de Roles

- **ADM** (Administrador) - Acceso completo, puede votar por cualquier casa
- **PRE** (Presidente) - Puede votar solo por su casa
- **OPE** (Operador) - Puede votar solo por su casa

## 📄 Generación de PDFs

Sistema optimizado de reportes PDF:
- **Votación** - Resultados con votos por cotización
- **Contribuciones** - Calendario mensual
- **Proyectos** - Información completa con evidencias

Ver `src/app/api/generate-pdf/route.ts` y `src/app/api/generate-calendar-pdf/route.ts`

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecta tu repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático en cada push

### Supabase
- Ya configurado con PostgreSQL + Storage + Auth
- Edge Functions en `/supabase/functions/`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas Importantes

### Problemas Resueltos
- ✅ Ambigüedad en SQL (prefijos `p_` para parámetros)
- ✅ Filtro de evidencias por tipo
- ✅ Optimización de PDFs (espaciado reducido)
- ✅ Login flexible (casa # o email)
- ✅ Sistema de roles en BD (no en Auth provider)

### Próximas Mejoras
- [ ] Testing automatizado
- [ ] CI/CD pipeline
- [ ] Modo offline
- [ ] App móvil nativa (Flutter/Dart)

## 📞 Contacto

**Proyecto:** Val-App  
**Stack:** Next.js 15 + React 19 + Supabase  
**Versión:** 1.0  
**Última actualización:** 18 de Noviembre de 2025

---

**⚠️ Nota:** Este proyecto está activamente en desarrollo. Para más detalles técnicos, consulta la documentación en `/docs/`.

## 🔗 Enlaces Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 📜 Licencia

Propietario - Todos los derechos reservados
