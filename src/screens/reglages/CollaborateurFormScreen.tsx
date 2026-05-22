import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createCollaborateur, updateCollaborateur } from '../../storage/collaborateurs';
import { COLORS } from '../../constants/colors';

const ROLES_INTERNE = ["Chef d'équipe", 'Second poseur', 'Poseur', 'Charpentier', 'Soudeur', 'Autre'];
const ROLES_ST = ['Sous-traitant', 'Electricien', 'Plombier', 'Maçon', 'Peintre', 'Autre'];

export function CollaborateurFormScreen({ route, navigation }: any) {
  const existing = route.params?.collaborateur;
  const [type, setType] = useState<'interne' | 'sous-traitant'>(existing?.type ?? 'interne');
  const [prenom, setPrenom] = useState(existing?.prenom ?? '');
  const [nom, setNom] = useState(existing?.nom ?? '');
  const [entreprise, setEntreprise] = useState(existing?.entreprise ?? '');
  const [role, setRole] = useState(existing?.role ?? ROLES_INTERNE[2]);
  const [telephone, setTelephone] = useState(existing?.telephone ?? '');

  const roles = type === 'interne' ? ROLES_INTERNE : ROLES_ST;

  const handleSave = async () => {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert('Champs manquants', 'Prénom et nom sont obligatoires.');
      return;
    }
    if (type === 'sous-traitant' && !entreprise.trim()) {
      Alert.alert('Champs manquants', "Le nom de l'entreprise est obligatoire pour un sous-traitant.");
      return;
    }
    const data = { prenom, nom, role, telephone, type, entreprise: type === 'sous-traitant' ? entreprise : '' };
    if (existing) {
      await updateCollaborateur(existing.id, data);
    } else {
      await createCollaborateur(data);
    }
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Type */}
      <Text style={styles.label}>Type *</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'interne' && styles.typeBtnActive]}
          onPress={() => { setType('interne'); setRole(ROLES_INTERNE[2]); }}
        >
          <Ionicons name="people" size={18} color={type === 'interne' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.typeText, type === 'interne' && styles.typeTextActive]}>Équipe interne</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'sous-traitant' && styles.typeBtnST]}
          onPress={() => { setType('sous-traitant'); setRole(ROLES_ST[0]); }}
        >
          <Ionicons name="business" size={18} color={type === 'sous-traitant' ? '#fff' : COLORS.textSecondary} />
          <Text style={[styles.typeText, type === 'sous-traitant' && styles.typeTextActive]}>Sous-traitant</Text>
        </TouchableOpacity>
      </View>

      {/* Entreprise (sous-traitant seulement) */}
      {type === 'sous-traitant' && (
        <>
          <Text style={styles.label}>Entreprise *</Text>
          <TextInput
            style={styles.input}
            value={entreprise}
            onChangeText={setEntreprise}
            placeholder="SARL Dupont Électricité"
            returnKeyType="next"
          />
        </>
      )}

      <Text style={styles.label}>Prénom *</Text>
      <TextInput
        style={styles.input}
        value={prenom}
        onChangeText={setPrenom}
        placeholder="Maxime"
        returnKeyType="next"
      />

      <Text style={styles.label}>Nom *</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Bernard"
        returnKeyType="next"
      />

      <Text style={styles.label}>Téléphone</Text>
      <TextInput
        style={styles.input}
        value={telephone}
        onChangeText={setTelephone}
        placeholder="06 12 34 56 78"
        keyboardType="phone-pad"
        returnKeyType="done"
      />

      <Text style={styles.label}>Rôle</Text>
      <View style={styles.rolesGrid}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, role === r && (type === 'sous-traitant' ? styles.roleBtnActiveST : styles.roleBtnActive)]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveBtn, type === 'sous-traitant' && styles.saveBtnST]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {existing ? 'Mettre à jour' : type === 'sous-traitant' ? 'Ajouter le sous-traitant' : 'Ajouter le collaborateur'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: COLORS.surface,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnST: { backgroundColor: COLORS.soustraitantAccent, borderColor: COLORS.soustraitantAccent },
  typeText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  typeTextActive: { color: '#fff' },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnActiveST: { backgroundColor: COLORS.soustraitantAccent, borderColor: COLORS.soustraitantAccent },
  roleText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  roleTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 32,
  },
  saveBtnST: { backgroundColor: COLORS.soustraitantAccent },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
