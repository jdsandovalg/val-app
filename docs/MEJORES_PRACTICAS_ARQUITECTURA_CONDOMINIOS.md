# 🏗️ MEJORES PRÁCTICAS: ARQUITECTURA DE SISTEMAS DE GESTIÓN DE CONDOMINIOS
## Manual de Trasplante Tecnológico - Stack Agnóstico

**Documento Maestro:** Principios, patrones y lecciones aprendidas del desarrollo de sistemas multi-tenant para administración de condominios, edificios y residenciales.

**Aplicable a:** Next.js/React, Flutter/Dart, o cualquier stack moderno

**Última actualización:** 18 de Noviembre de 2025

---

## 📋 ÍNDICE

1. [Principios Arquitectónicos Fundamentales](#1-principios-arquitectónicos-fundamentales)
2. [Arquitectura de Base de Datos](#2-arquitectura-de-base-de-datos)
3. [Seguridad y Control de Acceso](#3-seguridad-y-control-de-acceso)
4. [Internacionalización (i18n)](#4-internacionalización-i18n)
5. [Gestión de Estado y Datos](#5-gestión-de-estado-y-datos)
6. [UI/UX: Diseño Mobile-First](#6-uiux-diseño-mobile-first)
7. [Generación de Reportes PDF](#7-generación-de-reportes-pdf)
8. [Optimización de Rendimiento](#8-optimización-de-rendimiento)
9. [Metodología de Colaboración](#9-metodología-de-colaboración)
10. [Patrones de Código Probados](#10-patrones-de-código-probados)

---

## 1. PRINCIPIOS ARQUITECTÓNICOS FUNDAMENTALES

### 1.1 Fuente Única de Verdad (Single Source of Truth)

**Principio:** La base de datos PostgreSQL es la única fuente de verdad. Ninguna lógica de negocio crítica debe vivir solo en el cliente.

**Implementación:**
- ✅ Toda lógica de validación y reglas de negocio en funciones RPC/Stored Procedures
- ✅ Frontend solo valida UX (feedback inmediato), backend valida seguridad
- ✅ Enums y catálogos se leen dinámicamente de la BD, nunca hardcodeados
- ❌ Evitar "magic numbers" o listas estáticas en el código

**Ejemplo aplicado:**
```sql
-- ✅ CORRECTO: Catálogos dinámicos
CREATE TYPE tipo_evidencia_enum AS ENUM ('COTIZACION', 'FACTURA', 'CONTRATO');

CREATE FUNCTION get_enum_values(p_enum_name TEXT)
RETURNS TABLE(enum_value TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT enumlabel::text FROM pg_enum 
         WHERE enumtypid = %L::regtype ORDER BY enumsortorder',
        p_enum_name
    );
END;
$$ LANGUAGE plpgsql;
```

**Caso Flutter/Dart:**
```dart
// ✅ CORRECTO: Consumir enums desde API
Future<List<String>> getTiposEvidencia() async {
  final response = await supabase.rpc('get_enum_values', 
    params: {'p_enum_name': 'tipo_evidencia_enum'}
  );
  return List<String>.from(response);
}

// ❌ INCORRECTO: Hardcodear valores
final tiposEvidencia = ['COTIZACION', 'FACTURA']; // Se desincroniza
```

---

### 1.2 Arquitectura por Capas con Boundaries Claros

**Principio:** Separación estricta entre presentación, lógica de negocio y acceso a datos.

**Estructura recomendada (adaptable a cualquier stack):**

```
📁 Proyecto/
├── 📁 presentation/          # UI, widgets, páginas
│   ├── 📁 pages/            # Pantallas completas
│   ├── 📁 widgets/          # Componentes reutilizables
│   └── 📁 providers/        # Gestión de estado (Riverpod/Provider/Redux)
│
├── 📁 domain/               # Lógica de negocio pura
│   ├── 📁 entities/         # Modelos de dominio
│   ├── 📁 repositories/     # Interfaces (contratos)
│   └── 📁 use_cases/        # Casos de uso de negocio
│
├── 📁 data/                 # Implementación de acceso a datos
│   ├── 📁 models/           # DTOs (Data Transfer Objects)
│   ├── 📁 repositories/     # Implementaciones concretas
│   └── 📁 datasources/      # APIs, BD local, etc.
│
└── 📁 core/                 # Utilidades, constantes, config
    ├── 📁 i18n/             # Traducciones
    ├── 📁 utils/            # Helpers, formatters
    └── 📁 config/           # Configuración global
```

**Regla de Dependencia:**
- Presentation → Domain → Data
- Domain **NUNCA** depende de Presentation o Data
- Inyección de dependencias para desacoplar

---

## 2. ARQUITECTURA DE BASE DE DATOS

### 2.1 Funciones RPC: API de la Base de Datos

**Principio:** Toda interacción compleja con la BD debe pasar por funciones RPC (Remote Procedure Call).

**Ventajas comprobadas:**
1. **Seguridad:** Validaciones en el servidor
2. **Transaccionalidad:** ACID garantizado
3. **Performance:** Reduce round-trips cliente-servidor
4. **Mantenibilidad:** Lógica centralizada, no dispersa
5. **Testing:** Funciones SQL son testeables independientemente

**⚠️ LECCIÓN CRÍTICA: Separación de Responsabilidades**

**Principio:** Las RPC deben retornar datos, NO decidir qué mostrar en la UI.

```sql
-- ✅ CORRECTO: RPC flexible que retorna todos los datos
CREATE FUNCTION fn_gestionar_proyecto_evidencias(
    p_accion TEXT,
    p_id_proyecto BIGINT
)
RETURNS TABLE(...) AS $$
BEGIN
    IF p_accion = 'SELECT' THEN
        RETURN QUERY
        SELECT * FROM proyecto_evidencias
        WHERE id_proyecto = p_id_proyecto;  -- Solo filtro esencial
    END IF;
END;
$$;

-- ❌ INCORRECTO: RPC con lógica de presentación
CREATE FUNCTION fn_gestionar_proyecto_evidencias_para_votacion(...)
RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM proyecto_evidencias
    WHERE id_proyecto = p_id_proyecto
      AND tipo_evidencia = 'COTIZACION_PARA_VOTACION';  -- ❌ Lógica de UI en BD
END;
$$;
```

**Por qué esto es importante:**

1. **Reusabilidad:** Una función sirve para múltiples pantallas
2. **Flexibilidad:** Frontend decide qué datos mostrar según el contexto
3. **Performance:** Evitas múltiples llamadas a diferentes funciones
4. **Mantenibilidad:** Cambios en la UI no requieren cambios en BD

**Aplicación en Frontend:**

```typescript
// ✅ CORRECTO: Filtrar en el frontend
const { data: allEvidencias } = await supabase.rpc('fn_gestionar_proyecto_evidencias', {
  p_accion: 'SELECT',
  p_id_proyecto: projectId
});

// Diferentes vistas usan los mismos datos
const cotizacionesVotacion = allEvidencias.filter(e => e.tipo_evidencia === 'COTIZACION_PARA_VOTACION');
const facturas = allEvidencias.filter(e => e.tipo_evidencia === 'FACTURA');
const fotos = allEvidencias.filter(e => e.tipo_evidencia.startsWith('FOTOGRAFIA'));

// ❌ INCORRECTO: Múltiples llamadas a BD
const { data: cotizaciones } = await supabase.rpc('get_cotizaciones_votacion', {...});
const { data: facturas } = await supabase.rpc('get_facturas', {...});
const { data: fotos } = await supabase.rpc('get_fotos', {...});
```

**Caso real (Val-App):**

Función `fn_gestionar_proyecto_evidencias` retorna TODAS las evidencias de un proyecto. Los tipos disponibles:
- `COTIZACION`
- `FACTURA`
- `RECIBO`
- `TRANSFERENCIA`
- `RECOMENDACION`
- `FOTOGRAFIA_01`, `FOTOGRAFIA_02`, `FOTOGRAFIA_03`
- `COTIZACION_PARA_VOTACION`
- `CONTRATO`

**Ventaja:** Una sola llamada, múltiples vistas:
- Página de gestión: Muestra TODAS
- Página de votación: Filtra solo `COTIZACION_PARA_VOTACION`
- Reportes: Agrupa por tipo
- Dashboard: Cuenta por tipo

**Patrón de Diseño de RPC:**

```sql
-- ✅ Función RPC con Patrón de Acción
CREATE FUNCTION gestionar_proyectos(
    p_action TEXT,                    -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    p_id_proyecto BIGINT DEFAULT NULL,
    p_project_data JSONB DEFAULT NULL
)
RETURNS SETOF tipo_proyecto_detalle
LANGUAGE plpgsql
SECURITY DEFINER                      -- Ejecuta con permisos del propietario
SET search_path = public              -- Previene injection attacks
AS $$
BEGIN
    IF p_action = 'SELECT' THEN
        RETURN QUERY SELECT * FROM proyectos WHERE id_proyecto = p_id_proyecto;
    ELSIF p_action = 'INSERT' THEN
        -- Validaciones + INSERT + RETURNING
    ELSIF p_action = 'UPDATE' THEN
        -- Validaciones + UPDATE + RETURNING
    ELSIF p_action = 'DELETE' THEN
        -- Validaciones + DELETE
    END IF;
END;
$$;
```

**Caso Flutter/Dart:**
```dart
// Repository implementation
class ProyectoRepository {
  final SupabaseClient _supabase;

  Future<List<Proyecto>> getProyectos({int? idProyecto}) async {
    final response = await _supabase.rpc('gestionar_proyectos', params: {
      'p_action': 'SELECT',
      'p_id_proyecto': idProyecto,
    });
    return (response as List).map((e) => Proyecto.fromJson(e)).toList();
  }
}
```

---

### 2.2 Manejo de Ambigüedad en SQL (Lección Crítica)

**Problema identificado:** Errores `ERROR: 42702: column reference "..." is ambiguous` en funciones PL/pgSQL.

**Causa:** Nombres de parámetros coinciden con nombres de columnas.

**Solución (Regla de Oro):**

```sql
-- ❌ INCORRECTO: Ambigüedad
CREATE FUNCTION actualizar_proyecto(
    id_proyecto BIGINT,
    descripcion TEXT
) AS $$
BEGIN
    UPDATE proyectos
    SET descripcion = descripcion        -- ¿Cuál descripción?
    WHERE id_proyecto = id_proyecto;     -- ¿Cuál id_proyecto?
END;
$$;

-- ✅ CORRECTO: Prefijos y alias explícitos
CREATE FUNCTION actualizar_proyecto(
    p_id_proyecto BIGINT,                -- Prefijo 'p_'
    p_descripcion TEXT
) AS $$
BEGIN
    UPDATE proyectos p                   -- Alias 'p'
    SET p.descripcion = p_descripcion    -- Explícito
    WHERE p.id_proyecto = p_id_proyecto; -- Explícito
END;
$$;
```

**Aplicación universal:** Este problema existe en cualquier ORM/query builder. Usa prefijos consistentes (`p_`, `v_`, `in_`).

---

### 2.3 Normalización y Catálogos Maestros

**Principio:** Eliminar redundancia, centralizar definiciones.

**Antes (Deuda Técnica):**
```sql
-- ❌ Categoría hardcodeada en cada rubro
CREATE TABLE rubros (
    id_rubro SERIAL PRIMARY KEY,
    nombre_rubro TEXT,
    categoria TEXT  -- 'Materiales', 'Mano de Obra', etc. (duplicado)
);
```

**Después (Normalizado):**
```sql
-- ✅ Catálogo maestro
CREATE TABLE rubro_categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria TEXT UNIQUE NOT NULL
);

CREATE TABLE rubros (
    id_rubro SERIAL PRIMARY KEY,
    nombre_rubro TEXT,
    id_categoria INT REFERENCES rubro_categorias(id_categoria)
);
```

**Ventajas:**
- Integridad referencial
- Sin duplicados
- Cambios centralizados
- Dropdown automático en UI

---

## 3. SEGURIDAD Y CONTROL DE ACCESO

### 3.1 Sistema de Roles Basado en Tabla (No en Auth Provider)

**Principio:** La tabla `usuarios` es la fuente de verdad para roles y permisos, no el proveedor de autenticación (Firebase, Supabase Auth, etc.).

**Arquitectura:**
```sql
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY,              -- ID único (puede ser número de casa)
    email TEXT UNIQUE,
    clave TEXT NOT NULL,                -- Hash crypt()
    tipo_usuario TEXT NOT NULL,         -- 'ADM', 'PRE', 'OPE'
    responsable TEXT,
    id_casa BIGINT,
    activo BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
```

**Autenticación flexible:**
```sql
CREATE FUNCTION login_user(
    p_identifier TEXT,  -- Acepta ID de casa O email
    p_clave TEXT
)
RETURNS TABLE(
    id BIGINT,
    tipo_usuario TEXT,
    responsable TEXT,
    -- ... todos los campos necesarios
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.*
    FROM usuarios u
    WHERE (u.id::TEXT = p_identifier OR u.email = p_identifier)
      AND u.clave = crypt(p_clave, u.clave)
      AND u.activo = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Caso Flutter/Dart:**
```dart
class AuthService {
  Future<Usuario?> login({required String identifier, required String password}) async {
    final response = await _supabase.rpc('login_user', params: {
      'p_identifier': identifier,  // Puede ser '5' o 'user@email.com'
      'p_clave': password,
    });
    
    if (response.isEmpty) return null;
    
    final usuario = Usuario.fromJson(response[0]);
    await _storage.saveUser(usuario);  // Persistir en local
    return usuario;
  }
}
```

---

### 3.2 Control de Acceso Basado en Roles (RBAC)

**Implementación en UI:**

```dart
// ✅ Widget que respeta roles
class RestrictedButton extends StatelessWidget {
  final List<String> allowedRoles;
  final VoidCallback onPressed;
  final String label;

  const RestrictedButton({
    required this.allowedRoles,
    required this.onPressed,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final usuario = context.read<AuthProvider>().usuario;
    
    if (!allowedRoles.contains(usuario?.tipoUsuario)) {
      return SizedBox.shrink();  // No renderiza nada
    }
    
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

// Uso:
RestrictedButton(
  allowedRoles: ['ADM'],
  onPressed: () => _deleteProject(),
  label: 'Eliminar Proyecto',
)
```

**Validación en Backend (Doble Seguridad):**
```sql
CREATE FUNCTION eliminar_proyecto(
    p_id_proyecto BIGINT,
    p_id_usuario BIGINT  -- Siempre pasar ID del usuario actual
)
RETURNS VOID AS $$
DECLARE
    v_tipo_usuario TEXT;
BEGIN
    -- Validar rol
    SELECT tipo_usuario INTO v_tipo_usuario
    FROM usuarios WHERE id = p_id_usuario;
    
    IF v_tipo_usuario != 'ADM' THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    
    DELETE FROM proyectos WHERE id_proyecto = p_id_proyecto;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. INTERNACIONALIZACIÓN (i18n)

### 4.1 Arquitectura i18n Escalable

**Principio:** Soporte multi-idioma desde el día 1, no como afterthought.

**Estructura de archivos:**
```
📁 lib/core/i18n/
├── es.json        # Español
├── en.json        # Inglés
├── fr.json        # Francés
└── i18n_manager.dart
```

**Formato JSON (claves semánticas):**
```json
{
  "welcome": "Bienvenido",
  "login": {
    "title": "Iniciar Sesión",
    "identifierPlaceholder": "Casa # o Correo",
    "button": "Entrar",
    "error": {
      "credentials": "Credenciales inválidas",
      "generic": "Error al iniciar sesión"
    }
  },
  "navigation": {
    "calendar": "Calendario",
    "voting": "Votaciones",
    "groups": "Grupos"
  }
}
```

**Manager/Provider (patrón probado):**
```dart
class I18nManager extends ChangeNotifier {
  Locale _currentLocale = Locale('es');
  Map<String, dynamic> _translations = {};
  
  final Map<String, LocaleConfig> _locales = {
    'es': LocaleConfig(locale: 'es-GT', currency: 'GTQ'),
    'en': LocaleConfig(locale: 'en-US', currency: 'USD'),
    'fr': LocaleConfig(locale: 'fr-FR', currency: 'EUR'),
  };

  Future<void> setLocale(String lang) async {
    _currentLocale = Locale(lang);
    _translations = await _loadTranslations(lang);
    await _prefs.setString('language', lang);  // Persistir
    notifyListeners();
  }

  String t(String key, {Map<String, dynamic>? params}) {
    final keys = key.split('.');
    dynamic value = _translations;
    
    for (var k in keys) {
      value = value[k];
      if (value == null) return '⚠️ $key';
    }
    
    // Interpolación de parámetros
    if (params != null) {
      params.forEach((k, v) {
        value = value.replaceAll('{$k}', v.toString());
      });
    }
    
    return value.toString();
  }
  
  LocaleConfig get config => _locales[_currentLocale.languageCode]!;
}

// Uso en widgets:
Text(context.read<I18nManager>().t('login.title'))
```

---

### 4.2 Formateo Localizado (Fechas y Monedas)

**Principio:** Usar APIs nativas de formateo, nunca strings manuales.

**Implementación (adaptable):**

```dart
// Utility class
class FormatUtils {
  static String formatDate(DateTime? date, String locale) {
    if (date == null) return 'N/A';
    final formatter = DateFormat.yMd(locale);
    return formatter.format(date);
  }

  static String formatCurrency(double? amount, String locale, String currency) {
    if (amount == null) return 'N/A';
    final formatter = NumberFormat.currency(
      locale: locale,
      symbol: _getCurrencySymbol(currency),
    );
    return formatter.format(amount);
  }

  static String _getCurrencySymbol(String currency) {
    const symbols = {'GTQ': 'Q', 'USD': '\$', 'EUR': '€'};
    return symbols[currency] ?? currency;
  }
}

// En widgets:
Text(FormatUtils.formatCurrency(
  proyecto.monto,
  i18n.config.locale,
  i18n.config.currency,
))
```

**Ventaja:** Mismo monto se muestra diferente según idioma:
- Español (GT): `Q1,500.00`
- Inglés (US): `$1,500.00`
- Francés (FR): `1 500,00 €`

---

## 5. GESTIÓN DE ESTADO Y DATOS

### 5.1 Patrón Repository + Provider/Riverpod

**Arquitectura recomendada:**

```dart
// 1. Entity (Domain)
class Proyecto {
  final int id;
  final String descripcion;
  final double valorEstimado;
  final EstadoProyecto estado;
  
  Proyecto({required this.id, ...});
}

// 2. Repository Interface (Domain)
abstract class ProyectoRepository {
  Future<List<Proyecto>> getProyectos({int? idProyecto});
  Future<Proyecto> createProyecto(Proyecto proyecto);
  Future<void> updateProyecto(Proyecto proyecto);
  Future<void> deleteProyecto(int id);
}

// 3. Repository Implementation (Data)
class ProyectoRepositoryImpl implements ProyectoRepository {
  final SupabaseClient _supabase;
  
  ProyectoRepositoryImpl(this._supabase);

  @override
  Future<List<Proyecto>> getProyectos({int? idProyecto}) async {
    final response = await _supabase.rpc('gestionar_proyectos', params: {
      'p_action': 'SELECT',
      'p_id_proyecto': idProyecto,
    });
    return (response as List)
        .map((json) => Proyecto.fromJson(json))
        .toList();
  }
  
  // ... más implementaciones
}

// 4. Provider (Presentation - usando Riverpod)
final proyectoRepositoryProvider = Provider<ProyectoRepository>((ref) {
  final supabase = ref.read(supabaseProvider);
  return ProyectoRepositoryImpl(supabase);
});

final proyectosProvider = FutureProvider<List<Proyecto>>((ref) async {
  final repository = ref.read(proyectoRepositoryProvider);
  return repository.getProyectos();
});

// 5. Uso en UI
class ProyectosPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final proyectosAsync = ref.watch(proyectosProvider);
    
    return proyectosAsync.when(
      data: (proyectos) => ListView.builder(...),
      loading: () => CircularProgressIndicator(),
      error: (err, stack) => ErrorWidget(err),
    );
  }
}
```

**Ventajas:**
- Testeable (mock repository fácilmente)
- Desacoplado
- Caché automático (Riverpod)
- Reactividad

---

### 5.2 Actualizaciones Optimistas (Optimistic UI)

**Principio:** Actualizar UI inmediatamente, revertir si falla.

**Patrón implementado:**

```dart
class ProyectoController extends StateNotifier<AsyncValue<List<Proyecto>>> {
  final ProyectoRepository _repository;
  
  ProyectoController(this._repository) : super(AsyncValue.loading()) {
    _loadProyectos();
  }

  Future<void> deleteProyecto(int id) async {
    final proyectosActuales = state.value ?? [];
    
    // 1. Actualización optimista (inmediata en UI)
    state = AsyncValue.data(
      proyectosActuales.where((p) => p.id != id).toList(),
    );
    
    try {
      // 2. Operación en backend
      await _repository.deleteProyecto(id);
      // Éxito: UI ya está actualizada
    } catch (e) {
      // 3. Revertir si falla
      state = AsyncValue.data(proyectosActuales);
      rethrow;
    }
  }
}
```

**Resultado:** UI sin "parpadeos" o recargas, feedback instantáneo.

---

## 6. UI/UX: DISEÑO MOBILE-FIRST

### 6.1 Principio: Mobile-Only para Simplicidad

**Lección aprendida:** En condominios pequeños (~10-20 casas), optimizar para escritorio es innecesario.

**Decisión arquitectónica:**
- ❌ Eliminar vistas de tabla complejas
- ✅ Solo tarjetas (cards) responsivas
- ✅ Diseño vertical, scroll infinito
- ✅ Botones grandes, touch-friendly

**Implementación Flutter:**
```dart
// ✅ Vista unificada con tarjetas
class ProyectosList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: proyectos.length,
      itemBuilder: (context, index) => ProyectoCard(
        proyecto: proyectos[index],
      ),
    );
  }
}

class ProyectoCard extends StatelessWidget {
  final Proyecto proyecto;
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: _getEstadoColor(proyecto.estado),
          width: 3,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Título + Badge de estado
            Row(
              children: [
                Expanded(
                  child: Text(
                    proyecto.descripcion,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _EstadoBadge(estado: proyecto.estado),
              ],
            ),
            SizedBox(height: 12),
            // Información clave
            _InfoRow(
              icon: Icons.attach_money,
              label: FormatUtils.formatCurrency(proyecto.valor, ...),
            ),
            _InfoRow(
              icon: Icons.calendar_today,
              label: FormatUtils.formatDate(proyecto.fecha, ...),
            ),
            SizedBox(height: 12),
            // Botones de acción
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  icon: Icon(Icons.visibility),
                  label: Text(i18n.t('common.view')),
                  onPressed: () => _verDetalles(),
                ),
                if (usuario.isAdmin)
                  TextButton.icon(
                    icon: Icon(Icons.edit),
                    label: Text(i18n.t('common.edit')),
                    onPressed: () => _editar(),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 6.2 Sistema de Diseño Consistente

**Principio:** Paleta de colores y estilos unificados.

**Implementación (Theme):**
```dart
class AppTheme {
  static const colorPrimary = Color(0xFF2563EB);  // Azul
  static const colorSuccess = Color(0xFF10B981);  // Verde
  static const colorWarning = Color(0xFFF59E0B);  // Amarillo
  static const colorDanger = Color(0xFFEF4444);   // Rojo
  
  static ThemeData lightTheme = ThemeData(
    primaryColor: colorPrimary,
    scaffoldBackgroundColor: Color(0xFFF9FAFB),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: colorPrimary,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
  );
  
  // Estilos de estado (aplicados a bordes de tarjetas)
  static Color getEstadoColor(EstadoProyecto estado) {
    switch (estado) {
      case EstadoProyecto.abierto:
        return colorWarning;
      case EstadoProyecto.enProgreso:
        return colorPrimary;
      case EstadoProyecto.terminado:
        return colorSuccess;
      case EstadoProyecto.cancelado:
        return colorDanger;
    }
  }
}
```

**Aplicación en widget:**
```dart
Container(
  decoration: BoxDecoration(
    border: Border(
      left: BorderSide(
        color: AppTheme.getEstadoColor(proyecto.estado),
        width: 4,
      ),
    ),
  ),
  child: ...,
)
```

---

## 7. GENERACIÓN DE REPORTES PDF

### 7.1 Arquitectura para PDFs (Flutter: pdf package)

**Stack:**
- **Flutter:** `pdf` package (similar a @react-pdf/renderer)
- **Backend alternativo:** Puppeteer/Playwright para HTML→PDF

**Patrón implementado (Flutter):**

```dart
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class VotacionReportGenerator {
  final I18nManager i18n;
  final Uint8List? logoBytes;
  
  Future<Uint8List> generateReport({
    required Proyecto proyecto,
    required List<Cotizacion> cotizaciones,
    required List<Contribucion> contribuciones,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            pw.SizedBox(height: 20),
            _buildProjectInfo(proyecto),
            pw.SizedBox(height: 15),
            _buildVotacionSection(cotizaciones),
            pw.SizedBox(height: 15),
            _buildContribucionesSection(contribuciones),
            pw.SizedBox(height: 15),
            _buildCriteriosAprobacion(),
          ],
        ),
      ),
    );

    return pdf.save();
  }

  pw.Widget _buildHeader() {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        if (logoBytes != null)
          pw.Image(pw.MemoryImage(logoBytes!), width: 50, height: 50),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text(
              i18n.t('reports.voting.title'),
              style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
            ),
            pw.Text(
              FormatUtils.formatDate(DateTime.now(), i18n.config.locale),
              style: pw.TextStyle(fontSize: 9, color: PdfColors.grey),
            ),
          ],
        ),
      ],
    );
  }

  // ... más builders
}
```

---

### 7.2 Optimización de Espacio en PDFs (Lección Crítica)

**Problema:** Reportes desbordaban a 2+ páginas con letra pequeña.

**Solución (proceso iterativo probado):**

1. **Medir espacio disponible:**
   - A4: 595×842 puntos
   - Restar márgenes (30pt×4 lados) = 535×782pt útiles

2. **Reducir sistemáticamente:**
   - Paddings: 10→8→6→5pt
   - Margins: 20→15→10→5pt
   - Heights: 60→50→45pt
   - Line heights: 1.5→1.3→1.2

3. **Aumentar fuentes con espacio ganado:**
   - Títulos: 12→13pt (+8%)
   - Texto: 7→8pt (+14%)
   - Notas: 6→7pt (+17%)

4. **Redistribuir columnas:**
   - Identificar columnas anchas con poco contenido
   - Expandir columnas con texto largo
   - Ejemplo: Casa 10%→7%, Detalles 35%→52%

**Código (estilo ajustado):**
```dart
final compactStyle = pw.TextStyle(fontSize: 8);  // Era 10
final padding = pw.EdgeInsets.all(5);            // Era 10

pw.Container(
  padding: padding,
  margin: pw.EdgeInsets.only(bottom: 5),  // Era 10
  child: pw.Text('...', style: compactStyle),
)
```

**Resultado:** 170pt ahorrados → Todo en 1 página, letra más grande.

---

## 8. OPTIMIZACIÓN DE RENDIMIENTO

### 8.1 Caché Inteligente con Invalidación

**Patrón (Riverpod con autoDispose):**

```dart
// Caché que se mantiene mientras la página esté activa
final proyectosProvider = FutureProvider.autoDispose<List<Proyecto>>((ref) async {
  // Se invalida automáticamente cuando no hay listeners
  final repository = ref.read(proyectoRepositoryProvider);
  return repository.getProyectos();
});

// Invalidación manual cuando hay cambios
class ProyectoController {
  void createProyecto(Proyecto proyecto) async {
    await _repository.createProyecto(proyecto);
    ref.invalidate(proyectosProvider);  // Forzar recarga
  }
}
```

---

### 8.2 Paginación y Lazy Loading

**Implementación (listas grandes):**

```dart
class ProyectosListView extends StatefulWidget {
  @override
  _ProyectosListViewState createState() => _ProyectosListViewState();
}

class _ProyectosListViewState extends State<ProyectosListView> {
  final _scrollController = ScrollController();
  int _page = 1;
  List<Proyecto> _proyectos = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadMore();
  }

  void _onScroll() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      _loadMore();
    }
  }

  Future<void> _loadMore() async {
    if (_loading) return;
    setState(() => _loading = true);
    
    final nuevos = await _repository.getProyectos(page: _page, limit: 20);
    setState(() {
      _proyectos.addAll(nuevos);
      _page++;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: _proyectos.length + 1,
      itemBuilder: (context, index) {
        if (index == _proyectos.length) {
          return _loading ? CircularProgressIndicator() : SizedBox.shrink();
        }
        return ProyectoCard(proyecto: _proyectos[index]);
      },
    );
  }
}
```

---

## 9. METODOLOGÍA DE COLABORACIÓN

### 9.1 Regla de Oro: Plan → Aprobación → Implementación

**Proceso obligatorio para cambios complejos:**

1. **Diagnóstico:** Identificar problema claramente
2. **Propuesta:** Diseñar solución con alternativas
3. **Plan detallado:** Desglosar en pasos concretos
4. **Aprobación explícita:** Desarrollador revisa y confirma
5. **Implementación:** Ejecutar paso por paso
6. **Validación:** Testing y ajustes

**Ejemplo de Plan (formato markdown):**

```markdown
## Plan: Sistema de Votaciones

### Objetivo
Permitir que residentes voten cotizaciones con restricción de 1 voto/casa.

### Pasos
1. **Backend - Estructura de Datos:**
   - [ ] Crear tabla `proyecto_votos`
   - [ ] Agregar UNIQUE CONSTRAINT (id_proyecto, id_usuario)
   - [ ] Crear función RPC `fn_gestionar_votos`

2. **Backend - Lógica de Negocio:**
   - [ ] Implementar validación de permisos
   - [ ] Manejar voto duplicado gracefully

3. **Frontend - UI:**
   - [ ] Página `/menu/voting`
   - [ ] Selector de casas con indicador visual
   - [ ] Lista de cotizaciones con botones dinámicos
   
4. **Testing:**
   - [ ] Caso: Usuario vota correctamente
   - [ ] Caso: Usuario anula y revota
   - [ ] Caso: Admin vota por proxy
```

---

### 9.2 Documentación Viva (No Comentarios Muertos)

**Principio:** Código autodocumentado + Documentos externos actualizados.

**✅ HACER:**
- Nombres descriptivos de variables/funciones
- Archivos README en carpetas clave
- Documentos de arquitectura (como este)
- Historias de usuario

**❌ NO HACER:**
- Comentarios que repiten el código
- TODOs sin fecha ni responsable
- Documentación desactualizada

**Ejemplo:**
```dart
// ❌ MAL: Comentario redundante
// Obtiene los proyectos de la base de datos
Future<List<Proyecto>> getProyectos() async {
  return await _repository.getProyectos();
}

// ✅ BIEN: Nombre claro, sin comentario necesario
Future<List<Proyecto>> fetchActiveProjectsForCurrentUser() async {
  final userId = _auth.currentUser.id;
  return await _repository.getProyectos(
    filters: {'estado': 'activo', 'userId': userId},
  );
}
```

---

## 10. PATRONES DE CÓDIGO PROBADOS

### 10.1 Gestión de Errores Consistente

**Patrón (Result/Either):**

```dart
// Domain - Result class
class Result<T> {
  final T? data;
  final String? error;
  
  Result.success(this.data) : error = null;
  Result.failure(this.error) : data = null;
  
  bool get isSuccess => error == null;
  bool get isFailure => error != null;
}

// Repository
Future<Result<Proyecto>> createProyecto(Proyecto proyecto) async {
  try {
    final response = await _supabase.rpc('gestionar_proyectos', params: {...});
    return Result.success(Proyecto.fromJson(response[0]));
  } on PostgrestException catch (e) {
    return Result.failure('Error BD: ${e.message}');
  } catch (e) {
    return Result.failure('Error inesperado: $e');
  }
}

// UI
final result = await _repository.createProyecto(proyecto);
if (result.isSuccess) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Proyecto creado exitosamente')),
  );
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(result.error!), backgroundColor: Colors.red),
  );
}
```

---

### 10.2 Validación de Formularios

**Patrón (Validator class):**

```dart
class FormValidators {
  static String? required(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName es requerido';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) return null;
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Email inválido';
    }
    return null;
  }

  static String? minLength(String? value, int min, String fieldName) {
    if (value == null || value.length < min) {
      return '$fieldName debe tener al menos $min caracteres';
    }
    return null;
  }

  static String? numeric(String? value, String fieldName) {
    if (value == null || value.isEmpty) return null;
    if (double.tryParse(value) == null) {
      return '$fieldName debe ser numérico';
    }
    return null;
  }
}

