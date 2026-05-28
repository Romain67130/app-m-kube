import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collaborateur, Chantier, Absence, Horaire, AvancementUpdate, Intervention } from '../types';

export interface DB {
  collaborateurs: Collaborateur[];
  chantiers: Chantier[];
  absences: Absence[];
  horaires: Horaire[];
  avancement_updates: AvancementUpdate[];
  chantier_collaborateurs: { chantierId: string; collaborateurId: string }[];
  interventions: Intervention[];
  seeded: boolean;
}

const KEYS: (keyof DB)[] = [
  'collaborateurs', 'chantiers', 'absences', 'horaires',
  'avancement_updates', 'chantier_collaborateurs', 'interventions', 'seeded',
];

let cache: DB = {
  collaborateurs: [], chantiers: [], absences: [],
  horaires: [], avancement_updates: [], chantier_collaborateurs: [],
  interventions: [], seeded: false,
};

export async function initDatabase(): Promise<void> {
  await Promise.all(
    KEYS.map(async (key) => {
      try {
        const raw = await AsyncStorage.getItem(`mkube_${key}`);
        if (raw) (cache as any)[key] = JSON.parse(raw);
      } catch (e) {
        // Donnée corrompue : on ignore et repart de zéro pour cette clé
        console.warn(`[DB] Erreur chargement clé ${key}:`, e);
      }
    })
  );
}

async function persist(key: keyof DB): Promise<void> {
  await AsyncStorage.setItem(`mkube_${key}`, JSON.stringify((cache as any)[key]));
}

export function getDB(): DB {
  return cache;
}

export async function saveDB(key: keyof DB): Promise<void> {
  await persist(key);
}
