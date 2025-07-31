// src/components/organisms/student-selector/StudentSelector.tsx - Version avec validation des moyennes
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  Eye,
  FileDown,
  CheckCircle2,
  Circle,
  Shield,
  ShieldCheck,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  XCircle,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { 
  validateStudentForAttestation, 
  filterEligibleStudents, 
  calculateAverageStatistics 
} from "@/lib/validation/average-validation";

interface Student {
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  MOYENNE?: number | string;
  GRADE?: string;
  MENTION?: string;
  NIVEAU?: string;
  SEMESTRE?: string;
  PARCOURS?: string;
  SPECIALITE?: string;
  "ANNEE ACADEMIQUE"?: string;
  [key: string]: any;
}

interface StudentSelectorProps {
  students: Student[];
  selectedStudents: string[];
  onSelectionChange: (matricules: string[]) => void;
  onPreview: (student: Student) => void;
  onGenerateSelected: (students?: Student[]) => void;
  documentType: "releve" | "attestation" | "diplome";
  isLoading?: boolean;
  additionalInfo?: string;
  maxSelection?: number;
  showFilters?: boolean;
  showPreview?: boolean;
  enableBulkActions?: boolean;
}

type SortField = 'nom' | 'prenom' | 'matricule' | 'moyenne' | 'niveau';
type SortOrder = 'asc' | 'desc';

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudents,
  onSelectionChange,
  onPreview,
  onGenerateSelected,
  documentType,
  isLoading = false,
  additionalInfo,
  maxSelection,
  showFilters = true,
  showPreview = true,
  enableBulkActions = true
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterMention, setFilterMention] = useState<string>("all");
  const [filterEligibility, setFilterEligibility] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  // Validation des moyennes pour les attestations
  const eligibilityData = useMemo(() => {
    if (documentType !== 'attestation') {
      return {
        eligible: students,
        ineligible: [],
        eligibleCount: students.length,
        ineligibleCount: 0
      };
    }
    return filterEligibleStudents(students);
  }, [students, documentType]);

  const averageStats = useMemo(() => {
    if (documentType !== 'attestation') return null;
    return calculateAverageStatistics(students);
  }, [students, documentType]);

  // Fonctions de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <MoreHorizontal className="h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  // Filtrage et tri des étudiants avec validation des moyennes
  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter(student => {
      const searchMatch = !searchTerm || 
        `${student.NOM} ${student.PRENOM} ${student.MATRICULE}`.toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const gradeMatch = filterGrade === "all" || student.GRADE === filterGrade;
      const mentionMatch = filterMention === "all" || student.MENTION === filterMention;
      
      // Filtre d'éligibilité pour les attestations
      let eligibilityMatch = true;
      if (documentType === 'attestation' && filterEligibility !== "all") {
        const validation = validateStudentForAttestation(student);
        if (filterEligibility === "eligible") {
          eligibilityMatch = validation.isEligible;
        } else if (filterEligibility === "ineligible") {
          eligibilityMatch = !validation.isEligible;
        }
      }
      
      return searchMatch && gradeMatch && mentionMatch && eligibilityMatch;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'nom':
          aValue = a.NOM || '';
          bValue = b.NOM || '';
          break;
        case 'prenom':
          aValue = a.PRENOM || '';
          bValue = b.PRENOM || '';
          break;
        case 'matricule':
          aValue = a.MATRICULE || '';
          bValue = b.MATRICULE || '';
          break;
        case 'moyenne':
          aValue = typeof a.MOYENNE === 'number' ? a.MOYENNE : parseFloat(String(a.MOYENNE)) || 0;
          bValue = typeof b.MOYENNE === 'number' ? b.MOYENNE : parseFloat(String(b.MOYENNE)) || 0;
          break;
        case 'niveau':
          aValue = a.NIVEAU || '';
          bValue = b.NIVEAU || '';
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [students, searchTerm, filterGrade, filterMention, filterEligibility, sortField, sortOrder, documentType]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, startIndex + studentsPerPage);

  // Options uniques pour les filtres
  const uniqueGrades = useMemo(() => 
    [...new Set(students.map(s => s.GRADE).filter(Boolean))].sort()
  , [students]);

  const uniqueMentions = useMemo(() => 
    [...new Set(students.map(s => s.MENTION).filter(Boolean))].sort()
  , [students]);

  // Gestion de la sélection avec validation pour les attestations
  const handleStudentSelect = (matricule: string, selected: boolean) => {
    if (selected) {
      // Vérifier l'éligibilité pour les attestations
      if (documentType === 'attestation') {
        const student = students.find(s => s.MATRICULE === matricule);
        if (student) {
          const validation = validateStudentForAttestation(student);
          if (!validation.isEligible) {
            // Ne pas permettre la sélection si non éligible
            return;
          }
        }
      }
      
      if (!maxSelection || selectedStudents.length < maxSelection) {
        onSelectionChange([...selectedStudents, matricule]);
      }
    } else {
      onSelectionChange(selectedStudents.filter(m => m !== matricule));
    }
  };

  const handleSelectAll = () => {
    let studentsToSelect = paginatedStudents;
    
    // Pour les attestations, ne sélectionner que les étudiants éligibles
    if (documentType === 'attestation') {
      studentsToSelect = studentsToSelect.filter(student => {
        const validation = validateStudentForAttestation(student);
        return validation.isEligible;
      });
    }
    
    const currentPageMatricules = studentsToSelect.map(s => s.MATRICULE);
    const allSelected = currentPageMatricules.every(m => selectedStudents.includes(m));
    
    if (allSelected) {
      // Désélectionner tous les étudiants de la page courante
      onSelectionChange(selectedStudents.filter(m => !currentPageMatricules.includes(m)));
    } else {
      // Sélectionner tous les étudiants éligibles de la page courante
      const toAdd = currentPageMatricules.filter(m => !selectedStudents.includes(m));
      const availableSlots = maxSelection ? maxSelection - selectedStudents.length : toAdd.length;
      const newSelected = [...selectedStudents, ...toAdd.slice(0, availableSlots)];
      onSelectionChange(newSelected);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleGenerateSelected = () => {
    let studentsToGenerate = students.filter(s => selectedStudents.includes(s.MATRICULE));
    
    // Pour les attestations, filtrer encore une fois pour s'assurer qu'aucun étudiant non éligible n'est inclus
    if (documentType === 'attestation') {
      studentsToGenerate = studentsToGenerate.filter(student => {
        const validation = validateStudentForAttestation(student);
        return validation.isEligible;
      });
    }
    
    onGenerateSelected(studentsToGenerate);
  };

  // Vérifier si un étudiant est éligible
  const isStudentEligible = (student: Student): boolean => {
    if (documentType !== 'attestation') return true;
    const validation = validateStudentForAttestation(student);
    return validation.isEligible;
  };

  // Obtenir la raison de non-éligibilité
  const getIneligibilityReason = (student: Student): string | null => {
    if (documentType !== 'attestation') return null;
    const validation = validateStudentForAttestation(student);
    return validation.isEligible ? null : validation.reason || null;
  };

  // Fonction pour obtenir l'icône du type de document
  const getDocumentIcon = () => {
    if (additionalInfo?.includes("Chiffrement")) {
      return <ShieldCheck className="h-4 w-4 text-green-600" />;
    }
    switch (documentType) {
      case "releve": return <FileDown className="h-4 w-4" />;
      case "attestation": return <Shield className="h-4 w-4" />;
      case "diplome": return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileDown className="h-4 w-4" />;
    }
  };

  // Calcul de la progression de sélection
  const selectionProgress = maxSelection ? (selectedStudents.length / maxSelection) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Statistiques d'éligibilité pour les attestations */}
      {documentType === 'attestation' && averageStats && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <TrendingUp className="h-5 w-5" />
              Éligibilité pour les Attestations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{averageStats.eligible}</div>
                <div className="text-sm text-gray-600">Éligibles (≥10/20)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{averageStats.ineligible}</div>
                <div className="text-sm text-gray-600">Non éligibles (&lt;10/20)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{averageStats.percentageEligible.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Taux d'éligibilité</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{averageStats.averageEligible.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Moyenne éligibles</div>
              </div>
            </div>
            {averageStats.ineligible > 0 && (
              <Alert className="mt-4 border-orange-300 bg-orange-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>{averageStats.ineligible} étudiant(s)</strong> ne peuvent pas recevoir d'attestation car leur moyenne est inférieure à 10/20.
                  Seuls les étudiants avec une moyenne ≥ 10/20 peuvent être sélectionnés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* En-tête avec informations et statistiques */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                Sélection des Étudiants
                {getDocumentIcon()}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                <span>{filteredAndSortedStudents.length} étudiant(s) disponible(s)</span>
                <span>•</span>
                <span className="font-medium">{selectedStudents.length} sélectionné(s)</span>
                {documentType === 'attestation' && eligibilityData.ineligibleCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">
                      {eligibilityData.ineligibleCount} non éligible(s)
                    </span>
                  </>
                )}
                {additionalInfo && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {additionalInfo}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {selectedStudents.length}
              </div>
              <div className="text-xs text-blue-600 uppercase tracking-wide">
                Sélectionnés
              </div>
            </div>
          </div>
          
          {maxSelection && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-blue-700 mb-2">
                <span>Progression de sélection</span>
                <span>{selectedStudents.length} / {maxSelection}</span>
              </div>
              <Progress 
                value={selectionProgress} 
                className="h-2 bg-blue-100"
              />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Filtres et recherche */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom, prénom ou matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les grades</SelectItem>
                    {uniqueGrades.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mention</Label>
                <Select value={filterMention} onValueChange={setFilterMention}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les mentions</SelectItem>
                    {uniqueMentions.map(mention => (
                      <SelectItem key={mention} value={mention}>{mention}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre d'éligibilité pour les attestations */}
              {documentType === 'attestation' && (
                <div className="space-y-2">
                  <Label>Éligibilité</Label>
                  <Select value={filterEligibility} onValueChange={setFilterEligibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="eligible">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Éligibles (≥10/20)
                        </div>
                      </SelectItem>
                      <SelectItem value="ineligible">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Non éligibles (&lt;10/20)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterGrade("all");
                      setFilterMention("all");
                      setFilterEligibility("all");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Reinitialiser
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de sélection en lot */}
      {enableBulkActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading || paginatedStudents.length === 0}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {(() => {
                    if (documentType === 'attestation') {
                      const eligibleOnPage = paginatedStudents.filter(s => isStudentEligible(s));
                      const allEligibleSelected = eligibleOnPage.every(s => selectedStudents.includes(s.MATRICULE));
                      return allEligibleSelected 
                        ? "Désélectionner éligibles" 
                        : `Sélectionner éligibles (${eligibleOnPage.length})`;
                    } else {
                      const allSelected = paginatedStudents.every(s => selectedStudents.includes(s.MATRICULE));
                      return allSelected ? "Désélectionner la page" : "Sélectionner la page";
                    }
                  })()}
                </Button>
                
                {selectedStudents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    disabled={isLoading}
                  >
                    Tout désélectionner
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showPreview && selectedStudents.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const firstSelected = students.find(s => selectedStudents.includes(s.MATRICULE));
                      if (firstSelected) onPreview(firstSelected);
                    }}
                    disabled={isLoading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                )}

                <Button
                  onClick={handleGenerateSelected}
                  disabled={isLoading || selectedStudents.length === 0}
                  className="min-w-32"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      {additionalInfo?.includes("Chiffrement") && <Shield className="mr-1 h-3 w-3" />}
                      Générer ({selectedStudents.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des étudiants */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={(() => {
                        if (documentType === 'attestation') {
                          const eligibleOnPage = paginatedStudents.filter(s => isStudentEligible(s));
                          return eligibleOnPage.length > 0 && eligibleOnPage.every(s => selectedStudents.includes(s.MATRICULE));
                        } else {
                          return paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.MATRICULE));
                        }
                      })()}
                      onCheckedChange={handleSelectAll}
                      disabled={isLoading}
                    />
                  </TableHead>
                  {documentType === 'attestation' && (
                    <TableHead className="w-12">
                      <div className="flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" title="Éligibilité" />
                      </div>
                    </TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nom')}
                  >
                    <div className="flex items-center gap-2">
                      Nom {getSortIcon('nom')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('prenom')}
                  >
                    <div className="flex items-center gap-2">
                      Prénom {getSortIcon('prenom')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('matricule')}
                  >
                    <div className="flex items-center gap-2">
                      Matricule {getSortIcon('matricule')}
                    </div>
                  </TableHead>
                  {documentType === "releve" && (
                    <>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('niveau')}
                      >
                        <div className="flex items-center gap-2">
                          Niveau {getSortIcon('niveau')}
                        </div>
                      </TableHead>
                      <TableHead>Semestre</TableHead>
                    </>
                  )}
                  {(documentType === "attestation" || documentType === "diplome") && (
                    <>
                      <TableHead>Parcours</TableHead>
                      <TableHead>Spécialité</TableHead>
                    </>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('moyenne')}
                  >
                    <div className="flex items-center gap-2">
                      Moyenne {getSortIcon('moyenne')}
                    </div>
                  </TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Mention</TableHead>
                  {showPreview && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedStudents.map((student, index) => {
                    const isSelected = selectedStudents.includes(student.MATRICULE);
                    const isEligible = isStudentEligible(student);
                    const ineligibilityReason = getIneligibilityReason(student);
                    const canSelect = isEligible && (!maxSelection || selectedStudents.length < maxSelection || isSelected);
                    
                    return (
                      <motion.tr
                        key={student.MATRICULE}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`
                          hover:bg-gray-50 transition-colors
                          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                          ${!isEligible && documentType === 'attestation' ? 'bg-red-50 opacity-75' : ''}
                          ${!canSelect ? 'opacity-50' : ''}
                        `}
                        title={!isEligible && documentType === 'attestation' ? ineligibilityReason || undefined : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleStudentSelect(student.MATRICULE, checked as boolean)
                            }
                            disabled={isLoading || (!canSelect && !isSelected)}
                          />
                        </TableCell>
                        {documentType === 'attestation' && (
                          <TableCell>
                            <div className="flex justify-center">
                              {isEligible ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" title="Éligible pour attestation" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" title={ineligibilityReason || "Non éligible"} />
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{student.NOM}</TableCell>
                        <TableCell>{student.PRENOM}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {student.MATRICULE}
                          </code>
                        </TableCell>
                        {documentType === "releve" && (
                          <>
                            <TableCell>{student.NIVEAU}</TableCell>
                            <TableCell>{student.SEMESTRE}</TableCell>
                          </>
                        )}
                        {(documentType === "attestation" || documentType === "diplome") && (
                          <>
                            <TableCell>{student.PARCOURS}</TableCell>
                            <TableCell>{student.SPECIALITE}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`font-mono ${
                              documentType === 'attestation' 
                                ? (isEligible ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700')
                                : ''
                            }`}
                          >
                            {typeof student.MOYENNE === 'number' 
                              ? student.MOYENNE.toFixed(2) 
                              : student.MOYENNE || 'N/A'
                            }
                            {documentType === 'attestation' && (
                              <span className="ml-1">
                                {isEligible ? '✓' : '✗'}
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.GRADE}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.MENTION}</Badge>
                        </TableCell>
                        {showPreview && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPreview(student)}
                              disabled={isLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages} ({filteredAndSortedStudents.length} étudiants)
                {documentType === 'attestation' && eligibilityData.ineligibleCount > 0 && (
                  <span className="text-red-600 ml-2">
                    ({eligibilityData.ineligibleCount} non éligibles masqués)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun étudiant trouvé */}
      {filteredAndSortedStudents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun étudiant trouvé
            </h3>
            <p className="text-gray-600">
              {documentType === 'attestation' && filterEligibility === 'eligible' 
                ? "Aucun étudiant éligible trouvé avec les critères actuels."
                : "Essayez de modifier vos critères de recherche ou de filtrage."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};