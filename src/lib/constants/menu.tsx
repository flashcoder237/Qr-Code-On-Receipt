// Mise à jour de src/lib/constants/menu.tsx

import { QrCodeOnPdf } from "@/components/organisms/qrcode-on-pdf";
import { AttestationGenerator } from "@/components/organisms/attestation-generator";
import { SettingsForm } from "@/components/organisms/settings-form";
import { CoursesList } from "@/components/organisms/courses-list";
import { ReleveGenerator } from "@/components/organisms/receipts/ReleveGenerator";
import { AcademicConfigManager } from "@/components/organisms/academic-config/AcademicConfigManager";
import {
  FileDownIcon,
  HelpCircleIcon,
  ListCheck,
  Settings2,
  Award,
  File,
  FileText,
} from "lucide-react";

const menuItems = [
  {
    title: "Configurer les relevés",
    url: "config",
    icon: Settings2,
    component: <AcademicConfigManager />,
  },
  {
    title: "Génerer les relevés",
    url: "receipts",
    icon: FileText,
    component: <ReleveGenerator />,
  },
  {
    title: "Générer les attestations",
    url: "attestation",
    icon: Award,
    component: <AttestationGenerator />,
  },
  {
    title: "Configurer les entêtes",
    url: "settings",
    icon: Settings2,
    component: <SettingsForm />,
  },
  {
    title: "Liste de matières",
    url: "courses",
    icon: ListCheck,
    component: <CoursesList />,
  },
  {
    title: "QR Codes sur PDF",
    url: "qrcode",
    icon: File,
    component: <QrCodeOnPdf />,
  },
  {
    title: "Aide",
    url: "help",
    icon: HelpCircleIcon,
    component: <></>,
  },
];

export { menuItems };