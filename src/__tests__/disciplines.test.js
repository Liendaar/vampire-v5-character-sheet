import { describe, it, expect } from 'vitest';
import {
  DISCIPLINES,
  getDisciplineByName,
  getPowersForLevel,
  getDisciplineNames,
} from '../data/disciplines.js';
import { cleanForExport, DEFAULT_CHARACTER } from '../utils.js';

// ─── DISCIPLINES data integrity ──────────────────────────────────

describe('DISCIPLINES référentiel', () => {
  it('contient 12 disciplines', () => {
    expect(DISCIPLINES).toHaveLength(12);
  });

  it('chaque discipline a un id, nom, description et pouvoirs', () => {
    for (const d of DISCIPLINES) {
      expect(d.id).toBeTruthy();
      expect(d.nom).toBeTruthy();
      expect(d.description).toBeTruthy();
      expect(Array.isArray(d.pouvoirs)).toBe(true);
      expect(d.pouvoirs.length).toBeGreaterThan(0);
    }
  });

  it('chaque pouvoir a un niveau (1-5), un nom et un vo', () => {
    for (const d of DISCIPLINES) {
      for (const p of d.pouvoirs) {
        expect(p.niveau).toBeGreaterThanOrEqual(1);
        expect(p.niveau).toBeLessThanOrEqual(5);
        expect(p.nom).toBeTruthy();
        expect(p.vo).toBeTruthy();
      }
    }
  });

  it('les noms de disciplines sont uniques', () => {
    const names = DISCIPLINES.map(d => d.nom);
    expect(new Set(names).size).toBe(names.length);
  });

  it('les ids de disciplines sont uniques', () => {
    const ids = DISCIPLINES.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contient les disciplines principales de V5', () => {
    const names = DISCIPLINES.map(d => d.nom);
    const expected = [
      'Animalisme', 'Auspex', 'Sorcellerie du Sang', 'Célérité',
      'Domination', "Force d'Âme", 'Obscurcissement', 'Oblivion',
      'Puissance', 'Présence', 'Protéisme', 'Alchimie des Sang-Clairs',
    ];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('chaque discipline a des pouvoirs de niveau 1 et 5', () => {
    for (const d of DISCIPLINES) {
      const levels = d.pouvoirs.map(p => p.niveau);
      expect(levels).toContain(1);
      expect(levels).toContain(5);
    }
  });
});

// ─── getDisciplineByName ──────────────────────────────────

describe('getDisciplineByName', () => {
  it('retourne la discipline Animalisme', () => {
    const d = getDisciplineByName('Animalisme');
    expect(d).toBeDefined();
    expect(d.id).toBe('animalisme');
  });

  it('retourne la discipline Protéisme', () => {
    const d = getDisciplineByName('Protéisme');
    expect(d).toBeDefined();
    expect(d.pouvoirs.length).toBeGreaterThan(10);
  });

  it('retourne undefined pour une discipline inconnue', () => {
    expect(getDisciplineByName('Thaumaturgie')).toBeUndefined();
  });

  it('retourne undefined pour une chaîne vide', () => {
    expect(getDisciplineByName('')).toBeUndefined();
  });
});

// ─── getPowersForLevel ──────────────────────────────────

describe('getPowersForLevel', () => {
  it('filtre les pouvoirs par niveau', () => {
    const d = getDisciplineByName('Célérité');
    const lv1 = getPowersForLevel(d, 1);
    expect(lv1.length).toBeGreaterThanOrEqual(2);
    lv1.forEach(p => expect(p.niveau).toBe(1));
  });

  it('retourne un tableau vide pour un niveau sans pouvoir', () => {
    const d = getDisciplineByName('Célérité');
    const lv0 = getPowersForLevel(d, 0);
    expect(lv0).toHaveLength(0);
  });
});

// ─── getDisciplineNames ──────────────────────────────────

describe('getDisciplineNames', () => {
  it('retourne un tableau de 12 noms', () => {
    const names = getDisciplineNames();
    expect(names).toHaveLength(12);
    expect(names).toContain('Auspex');
    expect(names).toContain('Domination');
  });
});

// ─── Export/Import compatibility with disciplines ──────────────────────────────────

describe('Export/Import des disciplines', () => {
  it('cleanForExport préserve les disciplines standard', () => {
    const char = {
      id: '123',
      nom: 'Test',
      createdAt: {},
      updatedAt: {},
      disciplines: [
        { nom: 'Animalisme', niveau: 3, pouvoirs: ['Murmures sauvages', '', '', ''] },
      ],
    };
    const exported = cleanForExport(char);
    expect(exported.disciplines).toHaveLength(1);
    expect(exported.disciplines[0].nom).toBe('Animalisme');
    expect(exported.disciplines[0].pouvoirs[0]).toBe('Murmures sauvages');
  });

  it('cleanForExport préserve les disciplines personnalisées', () => {
    const char = {
      id: '456',
      nom: 'Custom',
      createdAt: {},
      updatedAt: {},
      disciplines: [
        { nom: 'Ma Discipline Maison', niveau: 2, pouvoirs: ['Pouvoir spécial', '', '', ''] },
      ],
    };
    const exported = cleanForExport(char);
    expect(exported.disciplines[0].nom).toBe('Ma Discipline Maison');
  });

  it('DEFAULT_CHARACTER a des disciplines importables', () => {
    const exported = cleanForExport({ ...DEFAULT_CHARACTER, id: '1', createdAt: {}, updatedAt: {} });
    expect(exported.disciplines).toHaveLength(6);
    expect(exported.disciplines[0].pouvoirs).toHaveLength(4);
  });
});
