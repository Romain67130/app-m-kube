import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Dimensions,
  StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useMode } from '../../context/ModeContext';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2;

const MODULES = [
  { label: 'Planning',  icon: 'calendar',   route: 'PlanningStack',  color: '#2E75B6' },
  { label: 'Chantiers', icon: 'construct',   route: 'ChantiersStack', color: '#1F3864' },
  { label: 'Équipe',    icon: 'people',      route: 'EquipeStack',    color: '#2E75B6' },
  { label: 'Réglages',  icon: 'settings',    route: 'ReglagesStack',  color: '#1F3864' },
] as const;

export function HomeScreen({ navigation }: any) {
  const { isAdmin, switchToAdmin, switchToEquipe } = useMode();
  const insets = useSafeAreaInsets();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleLockPress = () => {
    if (isAdmin) {
      switchToEquipe();
    } else {
      setPinInput('');
      setPinModalVisible(true);
    }
  };

  const confirmPin = () => {
    const ok = switchToAdmin(pinInput);
    if (ok) {
      setPinModalVisible(false);
    } else {
      Alert.alert('Code incorrect', 'Le code administrateur est incorrect.');
      setPinInput('');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Barre du haut : mode à droite */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.modeBtn} onPress={handleLockPress}>
            <Ionicons
              name={isAdmin ? 'lock-open' : 'lock-closed'}
              size={16}
              color={isAdmin ? '#FFD700' : 'rgba(255,255,255,0.8)'}
            />
            <Text style={[styles.modeBadge, isAdmin && styles.modeBadgeAdmin]}>
              {isAdmin ? 'Admin' : 'Équipe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo + titre */}
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MKUBE Planning</Text>
        <Text style={styles.tagline}>Gestion chantiers & équipes</Text>
      </View>

      {/* Grille 2×2 avec image de fond */}
      <ImageBackground
        source={require('../../../assets/bg.png')}
        style={styles.grid}
        resizeMode="cover"
      >
        {/* Voile semi-transparent pour lisibilité */}
        <View style={styles.gridOverlay} />
        {MODULES.map((mod) => (
          <TouchableOpacity
            key={mod.route}
            style={[styles.card, { backgroundColor: mod.color }]}
            onPress={() => navigation.navigate(mod.route)}
            activeOpacity={0.85}
          >
            <Ionicons name={mod.icon as any} size={40} color="#fff" />
            <Text style={styles.cardLabel}>{mod.label}</Text>
          </TouchableOpacity>
        ))}
      </ImageBackground>

      {/* Modal PIN */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Mode Administrateur</Text>
            <Text style={styles.modalSubtitle}>Entrez votre code pour accéder à toutes les fonctions</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Code PIN"
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmPin}>
                <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeBadge: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  modeBadgeAdmin: { color: '#FFD700' },
  logo: { width: 120, height: 120 },
  appName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  grid: {
    flex: 1,
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 16, gap: 16,
    alignContent: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  card: {
    width: CARD_W, height: CARD_W,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    opacity: 0.82,
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 28, width: W - 64, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  pinInput: {
    width: '100%', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 20, textAlign: 'center', letterSpacing: 8,
    backgroundColor: COLORS.background, marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  modalBtnCancelText: { fontWeight: '700', color: COLORS.textSecondary },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  modalBtnConfirmText: { fontWeight: '700', color: '#fff' },
});
