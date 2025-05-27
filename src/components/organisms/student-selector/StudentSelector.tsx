// src/components/organisms/student-selector/StudentSelector.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, CheckCircle, Circle, Users, FileText, Eye, Download } from 'lucide-react';
import { StudentExcelRecord } from '@/lib/helpers/qrcode';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentSelectorProps {
  students: StudentExcelRecord[];
  selectedStudents: string[]; // Array of matricules
  onSelectionChange: (selectedMatricules: string[]) => void;
  onPreview?: (student: StudentExcelRecord) => void;
  onGenerateSelected?: (selectedStudents: StudentExcelRecord[]) => void;
  documentType?: 'releve' | 'attestation';
  isLoading?: boolean;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudents,
  onSelectionChange,
  onPreview,
  onGenerateSelected,
  documentType = 'releve',
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'selected' | 'unselected'>('all');
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'moyenne'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtrage et tri des étudiants
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = 
        student.NOM.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.PRENOM.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.MATRICULE.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterBy === 'all' || 
        (filterBy === 'selected' && selectedStudents.includes(student.MATRICULE)) ||
        (filterBy === 'unselected' && !selectedStudents.includes(student.MATRICULE));
      
      return matchesSearch && matchesFilter;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'nom':
          comparison = a.NOM.localeCompare(b.NOM);
          break;
        case 'matricule':
          comparison = a.MATRICULE.localeCompare(b.MATRICULE);
          break;
        case 'moyenne':
          const avgA = typeof a.MOYENNE === 'number' ? a.MOYENNE : parseFloat(String(a.MOYENNE)) || 0;
          const avgB = typeof b.MOYENNE === 'number' ? b.MOYENNE : parseFloat(String(b.MOYENNE)) || 0;
          comparison = avgA - avgB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchTerm, filterBy, sortBy, sortOrder, selectedStudents]);

  // Gestion de la sélection
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(students.map(s => s.MATRICULE));
    }
  };

  const handleSelectFiltered = () => {
    const filteredMatricules = filteredAndSortedStudents.map(s => s.MATRICULE);
    const newSelection = [...new Set([...selectedStudents, ...filteredMatricules])];
    onSelectionChange(newSelection);
  };

  const handleDeselectFiltered = () => {
    const filteredMatricules = new Set(filteredAndSortedStudents.map(s => s.MATRICULE));
    const newSelection = selectedStudents.filter(m => !filteredMatricules.has(m));
    onSelectionChange(newSelection);
  };

  const handleStudentSelect = (matricule: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedStudents, matricule]);
    } else {
      onSelectionChange(selectedStudents.filter(m => m !== matricule));
    }
  };

  const handleGenerateSelected = () => {
    const selectedStudentRecords = students.filter(s => selectedStudents.includes(s.MATRICULE));
    onGenerateSelected?.(selectedStudentRecords);
  };

  const isAllSelected = selectedStudents.length === students.length;
  const isPartiallySelected = selectedStudents.length > 0 && selectedStudents.length < students.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sélection des étudiants
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {selectedStudents.length} étudiant(s) sélectionné(s) sur {students.length}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedStudents.length > 0 && (
              <Button
                onClick={handleGenerateSelected}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Générer ({selectedStudents.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={(value: 'all' | 'selected' | 'unselected') => setFilterBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="selected">Sélectionnés</SelectItem>
                <SelectItem value="unselected">Non sélectionnés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'nom' | 'matricule' | 'moyenne') => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom</SelectItem>
                <SelectItem value="matricule">Matricule</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
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

        {/* Actions de sélection groupée */}
        <div className="flex justify-between items-center py-2 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                ref={(checkbox) => {
                  if (checkbox) checkbox.indeterminate = isPartiallySelected;
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Tout sélectionner
              </span>
            </div>
            
            {filteredAndSortedStudents.length < students.length && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectFiltered}
                >
                  Sélectionner filtrés ({filteredAndSortedStudents.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectFiltered}
                >
                  Désélectionner filtrés
                </Button>
              </div>
            )}
          </div>

          <Badge variant="secondary">
            {filteredAndSortedStudents.length} résultat(s)
          </Badge>
        </div>

        {/* Table des étudiants */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <span className="sr-only">Sélection</span>
                </TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Date de naissance</TableHead>
                {documentType === 'releve' && <TableHead>Niveau/Semestre</TableHead>}
                {documentType === 'attestation' && <TableHead>Parcours</TableHead>}
                <TableHead>Moyenne</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredAndSortedStudents.map((student, index) => {
                  const isSelected = selectedStudents.includes(student.MATRICULE);
                  
                  return (
                    <motion.tr
                      key={student.MATRICULE}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`${isSelected ? 'bg-blue-50 border-blue-200' : ''} hover:bg-gray-50`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleStudentSelect(student.MATRICULE, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.NOM}</TableCell>
                      <TableCell>{student.PRENOM}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.MATRICULE}</Badge>
                      </TableCell>
                      <TableCell>{student["DATE DE NAISSANCE"] || '-'}</TableCell>
                      {documentType === 'releve' && (
                        <TableCell>
                          {student.NIVEAU && student.SEMESTRE 
                            ? `${student.NIVEAU} - ${student.SEMESTRE}`
                            : '-'
                          }
                        </TableCell>
                      )}
                      {documentType === 'attestation' && (
                        <TableCell>{student.PARCOURS || '-'}</TableCell>
                      )}
                      <TableCell>
                        <Badge 
                          variant={
                            typeof student.MOYENNE === 'number' && student.MOYENNE >= 10 
                              ? 'success' 
                              : 'secondary'
                          }
                        >
                          {typeof student.MOYENNE === 'number' 
                            ? student.MOYENNE.toFixed(2) 
                            : String(student.MOYENNE)
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {onPreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPreview(student)}
                            disabled={isLoading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Résumé de la sélection */}
        {selectedStudents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedStudents.length} étudiant(s) sélectionné(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                >
                  Tout désélectionner
                </Button>
                <Button
                  onClick={handleGenerateSelected}
                  disabled={isLoading}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Générer les {documentType === 'releve' ? 'relevés' : 'attestations'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};