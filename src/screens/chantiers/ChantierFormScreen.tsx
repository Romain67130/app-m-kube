import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { createChantier, updateChantier } from '../../storage/chantiers';
import { COLORS, STATUS_COLORS } from '../../constants/colors';
import { CHANTIER_STATUSES } from '../../constants/config';
import { DateInput } from '../../components/DateInput';

function isoToDisplay(iso: string): string {
  if (!iso || iso.length !== 10) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function ChantierFormScreen({ route, navigation }: any) {
  const existing = route.params?.chantier;
  const isEdit = !!existing;

  const [nom, setNom] = useState(existing?.nom ?? '');
  const [referenceChantier, setReferenceChantier] = useState(existing?.referenceChantier ?? '');
  const [client, setClient] = useState(existing?.client ?? '');
  const [telephoneClient, setTelephoneClient] = useState(existing?.telephoneClient ?? '');
  const [adresse, setAdresse] = useState(existing?.adresse ?? '');
  const [statut, setStatut] = useState(existing?.statut ?? 'Planifié');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const [debutDisplay, setDebutDisplay] = useState(isoToDisplay(existing?.dateDebut ?? ''));
  const [debutISO, setDebutISO] = useState(existing?.dateDebut ?? '');
  const [finDisplay, setFinDisplay] = useState(isoToDisplay(existing?.dateFin ?? ''));
  const [finISO, setFinISO] = useState(existing?.dateFin ?? '');

  const handleSave = async () => {
    if (!nom.trim() || !client.trim() || !debutISO || !finISO) {
      Alert.alert('Champs manquants', 'Nom, client, dates de début et fin sont obligatoires.');
      return;
    }
    if (finISO < debutISO) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début.');
      return;
    }
    const payload = {
      nom,
      client,
      telephoneClient: telephoneClient.trim() || undefined,
      referenceChantier: referenceChantier.trim() || undefined,
      adresse,
      dateDebut: debutISO,
      dateFin: finISO,
      statut,
      notes,
    };
    if (isEdit) {
      await updateChantier(existing.id, payload);
    } else {
      await createChantier({ ...payload, avancement: 0 });
    }
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Nom du chantier *</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Carport bois — Dupont"
        returnKeyType="next"
      />

      <Text style={styles.label}>Référence chantier</Text>
      <TextInput
        style={styles.input}
        value={referenceChantier}
        onChangeText={setReferenceChantier}
        placeholder="ex: 2025-042, CH-0012…"
        returnKeyType="next"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Client *</Text>
      <TextInput
        style={styles.input}
        value={client}
        onChangeText={setClient}
        placeholder="M. Dupont Jean"
        returnKeyType="next"
      />

      <Text style={styles.label}>Téléphone client</Text>
      <TextInput
        style={styles.input}
        value={telephoneClient}
        onChangeText={setTelephoneClient}
        placeholder="06 12 34 56 78"
        keyboardType="phone-pad"
        returnKeyType="next"
      />

      <Text style={styles.label}>Adresse</Text>
      <TextInput
        style={styles.input}
        value={adresse}
        onChangeText={setAdresse}
        placeholder="12 rue des Vosges, 67000 Strasbourg"
        returnKeyType="next"
      />

      <Text style={styles.label}>Date de début *</Text>
      <DateInput
        value={debutDisplay}
        onChange={(fmt, iso) => { setDebutDisplay(fmt); setDebutISO(iso); }}
      />

      <Text style={styles.label}>Date de fin *</Text>
      <DateInput
        value={finDisplay}
        onChange={(fmt, iso) => { setFinDisplay(fmt); setFinISO(iso); }}
      />

      <Text style={styles.label}>Statut</Text>
      <View style={styles.statusRow}>
        {CHANTIER_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.statusBtn, statut === s && { backgroundColor: STATUS_COLORS[s] ?? COLORS.secondary }]}
            onPress={() => setStatut(s)}
          >
            <Text style={[styles.statusText, statut === s && styles.statusTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Informations supplémentaires..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{isEdit ? 'Enregistrer les modifications' : 'Créer le chantier'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: COLORS.surface,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: 4 },
  statusBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  statusTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
