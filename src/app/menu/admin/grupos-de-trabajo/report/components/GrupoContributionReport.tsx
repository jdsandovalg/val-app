import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Contribuciones, GrupoConDetalles } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 110,
    color: '#374151',
    fontSize: 11,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 18,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingLeft: 10,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  groupBadge: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userList: {
    marginTop: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userIcon: {
    marginRight: 6,
    color: '#6b7280',
    fontSize: 10,
  },
  userId: {
    fontWeight: 'bold',
    color: '#374151',
    width: 55,
    fontSize: 11,
  },
  userName: {
    color: '#111827',
    fontSize: 11,
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

        {/* Info contribución */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descripción:</Text>
            <Text style={styles.infoValue}>{contribucion.descripcion || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de cargo:</Text>
            <Text style={styles.infoValue}>{contribucion.tipo_cargo || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Periodicidad:</Text>
            <Text style={styles.infoValue}>{contribucion.periodicidad_dias ? `${contribucion.periodicidad_dias} días` : 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Día de cargo:</Text>
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
