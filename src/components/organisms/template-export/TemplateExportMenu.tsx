// src/components/organisms/template-export/TemplateExportMenu.tsx
// Composant centralisé pour l'export de tous les modèles Excel du système - VERSION 2.0

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileDown,
  FileSpreadsheet,
  GraduationCap,
  ScrollText,
  Settings2,
  Download,
  CheckCircle,
  Info,
  Loader2,
  FileEdit
} from 'lucide-react';
import { generateExcelTemplate, TemplateType } from '@/lib/helpers/excel-template-generator';
import { generateGradeEntryTemplate } from '@/lib/helpers/grade-entry-template-generator';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';
import { TemplateConfigDialog, TemplateConfig } from './TemplateConfigDialog';
import type { ClassConfig } from '@/components/organisms/configs/types';
import { LOCAL_STORAGE_KEY } from '@/components/organisms/configs/utils';

interface TemplateOption {
  id: string;
  title: string;
  description: string;
  type: TemplateType | 'config' | 'grade-entry';
  icon: React.ElementType;
  color: string;
  category: 'data-import' | 'configuration' | 'grade-entry';
  requiresFaculty?: boolean;
  options?: {
    includeExamples?: boolean;
    includeSessions?: boolean;
  };
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  // Templates d'import de données
  {
    id: 'releve-template',
    title: 'Modèle Relevé de Notes',
    description: 'Format Excel pour importer les notes des étudiants avec informations personnelles et académiques (noms de colonnes exacts attendus à l\'import)',
    type: 'releve',
    icon: FileSpreadsheet,
    color: 'blue',
    category: 'data-import',
    options: {
      includeSessions: true,
      includeExamples: false
    }
  },
  {
    id: 'attestation-template',
    title: 'Modèle Attestation de Réussite',
    description: 'Format Excel pour importer les données d\'attestations avec moyennes, mentions, informations de parcours et colonnes QR code',
    type: 'attestation',
    icon: GraduationCap,
    color: 'green',
    category: 'data-import'
  },
  {
    id: 'diploma-template',
    title: 'Modèle Diplôme',
    description: 'Format Excel pour importer les données de diplômes avec titres bilingues, informations du jury et colonnes QR code',
    type: 'diploma',
    icon: ScrollText,
    color: 'purple',
    category: 'data-import',
    requiresFaculty: true
  },
  // Templates de configuration
  {
    id: 'config-template',
    title: 'Modèle Configuration de Classe',
    description: 'Format Excel pour créer/modifier les configurations académiques (UE, EC, semestres, crédits)',
    type: 'config',
    icon: Settings2,
    color: 'orange',
    category: 'configuration'
  },
  // Masque de saisie
  {
    id: 'grade-entry-template',
    title: 'Masque de Saisie de Notes',
    description: 'Générer un fichier Excel pré-rempli avec toutes les colonnes de notes (ECs) d\'une configuration de classe spécifique',
    type: 'grade-entry',
    icon: FileEdit,
    color: 'teal',
    category: 'grade-entry'
  }
];

interface TemplateExportMenuProps {
  establishmentType?: string;
}

