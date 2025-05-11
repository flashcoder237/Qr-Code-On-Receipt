import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onFileLoaded: (data: any[], columns: string[]) => void;
  onError: (error: string) => void; // Make sure this is a string parameter
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileLoaded,
  onError,
  isLoading
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isLoading,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      try {
        const file = acceptedFiles[0];
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

        if (jsonData.length === 0) {
          throw new Error("Le fichier ne contient aucune donnée");
        }

        const columns = Object.keys(jsonData[0]);
        onFileLoaded(jsonData, columns);
      } catch (error) {
        // Ensure we always pass a string to onError
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement du fichier";
        onError(errorMessage);
      }
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragActive
          ? "border-primary bg-primary/10"
          : isLoading
          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className={`mx-auto h-12 w-12 ${
        isLoading ? "text-gray-300" : "text-gray-400"
      }`} />
      <p className={`mt-2 text-sm ${
        isLoading ? "text-gray-400" : "text-gray-600"
      }`}>
        {isDragActive
          ? "Déposez le fichier ici..."
          : isLoading
          ? "Chargement en cours..."
          : "Glissez-déposez un fichier Excel, ou cliquez pour sélectionner"}
      </p>
    </div>
  );
};
