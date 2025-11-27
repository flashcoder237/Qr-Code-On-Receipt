// src/components/organisms/diploma-generator/ImportReport.tsx
// Composant pour afficher un rapport détaillé des données importées

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface FieldStatus {
  fieldName: string;
  displayName: string;
  required: boolean;
  missingCount: number;
  filledCount: number;
  percentage: number;
}

export interface ImportStats {
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  fieldsStatus: FieldStatus[];
}

interface ImportReportProps {
  stats: ImportStats;
}

export const ImportReport: React.FC<ImportReportProps> = ({ stats }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRequiredDetails, setShowRequiredDetails] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const completionRate = (stats.completeRecords / stats.totalRecords) * 100;

  const requiredFields = stats.fieldsStatus.filter(f => f.required);
  const optionalFields = stats.fieldsStatus.filter(f => !f.required);

  const getFieldIcon = (field: FieldStatus) => {
    if (field.percentage === 100) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (field.percentage === 0) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getFieldBadge = (field: FieldStatus) => {
    if (field.percentage === 100) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Complet</Badge>;
    } else if (field.percentage === 0) {
      return <Badge variant="destructive">Vide</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Partiel</Badge>;
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
            <FileText className="h-4 w-4" />
            Rapport d'Importation
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 py-3">
        {/* Vue d'ensemble compacte */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-white rounded border">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Total</span>
            </div>
            <div className="text-xl font-bold text-blue-900">{stats.totalRecords}</div>
          </div>

          <div className="p-2 bg-white rounded border">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Complets</span>
            </div>
            <div className="text-xl font-bold text-green-900">{stats.completeRecords}</div>
          </div>

          <div className="p-2 bg-white rounded border">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-gray-600">Incomplets</span>
            </div>
            <div className="text-xl font-bold text-yellow-900">{stats.incompleteRecords}</div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium">Complétion</span>
            <span className="font-bold text-blue-700">{completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Alerte si données incomplètes - compacte */}
        {stats.incompleteRecords > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50 py-2">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-xs">
              <strong>{stats.incompleteRecords} enregistrement(s)</strong> incomplets. Les champs vides afficheront "N/D".
            </AlertDescription>
          </Alert>
        )}

        {/* Sections détaillées - pliables */}
        {isExpanded && (
          <>
            {/* Détails des champs requis */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRequiredDetails(!showRequiredDetails)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Champs Obligatoires ({requiredFields.length})
                </div>
                {showRequiredDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showRequiredDetails && (
                <div className="space-y-2">
                  {requiredFields.map((field, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1">
                          {getFieldIcon(field)}
                          <span className="text-xs font-medium text-gray-900">{field.displayName}</span>
                        </div>
                        {getFieldBadge(field)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {field.filledCount}
                        </span>
                        {field.missingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {field.missingCount}
                          </span>
                        )}
                      </div>

                      <Progress value={field.percentage} className="h-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Détails des champs optionnels */}
            {optionalFields.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Champs Optionnels ({optionalFields.length})
                  </div>
                  {showOptionalDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showOptionalDetails && (
                  <div className="space-y-2">
                    {optionalFields.map((field, index) => (
                      <div key={index} className="bg-white p-2 rounded border border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {getFieldIcon(field)}
                            <span className="text-xs font-medium text-gray-700">{field.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">
                              {field.filledCount}/{stats.totalRecords}
                            </span>
                            {getFieldBadge(field)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
