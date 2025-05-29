// src/components/organisms/document-history/DocumentHistoryManager.tsx
import React, { useState } from "react";
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
  MoreVertical
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
  filePath?: string; // Pour pouvoir re-télécharger si nécessaire
}

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
  const [sortBy, setSortBy] = useState<"date" | "name" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // États pour la gestion
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DocumentRecord | null>(null);

  // Filtrage et tri des documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documentHistory.filter(doc => {
      const matchesSearch = 
        doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.studentMatricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || doc.type === filterType;
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
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
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documentHistory, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  // Fonction pour supprimer des documents
  const handleDeleteSelected = () => {
    setDocumentHistory(prev => 
      prev.filter(doc => !selectedRecords.includes(doc.id))
    );
    setSelectedRecords([]);
    setShowDeleteDialog(false);
  };

  // Fonction pour vider tout l'historique
  const handleClearAll = () => {
    setDocumentHistory([]);
    setSelectedRecords([]);
  };

  // Fonction pour sélectionner/désélectionner tous les documents filtrés
  const handleSelectAll = () => {
    if (selectedRecords.length === filteredDocuments.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredDocuments.map(doc => doc.id));
    }
  };

  // Fonction pour obtenir l'icône du type de document
  const getDocumentIcon = (type: string) => {
    return type === 'releve' ? FileText : Award;
  };

  // Fonction pour obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'downloaded': return 'bg-green-100 text-green-800';
      case 'printed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour formater la date
  const formatDateDisplay = (date: Date) => {
    return formatDate(date);
  };

  // Statistiques
  const stats = React.useMemo(() => {
    const total = documentHistory.length;
    const releves = documentHistory.filter(doc => doc.type === 'releve').length;
    const attestations = documentHistory.filter(doc => doc.type === 'attestation').length;
    const recent = documentHistory.filter(doc => {
      const daysDiff = (Date.now() - new Date(doc.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    return { total, releves, attestations, recent };
  }, [documentHistory]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des Documents
          </CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.releves}</div>
              <div className="text-sm text-green-600">Relevés</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.attestations}</div>
              <div className="text-sm text-orange-600">Attestations</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.recent}</div>
              <div className="text-sm text-purple-600">Cette semaine</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres et actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, matricule ou fichier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="releve">Relevés</SelectItem>
                  <SelectItem value="attestation">Attestations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="generated">Générés</SelectItem>
                  <SelectItem value="downloaded">Téléchargés</SelectItem>
                  <SelectItem value="printed">Imprimés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
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
          </div>

          {/* Actions groupées */}
          <div className="flex justify-between items-center">
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

            <div className="flex gap-2">
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
                  Vider l'historique
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des documents */}
      <Card>
        <CardContent className="p0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
            <ScrollArea className="h-[500px]">
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
                    {filteredDocuments.map((doc, index) => {
                      const isSelected = selectedRecords.includes(doc.id);
                      const Icon = getDocumentIcon(doc.type);
                      
                      return (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50`}
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
                          <TableCell className="text-sm text-gray-600">
                            {formatDateDisplay(doc.generatedAt)}
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
                                onClick={() => {
                                  setSelectedRecord(doc);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecords([doc.id]);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700"
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
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
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

      {/* Dialog des détails du document */}
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
                <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                  {selectedRecord.fileName}
                </p>
              </div>
              <div>
                <Label className="font-medium text-sm text-gray-600">Date de génération</Label>
                <p className="mt-1">{formatDateDisplay(selectedRecord.generatedAt)}</p>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
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

  return {
    documentHistory,
    addDocumentRecord,
    updateDocumentStatus,
    removeDocumentRecord,
    clearHistory,
  };
};