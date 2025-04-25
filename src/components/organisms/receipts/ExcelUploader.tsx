import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp } from "lucide-react";

interface ExcelUploaderProps {
  isLoading: boolean;
  onExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ isLoading, onExcelUpload }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="excel-file">Fichier Excel des étudiants</Label>
      <div className="flex items-center gap-2">
        <Input
          id="excel-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={onExcelUpload}
          disabled={isLoading}
        />
        <FileUp className="text-gray-500" size={20} />
      </div>
    </div>
  );
};
