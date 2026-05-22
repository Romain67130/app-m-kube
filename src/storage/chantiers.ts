import { getDB, saveDB } from './database';
import { Chantier, Collaborateur, AvancementUpdate } from '../types';
import { format } from 'date-fns';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getAllChantiers(): Promise<Chantier[]> {
  return getDB().chantiers.filter((c) => c.statut !== 'Annulé').sort(
    (a, b) => b.dateDebut.localeCompare(a.dateDebut)
  );
}

export async function getChantierById(id: string): Promise<Chantier | null> {
  return getDB().chantiers.find((c) => c.id === id) ?? null;
}

export async function createChantier(data: Omit<Chantier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chantier> {
  const db = getDB();
  const now = format(new Date(), 'yyyy-MM-dd');
  const ch: Chantier = { id: uuid(), ...data, createdAt: now, updatedAt: now };
  db.chantiers.push(ch);
  await saveDB('chantiers');
  return ch;
}

export async function updateChantier(id: string, data: Partial<Chantier>): Promise<void> {
  const db = getDB();
  const idx = db.chantiers.findIndex((c) => c.id === id);
  if (idx !== -1) db.chantiers[idx] = { ...db.chantiers[idx], ...data, updatedAt: format(new Date(), 'yyyy-MM-dd') };
  await saveDB('chantiers');
}

export async function updateAvancement(chantierId: string, avancement: number, notes: string): Promise<void> {
  const db = getDB();
  await updateChantier(chantierId, { avancement, notes });
  db.avancement_updates.push({
    id: uuid(), chantierId, avancement, notes,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
  });
  await saveDB('avancement_updates');
}

export async function getAvancementHistory(chantierId: string): Promise<AvancementUpdate[]> {
  return getDB().avancement_updates.filter((u) => u.chantierId === chantierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCollaborateursForChantier(chantierId: string): Promise<Collaborateur[]> {
  const db = getDB();
  const ids = db.chantier_collaborateurs.filter((cc) => cc.chantierId === chantierId).map((cc) => cc.collaborateurId);
  return db.collaborateurs.filter((c) => ids.includes(c.id) && c.actif);
}

export async function setCollaborateursForChantier(chantierId: string, collaborateurIds: string[]): Promise<void> {
  const db = getDB();
  db.chantier_collaborateurs = [
    ...db.chantier_collaborateurs.filter((cc) => cc.chantierId !== chantierId),
    ...collaborateurIds.map((collaborateurId) => ({ chantierId, collaborateurId })),
  ];
  await saveDB('chantier_collaborateurs');
}

export async function deleteChantier(id: string): Promise<void> {
  const db = getDB();
  db.chantiers = db.chantiers.filter((c) => c.id !== id);
  db.chantier_collaborateurs = db.chantier_collaborateurs.filter((cc) => cc.chantierId !== id);
  db.avancement_updates = db.avancement_updates.filter((u) => u.chantierId !== id);
  await Promise.all([saveDB('chantiers'), saveDB('chantier_collaborateurs'), saveDB('avancement_updates')]);
}

export async function getChantiersForCollaborateur(collaborateurId: string, dateDebut: string, dateFin: string): Promise<Chantier[]> {
  const db = getDB();
  const ids = db.chantier_collaborateurs
    .filter((cc) => cc.collaborateurId === collaborateurId)
    .map((cc) => cc.chantierId);
  return db.chantiers.filter(
    (ch) => ids.includes(ch.id) && ch.statut !== 'Annulé' && ch.dateDebut <= dateFin && ch.dateFin >= dateDebut
  );
}
