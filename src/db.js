import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from './firebase.js';

function charsCol(uid) {
  return collection(db, 'users', uid, 'characters');
}

function charDoc(uid, charId) {
  return doc(db, 'users', uid, 'characters', charId);
}

export const DEFAULT_CHARACTER = {
  nom: 'Nouveau personnage',
  concept: '',
  predateur: '',
  chronique: '',
  ambition: '',
  clan: '',
  sire: '',
  desir: '',
  generation: '',

  attributs: {
    force: 1, dexterite: 1, vigueur: 1,
    charisme: 1, manipulation: 1, sangFroid: 1,
    intelligence: 1, astuce: 1, resolution: 1,
  },

  competences: {
    armesAfeu: 0, artisanat: 0, athletisme: 0, bagarre: 0,
    conduite: 0, furtivite: 0, larcin: 0, melee: 0, survie: 0,
    animaux: 0, commandement: 0, empathie: 0, etiquette: 0,
    experienceRue: 0, intimidation: 0, persuasion: 0,
    representation: 0, subterfuge: 0,
    erudition: 0, finances: 0, investigation: 0, medecine: 0,
    occultisme: 0, politique: 0, sciences: 0, technologie: 0,
    vigilance: 0,
  },

  sante: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  volonte: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

  disciplines: [
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
    { nom: '', niveau: 0, pouvoirs: ['', '', '', ''] },
  ],

  resonance: '',
  soif: 0,
  humanite: 7,

  principesChronique: '',
  attachesConvictions: '',
  fleauClan: '',

  avantagesHandicaps: [
    { nom: '', niveau: 0 }, { nom: '', niveau: 0 }, { nom: '', niveau: 0 },
    { nom: '', niveau: 0 }, { nom: '', niveau: 0 }, { nom: '', niveau: 0 },
    { nom: '', niveau: 0 }, { nom: '', niveau: 0 }, { nom: '', niveau: 0 },
    { nom: '', niveau: 0 }, { nom: '', niveau: 0 },
  ],

  puissanceSang: 1,
  coupDeSang: '',
  degatsRegeneres: '',
  bonusPouvoirs: '',
  relanceExaltation: '',
  penaliteNourrir: '',
  scoreFLeau: '',

  experienceTotale: 0,
  experienceDepensee: 0,

  ageVeritable: '',
  ageApparent: '',
  dateNaissance: '',
  dateDeces: '',
  apparence: '',
  signesDistinctifs: '',
  historique: '',

  notes: '',
};

export async function createCharacter(uid) {
  const data = {
    ...structuredClone(DEFAULT_CHARACTER),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(charsCol(uid), data);
  return ref.id;
}

export async function getCharacter(uid, charId) {
  const snap = await getDoc(charDoc(uid, charId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listCharacters(uid) {
  const q = query(charsCol(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveCharacter(uid, charId, data) {
  const clean = { ...data };
  delete clean.id;
  delete clean.createdAt;
  clean.updatedAt = serverTimestamp();
  await updateDoc(charDoc(uid, charId), clean);
}

export async function deleteCharacter(uid, charId) {
  await deleteDoc(charDoc(uid, charId));
}

export async function importCharacter(uid, data) {
  const notesData = data._notes;
  const clean = { ...data };
  delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;
  delete clean._notes;
  clean.createdAt = serverTimestamp();
  clean.updatedAt = serverTimestamp();
  const ref = await addDoc(charsCol(uid), clean);
  return { id: ref.id, notesData };
}

export async function importToExistingCharacter(uid, charId, data) {
  const notesData = data._notes;
  const clean = { ...data };
  delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;
  delete clean._notes;
  clean.updatedAt = serverTimestamp();
  await updateDoc(charDoc(uid, charId), clean);
  return { notesData };
}

export function cleanForExport(char) {
  const data = { ...char };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  return data;
}
