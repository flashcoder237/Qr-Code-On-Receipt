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
  }
  
  export interface CourseRecord {
    CODE: string;
    INTITULE: string;
    EC_TITRE?: string;
    NOTE: number;
    CREDIT: number;
    UE_AVERAGE?: number;
  }