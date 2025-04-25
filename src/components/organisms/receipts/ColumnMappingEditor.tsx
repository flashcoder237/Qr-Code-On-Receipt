import React from "react";
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
  return (
    <div>
      {selectedConfigId && excelColumns.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Associez chaque élément constitutif (EC) à une colonne Excel</p>
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
            {getAvailableECs().map((ec) => (
              <div key={ec.id} className="flex items-center gap-2 my-2 p-2 bg-gray-50 rounded">
                <Label className="w-1/2 text-sm">{ec.fullName}</Label>
                <Select
                  value={columnMapping[ec.id] || ""}
                  onValueChange={(value) => onMappingChange(ec.id, value)}
                >
                  <SelectTrigger className="w-1/2">
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Aucun --</SelectItem>
                    {excelColumns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Veuillez d&apos;abord sélectionner une configuration et charger un fichier Excel
        </div>
      )}
    </div>
  );
};
