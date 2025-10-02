// src/components/organisms/qr-document-processor/components/BatchProcessingProgress.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";

interface BatchProcessingProgressProps {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentFile?: string;
  isProcessing: boolean;
}

export const BatchProcessingProgress: React.FC<BatchProcessingProgressProps> = ({
  total,
  processed,
  successful,
  failed,
  currentFile,
  isProcessing
}) => {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            Traitement en cours
          </span>
          <Badge variant={isProcessing ? "default" : "secondary"}>
            {processed} / {total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progression globale</span>
            <span className="text-gray-600">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Current File */}
        {currentFile && isProcessing && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Traitement en cours...
                </p>
                <p className="text-xs text-blue-700 truncate">{currentFile}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Successful */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{successful}</p>
            <p className="text-xs text-green-700">Réussis</p>
          </div>

          {/* Failed */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">{failed}</p>
            <p className="text-xs text-red-700">Échoués</p>
          </div>

          {/* Pending */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{total - processed}</p>
            <p className="text-xs text-gray-700">En attente</p>
          </div>
        </div>

        {/* Success Rate */}
        {processed > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taux de réussite</span>
              <Badge variant={successful === processed ? "success" : "warning"}>
                {Math.round((successful / processed) * 100)}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
