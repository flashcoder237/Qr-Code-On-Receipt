import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, XCircle } from "lucide-react";

interface TranscriptSummaryProps {
  stats: {
    average: number;
    totalCredits: number;
    creditsRequired: number;
    creditsObtained: number;
    mgp: number;
    grade: string;
    isValidated: boolean;
  } | null;
}

export const TranscriptSummary: React.FC<TranscriptSummaryProps> = ({
  stats,
}) => {
  if (!stats) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Recapitulatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Saisissez des notes pour voir le recapitulatif.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Recapitulatif
          {stats.isValidated ? (
            <Badge className="ml-2 bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Valide
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-2">
              <XCircle className="h-3 w-3 mr-1" />
              Non valide
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Moyenne</p>
            <p className="text-2xl font-bold">
              {stats.average.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /20
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="text-2xl font-bold">
              {stats.creditsObtained}
              <span className="text-sm font-normal text-muted-foreground">
                /{stats.creditsRequired}
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Grade</p>
            <p className="text-2xl font-bold">{stats.grade}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">MGP</p>
            <p className="text-2xl font-bold">
              {stats.mgp.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /4
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
