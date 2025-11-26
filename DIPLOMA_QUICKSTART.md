# 🚀 Démarrage Rapide - Générateur de Diplômes

## ✅ Intégration Terminée !

Le système de génération de diplômes est maintenant **complètement intégré** dans l'application et prêt à être utilisé.

## 🎯 Accès au générateur

### Dans l'application

1. Lancez l'application
2. Dans le menu latéral, cliquez sur **"Générer les diplômes"** (icône ScrollText)
3. Vous arrivez sur le générateur de diplômes avec 3 onglets :
   - **Générateur** - Import Excel et génération
   - **Thème** - Personnalisation complète
   - **Mes Thèmes** - Gestion des thèmes sauvegardés

## 📊 Préparer votre fichier Excel

### Colonnes obligatoires (15)

Votre fichier Excel doit contenir ces colonnes exactement (respectez la casse) :

```
NOM
PRENOM
MATRICULE
DATE DE NAISSANCE
LIEU DE NAISSANCE
TITRE DIPLOME FR
TITRE DIPLOME EN
MENTION
ANNEE OBTENTION
DATE JURY ADMISSION
DATE JURY DELIBERATION
PARCOURS
SPECIALITE
MOYENNE
GRADE
```

### Colonnes optionnelles (3)

```
OPTION           (Option en français)
OPTION_EN        (Option en anglais)
MENTION_EN       (Mention en anglais)
```

### 📝 Exemple de fichier Excel

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | TITRE DIPLOME FR | TITRE DIPLOME EN | MENTION | MENTION_EN | OPTION | ANNEE OBTENTION | DATE JURY ADMISSION | DATE JURY DELIBERATION | PARCOURS | SPECIALITE | MOYENNE | GRADE |
|-----|--------|-----------|-------------------|-------------------|------------------|------------------|---------|------------|--------|-----------------|---------------------|----------------------|----------|------------|---------|-------|
| ANGOA SAAH | GABRIELLE SANDRA | 17MM019 | 27/01/2000 | YAOUNDE | DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE | DOCTOR OF MEDICINE STATE DEGREE | TRES HONORABLE AVEC FELICITATIONS DU JURY | HIGH HONORS WITH JURY COMMENDATION | N/D | 2024 | 13/10/2017 | 28/07/2024 | MÉDECINE | MÉDECINE GÉNÉRALE | 16.5 | A+ |

### ⚠️ Notes importantes

- **Format des dates** : JJ/MM/AAAA (exemple : 27/01/2000)
- **Colonnes manquantes** : Automatiquement remplies par "N/D"
- **Validation automatique** : Le système détecte et suggère des corrections
- **Alternatives acceptées** : Le système reconnaît différents noms de colonnes (voir DIPLOMA_GUIDE.md)

## 🎨 Utilisation Rapide

### 1. Import du fichier

1. Dans l'onglet **Générateur**
2. Glissez-déposez votre fichier .xlsx dans la zone d'upload
3. **Si plusieurs feuilles** → Sélectionnez la feuille à traiter
4. Le système valide automatiquement les colonnes
5. Si des colonnes manquent, le système propose des suggestions
6. Cliquez sur **"Importer quand même"** si vous voulez continuer malgré les avertissements

### 2. Vérification des données

- Consultez la liste des diplômés chargés
- Cliquez sur **"Voir"** à côté d'un nom pour prévisualiser son diplôme
- Vérifiez que toutes les informations sont correctes

### 3. Personnalisation (optionnel)

#### Option A : Utiliser un thème préréglé

1. Allez dans l'onglet **"Mes Thèmes"**
2. Sélectionnez un thème préréglé (Classic, Elegant, Modern, Compact, Large)
3. Cliquez sur **"Utiliser"**

#### Option B : Personnaliser votre propre thème

1. Allez dans l'onglet **"Thème"**
2. Personnalisez les paramètres :
   - **Typographie** : Polices et tailles de texte (8 paramètres)
   - **Couleurs** : Couleurs principales, bordures (5 paramètres)
   - **Tailles** : Logos, QR code, marges (11 paramètres)
   - **Options** : Watermark, bilingue, langue (6 paramètres)
3. Cliquez sur **"Prévisualiser"** à tout moment
4. Sauvegardez votre thème personnalisé :
   - Allez dans **"Mes Thèmes"**
   - Cliquez sur **"Nouveau"**
   - Nommez et décrivez votre thème
   - Cliquez sur **"Sauvegarder"**

