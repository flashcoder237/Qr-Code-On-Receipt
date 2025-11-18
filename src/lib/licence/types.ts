// types.ts

export type LicenseType =
  | 'establishment'   // Licence établissement (IPES/Faculté) - nombre illimité d'utilisateurs
  | 'single_user'     // Licence utilisateur unique - par poste de travail
  | 'feature_based'   // Licence par fonctionnalité - accès à certaines fonctionnalités
  | 'temporary';      // Licence temporaire - avec date d'expiration

export interface License {
    status: 'unused' | 'used';     // Le statut de la licence peut être "unused" ou "used"
    key: string;                   // La clé de la licence, utilisée pour l'identification
    created_at: string;            // La date de création de la licence, au format string (ISO 8601)
    number_user: number;           // Le nombre d'utilisateurs associés à la licence

    // Nouveaux champs pour la gestion multi-types
    licenseType: LicenseType;      // Type de licence
    expirationDate?: string;       // Date d'expiration (ISO 8601) - optionnel, requis pour 'temporary'
    features?: string[];           // Liste des fonctionnalités accessibles - requis pour 'feature_based'
    maxUsers?: number;             // Nombre max d'utilisateurs - optionnel pour 'establishment'
    organizationName?: string;     // Nom de l'organisation - optionnel
  }

// Interface pour les informations utilisateur requises après activation
export interface UserInfo {
  fullName: string;                // Nom complet de l'utilisateur
  position?: string;               // Poste/fonction
  department?: string;             // Département/service
  activatedAt: string;             // Date d'activation (ISO 8601)
}
  