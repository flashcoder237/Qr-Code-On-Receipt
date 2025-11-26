// src/components/organisms/diploma-generator/DiplomaGenerationReport.tsx
// Rapport imprimable des diplômes générés et refusés

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  FileText,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DiplomaValidationResult, getFieldDisplayName } from './diploma-validator';

interface DiplomaGenerationReportProps {
  validDiplomas: DiplomaValidationResult[];
  invalidDiplomas: DiplomaValidationResult[];
  generatedCount: number; // Nombre réellement générés
  failedGenerations: Array<{
    student: DiplomaValidationResult;
    error: string;
  }>;
  schoolName: string;
  generationDate: Date;
}

export const DiplomaGenerationReport: React.FC<DiplomaGenerationReportProps> = ({
  validDiplomas,
  invalidDiplomas,
  generatedCount,
  failedGenerations,
  schoolName,
  generationDate
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Rapport de Génération de Diplômes</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  font-size: 12pt;
                }
                h1 {
                  color: #1e40af;
                  border-bottom: 3px solid #1e40af;
                  padding-bottom: 10px;
                }
                h2 {
                  color: #374151;
                  margin-top: 20px;
                  border-bottom: 1px solid #d1d5db;
                  padding-bottom: 5px;
                }
                h3 {
                  color: #6b7280;
                  margin-top: 15px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                }
                th, td {
                  border: 1px solid #d1d5db;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f3f4f6;
                  font-weight: bold;
                }
                .success {
                  color: #059669;
                  font-weight: bold;
                }
                .error {
                  color: #dc2626;
                  font-weight: bold;
                }
                .warning {
                  color: #f59e0b;
                  font-weight: bold;
                }
                .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 15px;
                  margin: 20px 0;
                }
                .stat-box {
                  border: 1px solid #d1d5db;
                  padding: 15px;
                  border-radius: 5px;
                }
                .stat-box h4 {
                  margin: 0 0 5px 0;
                  color: #6b7280;
                  font-size: 11pt;
                }
                .stat-box .value {
                  font-size: 24pt;
                  font-weight: bold;
                }
                @media print {
                  .no-print {
                    display: none;
                  }
                  body {
                    margin: 10mm;
                  }
                }
              </style>
            </head>
            <body>
              ${reportRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const totalStudents = validDiplomas.length + invalidDiplomas.length;
  const successRate = totalStudents > 0 ? (generatedCount / totalStudents) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport de Génération
          </CardTitle>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer le rapport
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={reportRef} className="space-y-6">
          {/* En-tête du rapport */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-blue-900">
              Rapport de Génération de Diplômes
            </h1>
            <p className="text-gray-600 mt-2">{schoolName}</p>
            <p className="text-sm text-gray-500">
              Généré le {generationDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} à {generationDate.toLocaleTimeString('fr-FR')}
            </p>
          </div>

          {/* Statistiques globales */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vue d'ensemble
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-box border rounded-lg p-4 bg-blue-50">
                <h4 className="text-sm text-gray-600 mb-1">Total</h4>
                <div className="value text-3xl font-bold text-blue-900">
                  {totalStudents}
                </div>
                <p className="text-xs text-gray-500">diplômés traités</p>
              </div>

              <div className="stat-box border rounded-lg p-4 bg-green-50">
                <h4 className="text-sm text-gray-600 mb-1">Générés</h4>
                <div className="value text-3xl font-bold text-green-900 success">
                  {generatedCount}
                </div>
                <p className="text-xs text-gray-500">{successRate.toFixed(1)}% de succès</p>
              </div>

              <div className="stat-box border rounded-lg p-4 bg-yellow-50">
                <h4 className="text-sm text-gray-600 mb-1">Non-générables</h4>
                <div className="value text-3xl font-bold text-yellow-900 warning">
                  {invalidDiplomas.length}
                </div>
                <p className="text-xs text-gray-500">critères non remplis</p>
              </div>

              <div className="stat-box border rounded-lg p-4 bg-red-50">
                <h4 className="text-sm text-gray-600 mb-1">Erreurs</h4>
                <div className="value text-3xl font-bold text-red-900 error">
                  {failedGenerations.length}
                </div>
                <p className="text-xs text-gray-500">échecs techniques</p>
              </div>
            </div>
          </div>

          {/* Diplômes générés avec succès */}
          {generatedCount > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Diplômes générés avec succès ({generatedCount})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Prénom</th>
                      <th className="p-2 text-left">Matricule</th>
                      <th className="p-2 text-left">Moyenne</th>
                      <th className="p-2 text-left">Mention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validDiplomas
                      .filter((_, index) => index < generatedCount)
                      .map((result, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 font-medium">{result.student.NOM}</td>
                          <td className="p-2">{result.student.PRENOM}</td>
                          <td className="p-2">{result.student.MATRICULE}</td>
                          <td className="p-2 text-green-700 font-semibold">
                            {typeof result.student.MOYENNE === 'number'
                              ? result.student.MOYENNE.toFixed(2)
                              : result.student.MOYENNE}
                          </td>
                          <td className="p-2">{result.student.MENTION}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Diplômes non générables */}
          {invalidDiplomas.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Diplômes non générables ({invalidDiplomas.length})
              </h2>
              <Alert className="mb-4 border-yellow-300 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Ces diplômes ne peuvent pas être générés car ils ne remplissent pas les critères requis
                  (données incomplètes ou moyenne inférieure à 10/20).
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-yellow-50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Prénom</th>
                      <th className="p-2 text-left">Matricule</th>
                      <th className="p-2 text-left">Raison</th>
                      <th className="p-2 text-left">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidDiplomas.map((result, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2 font-medium">{result.student.NOM}</td>
                        <td className="p-2">{result.student.PRENOM}</td>
                        <td className="p-2">{result.student.MATRICULE}</td>
                        <td className="p-2 text-yellow-700 font-semibold">{result.reason}</td>
                        <td className="p-2 text-xs">
                          {result.issues.length > 0 && (
                            <ul className="list-disc list-inside">
                              {result.issues.slice(0, 3).map((issue, i) => (
                                <li key={i}>{getFieldDisplayName(issue.field)}</li>
                              ))}
                              {result.issues.length > 3 && (
                                <li>... et {result.issues.length - 3} autre(s)</li>
                              )}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Échecs techniques */}
          {failedGenerations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Échecs techniques ({failedGenerations.length})
              </h2>
              <Alert className="mb-4 border-red-300 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Ces diplômes remplissaient les critères mais ont rencontré une erreur lors de la génération.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-red-50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Nom</th>
                      <th className="p-2 text-left">Prénom</th>
                      <th className="p-2 text-left">Matricule</th>
                      <th className="p-2 text-left">Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedGenerations.map((failure, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2 font-medium">{failure.student.student.NOM}</td>
                        <td className="p-2">{failure.student.student.PRENOM}</td>
                        <td className="p-2">{failure.student.student.MATRICULE}</td>
                        <td className="p-2 text-red-700 text-xs">{failure.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pied de page */}
          <div className="text-center text-sm text-gray-500 border-t pt-4 mt-8">
            <p>Document généré automatiquement par le système de gestion des diplômes</p>
            <p className="mt-1">{schoolName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
