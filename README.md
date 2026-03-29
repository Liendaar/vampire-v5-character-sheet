# Vampire: La Mascarade V5 - Gestionnaire de Fiches

Gestionnaire de fiches de personnage pour le jeu de rôle **Vampire: La Mascarade V5**, en français.

## Fonctionnalités

- Authentification Google (Firebase Auth)
- Création et gestion de plusieurs personnages par compte
- Fiche complète V5 fidèle à l'original :
  - Informations générales (Nom, Concept, Clan, Sire, Génération...)
  - Attributs (Physique, Social, Mental) avec dots interactifs
  - Compétences (27 compétences)
  - Trackers Santé et Volonté (superficiel / aggravé)
  - Disciplines (6 slots avec pouvoirs)
  - Résonance, Soif, Humanité
  - Principes de la chronique, Attaches & Convictions, Fléau de clan
  - Avantages & Handicaps
  - Puissance du sang et ses détails
  - Expérience (totale / dépensée)
  - Biographie complète
  - Notes libres
- Sauvegarde automatique
- Thème gothique sombre
- Responsive (mobile & desktop)

## Stack technique

- **Frontend** : Vanilla JS + Vite
- **Auth & DB** : Firebase (Auth + Firestore)
- **Hébergement** : GitHub Pages
- **Déploiement** : GitHub Actions

## Développement local

```bash
npm install
npm run dev
```

Créer un fichier `.env` avec la configuration Firebase (voir `.env` example dans le repo).
