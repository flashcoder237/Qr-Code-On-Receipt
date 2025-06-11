// src/components/organisms/receipts/components/FileUploader.tsx - Version corrigée
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  validateExcelColumns, 
  formatValidationErrorMessage, 
  generateColumnMapping,
  ValidationResult 
} from '@/lib/validators/excel-columns';

interface FileUploaderProps {
  onFileLoaded: (data: any[], columns: string[], mapping?: { [key: string]: string }) => void;
  onError: (error: string) => void;
  onValidationResult?: (result: ValidationResult) => void;
  isLoading: boolean;
  documentType: 'releve' | 'attestation';
  allowPartialImport?: boolean;
}

/**
 * Sanitise une ligne de données Excel en remplaçant les valeurs vides par des valeurs par défaut
 */
function sanitizeExcelRow(row: any, documentType: 'releve' | 'attestation'): any {
  const sanitized = { ...row };
  
  // Champs communs à tous les types de documents
  const commonFields = [
    'NOM', 'PRENOM', 'MATRICULE', 'DATE DE NAISSANCE', 'LIEU DE NAISSANCE',
    'ANNEE ACADEMIQUE', 'SEXE', 'EMAIL'
  ];
  
  // Champs spécifiques aux relevés
  const releveFields = [
    'NIVEAU', 'SEMESTRE', 'CYCLE', 'FILIERE'
  ];
  
  // Champs spécifiques aux attestations
  const attestationFields = [
    'PARCOURS', 'SPECIALITE', 'OPTION', 'MOYENNE', 'GRADE', 'MENTION',
    'FINALITE', 'TOTAL CREDIT', 'DOMAINE', 'DATE JURY'
  ];
  
  // Déterminer les champs à sanitiser selon le type de document
  let fieldsToSanitize = [...commonFields];
  if (documentType === 'releve') {
    fieldsToSanitize = [...fieldsToSanitize, ...releveFields];
  } else if (documentType === 'attestation') {
    fieldsToSanitize = [...fieldsToSanitize, ...attestationFields];
  }
  
  // Sanitiser les champs
  fieldsToSanitize.forEach(field => {
    if (sanitized[field] === undefined || 
        sanitized[field] === null || 
        (typeof sanitized[field] === 'string' && sanitized[field].trim() === '')) {
      
      // Valeurs par défaut spécifiques
      if (field === 'MOYENNE') {
        sanitized[field] = 0;
      } else if (field === 'SEXE') {
        sanitized[field] = 'N/D';
      } else if (field === 'EMAIL') {
        sanitized[field] = '';
      } else {
        sanitized[field] = 'N/D';
      }
    }
  });
  
  // Traitement spécial pour les dates
  if (sanitized['DATE DE NAISSANCE'] && typeof sanitized['DATE DE NAISSANCE'] === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(sanitized['DATE DE NAISSANCE']);
      if (date) {
        sanitized['DATE DE NAISSANCE'] = `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(2, "0")}/${date.y}`;
      }
    } catch (e) {
      console.warn('Erreur lors de la conversion de la date de naissance:', e);
      sanitized['DATE DE NAISSANCE'] = 'N/D';
    }
  }
  
  if (sanitized['DATE JURY'] && typeof sanitized['DATE JURY'] === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(sanitized['DATE JURY']);
      if (date) {
        sanitized['DATE JURY'] = `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(2, "0")}/${date.y}`;
      }
    } catch (e) {
      console.warn('Erreur lors de la conversion de la date du jury:', e);
      sanitized['DATE JURY'] = 'N/D';
    }
  }
  
  return sanitized;
}

/**
 * Applique le mapping des colonnes à une ligne de données
 */
