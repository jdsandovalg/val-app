#!/usr/bin/env python3
"""
Script para convertir CSV de contribuciones a sentencias UPDATE SQL
Uso: python generar_jsonb_contribuciones.py contribuciones_porton.csv <id_proyecto>
"""

import csv
import json
import sys

def csv_to_updates(csv_file, id_proyecto):
    """Convierte CSV a sentencias UPDATE SQL"""
    registros = []
    total = 0
    total_controles = 0
    controles_dist = {}
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            id_casa = int(row['id_casa'])
            monto = float(row['monto'])
            notas = row['notas']
            controles = int(row['controles'])
            
            registro = {
                "id_casa": id_casa,
                "monto": monto,
                "notas": notas,
                "controles": controles
            }
            
            registros.append(registro)
            total += monto
            total_controles += controles
            controles_dist[controles] = controles_dist.get(controles, 0) + 1
    
    print("=" * 80)
    print("DATOS EXTRAÍDOS DEL CSV")
    print("=" * 80)
    print(f"Total de registros: {len(registros)}")
    print(f"Suma de montos: Q{total:,.2f}")
    print(f"Total de controles: {total_controles}")
    print("\nDistribución de controles:")
    for num_controles, cantidad in sorted(controles_dist.items()):
        print(f"  {cantidad} casas con {num_controles} controles")
    
    print("\nCasas:")
    for r in registros:
        print(f"  Casa {r['id_casa']:2d}: Q{r['monto']:7.2f} ({r['controles']} controles)")
    
    print("\n" + "=" * 80)
    print("SENTENCIAS UPDATE SQL")
    print("=" * 80)
    print(f"-- Proyecto ID: {id_proyecto}")
    print(f"-- Total registros: {len(registros)}")
    print(f"-- Total esperado: Q{total:,.2f}")
    print()
    print("BEGIN;")
    print()
    
    for r in registros:
        metadata = {
            "controles": r['controles'],
            "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"
        }
        metadata_str = json.dumps(metadata, ensure_ascii=False)
        
        print(f"-- Casa {r['id_casa']} - {r['controles']} controles")
        print(f"UPDATE contribuciones_proyectos")
        print(f"SET")
        print(f"    monto_esperado = {r['monto']},")
        print(f"    metadata_json = '{metadata_str}'::jsonb,")
        print(f"    notas = '{r['notas']} - {r['controles']} controles remotos'")
        print(f"WHERE id_proyecto = {id_proyecto} AND id_casa = {r['id_casa']};")
        print()
    
    print("COMMIT;")
    print()
    
    print("-- Verificación")
    print(f"SELECT")
    print(f"    COUNT(*) as total_casas,")
    print(f"    SUM(monto_esperado) as total_esperado,")
    print(f"    SUM((metadata_json->>'controles')::int) as total_controles")
    print(f"FROM contribuciones_proyectos")
    print(f"WHERE id_proyecto = {id_proyecto};")
    print()
    print(f"-- Resultado esperado:")
    print(f"-- total_casas: {len(registros)}")
    print(f"-- total_esperado: {total:.2f}")
    print(f"-- total_controles: {total_controles}")
    
    # Guardar JSON a archivo para referencia
    output_file = csv_file.replace('.csv', '_updates.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"-- Actualización de contribuciones proyecto {id_proyecto}\n")
        f.write(f"-- Total: Q{total:,.2f}\n")
        f.write(f"-- Registros: {len(registros)}\n\n")
        f.write("BEGIN;\n\n")
        
        for r in registros:
            metadata = {
                "controles": r['controles'],
                "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"
            }
            metadata_str = json.dumps(metadata, ensure_ascii=False)
            
            f.write(f"-- Casa {r['id_casa']} - {r['controles']} controles\n")
            f.write(f"UPDATE contribuciones_proyectos\n")
            f.write(f"SET\n")
            f.write(f"    monto_esperado = {r['monto']},\n")
            f.write(f"    metadata_json = '{metadata_str}'::jsonb,\n")
            f.write(f"    notas = '{r['notas']} - {r['controles']} controles remotos'\n")
            f.write(f"WHERE id_proyecto = {id_proyecto} AND id_casa = {r['id_casa']};\n\n")
        
        f.write("COMMIT;\n")
    
    print(f"\n✅ SQL guardado en: {output_file}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Uso: python generar_jsonb_contribuciones.py <archivo.csv> <id_proyecto>")
        print("Ejemplo: python generar_jsonb_contribuciones.py contribuciones_porton.csv 4")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    id_proyecto = int(sys.argv[2])
    csv_to_updates(csv_file, id_proyecto)
