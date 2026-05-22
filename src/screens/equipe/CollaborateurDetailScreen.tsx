import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAbsencesForCollaborateur } from '../../storage/absences';
import { getChantiersForCollaborateur } from '../../storage/chantiers';
import { Absence, Chantier } from '../../types';
import { COLORS, ABSENCE_COLORS, STATUS_COLORS } from '../../constants/colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CollaborateurDetailScreen({ route, navigation }: any) {
  const { collaborateur } = route.params;
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);

  useFocusEffect(useCallback(() => {
    const now = new Date();
    const debut = format(subMonths(now, 3), 'yyyy-MM-dd');
    const fin = format(now, 'yyyy-MM-dd');
    getAbsencesForCollaborateur(collaborateur.id).then(setAbsences);
    getChantiersForCollaborateur(collaborateur.id, debut, fin).then(setChantiers);
  }, [collaborateur.id]));

  const initiales = `${collaborateur.prenom[0]}${collaborateur.nom[0]}`.toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiales}</Text>
        </View>
        <Text style={styles.nom}>{collaborateur.prenom} {collaborateur.nom}</Text>
        <Text style={styles.role}>{collaborateur.role}</Text>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.qBtn} onPress={() => navigation.navigate('Horaires', { collaborateur })}>
          <Ionicons name="time" size={24} color={COLORS.secondary} />
          <Text style={styles.qLabel}>Horaires</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qBtn} onPress={() => navigation.navigate('Absences', { collaborateur })}>
          <Ionicons name="calendar" size={24} color={COLORS.secondary} />
          <Text style={styles.qLabel}>Absences</Text>
        </TouchableOpacity>
      </View>

      {/* Chantiers en cours */}
      <Text style={styles.sectionTitle}>Chantiers récents</Text>
      {chantiers.length === 0 ? (
        <Text style={styles.empty}>Aucun chantier récent</Text>
      ) : (
        chantiers.map((ch) => (
          <Card key={ch.id} style={styles.chantierCard}>
            <View style={styles.chantierRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chantierNom}>{ch.nom}</Text>
                <Text style={styles.chantierClient}>{ch.client}</Text>
              </View>
              <Badge label={ch.statut} color={STATUS_COLORS[ch.statut] ?? COLORS.secondary} size="sm" />
            </View>
          </Card>
        ))
      )}

      {/* Absences récentes */}
      <Text style={styles.sectionTitle}>Absences récentes</Text>
      {absences.length === 0 ? (
        <Text style={styles.empty}>Aucune absence enregistrée</Text>
      ) : (
        absences.slice(0, 5).map((a) => (
          <Card key={a.id} style={styles.absCard}>
            <View style={styles.absRow}>
              <View style={[styles.absColor, { backgroundColor: ABSENCE_COLORS[a.type] ?? COLORS.textSecondary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.absType}>{a.type}</Text>
                <Text style={styles.absDates}>
                  {format(new Date(a.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                  {format(new Date(a.dateFin), 'dd MMM yyyy', { locale: fr })}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nom: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  qBtn: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  qLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10, marginTop: 8 },
  empty: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  chantierCard: { marginBottom: 8 },
  chantierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chantierNom: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chantierClient: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  absCard: { marginBottom: 8 },
  absRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  absColor: { width: 4, height: 40, borderRadius: 2 },
  absType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  absDates: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
