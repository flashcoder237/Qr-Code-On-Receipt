// src/components/organisms/configs/BatchActions.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Trash2,
  Copy,
  Download,
  Archive,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ClassConfig } from "./types";

interface BatchActionsProps {
  configs: ClassConfig[];
  onDeleteMultiple: (ids: string[]) => void;
  onDuplicateMultiple: (ids: string[]) => void;
  onExportMultiple: (ids: string[]) => void;
  onArchiveMultiple?: (ids: string[]) => void;
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  configs,
  onDeleteMultiple,
  onDuplicateMultiple,
  onExportMultiple,
  onArchiveMultiple,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "duplicate" | "export" | "archive">("delete");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCycle, setFilterCycle] = useState<string>("all");

  const academicYears = [...new Set(configs.map(c => c.academicYear))];
  const cycles = [...new Set(configs.map(c => c.cycle).filter(Boolean))];

  const filteredConfigs = configs.filter(config => {
    if (filterYear !== "all" && config.academicYear !== filterYear) return false;
    if (filterCycle !== "all" && config.cycle !== filterCycle) return false;
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredConfigs.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAction = (action: typeof actionType) => {
    if (selectedIds.size === 0) return;
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    const ids = Array.from(selectedIds);
    switch (actionType) {
      case "delete":
        onDeleteMultiple(ids);
        break;
      case "duplicate":
        onDuplicateMultiple(ids);
        break;
      case "export":
        onExportMultiple(ids);
        break;
      case "archive":
        if (onArchiveMultiple) onArchiveMultiple(ids);
        break;
    }
    setSelectedIds(new Set());
    setShowConfirmDialog(false);
  };

  const getActionText = () => {
    switch (actionType) {
      case "delete":
        return {
          title: "Supprimer les configurations",
          description: `Êtes-vous sûr de vouloir supprimer ${selectedIds.size} configuration(s) ? Cette action est irréversible.`,
          confirmText: "Supprimer",
          variant: "destructive" as const,
        };
      case "duplicate":
        return {
          title: "Dupliquer les configurations",
          description: `Voulez-vous créer des copies de ${selectedIds.size} configuration(s) ?`,
          confirmText: "Dupliquer",
          variant: "default" as const,
        };
      case "export":
        return {
          title: "Exporter les configurations",
          description: `Exporter ${selectedIds.size} configuration(s) vers un fichier JSON ?`,
          confirmText: "Exporter",
          variant: "default" as const,
        };
      case "archive":
        return {
          title: "Archiver les configurations",
          description: `Archiver ${selectedIds.size} configuration(s) ? Elles seront masquées mais conservées.`,
          confirmText: "Archiver",
          variant: "default" as const,
        };
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">Actions groupées</CardTitle>
              {selectedIds.size > 0 && (
                <Badge variant="default" className="bg-blue-600">
                  {selectedIds.size} sélectionné(s)
                </Badge>
              )}
            </div>
            {isExpanded && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Tout désélectionner
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterCycle} onValueChange={setFilterCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cycles</SelectItem>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des configurations */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredConfigs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune configuration ne correspond aux filtres.
                </AlertDescription>
              </Alert>
            ) : (
              filteredConfigs.map(config => (
                <div
                  key={config.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedIds.has(config.id)
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => toggleSelection(config.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(config.id)}
                    onCheckedChange={() => toggleSelection(config.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{config.name}</div>
                    <div className="text-sm text-gray-600">
                      {config.academicYear} • {config.cycle} • {config.semesters.length} semestre(s)
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {config.niveau}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {config.filiere}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {selectedIds.size > 0 && (
            <div className="flex gap-2 pt-4 border-t border-blue-200">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction("delete")}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("duplicate")}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("export")}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              {onArchiveMultiple && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction("archive")}
                  className="flex-1"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </Button>
              )}
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionText().title}</DialogTitle>
            <DialogDescription>{getActionText().description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button
              variant={getActionText().variant}
              onClick={confirmAction}
            >
              {getActionText().confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
