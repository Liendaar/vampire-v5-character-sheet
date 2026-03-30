// ─── Référentiel des Clans V5 ─────────────────────────
// Source : https://vtm.paradoxwikis.com/Clans

export const CLANS = [
  {
    id: 'banu-haqim',
    nom: 'Banu Haqim',
    description: 'Juges, intellectuels et assassins ; autrefois connus comme les Assamites.',
    disciplines: ['Sorcellerie du Sang', 'Célérité', 'Obscurcissement'],
    fleau: "Addiction au sang : en se nourrissant du sang d'un autre vampire, le Banu Haqim doit réussir un test de frénésie de Soif (difficulté 2 + Sévérité du Fléau) ou se gorger de vitae.",
  },
  {
    id: 'brujah',
    nom: 'Brujah',
    description: 'Rebelles, activistes et philosophes guerriers qui défient le statu quo.',
    disciplines: ['Célérité', 'Puissance', 'Présence'],
    fleau: "Rage bouillonnante : la moindre provocation peut déclencher une frénésie furieuse. Pénalité aux tests de frénésie de fureur basée sur la Sévérité du Fléau.",
  },
  {
    id: 'gangrel',
    nom: 'Gangrel',
    description: 'Les plus proches de leur Bête intérieure, entre guerriers sauvages et nomades urbains.',
    disciplines: ['Animalisme', "Force d'Âme", 'Protéisme'],
    fleau: "Traits bestiaux : en frénésie, le Gangrel acquiert un ou plusieurs traits animaux (physiques). Chaque trait réduit un Attribut de 1 (selon la Sévérité du Fléau).",
  },
  {
    id: 'hecata',
    nom: 'Hecata',
    description: 'Nécromanciens, pilleurs de tombes et érudits de la mort, réunissant plusieurs lignées.',
    disciplines: ['Auspex', "Force d'Âme", 'Oblivion'],
    fleau: "Morsure douloureuse : le Baiser des Hecata est agonisant au lieu d'être agréable. La victime doit être immobilisée ou consentante. Inflige des dégâts supplémentaires égaux à la Sévérité du Fléau.",
  },
  {
    id: 'lasombra',
    nom: 'Lasombra',
    description: "Maîtres des ombres, figures religieuses et manipulateurs, récemment ralliés à la Camarilla.",
    disciplines: ['Domination', 'Oblivion', 'Puissance'],
    fleau: "Image distordue : les reflets et enregistrements du Lasombra sont déformés. Tests de difficulté 2 + Sévérité du Fléau pour utiliser la technologie moderne (téléphones, micros).",
  },
  {
    id: 'malkavien',
    nom: 'Malkavien',
    description: 'Oracles et bouffons frappés de folie surnaturelle, maîtres de la psychologie.',
    disciplines: ['Auspex', 'Domination', 'Obscurcissement'],
    fleau: "Folie : chaque Malkavien souffre d'au moins un trouble mental qui ne peut être guéri. En cas de Compulsion de clan, un épisode aigu se déclenche.",
  },
  {
    id: 'ministere',
    nom: 'Le Ministère',
    description: "Anciens Disciples de Set, cherchant la liberté par la tentation et la révélation.",
    disciplines: ['Obscurcissement', 'Présence', 'Protéisme'],
    fleau: "Sensibilité à la lumière : les Ministres souffrent davantage de la lumière vive. Pénalité égale à la Sévérité du Fléau à tous les jets sous lumière intense (y compris le feu).",
  },
  {
    id: 'nosferatu',
    nom: 'Nosferatu',
    description: "Affligés d'une laideur surnaturelle permanente, collecteurs de secrets et d'informations.",
    disciplines: ['Animalisme', 'Obscurcissement', 'Puissance'],
    fleau: "Hideur : les Nosferatu ont toujours un score de 0 en apparence. Ils échouent automatiquement aux tests sociaux basés sur l'apparence et risquent de violer la Mascarade s'ils sont vus.",
  },
  {
    id: 'ravnos',
    nom: 'Ravnos',
    description: "Clan nomade de maîtres de l'illusion et de la tromperie.",
    disciplines: ['Animalisme', 'Obscurcissement', 'Présence'],
    fleau: "Malédiction du dormeur : un Ravnos en torpeur peut périr dans des flammes surnaturelles. Il doit réussir un test de Vigueur + Résolution (difficulté = Sévérité du Fléau) chaque nuit de torpeur.",
  },
  {
    id: 'salubri',
    nom: 'Salubri',
    description: 'Guérisseurs et inquisiteurs choisis avec soin par leur sire pour accomplir une mission.',
    disciplines: ['Auspex', "Force d'Âme", 'Domination'],
    fleau: "Troisième œil : quand un Salubri utilise une Discipline, un troisième œil s'ouvre sur son front et pleure du sang. Impossible à cacher sauf par Obscurcissement.",
  },
  {
    id: 'toreador',
    nom: 'Toréador',
    description: "Chercheurs d'émotion, de beauté et de romance, artistes et mondains.",
    disciplines: ['Auspex', 'Célérité', 'Présence'],
    fleau: "Obsession esthétique : le Toréador peut être fasciné par la beauté (ou la laideur extrême). Doit réussir un test de Résolution + Sang-froid pour se détacher. La difficulté augmente avec la Sévérité du Fléau.",
  },
  {
    id: 'tremere',
    nom: 'Tremere',
    description: "Érudits de l'occulte et gardiens des secrets sorciers, autrefois organisés en pyramide.",
    disciplines: ['Auspex', 'Sorcellerie du Sang', 'Domination'],
    fleau: "Lien de Sang déficient : les Tremere ne peuvent pas créer de Lien de Sang sur d'autres vampires. Ils peuvent toujours lier des mortels mais nécessitent des boissons supplémentaires (= Sévérité du Fléau).",
  },
  {
    id: 'tzimisce',
    nom: 'Tzimisce',
    description: "Les Dragons, ce clan Étreint pour posséder. Ils dominent par le contrôle et la peur.",
    disciplines: ['Animalisme', 'Domination', 'Protéisme'],
    fleau: "Territorialité : le Tzimisce doit dormir entouré de sa terre natale ou d'un objet de grande importance. Sans cela, il subit des dégâts superficiels de Volonté (= Sévérité du Fléau) chaque nuit.",
  },
  {
    id: 'ventrue',
    nom: 'Ventrue',
    description: "Aristocratie vampirique, gardiens des Traditions et piliers de la Camarilla.",
    disciplines: ['Domination', "Force d'Âme", 'Présence'],
    fleau: "Goût raffiné : chaque Ventrue ne peut se nourrir que d'un type spécifique de mortels (profession, groupe sanguin, émotion, etc.). Le sang des autres ne nourrit pas.",
  },
  {
    id: 'caitiff',
    nom: 'Caitiff',
    description: "Sans clan et sans fléau héréditaire, parias de la société vampirique.",
    disciplines: [],
    fleau: "Aucun fléau de clan. Les Caitiff n'ont pas de disciplines de clan — ils peuvent choisir librement mais l'expérience coûte plus cher.",
  },
  {
    id: 'sang-clair',
    nom: 'Sang-Clair',
    description: "Trop éloignés de Caïn pour partager pleinement sa malédiction ou ses bénéfices.",
    disciplines: ['Alchimie des Sang-Clairs'],
    fleau: "Sang faible : puissance de vitae réduite, capacités surnaturelles limitées. Peuvent marcher au soleil (avec précaution) et manger de la nourriture.",
  },
];

// ─── Helpers ──────────────────────────────────

export function getClanByName(nom) {
  return CLANS.find(c => c.nom === nom);
}

export function getClanNames() {
  return CLANS.map(c => c.nom);
}

export function getClanDisciplines(clanName) {
  const clan = getClanByName(clanName);
  return clan ? clan.disciplines : [];
}
