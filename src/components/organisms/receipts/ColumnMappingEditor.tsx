import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EC {
  id: string;
  fullName: string;
}

interface ColumnMappingEditorProps {
  selectedConfigId: string | null;
  excelColumns: string[];
  columnMapping: { [ecId: string]: string };
  getAvailableECs: () => EC[];
  onMappingChange: (ecId: string, excelCol: string) => void;
}

export const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({
  selectedConfigId,
  excelColumns,
  columnMapping,
  getAvailableECs,
  onMappingChange,
}) => {
  // Log des données reçues pour débogage
  useEffect(() => {
    console.log("ColumnMappingEditor - Props:", {
      selectedConfigId,
      excelColumnsLength: excelColumns.length,
      mappingEntries: Object.keys(columnMapping).length,
      availableECsLength: getAvailableECs().length
    });
  }, [selectedConfigId, excelColumns, columnMapping, getAvailableECs]);

  // Vérification des données disponibles
  const availableECs = getAvailableECs();
  const hasConfig = !!selectedConfigId;
  const hasColumns = excelColumns && excelColumns.length > 0;
  const hasECs = availableECs && availableECs.length > 0;

  if (!hasConfig || !hasColumns) {
    return (
      <div className="text-center py-10 text-gray-500">
        Veuillez d&apos;abord sélectionner une configuration et charger un fichier Excel
      </div>
    );
  }

  if (!hasECs) {
    return (
      <div className="text-center py-10 text-gray-500">
        Aucun élément constitutif (EC) trouvé dans cette configuration
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Associez chaque élément constitutif (EC) à une colonne Excel</p>
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
          {availableECs.map((ec) => (
            <div key={ec.id} className="flex items-center gap-2 my-2 p-2 bg-gray-50 rounded">
              <Label className="w-1/2 text-sm">{ec.fullName}</Label>
              <Select
                  value={columnMapping[ec.id] || "null"}
                  onValueChange={(value) => onMappingChange(ec.id, value === "null" ? "" : value)}
                >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">-- Aucun --</SelectItem>
                  {excelColumns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};