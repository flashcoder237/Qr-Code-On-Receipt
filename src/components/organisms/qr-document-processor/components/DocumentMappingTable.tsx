// src/components/organisms/qr-document-processor/components/DocumentMappingTable.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  Eye
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DocumentMapping {
  file: File;
  matchingValue: string;
  status: 'pending' | 'matched' | 'unmatched';
  excelRow?: any;
}

interface DocumentMappingTableProps {
  mappings: DocumentMapping[];
  onRemoveMapping: (index: number) => void;
  onViewDocument?: (file: File) => void;
  onEditMatchingValue?: (index: number, newValue: string) => void;
}

export const DocumentMappingTable: React.FC<DocumentMappingTableProps> = ({
  mappings,
  onRemoveMapping,
  onViewDocument,
  onEditMatchingValue
}) => {
  const matchedCount = mappings.filter(m => m.status === 'matched').length;
  const unmatchedCount = mappings.filter(m => m.status === 'unmatched').length;
  const pendingCount = mappings.filter(m => m.status === 'pending').length;

  const getStatusBadge = (status: DocumentMapping['status']) => {
    switch (status) {
      case 'matched':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Apparié
          </Badge>
        );
      case 'unmatched':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Non trouvé
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            En attente
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Correspondance Documents - Données
          </span>
          <div className="flex gap-2">
            <Badge variant="success">{matchedCount} appariés</Badge>
            {unmatchedCount > 0 && (
              <Badge variant="destructive">{unmatchedCount} non trouvés</Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} en attente</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nom du fichier</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Valeur de correspondance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Aucun document chargé
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping, index) => (
                  <TableRow key={index} className={mapping.status === 'unmatched' ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="truncate max-w-xs" title={mapping.file.name}>
                          {mapping.file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatFileSize(mapping.file.size)}
                    </TableCell>
                    <TableCell>
                      {onEditMatchingValue ? (
                        <input
                          type="text"
                          value={mapping.matchingValue}
                          onChange={(e) => onEditMatchingValue(index, e.target.value)}
                          className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          placeholder="Valeur de correspondance"
                        />
                      ) : (
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {mapping.matchingValue}
                        </code>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(mapping.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onViewDocument && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDocument(mapping.file)}
                            title="Prévisualiser"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMapping(index)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {unmatchedCount > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  Attention : {unmatchedCount} document(s) non apparié(s)
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Ces documents ne seront pas traités car aucune correspondance n'a été trouvée dans les données Excel.
                  Vérifiez les noms de fichiers et les valeurs dans votre Excel.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
