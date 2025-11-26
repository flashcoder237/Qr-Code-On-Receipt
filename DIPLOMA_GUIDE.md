# Guide d'utilisation du Générateur de Diplômes

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Format du fichier Excel](#format-du-fichier-excel)
4. [Système de thèmes](#système-de-thèmes)
5. [Utilisation](#utilisation)
6. [Personnalisation avancée](#personnalisation-avancée)
7. [Intégration](#intégration)

## Vue d'ensemble

Le générateur de diplômes permet de créer des diplômes officiels personnalisables à partir d'un fichier Excel contenant les informations des diplômés. Il offre :

- ✅ Import depuis Excel avec colonnes personnalisables
- ✅ Système de thèmes complet et sauvegardable
- ✅ Prévisualisation en temps réel
- ✅ Génération de QR codes avec données sécurisées
- ✅ Export en PDF individuel ou groupé
- ✅ Support bilingue (Français/Anglais)

## Structure des fichiers

```
src/
├── lib/
│   ├── diploma-generator/
│   │   ├── types.ts                    # Types TypeScript
│   │   ├── html-generator.ts           # Générateur HTML
│   │   ├── preview.ts                  # Fonctions de prévisualisation
│   │   └── index.ts                    # Exports
│   └── form-schemas/
│       └── diploma-theme-settings.ts   # Schéma de thème
│
└── components/
    └── organisms/
        └── diploma-generator/
            ├── DiplomaGenerator.tsx    # Composant principal
            ├── DiplomaThemeEditor.tsx  # Éditeur de thème
            ├── DiplomaThemeManager.tsx # Gestionnaire de thèmes
            └── index.tsx               # Exports
```

## Format du fichier Excel

### Colonnes obligatoires

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `NOM` | Texte | Nom de famille | `ANGOA SAAH` |
| `PRENOM` | Texte | Prénom(s) | `GABRIELLE SANDRA` |
| `MATRICULE` | Texte | Numéro matricule | `17MM019` |
| `DATE DE NAISSANCE` | Date | Format: JJ/MM/AAAA | `27/01/2000` |
| `LIEU DE NAISSANCE` | Texte | Ville de naissance | `YAOUNDE` |
| `TITRE DIPLOME FR` | Texte | Titre en français | `DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE` |
| `TITRE DIPLOME EN` | Texte | Titre en anglais | `DOCTOR OF MEDICINE STATE DEGREE` |
| `MENTION` | Texte | Mention en français | `TRES HONORABLE AVEC FELICITATIONS DU JURY` |
| `ANNEE OBTENTION` | Nombre | Année du diplôme | `2024` |
| `DATE JURY ADMISSION` | Date | Date admission | `13/10/2017` |
| `DATE JURY DELIBERATION` | Date | Date délibération | `28/07/2024` |
| `PARCOURS` | Texte | Parcours d'études | `MÉDECINE` |
| `SPECIALITE` | Texte | Spécialité | `MÉDECINE GÉNÉRALE` |
| `MOYENNE` | Nombre | Moyenne générale | `16.5` |
| `GRADE` | Texte | Grade académique | `A+` |

### Colonnes optionnelles

| Colonne | Type | Description |
|---------|------|-------------|
| `OPTION` | Texte | Option spécifique (si applicable) |
| `OPTION_EN` | Texte | Option en anglais |
| `MENTION_EN` | Texte | Mention en anglais |

### Exemple de fichier Excel

```
NOM          | PRENOM              | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | TITRE DIPLOME FR                        | TITRE DIPLOME EN                    | MENTION                                      | MENTION_EN                            | OPTION | ANNEE OBTENTION | DATE JURY ADMISSION | DATE JURY DELIBERATION
-------------|---------------------|-----------|-------------------|-------------------|-----------------------------------------|-------------------------------------|----------------------------------------------|---------------------------------------|--------|-----------------|---------------------|----------------------
ANGOA SAAH   | GABRIELLE SANDRA    | 17MM019   | 27/01/2000        | YAOUNDE           | DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE  | DOCTOR OF MEDICINE STATE DEGREE     | TRES HONORABLE AVEC FELICITATIONS DU JURY   | HIGH HONORS WITH JURY COMMENDATION    | N/D    | 2024            | 13/10/2017          | 28/07/2024
```

## Système de thèmes

### Thèmes préréglés

Le système propose 5 thèmes préréglés :

1. **Classic** - Style traditionnel (défaut)
2. **Elegant** - Design élégant avec Garamond
3. **Modern** - Style moderne avec Calibri
4. **Compact** - Version compacte avec textes réduits
5. **Large** - Version agrandie pour meilleure lisibilité

### Paramètres personnalisables

#### 1. Typographie

- **Polices** :
  - Police principale (Times New Roman, Georgia, Garamond, etc.)
  - Police des titres (séparée de la police principale)

- **Tailles de texte** (en points) :
  - Titre principal : 16-32pt
  - Sous-titre : 12-24pt
  - Nom étudiant : 10-20pt
  - En-tête : 7-14pt
  - Contenu : 8-16pt
  - Infos étudiant : 8-14pt
  - Texte légal : 6-12pt
  - Pied de page : 7-12pt

#### 2. Couleurs

- Couleur principale (bordures, titres)
- Couleur secondaire (texte)
- Couleur d'accent (éléments importants)
- Couleur bordure externe
- Couleur bordure interne

#### 3. Tailles d'éléments

- **Bordures** :
  - Largeur bordure externe : 1-15px
  - Largeur bordure interne : 0-5px

- **Logos** (en pixels) :
  - Logo FMSP : 30-100px
  - Logo Université : 60-150px
  - Logo MINESUP : 40-120px
  - Armoiries : 60-150px
  - Watermark central : 200-600px
  - QR Code : 40-100px

- **Marges** (en mm) :
  - Marges supérieure, inférieure, gauche, droite : 3-15mm
  - Espacement entre sections : 2-10mm

#### 4. Options d'affichage

- Afficher/masquer le QR Code
- Afficher/masquer le watermark
- Opacité du watermark logo (5-30%)
- Opacité du watermark texte (2-10%)
- Afficher/masquer le texte bilingue
- Langue principale (Français/Anglais)

### Sauvegarder un thème

1. Personnalisez votre thème dans l'onglet "Thème"
2. Allez dans l'onglet "Mes Thèmes"
3. Cliquez sur "Nouveau"
4. Donnez un nom et une description
5. Cliquez sur "Sauvegarder"

### Exporter/Importer des thèmes

**Export** :
- Ouvrez l'onglet "Mes Thèmes"
- Cliquez sur "Exporter"
- Un fichier JSON sera téléchargé avec tous vos thèmes

**Import** :
- Ouvrez l'onglet "Mes Thèmes"
- Cliquez sur "Importer"
- Sélectionnez un fichier JSON de thèmes
- Les thèmes seront fusionnés avec les existants

## Utilisation

### 1. Import des données

```tsx
import { DiplomaGenerator } from '@/components/organisms/diploma-generator';

function App() {
  return <DiplomaGenerator />;
}
```

### 2. Étapes de génération

1. **Importer le fichier Excel**
   - Cliquez sur la zone d'upload
   - Sélectionnez votre fichier .xlsx ou .xls
   - Le système valide automatiquement les colonnes

2. **Vérifier les données**
   - Consultez la liste des diplômés
   - Prévisualisez individuellement chaque diplôme

3. **Personnaliser le thème** (optionnel)
   - Allez dans l'onglet "Thème"
   - Ajustez les paramètres selon vos besoins
   - Prévisualisez en temps réel

4. **Générer les diplômes**
   - Cliquez sur "Générer les diplômes"
   - Les PDF seront générés et téléchargés en ZIP

### 3. Prévisualisation

**Avec fausses données** :
```typescript
// Données de démonstration intégrées
const fakeData = FAKE_DIPLOMA_DATA;
```

**Avec données réelles** :
```typescript
// Prévisualiser un étudiant spécifique
handlePreviewStudent(studentData);
```

## Données du QR Code

Le QR code contient les informations suivantes au format JSON :

```json
{
  "nom": "ANGOA SAAH",
  "prenom": "GABRIELLE SANDRA",
  "matricule": "17MM019",
  "dateNaissance": "27/01/2000",
  "lieuNaissance": "YAOUNDE",
  "parcours": "MÉDECINE",
  "specialite": "MÉDECINE GÉNÉRALE",
  "anneeObtention": "2024",
  "moyenne": 16.5,
  "grade": "A+",
  "mention": "TRES HONORABLE AVEC FELICITATIONS DU JURY"
}
```

## Personnalisation avancée

### Modifier le template HTML

Le template est généré dynamiquement dans `html-generator.ts`. Pour personnaliser :

1. Ouvrez `src/lib/diploma-generator/html-generator.ts`
2. Modifiez la fonction `generateDiplomaHTML`
3. Les styles CSS sont générés par `generateDiplomaStyles`

### Ajouter un nouveau paramètre de thème

1. **Mettre à jour le schéma** (`diploma-theme-settings.ts`) :
```typescript
export const DiplomaThemeSettingsSchema = z.object({
  // ... existant
  nouveauParametre: z.string(),
});
```

2. **Mettre à jour le thème par défaut** :
```typescript
export const defaultDiplomaTheme = {
  // ... existant
  nouveauParametre: 'valeur',
};
```

3. **Ajouter dans l'éditeur** (`DiplomaThemeEditor.tsx`) :
```tsx
<div>
  <Label>Nouveau paramètre</Label>
  <Input
    value={theme.nouveauParametre}
    onChange={(e) => updateTheme({ nouveauParametre: e.target.value })}
  />
</div>
```

4. **Utiliser dans le générateur** (`html-generator.ts`) :
```typescript
const styles = `
  .element {
    propriete: ${theme.nouveauParametre};
  }
`;
```

## Intégration

### Ajouter au menu de navigation

```tsx
import { DiplomaGenerator } from '@/components/organisms/diploma-generator';

// Dans votre router ou menu
<Route path="/diplomes" element={<DiplomaGenerator />} />
```

### Intégration IPC (Electron)

Pour générer les PDF côté backend :

```typescript
// main.ts (Electron)
ipcMain.handle('generate-diploma-pdf', async (event, data) => {
  const { student, settings, options } = data;
  const html = await generateDiplomaHTML(student, settings, options);

  // Utiliser puppeteer ou autre pour générer le PDF
  const pdfBytes = await htmlToPDF(html);

  return pdfBytes;
});
```

## Dépannage

### Les thèmes ne se sauvegardent pas
- Vérifiez que le localStorage est activé
- Vérifiez la console pour les erreurs

### Les logos ne s'affichent pas
- Assurez-vous que les logos sont en base64
- Vérifiez les chemins dans les paramètres de l'école

### Le QR code est illisible
- Augmentez la taille du QR code dans le thème
- Réduisez la quantité de données si possible

### Les polices ne s'affichent pas correctement
- Vérifiez que les polices sont installées sur le système
- Utilisez des polices web-safe comme fallback

## Support

Pour toute question ou problème :
- Consultez le code source dans `src/lib/diploma-generator/`
- Vérifiez les types dans `types.ts`
- Inspectez le HTML généré pour le débogage

## Licence

Ce générateur de diplômes fait partie du système DIPLOMATION.
