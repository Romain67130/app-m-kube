import React, { useCallback, useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllCollaborateurs } from '../../storage/collaborateurs';
import { Collaborateur } from '../../types';
import { COLORS } from '../../constants/colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

export function EquipeScreen({ navigation }: any) {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllCollaborateurs();
    setCollaborateurs(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const initiales = (c: Collaborateur) => `${c.prenom[0]}${c.nom[0]}`.toUpperCase();

  const couleurAvatar = (id: string) => {
    const palette = [COLORS.primary, COLORS.secondary, '#27AE60', '#9B59B6', '#16A085'];
    return palette[id.charCodeAt(id.length - 1) % palette.length];
  };

  const internes = collaborateurs.filter((c) => (c.type ?? 'interne') === 'interne');
  const soustraitants = collaborateurs.filter((c) => c.type === 'sous-traitant');

  // Grouper les sous-traitants par entreprise
  const stParEntreprise = soustraitants.reduce<Record<string, Collaborateur[]>>((acc, c) => {
    const key = c.entreprise || 'Sans entreprise';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const sections = [
    ...(internes.length > 0 ? [{ title: `Équipe interne (${internes.length})`, data: internes, type: 'interne' as const }] : []),
    ...Object.entries(stParEntreprise).map(([entreprise, membres]) => ({
      title: entreprise,
      data: membres,
      type: 'sous-traitant' as const,
    })),
  ];

  const renderItem = ({ item, section }: { item: Collaborateur; section: any }) => {
    const isST = section.type === 'sous-traitant';
    return (
      <TouchableOpacity onPress={() => navigation.navigate('CollaborateurDetail', { collaborateur: item })}>
        <Card style={[styles.card, isST && styles.cardST]}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: isST ? COLORS.soustraitantAccent : couleurAvatar(item.id) }]}>
              <Text style={styles.avatarText}>{initiales(item)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.nom}>{item.prenom} {item.nom}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Horaires', { collaborateur: item })}
              >
                <Ionicons name="time-outline" size={20} color={isST ? COLORS.soustraitantAccent : COLORS.secondary} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (collaborateurs.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState icon="people-outline" title="Aucun collaborateur" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, section.type === 'sous-traitant' && styles.sectionHeaderST]}>
            <Ionicons
              name={section.type === 'sous-traitant' ? 'business' : 'people'}
              size={15}
              color={section.type === 'sous-traitant' ? COLORS.soustraitantAccent : COLORS.primary}
            />
            <Text style={[styles.sectionTitle, section.type === 'sous-traitant' && styles.sectionTitleST]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FA', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginBottom: 8, marginTop: 8,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  sectionHeaderST: {
    backgroundColor: COLORS.soustraitantBg,
    borderLeftColor: COLORS.soustraitantAccent,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  sectionTitleST: { color: COLORS.soustraitantAccent },
  card: { marginBottom: 8 },
  cardST: { borderLeftWidth: 3, borderLeftColor: COLORS.soustraitantAccent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  nom: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { padding: 6 },
});
