export interface StudentRecord {
    NOM: string;
    PRENOM: string;
    MATRICULE: string;
    "DATE DE NAISSANCE"?: string;
    "LIEU DE NAISSANCE"?: string;
    CYCLE?: string;
    "ANNEE ACADÉMIQUE"?: string;
    FILIERE?: string;
    NIVEAU?: string;
    SEMESTRE?: string;
    OPTION?: string;
    COURSES?: CourseRecord[];
    TOTAL_CREDITS?: number; // NOUVEAU: Ajouté pour plus de clarté
    DISPLAY_SESSIONS?: boolean; // NOUVEAU: Afficher les sessions sur les relevés
    SESSION_FORMAT?: 'short' | 'full'; // NOUVEAU: Format d'affichage des sessions
  }
  
  export interface CourseRecord {
    CODE: string;
    INTITULE: string;
    EC_TITRE?: string;
    NOTE: number;
    CREDIT?: number; // Gardé pour compatibilité
    UE_CREDIT?: number; // Crédit de l'UE
    UE_AVERAGE?: number;
    UE_ID?: string;
    SESSION?: string; // NOUVEAU: Ajout du champ session
  }

  // NOUVEAU: Interface pour les informations de session
  export interface SessionInfo {
    type: 'Normale' | 'Rattrapage';
    year: string;
    raw?: string; // Valeur brute du format N/année ou R/année
  }

  // NOUVEAU: Interface pour les données Excel avec sessions
  export interface ExcelStudentData {
    NOM: string;
    PRENOM: string;
    MATRICULE: string;
    "DATE DE NAISSANCE"?: string;
    "LIEU DE NAISSANCE"?: string;
    NIVEAU?: string;
    SEMESTRE?: string;
    CYCLE?: string;
    FILIERE?: string;
    "ANNEE ACADEMIQUE"?: string;
    OPTION?: string;
    // Versions anglaises
    DOMAINE_EN?: string;
    PARCOURS_EN?: string;
    SPECIALITE_EN?: string;
    OPTION_EN?: string;
    FINALITE_EN?: string;
    MENTION_EN?: string;
    // Colonnes dynamiques pour les notes et sessions
    [key: string]: any;
  }

  // NOUVEAU: Interface pour le mapping des sessions
  export interface SessionMapping {
    [ecId: string]: string; // ecId -> nom de colonne session dans Excel
  }

  // NOUVEAU: Interface pour les statistiques de session
  export interface SessionStats {
    totalSessionColumns: number;
    mappedSessions: number;
    availableSessions: number;
    sessionTypes: {
      normal: number;
      rattrapage: number;
      undefined: number;
    };
  }