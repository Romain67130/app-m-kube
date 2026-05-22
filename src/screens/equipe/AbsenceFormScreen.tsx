import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { format } from 'date-fns';
import { createAbsence } from '../../storage/absences';
import { COLORS, ABSENCE_COLORS } from '../../constants/colors';
import { ABSENCE_TYPES } from '../../constants/config';

export function AbsenceFormScreen({ route, navigation }: any) {
  const { collaborateur } = route.params;
  const [type, setType] = useState(ABSENCE_TYPES[0]);
  const [dateDebut, setDateDebut] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [commentaire, setCommentaire] = useState('');

  const handleSave = async () => {
    if (!dateDebut || !dateFin) {
      Alert.alert('Erreur', 'Veuillez remplir les dates.');
      return;
    }
    if (dateFin < dateDebut) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début.');
      return;
    }
    await createAbsence({ collaborateurId: collaborateur.id, type, dateDebut, dateFin, commentaire });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.collaborateur}>{collaborateur.prenom} {collaborateur.nom}</Text>

      <Text style={styles.label}>Type d'absence</Text>
      <View style={styles.typesGrid}>
        {ABSENCE_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && { backgroundColor: ABSENCE_COLORS[t] ?? COLORS.secondary }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date de début (AAAA-MM-JJ)</Text>
      <TextInput
        style={styles.input}
        value={dateDebut}
        onChangeText={setDateDebut}
        placeholder="2024-01-15"
      />

      <Text style={styles.label}>Date de fin (AAAA-MM-JJ)</Text>
      <TextInput
        style={styles.input}
        value={dateFin}
        onChangeText={setDateFin}
        placeholder="2024-01-19"
      />

      <Text style={styles.label}>Commentaire (optionnel)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={commentaire}
        onChangeText={setCommentaire}
        placeholder="Précisions..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Enregistrer l'absence</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 8 },
  collaborateur: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 8 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  typeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  typeTextActive: { color: '#fff' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: COLORS.surface, marginTop: 4,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
