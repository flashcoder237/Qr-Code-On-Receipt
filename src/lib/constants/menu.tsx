// src/lib/constants/menu.tsx - Mise à jour avec gestion du mode démo

import { QrCodeOnPdf } from "@/components/organisms/qrcode-on-pdf";
import { QRCodeDocumentProcessor } from "@/components/organisms/qr-document-processor/QRCodeDocumentProcessor";
import { AttestationGenerator } from "@/components/organisms/attestation-generator";
import { SettingsForm } from "@/components/organisms/settings-form";
import { CoursesList } from "@/components/organisms/courses-list";
import { ReleveGenerator } from "@/components/organisms/receipts/ReleveGenerator";
import { AcademicConfigManager } from "@/components/organisms/academic-config/AcademicConfigManager";
import { DocumentHistoryManager } from "@/components/organisms/document-history/DocumentHistoryManager";
import { HelpSupport } from '@/components/organisms/help-support';
import {SettingsPage} from '@/components/pages/SettingsPage';
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
  Cog
} from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  component: React.ReactElement;
  demoRestricted?: boolean; // Nouveau: indicateur pour les éléments restreints en mode démo
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
    title: "Config des rele...",
    url: "config",
    icon: Settings2,
    component: <AcademicConfigManager />,
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
 * Filtre les éléments de menu selon le mode de fonctionnement
 * @param isDemoMode - Indique si l'application est en mode démo
 * @returns Liste des éléments de menu autorisés
 */
export const getFilteredMenuItems = (isDemoMode: boolean = false): MenuItem[] => {
  if (isDemoMode) {
    return menuItems.filter(item => !item.demoRestricted);
  }
  return menuItems;
};

export { menuItems };
export type { MenuItem };