export const TemplateExportMenu: React.FC<TemplateExportMenuProps> = ({
  establishmentType
}) => {
  const { toasts, toast, removeToast } = useToast();
  const [loadingTemplates, setLoadingTemplates] = useState<Set<string>>(new Set());
  const [downloadedTemplates, setDownloadedTemplates] = useState<Set<string>>(new Set());
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateOption | null>(null);

  // Charger les configurations de classe depuis le localStorage
  const [storedConfigs] = useLocalStorage<ClassConfig[]>(LOCAL_STORAGE_KEY, []);
  const classConfigs = storedConfigs || [];

  // Vérifier si c'est une faculté
  const isFaculty = establishmentType?.toLowerCase().includes('faculty') ||
                    establishmentType?.toLowerCase().includes('faculté');

  // Filtrer les templates selon le type d'établissement
  const availableTemplates = TEMPLATE_OPTIONS.filter(template => {
    if (template.requiresFaculty && !isFaculty) {
      return false;
    }
    return true;
  });

  const handleExportClick = (template: TemplateOption) => {
    // Ouvrir le dialogue de configuration
    setCurrentTemplate(template);
    setConfigDialogOpen(true);
  };

  const handleConfigConfirm = async (config: TemplateConfig) => {
    if (!currentTemplate) return;

    setLoadingTemplates(prev => new Set(prev).add(currentTemplate.id));

    try {
      if (currentTemplate.type === 'config') {
        // Export du template de configuration
        await handleExportConfigTemplate(config);
      } else if (currentTemplate.type === 'grade-entry') {
        // Export du masque de saisie
        await handleExportGradeEntryTemplate(config);
      } else {
        // Export des templates de données
        await handleExportDataTemplate(currentTemplate, config);
      }

      // Marquer comme téléchargé
      setDownloadedTemplates(prev => new Set(prev).add(currentTemplate.id));

      toast.success(
        'Modèle téléchargé',
        `${currentTemplate.title} téléchargé avec succès`
      );
    } catch (error) {
      console.error(`Erreur lors de l'export du template ${currentTemplate.id}:`, error);
      toast.error(
        'Erreur',
        `Impossible de générer ${currentTemplate.title}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    } finally {
      setLoadingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentTemplate.id);
        return newSet;
      });
    }
  };

  const handleExportDataTemplate = async (template: TemplateOption, config: TemplateConfig) => {
    const result = await generateExcelTemplate({
      type: template.type as TemplateType,
      establishmentType,
      includeInstructions: config.includeInstructions,
      includeExamples: config.includeExamples,
      dynamicColumns: template.type === 'releve' && config.includeSessions ? {
        ecNames: [],
        includeSessions: true
      } : undefined
    });

    await downloadWorkbook(result.workbook, result.fileName);
  };

  const handleExportGradeEntryTemplate = async (config: TemplateConfig) => {
    if (!config.classConfigId) {
      throw new Error('Aucune configuration de classe sélectionnée');
    }

    const classConfig = classConfigs.find(c => c.id === config.classConfigId);
    if (!classConfig) {
      throw new Error('Configuration de classe introuvable');
    }

    const result = await generateGradeEntryTemplate({
      classConfig,
      numberOfStudents: config.numberOfStudents,
      includeInstructions: config.includeInstructions,
      includeExamples: config.includeExamples,
      includeSessions: config.includeSessions,
      establishmentType
    });

    await downloadWorkbook(result.workbook, result.fileName);

    toast.success(
      'Masque généré',
      `${result.stats.gradeColumns} colonnes de notes générées`
    );
  };

  const handleExportConfigTemplate = async (config: TemplateConfig) => {
    // Importer dynamiquement le module ExcelJS
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Générateur de Relevés - Template';
    workbook.created = new Date();
    workbook.subject = 'Modèle de Configuration Académique';

    const worksheet = workbook.addWorksheet('Modèle');

    // Configuration de la page
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1
    };

    // En-têtes (LIGNE 1 - noms de colonnes exacts pour l'import)
    const headers = [
      'ID Config', 'Nom Configuration', 'Année Académique', 'Filière', 'Niveau', 'Cycle', 'Option',
      'ID Semestre', 'Nom Semestre', 'ID UE', 'Code UE', 'Nom UE', 'Crédits UE', 'ID EC', 'Nom EC'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 40;
    headerRow.eachCell((cell, colNumber) => {
      cell.style = {
        font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
          top: { style: 'medium', color: { argb: 'FF2F5F8F' } },
          left: { style: 'thin', color: { argb: 'FF2F5F8F' } },
          bottom: { style: 'medium', color: { argb: 'FF2F5F8F' } },
          right: { style: 'thin', color: { argb: 'FF2F5F8F' } }
        }
      };

      // Ajouter une note sur la première cellule
      if (colNumber === 1) {
        cell.note = `Modèle de Configuration Académique\n\n⚠️ NE PAS MODIFIER LES EN-TÊTES\nCommencez la saisie à partir de la ligne ${config.includeExamples ? 5 : 2}`;
      }
    });

    // Données d'exemple si demandé
    if (config.includeExamples) {
      const exampleData = [
        ['LIC_INFO_2024', 'Licence Informatique', '2024-2025', 'Sciences et Technologies', '1', 'Licence', '',
         'S1_LIC_INFO', 'Semestre 1', 'UE_ALGO_PROG', 'INF1101', 'Algorithmes et Programmation', 6,
         'EC_INTRO_ALGO', 'Introduction aux Algorithmes'],
        ['LIC_INFO_2024', '', '', '', '', '', '',
         'S1_LIC_INFO', '', 'UE_ALGO_PROG', '', '', '',
         'EC_PROG_C', 'Programmation en C'],
        ['LIC_INFO_2024', '', '', '', '', '', '',
         'S1_LIC_INFO', '', 'UE_MATH', 'MAT1101', 'Mathématiques pour l\'Informatique', 5,
         'EC_ALGEBRE', 'Algèbre Linéaire']
      ];

      exampleData.forEach(rowData => {
        const row = worksheet.addRow(rowData);
        row.eachCell((cell) => {
          cell.style = {
            border: {
              top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            },
            alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF5E7' } },
            font: { italic: true, color: { argb: 'FF7F8C8D' } }
          };
          cell.note = 'Exemple - Vous pouvez supprimer cette ligne';
        });
      });
    }

    // Lignes vides pour saisie
    for (let i = 0; i < config.numberOfStudents; i++) {
      worksheet.addRow([]);
    }

    // Largeurs de colonnes
    const columnWidths = [16, 32, 18, 22, 10, 15, 22, 16, 22, 14, 14, 42, 12, 14, 48];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // Figer la première ligne (en-têtes)
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
    ];

    // Filtres automatiques
    worksheet.autoFilter = { from: 'A1', to: 'O1' };

    const date = new Date().toISOString().split('T')[0];
    const fileName = `modele_configuration_academique_${date}.xlsx`;

    await downloadWorkbook(workbook, fileName);
  };

  const downloadWorkbook = async (workbook: any, fileName: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, {
      bg: string;
      border: string;
      text: string;
      hover: string;
      icon: string;
    }> = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        hover: 'hover:bg-blue-100',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        hover: 'hover:bg-green-100',
        icon: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        hover: 'hover:bg-purple-100',
        icon: 'text-purple-600'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-900',
        hover: 'hover:bg-orange-100',
        icon: 'text-orange-600'
      },
      teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-900',
        hover: 'hover:bg-teal-100',
        icon: 'text-teal-600'
      }
    };

    return colorMap[color] || colorMap.blue;
  };

  // Grouper par catégorie
  const dataImportTemplates = availableTemplates.filter(t => t.category === 'data-import');
  const configTemplates = availableTemplates.filter(t => t.category === 'configuration');
  const gradeEntryTemplates = availableTemplates.filter(t => t.category === 'grade-entry');

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />

      {/* Dialog de configuration */}
      {currentTemplate && (
        <TemplateConfigDialog
          open={configDialogOpen}
          onClose={() => {
            setConfigDialogOpen(false);
            setCurrentTemplate(null);
          }}
          onConfirm={handleConfigConfirm}
          templateType={currentTemplate.type as any}
          establishmentType={establishmentType}
          classConfigs={classConfigs}
        />
      )}

      <div className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileDown className="h-8 w-8 text-blue-600" />
            Export des Modèles Excel
          </h1>
          <p className="text-gray-600">
            Téléchargez les modèles Excel avec les noms de colonnes EXACTS attendus à l'importation
          </p>
        </div>

        {/* Info général */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Important :</strong> Ces modèles utilisent les noms de colonnes EXACTS définis dans le système.
            Ne modifiez pas les en-têtes de colonnes. Toutes les colonnes nécessaires pour le QR code sont incluses.
          </AlertDescription>
        </Alert>

        {/* Masque de saisie de notes */}
        {gradeEntryTemplates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-gray-800">Masque de Saisie de Notes</h2>
              <Badge variant="secondary">Nouveau</Badge>
              <Badge variant="outline">{classConfigs.length} configs disponibles</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {gradeEntryTemplates.map((template) => {
                const Icon = template.icon;
                const colors = getColorClasses(template.color);
                const isLoading = loadingTemplates.has(template.id);
                const isDownloaded = downloadedTemplates.has(template.id);

                return (
                  <Card
                    key={template.id}
                    className={`${colors.border} ${colors.hover} transition-all`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={`h-8 w-8 ${colors.icon}`} />
                        {isDownloaded && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <CardTitle className={`text-lg ${colors.text}`}>
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                      {classConfigs.length === 0 && (
                        <Alert className="mt-2">
                          <AlertDescription className="text-xs">
                            ⚠️ Aucune configuration de classe trouvée. Créez d'abord une configuration dans "Config des relevés".
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleExportClick(template)}
                        disabled={isLoading || classConfigs.length === 0}
                        className="w-full"
                        variant="outline"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Configurer & Télécharger
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Templates d'import de données */}
        {dataImportTemplates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-gray-800">Modèles d'Import de Données</h2>
              <Badge variant="secondary">{dataImportTemplates.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataImportTemplates.map((template) => {
                const Icon = template.icon;
                const colors = getColorClasses(template.color);
                const isLoading = loadingTemplates.has(template.id);
                const isDownloaded = downloadedTemplates.has(template.id);

                return (
                  <Card
                    key={template.id}
                    className={`${colors.border} ${colors.hover} transition-all cursor-pointer`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={`h-8 w-8 ${colors.icon}`} />
                        {isDownloaded && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <CardTitle className={`text-lg ${colors.text}`}>
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleExportClick(template)}
                        disabled={isLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Configurer & Télécharger
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Templates de configuration */}
        {configTemplates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-gray-800">Modèles de Configuration</h2>
              <Badge variant="secondary">{configTemplates.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configTemplates.map((template) => {
                const Icon = template.icon;
                const colors = getColorClasses(template.color);
                const isLoading = loadingTemplates.has(template.id);
                const isDownloaded = downloadedTemplates.has(template.id);

                return (
                  <Card
                    key={template.id}
                    className={`${colors.border} ${colors.hover} transition-all cursor-pointer`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={`h-8 w-8 ${colors.icon}`} />
                        {isDownloaded && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <CardTitle className={`text-lg ${colors.text}`}>
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleExportClick(template)}
                        disabled={isLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Configurer & Télécharger
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Aide */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Comment utiliser ces modèles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>1.</strong> Cliquez sur "Configurer & Télécharger" pour le modèle désiré
            </p>
            <p>
              <strong>2.</strong> Personnalisez les paramètres (nombre de lignes, exemples, etc.)
            </p>
            <p>
              <strong>3.</strong> Le modèle sera généré avec les noms de colonnes EXACTS
            </p>
            <p>
              <strong>4.</strong> Remplissez vos données sans modifier les en-têtes
            </p>
            <p>
              <strong>5.</strong> Importez le fichier dans le module correspondant
            </p>
            <p className="mt-4 text-xs text-blue-600">
              💡 <strong>Masque de Saisie :</strong> Générez un fichier avec toutes les colonnes de notes (ECs)
              d'une configuration de classe pour faciliter la saisie en masse.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