### 4. Prévisualisation

**Avec fausses données** :
- Cliquez sur **"Prévisualiser avec fausses données"**
- Une nouvelle fenêtre s'ouvre avec un diplôme de test
- Utilisez Ctrl+P pour voir le rendu d'impression

**Avec données réelles** :
- Cliquez sur **"Voir"** à côté d'un diplômé
- Vérifiez toutes les informations
- Vérifiez le QR code

### 5. Génération

1. Cliquez sur **"Générer les diplômes (X)"** où X est le nombre de diplômés
2. Une barre de progression s'affiche
3. Les PDFs sont générés et téléchargés automatiquement dans un fichier ZIP
4. Le fichier s'appelle : `diplomes_YYYY-MM-DD.zip`

## 🎨 Thèmes Préréglés

### Classic (Par défaut)
- Police : Times New Roman
- Bordure : Bleu marine (8px)
- Style : Traditionnel et formel

### Elegant
- Police : Garamond / Didot
- Bordure : Bleu foncé (10px)
- Style : Raffiné et sophistiqué

### Modern
- Police : Calibri / Arial
- Bordure : Bleu (6px + 2px interne)
- Style : Contemporain et épuré

### Compact
- Tailles réduites
- Espacement minimal
- Idéal pour : Documents avec beaucoup de contenu

### Large
- Tailles agrandies
- Espacement généreux
- Idéal pour : Meilleure lisibilité

## 🔧 Paramètres Personnalisables

### Typographie (10 paramètres)
- Police principale
- Police des titres
- Taille titre principal (16-32pt)
- Taille sous-titre (12-24pt)
- Taille nom étudiant (10-20pt)
- Taille en-tête (7-14pt)
- Taille contenu (8-16pt)
- Taille infos étudiant (8-14pt)
- Taille texte légal (6-12pt)
- Taille pied de page (7-12pt)

### Couleurs (5 paramètres)
- Couleur principale (bordures, titres)
- Couleur secondaire (texte)
- Couleur d'accent (éléments importants)
- Couleur bordure externe
- Couleur bordure interne

### Tailles (11 paramètres)
- Largeur bordure externe (1-15px)
- Largeur bordure interne (0-5px)
- Logo FMSP (30-100px)
- Logo Université (60-150px)
- Logo MINESUP (40-120px)
- Armoiries (60-150px)
- Watermark central (200-600px)
- QR Code (40-100px)
- Marges document (4 × 3-15mm)
- Espacement sections (2-10mm)

### Options (6 paramètres)
- Afficher QR code (oui/non)
- Afficher watermark (oui/non)
- Opacité watermark logo (5-30%)
- Opacité watermark texte (2-10%)
- Texte bilingue (oui/non)
- Langue principale (FR/EN)

## 📋 Contenu du QR Code

Le QR code encode automatiquement ces 11 informations :

```json
{
  "nom": "...",
  "prenom": "...",
  "matricule": "...",
  "dateNaissance": "...",
  "lieuNaissance": "...",
  "parcours": "...",
  "specialite": "...",
  "anneeObtention": "...",
  "moyenne": 16.5,
  "grade": "A+",
  "mention": "..."
}
```

Scanner le QR code avec un smartphone permet de vérifier l'authenticité du diplôme.

## 💾 Gestion des Thèmes

### Sauvegarder un thème

1. Personnalisez votre thème dans l'onglet **"Thème"**
2. Allez dans **"Mes Thèmes"**
3. Cliquez sur **"Nouveau"**
4. Entrez un nom : exemple "FMSP Officiel 2024"
5. Ajoutez une description : exemple "Thème officiel pour les diplômes de médecine"
6. Cliquez sur **"Sauvegarder"**

### Charger un thème

1. Allez dans **"Mes Thèmes"**
2. Trouvez votre thème
3. Cliquez sur **"Charger"**
4. Le thème est appliqué immédiatement

### Exporter vos thèmes

1. Allez dans **"Mes Thèmes"**
2. Cliquez sur **"Exporter"**
3. Un fichier JSON est téléchargé : `diploma-themes-YYYY-MM-DD.json`
4. Conservez ce fichier comme backup

### Importer des thèmes

1. Allez dans **"Mes Thèmes"**
2. Cliquez sur **"Importer"**
3. Sélectionnez un fichier JSON de thèmes
4. Les thèmes sont fusionnés avec vos thèmes existants

