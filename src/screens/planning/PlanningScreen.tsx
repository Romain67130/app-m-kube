import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  format, addWeeks, subWeeks, startOfWeek, addDays, isToday,
  addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllCollaborateurs } from '../../storage/collaborateurs';
import { getAbsencesForPeriod } from '../../storage/absences';
import { getChantiersForCollaborateurViaInterventions, getInterventionForDay } from '../../storage/interventions';
import { Collaborateur, Chantier, Absence } from '../../types';
import { COLORS, STATUS_COLORS, ABSENCE_COLORS } from '../../constants/colors';

type ViewMode = 'week' | 'month' | '2months';

const { width: SCREEN_W } = Dimensions.get('window');
const LABEL_W = 72;
const ROW_H = 56;

const COL_W: Record<ViewMode, number> = {
  week: Math.max(70, (SCREEN_W - LABEL_W - 2) / 7),
  month: 34,
  '2months': 26,
};

const JOURS_COURT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function PlanningScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [chantiersByCollab, setChantiersByCollab] = useState<Map<string, Chantier[]>>(new Map());
  const [absences, setAbsences] = useState<Absence[]>([]);

  // Calcul des dates selon le mode
  const dates = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else if (viewMode === 'month') {
      return eachDayOfInterval({ start: startOfMonth(baseDate), end: endOfMonth(baseDate) });
    } else {
      return eachDayOfInterval({ start: startOfMonth(baseDate), end: endOfMonth(addMonths(baseDate, 1)) });
    }
  }, [viewMode, baseDate]);

  const debutStr = format(dates[0], 'yyyy-MM-dd');
  const finStr = format(dates[dates.length - 1], 'yyyy-MM-dd');

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
  }, [debutStr, finStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goNext = () => {
    if (viewMode === 'week') setBaseDate(d => addWeeks(d, 1));
    else if (viewMode === 'month') setBaseDate(d => addMonths(d, 1));
    else setBaseDate(d => addMonths(d, 2));
  };

  const goPrev = () => {
    if (viewMode === 'week') setBaseDate(d => subWeeks(d, 1));
    else if (viewMode === 'month') setBaseDate(d => subMonths(d, 1));
    else setBaseDate(d => subMonths(d, 2));
  };

  const periodLabel = () => {
    if (viewMode === 'week') {
      const lundi = startOfWeek(baseDate, { weekStartsOn: 1 });
      return `${format(lundi, 'dd MMM', { locale: fr })} — ${format(addDays(lundi, 6), 'dd MMM yyyy', { locale: fr })}`;
    } else if (viewMode === 'month') {
      return format(baseDate, 'MMMM yyyy', { locale: fr });
    } else {
      return `${format(startOfMonth(baseDate), 'MMM', { locale: fr })} — ${format(endOfMonth(addMonths(baseDate, 1)), 'MMM yyyy', { locale: fr })}`;
    }
  };

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
  const isST = (c: Collaborateur) => c.type === 'sous-traitant';
  const colW = COL_W[viewMode];
  const isCompact = viewMode !== 'week';

  // Groupes
  const internes = collaborateurs.filter((c) => (c.type ?? 'interne') === 'interne');
  const soustraitants = collaborateurs.filter((c) => c.type === 'sous-traitant');

  // Rendu d'une cellule
  const renderCell = (collab: Collaborateur, date: Date, idx: number) => {
    const dayOfWeek = date.getDay();
    const weekend = dayOfWeek === 0 || dayOfWeek === 6;
    const today = isToday(date);
    const absence = getAbsenceForDay(collab.id, date);
    const chantiers = weekend ? [] : getChantiersForDay(collab.id, date);
    const st = isST(collab);

    return (
      <View
        key={idx}
        style={[
          styles.cell,
          { width: colW, height: ROW_H },
          weekend && styles.weekendCell,
          today && styles.todayCell,
          st && !weekend && !today && styles.cellST,
        ]}
      >
        {isCompact ? (
          // Vue compacte : barre colorée
          absence ? (
            <View style={[styles.compactBar, { backgroundColor: ABSENCE_COLORS[absence.type] ?? COLORS.textSecondary }]} />
          ) : chantiers.length > 0 ? (
            <View style={styles.compactBars}>
              {chantiers.slice(0, 2).map((ch, ci) => (
                <View key={ci} style={[styles.compactBar, { backgroundColor: STATUS_COLORS[ch.statut] ?? COLORS.secondary, flex: 1 }]} />
              ))}
            </View>
          ) : null
        ) : (
          // Vue semaine : blocs avec texte
          absence ? (
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
          ) : null
        )}
      </View>
    );
  };

  // En-tête des jours
  const renderDayHeaders = () => {
    if (viewMode === 'week') {
      return dates.map((jour, i) => {
        const today = isToday(jour);
        const weekend = i >= 5;
        return (
          <View key={i} style={[styles.dayHeader, { width: colW }, weekend && styles.weekendHeader, today && styles.todayHeader]}>
            <Text style={[styles.dayName, today && styles.todayText]}>{JOURS_COURT[i]}</Text>
            <Text style={[styles.dayNum, today && styles.todayText]}>{format(jour, 'd')}</Text>
          </View>
        );
      });
    }

    // Compact : afficher numéro du jour + indicateurs de mois
    return dates.map((jour, i) => {
      const dayOfWeek = jour.getDay();
      const weekend = dayOfWeek === 0 || dayOfWeek === 6;
      const today = isToday(jour);
      const isFirst = jour.getDate() === 1;
      return (
        <View key={i} style={[styles.dayHeaderCompact, { width: colW }, weekend && styles.weekendHeader, today && styles.todayHeader]}>
          {isFirst && (
            <Text style={styles.monthMark}>{format(jour, 'MMM', { locale: fr })}</Text>
          )}
          <Text style={[styles.dayNumCompact, today && styles.todayText, weekend && styles.weekendText]}>
            {format(jour, 'd')}
          </Text>
        </View>
      );
    });
  };

  const renderCollabRow = (collab: Collaborateur) => (
    <View key={collab.id} style={[styles.row, isST(collab) && styles.rowST]}>
      <View style={[styles.labelCell, { width: LABEL_W }]}>
        <View style={[styles.avatarCircle, { backgroundColor: isST(collab) ? COLORS.soustraitantAccent : COLORS.primary }]}>
          <Text style={styles.collabInitiales}>{initiales(collab)}</Text>
        </View>
        <Text style={styles.collabPrenom} numberOfLines={1}>{collab.prenom}</Text>
      </View>
      {dates.map((jour, i) => renderCell(collab, jour, i))}
    </View>
  );

  const renderSeparator = (label: string, st: boolean) => (
    <View key={`sep-${label}`} style={[styles.groupSeparator, st && styles.groupSeparatorST]}>
      <Ionicons name={st ? 'business' : 'people'} size={12} color={st ? COLORS.soustraitantAccent : COLORS.primary} />
      <Text style={[styles.groupLabel, st && styles.groupLabelST]}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barre navigation + sélecteur de vue */}
      <View style={styles.topBar}>
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goPrev} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBaseDate(new Date())} style={styles.weekInfo}>
            <Text style={styles.weekLabel}>{periodLabel()}</Text>
            <Text style={styles.todayBtn}>Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Sélecteur de vue */}
        <View style={styles.viewSelector}>
          {(['week', 'month', '2months'] as ViewMode[]).map((mode) => {
            const labels: Record<ViewMode, string> = { week: 'Semaine', month: 'Mois', '2months': '2 mois' };
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.viewBtn, viewMode === mode && styles.viewBtnActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.viewBtnText, viewMode === mode && styles.viewBtnTextActive]}>
                  {labels[mode]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Grille */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* En-tête jours */}
          <View style={[styles.headerRow, { paddingLeft: LABEL_W }]}>
            {renderDayHeaders()}
          </View>

          {/* Lignes collaborateurs */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {internes.length > 0 && renderSeparator(`Équipe interne (${internes.length})`, false)}
            {internes.map((c) => renderCollabRow(c))}
            {soustraitants.length > 0 && renderSeparator(`Sous-traitants (${soustraitants.length})`, true)}
            {soustraitants.map((c) => renderCollabRow(c))}
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
          <Text style={styles.legendText}>ST</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Barre du haut
  topBar: { backgroundColor: COLORS.primary },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6,
  },
  navBtn: { padding: 8 },
  weekInfo: { alignItems: 'center', gap: 2, flex: 1 },
  weekLabel: { color: '#fff', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  todayBtn: { color: '#A8C8F0', fontSize: 11, fontWeight: '600' },

  // Sélecteur de vue
  viewSelector: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 10,
  },
  viewBtn: {
    flex: 1, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  viewBtnActive: { backgroundColor: '#fff' },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  viewBtnTextActive: { color: COLORS.primary },

  // En-tête jours
  headerRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dayHeader: {
    height: 44, justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  dayHeaderCompact: {
    height: 44, justifyContent: 'flex-end', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: COLORS.border, paddingBottom: 4,
  },
  weekendHeader: { backgroundColor: COLORS.weekendBg },
  todayHeader: { backgroundColor: COLORS.todayBg },
  dayName: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
  dayNum: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  dayNumCompact: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  weekendText: { color: COLORS.textSecondary },
  todayText: { color: COLORS.secondary },
  monthMark: {
    fontSize: 9, fontWeight: '800', color: COLORS.primary,
    textTransform: 'uppercase', position: 'absolute', top: 4,
  },

  // Label collaborateur
  labelCell: {
    justifyContent: 'center', alignItems: 'center', padding: 6,
    borderRightWidth: 1, borderRightColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatarCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  collabInitiales: { color: '#fff', fontSize: 11, fontWeight: '700' },
  collabPrenom: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },

  // Séparateurs de groupes
  groupSeparator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#EEF2FA',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  groupSeparatorST: { backgroundColor: COLORS.soustraitantBg },
  groupLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  groupLabelST: { color: COLORS.soustraitantAccent },

  // Lignes
  row: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rowST: { backgroundColor: COLORS.soustraitantPlanningBg },

  // Cellules
  cell: {
    borderRightWidth: 1, borderRightColor: COLORS.border,
    padding: 2, justifyContent: 'center',
  },
  weekendCell: { backgroundColor: COLORS.weekendBg },
  todayCell: { backgroundColor: COLORS.todayBg },
  cellST: { backgroundColor: '#FEF0E0' },

  // Semaine — blocs texte
  absenceBlock: { flex: 1, borderRadius: 3, padding: 3, justifyContent: 'center' },
  absenceText: { color: '#fff', fontSize: 8, fontWeight: '700', textAlign: 'center' },
  chantierStack: { flex: 1, gap: 2 },
  chantierBlock: { borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2 },
  chantierText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  moreText: { fontSize: 8, color: COLORS.textSecondary, textAlign: 'center' },

  // Compact — barres colorées
  compactBar: { flex: 1, borderRadius: 2, margin: 1 },
  compactBars: { flex: 1, gap: 1 },

  // Légende
  legend: {
    flexDirection: 'row', gap: 12, padding: 8, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border, justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
});