// Uso en Form
TextFormField(
  decoration: InputDecoration(labelText: 'Email'),
  validator: (value) => FormValidators.email(value),
)
```

---

## 11. CHECKLIST DE IMPLEMENTACIÓN EN NUEVO PROYECTO

### Fase 1: Setup Inicial
- [ ] Configurar estructura de carpetas (presentation/domain/data/core)
- [ ] Setup de base de datos (PostgreSQL + Supabase/Firebase)
- [ ] Crear tabla `usuarios` con sistema de roles
- [ ] Implementar función `login_user` con autenticación flexible
- [ ] Setup de i18n (archivos es.json, en.json, manager)
- [ ] Configurar theme/diseño consistente

### Fase 2: Arquitectura Base
- [ ] Implementar patrón Repository
- [ ] Setup de gestión de estado (Provider/Riverpod/Bloc)
- [ ] Crear utilities (formatters, validators)
- [ ] Implementar Result/Either para manejo de errores
- [ ] Setup de navegación con guards de autenticación

### Fase 3: Features Core
- [ ] Login/Logout
- [ ] Dashboard principal
- [ ] Gestión de perfil de usuario
- [ ] Sistema de roles y permisos
- [ ] Selector de idioma persistente

### Fase 4: Features de Negocio
- [ ] Catálogos maestros (tipos, categorías)
- [ ] Gestión de proyectos
- [ ] Sistema de evidencias/documentos
- [ ] Reportes PDF
- [ ] Calendario de contribuciones
- [ ] Sistema de votaciones

### Fase 5: Optimización
- [ ] Implementar caché inteligente
- [ ] Paginación en listas grandes
- [ ] Optimistic UI en acciones críticas
- [ ] Compresión de imágenes
- [ ] Lazy loading de módulos

### Fase 6: Testing y QA
- [ ] Unit tests (repositories, utilities)
- [ ] Widget tests (componentes clave)
- [ ] Integration tests (flujos completos)
- [ ] Testing multi-idioma
- [ ] Testing multi-tenant

---

## 12. ANTI-PATRONES IDENTIFICADOS (EVITAR)

### ❌ 1. Hardcodear Valores de Catálogos
```dart
// MAL
final estados = ['abierto', 'en_progreso', 'terminado'];

