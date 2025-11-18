# 🤝 ESTILO DE TRABAJO - Daniel & GitHub Copilot

**Fecha de creación:** 14 de Noviembre de 2025  
**Propósito:** Documentar la forma efectiva de colaboración establecida

---

## 🎯 METODOLOGÍA DE TRABAJO

### **Sesiones Típicas**
```
Duración: 3-4 horas
Frecuencia: Variable (según disponibilidad de Daniel)
Horario: Tarde/noche (zona horaria Guatemala)

Estructura de sesión:
1. Contexto inicial (1-5 minutos)
2. Definición de objetivos (5 minutos)
3. Implementación iterativa (80% del tiempo)
4. Testing y validación (10% del tiempo)
5. Documentación (5% del tiempo)
```

---

## 💻 WORKFLOW ESTABLECIDO

### **1. Inicio de Tarea**
```
Daniel dice: "Necesito implementar [FEATURE]"

Copilot debe:
1. ✅ Confirmar entendimiento
2. ✅ Identificar archivos afectados
3. ✅ Proponer enfoque técnico
4. ✅ Implementar directamente (no solo sugerir)
5. ✅ Validar con Daniel
```

### **2. Durante Implementación**
```
Copilot debe:
- Hacer cambios funcionales desde el primer intento
- Explicar decisiones técnicas importantes
- Usar multi_replace_string_in_file para eficiencia
- Actualizar traducciones (es/en/fr) cuando aplique
- Mantener consistencia con patrones existentes
```

### **3. Al Completar Tarea**
```
Copilot debe:
1. ✅ Confirmar que funciona
2. ✅ Actualizar TAREAS_PENDIENTES.md
3. ✅ Sugerir git commit message
4. ✅ Mencionar posibles mejoras futuras
```

---

## 🔧 PREFERENCIAS TÉCNICAS

### **Código**
```typescript
✅ HACER:
- TypeScript estricto (tipos explícitos)
- Tailwind CSS para estilos
- Componentes funcionales con hooks
- Manejo de errores con try/catch + toast
- Comentarios solo cuando necesario
- Nombres descriptivos en español o inglés

❌ NO HACER:
- PropTypes (usamos TypeScript)
- CSS-in-JS (usamos Tailwind)
- Class components
- console.log sin console.error
- any types (salvo casos excepcionales)
```

### **Estructura de archivos**
```
✅ HACER:
- Un componente por archivo
- Modals en src/components/modals/
- Páginas en src/app/menu/[modulo]/
- Types en src/types/
- Utils en src/utils/

❌ NO HACER:
- Múltiples componentes en un archivo
- Mixing concerns (lógica + UI en un solo componente grande)
- Archivos > 500 líneas (refactorizar)
```

---

## 📝 DOCUMENTACIÓN

### **TAREAS_PENDIENTES.md**
```markdown
Actualizar:
- ✅ Después de cada feature completada
- ✅ Al identificar bugs
- ✅ Al agregar TODOs en código

Formato:
- Checkboxes [x] para completadas
- Descripción clara y concisa
- Fecha de última actualización
```

### **Comentarios en código**
```typescript
// ✅ BUENO: Explica el "por qué"
// Filtramos solo cotizaciones con votos para transparencia
const filtered = cotizaciones.filter(c => c.votos > 0);

// ❌ MALO: Explica el "qué" (obvio)
// Filtrar cotizaciones
const filtered = cotizaciones.filter(c => c.votos > 0);

// ✅ BUENO: Decisión técnica importante
// @react-pdf/renderer no soporta Unicode avanzado,
// usamos indicadores visuales alternativos
const VoteIndicator = ({ count }) => (
  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
    {count}
  </Text>
);
```

---

## 🐛 DEBUGGING Y RESOLUCIÓN

### **Cuando hay un bug**
```
1. Daniel reporta: "X no funciona"
2. Copilot pregunta: detalles, mensajes de error, capturas
3. Copilot investiga:
   - Revisar código relevante
   - Verificar logs de terminal
   - Comprobar RPCs de Supabase
4. Copilot propone: diagnóstico + solución
5. Implementar y validar
```

