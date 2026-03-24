import React, { useState } from "react";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FolderOpen, Trash2, Clock, Edit, Copy, Search, X } from "lucide-react";
import {
  SavedManualDocument,
  ManualDocumentType,
  DocumentStatus,
  getDocumentsByType,
  deleteDocument,
  duplicateDocument,
  getTypeLabel,
} from "./manual-document-storage";

interface SavedDocumentsListProps {
  type: ManualDocumentType;
  onLoad: (doc: SavedManualDocument) => void;
  onDuplicate?: (doc: SavedManualDocument) => void;
}

const STATUS_LABELS: Record<DocumentStatus, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-gray-100 text-gray-600" },
  pret: { label: "Prêt", className: "bg-blue-100 text-blue-700" },
  genere: { label: "Généré", className: "bg-green-100 text-green-700" },
};

export const SavedDocumentsList: React.FC<SavedDocumentsListProps> = ({
  type,
  onLoad,
  onDuplicate,
}) => {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState<SavedManualDocument[]>(() =>
    getDocumentsByType(type)
  );
  const [search, setSearch] = useState("");

  const refresh = () => setDocuments(getDocumentsByType(type));

  const handleDelete = async (doc: SavedManualDocument) => {
    if (await confirm({ title: "Supprimer le document", message: `Supprimer le ${getTypeLabel(type)} de ${doc.studentName} (${doc.studentMatricule}) ?`, variant: "destructive", confirmLabel: "Supprimer" })) {
      deleteDocument(doc.id);
      refresh();
    }
  };

  const handleDuplicate = (doc: SavedManualDocument) => {
    const copy = duplicateDocument(doc.id);
    if (copy) {
      refresh();
      onDuplicate?.(copy);
    }
  };

  const filtered = search.trim()
    ? documents.filter(
        (d) =>
          d.studentName.toLowerCase().includes(search.toLowerCase()) ||
          d.studentMatricule.toLowerCase().includes(search.toLowerCase()) ||
          (d.label || "").toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Documents sauvegardés ({documents.length})
        </CardTitle>
        {documents.length > 3 && (
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Aucun résultat pour "{search}"
          </p>
        )}
        {filtered.map((doc) => {
          const updatedDate = new Date(doc.updatedAt);
          const dateStr = updatedDate.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const statusInfo = STATUS_LABELS[doc.status ?? "brouillon"];

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{doc.studentName}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {doc.studentMatricule}
                  </Badge>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                  {doc.label && (
                    <span className="text-xs text-muted-foreground">· {doc.label}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => onLoad(doc)}
                  title="Modifier"
                >
                  <Edit className="h-3 w-3" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs text-muted-foreground"
                  onClick={() => handleDuplicate(doc)}
                  title="Dupliquer"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(doc)}
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
