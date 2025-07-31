// src/components/organisms/document-history/DocumentHistoryManager.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Award, 
  Calendar,
  User,
  Download,
  Trash2,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  BarChart3,
  TrendingUp,
  FileX,
  Archive,
  FolderOpen,
  Users,
  GraduationCap,
  CalendarDays
} from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { motion, AnimatePresence } from "framer-motion";

// Fonction de formatage de date fallback si date-fns n'est pas disponible
const formatDate = (date: Date) => {
  try {
    // Essayer d'utiliser date-fns si disponible
    if (typeof window !== 'undefined' && (window as any).dateFns) {
      const { format } = (window as any).dateFns;
      return format(new Date(date), "dd MMMM yyyy 'à' HH:mm", { locale: (window as any).dateFns.fr });
    }
    
    // Fallback avec formatage natif
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('fr-FR', options);
  } catch (error) {
    // Fallback simple en cas d'erreur
    return new Date(date).toLocaleString('fr-FR');
  }
};

const formatDateGroup = (date: Date, groupBy: string) => {
  const d = new Date(date);
  switch (groupBy) {
    case 'day':
      return d.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    case 'week':
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `Semaine du ${startOfWeek.toLocaleDateString('fr-FR')} au ${endOfWeek.toLocaleDateString('fr-FR')}`;
    case 'month':
      return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    case 'year':
      return d.getFullYear().toString();
    default:
      return d.toLocaleDateString('fr-FR');
  }
};

export interface DocumentRecord {
  id: string;
  type: 'releve' | 'attestation';
  studentName: string;
  studentMatricule: string;
  academicYear: string;
  level?: string;
  semester?: string;
  parcours?: string;
  speciality?: string;
  average?: number;
  grade?: string;
  mention?: string;
  generatedAt: Date;
  fileName: string;
  status: 'generated' | 'downloaded' | 'printed';
  filePath?: string;
}

type GroupByType = 'none' | 'date' | 'type' | 'student' | 'academicYear' | 'status' | 'level';

