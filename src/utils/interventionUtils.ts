import { Intervention } from '../types';

export type InterventionGroup = {
  key: string;
  nom?: string;
  dateDebut: string;
  dateFin: string;
  members: Intervention[];
  avancement: number;
};

export function groupInterventions(ints: Intervention[]): InterventionGroup[] {
  const map = new Map<string, Intervention[]>();
  for (const int of ints) {
    const key = `${int.nom ?? ''}_${int.dateDebut}_${int.dateFin}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(int);
  }
  return Array.from(map.entries()).map(([key, members]) => ({
    key,
    nom: members[0].nom,
    dateDebut: members[0].dateDebut,
    dateFin: members[0].dateFin,
    members,
    avancement: Math.round(
      members.reduce((s, i) => s + (i.avancement ?? 0), 0) / members.length,
    ),
  }));
}
