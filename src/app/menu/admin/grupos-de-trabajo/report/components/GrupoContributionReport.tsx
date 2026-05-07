import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Contribuciones, GrupoConDetalles } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    lineHeight: 1.3,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 90,
    color: '#374151',
    fontSize: 8,
  },
  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    paddingLeft: 6,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  groupTitle: {
    fontSize: 11,
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
    marginBottom: 1,
  },
  userIcon: {
    marginRight: 4,
    color: '#6b7280',
    fontSize: 7,
  },
  userId: {
    fontWeight: 'bold',
    color: '#374151',
    width: 45,
    fontSize: 8,
  },
  userName: {
    color: '#111827',
    fontSize: 8,
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
            <Text style={styles.infoLabel}>Config:</Text>
            <Text style={styles.infoValue}>
              {contribucion.tipo_cargo || 'N/A'} • {contribucion.periodicidad_dias ? `${contribucion.periodicidad_dias} días` : 'N/A'} • Día {contribucion.dia_cargo || 'N/A'}
            </Text>
          </View>
          {contribucion.comentarios_contribucion && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notas:</Text>
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
