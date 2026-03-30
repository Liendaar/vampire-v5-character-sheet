import { describe, it, expect } from 'vitest';
import { CLANS, getClanByName, getClanNames, getClanDisciplines } from '../data/clans.js';
import { getDisciplineByName } from '../data/disciplines.js';

describe('CLANS référentiel', () => {
  it('contient 16 clans (14 + Caitiff + Sang-Clair)', () => {
    expect(CLANS).toHaveLength(16);
  });

  it('chaque clan a un id, nom, description et fleau', () => {
    for (const c of CLANS) {
      expect(c.id).toBeTruthy();
      expect(c.nom).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.fleau).toBeTruthy();
    }
  });

  it('les noms de clans sont uniques', () => {
    const names = CLANS.map(c => c.nom);
    expect(new Set(names).size).toBe(names.length);
  });

  it('chaque clan principal a exactement 3 disciplines', () => {
    const principaux = CLANS.filter(c => c.id !== 'caitiff' && c.id !== 'sang-clair');
    for (const c of principaux) {
      expect(c.disciplines).toHaveLength(3);
    }
  });

  it('les Caitiff n\'ont pas de disciplines de clan', () => {
    const caitiff = getClanByName('Caitiff');
    expect(caitiff.disciplines).toHaveLength(0);
  });

  it('les Sang-Clairs ont l\'Alchimie des Sang-Clairs', () => {
    const sc = getClanByName('Sang-Clair');
    expect(sc.disciplines).toContain('Alchimie des Sang-Clairs');
  });
});

describe('Cohérence clans ↔ disciplines', () => {
  it('toutes les disciplines de clan existent dans le référentiel', () => {
    for (const c of CLANS) {
      for (const discName of c.disciplines) {
        const ref = getDisciplineByName(discName);
        expect(ref, `${c.nom}: discipline "${discName}" introuvable`).toBeDefined();
      }
    }
  });
});

describe('getClanByName', () => {
  it('retourne le clan Brujah', () => {
    const c = getClanByName('Brujah');
    expect(c).toBeDefined();
    expect(c.disciplines).toContain('Célérité');
  });

  it('retourne undefined pour un clan inconnu', () => {
    expect(getClanByName('Baali')).toBeUndefined();
  });
});

describe('getClanNames', () => {
  it('retourne 16 noms', () => {
    expect(getClanNames()).toHaveLength(16);
  });
});

describe('getClanDisciplines', () => {
  it('retourne les 3 disciplines des Tremere', () => {
    const discs = getClanDisciplines('Tremere');
    expect(discs).toHaveLength(3);
    expect(discs).toContain('Auspex');
    expect(discs).toContain('Sorcellerie du Sang');
    expect(discs).toContain('Domination');
  });

  it('retourne un tableau vide pour un clan inconnu', () => {
    expect(getClanDisciplines('Inconnu')).toEqual([]);
  });

  it('auto-remplissage Gangrel = Animalisme, Force d\'Âme, Protéisme', () => {
    const discs = getClanDisciplines('Gangrel');
    expect(discs).toEqual(['Animalisme', "Force d'Âme", 'Protéisme']);
  });
});
