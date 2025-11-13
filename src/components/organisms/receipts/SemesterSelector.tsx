// SemesterSelector.tsx
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link, Layers } from "lucide-react";

interface Semester {
  id: string;
  name: string;
  isComposite?: boolean;
  compositeEquivalent?: number;
  creditsRequired?: number;
}

interface MergedSemester {
  id: string;
  name: string;
  creditsRequired: number;
  isActive?: boolean;
}

interface SemesterSelectorProps {
  semesters: Semester[];
  mergedSemesters?: MergedSemester[];
  selectedSemesterId: string | null;
  isLoading: boolean;
  onSemesterChange: (value: string) => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  semesters,
  mergedSemesters = [],
  selectedSemesterId,
  isLoading,
  onSemesterChange,
}) => {
  const activeMergedSemester = mergedSemesters.find(ms => ms.isActive);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="semester-select">
        Semestre
        {activeMergedSemester && (
          <Badge variant="default" className="ml-2 bg-purple-100 text-purple-800 border-purple-300">
            <Link className="h-3 w-3 mr-1" />
            Mode fusionné actif
          </Badge>
        )}
      </Label>
      <Select
        value={selectedSemesterId || "null"}
        onValueChange={onSemesterChange}
        disabled={isLoading || semesters.length === 0}
      >
        <SelectTrigger id="semester-select">
          <SelectValue placeholder="Sélectionnez un semestre" />
        </SelectTrigger>
        <SelectContent>
          {/* NOUVEAU: Option "Tous les semestres" */}
          {semesters.length > 1 && (
            <>
              <SelectItem value="all-semesters">
                <div className="flex items-center gap-2">
                  <Layers className="h-3 w-3 text-blue-600" />
                  <span className="font-semibold">Tous les semestres</span>
                  <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                    {semesters.length} sem.
                  </Badge>
                </div>
              </SelectItem>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}

          {/* Afficher les semestres fusionnés en premier s'ils existent */}
          {mergedSemesters.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                Semestres fusionnés
              </div>
              {mergedSemesters.map((merged) => (
                <SelectItem
                  key={`merged-${merged.id}`}
                  value={`merged-${merged.id}`}
                  className={merged.isActive ? "bg-purple-50 border-l-2 border-purple-400" : ""}
                >
                  <div className="flex items-center gap-2">
                    <Link className="h-3 w-3 text-purple-600" />
                    <span>{merged.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {merged.creditsRequired} crédits
                    </Badge>
                    {merged.isActive && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Actif
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                Semestres individuels
              </div>
            </>
          )}

          {semesters.map((sem) => (
            <SelectItem key={sem.id} value={sem.id}>
              <div className="flex items-center gap-2">
                {sem.isComposite && <Layers className="h-3 w-3 text-amber-600" />}
                <span>{sem.name}</span>
                {sem.isComposite && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                    {sem.compositeEquivalent || 2} sem.
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {activeMergedSemester && (
        <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
          <div className="flex items-center gap-1 mb-1">
            <Link className="h-3 w-3" />
            <span className="font-medium">Configuration active:</span>
          </div>
          <div>{activeMergedSemester.name} ({activeMergedSemester.creditsRequired} crédits requis)</div>
        </div>
      )}
    </div>
  );
};