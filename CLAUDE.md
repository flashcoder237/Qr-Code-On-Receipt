# CLAUDE.md - Guide pour Claude Code

## Apercu du Projet

**Nom**: SGN-Notes (DIPLOMATION)
**Description**: Application desktop pour la generation automatique de documents academiques (releves de notes, attestations, diplomes, recus) avec codes QR pour les institutions educatives au Cameroun (IPES et centres universitaires).

## Stack Technique

### Frontend & Build
- **Framework**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 6.0.1
- **Styling**: Tailwind CSS 3.4.15 + shadcn/ui + Radix UI
- **State Management**: Zustand 5.0.1
- **Forms**: React Hook Form 7.53.2 + Zod 3.23.8

### Desktop
- **Runtime**: Electron 30.0.1
- **Builder**: electron-builder 24.13.3

### Generation de Documents
- **PDF**: pdf-lib 1.17.1, PDFKit 0.17.0, Puppeteer 24.31.0
- **QR Codes**: qrcode 1.5.4 + crypto-js 4.2.0 (chiffrement)
- **Excel**: ExcelJS 4.4.0, XLSX 0.18.5

### Backend
- **BaaS**: Supabase (supabase-js 2.46.2)
- **Storage Local**: Electron Store 10.0.0

## Structure du Projet

```
DIPLOMATION/
├── .claude/                    # Configuration Claude Code
├── electron/                   # Process principal Electron
│   ├── main.ts                # Gestionnaires IPC, creation fenetre
│   └── preload.ts             # Bridge IPC vers renderer
├── src/
│   ├── components/
│   │   ├── organisms/         # Composants fonctionnels complexes
│   │   │   ├── attestation-generator/
│   │   │   ├── centre-attestation-generator/
│   │   │   ├── diploma-generator/
│   │   │   ├── qrcode-on-pdf/
│   │   │   └── receipts/
│   │   ├── pages/             # Pages de l'application
│   │   ├── shared/            # Composants reutilisables
│   │   └── ui/                # Composants atomiques (shadcn/ui)
│   ├── lib/
│   │   ├── attestation-generator/    # Logique generation attestations
│   │   ├── centre-attestation-generator/
│   │   ├── diploma-generator/        # Logique generation diplomes
│   │   ├── crypto/                   # Modules de chiffrement
│   │   ├── form-schemas/             # Schemas Zod
│   │   ├── helpers/                  # Utilitaires (QR, grades, Excel)
│   │   ├── licence/                  # Gestion des licences
│   │   └── pdfGenerator.ts           # Generateur PDF principal (~1870 lignes)
│   ├── hooks/                 # Hooks React personnalises
│   ├── contexts/              # Contextes React
│   └── types/                 # Types TypeScript
├── public/                    # Assets statiques
└── dist-electron/             # Build Electron
```

## Commandes Disponibles

```bash
npm run dev          # Demarrer en mode developpement
npm run build        # Build pour toutes les plateformes
npm run build:win    # Build Windows uniquement
npm run lint         # Verification ESLint
npm run preview      # Preview du build
```

## Architecture Cle

### Pipeline de Generation PDF
```
Template HTML → Electron BrowserWindow → webContents.printToPDF → PDF Buffer
```

### Communication IPC (Electron)
Canaux principaux:
- `render-transcript-html` / `generate-transcript-pdf`: Releves de notes
- `render-attestation-html` / `generate-attestation-pdf`: Attestations
- `generate-diploma-pdf`: Diplomes
- `generateCentreAttestations`: Attestations centre en lot
- `fs:readFile`: Acces systeme de fichiers

### Systeme de Themes
- 40+ parametres personnalisables par type de document
- 5 presets: Classic, Elegant, Modern, Compact, Large
- Schemas definis dans `src/lib/form-schemas/`

### Systeme de QR Codes
- Generation standard et chiffree (selective-encryption)
- Encodage compact des donnees etudiant
- Placement configurable sur documents A4

## Fichiers Importants a Connaitre

| Fichier | Description |
|---------|-------------|
| `src/lib/pdfGenerator.ts` | Generateur PDF principal (releves) |
| `src/lib/attestation-generator/html-generator.ts` | Templates HTML attestations |
| `src/lib/diploma-generator/` | Systeme generation diplomes |
| `src/lib/helpers/grades.ts` | Calcul GPA/moyennes/mentions |
| `src/lib/helpers/qrcode-selective.ts` | Chiffrement selectif QR |
| `src/lib/licence/license-validator.ts` | Validation licences |
| `electron/main.ts` | Process principal Electron |

## Conventions de Code

### TypeScript
- Mode strict active (`tsconfig.json`)
- Alias de chemin: `@/*` → `./src/*`
- Schemas de validation avec Zod

### Composants React
- Composants fonctionnels avec hooks
- Props typees avec interfaces TypeScript
- Formulaires geres avec React Hook Form

### Styling
- Classes utilitaires Tailwind CSS
- Composants shadcn/ui pour l'UI de base
- Variables CSS pour theming

## Particularites du Projet

### Support Bilingue
- Francais/Anglais pour tous les documents
- Labels configures dans les settings

### Types d'Etablissements
- **IPES**: Instituts Prives d'Enseignement Superieur
- **Centres**: Centres universitaires

### Mode Demo
- Filigrane sur les documents
- Fonctionnalites limitees
- Actif sans licence valide

### Systeme de Licences
Types: establishment, single-user, feature-based, temporary
Validation via Supabase

## MCP Servers Configures

Les serveurs MCP suivants sont configures pour ce projet:

1. **filesystem**: Acces securise aux fichiers du projet
2. **supabase**: Interaction avec la base de donnees
3. **git**: Operations Git (commits, branches, historique)
4. **puppeteer**: Automatisation navigateur pour tests PDF

## Workflow de Developpement Recommande

1. **Modifications UI**: Travailler dans `src/components/`
2. **Logique metier**: Modifier les modules dans `src/lib/`
3. **Communication Electron**: Ajouter handlers dans `electron/main.ts`
4. **Validation**: Mettre a jour schemas Zod dans `src/lib/form-schemas/`
5. **Tests**: Utiliser `npm run dev` pour tester en live

## Points d'Attention

- **Memoire**: Node.js configure avec 8GB heap (`--max-old-space-size=8192`)
- **PDF**: La generation utilise Puppeteer et peut etre lente pour les lots
- **Supabase**: Ne pas exposer les cles en clair dans le code
- **Chiffrement QR**: Verifier la compatibilite des donnees encodees

## Ressources Utiles

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [Supabase Docs](https://supabase.com/docs)
