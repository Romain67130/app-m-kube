import { getDB, saveDB } from './database';
import { Collaborateur } from '../types';
import { format } from 'date-fns';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getAllCollaborateurs(): Promise<Collaborateur[]> {
  return getDB().collaborateurs.filter((c) => c.actif);
}

export async function createCollaborateur(
  data: Omit<Collaborateur, 'id' | 'createdAt' | 'actif'>
): Promise<Collaborateur> {
  const db = getDB();
  const newC: Collaborateur = { id: uuid(), ...data, actif: true, createdAt: format(new Date(), 'yyyy-MM-dd') };
  db.collaborateurs.push(newC);
  await saveDB('collaborateurs');
  return newC;
}

export async function updateCollaborateur(id: string, data: Partial<Collaborateur>): Promise<void> {
  const db = getDB();
  const idx = db.collaborateurs.findIndex((c) => c.id === id);
  if (idx !== -1) db.collaborateurs[idx] = { ...db.collaborateurs[idx], ...data };
  await saveDB('collaborateurs');
}

export async function deleteCollaborateur(id: string): Promise<void> {
  await updateCollaborateur(id, { actif: false });
}
