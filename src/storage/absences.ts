import { getDB, saveDB } from './database';
import { Absence } from '../types';
import { format } from 'date-fns';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getAllAbsences(): Promise<Absence[]> {
  return [...getDB().absences].sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

export async function getAbsencesForCollaborateur(collaborateurId: string): Promise<Absence[]> {
  return getDB().absences
    .filter((a) => a.collaborateurId === collaborateurId)
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

export async function getAbsencesForPeriod(dateDebut: string, dateFin: string): Promise<Absence[]> {
  return getDB().absences.filter((a) => a.dateDebut <= dateFin && a.dateFin >= dateDebut);
}

export async function createAbsence(data: Omit<Absence, 'id' | 'createdAt'>): Promise<Absence> {
  const db = getDB();
  const a: Absence = { id: uuid(), ...data, createdAt: format(new Date(), 'yyyy-MM-dd') };
  db.absences.push(a);
  await saveDB('absences');
  return a;
}

export async function deleteAbsence(id: string): Promise<void> {
  const db = getDB();
  db.absences = db.absences.filter((a) => a.id !== id);
  await saveDB('absences');
}
