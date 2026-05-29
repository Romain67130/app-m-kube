import * as FileSystem from 'expo-file-system';
import { getDB, saveDB } from './database';
import { ChantierDocument } from '../types';
import { format } from 'date-fns';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** Dossier persistant pour les documents d'un chantier */
function chantierDir(chantierId: string): string {
  return `${FileSystem.documentDirectory}mkube_docs/${chantierId}/`;
}

export async function getDocumentsForChantier(chantierId: string): Promise<ChantierDocument[]> {
  return getDB().documents
    .filter((d) => d.chantierId === chantierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Copie le fichier temporaire (uri du picker) dans le stockage permanent de l'app,
 * enregistre les métadonnées et retourne le document créé.
 */
export async function addDocument(
  chantierId: string,
  nom: string,
  tempUri: string,
  mimeType: string,
  taille?: number,
): Promise<ChantierDocument> {
  const dir = chantierDir(chantierId);
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  // Évite les collisions de noms
  const id = uuid();
  const ext = nom.includes('.') ? nom.split('.').pop() : '';
  const destUri = `${dir}${id}${ext ? '.' + ext : ''}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });

  const doc: ChantierDocument = {
    id,
    chantierId,
    nom,
    uri: destUri,
    mimeType,
    taille,
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
  };
  getDB().documents.push(doc);
  await saveDB('documents');
  return doc;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = getDB();
  const doc = db.documents.find((d) => d.id === id);
  if (doc) {
    try { await FileSystem.deleteAsync(doc.uri, { idempotent: true }); } catch (_) {}
  }
  db.documents = db.documents.filter((d) => d.id !== id);
  await saveDB('documents');
}

/** Supprime tous les documents d'un chantier (utile lors de la suppression du chantier) */
export async function deleteDocumentsForChantier(chantierId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(chantierDir(chantierId), { idempotent: true });
  } catch (_) {}
  const db = getDB();
  db.documents = db.documents.filter((d) => d.chantierId !== chantierId);
  await saveDB('documents');
}
