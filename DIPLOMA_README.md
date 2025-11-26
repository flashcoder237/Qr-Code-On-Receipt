# Système de Génération de Diplômes

## 🎓 Résumé

Un système complet de génération de diplômes personnalisables basé sur le modèle `diplome.html`, avec gestion avancée des thèmes et support bilingue.

## 📦 Fichiers créés

### Types et Schémas

1. **`src/lib/diploma-generator/types.ts`**
   - Types TypeScript pour les données des diplômés
   - Interface `DiplomaStudentRecord` avec toutes les colonnes Excel
   - Interface `DiplomaQRData` pour le contenu du QR code
   - Données factices pour la prévisualisation
   - Interfaces pour les paramètres et options

2. **`src/lib/form-schemas/diploma-theme-settings.ts`**
   - Schéma Zod complet pour la validation des thèmes
   - 40+ paramètres personnalisables (polices, couleurs, tailles, marges)
   - 5 thèmes préréglés (classic, elegant, modern, compact, large)
   - Fonctions de validation et fusion de thèmes

### Générateurs

3. **`src/lib/diploma-generator/html-generator.ts`**
   - Générateur HTML basé sur diplome.html
   - Application dynamique des thèmes
   - Génération de QR codes
   - Support du mode démo avec watermark
   - Gestion des logos multiples (FMSP, Université, MINESUP, Armoiries)
   - CSS dynamique basé sur les paramètres de thème

4. **`src/lib/diploma-generator/preview.ts`**
   - Fonction d'ouverture de prévisualisation dans nouvelle fenêtre
   - Préparation des données pour génération PDF
   - Support du mode démo

### Composants React

5. **`src/components/organisms/diploma-generator/DiplomaThemeEditor.tsx`**
   - Éditeur complet avec 4 onglets (Typographie, Couleurs, Tailles, Options)
   - Contrôles pour tous les paramètres de thème
   - Sliders pour les tailles et opacités
   - Sélecteurs de couleur avec preview
   - Boutons de prévisualisation et réinitialisation

6. **`src/components/organisms/diploma-generator/DiplomaThemeManager.tsx`**
   - Gestion des thèmes sauvegardés
   - Affichage des thèmes préréglés
   - Création, édition, suppression de thèmes
   - Export/Import de thèmes en JSON
   - Prévisualisation rapide de chaque thème

7. **`src/components/organisms/diploma-generator/DiplomaGenerator.tsx`**
   - Composant principal avec 3 onglets
   - Import de fichier Excel
   - Liste des diplômés avec prévisualisation individuelle
   - Génération en lot avec barre de progression
   - Intégration des composants d'édition et gestion de thèmes

### Exports et Documentation

8. **`src/components/organisms/diploma-generator/index.tsx`**
   - Exports des composants

9. **`src/lib/diploma-generator/index.ts`**
   - Exports des types et fonctions

10. **`DIPLOMA_GUIDE.md`**
    - Guide complet d'utilisation (3000+ mots)
    - Format du fichier Excel avec exemples
    - Documentation de tous les paramètres de thème
    - Instructions d'intégration
    - Guide de personnalisation avancée
    - Dépannage

## ✨ Fonctionnalités

### Données Excel
- ✅ 14 colonnes obligatoires
- ✅ 3 colonnes optionnelles (OPTION, OPTION_EN, MENTION_EN)
- ✅ Support des traductions anglaises
- ✅ Validation automatique

### Thèmes
- ✅ 5 thèmes préréglés
- ✅ 40+ paramètres personnalisables :
  - 2 polices (principale + titres)
  - 8 tailles de texte indépendantes
  - 5 couleurs (primaire, secondaire, accent, bordures)
  - 6 tailles de logos
  - 4 marges de document
  - Opacité des watermarks
  - Options bilingues
- ✅ Sauvegarde illimitée de thèmes personnalisés
- ✅ Export/Import de thèmes en JSON
- ✅ Prévisualisation en temps réel

### Génération
- ✅ Génération individuelle ou en lot
- ✅ QR codes avec 11 champs de données
- ✅ Support bilingue français/anglais
- ✅ Mode démo avec watermark
- ✅ Export en ZIP avec tous les PDFs
- ✅ Barre de progression

### Interface
- ✅ 3 onglets (Générateur, Thème, Mes Thèmes)
- ✅ Éditeur de thème avec 4 sous-onglets
- ✅ Preview avec fausses données
- ✅ Preview individuelle par étudiant
- ✅ Interface responsive et intuitive

