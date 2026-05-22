import { getDB, saveDB } from './database';
import { Horaire } from '../types';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getHorairesForWeek(collaborateurId: string, weekDate: Date): Promise<Horaire[]> {
  const debut = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const fin = format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return getDB().horaires.filter(
    (h) => h.collaborateurId === collaborateurId && h.date >= debut && h.date <= fin
  ).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getHorairesForPeriod(dateDebut: string, dateFin: string): Promise<Horaire[]> {
  return getDB().horaires.filter((h) => h.date >= dateDebut && h.date <= dateFin);
}

export async function saveHoraire(data: Omit<Horaire, 'id'>): Promise<void> {
  const db = getDB();
  const idx = db.horaires.findIndex(
    (h) => h.collaborateurId === data.collaborateurId && h.date === data.date
  );
  if (idx !== -1) {
    db.horaires[idx] = { ...db.horaires[idx], ...data };
  } else {
    db.horaires.push({ id: uuid(), ...data });
  }
  await saveDB('horaires');
}

export function calcHeuresTravaillees(h: Horaire): number {
  const [dh, dm] = h.heureDebut.split(':').map(Number);
  const [fh, fm] = h.heureFin.split(':').map(Number);
  const totalMinutes = (fh * 60 + fm) - (dh * 60 + dm) - h.pauseMinutes;
  return Math.max(0, totalMinutes / 60);
}

export function calcTotalSemaine(horaires: Horaire[]): number {
  return horaires.reduce((sum, h) => sum + calcHeuresTravaillees(h), 0);
}