// BIEN
final estados = await _repository.getEstadosProyecto();
```

### ❌ 2. Lógica de Negocio en UI
```dart
// MAL
onPressed: () {
  if (proyecto.monto > 5000 && usuario.tipo == 'ADM' && proyecto.estado == 'abierto') {
    // aprobar...
  }
}

// BIEN
onPressed: () async {
  final result = await _proyectoController.aprobarProyecto(proyecto.id);
  // La validación está en el controller/repository
}
```

### ❌ 3. Múltiples Round-Trips en Cascada
```dart
// MAL
final proyecto = await getProyecto(id);
final gastos = await getGastos(id);
final evidencias = await getEvidencias(id);
// 3 llamadas secuenciales

// BIEN
final reporte = await getReporteCompleto(id);  // 1 RPC que hace JOIN
```

### ❌ 4. No Manejar Estados de Carga/Error
```dart
// MAL
FutureBuilder(
  future: _loadData(),
  builder: (context, snapshot) {
    return ListView(children: snapshot.data!);  // ¡Crash si es null!
  },
)

// BIEN
FutureBuilder(
  future: _loadData(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return CircularProgressIndicator();
    }
    if (snapshot.hasError) {
      return ErrorWidget(snapshot.error!);
    }
    return ListView(children: snapshot.data ?? []);
  },
)
```

### ❌ 5. Ignorar Localización
```dart
// MAL
Text('Total: \$${monto.toStringAsFixed(2)}')

