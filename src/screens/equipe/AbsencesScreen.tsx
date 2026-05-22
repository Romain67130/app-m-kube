import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAbsencesForCollaborateur, deleteAbsence } from '../../storage/absences';
import { Absence } from '../../types';
import { COLORS, ABSENCE_COLORS } from '../../constants/colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { useMode } from '../../context/ModeContext';

export function AbsencesScreen({ route, navigation }: any) {
  const { collaborateur } = route.params;
  const { isAdmin } = useMode();
  const [absences, setAbsences] = useState<Absence[]>([]);

  const load = useCallback(async () => {
    const data = await getAbsencesForCollaborateur(collaborateur.id);
    setAbsences(data);
  }, [collaborateur.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Confirmer la suppression de cette absence ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => { await deleteAbsence(id); load(); },
      },
    ]);
  };

  const nbJours = (a: Absence) => {
    const ms = new Date(a.dateFin).getTime() - new Date(a.dateDebut).getTime();
    return Math.round(ms / 86400000) + 1;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={absences}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{collaborateur.prenom} {collaborateur.nom}</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AbsenceForm', { collaborateur })}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucune absence" subtitle="Appuyez sur + pour en saisir une" />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.colorBar, { backgroundColor: ABSENCE_COLORS[item.type] ?? COLORS.textSecondary }]} />
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Badge label={item.type} color={ABSENCE_COLORS[item.type] ?? COLORS.textSecondary} size="sm" />
                  <Text style={styles.jours}>{nbJours(item)} j</Text>
                </View>
                <Text style={styles.dates}>
                  {format(new Date(item.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                  {format(new Date(item.dateFin), 'dd MMM yyyy', { locale: fr })}
                </Text>
                {item.commentaire ? <Text style={styles.commentaire}>{item.commentaire}</Text> : null}
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorBar: { width: 4, height: 50, borderRadius: 2 },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jours: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  dates: { fontSize: 13, color: COLORS.text },
  commentaire: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  deleteBtn: { padding: 6 },
});