function applyColumnMapping(row: any, mapping: { [key: string]: string }): any {
  const mappedRow: any = {};
  
  // Copier toutes les données originales
  Object.keys(row).forEach(key => {
    mappedRow[key] = row[key];
  });
  
  // Appliquer le mapping
  Object.entries(mapping).forEach(([targetKey, sourceKey]) => {
    if (sourceKey && row[sourceKey] !== undefined) {
      mappedRow[targetKey] = row[sourceKey];
    }
  });
  
  return mappedRow;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileLoaded,
  onError,
  onValidationResult,
  isLoading,
  documentType,
  allowPartialImport = false
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [pendingData, setPendingData] = useState<{
    data: any[];
    columns: string[];
    mapping: { [key: string]: string };
  } | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const processFile = async (file: File) => {
    try {
      console.log('📁 Traitement du fichier:', file.name);
      
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

      if (jsonData.length === 0) {
        throw new Error("Le fichier ne contient aucune donnée");
      }

      const columns = Object.keys(jsonData[0]);
      console.log('📋 Colonnes détectées:', columns);
      
      // Valider les colonnes
      const validation = validateExcelColumns(columns, documentType);
      setValidationResult(validation);
      
      if (onValidationResult) {
        onValidationResult(validation);
      }

      // Générer le mapping automatique
      const automaticMapping = generateColumnMapping(columns, documentType);
      console.log('🔄 Mapping automatique généré:', automaticMapping);

      if (validation.isValid) {
        // Toutes les colonnes requises sont présentes
        console.log('✅ Validation réussie - Application du mapping et sanitisation');
        
        // Appliquer le mapping et sanitiser les données
        const processedData = jsonData.map(row => {
          const mappedRow = applyColumnMapping(row, automaticMapping);
          return sanitizeExcelRow(mappedRow, documentType);
        });
        
        console.log('📊 Données traitées:', processedData.length, 'lignes');
        onFileLoaded(processedData, columns, automaticMapping);
        setPendingData(null);
        
      } else if (allowPartialImport && validation.missingRequired.length === 0) {
        // Seules des colonnes optionnelles manquent, on peut continuer
        console.log('⚠️ Validation partielle - Application du mapping et sanitisation');
        
        const processedData = jsonData.map(row => {
          const mappedRow = applyColumnMapping(row, automaticMapping);
          return sanitizeExcelRow(mappedRow, documentType);
        });
        
        onFileLoaded(processedData, columns, automaticMapping);
        setPendingData(null);
        
      } else {
        // Des colonnes requises manquent
        console.log('❌ Validation échouée - Colonnes requises manquantes');
        setPendingData({ 
          data: jsonData, 
          columns, 
          mapping: automaticMapping 
        });
        setShowValidationDetails(true);
        
        const errorMessage = formatValidationErrorMessage(validation);
        onError(`Colonnes manquantes dans le fichier Excel:\n\n${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement du fichier";
      console.error('❌ Erreur de traitement:', errorMessage);
      onError(errorMessage);
      setValidationResult(null);
      setPendingData(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isLoading,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      await processFile(acceptedFiles[0]);
    }
  });

  const handleForceImport = () => {
    if (pendingData) {
      console.log('🔄 Import forcé avec données partielles');
      
      // Appliquer le mapping et sanitiser les données même avec des colonnes manquantes
      const processedData = pendingData.data.map(row => {
        const mappedRow = applyColumnMapping(row, pendingData.mapping);
        return sanitizeExcelRow(mappedRow, documentType);
      });
      
      onFileLoaded(processedData, pendingData.columns, pendingData.mapping);
      setPendingData(null);
      setValidationResult(null);
      setShowValidationDetails(false);
    }
  };

  const handleRetry = () => {
    setValidationResult(null);
    setPendingData(null);
    setShowValidationDetails(false);
  };

  const getValidationStatusColor = (validation: ValidationResult) => {
    if (validation.isValid) return 'text-green-600';
    if (validation.missingRequired.length === 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationStatusIcon = (validation: ValidationResult) => {
    if (validation.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (validation.missingRequired.length === 0) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <X className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop principal */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : isLoading
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : validationResult?.isValid
            ? "border-green-300 bg-green-50"
            : validationResult && !validationResult.isValid
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-3">
          {validationResult ? (
            getValidationStatusIcon(validationResult)
          ) : (
            <Upload className={`h-12 w-12 ${
              isLoading ? "text-gray-300" : "text-gray-400"
            }`} />
          )}
          
          <div>
            <p className={`text-sm font-medium ${
              validationResult ? getValidationStatusColor(validationResult) : 
              isLoading ? "text-gray-400" : "text-gray-600"
            }`}>
              {isDragActive
                ? "Déposez le fichier ici..."
                : isLoading
                ? "Chargement en cours..."
                : validationResult?.isValid
                ? "✅ Fichier validé avec succès cliquer pour charger un autre fichier"
                : validationResult && !validationResult.isValid
                ? "❌ Problèmes détectés dans le fichier"
                : `Glissez-déposez un fichier Excel pour ${documentType === 'releve' ? 'les relevés' : 'les attestations'}`}
            </p>
            
            {!validationResult && (
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: .xlsx, .xls (Les données manquantes seront remplacées par "N/D")
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Résultats de validation */}
      {validationResult && (
        <div className="space-y-3">
          {/* Résumé de validation */}
          <div className={`p-4 rounded-lg border ${
            validationResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : validationResult.missingRequired.length === 0
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getValidationStatusIcon(validationResult)}
                <div>
                  <h4 className={`font-medium ${getValidationStatusColor(validationResult)}`}>
                    {validationResult.isValid 
                      ? 'Validation réussie' 
                      : validationResult.missingRequired.length === 0
                      ? 'Validation partielle'
                      : 'Validation échouée'
                    }
                  </h4>
                  <p className="text-sm mt-1">
                    {validationResult.isValid 
                      ? `Toutes les colonnes requises sont présentes (${validationResult.availableColumns.length} colonnes détectées)`
                      : validationResult.missingRequired.length === 0
                      ? `Colonnes requises présentes, ${validationResult.missingOptional.length} colonnes optionnelles manquantes`
                      : `${validationResult.missingRequired.length} colonnes requises manquantes`
                    }
                  </p>
                  {validationResult.isValid && Object.keys(validationResult.mappedColumns || {}).length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ {Object.keys(validationResult.mappedColumns).length} correspondance(s) automatique(s) trouvée(s)
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">
                    🧹 Les données manquantes seront automatiquement remplacées par "N/D"
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidationDetails(!showValidationDetails)}
                >
                  {showValidationDetails ? 'Masquer' : 'Détails'}
                </Button>
                
                {!validationResult.isValid && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Réessayer
                    </Button>
                    
                    {(allowPartialImport || validationResult.missingRequired.length === 0) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleForceImport}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        Importer quand même
                      </Button>
                    )}
                    </>
                )}
              </div>
            </div>
          </div>

          {/* Détails de validation */}
          {showValidationDetails && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Correspondances automatiques trouvées */}
              {validationResult.isValid && validationResult.mappedColumns && Object.keys(validationResult.mappedColumns).length > 0 && (
                <div>
                  <h5 className="font-medium text-green-800 mb-2">
                    ✅ Correspondances automatiques trouvées ({Object.keys(validationResult.mappedColumns).length})
                  </h5>
                  <div className="space-y-1">
                    {Object.entries(validationResult.mappedColumns).map(([expectedCol, foundCol]) => (
                      <div key={expectedCol} className="flex items-center justify-between p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-800">{expectedCol}</span>
                          <span className="text-green-600">←</span>
                          <span className="text-sm text-green-700">"{foundCol}"</span>
                        </div>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Mappé
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colonnes requises manquantes */}
              {validationResult.missingRequired.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-800 mb-2">
                    Colonnes obligatoires manquantes ({validationResult.missingRequired.length})
                  </h5>
                  <div className="space-y-2">
                    {validationResult.missingRequired.map((req) => (
                      <div key={req.key} className="flex items-start justify-between p-2 bg-white rounded border-l-4 border-red-400">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{req.displayName}</p>
                          <p className="text-xs text-gray-600">Nom attendu: {req.key}</p>
                          {req.alternatives && (
                            <p className="text-xs text-gray-500">
                              Alternatives acceptées: {req.alternatives.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Cette colonne sera automatiquement remplie avec "N/D" si vous importez quand même
                          </p>
                        </div>
                        {validationResult.suggestions[req.key]?.length > 0 && (
                          <div className="ml-4">
                            <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                            <div className="flex flex-wrap gap-1">
                              {validationResult.suggestions[req.key].map((suggestion) => (
                                <Badge key={suggestion} variant="outline" className="text-xs">
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colonnes optionnelles manquantes */}
              {validationResult.missingOptional.length > 0 && (
                <div>
                  <h5 className="font-medium text-yellow-800 mb-2">
                    Colonnes optionnelles manquantes ({validationResult.missingOptional.length})
                  </h5>
                  <div className="space-y-2">
                    {validationResult.missingOptional.map((req) => (
                      <div key={req.key} className="flex items-start justify-between p-2 bg-white rounded border-l-4 border-yellow-400">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{req.displayName}</p>
                          <p className="text-xs text-gray-600">Nom attendu: {req.key}</p>
                          {req.alternatives && (
                            <p className="text-xs text-gray-500">
                              Alternatives acceptées: {req.alternatives.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Cette colonne sera automatiquement remplie avec "N/D"
                          </p>
                        </div>
                        {validationResult.suggestions[req.key]?.length > 0 && (
                          <div className="ml-4">
                            <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                            <div className="flex flex-wrap gap-1">
                              {validationResult.suggestions[req.key].map((suggestion) => (
                                <Badge key={suggestion} variant="outline" className="text-xs">
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colonnes disponibles */}
              <div>
                <h5 className="font-medium text-gray-800 mb-2">
                  Colonnes détectées dans votre fichier ({validationResult.availableColumns.length})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {validationResult.availableColumns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Guide d'aide */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Comment corriger :</strong>
                  <br />
                  1. Modifiez votre fichier Excel pour inclure les colonnes manquantes
                  <br />
                  2. Ou renommez vos colonnes existantes selon les suggestions
                  <br />
                  3. Réimportez le fichier une fois corrigé
                  {allowPartialImport && (
                    <>
                      <br />
                      4. Vous pouvez aussi continuer avec "Importer quand même" - les colonnes manquantes seront remplies avec "N/D"
                    </>
                  )}
                  <br />
                  <br />
                  <strong>🧹 Sanitisation automatique :</strong> Toutes les cellules vides ou manquantes seront automatiquement remplacées par "N/D" pour garantir la cohérence des données.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}
    </div>
  );
};