## 🆘 Résolution de Problèmes

### ❌ "Colonnes requises manquantes"

**Solution** :
1. Vérifiez les noms de vos colonnes Excel
2. Utilisez exactement les noms indiqués ci-dessus
3. Ou cliquez sur **"Importer quand même"** → les données manquantes seront remplies par "N/D"

### ❌ "Le fichier contient plusieurs feuilles"

**Solution** :
1. Un sélecteur de feuille apparaît automatiquement
2. Choisissez la feuille qui contient vos données
3. Cliquez sur **"Traiter la feuille sélectionnée"**

### ❌ "Les logos ne s'affichent pas"

**Solution** :
1. Allez dans **"Configurer les entêtes"** (menu latéral)
2. Uploadez vos logos (FMSP, Université, MINESUP, Armoiries)
3. Les logos sont encodés en base64 et stockés localement

### ❌ "Le QR code est illisible"

**Solution** :
1. Allez dans **"Thème"** → **"Tailles"**
2. Augmentez **"QR Code"** à 80-100px
3. Prévisualisez pour vérifier la lisibilité

### ❌ "Le thème ne se sauvegarde pas"

**Solution** :
1. Vérifiez que le localStorage est activé dans votre navigateur
2. Vérifiez qu'il vous reste de l'espace de stockage
3. Essayez d'exporter vos thèmes en JSON pour backup

### ❌ "Mode DÉMO affiché sur les diplômes"

**Solution** :
1. L'application est en mode démonstration
2. Allez dans **"Paramètres"** (menu latéral)
3. Activez une licence valide
4. Les diplômes n'auront plus le filigrane DÉMO

## 📱 Raccourcis Clavier

- **Ctrl+P** (dans la prévisualisation) → Imprimer/Sauvegarder en PDF
- **Échap** (dans la prévisualisation) → Fermer la fenêtre

## 🎯 Workflow Recommandé

### Pour la première utilisation :

1. **Configuration initiale** (une seule fois)
   - Allez dans **"Configurer les entêtes"**
   - Uploadez tous les logos nécessaires
   - Configurez les informations de l'école

2. **Création du thème** (une seule fois ou occasionnellement)
   - Allez dans **"Thème"**
   - Personnalisez tous les paramètres
   - **Prévisualisez** régulièrement
   - **Sauvegardez** votre thème avec un nom descriptif

3. **Génération quotidienne**
   - Allez dans **"Générateur"**
   - Chargez votre fichier Excel
   - **Vérifiez** avec 1-2 prévisualisations
   - **Générez** tous les diplômes
   - Téléchargez le ZIP

### Pour les générations suivantes :

1. Allez dans **"Mes Thèmes"**
2. Chargez votre thème favori
3. Allez dans **"Générateur"**
4. Chargez le fichier Excel
5. Générez !

## 📚 Documentation Complète

- **DIPLOMA_README.md** - Vue d'ensemble et résumé
- **DIPLOMA_GUIDE.md** - Guide complet (3000+ mots)
- **DIPLOMA_QUICKSTART.md** - Ce fichier !

## ✨ Fonctionnalités Avancées

### 🔄 Génération en lot
- Importez un fichier avec 100+ étudiants
- Tous les PDFs sont générés automatiquement
- Téléchargement en un seul fichier ZIP
- Barre de progression en temps réel

### 🌐 Support Bilingue
- Tous les diplômes sont bilingues Français/Anglais
- Langue principale personnalisable
- Traductions automatiques des mentions si manquantes

### 💾 Auto-sauvegarde
- Votre thème actuel est sauvegardé automatiquement
- Même après fermeture de l'application
- Pas besoin de ressaisir vos paramètres

### 🎨 Thèmes illimités
- Créez autant de thèmes que nécessaire
- Un thème par année académique
- Un thème par type de diplôme
- Un thème par établissement

## 🚀 Prêt à commencer !

Vous avez maintenant toutes les informations pour générer vos diplômes professionnels !

**Premier test** :
1. Ouvrez l'application
2. Allez dans **"Générer les diplômes"**
3. Cliquez sur **"Prévisualiser avec fausses données"**
4. Admirez votre premier diplôme généré ! 🎓

**Questions ?** Consultez **DIPLOMA_GUIDE.md** pour plus de détails.

**Bon travail !** 🎉