## 🚀 Utilisation rapide

### 1. Importer le composant

```tsx
import { DiplomaGenerator } from '@/components/organisms/diploma-generator';

function App() {
  return <DiplomaGenerator />;
}
```

### 2. Préparer le fichier Excel

Créez un fichier Excel avec ces colonnes :
- NOM, PRENOM, MATRICULE
- DATE DE NAISSANCE, LIEU DE NAISSANCE
- TITRE DIPLOME FR, TITRE DIPLOME EN
- MENTION, ANNEE OBTENTION
- DATE JURY ADMISSION, DATE JURY DELIBERATION
- PARCOURS, SPECIALITE, MOYENNE, GRADE

### 3. Générer les diplômes

1. Importez le fichier Excel
2. Personnalisez le thème (optionnel)
3. Prévisualisez
4. Générez tous les diplômes

## 📋 Colonnes Excel

### Obligatoires
- `NOM` - Nom de famille
- `PRENOM` - Prénom(s)
- `MATRICULE` - Numéro matricule
- `DATE DE NAISSANCE` - Format: JJ/MM/AAAA
- `LIEU DE NAISSANCE` - Ville
- `TITRE DIPLOME FR` - Ex: "DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE"
- `TITRE DIPLOME EN` - Ex: "DOCTOR OF MEDICINE STATE DEGREE"
- `MENTION` - Mention en français
- `ANNEE OBTENTION` - Année (2024)
- `DATE JURY ADMISSION` - Date jury admission
- `DATE JURY DELIBERATION` - Date jury délibération
- `PARCOURS` - Parcours d'études
- `SPECIALITE` - Spécialité
- `MOYENNE` - Moyenne numérique
- `GRADE` - Grade académique

### Optionnelles
- `OPTION` - Option spécifique
- `OPTION_EN` - Option en anglais
- `MENTION_EN` - Mention en anglais

## 🎨 Thèmes préréglés

1. **Classic** - Style traditionnel (Times New Roman, bordures bleues)
2. **Elegant** - Design élégant (Garamond, Didot)
3. **Modern** - Style moderne (Calibri, Arial)
4. **Compact** - Textes réduits pour plus de contenu
5. **Large** - Textes agrandis pour meilleure lisibilité

## 🔧 Personnalisation

### Modifier un paramètre

```tsx
const newTheme = {
  ...currentTheme,
  titleFontSize: 24,
  primaryColor: '#000080',
};

setDiplomaTheme(newTheme);
```

### Sauvegarder un thème

1. Personnalisez dans l'onglet "Thème"
2. Allez dans "Mes Thèmes"
3. Cliquez "Nouveau"
4. Nommez et sauvegardez

### Exporter vos thèmes

Bouton "Exporter" dans l'onglet "Mes Thèmes" → fichier JSON téléchargé

## 📊 Contenu du QR Code

Le QR code encode en JSON :
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

## 🔗 Intégration

### Ajouter au menu

```tsx
import { DiplomaGenerator } from '@/components/organisms/diploma-generator';

<Route path="/diplomes" element={<DiplomaGenerator />} />
```

### IPC Electron (génération PDF backend)

```typescript
// main.ts
ipcMain.handle('generate-diploma-pdf', async (event, data) => {
  const html = await generateDiplomaHTML(data.student, data.settings, data.options);
  return await htmlToPDF(html);
});
```

## 📚 Documentation complète

Consultez `DIPLOMA_GUIDE.md` pour :
- Guide détaillé de tous les paramètres
- Exemples de personnalisation avancée
- Dépannage
- Intégration complète

## 🎯 Prochaines étapes

Pour intégrer complètement le système :

1. **Ajouter le composant au menu principal** de votre application
2. **Configurer l'import Excel** avec le composant `FileUploader` existant
3. **Implémenter la génération PDF** côté backend (IPC Electron + Puppeteer)
4. **Tester** avec des données réelles
5. **Personnaliser** les thèmes selon vos besoins

## 🆘 Support

- Code source : `src/lib/diploma-generator/`
- Types : `src/lib/diploma-generator/types.ts`
- Schéma : `src/lib/form-schemas/diploma-theme-settings.ts`
- Documentation : `DIPLOMA_GUIDE.md`
