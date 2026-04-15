import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wtczfdkldixaptrskjwb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3pmZGtsZGl4YXB0cnNrandiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk1NDIsImV4cCI6MjA3MjIzNTU0Mn0.paNwJUSuKaisbdMmK_J77LKTs4HpfKwgvv3cJz9pqI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'alcala'
  }
})

const TABLAS_ALCALA = [
  'contribuciones',
  'contribucionesporcasa',
  'proyectos',
  'proyecto_votos',
  'usuarios',
  'v_contribuciones_detalle',
  'v_usuarios_contribuciones',
  'contribuciones_proyectos',
  'empresas',
  'grupos',
  'grupos_mantenimiento',
  'liquidacion_de_gastos',
  'logs',
  'nits',
  'programa_mantenimiento',
  'proyecto_evidencias',
  'proyecto_rubros',
  'rubro_categorias',
  'rubros',
  'tipos_proyecto',
  'votos_proyectos'
]

async function testTabla(tabla) {
  console.log(`\n🔍 Probando tabla/vista: ${tabla}`)
  try {
    const { data, error, count } = await supabase
      .from(tabla)
      .select('*', { count: 'exact' })

    if (error) {
      console.log(`  ❌ ERROR: ${error.message}`)
      return { tabla, existe: false, error: error.message }
    }

    console.log(`  ✅ EXISTE - Registros: ${count || data?.length || 0}`)
    if (data && data.length > 0) {
      console.log(`  📋 columns: ${Object.keys(data[0]).join(', ')}`)
      if (data.length <= 5) {
        console.log(`  📝 Datos: ${JSON.stringify(data, null, 2)}`)
      } else {
        console.log(`  📝 Primeros registros: ${JSON.stringify(data.slice(0, 3), null, 2)}`)
      }
    }
    return { tabla, existe: true, count: count || data?.length || 0 }
  } catch (e) {
    console.log(`  ❌ EXCEPCIÓN: ${e.message}`)
    return { tabla, existe: false, error: e.message }
  }
}

async function testConexion() {
  console.log('\n=== 🧪 TEST CONEXIÓN SUPABASE ===')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Schema: alcala`)
  
  const { data, error } = await supabase.from('proyectos').select('*')
  
  if (error) {
    console.log(`\n❌ Error de conexión: ${error.message}`)
    return false
  }
  
  console.log(`✅ Conexión exitosa - Proyectos: ${data?.length || 0}\n`)
  return true
}

async function runTests() {
  console.log('\n========================================')
  console.log('   TEST DE TABLAS - VILLAS DE ALCALA')
  console.log('   Schema: alcala')
  console.log('========================================\n')

  const conexionOk = await testConexion()
  if (!conexionOk) {
    console.log('❌ No se puede continuar sin conexión')
    process.exit(1)
  }

  console.log('--- Tablas/Vistas del Sistema ---')
  const results = []
  for (const tabla of TABLAS_ALCALA) {
    const result = await testTabla(tabla)
    results.push(result)
  }

  const exitosos = results.filter(r => r.existe).length
  const fallidos = results.filter(r => !r.existe).length

  console.log('\n========================================')
  console.log('   RESUMEN')
  console.log('========================================')
  console.log(`✅ Exitosos: ${exitosos}/${TABLAS_ALCALA.length}`)
  console.log(`❌ Fallidos: ${fallidos}/${TABLAS_ALCALA.length}`)
  
  if (fallidos > 0) {
    console.log('\nTablas con error:')
    results.filter(r => !r.existe).forEach(r => {
      console.log(`  - ${r.tabla}: ${r.error}`)
    })
  }
}

runTests()
  .then(() => {
    console.log('\n✅ Tests completados')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Error en tests:', err)
    process.exit(1)
  })
