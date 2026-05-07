import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Contribuciones, GrupoConDetalles } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 90,
    color: '#374151',
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 8,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  groupBadge: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  userList: {
    marginTop: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userIcon: {
    marginRight: 4,
    color: '#6b7280',
    fontSize: 9,
  },
  userId: {
    fontWeight: 'bold',
    color: '#374151',
    width: 45,
    fontSize: 9,
  },
  userName: {
    color: '#111827',
    fontSize: 9,
  },
});

interface GrupoContributionReportProps {
  contribucion: Contribuciones;
  grupos: GrupoConDetalles[];
  gruposConCargos: Set<string>;
}

export default function GrupoContributionReport({ 
  contribucion, 
  grupos, 
  gruposConCargos 
}: GrupoContributionReportProps) {
  return (
    <Document title={`Grupos_${contribucion.nombre}`}>
      <Page size="LETTER" style={styles.page}>
         {/* Encabezado */}
         <View style={styles.header}>
           <Text style={styles.title}>{contribucion.nombre || 'Sin nombre'}</Text>
           <Text style={styles.subtitle}>Reporte de Grupos • {new Date().toLocaleDateString()}</Text>
         </View>

         {/* Info contribución en tarjeta */}
         <View style={[styles.infoCard, { borderLeftColor: contribucion.color_del_borde || '#3B82F6' }]}>
           <Text style={styles.sectionTitle}>Información de la Contribución</Text>
           <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>Descripción:</Text>
             <Text style={styles.infoValue}>{contribucion.descripcion || 'N/A'}</Text>
           </View>
           <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>Tipo cargo:</Text>
             <Text style={styles.infoValue}>{contribucion.tipo_cargo || 'N/A'}</Text>
           </View>
           <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>Periodicidad:</Text>
             <Text style={styles.infoValue}>{contribucion.periodicidad_dias ? `${contribucion.periodicidad_dias} días` : 'N/A'}</Text>
           </View>
           <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>Día cargo:</Text>
             <Text style={styles.infoValue}>{contribucion.dia_cargo ? `Día ${contribucion.dia_cargo}` : 'N/A'}</Text>
           </View>
           {contribucion.comentarios_contribucion && (
             <View style={styles.infoRow}>
               <Text style={styles.infoLabel}>Comentarios:</Text>
               <Text style={styles.infoValue}>{contribucion.comentarios_contribucion}</Text>
             </View>
           )}
         </View>

        {/* Grupos */}
        <Text style={styles.sectionTitle}>Grupos Formados</Text>
        {grupos.map((grupo) => {
          const tieneCargos = gruposConCargos.has(`${grupo.id_contribucion}-${grupo.id_grupo}`);
          const borderColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
          const borderColor = tieneCargos ? '#DC2626' : borderColors[grupo.id_grupo % borderColors.length];
          return (
            <View key={grupo.id_grupo} style={[styles.groupCard, { borderLeftColor: borderColor }]}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>Grupo #{grupo.id_grupo}</Text>
                {tieneCargos && <Text style={styles.groupBadge}>Con pagos</Text>}
              </View>
              <View style={styles.userList}>
                {grupo.usuarios.map((usuario) => (
                  <View key={usuario.id} style={styles.userRow}>
                    <Text style={styles.userIcon}>•</Text>
                    <Text style={styles.userId}>Casa {usuario.id}</Text>
                    <Text style={styles.userName}>{usuario.responsable}</Text>
                  </View>
                ))}
                {grupo.usuarios.length === 0 && (
                  <Text style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 8 }}>Sin integrantes</Text>
                )}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