### **Tipos de errores comunes**
```
Build errors:
- Revisar imports
- Verificar tipos TypeScript
- Comprobar sintaxis

Runtime errors:
- Revisar llamadas a Supabase
- Verificar manejo de null/undefined
- Comprobar permisos RLS

UI bugs:
- Revisar responsive design
- Verificar overflow-x
- Comprobar z-index de modales
```

---

## 🎨 DECISIONES DE DISEÑO

### **Cuando Daniel pide una feature nueva**
```
Copilot debe considerar:
1. ✅ Consistencia con diseño existente
2. ✅ Mobile-first approach
3. ✅ Código de colores establecido
4. ✅ Accesibilidad básica
5. ✅ Internacionalización (i18n)

Preguntar a Daniel solo si:
- Decisión de negocio (no técnica)
- Múltiples enfoques válidos
- Trade-offs significativos
```

### **Estándares visuales**
```css
Cards:
- bg-white shadow-md rounded-lg
- Padding: p-4 a p-6
- Border lateral: border-l-4 [color-estado]

Buttons:
- Primarios: bg-blue-500 hover:bg-blue-600
- Secundarios: bg-gray-200 hover:bg-gray-300
- Peligro: bg-red-500 hover:bg-red-600
- Éxito: bg-green-500 hover:bg-green-600

Espaciado:
- Mobile: gap-3, gap-4
- Desktop: gap-6, gap-8
```

---

## 🌍 INTERNACIONALIZACIÓN

### **Al agregar textos nuevos**
```typescript
// 1. Agregar a src/locales/es.json
{
  "modulo": {
    "nuevaKey": "Texto en español"
  }
}

// 2. Agregar a src/locales/en.json
{
  "modulo": {
    "nuevaKey": "Text in English"
  }
}

// 3. Agregar a src/locales/fr.json
{
  "modulo": {
    "nuevaKey": "Texte en français"
  }
}

// 4. Usar en componente
const { t } = useLanguage();
<p>{t('modulo.nuevaKey')}</p>
```

### **Formato de fechas y moneda**
```typescript
// Siempre usar utilidades
const { formatCurrency, formatDate } = useLanguage();

// ✅ BUENO
<p>{formatCurrency(monto)}</p>
<p>{formatDate(fecha)}</p>

// ❌ MALO
<p>${monto}</p>
<p>{fecha.toString()}</p>
```

---

## 🔄 GIT Y DEPLOYMENT

### **Commits**
```bash
# Formato preferido:
feat: Descripción clara de la feature
fix: Descripción del bug corregido
docs: Actualización de documentación
style: Cambios de formato sin lógica
refactor: Refactorización sin cambios funcionales
test: Agregar o modificar tests

# Ejemplos:
git commit -m "feat: Sistema de votaciones con reportes PDF"
git commit -m "fix: Vote counting mostraba solo 1 voto"
git commit -m "docs: Actualizar PLAN_DE_TRABAJO_PROFESIONAL.md"
```

### **Branches**
```
Actualmente:
- Solo main (deploy directo a Vercel)

Futuro (cuando crezca el equipo):
- main (producción)
- develop (staging)
- feature/* (nuevas features)
```

---

## 🚀 PROCESO DE FEATURES

### **Feature pequeña** (1-2 horas)
```
1. Daniel: "Necesito [FEATURE]"
2. Copilot: Implementa directamente
3. Daniel: Prueba y valida
4. Copilot: Actualiza docs
5. Daniel: Git commit + push
```

### **Feature mediana** (medio día)
```
1. Daniel: "Necesito [FEATURE]"
2. Copilot: Propone arquitectura
3. Daniel: Aprueba o ajusta
4. Copilot: Implementa en partes
5. Validación iterativa
6. Copilot: Actualiza docs
7. Daniel: Git commit + push
```

### **Feature grande** (1+ días)
```
1. Daniel: "Necesito [FEATURE]"
2. Copilot: Plan detallado con fases
3. Daniel: Aprueba plan
4. Implementación por sprints mini
5. Validación al final de cada mini-sprint
6. Documentación continua
7. Git commits incrementales
```

---

## 🎓 LECCIONES APRENDIDAS

### **Técnicas que funcionan bien**
```
✅ Implementar directamente (no solo sugerir)
✅ Usar multi_replace_string_in_file para eficiencia
✅ Explicar decisiones técnicas importantes
✅ Actualizar docs al completar tareas
✅ Sugerir mejoras futuras sin implementarlas aún
✅ Crear archivos de contexto como este
```

