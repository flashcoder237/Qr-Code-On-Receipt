// types.ts

export interface License {
    status: 'unused' | 'used'; // Le statut de la licence peut être "unused" ou "used"
    key: string;               // La clé de la licence, utilisée pour l'identification
    created_at: string;        // La date de création de la licence, au format string (ISO 8601)
    number_user: number;       // Le nombre d'utilisateurs associés à la licence
  }
  