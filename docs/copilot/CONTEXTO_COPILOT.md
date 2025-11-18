# 🤖 CONTEXTO PARA GITHUB COPILOT

**Fecha de última actualización:** 14 de Noviembre de 2025  
**Versión del proyecto:** v1.0.0  
**Desarrollador:** Daniel Sandoval

---

## 📋 INSTRUCCIONES AL INICIAR NUEVA SESIÓN

Cuando Daniel te contacte nuevamente, **LEE PRIMERO ESTOS ARCHIVOS:**

1. **CONTEXTO_COPILOT.md** (este archivo) ← Información de trabajo
2. **TAREAS_PENDIENTES.md** ← Estado de tareas
3. **PLAN_DE_TRABAJO_PROFESIONAL.md** ← Roadmap estratégico
4. **ESTILO_DE_TRABAJO.md** ← Forma de colaboración

---

## 🎯 RESUMEN DEL PROYECTO

**Nombre:** VAL-APP (Villas de Alcalá)  
**Tipo:** Sistema de gestión para condominio pequeño  
**Stack:** Next.js 15.5.2, React 19, TypeScript, Supabase, Tailwind CSS  
**Deploy:** Vercel (automático desde GitHub)  
**Repositorio:** jdsandovalg/val-app (branch: main)

### **Propósito**
Sistema liviano para gestión de:
- Contribuciones de casas
- Proyectos con votaciones
- Calendario de pagos
- Administración de usuarios
- Reportes PDF

### **Contexto del negocio**
- **10 casas** en el condominio
- **3 roles:** PRE (residente), OPE (operador), ADM (administrador)
- **Votación:** Requiere 100% consenso para aprobar proyectos
- **Idiomas:** Español (principal), Inglés, Francés

---

## 📅 HISTORIAL DE SESIONES

### **Sesión 1: 13 de Noviembre de 2025**
**Duración:** ~4 horas  
**Objetivo:** Implementar sistema de votaciones con reportes PDF

**Trabajo realizado:**
1. ✅ Fix de overflow horizontal en mobile
2. ✅ Cambio de ícono de votación (CheckCircle2 → Gavel)
3. ✅ Creación de `VotingReport.tsx` (componente PDF)
4. ✅ Creación de `report/page.tsx` (visor PDF)
5. ✅ Botón "Generar Reporte PDF" en voting page
6. ✅ Traducciones completas (es/en/fr)
7. ✅ Bug crítico: Solo mostraba 1 voto de 10
8. ✅ Solución: Nueva RPC `fn_gestionar_votos_con_responsable`
9. ✅ Problema: Estrellas Unicode no se renderizaban en PDF
10. ✅ Solución: Indicadores visuales (números + barras + colores)

**Desafíos técnicos:**
- **Unicode en PDF:** @react-pdf/renderer solo soporta Helvetica/Times/Courier
- **Vote counting:** Frontend usaba estado filtrado en lugar de todos los votos
- **Responsables:** Necesitaba JOIN a tabla usuarios

**Resultado:** Sistema de votaciones 100% funcional con reportes profesionales

---

### **Sesión 2: 14 de Noviembre de 2025**
**Duración:** ~3 horas  
**Objetivo:** Polish, mejoras UX y análisis completo del proyecto

**Trabajo realizado:**
1. ✅ Badge "PROYECTO APROBADO" con lógica 100% consenso
2. ✅ Tabla de criterios de aprobación en PDF
3. ✅ Filtrado: Solo mostrar cotizaciones con votos > 0
4. ✅ Layout de responsables: 3 columnas (mejor para nombres largos)
5. ✅ Empty state profesional (sin proyectos en votación)
6. ✅ Documentación completa en TAREAS_PENDIENTES.md
7. ✅ Análisis exhaustivo del proyecto (103 archivos)
8. ✅ Creación de PLAN_DE_TRABAJO_PROFESIONAL.md
9. ✅ Identificación de oportunidades de mejora
10. ✅ Roadmap de 4 fases (2026-2027+)
11. ✅ Creación de tag v1.0.0 en GitHub

**Hallazgos del análisis:**
- ✅ Código en excelente estado
- ✅ Arquitectura sólida y escalable
- ✅ 0 bugs críticos conocidos
- ✅ 2 TODOs pendientes (bajo impacto)
- ✅ Build exitoso sin errores

**Resultado:** Proyecto completamente documentado y listo para Fase 1

---

## 🔧 ARQUITECTURA TÉCNICA