// BIEN
Text('${i18n.t("common.total")}: ${FormatUtils.formatCurrency(monto, locale, currency)}')
```

---

## 13. RECURSOS Y REFERENCIAS

### Librerías Recomendadas (Flutter/Dart)

**Core:**
- `riverpod` / `provider` - Gestión de estado
- `flutter_riverpod` - Integración con widgets
- `go_router` - Navegación declarativa

**Backend:**
- `supabase_flutter` - Cliente Supabase
- `dio` - Cliente HTTP avanzado

**UI:**
- `flutter_svg` - Íconos vectoriales
- `cached_network_image` - Imágenes con caché
- `shimmer` - Loading placeholders

**Utilidades:**
- `intl` - Formateo i18n
- `shared_preferences` - Persistencia local
- `path_provider` - Rutas del sistema

**PDF:**
- `pdf` - Generación de PDFs
- `printing` - Preview y print

**Testing:**
- `mockito` - Mocks
- `integration_test` - Tests E2E

---

## 14. CONCLUSIÓN Y PRÓXIMOS PASOS

Este documento captura las **mejores prácticas probadas** en un sistema real de gestión de condominios desarrollado con Next.js/React/Supabase. Los principios son **universalmente aplicables** a Flutter/Dart o cualquier stack moderno.

### Al implementar en Flutter:

1. **Lee este documento completo primero**
2. **Haz inventario del código existente**
3. **Identifica gaps entre lo actual y las best practices**
4. **Crea un plan de refactorización incremental**
5. **Prioriza cambios de arquitectura antes que features**

### Prioridades al iniciar:

1. 🔴 **Crítico:** Arquitectura de carpetas + Repository pattern
2. 🟠 **Alto:** Sistema de roles + RPC functions
3. 🟡 **Medio:** i18n completo + Theme consistente
4. 🟢 **Bajo:** Optimizaciones de rendimiento

### Mantén este documento actualizado:

- Agrega nuevos patrones que descubras
- Documenta soluciones a problemas específicos de Flutter
- Actualiza con lecciones aprendidas

---

**Autor:** Equipo val-app  
**Stack Original:** Next.js 15 + React 19 + Supabase + PostgreSQL  
**Aplicable a:** Flutter/Dart + Supabase + PostgreSQL (multi-tenant)  
**Versión:** 1.0 (18 Nov 2025)

