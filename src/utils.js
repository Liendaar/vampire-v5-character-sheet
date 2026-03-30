// ─── Pure utility functions (testable, no DOM / Firebase dependency) ─────

// ─── Nested Object Access ──────────────────────────────────

export function getNestedValue(obj, path) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const key of keys) {
    const k = /^\d+$/.test(key) ? parseInt(key) : key;
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
}

export function setNestedValue(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = /^\d+$/.test(keys[i]) ? parseInt(keys[i]) : keys[i];
    current = current[k];
  }
  const lastKey = /^\d+$/.test(keys[keys.length - 1]) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
  current[lastKey] = value;
}

// ─── Timestamp Conversion ──────────────────────────────────

export function toMs(ts) {
  if (!ts) return 0;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

// ─── Notes Sorting ──────────────────────────────────

export function sortNotes(notes, mode) {
  const sorted = [...notes];
  switch (mode) {
    case 'chronoDesc':
      return sorted.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
    case 'chronoAsc':
      return sorted.sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
    case 'custom':
      return sorted.sort((a, b) => (a.customOrder || 0) - (b.customOrder || 0));
    default:
      return sorted;
  }
}

// ─── Character Export ──────────────────────────────────

export function cleanForExport(char) {
  const data = { ...char };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  return data;
}

// ─── Default Character ──────────────────────────────────

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

// ─── Ensure Defaults ──────────────────────────────────

export function ensureDefaults(char) {
  char.attributs = char.attributs || { force: 1, dexterite: 1, vigueur: 1, charisme: 1, manipulation: 1, sangFroid: 1, intelligence: 1, astuce: 1, resolution: 1 };
  char.competences = char.competences || {};
  const defaultComps = ['armesAfeu', 'artisanat', 'athletisme', 'bagarre', 'conduite', 'furtivite', 'larcin', 'melee', 'survie', 'animaux', 'commandement', 'empathie', 'etiquette', 'experienceRue', 'intimidation', 'persuasion', 'representation', 'subterfuge', 'erudition', 'finances', 'investigation', 'medecine', 'occultisme', 'politique', 'sciences', 'technologie', 'vigilance'];
  for (const k of defaultComps) char.competences[k] = char.competences[k] || 0;

  char.sante = char.sante || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  char.volonte = char.volonte || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (char.sante.length < 10) char.sante = [...char.sante, ...Array(10 - char.sante.length).fill(0)];
  if (char.volonte.length < 10) char.volonte = [...char.volonte, ...Array(10 - char.volonte.length).fill(0)];

  if (!char.disciplines || char.disciplines.length < 6) {
    char.disciplines = char.disciplines || [];
    while (char.disciplines.length < 6) char.disciplines.push({ nom: '', niveau: 0, pouvoirs: ['', '', '', ''] });
  }
  for (const d of char.disciplines) {
    d.pouvoirs = d.pouvoirs || ['', '', '', ''];
    while (d.pouvoirs.length < 4) d.pouvoirs.push('');
  }

  if (!char.avantagesHandicaps || char.avantagesHandicaps.length < 11) {
    char.avantagesHandicaps = char.avantagesHandicaps || [];
    while (char.avantagesHandicaps.length < 11) char.avantagesHandicaps.push({ nom: '', niveau: 0 });
  }

  char.soif = char.soif ?? 0;
  char.humanite = char.humanite ?? 7;
  char.puissanceSang = char.puissanceSang ?? 1;
  char.experienceTotale = char.experienceTotale ?? 0;
  char.experienceDepensee = char.experienceDepensee ?? 0;

  const textFields = ['nom', 'concept', 'predateur', 'chronique', 'ambition', 'clan', 'sire', 'desir', 'generation', 'resonance', 'principesChronique', 'attachesConvictions', 'fleauClan', 'coupDeSang', 'degatsRegeneres', 'bonusPouvoirs', 'relanceExaltation', 'penaliteNourrir', 'scoreFLeau', 'ageVeritable', 'ageApparent', 'dateNaissance', 'dateDeces', 'apparence', 'signesDistinctifs', 'historique', 'notes'];
  for (const f of textFields) char[f] = char[f] || '';
  char.portrait = char.portrait || '';
}
