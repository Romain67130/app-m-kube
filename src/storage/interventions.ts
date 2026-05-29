import { getDB, saveDB } from './database';
import { Intervention, Chantier } from '../types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getInterventionsForChantier(chantierId: string): Promise<Intervention[]> {
  return getDB().interventions
    .filter((i) => i.chantierId === chantierId)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
}

export async function getInterventionsForCollaborateur(
  collaborateurId: string,
  dateDebut: string,
  dateFin: string
): Promise<Intervention[]> {
  return getDB().interventions.filter(
    (i) => i.collaborateurId === collaborateurId && i.dateDebut <= dateFin && i.dateFin >= dateDebut
  );
}

export async function createIntervention(data: Omit<Intervention, 'id'>): Promise<Intervention> {
  const db = getDB();
  const intervention: Intervention = { id: uuid(), ...data };
  db.interventions.push(intervention);
  await saveDB('interventions');
  return intervention;
}

export async function updateIntervention(
  id: string,
  data: Partial<Omit<Intervention, 'id'>>
): Promise<void> {
  const db = getDB();
  const idx = db.interventions.findIndex((i) => i.id === id);
  if (idx !== -1) {
    db.interventions[idx] = { ...db.interventions[idx], ...data };
    await saveDB('interventions');
  }
}

export async function deleteIntervention(id: string): Promise<void> {
  const db = getDB();
  db.interventions = db.interventions.filter((i) => i.id !== id);
  await saveDB('interventions');
}

export async function getChantiersForCollaborateurViaInterventions(
  collaborateurId: string,
  dateDebut: string,
  dateFin: string
) {
  const db = getDB();
  const interventions = await getInterventionsForCollaborateur(collaborateurId, dateDebut, dateFin);

  if (interventions.length === 0) return [];

  const chantierIds = [...new Set(interventions.map((i) => i.chantierId))];
  return db.chantiers.filter((ch) => chantierIds.includes(ch.id) && ch.statut !== 'Annulé');
}

export function getAllInterventions(): Intervention[] {
  return getDB().interventions;
}

/**
 * Retourne tous les chantiers (+ intervention associée) actifs pour un collaborateur
 * à une date précise. Lecture directe du cache mémoire — aucun état intermédiaire.
 */
export function getChantierItemsForDay(
  collaborateurId: string,
  date: string,
): { ch: Chantier; int: Intervention }[] {
  const db = getDB();
  const result: { ch: Chantier; int: Intervention }[] = [];
  for (const int of db.interventions) {
    if (
      int.collaborateurId === collaborateurId &&
      int.dateDebut <= date &&
      int.dateFin >= date
    ) {
      const ch = db.chantiers.find((c) => c.id === int.chantierId && c.statut !== 'Annulé');
      if (ch) result.push({ ch, int });
    }
  }
  return result;
}

export function getInterventionForDay(
  collaborateurId: string,
  chantierId: string,
  date: string
): Intervention | undefined {
  return getDB().interventions.find(
    (i) => i.collaborateurId === collaborateurId && i.chantierId === chantierId
      && i.dateDebut <= date && i.dateFin >= date
  );
}