export const DocumentHistoryManager: React.FC = () => {
  // État pour l'historique des documents
  const [documentHistory, setDocumentHistory] = useLocalStorage<DocumentRecord[]>(
    "document-history",
    []
  );

  // États pour les filtres et la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "releve" | "attestation">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "generated" | "downloaded" | "printed">("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type" | "average">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [groupBy, setGroupBy] = useState<GroupByType>('none');
  const [dateGroupBy, setDateGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');
  
  // États pour la gestion
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DocumentRecord | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Obtenir les années académiques uniques
  const academicYears = useMemo(() => {
    const years = [...new Set(documentHistory.map(doc => doc.academicYear))].sort();
    return years;
  }, [documentHistory]);

  // Filtrage des documents
  const filteredDocuments = useMemo(() => {
    const filtered = documentHistory.filter(doc => {
      const matchesSearch = 
        doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.studentMatricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || doc.type === filterType;
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
      const matchesYear = filterAcademicYear === "all" || doc.academicYear === filterAcademicYear;
      
      return matchesSearch && matchesType && matchesStatus && matchesYear;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'average':
          comparison = (a.average || 0) - (b.average || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documentHistory, searchTerm, filterType, filterStatus, filterAcademicYear, sortBy, sortOrder]);

  // Regroupement des documents
  const groupedDocuments = useMemo(() => {
    if (groupBy === 'none') {
      return { 'Tous les documents': filteredDocuments };
    }

    const groups: Record<string, DocumentRecord[]> = {};

    filteredDocuments.forEach(doc => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'date':
          groupKey = formatDateGroup(doc.generatedAt, dateGroupBy);
          break;
        case 'type':
          groupKey = doc.type === 'releve' ? 'Relevés de notes' : 'Attestations de réussite';
          break;
        case 'student':
          groupKey = doc.studentName;
          break;
        case 'academicYear':
          groupKey = `Année ${doc.academicYear}`;
          break;
        case 'status':
          groupKey = doc.status === 'generated' ? 'Générés' : 
                    doc.status === 'downloaded' ? 'Téléchargés' : 'Imprimés';
          break;
        case 'level':
          groupKey = doc.level || 'Non spécifié';
          break;
        default:
          groupKey = 'Autres';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(doc);
    });

    // Trier les groupes par nom
    const sortedGroups: Record<string, DocumentRecord[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (groupBy === 'date') {
          // Pour les dates, on veut un tri chronologique
          const docsA = groups[a];
          const docsB = groups[b];
          if (docsA.length > 0 && docsB.length > 0) {
            return new Date(docsB[0].generatedAt).getTime() - new Date(docsA[0].generatedAt).getTime();
          }
        }
        return a.localeCompare(b);
      })
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredDocuments, groupBy, dateGroupBy]);

  // Fonctions de gestion
  const handleDeleteSelected = () => {
    setDocumentHistory(prev => 
      prev.filter(doc => !selectedRecords.includes(doc.id))
    );
    setSelectedRecords([]);
    setShowDeleteDialog(false);
  };

  const handleClearAll = () => {
    setDocumentHistory([]);
    setSelectedRecords([]);
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredDocuments.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredDocuments.map(doc => doc.id));
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(Object.keys(groupedDocuments)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  // Fonctions utilitaires
  const getDocumentIcon = (type: string) => {
    return type === 'releve' ? FileText : Award;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'downloaded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'printed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getGroupIcon = (groupByType: GroupByType) => {
    switch (groupByType) {
      case 'date': return CalendarDays;
      case 'type': return FileText;
      case 'student': return Users;
      case 'academicYear': return GraduationCap;
      case 'status': return CheckCircle;
      case 'level': return BarChart3;
      default: return FolderOpen;
    }
  };

  // Statistiques améliorées
  const stats = useMemo(() => {
    const total = documentHistory.length;
    const releves = documentHistory.filter(doc => doc.type === 'releve').length;
    const attestations = documentHistory.filter(doc => doc.type === 'attestation').length;
    const recent = documentHistory.filter(doc => {
      const daysDiff = (Date.now() - new Date(doc.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    const avgAverage = documentHistory
      .filter(doc => doc.average)
      .reduce((sum, doc) => sum + (doc.average || 0), 0) / 
      documentHistory.filter(doc => doc.average).length || 0;

    const uniqueStudents = new Set(documentHistory.map(doc => doc.studentMatricule)).size;
    
    return { total, releves, attestations, recent, avgAverage, uniqueStudents };
  }, [documentHistory]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques améliorées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des Documents
          </CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.releves}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Relevés</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.attestations}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Attestations</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.recent}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Cette semaine</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.uniqueStudents}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Étudiants</div>
            </div>
            <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {stats.avgAverage > 0 ? stats.avgAverage.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Moy. générale</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres et actions améliorés */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Première ligne : Recherche et vue */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, matricule ou fichier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Deuxième ligne : Filtres */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="releve">Relevés</SelectItem>
                  <SelectItem value="attestation">Attestations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="generated">Générés</SelectItem>
                  <SelectItem value="downloaded">Téléchargés</SelectItem>
                  <SelectItem value="printed">Imprimés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes années</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="average">Moyenne</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            {/* Troisième ligne : Regroupement */}
            <div className="flex flex-wrap gap-2 items-center">
              <Label className="text-sm font-medium">Regrouper par :</Label>
              <Select value={groupBy} onValueChange={(value: GroupByType) => setGroupBy(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun regroupement</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="type">Type de document</SelectItem>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="academicYear">Année académique</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                  <SelectItem value="level">Niveau</SelectItem>
                </SelectContent>
              </Select>

              {groupBy === 'date' && (
                <Select value={dateGroupBy} onValueChange={(value: typeof dateGroupBy) => setDateGroupBy(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Par jour</SelectItem>
                    <SelectItem value="week">Par semaine</SelectItem>
                    <SelectItem value="month">Par mois</SelectItem>
                    <SelectItem value="year">Par année</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {groupBy !== 'none' && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAllGroups}
                  >
                    Tout développer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAllGroups}
                  >
                    Tout réduire
                  </Button>
                </div>
              )}
            </div>

            {/* Actions groupées */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRecords.length === filteredDocuments.length && filteredDocuments.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm">
                  {selectedRecords.length > 0 
                    ? `${selectedRecords.length} sélectionné(s)`
                    : "Tout sélectionner"
                  }
                </span>
                
                {selectedRecords.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ({selectedRecords.length})
                  </Button>
                )}
              </div>

              <div className="flex gap-2 items-center">
                <Badge variant="secondary">
                  {filteredDocuments.length} résultat(s)
                </Badge>
                
                {documentHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Vider l'historique
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {documentHistory.length === 0 
                  ? "Aucun document généré" 
                  : "Aucun résultat trouvé"
                }
              </h3>
              <p className="text-gray-500">
                {documentHistory.length === 0 
                  ? "Les documents que vous générez apparaîtront ici" 
                  : "Essayez de modifier vos critères de recherche"
                }
              </p>
            </div>
          ) : (
            <div className="p-4">
              {Object.entries(groupedDocuments).map(([groupName, documents]) => {
                const GroupIcon = getGroupIcon(groupBy);
                const isExpanded = expandedGroups.has(groupName) || groupBy === 'none';
                
                return (
                  <div key={groupName} className="mb-6 last:mb-0">
                    {groupBy !== 'none' && (
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleGroup(groupName)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800 mb-3"
                          >
                            <div className="flex items-center gap-3">
                              <GroupIcon className="h-5 w-5" />
                              <span className="font-medium text-left">{groupName}</span>
                              <Badge variant="secondary">{documents.length}</Badge>
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {viewMode === 'table' ? (
                            <DocumentTable
                              documents={documents}
                              selectedRecords={selectedRecords}
                              setSelectedRecords={setSelectedRecords}
                              onViewDetails={(doc) => {
                                setSelectedRecord(doc);
                                setShowDetailsDialog(true);
                              }}
                              onDelete={(doc) => {
                                setSelectedRecords([doc.id]);
                                setShowDeleteDialog(true);
                              }}
                            />
                          ) : (
                            <DocumentCards
                              documents={documents}
                              selectedRecords={selectedRecords}
                              setSelectedRecords={setSelectedRecords}
                              onViewDetails={(doc) => {
                                setSelectedRecord(doc);
                                setShowDetailsDialog(true);
                              }}
                              onDelete={(doc) => {
                                setSelectedRecords([doc.id]);
                                setShowDeleteDialog(true);
                              }}
                            />
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {groupBy === 'none' && (
                      viewMode === 'table' ? (
                        <DocumentTable
                          documents={documents}
                          selectedRecords={selectedRecords}
                          setSelectedRecords={setSelectedRecords}
                          onViewDetails={(doc) => {
                            setSelectedRecord(doc);
                            setShowDetailsDialog(true);
                          }}
                          onDelete={(doc) => {
                            setSelectedRecords([doc.id]);
                            setShowDeleteDialog(true);
                          }}
                        />
                      ) : (
                        <DocumentCards
                          documents={documents}
                          selectedRecords={selectedRecords}
                          setSelectedRecords={setSelectedRecords}
                          onViewDetails={(doc) => {
                            setSelectedRecord(doc);
                            setShowDetailsDialog(true);
                          }}
                          onDelete={(doc) => {
                            setSelectedRecords([doc.id]);
                            setShowDeleteDialog(true);
                          }}
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs de confirmation et détails */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedRecords.length > 0 
                  ? `Êtes-vous sûr de vouloir supprimer ${selectedRecords.length} document(s) de l'historique ?`
                  : "Êtes-vous sûr de vouloir vider tout l'historique ? Cette action est irréversible."
                }
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={selectedRecords.length > 0 ? handleDeleteSelected : handleClearAll}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du document</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium text-sm text-gray-600">Type de document</Label>
                  <p className="flex items-center gap-2 mt-1">
                    {React.createElement(getDocumentIcon(selectedRecord.type), { className: "h-4 w-4" })}
                    <span className="capitalize">{selectedRecord.type}</span>
                  </p>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Statut</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedRecord.status)}>
                      {selectedRecord.status === 'generated' && 'Généré'}
                      {selectedRecord.status === 'downloaded' && 'Téléchargé'}
                      {selectedRecord.status === 'printed' && 'Imprimé'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Nom de l'étudiant</Label>
                  <p className="mt-1 font-medium">{selectedRecord.studentName}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Matricule</Label>
                  <p className="mt-1">
                    <Badge variant="outline">{selectedRecord.studentMatricule}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="font-medium text-sm text-gray-600">Année académique</Label>
                  <p className="mt-1">{selectedRecord.academicYear}</p>
                </div>
                {selectedRecord.average && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Moyenne</Label>
                    <p className="mt-1">
                      <Badge variant={selectedRecord.average >= 10 ? "default" : "secondary"}>
                        {selectedRecord.average.toFixed(2)}/20
                      </Badge>
                    </p>
                  </div>
                )}
                {selectedRecord.level && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Niveau</Label>
                    <p className="mt-1">{selectedRecord.level}</p>
                  </div>
                )}
                {selectedRecord.semester && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Semestre</Label>
                    <p className="mt-1">{selectedRecord.semester}</p>
                  </div>
                )}
                {selectedRecord.parcours && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Parcours</Label>
                    <p className="mt-1">{selectedRecord.parcours}</p>
                  </div>
                )}
                {selectedRecord.speciality && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Spécialité</Label>
                    <p className="mt-1">{selectedRecord.speciality}</p>
                  </div>
                )}
                {selectedRecord.grade && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Grade</Label>
                    <p className="mt-1">
                      <Badge variant="outline">{selectedRecord.grade}</Badge>
                    </p>
                  </div>
                )}
                {selectedRecord.mention && (
                  <div>
                    <Label className="font-medium text-sm text-gray-600">Mention</Label>
                    <p className="mt-1">
                      <Badge variant="outline">{selectedRecord.mention}</Badge>
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <Label className="font-medium text-sm text-gray-600">Nom du fichier</Label>
                <p className="mt-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {selectedRecord.fileName}
                </p>
              </div>
              <div>
                <Label className="font-medium text-sm text-gray-600">Date de génération</Label>
                <p className="mt-1">{formatDate(selectedRecord.generatedAt)}</p>
              </div>
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Note :</strong> Cet historique contient uniquement les métadonnées du document. 
                  Les fichiers PDF générés ne sont pas stockés et doivent être régénérés si nécessaire.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Composant pour l'affichage en tableau
interface DocumentTableProps {
  documents: DocumentRecord[];
  selectedRecords: string[];
  setSelectedRecords: (records: string[]) => void;
  onViewDetails: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  selectedRecords,
  setSelectedRecords,
  onViewDetails,
  onDelete
}) => {
  const getDocumentIcon = (type: string) => {
    return type === 'releve' ? FileText : Award;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'downloaded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'printed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <span className="sr-only">Sélection</span>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Étudiant</TableHead>
            <TableHead>Matricule</TableHead>
            <TableHead>Année académique</TableHead>
            <TableHead>Moyenne</TableHead>
            <TableHead>Date de génération</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {documents.map((doc, index) => {
              const isSelected = selectedRecords.includes(doc.id);
              const Icon = getDocumentIcon(doc.type);
              
              return (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecords([...selectedRecords, doc.id]);
                        } else {
                          setSelectedRecords(selectedRecords.filter(id => id !== doc.id));
                        }
                      }}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{doc.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{doc.studentName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.studentMatricule}</Badge>
                  </TableCell>
                  <TableCell>{doc.academicYear}</TableCell>
                  <TableCell>
                    {doc.average && (
                      <Badge variant={doc.average >= 10 ? "default" : "secondary"}>
                        {doc.average.toFixed(2)}/20
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(doc.generatedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status === 'generated' && 'Généré'}
                      {doc.status === 'downloaded' && 'Téléchargé'}
                      {doc.status === 'printed' && 'Imprimé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

// Composant pour l'affichage en cartes
interface DocumentCardsProps {
  documents: DocumentRecord[];
  selectedRecords: string[];
  setSelectedRecords: (records: string[]) => void;
  onViewDetails: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

const DocumentCards: React.FC<DocumentCardsProps> = ({
  documents,
  selectedRecords,
  setSelectedRecords,
  onViewDetails,
  onDelete
}) => {
  const getDocumentIcon = (type: string) => {
    return type === 'releve' ? FileText : Award;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'downloaded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'printed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {documents.map((doc, index) => {
          const isSelected = selectedRecords.includes(doc.id);
          const Icon = getDocumentIcon(doc.type);
          
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <Card className={`${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''} hover:shadow-md transition-shadow`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords([...selectedRecords, doc.id]);
                          } else {
                            setSelectedRecords(selectedRecords.filter(id => id !== doc.id));
                          }
                        }}
                        className="rounded"
                      />
                      <Icon className="h-5 w-5" />
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status === 'generated' && 'Généré'}
                        {doc.status === 'downloaded' && 'Téléchargé'}
                        {doc.status === 'printed' && 'Imprimé'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">{doc.studentName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <Badge variant="outline" className="text-xs">{doc.studentMatricule}</Badge>
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>Année: {doc.academicYear}</p>
                      <p>Généré: {formatDate(doc.generatedAt)}</p>
                    </div>
                    {doc.average && (
                      <div>
                        <Badge variant={doc.average >= 10 ? "default" : "secondary"} className="text-xs">
                          Moyenne: {doc.average.toFixed(2)}/20
                        </Badge>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {doc.fileName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook pour gérer l'historique des documents
export const useDocumentHistory = () => {
  const [documentHistory, setDocumentHistory] = useLocalStorage<DocumentRecord[]>(
    "document-history",
    []
  );

  const addDocumentRecord = (record: Omit<DocumentRecord, 'id' | 'generatedAt'>) => {
    const newRecord: DocumentRecord = {
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      generatedAt: new Date(),
    };

    setDocumentHistory(prev => [newRecord, ...prev]);
    return newRecord.id;
  };

  const updateDocumentStatus = (id: string, status: DocumentRecord['status']) => {
    setDocumentHistory(prev => 
      prev.map(doc => doc.id === id ? { ...doc, status } : doc)
    );
  };

  const removeDocumentRecord = (id: string) => {
    setDocumentHistory(prev => prev.filter(doc => doc.id !== id));
  };

  const clearHistory = () => {
    setDocumentHistory([]);
  };

  const getDocumentStats = () => {
    const total = documentHistory.length;
    const releves = documentHistory.filter(doc => doc.type === 'releve').length;
    const attestations = documentHistory.filter(doc => doc.type === 'attestation').length;
    const recent = documentHistory.filter(doc => {
      const daysDiff = (Date.now() - new Date(doc.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    const avgAverage = documentHistory
      .filter(doc => doc.average)
      .reduce((sum, doc) => sum + (doc.average || 0), 0) / 
      documentHistory.filter(doc => doc.average).length || 0;

    const uniqueStudents = new Set(documentHistory.map(doc => doc.studentMatricule)).size;
    
    return { total, releves, attestations, recent, avgAverage, uniqueStudents };
  };

  return {
    documentHistory,
    addDocumentRecord,
    updateDocumentStatus,
    removeDocumentRecord,
    clearHistory,
    getDocumentStats,
  };
};