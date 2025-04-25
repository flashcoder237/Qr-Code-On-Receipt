import { QrCodeOnPdf } from "@/components/organisms/qrcode-on-pdf";
import { SettingsForm } from "@/components/organisms/settings-form";
import { CoursesList } from "@/components/organisms/courses-list";
import { ReleveGenerator } from "@/components/organisms/receipts/ReleveGenerator";
import { AcademicConfigManager } from "@/components/organisms/academic-config/AcademicConfigManager";
import {
  FileDownIcon,
  HelpCircleIcon,
  ListCheck,
  Settings2,
} from "lucide-react";

const menuItems = [
  {
    title: "Configurer les relevés",
    url: "config",
    icon: FileDownIcon,
    component: <AcademicConfigManager />,
  },
  {
    title: "Generer les releves",
    url: "receipts",
    icon: FileDownIcon,
    component: <ReleveGenerator />,
  },
  {
    title: "Configurer les entetes",
    url: "settings",
    icon: Settings2,
    // component: <></>,
    component: <SettingsForm />,
  },
  {
    title: "Liste de matieres",
    url: "courses",
    icon: ListCheck,
    component: <CoursesList />,
  },
  {
    title: "Code Barre sur les releves",
    url: "qrcode",
    icon: HelpCircleIcon,
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