### **Frontend**
```
src/
├── app/                      [Rutas Next.js App Router]
│   ├── page.tsx             [Login]
│   ├── menu/                [Área autenticada]
│   │   ├── layout.tsx       [Nav + Header]
│   │   ├── calendarios/     [Pagos personales]
│   │   ├── avisos/          [Notificaciones]
│   │   ├── grupos-de-trabajo/
│   │   ├── voting/          [Sistema votaciones + PDF] ⭐
│   │   └── admin/           [Módulos administrativos]
├── components/              [Componentes reutilizables]
│   ├── modals/
│   └── ui/                  [shadcn components]
├── hooks/                   [Custom hooks]
├── lib/                     [Utils + Supabase client]
├── locales/                 [es.json, en.json, fr.json]
├── services/                [API services]
├── types/                   [TypeScript types]
└── utils/                   [Formatters, helpers]
```

### **Backend (Supabase)**
```
Tablas principales:
├── usuarios                 [Usuarios del sistema]
├── contribuciones_catalogo  [Tipos de aportes]
├── contribuciones_casa      [Aportes por casa]
├── proyectos                [Proyectos del condominio]
├── proyecto_rubros          [Líneas de costo]
├── proyecto_evidencias      [Cotizaciones/docs]
└── proyecto_votos           [Votos por casa]

RPCs clave:
├── login_user
├── fn_gestionar_votos_con_responsable  [NEW - 13 Nov]
├── get_project_info_with_status
├── gestionar_proyectos
└── get_avisos_categorizados
```

### **Internacionalización**
```typescript
// Provider: I18nProvider
// Idiomas: es (español), en (inglés), fr (francés)
// Monedas: GTQ, USD, EUR
// Formato fechas: Intl.DateTimeFormat
```

---

## 🎨 PATRONES DE DISEÑO ESTABLECIDOS

### **1. Mobile-First**
- Todas las vistas diseñadas primero para móvil
- Vista única con tarjetas (no tablas desktop)
- Touch-friendly (botones grandes, espaciado generoso)

### **2. Código de Colores Consistente**
```typescript
Verde (#10B981):   PAGADO / APROBADO / REALIZADO
Rojo (#EF4444):    PENDIENTE / RECHAZADO / VENCIDO
Azul (#2563EB):    EN_PROGRESO / EN_VOTACION
Amarillo (#F59E0B): ABIERTO / ADVERTENCIA
Gris (#6B7280):    CANCELADO / DESHABILITADO
```

### **3. Estructura de Componentes**
```typescript
// Patrón establecido:
const ComponentPage = () => {
  // 1. Hooks
  const { t, locale, formatCurrency } = useLanguage();
  const [data, setData] = useState([]);
  
  // 2. Fetch data
  useEffect(() => {
    fetchData();
  }, [dependencies]);
  
  // 3. Handlers
  const handleAction = async () => {
    try {
      // Lógica con RPC
      toast.success(t('key'));
    } catch (error) {
      toast.error(t('error'));
    }
  };
  
  // 4. Render
  return (
    <div className="w-screen overflow-x-hidden">
      {/* Contenido */}
    </div>
  );
};
```

### **4. Gestión de Estado**
- **Local state:** useState para UI
- **No state manager:** No se usa Redux/Zustand (proyecto pequeño)
- **Server state:** Fetch directo con Supabase
- **Persistencia:** localStorage para datos temporales

### **5. Manejo de Errores**
```typescript
try {
  const { data, error } = await supabase.rpc('function_name', params);
  if (error) throw error;
  toast.success(t('success.message'));
} catch (error) {
  console.error('Error:', error);
  toast.error(t('error.message'));
}
```

---

## 🔑 REGLAS DE NEGOCIO IMPORTANTES

### **Sistema de Votaciones**
```
Regla de Aprobación:
- Requiere 100% consenso
- TODAS las casas deben votar por la MISMA cotización
- Si hay dispersión → NO APROBADO
- Si hay empate → NO APROBADO
- Solo mayoría simple → NO APROBADO

Lógica implementada:
const aprobado = 
  ganadorVotos === totalCasas &&
  totalCasas > 0 &&
  cotizaciones.filter(c => c.votos === totalCasas).length === 1;
```

### **Roles y Permisos**
```
PRE (Residente):
- Ver su calendario
- Pagar aportes
- Votar en su casa asignada

OPE (Operador):
- Todo de PRE
- Gestionar proyectos
- Ver reportes generales

ADM (Administrador):
- Todo de OPE
- Gestión de usuarios
- Gestión de catálogos
- Votar por cualquier casa (proxy)
- Cargos rotativos
```

