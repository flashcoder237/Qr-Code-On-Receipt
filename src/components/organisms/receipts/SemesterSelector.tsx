// SemesterSelector.tsx
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Semester {
  id: string;
  name: string;
}

interface SemesterSelectorProps {
  semesters: Semester[];
  selectedSemesterId: string | null;
  isLoading: boolean;
  onSemesterChange: (value: string) => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  semesters,
  selectedSemesterId,
  isLoading,
  onSemesterChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="semester-select">Semestre</Label>
      <Select
        value={selectedSemesterId || "null"}
        onValueChange={onSemesterChange}
        disabled={isLoading || semesters.length === 0}
      >
        <SelectTrigger id="semester-select">
          <SelectValue placeholder="Sélectionnez un semestre" />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((sem) => (
            <SelectItem key={sem.id} value={sem.id}>
              {sem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};