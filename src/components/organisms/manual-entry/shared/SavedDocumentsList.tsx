import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Trash2, Clock, Edit } from "lucide-react";
import {
  SavedManualDocument,
  ManualDocumentType,
  getDocumentsByType,
  deleteDocument,
  getTypeLabel,
} from "./manual-document-storage";

interface SavedDocumentsListProps {
  type: ManualDocumentType;
  onLoad: (doc: SavedManualDocument) => void;
}

export const SavedDocumentsList: React.FC<SavedDocumentsListProps> = ({
  type,
  onLoad,
}) => {
  const [documents, setDocuments] = useState<SavedManualDocument[]>(() =>
    getDocumentsByType(type)
  );

  const refresh = () => setDocuments(getDocumentsByType(type));

  const handleDelete = (doc: SavedManualDocument) => {
    const confirmed = window.confirm(
      `Supprimer le ${getTypeLabel(type)} de ${doc.studentName} (${doc.studentMatricule}) ?`
    );
    if (confirmed) {
      deleteDocument(doc.id);
      refresh();
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Documents sauvegardes ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((doc) => {
          const updatedDate = new Date(doc.updatedAt);
          const dateStr = updatedDate.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {doc.studentName}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {doc.studentMatricule}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {dateStr}
                  </span>
                  {doc.label && (
                    <span className="text-xs text-muted-foreground">
                      - {doc.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => onLoad(doc)}
                >
                  <Edit className="h-3 w-3" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(doc)}
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
