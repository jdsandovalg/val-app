# Distribución Personalizada de Contribuciones

## 📋 Descripción

Sistema para aprobar proyectos con contribuciones personalizadas (no prorrateadas equitativamente). Útil cuando las casas deben pagar montos diferentes según criterios especiales como:

- Cantidad de items solicitados (ej: controles remotos)
- Metros cuadrados
- Uso de servicios
- Cualquier otro criterio variable

## 🎯 Flujo de Uso

### 1. Votación con Consenso
- Proyecto debe estar en estado `en_votacion`
- Todas las casas deben haber votado
- Debe haber 100% consenso en una cotización
- La cotización ganadora debe tener un monto válido

### 2. Opciones del Administrador

Cuando se alcanza consenso, el admin ve dos botones:

**Opción A: Distribución Igual (por defecto)**
- Click en "Aprobar y Generar Contribuciones"
- Divide el monto total entre todas las casas equitativamente
- Usa la función `aprobar_proyecto_y_generar_contribuciones`

**Opción B: Distribución Personalizada (CSV)**
- Click en "Distribución Personalizada (CSV)"
- Se abre modal para subir CSV con montos específicos
- Usa la función `aprobar_proyecto_con_distribucion_personalizada`

### 3. Formato del CSV

```csv
id_casa,monto,notas,controles
1,1430.00,2 controles remotos,2
2,1430.00,2 controles remotos,2
9,1680.00,3 controles remotos,3
10,1930.00,4 controles remotos,4
```

**Columnas requeridas:**
- `id_casa`: ID de la casa (número entero)
- `monto`: Monto a pagar (decimal positivo)

**Columnas opcionales:**
- `notas`: Descripción adicional (texto)
- `controles`: O cualquier otra metadata numérica

### 4. Validaciones Automáticas

El sistema valida:
- ✅ Formato CSV correcto
- ✅ Todas las casas existen en la base de datos
- ✅ No hay casas duplicadas
- ✅ Todos los montos son positivos
- ✅ **La suma total del CSV = monto de la cotización ganadora** (tolerancia de Q0.01)
- ✅ Vista previa antes de confirmar

### 5. Resultado

Una vez confirmado:
- Se crea un registro en `contribuciones_proyectos` por cada casa
- Cada contribución incluye:
  - `monto_esperado`: El monto específico del CSV
  - `metadata_json`: Información adicional (controles, etc.)
  - `notas`: Descripción del por qué ese monto
  - `fecha_vencimiento`: 30 días desde la aprobación
  - `estado`: PENDIENTE
- El proyecto cambia a estado `aprobado`

## 🗄️ Base de Datos

### Función SQL

```sql
CREATE FUNCTION aprobar_proyecto_con_distribucion_personalizada(
    p_id_proyecto BIGINT,
    p_datos_contribuciones JSONB
) RETURNS VOID
```

**Ubicación:** `/sql-backups/aprobar_proyecto_con_distribucion_personalizada.sql`

### Estructura de Datos

```typescript
type CSVRow = {
  id_casa: number;
  monto: number;
  notas?: string;
  controles?: number; // O cualquier otra metadata
};
```

La metadata se guarda en `contribuciones_proyectos.metadata_json`:
```json
{
  "controles": 2,
  "distribucion_personalizada": true
}
```

## 📁 Archivos del Sistema

### Frontend
- `/src/app/menu/voting/components/CustomDistributionModal.tsx` - Modal de carga CSV
- `/src/app/menu/voting/page.tsx` - Integración con página de votación

### Backend
- `/sql-backups/aprobar_proyecto_con_distribucion_personalizada.sql` - Función SQL

### Utilidades
- `/scripts/generar_jsonb_contribuciones.py` - Script para convertir CSV a SQL
- `/contribuciones_porton.csv` - Ejemplo de CSV real
- `/contribuciones_porton_updates.sql` - Ejemplo de UPDATE generado

## 🔧 Instalación

### 1. Ejecutar función SQL en Supabase

```bash
# Copiar el contenido de este archivo y ejecutar en SQL Editor de Supabase
cat sql-backups/aprobar_proyecto_con_distribucion_personalizada.sql
```

### 2. Verificar que la tabla tenga las columnas necesarias

