import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllChantiers } from '../../storage/chantiers';
import { Chantier } from '../../types';
import { COLORS, STATUS_COLORS } from '../../constants/colors';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { EmptyState } from '../../components/EmptyState';
import { useMode } from '../../context/ModeContext';

export function ChantiersScreen({ navigation }: any) {
  const { isAdmin } = useMode();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getAllChantiers();
    setChantiers(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const FILTERS = ['Planifié', 'En cours', 'Terminé'];
  const filtered = filter ? chantiers.filter((c) => c.statut === filter) : chantiers;

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, !filter && styles.filterActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && { backgroundColor: STATUS_COLORS[f] }]}
            onPress={() => setFilter(filter === f ? null : f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="construct-outline" title="Aucun chantier" />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ChantierDetail', { chantierId: item.id })}>
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                <Badge label={item.statut} color={STATUS_COLORS[item.statut] ?? COLORS.secondary} size="sm" />
              </View>
              <Text style={styles.client}>{item.client}</Text>
              <Text style={styles.adresse} numberOfLines={1}>{item.adresse}</Text>
              <View style={styles.dates}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.datesText}>
                  {format(new Date(item.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                  {format(new Date(item.dateFin), 'dd MMM yyyy', { locale: fr })}
                </Text>
              </View>
              {item.statut === 'En cours' && (
                <View style={{ marginTop: 10 }}>
                  <ProgressBar value={item.avancement} />
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />

      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ChantierForm', {})}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  nom: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  client: { fontSize: 13, color: COLORS.secondary, fontWeight: '600', marginBottom: 2 },
  adresse: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  datesText: { fontSize: 12, color: COLORS.textSecondary },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
});
