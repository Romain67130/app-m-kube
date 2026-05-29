export interface Collaborateur {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  telephone?: string;
  actif: boolean;
  type?: 'interne' | 'sous-traitant';
  entreprise?: string;
  createdAt: string;
}

export interface Chantier {
  id: string;
  nom: string;
  client: string;
  adresse: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  avancement: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChantierCollaborateur {
  chantierId: string;
  collaborateurId: string;
}

export interface Absence {
  id: string;
  collaborateurId: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  commentaire: string;
  createdAt: string;
}

export interface Horaire {
  id: string;
  collaborateurId: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  pauseMinutes: number;
  notes: string;
}

export interface AvancementUpdate {
  id: string;
  chantierId: string;
  avancement: number;
  notes: string;
  createdAt: string;
}

export interface Intervention {
  id: string;
  chantierId: string;
  collaborateurId: string;
  dateDebut: string;
  dateFin: string;
  nom?: string;
  notes: string;
}

export interface PlanningEntry {
  date: string;
  collaborateur: Collaborateur;
  chantiers: Chantier[];
  absence?: Absence;
  horaire?: Horaire;
}