La tabla `contribuciones_proyectos` debe tener:
```sql
ALTER TABLE contribuciones_proyectos 
ADD COLUMN IF NOT EXISTS metadata_json JSONB,
ADD COLUMN IF NOT EXISTS notas TEXT;
```

### 3. Compilar frontend

```bash
npm run dev
```

## 📊 Ejemplo Real: Proyecto Portón

### Contexto
- Proyecto: Automatización del portón del condominio
- Costo total: Q15,050.00
- 10 casas participantes
- Cada casa pidió diferente cantidad de controles remotos (2-4)

### CSV Original
```csv
id_casa,monto,notas,controles
1,1430.00,CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON,2
2,1430.00,CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON,2
9,1680.00,CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON,3
10,1930.00,CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON,4
```

### Distribución de Costos
- 8 casas × Q1,430.00 (2 controles) = Q11,440.00
- 1 casa × Q1,680.00 (3 controles) = Q1,680.00
- 1 casa × Q1,930.00 (4 controles) = Q1,930.00
- **Total: Q15,050.00** ✓

## 🎨 UI/UX

### Modal de Distribución Personalizada

Características:
- 📤 Drag & drop para subir CSV
- ✅ Validación en tiempo real
- 📊 Vista previa de datos
- 💰 Verificación de suma total
- ⚠️ Mensajes de error claros
- 👁️ Tabla con preview antes de confirmar

### Estados del Modal

1. **Inicial**: Instrucciones y zona de upload
2. **Validando**: Parser procesa el CSV
3. **Error**: Lista de problemas encontrados
4. **Válido**: Preview de datos + botón confirmar
5. **Procesando**: Guardando en base de datos
6. **Éxito**: Toast de confirmación

## 🔐 Seguridad

- ✅ Validación de permisos (solo ADM puede aprobar)
- ✅ Validación de estado del proyecto (debe estar en votación)
- ✅ Verificación de consenso (100% votos)
- ✅ Validación de existencia de casas
- ✅ Transacción SQL (rollback si algo falla)
- ✅ Prevención de duplicados (no permite re-aprobar)

## 📝 Notas Técnicas

### ¿Por qué JSONB para los datos?

Permite flexibilidad para diferentes tipos de proyectos:
```json
// Proyecto portón
{"controles": 2, "distribucion_personalizada": true}

// Proyecto futuro de jardinería
{"metros_cuadrados": 150, "tipo_cesped": "premium"}

// Proyecto futuro de pintura
{"puertas": 3, "ventanas": 5, "color": "blanco"}
```

### Diferencia vs Prorrateo Normal

| Aspecto | Prorrateo Normal | Distribución Personalizada |
|---------|------------------|----------------------------|
| Método | `aprobar_proyecto_y_generar_contribuciones` | `aprobar_proyecto_con_distribucion_personalizada` |
| Cálculo | Automático (total/casas) | Manual (CSV) |
| Montos | Iguales para todos | Variables por casa |
| Validación | Solo total > 0 | Total CSV = Total Proyecto |
| Metadata | No se guarda | Se guarda en metadata_json |
| Uso | Proyectos estándar | Proyectos especiales |

## 🐛 Troubleshooting

### Error: "El total del CSV no coincide"
- Verificar que la suma de todos los montos = monto de cotización
- Tolerancia: ±Q0.01 por redondeo

### Error: "La casa X no existe"
- Verificar que el id_casa corresponda a un usuario existente
- Consultar: `SELECT id, responsable FROM usuarios WHERE tipo_usuario IN ('PRE','ADM','OPE')`

### Error: "Casa X duplicada"
- Cada casa debe aparecer solo una vez en el CSV

### Modal no se abre
- Verificar que hay consenso (100% votos)
- Verificar que la cotización tiene valor > 0
- Verificar que el proyecto está en estado `en_votacion`

## 📚 Referencias

- [Commit inicial](https://github.com/jdsandovalg/val-app/commit/bd882d9) - feat(contribuciones): add custom contribution amounts
- [Documento de contexto](/CONTEXTO_COPILOT.md)
- [Plan de trabajo](/PLAN_DE_TRABAJO_PROFESIONAL.md)
