import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  getChantierById, updateChantier, updateAvancement, getCollaborateursForChantier,
  setCollaborateursForChantier, getAvancementHistory, deleteChantier,
} from '../../storage/chantiers';
import { getAllCollaborateurs } from '../../storage/collaborateurs';
import {
  getInterventionsForChantier, createIntervention, updateIntervention, deleteIntervention,
} from '../../storage/interventions';
import {
  getDocumentsForChantier, addDocument, deleteDocument,
} from '../../storage/documents';
import { Chantier, Collaborateur, AvancementUpdate, Intervention, ChantierDocument } from '../../types';
import { COLORS, STATUS_COLORS } from '../../constants/colors';
import { useMode } from '../../context/ModeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { DateInput } from '../../components/DateInput';

import { InterventionGroup, groupInterventions } from '../../utils/interventionUtils';

export function ChantierDetailScreen({ route, navigation }: any) {
  const { chantierId } = route.params;
  const { isAdmin } = useMode();
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [allCollabs, setAllCollabs] = useState<Collaborateur[]>([]);
  const [history, setHistory] = useState<AvancementUpdate[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editIntPct, setEditIntPct] = useState(0);
  const [showAddIntervention, setShowAddIntervention] = useState(false);
  const [intCollabs, setIntCollabs] = useState<string[]>([]);
  const [intDebutDisplay, setIntDebutDisplay] = useState('');
  const [intDebutISO, setIntDebutISO] = useState('');
  const [intFinDisplay, setIntFinDisplay] = useState('');
  const [intFinISO, setIntFinISO] = useState('');
  const [editingIntId, setEditingIntId] = useState<string | null>(null);
  const [intNom, setIntNom] = useState('');
  const [intNotes, setIntNotes] = useState('');
  const [documents, setDocuments] = useState<ChantierDocument[]>([]);

  const load = useCallback(async () => {
    const ch = await getChantierById(chantierId);
    if (!ch) return;
    setChantier(ch);
    setNotes(ch.notes);
    const [colls, all, hist, ints, docs] = await Promise.all([
      getCollaborateursForChantier(chantierId),
      getAllCollaborateurs(),
      getAvancementHistory(chantierId),
      getInterventionsForChantier(chantierId),
      getDocumentsForChantier(chantierId),
    ]);
    setCollaborateurs(colls);
    setAllCollabs(all);
    setHistory(hist);
    setInterventions(ints);
    setDocuments(docs);
  }, [chantierId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!chantier) return null;

  const handleDelete = () => {
    Alert.alert('Supprimer le chantier', `Supprimer "${chantier.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteChantier(chantierId); navigation.goBack(); } },
    ]);
  };

  const saveGroupAvancement = async (group: InterventionGroup) => {
    // Met à jour chaque membre du groupe avec la même valeur
    await Promise.all(group.members.map((int) =>
      updateIntervention(int.id, { avancement: editIntPct }),
    ));
    // Recalcule l'avancement global = moyenne de toutes les interventions
    const allInts = await getInterventionsForChantier(chantierId);
    const avg = allInts.length > 0
      ? Math.round(allInts.reduce((sum, i) => sum + (i.avancement ?? 0), 0) / allInts.length)
      : 0;
    await updateChantier(chantierId, { avancement: avg });
    setEditingGroupKey(null);
    load();
  };

  const saveNotes = async () => {
    await updateChantier(chantierId, { notes });
    setEditingNotes(false);
    load();
  };

  const toggleCollaborateur = async (colId: string) => {
    const isAffecte = collaborateurs.some((c) => c.id === colId);
    const newIds = isAffecte
      ? collaborateurs.filter((c) => c.id !== colId).map((c) => c.id)
      : [...collaborateurs.map((c) => c.id), colId];
    await setCollaborateursForChantier(chantierId, newIds);
    load();
  };

  const isoToDisplay = (iso: string) => {
    if (!iso || iso.length !== 10) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const resetIntForm = () => {
    setIntCollabs([]); setIntDebutDisplay(''); setIntDebutISO('');
    setIntFinDisplay(''); setIntFinISO(''); setEditingIntId(null);
    setIntNom(''); setIntNotes('');
  };

  const startEditIntervention = (int: Intervention) => {
    setEditingIntId(int.id);
    setIntCollabs([int.collaborateurId]);
    setIntDebutDisplay(isoToDisplay(int.dateDebut));
    setIntDebutISO(int.dateDebut);
    setIntFinDisplay(isoToDisplay(int.dateFin));
    setIntFinISO(int.dateFin);
    setIntNom(int.nom ?? '');
    setIntNotes(int.notes ?? '');
    setShowAddIntervention(true);
  };

  const saveIntervention = async () => {
    if (intCollabs.length === 0 || !intDebutISO || !intFinISO) {
      Alert.alert('Champs manquants', 'Sélectionnez au moins un collaborateur et renseignez les dates complètes (JJ/MM/AAAA).');
      return;
    }
    if (intFinISO < intDebutISO) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début.');
      return;
    }
    if (editingIntId) {
      await updateIntervention(editingIntId, {
        collaborateurId: intCollabs[0],
        dateDebut: intDebutISO,
        dateFin: intFinISO,
        nom: intNom.trim() || undefined,
        notes: intNotes.trim(),
      });
    } else {
      await Promise.all(
        intCollabs.map((collabId) =>
          createIntervention({
            chantierId, collaborateurId: collabId,
            dateDebut: intDebutISO, dateFin: intFinISO,
            nom: intNom.trim() || undefined, notes: intNotes.trim(),
          })
        )
      );
    }
    resetIntForm();
    setShowAddIntervention(false);
    load();
  };

  const removeIntervention = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette intervention ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteIntervention(id); load(); } },
    ]);
  };

  const getCollabName = (id: string) => {
    const c = allCollabs.find((c) => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : id;
  };

  // ─── Documents ────────────────────────────────────────────────────────────

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const getDocIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType === 'application/pdf') return 'document-text-outline';
    return 'attach-outline';
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      await addDocument(chantierId, file.name, file.uri, file.mimeType ?? 'application/octet-stream', file.size);
      load();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ajouter ce document.');
    }
  };

  const openDocument = async (doc: ChantierDocument) => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(doc.uri, { mimeType: doc.mimeType, dialogTitle: doc.nom });
      } else {
        Alert.alert('Non disponible', 'L\'ouverture de fichiers n\'est pas disponible sur cet appareil.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce document.');
    }
  };

  const confirmDeleteDocument = (doc: ChantierDocument) => {
    Alert.alert('Supprimer le document', `Supprimer "${doc.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteDocument(doc.id); load(); } },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Badge label={chantier.statut} color={STATUS_COLORS[chantier.statut] ?? COLORS.secondary} />
          {isAdmin && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('ChantierForm', { chantier })}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.nom}>{chantier.nom}</Text>
        {chantier.referenceChantier ? (
          <View style={styles.refRow}>
            <Ionicons name="bookmark-outline" size={13} color={COLORS.secondary} />
            <Text style={styles.refText}>Réf. {chantier.referenceChantier}</Text>
          </View>
        ) : null}
        <View style={styles.clientRow}>
          <Text style={styles.client}>{chantier.client}</Text>
          {chantier.telephoneClient ? (
            <TouchableOpacity
              style={styles.telBtn}
              onPress={() => Linking.openURL(`tel:${chantier.telephoneClient}`)}
            >
              <Ionicons name="call-outline" size={14} color="#fff" />
              <Text style={styles.telBtnText}>{chantier.telephoneClient}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.adresseRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.adresse}>{chantier.adresse}</Text>
        </View>
        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.dates}>
            {format(new Date(chantier.dateDebut), 'dd MMM yyyy', { locale: fr })} →{' '}
            {format(new Date(chantier.dateFin), 'dd MMM yyyy', { locale: fr })}
          </Text>
        </View>
      </View>

      {/* Avancement par intervention */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Avancement</Text>
          <Text style={styles.avanGlobal}>Global : {chantier.avancement}%</Text>
        </View>
        <ProgressBar value={chantier.avancement} height={8} showLabel={false} />

        <View style={styles.intAvanList}>
          {interventions.length === 0 ? (
            <Text style={styles.emptyText}>Ajoutez des interventions pour suivre l'avancement</Text>
          ) : (
            groupInterventions(interventions).map((group, idx) => {
              const pct = group.avancement;
              const isEditing = editingGroupKey === group.key;
              return (
                <View key={group.key} style={[styles.intAvanRow, idx > 0 && styles.intAvanRowBorder]}>
                  {/* En-tête : libellé + bouton édition */}
                  <View style={styles.intAvanHeader}>
                    <View style={{ flex: 1 }}>
                      {group.nom
                        ? <Text style={styles.intAvanNom}>{group.nom}</Text>
                        : null}
                      {/* Chips collaborateurs */}
                      <View style={styles.intAvanCollabRow}>
                        {group.members.map((m) => (
                          <View key={m.id} style={styles.intAvanCollabChip}>
                            <Text style={styles.intAvanCollab}>{getCollabName(m.collaborateurId)}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.intAvanDates}>
                        {format(new Date(group.dateDebut), 'dd MMM', { locale: fr })} → {format(new Date(group.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.intAvanEditBtn}
                      onPress={() => {
                        if (isEditing) { setEditingGroupKey(null); }
                        else { setEditingGroupKey(group.key); setEditIntPct(pct); }
                      }}
                    >
                      <Ionicons name={isEditing ? 'close' : 'pencil-outline'} size={18} color={COLORS.secondary} />
                    </TouchableOpacity>
                  </View>
                  {/* Barre de progression */}
                  <ProgressBar value={pct} height={10} />
                  {/* Commentaire du groupe */}
                  {group.members.find((m) => m.notes) ? (
                    <Text style={styles.intAvanNotes}>
                      {group.members.find((m) => m.notes)!.notes}
                    </Text>
                  ) : null}
                  {/* Édition inline */}
                  {isEditing && (
                    <View style={styles.intAvanEdit}>
                      <Text style={styles.sliderLabel}>{editIntPct}%</Text>
                      <View style={styles.pctRow}>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (
                          <TouchableOpacity
                            key={v}
                            style={[styles.pctBtn, editIntPct === v && styles.pctBtnActive]}
                            onPress={() => setEditIntPct(v)}
                          >
                            <Text style={[styles.pctBtnText, editIntPct === v && styles.pctBtnTextActive]}>{v}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity style={styles.saveBtn} onPress={() => saveGroupAvancement(group)}>
                        <Text style={styles.saveBtnText}>Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </Card>

      {/* Notes terrain */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes terrain</Text>
          <TouchableOpacity onPress={() => { setEditingNotes(!editingNotes); setNotes(chantier.notes); }}>
            <Ionicons name={editingNotes ? 'close' : 'pencil-outline'} size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        {editingNotes ? (
          <View style={styles.editSection}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes terrain, remarques équipe…"
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveNotes}>
              <Text style={styles.saveBtnText}>Enregistrer les notes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          chantier.notes
            ? <Text style={styles.notesText}>{chantier.notes}</Text>
            : <Text style={styles.emptyText}>Appuyer sur ✏ pour ajouter des notes</Text>
        )}
      </Card>

      {/* Documents */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {isAdmin && (
            <TouchableOpacity onPress={pickDocument} style={styles.docAddBtn}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {documents.length === 0 ? (
          <Text style={styles.emptyText}>
            {isAdmin ? 'Appuyez sur + pour ajouter plans, devis…' : 'Aucun document'}
          </Text>
        ) : (
          documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.docRow}
              onPress={() => openDocument(doc)}
              activeOpacity={0.7}
            >
              <View style={styles.docIconWrap}>
                <Ionicons name={getDocIcon(doc.mimeType) as any} size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docNom} numberOfLines={2}>{doc.nom}</Text>
                <Text style={styles.docMeta}>
                  {doc.createdAt.slice(0, 10)}{doc.taille ? `  ·  ${formatSize(doc.taille)}` : ''}
                </Text>
              </View>
              <View style={styles.docActions}>
                <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
                {isAdmin && (
                  <TouchableOpacity onPress={() => confirmDeleteDocument(doc)} style={styles.docDeleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Équipe */}
      <Card>
        <Text style={styles.sectionTitle}>Équipe affectée</Text>
        {allCollabs.map((c) => {
          const affecte = collaborateurs.some((col) => col.id === c.id);
          if (!isAdmin && !affecte) return null;
          return isAdmin ? (
            <TouchableOpacity key={c.id} style={[styles.collabRow, affecte && styles.collabAffecte]} onPress={() => toggleCollaborateur(c.id)}>
              <View style={[styles.checkbox, affecte && styles.checkboxActive]}>
                {affecte && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[styles.collabNom, affecte && { color: COLORS.primary }]}>{c.prenom} {c.nom}</Text>
              <Text style={styles.collabRole}>{c.role}</Text>
            </TouchableOpacity>
          ) : (
            <View key={c.id} style={[styles.collabRow, styles.collabAffecte]}>
              <Ionicons name="person" size={16} color={COLORS.primary} />
              <Text style={[styles.collabNom, { color: COLORS.primary }]}>{c.prenom} {c.nom}</Text>
              <Text style={styles.collabRole}>{c.role}</Text>
            </View>
          );
        })}
      </Card>

      {/* Interventions — visible admin uniquement */}
      {isAdmin && <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interventions</Text>
          {isAdmin && (
          <TouchableOpacity onPress={() => {
            if (showAddIntervention) { resetIntForm(); setShowAddIntervention(false); }
            else setShowAddIntervention(true);
          }}>
            <Ionicons name={showAddIntervention ? 'close' : 'add-circle-outline'} size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        )}
        </View>

        <Text style={styles.interventionInfo}>
          Définissez les périodes exactes où chaque collaborateur intervient sur ce chantier. Ces périodes s'afficheront sur le planning.
        </Text>

        {showAddIntervention && (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Collaborateur</Text>
            <View style={styles.collabPicker}>
              {collaborateurs.map((c) => {
                const selected = intCollabs.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.collabChip, selected && styles.collabChipActive]}
                    onPress={() => setIntCollabs((prev) =>
                      prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                    )}
                  >
                    <Text style={[styles.collabChipText, selected && styles.collabChipTextActive]}>
                      {c.prenom}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.formLabel}>Du</Text>
            <DateInput
              value={intDebutDisplay}
              onChange={(formatted, iso) => { setIntDebutDisplay(formatted); setIntDebutISO(iso); }}
            />
            <Text style={styles.formLabel}>Au</Text>
            <DateInput
              value={intFinDisplay}
              onChange={(formatted, iso) => { setIntFinDisplay(formatted); setIntFinISO(iso); }}
            />
            <Text style={styles.formLabel}>Libellé (optionnel)</Text>
            <TextInput
              style={styles.formInput}
              value={intNom}
              onChangeText={setIntNom}
              placeholder="ex: Pose des pannes, Finitions…"
              returnKeyType="next"
            />
            <Text style={styles.formLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={[styles.formInput, styles.formInputMultiline]}
              value={intNotes}
              onChangeText={setIntNotes}
              placeholder="Remarques, consignes, matériel nécessaire…"
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={saveIntervention}>
              <Text style={styles.addBtnText}>{editingIntId ? 'Modifier l\'intervention' : 'Ajouter l\'intervention'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {interventions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune intervention — ajoutez-en une avec le + ci-dessus</Text>
        ) : (
          interventions.map((int) => (
            <View key={int.id} style={[styles.intRow, editingIntId === int.id && styles.intRowEditing]}>
              <View style={styles.intLeft}>
                <Text style={styles.intCollab}>{getCollabName(int.collaborateurId)}</Text>
                {int.nom ? <Text style={styles.intNomText}>{int.nom}</Text> : null}
                <Text style={styles.intDates}>
                  {format(new Date(int.dateDebut), 'dd MMM', { locale: fr })} → {format(new Date(int.dateFin), 'dd MMM yyyy', { locale: fr })}
                </Text>
                {int.notes ? <Text style={styles.intNotesText}>{int.notes}</Text> : null}
              </View>
              {isAdmin && (
                <View style={styles.intActions}>
                  <TouchableOpacity onPress={() => startEditIntervention(int)} style={styles.intActionBtn}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeIntervention(int.id)} style={styles.intActionBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </Card>}

      {/* Supprimer */}
      {isAdmin && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Supprimer ce chantier</Text>
        </TouchableOpacity>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Historique avancement</Text>
          {history.slice(0, 5).map((h) => (
            <View key={h.id} style={styles.histRow}>
              <Text style={styles.histDate}>{h.createdAt}</Text>
              <Text style={styles.histPct}>{h.avancement}%</Text>
              {h.notes ? <Text style={styles.histNotes}>{h.notes}</Text> : null}
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  header: { marginBottom: 16, gap: 6 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: COLORS.secondary },
  editBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  nom: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  refText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  client: { fontSize: 15, color: COLORS.secondary, fontWeight: '600' },
  telBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  telBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  adresseRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adresse: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dates: { fontSize: 13, color: COLORS.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  avanGlobal: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  editSection: { marginTop: 12, gap: 10 },
  sliderLabel: { fontSize: 22, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  pctRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  pctBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  pctBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  pctBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pctBtnTextActive: { color: '#fff' },
  notesInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: COLORS.background, textAlignVertical: 'top', height: 90 },
  saveBtn: { backgroundColor: COLORS.secondary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  notesText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  // Avancement par intervention
  intAvanList: { marginTop: 12, gap: 0 },
  intAvanRow: { paddingVertical: 10, gap: 6 },
  intAvanRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  intAvanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  intAvanCollabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  intAvanCollabChip: { backgroundColor: '#EEF4FF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  intAvanCollab: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  intAvanNom: { fontSize: 13, color: COLORS.secondary, fontWeight: '700' },
  intAvanDates: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  intAvanNotes: { fontSize: 12, color: COLORS.danger, fontStyle: 'italic', marginTop: 4, lineHeight: 17 },
  intAvanEditBtn: { padding: 4, marginLeft: 8 },
  intAvanEdit: { marginTop: 8, gap: 8, backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
  collabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  collabAffecte: { backgroundColor: '#F0F6FF', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  collabNom: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  collabRole: { fontSize: 12, color: COLORS.textSecondary },
  interventionInfo: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 18 },
  addForm: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 12, gap: 6 },
  formLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: 6 },
  formInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: COLORS.surface },
  formInputMultiline: { height: 70, textAlignVertical: 'top' },
  collabPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  collabChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  collabChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  collabChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  collabChipTextActive: { color: '#fff' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  intRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  intRowEditing: { backgroundColor: '#EEF4FF', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  intLeft: { flex: 1 },
  intCollab: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  intNomText: { fontSize: 13, fontWeight: '600', color: COLORS.secondary, marginTop: 2 },
  intDates: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  intNotesText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 3, lineHeight: 17 },
  intActions: { flexDirection: 'row', gap: 4 },
  intActionBtn: { padding: 4 },
  // Documents
  docAddBtn: { padding: 2 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  docIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF4FF', justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docNom: { fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 18 },
  docMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  docActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docDeleteBtn: { padding: 4 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.danger, borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  deleteBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
  histRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 2 },
  histDate: { fontSize: 11, color: COLORS.textSecondary },
  histPct: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  histNotes: { fontSize: 12, color: COLORS.text },
});
