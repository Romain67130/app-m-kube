import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  format, addWeeks, subWeeks, startOfWeek, addDays, isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllCollaborateurs } from '../../storage/collaborateurs';
import { getAbsencesForPeriod } from '../../storage/absences';
import { getChantiersForCollaborateurViaInterventions, getInterventionForDay } from '../../storage/interventions';
import { Collaborateur, Chantier, Absence } from '../../types';
import { COLORS, STATUS_COLORS, ABSENCE_COLORS } from '../../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_W = Math.max(80, (SCREEN_W - 90) / 5);
const ROW_H = 64;
const LABEL_W = 90;

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function PlanningScreen() {
  const [weekDate, setWeekDate] = useState(new Date());
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [chantiersByCollab, setChantiersByCollab] = useState<Map<string, Chantier[]>>(new Map());
  const [absences, setAbsences] = useState<Absence[]>([]);

  const lundi = startOfWeek(weekDate, { weekStartsOn: 1 });
  const jours = Array.from({ length: 7 }, (_, i) => addDays(lundi, i));
  const debutStr = format(lundi, 'yyyy-MM-dd');
  const finStr = format(addDays(lundi, 6), 'yyyy-MM-dd');

  const load = useCallback(async () => {
    const collabs = await getAllCollaborateurs();
    setCollaborateurs(collabs);
    const abs = await getAbsencesForPeriod(debutStr, finStr);
    setAbsences(abs);
    const map = new Map<string, Chantier[]>();
    await Promise.all(
      collabs.map(async (c) => {
        const ch = await getChantiersForCollaborateurViaInterventions(c.id, debutStr, finStr);
        map.set(c.id, ch);
      })
    );
    setChantiersByCollab(new Map(map));
  }, [weekDate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const getAbsenceForDay = (collabId: string, date: Date): Absence | undefined =>
    absences.find((a) => {
      const d = format(date, 'yyyy-MM-dd');
      return a.collaborateurId === collabId && a.dateDebut <= d && a.dateFin >= d;
    });

  const getChantiersForDay = (collabId: string, date: Date): Chantier[] => {
    const d = format(date, 'yyyy-MM-dd');
    return (chantiersByCollab.get(collabId) ?? []).filter(
      (ch) => getInterventionForDay(collabId, ch.id, d) !== undefined
    );
  };

  const initiales = (c: Collaborateur) => `${c.prenom[0]}${c.nom[0]}`.toUpperCase();

  const internes = collaborateurs.filter((c) => (c.type ?? 'interne') === 'interne');
  const soustraitants = collaborateurs.filter((c) => c.type === 'sous-traitant');

  const renderCollabRow = (collab: Collaborateur, isST: boolean) => (
    <View key={collab.id} style={[styles.row, isST && styles.rowST]}>
      <View style={[styles.labelCell, { width: LABEL_W }]}>
        <View style={[styles.avatarCircle, { backgroundColor: isST ? COLORS.soustraitantAccent : COLORS.primary }]}>
          <Text style={styles.collabInitiales}>{initiales(collab)}</Text>
        </View>
        <Text style={styles.collabPrenom} numberOfLines={1}>{collab.prenom}</Text>
      </View>
      {jours.map((jour, i) => {
        const weekend = i >= 5;
        const today = isToday(jour);
        const absence = getAbsenceForDay(collab.id, jour);
        const chantiers = weekend ? [] : getChantiersForDay(collab.id, jour);
        return (
          <View
            key={i}
            style={[
              styles.cell,
              { width: COL_W, height: ROW_H },
              weekend && styles.weekendCell,
              today && styles.todayCell,
              isST && !weekend && !today && styles.cellST,
            ]}
          >
            {absence ? (
              <View style={[styles.absenceBlock, { backgroundColor: ABSENCE_COLORS[absence.type] ?? COLORS.textSecondary }]}>
                <Text style={styles.absenceText} numberOfLines={2}>{absence.type}</Text>
              </View>
            ) : chantiers.length > 0 ? (
              <View style={styles.chantierStack}>
                {chantiers.slice(0, 2).map((ch, ci) => (
                  <View key={ci} style={[styles.chantierBlock, { backgroundColor: STATUS_COLORS[ch.statut] ?? COLORS.secondary }]}>
                    <Text style={styles.chantierText} numberOfLines={1}>{ch.nom}</Text>
                  </View>
                ))}
                {chantiers.length > 2 && <Text style={styles.moreText}>+{chantiers.length - 2}</Text>}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  const renderSeparator = (label: string, isST: boolean) => (
    <View key={`sep-${label}`} style={[styles.groupSeparator, isST && styles.groupSeparatorST]}>
      <Ionicons
        name={isST ? 'business' : 'people'}
        size={13}
        color={isST ? COLORS.soustraitantAccent : COLORS.primary}
      />
      <Text style={[styles.groupLabel, isST && styles.groupLabelST]}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Navigation semaine */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekDate(subWeeks(weekDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.surface} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>
            {format(lundi, 'dd MMM', { locale: fr })} — {format(addDays(lundi, 4), 'dd MMM yyyy', { locale: fr })}
          </Text>
          <TouchableOpacity onPress={() => setWeekDate(new Date())}>
            <Text style={styles.todayBtn}>Aujourd'hui</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setWeekDate(addWeeks(weekDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* En-tête jours */}
          <View style={styles.headerRow}>
            <View style={[styles.labelCell, { width: LABEL_W }]} />
            {jours.map((jour, i) => {
              const today = isToday(jour);
              const weekend = i >= 5;
              return (
                <View key={i} style={[styles.dayHeader, { width: COL_W }, weekend && styles.weekendHeader, today && styles.todayHeader]}>
                  <Text style={[styles.dayName, today && styles.todayText]}>{JOURS_COURT[i]}</Text>
                  <Text style={[styles.dayNum, today && styles.todayText]}>{format(jour, 'd')}</Text>
                </View>
              );
            })}
          </View>

          {/* Grille */}
          <ScrollView>
            {/* Équipe interne */}
            {internes.length > 0 && renderSeparator(`Équipe interne (${internes.length})`, false)}
            {internes.map((c) => renderCollabRow(c, false))}

            {/* Sous-traitants */}
            {soustraitants.length > 0 && renderSeparator(`Sous-traitants (${soustraitants.length})`, true)}
            {soustraitants.map((c) => renderCollabRow(c, true))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS['En cours'] }]} />
          <Text style={styles.legendText}>En cours</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS['Planifié'] }]} />
          <Text style={styles.legendText}>Planifié</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.absenceCP }]} />
          <Text style={styles.legendText}>Absence</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.soustraitantAccent }]} />
          <Text style={styles.legendText}>Sous-traitant</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 12,
  },
  navBtn: { padding: 8 },
  weekInfo: { alignItems: 'center', gap: 4 },
  weekLabel: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  todayBtn: { color: '#A8C8F0', fontSize: 12, fontWeight: '600' },
  headerRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  labelCell: {
    justifyContent: 'center', alignItems: 'center', padding: 8,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  collabInitiales: { color: '#fff', fontSize: 12, fontWeight: '700' },
  collabPrenom: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  dayHeader: {
    height: 48, justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  weekendHeader: { backgroundColor: COLORS.weekendBg },
  todayHeader: { backgroundColor: COLORS.todayBg },
  dayName: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  dayNum: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  todayText: { color: COLORS.secondary },
  groupSeparator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#EEF2FA',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    minWidth: LABEL_W + COL_W * 7,
  },
  groupSeparatorST: { backgroundColor: COLORS.soustraitantBg },
  groupLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  groupLabelST: { color: COLORS.soustraitantAccent },
  row: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rowST: { backgroundColor: COLORS.soustraitantPlanningBg },
  cell: {
    borderRightWidth: 1, borderRightColor: COLORS.border,
    padding: 3, justifyContent: 'center',
  },
  cellST: { backgroundColor: '#FEF0E0' },
  weekendCell: { backgroundColor: COLORS.weekendBg },
  todayCell: { backgroundColor: COLORS.todayBg },
  absenceBlock: { flex: 1, borderRadius: 4, padding: 3, justifyContent: 'center' },
  absenceText: { color: '#fff', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  chantierStack: { flex: 1, gap: 2 },
  chantierBlock: { borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2 },
  chantierText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  moreText: { fontSize: 9, color: COLORS.textSecondary, textAlign: 'center' },
  legend: {
    flexDirection: 'row', gap: 12, padding: 10, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border, justifyContent: 'center', flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
});
