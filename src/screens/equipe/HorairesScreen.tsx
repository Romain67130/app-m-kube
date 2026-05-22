import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getHorairesForWeek, saveHoraire, calcHeuresTravaillees, calcTotalSemaine } from '../../storage/horaires';
import { Horaire } from '../../types';
import { COLORS } from '../../constants/colors';
import { WEEK_HOURS_TARGET } from '../../constants/config';
import { Card } from '../../components/Card';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

export function HorairesScreen({ route }: any) {
  const { collaborateur } = route.params;
  const [weekDate, setWeekDate] = useState(new Date());
  const [horaires, setHoraires] = useState<Map<string, Horaire>>(new Map());
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState({ heureDebut: '', heureFin: '', pauseMinutes: '' });

  const lundi = startOfWeek(weekDate, { weekStartsOn: 1 });

  const load = useCallback(async () => {
    const data = await getHorairesForWeek(collaborateur.id, weekDate);
    const map = new Map(data.map((h) => [h.date, h]));
    setHoraires(map);
  }, [collaborateur.id, weekDate]);

  React.useEffect(() => { load(); }, [load]);

  const totalH = calcTotalSemaine(Array.from(horaires.values()));
  const overThreshold = totalH > WEEK_HOURS_TARGET + 5;
  const underThreshold = totalH < WEEK_HOURS_TARGET - 2 && totalH > 0;

  const startEdit = (date: string) => {
    const h = horaires.get(date);
    setEditData({
      heureDebut: h?.heureDebut ?? '07:30',
      heureFin: h?.heureFin ?? '17:00',
      pauseMinutes: String(h?.pauseMinutes ?? 45),
    });
    setEditing(date);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await saveHoraire({
      collaborateurId: collaborateur.id,
      date: editing,
      heureDebut: editData.heureDebut,
      heureFin: editData.heureFin,
      pauseMinutes: Number(editData.pauseMinutes),
      notes: '',
    });
    setEditing(null);
    await load();
  };

  const totalColor = overThreshold ? COLORS.danger : underThreshold ? COLORS.warning : COLORS.success;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navigation semaine */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekDate(subWeeks(weekDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          Sem. {format(lundi, 'dd MMM', { locale: fr })} — {format(addDays(lundi, 4), 'dd MMM yyyy', { locale: fr })}
        </Text>
        <TouchableOpacity onPress={() => setWeekDate(addWeeks(weekDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Total semaine */}
      <Card style={[styles.totalCard, { borderLeftColor: totalColor }]}>
        <Text style={styles.totalLabel}>Total semaine</Text>
        <Text style={[styles.totalH, { color: totalColor }]}>{totalH.toFixed(1)} h</Text>
        {overThreshold && <Text style={styles.alert}>⚠ Dépassement du seuil maximum</Text>}
        {underThreshold && <Text style={[styles.alert, { color: COLORS.warning }]}>⚠ Sous le seuil des {WEEK_HOURS_TARGET}h</Text>}
      </Card>

      {/* Jours */}
      {JOURS.map((label, i) => {
        const date = addDays(lundi, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const h = horaires.get(dateStr);
        const heures = h ? calcHeuresTravaillees(h) : 0;
        const today = isToday(date);

        return (
          <Card key={dateStr} style={[styles.dayCard, today && styles.todayCard]}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, today && styles.todayLabel]}>
                {label} {format(date, 'dd', { locale: fr })}
              </Text>
              {h && <Text style={styles.dayH}>{heures.toFixed(1)} h</Text>}
            </View>

            {editing === dateStr ? (
              <View style={styles.editForm}>
                <View style={styles.editRow}>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Début</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.heureDebut}
                      onChangeText={(v) => setEditData((e) => ({ ...e, heureDebut: v }))}
                      placeholder="07:30"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Fin</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.heureFin}
                      onChangeText={(v) => setEditData((e) => ({ ...e, heureFin: v }))}
                      placeholder="17:00"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Pause (min)</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.pauseMinutes}
                      onChangeText={(v) => setEditData((e) => ({ ...e, pauseMinutes: v }))}
                      keyboardType="numeric"
                      placeholder="45"
                    />
                  </View>
                </View>
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                    <Text style={styles.saveText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.dayContent} onPress={() => startEdit(dateStr)}>
                {h ? (
                  <Text style={styles.horaireText}>
                    {h.heureDebut} → {h.heureFin} (pause {h.pauseMinutes} min)
                  </Text>
                ) : (
                  <Text style={styles.noHoraire}>Appuyer pour saisir</Text>
                )}
                <Ionicons name="pencil-outline" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8 },
  weekLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  totalCard: { borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  totalH: { fontSize: 24, fontWeight: '800' },
  alert: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  dayCard: { marginBottom: 8 },
  todayCard: { borderColor: COLORS.secondary, borderWidth: 1.5 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  todayLabel: { color: COLORS.secondary },
  dayH: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  dayContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  horaireText: { fontSize: 13, color: COLORS.text },
  noHoraire: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  editForm: { gap: 10 },
  editRow: { flexDirection: 'row', gap: 8 },
  editField: { flex: 1 },
  editLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: COLORS.background,
  },
  editActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: '700' },
});