### **Estados de Proyecto**
```
Flujo normal:
abierto → en_votacion → aprobado → en_progreso → terminado

Flujo alternativo:
abierto → en_votacion → rechazado
cualquier_estado → cancelado
```

---

## 💬 ESTILO DE COMUNICACIÓN

### **Preferencias de Daniel:**
- ✅ Explicaciones claras pero concisas
- ✅ Código funcional desde el primer intento
- ✅ Ejemplos visuales (diagramas, tablas)
- ✅ Documentación actualizada constantemente
- ✅ Git commits descriptivos

### **Lo que valora:**
- 🎯 Soluciones pragmáticas
- 🚀 Implementación directa (no solo sugerencias)
- 📊 Análisis profesionales y completos
- 🔧 Código limpio y mantenible
- 📚 Documentación exhaustiva

### **Lo que NO le gusta:**
- ❌ Código con placeholders (...existing code...)
- ❌ Sugerencias sin implementar
- ❌ Respuestas genéricas sin contexto
- ❌ Olvidar decisiones tomadas previamente

---

## 🛠️ HERRAMIENTAS Y COMANDOS FRECUENTES

### **Development**
```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build de producción
npm run lint         # ESLint

./git-auto-push.sh   # Script de auto-push a GitHub
```

### **Git Workflow**
```bash
# Patrón establecido:
git add .
git commit -m "feat: descripción clara"
git push origin main

# Para milestones:
git tag -a v1.0.0 -m "Descripción"
git push origin v1.0.0
```

### **Supabase**
```typescript
// Patrón de llamadas RPC:
const { data, error } = await supabase
  .rpc('function_name', {
    p_param1: value1,
    p_param2: value2
  });

if (error) throw error;
return data;
```

---

## 📊 MÉTRICAS ACTUALES (v1.0.0)

```
Archivos:           103 TypeScript/React
Líneas de código:   ~15,000
Módulos:            12 principales
Componentes:        50+ (aprox)
RPCs:               25+ funciones
Idiomas:            3 (es/en/fr)
Tests:              0 (pendiente Fase 1)
Build time:         ~18-20 segundos
First Load JS:      148-200 KB
```

---

## 🚀 PRÓXIMOS PASOS (Al reiniciar)

### **Fase 1, Sprint 1: Testing** (Pendiente)
```bash
# Cuando Daniel decida continuar:
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Crear:
- jest.config.js
- __tests__/ folder
- 20 tests unitarios iniciales
```

### **Otros proyectos en paralelo**
Daniel tiene un **sistema multi-tenancy en Flutter/Dart** para residenciales grandes. Este proyecto (val-app) es la versión liviana.

---

## 🎓 LECCIONES APRENDIDAS

### **Técnicas:**
1. **Unicode en PDF:** No confiar en símbolos avanzados, usar alternativas visuales
2. **Vote counting:** Siempre fetch todos los datos, no usar estado filtrado
3. **Responsive:** Mobile-first salva tiempo de debugging
4. **RPC design:** JOIN en base de datos mejor que múltiples queries

### **De proceso:**
1. **Documentación continua:** TAREAS_PENDIENTES.md actualizado en cada sesión
2. **Git tags:** Marcar milestones importantes
3. **Análisis completo:** Invertir tiempo en entender antes de optimizar
4. **Quick wins:** Balance entre features nuevas y polish

---

## 🔐 INFORMACIÓN SENSIBLE (NO INCLUIDA)

**Nota:** Este archivo NO contiene:
- ❌ Credenciales de Supabase
- ❌ API keys
- ❌ URLs de producción
- ❌ Información de usuarios reales

Todo eso está en variables de entorno (`.env.local`)

---

## 📞 CONTACTO Y CONTEXTO

**Usuario:** Daniel Sandoval  
**Ubicación:** Guatemala (zona horaria GTQ)  
**Experiencia:** Desarrollador senior con múltiples proyectos  
**Otros proyectos:** Sistema multi-tenancy Flutter/Dart (por revisar)

---

## ✅ CHECKLIST AL INICIAR SESIÓN

Cuando Daniel te contacte, verifica:

- [ ] Leer CONTEXTO_COPILOT.md (este archivo)
- [ ] Leer TAREAS_PENDIENTES.md
- [ ] Leer PLAN_DE_TRABAJO_PROFESIONAL.md
- [ ] Verificar última versión git (v1.0.0 o superior)
- [ ] Preguntar objetivo de la sesión
- [ ] Revisar archivos modificados recientemente si aplica

---

**Última actualización:** 14 de Noviembre de 2025, 23:45 hrs  
**Próxima revisión:** Al iniciar nueva sesión de desarrollo
