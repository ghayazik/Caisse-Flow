# 🛒 CaisseFlow

**Solution de gestion de caisse intelligente pour supérettes et petits commerces au Maroc**

[![Netlify Status](https://api.netlify.com/api/v1/badges/BADGE_ID/deploy-status)](https://app.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00D4AA.svg)](LICENSE)

---

## 🎯 Fonctionnalités

### 🛒 Caisse Enregistreuse
- Scan / saisie de codes articles avec ajout instantané au panier
- Calcul automatique HT, TVA et TTC en MAD (Dirham Marocain)
- Génération de tickets de caisse avec ICE, vendeur, date et détail
- Affichage du prix d'un achat précédent pour chaque article
- Annulation du dernier article scanné ou suppression individuelle

### 📥 Import & Gestion des Articles
- Import massif depuis fichiers Excel (.xlsx, .xls, .csv)
- Détection automatique des colonnes (code, nom, prix, catégorie, TVA)
- Modification des prix et informations par l'administrateur
- Ajout / suppression manuelle d'articles

### 📊 Dashboard & Rapports
- Chiffre d'affaires journalier en temps réel
- Nombre de ventes et panier moyen
- Répartition des ventes par catégorie (graphiques)
- Top 5 produits vendus
- Historique des ventes avec recherche

### 🔧 Matériel & Mise en Service
- Identification de 6 types d'appareils (imprimantes, tiroir-caisse, lecteur code-barres, afficheur)
- Guide pas-à-pas pour chaque appareil

### ⚙️ Administration
- Gestion des utilisateurs (ajout, modification, activation/désactivation)
- Configuration fine des droits d'accès par module
- Paramétrage des widgets du dashboard
- Configuration boutique et imprimante

### 💬 Chatbot Assistant
- Assistant intégré pour guider les vendeurs
- Réponses aux questions fréquentes (scanner, imprimer, annuler, import...)

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation

```bash
git clone https://github.com/VOTRE_USERNAME/caisseflow.git
cd caisseflow
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Compte administrateur par défaut

| Login   | Mot de passe | Rôle           |
|---------|-------------|----------------|
| `admin` | `1317`      | Administrateur |

> L'administrateur peut créer de nouveaux comptes vendeurs depuis **Admin → Utilisateurs**.

### Persistance des données

Toutes les données (utilisateurs, articles, promos, ventes, configuration) sont **sauvegardées automatiquement** dans le navigateur (`localStorage`). Les données persistent entre les sessions et les rechargements de page.

---

## 📦 Déploiement

### Netlify (recommandé)

1. Poussez votre code sur GitHub
2. Connectez votre repo sur [app.netlify.com](https://app.netlify.com)
3. Configuration automatique via `netlify.toml` :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

### Build Manuel

```bash
npm run build
```

Le dossier `dist/` contient les fichiers prêts à déployer.

---

## 📁 Structure du Projet

```
caisseflow/
├── public/
│   └── favicon.svg
├── src/
│   ├── CaisseFlow.jsx    # Composant principal (toute l'application)
│   ├── main.jsx           # Point d'entrée React
│   └── index.css          # Styles globaux
├── index.html
├── netlify.toml           # Config Netlify
├── vite.config.js         # Config Vite
├── package.json
└── README.md
```

---

## 🛠️ Technologies

- **React 18** — Interface utilisateur
- **Vite 5** — Build tool ultra-rapide
- **SheetJS (xlsx)** — Lecture de fichiers Excel
- **CSS-in-JS** — Styles intégrés sans dépendance

---

## 📋 Format d'Import Excel

Le fichier Excel doit contenir des colonnes avec ces en-têtes (flexibles) :

| Colonne    | Exemples d'en-têtes acceptés             |
|------------|------------------------------------------|
| Code       | code, référence, ref, barcode, ean       |
| Nom        | nom, désignation, article, produit, libellé |
| Prix       | prix, price, tarif, pu, montant          |
| Catégorie  | catégorie, category, famille, rayon      |
| TVA        | tva, tax, vat (optionnel, défaut: 0)     |

---

## 📜 Licence

MIT © CaisseFlow
