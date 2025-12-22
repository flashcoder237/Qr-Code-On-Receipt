// src/lib/constants/menu.tsx - Mise à jour avec gestion du mode démo

import { QrCodeOnPdf } from "@/components/organisms/qrcode-on-pdf";
import { QRCodeDocumentProcessor } from "@/components/organisms/qr-document-processor/QRCodeDocumentProcessor";
import { AttestationGenerator } from "@/components/organisms/attestation-generator";
import { DiplomaGenerator } from "@/components/organisms/diploma-generator";
import { SettingsForm } from "@/components/organisms/settings-form";
import { CoursesList } from "@/components/organisms/courses-list";
import { ReleveGenerator } from "@/components/organisms/receipts/ReleveGenerator";
import { AcademicConfigManager } from "@/components/organisms/academic-config/AcademicConfigManager";
import { DocumentHistoryManager } from "@/components/organisms/document-history/DocumentHistoryManager";
import { HelpSupport } from '@/components/organisms/help-support';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { TemplateExportMenu } from '@/components/organisms/template-export';
import { CentreManager } from '@/components/organisms/centre-manager';
import { CentreAttestationGenerator } from '@/components/organisms/centre-attestation-generator';
import {
  Download,
  HelpCircle,
  ListCheck,
  Settings2,
  Award,
  File,
  FileText,
  History,
  Settings,
  QrCode,
  GraduationCap,
  FileSpreadsheet,
  Cog,
  ScrollText,
  FileDown,
  Building2
} from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  component: React.ReactElement;
  demoRestricted?: boolean; // Nouveau: indicateur pour les éléments restreints en mode démo
  requiresFaculty?: boolean; // NOUVEAU: indicateur pour les éléments réservés aux facultés
}

const menuItems: MenuItem[] = [
  {
    title: "Génerer les relevés",
    url: "receipts",
    icon: FileSpreadsheet,
    component: <ReleveGenerator />,
  },
  {
    title: "Générer les attesta...",
    url: "attestation",
    icon: GraduationCap,
    component: <AttestationGenerator />,
  },
  {
    title: "Générer les diplômes",
    url: "diplomes",
    icon: ScrollText,
    component: <DiplomaGenerator />,
    requiresFaculty: true, // NOUVEAU: Seulement pour les établissements de type faculty
  },
  {
    title: "Attestations Centre",
    url: "centre-attestations",
    icon: Award,
    component: <CentreAttestationGenerator />,
  },
  {
    title: "Config des rele...",
    url: "config",
    icon: Settings2,
    component: <AcademicConfigManager />,
  },
  {
    title: "Gestion des Centres",
    url: "centre-manager",
    icon: Building2,
    component: <CentreManager />,
  },
  {
    title: "Export modèles Excel",
    url: "template-export",
    icon: FileDown,
    component: <TemplateExportMenu />,
    description: "Télécharger les modèles d'import Excel"
  },
  {
    title: "Configurer les entêtes",
    url: "settings",
    icon: Cog,
    component: <SettingsForm />,
  },
  {
    title: "Historique des docs",
    url: "history",
    icon: History,
    component: <DocumentHistoryManager />,
  },
  {
    title: "QR Codes sur PDF",
    url: "qrcode",
    icon: File,
    component: <QrCodeOnPdf />,
    demoRestricted: true, // Cette fonctionnalité est restreinte en mode démo
  },
  {
    title: "Placement QR sur Doc..",
    url: "qr-document-processor",
    icon: QrCode,
    component: <QRCodeDocumentProcessor />,
  },
  {
    title: "Aide",
    url: "help",
    icon: HelpCircle,
    component: <HelpSupport />,
  },
  {
    title: "Paramètres",
    url: "licenseSettings",
    icon: Settings,
    component: <SettingsPage />,
    description: "Configuration de l'application"
  },
];

/**
 * Filtre les éléments de menu selon le mode de fonctionnement et le type d'établissement
 * @param isDemoMode - Indique si l'application est en mode démo
 * @param establishmentType - Type d'établissement ('ipes' ou 'faculty')
 * @returns Liste des éléments de menu autorisés
 */
export const getFilteredMenuItems = (isDemoMode: boolean = false, establishmentType?: string): MenuItem[] => {
  // Vérifier si c'est une faculté (insensible à la casse et supportant plusieurs formats)
  const isFaculty = establishmentType?.toLowerCase().includes('faculty') ||
                    establishmentType?.toLowerCase().includes('faculté') ||
                    establishmentType === 'faculty';

  return menuItems.filter(item => {
    // Filtrer les éléments restreints en mode démo
    if (isDemoMode && item.demoRestricted) {
      return false;
    }

    // Filtrer les éléments réservés aux facultés
    if (item.requiresFaculty && !isFaculty) {
      return false;
    }

    return true;
  });
};

export { menuItems };
export type { MenuItem };