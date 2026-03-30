import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  setNestedValue,
  ensureDefaults,
  toMs,
  sortNotes,
  cleanForExport,
  DEFAULT_CHARACTER,
} from '../utils.js';

// ─── getNestedValue ──────────────────────────────────

describe('getNestedValue', () => {
  it('accède à une clé simple', () => {
    expect(getNestedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('accède à un chemin imbriqué avec dots', () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('accède à un index de tableau via dot', () => {
    expect(getNestedValue({ arr: [10, 20, 30] }, 'arr.1')).toBe(20);
  });

  it('accède à un index de tableau via crochets', () => {
    expect(getNestedValue({ arr: [10, 20, 30] }, 'arr[2]')).toBe(30);
  });

  it('retourne undefined pour un chemin inexistant', () => {
    expect(getNestedValue({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('retourne undefined pour un intermédiaire null', () => {
    expect(getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('gère un chemin mixte objets/tableaux', () => {
    const obj = { disciplines: [{ nom: 'Domination', niveau: 3 }] };
    expect(getNestedValue(obj, 'disciplines.0.nom')).toBe('Domination');
  });
});

// ─── setNestedValue ──────────────────────────────────

describe('setNestedValue', () => {
  it('modifie une clé simple', () => {
    const obj = { a: 1 };
    setNestedValue(obj, 'a', 5);
    expect(obj.a).toBe(5);
  });

  it('modifie un chemin imbriqué', () => {
    const obj = { a: { b: 1 } };
    setNestedValue(obj, 'a.b', 99);
    expect(obj.a.b).toBe(99);
  });

  it('modifie un élément de tableau par index', () => {
    const obj = { arr: [0, 0, 0] };
    setNestedValue(obj, 'arr.1', 42);
    expect(obj.arr[1]).toBe(42);
  });

  it('modifie un champ dans un objet de tableau', () => {
    const obj = { disciplines: [{ nom: '', niveau: 0 }] };
    setNestedValue(obj, 'disciplines.0.niveau', 3);
    expect(obj.disciplines[0].niveau).toBe(3);
  });

  it('mute l\'objet original', () => {
    const obj = { x: 1 };
    setNestedValue(obj, 'x', 2);
    expect(obj.x).toBe(2);
  });
});

// ─── toMs ──────────────────────────────────

describe('toMs', () => {
  it('retourne 0 pour null', () => {
    expect(toMs(null)).toBe(0);
  });

  it('retourne 0 pour undefined', () => {
    expect(toMs(undefined)).toBe(0);
  });

  it('convertit un timestamp Firestore {seconds}', () => {
    expect(toMs({ seconds: 1000 })).toBe(1000000);
  });

  it('convertit un objet Date', () => {
    const d = new Date(1609459200000);
    expect(toMs(d)).toBe(1609459200000);
  });

  it('retourne 0 pour un objet sans seconds ni Date', () => {
    expect(toMs({ foo: 'bar' })).toBe(0);
  });
});

// ─── sortNotes ──────────────────────────────────

describe('sortNotes', () => {
  const notes = [
    { id: 'a', createdAt: { seconds: 100 }, customOrder: 2 },
    { id: 'b', createdAt: { seconds: 300 }, customOrder: 0 },
    { id: 'c', createdAt: { seconds: 200 }, customOrder: 1 },
  ];

  it('chronoDesc trie les plus récentes en premier', () => {
    const result = sortNotes(notes, 'chronoDesc');
    expect(result.map(n => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('chronoAsc trie les plus anciennes en premier', () => {
    const result = sortNotes(notes, 'chronoAsc');
    expect(result.map(n => n.id)).toEqual(['a', 'c', 'b']);
  });

  it('custom trie par customOrder', () => {
    const result = sortNotes(notes, 'custom');
    expect(result.map(n => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('ne mute pas le tableau original', () => {
    const original = [...notes];
    sortNotes(notes, 'chronoDesc');
    expect(notes.map(n => n.id)).toEqual(original.map(n => n.id));
  });

  it('mode inconnu retourne le même ordre', () => {
    const result = sortNotes(notes, 'unknown');
    expect(result.map(n => n.id)).toEqual(['a', 'b', 'c']);
  });
});

// ─── cleanForExport ──────────────────────────────────

describe('cleanForExport', () => {
  it('supprime id, createdAt, updatedAt', () => {
    const char = { id: '123', nom: 'Test', createdAt: { seconds: 1 }, updatedAt: { seconds: 2 } };
    const result = cleanForExport(char);
    expect(result.id).toBeUndefined();
    expect(result.createdAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
  });

  it('conserve tous les autres champs', () => {
    const char = { id: '1', nom: 'Vlad', clan: 'Tzimisce', createdAt: {}, updatedAt: {} };
    const result = cleanForExport(char);
    expect(result.nom).toBe('Vlad');
    expect(result.clan).toBe('Tzimisce');
  });

  it('ne mute pas l\'objet original', () => {
    const char = { id: '1', nom: 'Test', createdAt: {}, updatedAt: {} };
    cleanForExport(char);
    expect(char.id).toBe('1');
  });
});

// ─── DEFAULT_CHARACTER ──────────────────────────────────

describe('DEFAULT_CHARACTER', () => {
  it('a 9 attributs tous à 1', () => {
    const attrs = DEFAULT_CHARACTER.attributs;
    const keys = Object.keys(attrs);
    expect(keys).toHaveLength(9);
    keys.forEach(k => expect(attrs[k]).toBe(1));
  });

  it('a 27 compétences toutes à 0', () => {
    const comps = DEFAULT_CHARACTER.competences;
    const keys = Object.keys(comps);
    expect(keys).toHaveLength(27);
    keys.forEach(k => expect(comps[k]).toBe(0));
  });

  it('santé et volonté sont des tableaux de 10', () => {
    expect(DEFAULT_CHARACTER.sante).toHaveLength(10);
    expect(DEFAULT_CHARACTER.volonte).toHaveLength(10);
  });

  it('a 6 disciplines avec 4 pouvoirs chacune', () => {
    expect(DEFAULT_CHARACTER.disciplines).toHaveLength(6);
    DEFAULT_CHARACTER.disciplines.forEach(d => {
      expect(d.pouvoirs).toHaveLength(4);
    });
  });

  it('a 11 avantages/handicaps', () => {
    expect(DEFAULT_CHARACTER.avantagesHandicaps).toHaveLength(11);
  });

  it('humanité à 7, puissance du sang à 1, soif à 0', () => {
    expect(DEFAULT_CHARACTER.humanite).toBe(7);
    expect(DEFAULT_CHARACTER.puissanceSang).toBe(1);
    expect(DEFAULT_CHARACTER.soif).toBe(0);
  });
});

// ─── ensureDefaults ──────────────────────────────────

describe('ensureDefaults', () => {
  it('remplit un objet vide avec tous les défauts', () => {
    const char = {};
    ensureDefaults(char);
    expect(char.attributs).toBeDefined();
    expect(Object.keys(char.attributs)).toHaveLength(9);
    expect(Object.keys(char.competences)).toHaveLength(27);
    expect(char.sante).toHaveLength(10);
    expect(char.volonte).toHaveLength(10);
    expect(char.disciplines).toHaveLength(6);
    expect(char.avantagesHandicaps).toHaveLength(11);
    expect(char.humanite).toBe(7);
    expect(char.puissanceSang).toBe(1);
    expect(char.nom).toBe('');
    expect(char.portrait).toBe('');
  });

  it('préserve les valeurs existantes', () => {
    const char = { nom: 'Vlad', clan: 'Tzimisce', humanite: 4, soif: 3 };
    ensureDefaults(char);
    expect(char.nom).toBe('Vlad');
    expect(char.clan).toBe('Tzimisce');
    expect(char.humanite).toBe(4);
    expect(char.soif).toBe(3);
  });

  it('préserve soif à 0 (nullish coalescing)', () => {
    const char = { soif: 0 };
    ensureDefaults(char);
    expect(char.soif).toBe(0);
  });

  it('complète un tableau santé trop court', () => {
    const char = { sante: [1, 2, 0] };
    ensureDefaults(char);
    expect(char.sante).toHaveLength(10);
    expect(char.sante[0]).toBe(1);
    expect(char.sante[1]).toBe(2);
    expect(char.sante[3]).toBe(0);
  });

  it('complète les disciplines manquantes à 6', () => {
    const char = { disciplines: [{ nom: 'Auspex', niveau: 2, pouvoirs: ['Sens accrus'] }] };
    ensureDefaults(char);
    expect(char.disciplines).toHaveLength(6);
    expect(char.disciplines[0].nom).toBe('Auspex');
    expect(char.disciplines[0].pouvoirs).toHaveLength(4);
    expect(char.disciplines[0].pouvoirs[0]).toBe('Sens accrus');
  });

  it('complète les avantagesHandicaps manquants à 11', () => {
    const char = { avantagesHandicaps: [{ nom: 'Ressources', niveau: 3 }] };
    ensureDefaults(char);
    expect(char.avantagesHandicaps).toHaveLength(11);
    expect(char.avantagesHandicaps[0].nom).toBe('Ressources');
    expect(char.avantagesHandicaps[0].niveau).toBe(3);
  });
});
