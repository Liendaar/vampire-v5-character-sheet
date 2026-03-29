import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  writeBatch, serverTimestamp, query, orderBy, where
} from 'firebase/firestore';
import { db } from './firebase.js';

// ─── Paths ──────────────────────────────────

function sectionsCol(uid, charId) {
  return collection(db, 'users', uid, 'characters', charId, 'noteSections');
}

function sectionDoc(uid, charId, sectionId) {
  return doc(db, 'users', uid, 'characters', charId, 'noteSections', sectionId);
}

function notesCol(uid, charId) {
  return collection(db, 'users', uid, 'characters', charId, 'noteItems');
}

function noteDoc(uid, charId, noteId) {
  return doc(db, 'users', uid, 'characters', charId, 'noteItems', noteId);
}

// ─── Sections ──────────────────────────────────

export async function listSections(uid, charId) {
  const q = query(sectionsCol(uid, charId), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createSection(uid, charId, title) {
  const existing = await listSections(uid, charId);
  const maxOrder = existing.reduce((max, s) => Math.max(max, s.order || 0), 0);
  const ref = await addDoc(sectionsCol(uid, charId), {
    title,
    order: maxOrder + 1,
    sortMode: 'chronoDesc',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSection(uid, charId, sectionId, data) {
  await updateDoc(sectionDoc(uid, charId, sectionId), data);
}

export async function deleteSection(uid, charId, sectionId) {
  // Delete all notes in this section first
  const notes = await listNotesBySection(uid, charId, sectionId);
  const batch = writeBatch(db);
  for (const n of notes) {
    batch.delete(noteDoc(uid, charId, n.id));
  }
  batch.delete(sectionDoc(uid, charId, sectionId));
  await batch.commit();
}

export async function reorderSections(uid, charId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(sectionDoc(uid, charId, id), { order: index });
  });
  await batch.commit();
}

// ─── Notes ──────────────────────────────────

export async function listNotesBySection(uid, charId, sectionId) {
  const q = query(notesCol(uid, charId), where('sectionId', '==', sectionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listAllNotes(uid, charId) {
  const snap = await getDocs(notesCol(uid, charId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createNote(uid, charId, sectionId) {
  const existing = await listNotesBySection(uid, charId, sectionId);
  const maxOrder = existing.reduce((max, n) => Math.max(max, n.customOrder || 0), 0);
  const ref = await addDoc(notesCol(uid, charId), {
    sectionId,
    title: '',
    content: '',
    customOrder: maxOrder + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNote(uid, charId, noteId, data) {
  await updateDoc(noteDoc(uid, charId, noteId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(uid, charId, noteId) {
  await deleteDoc(noteDoc(uid, charId, noteId));
}

export async function reorderNotes(uid, charId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(noteDoc(uid, charId, id), { customOrder: index });
  });
  await batch.commit();
}

// ─── Export / Import ──────────────────────────────────

export async function exportAllNotes(uid, charId) {
  const sections = await listSections(uid, charId);
  const allNotes = await listAllNotes(uid, charId);

  return sections.map(s => {
    const sectionNotes = allNotes
      .filter(n => n.sectionId === s.id)
      .map(n => ({
        title: n.title || '',
        content: n.content || '',
        customOrder: n.customOrder || 0,
      }));
    return {
      title: s.title || '',
      order: s.order || 0,
      sortMode: s.sortMode || 'chronoDesc',
      notes: sectionNotes,
    };
  });
}

export async function importAllNotes(uid, charId, sectionsData) {
  // Delete existing notes and sections
  const existingSections = await listSections(uid, charId);
  for (const s of existingSections) {
    await deleteSection(uid, charId, s.id);
  }

  // Re-create from import data
  for (const s of sectionsData) {
    const sRef = await addDoc(sectionsCol(uid, charId), {
      title: s.title || '',
      order: s.order || 0,
      sortMode: s.sortMode || 'chronoDesc',
      createdAt: serverTimestamp(),
    });
    for (const n of (s.notes || [])) {
      await addDoc(notesCol(uid, charId), {
        sectionId: sRef.id,
        title: n.title || '',
        content: n.content || '',
        customOrder: n.customOrder || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}
