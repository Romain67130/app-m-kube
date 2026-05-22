import { getDB, saveDB } from './database';
import { format, addDays, subDays } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export async function seedDatabase(): Promise<void> {
  const db = getDB();
  if (db.seeded) return;

  db.collaborateurs = [
    { id: 'c1', nom: 'Bernard', prenom: 'Maxime', role: "Chef d'équipe", telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c2', nom: 'Renard', prenom: 'Fabien', role: "Chef d'équipe", telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c3', nom: 'Petrosyan', prenom: 'Gagik', role: 'Second poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c4', nom: 'Weber', prenom: 'Thomas', role: 'Poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c5', nom: 'Klein', prenom: 'Lucas', role: 'Poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c6', nom: 'Muller', prenom: 'Alexis', role: 'Poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c7', nom: 'Fischer', prenom: 'Nathan', role: 'Poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c8', nom: 'Roth', prenom: 'Julien', role: 'Poseur', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c9', nom: 'Lang', prenom: 'Pierre', role: 'Charpentier', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c10', nom: 'Gross', prenom: 'Simon', role: 'Charpentier', telephone: '', actif: true, createdAt: fmt(today) },
    { id: 'c11', nom: 'Wolf', prenom: 'Antoine', role: 'Soudeur', telephone: '', actif: true, createdAt: fmt(today) },
  ];

  db.chantiers = [
    {
      id: 'ch1', nom: 'Carport bois — Résidence Hoffmann', client: 'M. Hoffmann Eric',
      adresse: '12 rue des Vosges, 67000 Strasbourg',
      dateDebut: fmt(subDays(today, 5)), dateFin: fmt(addDays(today, 5)),
      statut: 'En cours', avancement: 60, notes: 'Pose des pannes en cours. RAS côté client.',
      createdAt: fmt(today), updatedAt: fmt(today),
    },
    {
      id: 'ch2', nom: 'Structure métallique — Entrepôt Muller SA', client: 'Muller SA',
      adresse: 'Zone industrielle Nord, 68100 Mulhouse',
      dateDebut: fmt(addDays(today, 3)), dateFin: fmt(addDays(today, 18)),
      statut: 'Planifié', avancement: 0, notes: 'Attente livraison acier.',
      createdAt: fmt(today), updatedAt: fmt(today),
    },
    {
      id: 'ch3', nom: 'Pergola aluminium — Maison Schneider', client: 'Mme Schneider Isabelle',
      adresse: "8 allée des Pins, 67200 Obernai",
      dateDebut: fmt(subDays(today, 15)), dateFin: fmt(subDays(today, 2)),
      statut: 'Terminé', avancement: 100, notes: 'Livraison et réception effectuées.',
      createdAt: fmt(today), updatedAt: fmt(today),
    },
    {
      id: 'ch4', nom: 'Ossature bois — Maison passive Dupont', client: 'M. et Mme Dupont',
      adresse: '3 chemin du Moulin, 67530 Boersch',
      dateDebut: fmt(addDays(today, 10)), dateFin: fmt(addDays(today, 35)),
      statut: 'Planifié', avancement: 0, notes: "Plans validés par l'architecte.",
      createdAt: fmt(today), updatedAt: fmt(today),
    },
    {
      id: 'ch5', nom: 'Auvent acier — Commerce Weber', client: 'Commerce Weber',
      adresse: "45 Grand'Rue, 67600 Sélestat",
      dateDebut: fmt(subDays(today, 8)), dateFin: fmt(addDays(today, 2)),
      statut: 'En cours', avancement: 80, notes: 'Finition peinture en cours.',
      createdAt: fmt(today), updatedAt: fmt(today),
    },
  ];

  db.chantier_collaborateurs = [
    { chantierId: 'ch1', collaborateurId: 'c1' },
    { chantierId: 'ch1', collaborateurId: 'c3' },
    { chantierId: 'ch1', collaborateurId: 'c4' },
    { chantierId: 'ch2', collaborateurId: 'c2' },
    { chantierId: 'ch2', collaborateurId: 'c9' },
    { chantierId: 'ch2', collaborateurId: 'c11' },
    { chantierId: 'ch4', collaborateurId: 'c2' },
    { chantierId: 'ch4', collaborateurId: 'c5' },
    { chantierId: 'ch5', collaborateurId: 'c1' },
    { chantierId: 'ch5', collaborateurId: 'c7' },
  ];

  db.absences = [
    {
      id: 'a1', collaborateurId: 'c10', type: 'Maladie',
      dateDebut: fmt(subDays(today, 3)), dateFin: fmt(addDays(today, 1)),
      commentaire: 'Arrêt médical', createdAt: fmt(today),
    },
    {
      id: 'a2', collaborateurId: 'c5', type: 'Congé payé',
      dateDebut: fmt(addDays(today, 7)), dateFin: fmt(addDays(today, 14)),
      commentaire: 'Vacances été', createdAt: fmt(today),
    },
  ];

  const lundi = new Date(today);
  lundi.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  let horId = 1;
  for (const colId of ['c1', 'c2', 'c3', 'c4']) {
    for (let j = 0; j < 5; j++) {
      db.horaires.push({
        id: `h${horId++}`, collaborateurId: colId,
        date: fmt(addDays(lundi, j)),
        heureDebut: '07:30', heureFin: '17:00', pauseMinutes: 45, notes: '',
      });
    }
  }

  db.seeded = true;
  await Promise.all([
    saveDB('collaborateurs'), saveDB('chantiers'), saveDB('chantier_collaborateurs'),
    saveDB('absences'), saveDB('horaires'), saveDB('seeded'),
  ]);
}