### **Errores a evitar**
```
❌ Código con placeholders (...existing code...)
❌ Sugerencias vagas sin implementación
❌ Olvidar traducciones en otros idiomas
❌ No actualizar TAREAS_PENDIENTES.md
❌ Cambios que rompen el build
❌ Asumir que Daniel sabe detalles técnicos no explicados
```

---

## 💡 PATRONES DE COMUNICACIÓN

### **Daniel pregunta algo técnico**
```
Copilot responde:
1. Respuesta directa (1-2 líneas)
2. Contexto adicional si es necesario
3. Ejemplo de código si aplica
4. No ser verboso innecesariamente
```

### **Daniel pide implementar algo**
```
Copilot:
1. Confirma entendimiento (brevemente)
2. Implementa directamente
3. Confirma que está listo
4. Opcional: menciona consideraciones
```

### **Copilot necesita aclaración**
```
Preguntar de forma específica:
✅ "¿Quieres que [OPCIÓN A] o [OPCIÓN B]?"
✅ "¿Esto debería estar en [UBICACIÓN]?"
✅ "¿El botón debe ser [COLOR]?"

❌ "¿Qué quieres hacer?"
❌ "No entiendo tu solicitud"
❌ "Podrías ser más específico?"
```

---

## 📊 MÉTRICAS DE ÉXITO

### **Sesión exitosa:**
- ✅ Objetivos cumplidos al 100%
- ✅ Código funciona en primer intento
- ✅ Sin errores de build
- ✅ Documentación actualizada
- ✅ Daniel satisfecho con resultados

### **Sesión para mejorar:**
- ⚠️ Múltiples intentos para misma feature
- ⚠️ Build roto después de cambios
- ⚠️ Daniel tiene que corregir código
- ⚠️ Documentación desactualizada

---

## 🔑 REGLAS DE ORO

### **Las 10 reglas de oro de esta colaboración:**

1. **Implementar, no sugerir** - Daniel quiere código funcional
2. **Mobile-first siempre** - El 80% del uso es móvil
3. **i18n completo** - 3 idiomas en cada texto nuevo
4. **Documentar continuamente** - Mantener archivos .md actualizados
5. **TypeScript estricto** - Sin any, tipos explícitos
6. **Consistencia visual** - Seguir patrones establecidos
7. **RPC para todo** - No queries directas a Supabase
8. **Toast para feedback** - Confirmar acciones al usuario
9. **Git commits claros** - Mensajes descriptivos
10. **Pragmatismo sobre perfeccionismo** - Funciona > Perfecto

---

## 🎯 OBJETIVOS A LARGO PLAZO

### **Para val-app:**
- Implementar testing (Fase 1)
- Agregar analytics (Fase 1)
- Notificaciones push (Fase 2)
- Dashboard administrativo (Fase 2)

### **Para colaboración:**
- Mantener velocidad de desarrollo alta
- Documentación siempre actualizada
- Código limpio y mantenible
- Daniel aprende mejores prácticas en el proceso

---

## 📞 NOTAS FINALES

Daniel es un desarrollador experimentado que:
- Entiende conceptos técnicos complejos
- Valora la eficiencia y pragmatismo
- Prefiere explicaciones concisas
- Aprecia análisis profesionales detallados
- Tiene múltiples proyectos en paralelo

**La mejor forma de trabajar con él:**
- Ser directo y eficiente
- Implementar soluciones completas
- Documentar decisiones importantes
- Proponer mejoras sin imposiciones
- Mantener alta calidad de código

---

**Última actualización:** 14 de Noviembre de 2025  
**Revisión siguiente:** Según evolución del proyecto

---

## ✅ CHECKLIST DE LECTURA

Al iniciar nueva sesión, Copilot debe haber leído:
- [ ] CONTEXTO_COPILOT.md
- [ ] ESTILO_DE_TRABAJO.md (este archivo)
- [ ] TAREAS_PENDIENTES.md
- [ ] PLAN_DE_TRABAJO_PROFESIONAL.md

**Solo entonces:** Confirmar listo para trabajar 🚀
