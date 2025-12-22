// src/lib/form-schemas/centre-settings.ts
// Schéma de configuration des centres de formation professionnelle

import * as z from "zod";

// Schéma pour un texte légal bilingue
export const LegalTextSchema = z.object({
  textFr: z.string().min(1, "Le texte français est requis"),
  textEn: z.string().min(1, "Le texte anglais est requis"),
});

export type LegalText = z.infer<typeof LegalTextSchema>;

// Schéma principal pour un centre de formation
export const CentreSchema = z.object({
  // Identification
  id: z.string(),
  name: z.string().min(1, "Le nom du centre est requis"),
  nameFrench: z.string().min(1, "Le nom français est requis"),
  nameEnglish: z.string().min(1, "Le nom anglais est requis"),

  // Logos (base64)
  logo: z.string().optional(),
  administrativeInstanceLogo: z.string().optional(),
  watermarkLogo: z.string().optional(),

  // Instance administrative (ex: MINEFOP)
  administrativeInstanceNameFr: z.string().optional(),
  administrativeInstanceNameEn: z.string().optional(),
  administrativeInstanceAcronymFr: z.string().optional(),
  administrativeInstanceAcronymEn: z.string().optional(),

  // Textes d'autorisation
  authorizationTextFr: z.string().optional(),
  authorizationTextEn: z.string().optional(),

  // Textes légaux (array de textes bilingues)
  legalTexts: z.array(LegalTextSchema).optional().default([]),

  // Coordonnées
  postalBox: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  location: z.string().optional(),

  // Métadonnées
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean().default(true),
});

export type Centre = z.infer<typeof CentreSchema>;

// Centre par défaut pour l'initialisation
export const defaultCentre: Omit<Centre, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "",
  nameFrench: "",
  nameEnglish: "",
  logo: undefined,
  administrativeInstanceLogo: undefined,
  watermarkLogo: undefined,
  administrativeInstanceNameFr: "",
  administrativeInstanceNameEn: "",
  administrativeInstanceAcronymFr: "",
  administrativeInstanceAcronymEn: "",
  authorizationTextFr: "",
  authorizationTextEn: "",
  legalTexts: [],
  postalBox: "",
  phone: "",
  email: "",
  location: "",
  isActive: true,
};

/**
 * Fonction pour valider un centre
 */
export function validateCentre(centre: unknown): Centre {
  return CentreSchema.parse(centre);
}

/**
 * Fonction pour créer un nouveau centre avec les valeurs par défaut
 */
export function createNewCentre(): Centre {
  const now = new Date().toISOString();
  return {
    ...defaultCentre,
    id: `centre-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Fonction pour fusionner un centre partiel avec les valeurs par défaut
 */
export function mergeCentre(partial: Partial<Centre>): Centre {
  const now = new Date().toISOString();
  return {
    ...defaultCentre,
    id: partial.id || `centre-${Date.now()}`,
    createdAt: partial.createdAt || now,
    updatedAt: now,
    ...partial,
  };
}
