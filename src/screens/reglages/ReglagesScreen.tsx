import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Share, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllCollaborateurs, deleteCollaborateur } from '../../storage/collaborateurs';
import { getHorairesForPeriod, calcHeuresTravaillees, calcTotalSemaine } from '../../storage/horaires';
import { Collaborateur } from '../../types';
import { COLORS } from '../../constants/colors';
import { Card } from '../../components/Card';
import { useMode } from '../../context/ModeContext';

export function ReglagesScreen({ navigation }: any) {
  const { isAdmin, updateAdminPin } = useMode();
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [showPinForm, setShowPinForm] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const load = useCallback(async () => {
    const data = await getAllCollaborateurs();
    setCollaborateurs(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (c: Collaborateur) => {
    Alert.alert(
      'Désactiver collaborateur',
      `Désactiver ${c.prenom} ${c.nom} ? Il ne sera plus affiché dans l'équipe.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver', style: 'destructive',
          onPress: async () => { await deleteCollaborateur(c.id); load(); },
        },
      ]
    );
  };

  const handleChangePin = () => {
    if (newPin.length < 4) {
      Alert.alert('Code trop court', 'Le nouveau code doit contenir au moins 4 chiffres.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Codes différents', 'Le nouveau code et sa confirmation ne correspondent pas.');
      return;
    }
    const ok = updateAdminPin(oldPin, newPin);
    if (!ok) {
      Alert.alert('Code incorrect', 'L\'ancien code saisi est incorrect.');
      return;
    }
    setOldPin(''); setNewPin(''); setConfirmPin('');
    setShowPinForm(false);
    Alert.alert('Code modifié', 'Votre nouveau code administrateur est enregistré.');
  };

  const exportMensuel = async () => {
    const now = new Date();
    const debut = format(startOfMonth(now), 'yyyy-MM-dd');
    const fin = format(endOfMonth(now), 'yyyy-MM-dd');
    const mois = format(now, 'MMMM yyyy', { locale: fr });

    const horaires = await getHorairesForPeriod(debut, fin);

    let csv = `Récapitulatif horaires — ${mois}\n\n`;
    csv += 'Collaborateur;Total heures\n';

    for (const c of collaborateurs) {
      const hCollab = horaires.filter((h) => h.collaborateurId === c.id);
      const total = hCollab.reduce((sum, h) => sum + calcHeuresTravaillees(h), 0);
      csv += `${c.prenom} ${c.nom};${total.toFixed(1)}h\n`;
    }

    await Share.share({ message: csv, title: `MKUBE Horaires ${mois}` });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={collaborateurs}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Export */}
            <Card style={styles.exportCard}>
              <Text style={styles.exportTitle}>Récapitulatif mensuel</Text>
              <Text style={styles.exportSubtitle}>Export des heures du mois en cours</Text>
              <TouchableOpacity style={styles.exportBtn} onPress={exportMensuel}>
                <Ionicons name="share-outline" size={18} color="#fff" />
                <Text style={styles.exportBtnText}>Exporter les heures</Text>
              </TouchableOpacity>
            </Card>

            {/* Code PIN admin */}
            {isAdmin && (
              <Card style={styles.pinCard}>
                <View style={styles.pinHeader}>
                  <View style={styles.pinHeaderLeft}>
                    <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
                    <Text style={styles.pinTitle}>Code administrateur</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setShowPinForm(!showPinForm); setOldPin(''); setNewPin(''); setConfirmPin(''); }}>
                    <Text style={styles.pinToggle}>{showPinForm ? 'Annuler' : 'Modifier'}</Text>
                  </TouchableOpacity>
                </View>
                {!showPinForm && (
                  <Text style={styles.pinInfo}>Code actuel : ••••  (par défaut : 1234)</Text>
                )}
                {showPinForm && (
                  <View style={styles.pinForm}>
                    <TextInput
                      style={styles.pinInput}
                      value={oldPin}
                      onChangeText={setOldPin}
                      placeholder="Ancien code"
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={8}
                    />
                    <TextInput
                      style={styles.pinInput}
                      value={newPin}
                      onChangeText={setNewPin}
                      placeholder="Nouveau code (min. 4 chiffres)"
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={8}
                    />
                    <TextInput
                      style={styles.pinInput}
                      value={confirmPin}
                      onChangeText={setConfirmPin}
                      placeholder="Confirmer le nouveau code"
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={8}
                    />
                    <TouchableOpacity style={styles.pinSaveBtn} onPress={handleChangePin}>
                      <Text style={styles.pinSaveBtnText}>Enregistrer le nouveau code</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            )}

            {/* En-tête liste */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Collaborateurs ({collaborateurs.length})</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.navigate('CollaborateurForm', {})}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.nom}>{item.prenom} {item.nom}</Text>
                <Text style={styles.role}>{item.role}</Text>
              </View>
              {isAdmin && (
                <>
                  <TouchableOpacity onPress={() => navigation.navigate('CollaborateurForm', { collaborateur: item })}>
                    <Ionicons name="pencil-outline" size={20} color={COLORS.secondary} style={styles.iconBtn} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} style={styles.iconBtn} />
                  </TouchableOpacity>
                </>
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
  exportCard: { borderLeftWidth: 4, borderLeftColor: COLORS.secondary, marginBottom: 20 },
  exportTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  exportSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.secondary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  exportBtnText: { color: '#fff', fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  nom: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  iconBtn: { padding: 6, marginLeft: 4 },
  pinCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginBottom: 20 },
  pinHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pinHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pinToggle: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  pinInfo: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  pinForm: { marginTop: 12, gap: 10 },
  pinInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
    backgroundColor: COLORS.background, letterSpacing: 4,
  },
  pinSaveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  pinSaveBtnText: { color: '#fff', fontWeight: '700' },
});
