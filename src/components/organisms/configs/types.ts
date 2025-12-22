import { ThemeSettingsPayload } from '@/lib/form-schemas/theme-settings';

export interface EC {
  id: string;
  name: string;
  weight?: number; // Poids de l'EC (défaut: 1)
  noteBase?: number; // Sur combien la note est notée dans Excel (défaut: 20)
  displayBase?: number; // Sur combien la note est affichée dans le relevé (défaut: 20)
}

export interface UE {
  id: string;
  name: string;
  code: string;
  credits: number;
  ecs: EC[];
  displayBase?: number; // Sur combien la moyenne de l'UE est affichée (défaut: 20)
  semesterNumber?: number; // Pour les semestres composites: 1, 2, etc. Indique à quel semestre cette UE appartient
  order?: number; // Ordre d'affichage de l'UE dans le semestre (pour tri personnalisé)
}

export interface Semester {
  id: string;
  name: string;
  ues: UE[];
  creditsRequired?: number; // Crédits requis pour valider le semestre (défaut: 30)
  isComposite?: boolean; // Si true, ce semestre représente plusieurs semestres académiques
  compositeEquivalent?: number; // Nombre de semestres équivalents (ex: 2 pour une année complète)
  showSemesterSeparation?: boolean; // Pour les semestres composites: affiche une séparation entre les semestres dans le tableau
  theme?: ThemeSettingsPayload; // NOUVEAU: Thème personnalisé pour ce semestre spécifique
}

// Interface pour la configuration des semestres fusionnés
export interface MergedSemesterConfig {
  id: string;
  name: string; // Ex: "Semestre 1 et 2"
  semesterIds: string[]; // IDs des semestres à fusionner
  creditsRequired: number; // Total des crédits requis pour les semestres fusionnés (ex: 60)
  isActive?: boolean; // Si cette configuration est active
}

export interface ClassConfig {
  id: string;
  name: string;
  academicYear: string;
  filiere: string;
  niveau: string;
  cycle: string;
  option: string;
  establishmentType?: 'ipes' | 'faculty';
  centreId?: string; // NOUVEAU: ID du centre de formation associé (optionnel)
  semesters: Semester[];
  mergedSemesters?: MergedSemesterConfig[]; // Configurations de semestres fusionnés
  displaySessions?: boolean; // Afficher les sessions sur les relevés (défaut: true)
  sessionDisplayFormat?: 'short' | 'full'; // Format d'affichage des sessions (défaut: 'short')
  hideSemesterColumn?: boolean; // Masquer la colonne semestre dans les décisions (défaut: false)
  theme?: ThemeSettingsPayload; // Thème personnalisé pour cette configuration de classe
  lastUsedExcelFile?: {
    fileName: string;
    filePath?: string;
    lastUsed: string;
    columnMapping?: { [key: string]: string }; // Mapping des colonnes sauvegardé
    sessionMapping?: { [key: string]: string }; // Mapping des sessions sauvegardé
  }; // NOUVEAU: Mémorisation du dernier fichier Excel utilisé
  isHidden?: boolean; // Pour masquer temporairement une configuration de la liste
}
