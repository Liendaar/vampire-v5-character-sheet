import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from './firebase.js';
import { DEFAULT_CHARACTER, cleanForExport } from './utils.js';
export { DEFAULT_CHARACTER, cleanForExport };

function charsCol(uid) {
  return collection(db, 'users', uid, 'characters');
}

function charDoc(uid, charId) {
  return doc(db, 'users', uid, 'characters', charId);
}

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
